import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { paydunyaConfirmInvoice } from "@/lib/paydunya";
import { sendEmail } from "@/lib/email";
import { orderConfirmationTemplate } from "@/lib/email-templates";

function mapPaydunyaStatus(s?: string) {
  const v = (s || "").toLowerCase();
  if (v === "completed") return "PAID";
  if (v === "cancelled") return "CANCELLED";
  if (v === "failed") return "FAILED";
  return "PENDING";
}

async function sendOrderConfirmationEmail(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) return;

  const tpl = orderConfirmationTemplate({
    orderId: order.id,
    customerName: order.customerName,
    email: order.email,
    totalCents: order.totalCents,
    items: order.items.map((it) => ({
      productNameSnapshot: it.productNameSnapshot,
      quantity: it.quantity,
      unitPriceCents: it.unitPriceCents,
      totalPriceCents: it.totalPriceCents,
    })),
    shippingAddress: (order as any).shippingAddress ?? null,
    notes: (order as any).notes ?? null,
  });

  await sendEmail({
    to: order.email,
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
  });
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") || "";
  const orderId = req.nextUrl.searchParams.get("orderId");

  if (!token) {
    return NextResponse.json({ error: "Token manquant." }, { status: 400 });
  }

  try {
    const data = await paydunyaConfirmInvoice(token);
    const paymentStatus = mapPaydunyaStatus(data?.status);

    // On retrouve la commande soit par orderId, soit par token PayDunya
    const order = await prisma.order.findFirst({
      where: orderId ? { id: orderId } : { paymentProviderId: token },
      include: { items: true },
    });

    // ✅ Pour éviter les doublons d'emails :
    // on n'envoie l'email QUE si on passe vers PAID alors qu'avant ce n'était pas PAID
    const wasPaid = order?.paymentStatus === "PAID";

    if (order) {
      if (paymentStatus === "PAID") {
        // si paiement confirmé -> PAID + CONFIRMED
        await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: "PAID",
            paidAt: new Date(),
            status: order.status === "CANCELLED" ? "CANCELLED" : "CONFIRMED",
          },
        });

        // ✅ Email confirmation (une seule fois)
        if (!wasPaid && order.status !== "CANCELLED") {
          try {
            await sendOrderConfirmationEmail(order.id);
          } catch (e) {
            console.error("❌ Email confirmation failed:", e);
            // on ne casse pas la réponse API
          }
        }
      } else if (paymentStatus === "CANCELLED" || paymentStatus === "FAILED") {
        // option: annuler et recréditer stock si toujours en préparation
        if (
          order.shippingStatus === "PREPARATION" &&
          order.status !== "CANCELLED"
        ) {
          await prisma.$transaction(async (tx) => {
            for (const item of order.items) {
              await tx.product.update({
                where: { id: item.productId },
                data: { stock: { increment: item.quantity } },
              });
            }
            await tx.order.update({
              where: { id: order.id },
              data: { paymentStatus, status: "CANCELLED" },
            });
          });
        } else {
          await prisma.order.update({
            where: { id: order.id },
            data: { paymentStatus },
          });
        }
      } else {
        await prisma.order.update({
          where: { id: order.id },
          data: { paymentStatus: "PENDING" },
        });
      }
    }

    return NextResponse.json(
      {
        ok: true,
        paydunyaStatus: data?.status,
        paymentStatus,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("PayDunya confirm error:", err);
    return NextResponse.json(
      { error: "Impossible de confirmer le paiement." },
      { status: 500 }
    );
  }
}
