import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { paydunyaConfirmInvoice } from "@/lib/paydunya";
import {
  sendOrderPaidConfirmationEmail,
  sendAdminNewPaidOrderEmail,
} from "@/lib/notifications";

export const runtime = "nodejs";

function mapPaydunyaStatus(s?: string) {
  const v = (s || "").toLowerCase();
  if (v === "completed") return "PAID";
  if (v === "cancelled") return "CANCELLED";
  if (v === "failed") return "FAILED";
  return "PENDING";
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

    let shouldSendPaidEmail = false;
    let orderForEmail:
      | (typeof order & {
          shippingAddress?: string | null;
          notes?: string | null;
        })
      | null = null;

    if (order) {
      const previousPaymentStatus =
        ((order as any).paymentStatus as string | null) ?? "PENDING";
      const previousPaidAt = (order as any).paidAt as Date | null;

      // si paiement confirmé -> PAID + CONFIRMED
      if (paymentStatus === "PAID") {
        // ✅ Emails seulement si on n’était pas déjà PAID (idempotent)
        const wasAlreadyPaid =
          previousPaymentStatus === "PAID" || !!previousPaidAt;

        const updated = await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: "PAID",
            paidAt: previousPaidAt ?? new Date(),
            status: order.status === "CANCELLED" ? "CANCELLED" : "CONFIRMED",
          },
          include: { items: true },
        });

        shouldSendPaidEmail = !wasAlreadyPaid;
        orderForEmail = updated as any;
      } else if (paymentStatus === "CANCELLED" || paymentStatus === "FAILED") {
        // option: annuler et recréditer stock si toujours en préparation
        const shippingStatus =
          (((order as any).shippingStatus as string | null) ?? "PREPARATION") as
            | "PREPARATION"
            | "SHIPPED"
            | "DELIVERED"
            | "RECEIVED";

        if (shippingStatus === "PREPARATION" && order.status !== "CANCELLED") {
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

    // ✉️ Emails (après la mise à jour BDD)
    if (shouldSendPaidEmail && orderForEmail) {
      // 1) Client : confirmation de commande payée
      try {
        await sendOrderPaidConfirmationEmail({
          to: orderForEmail.email,
          orderId: orderForEmail.id,
          customerName: orderForEmail.customerName,
          totalCents: orderForEmail.totalCents,
          items: orderForEmail.items.map((it: any) => ({
            productNameSnapshot: it.productNameSnapshot,
            quantity: it.quantity,
            unitPriceCents: it.unitPriceCents,
            totalPriceCents: it.totalPriceCents,
          })),
          shippingAddress: (orderForEmail as any).shippingAddress ?? null,
        });
      } catch (e) {
        console.error("Email confirmation commande (Resend) échoué:", e);
      }

      // 2) Admin interne : nouvelle commande payée
      try {
        await sendAdminNewPaidOrderEmail({
          orderId: orderForEmail.id,
          customerEmail: orderForEmail.email,
          customerName: orderForEmail.customerName,
          totalCents: orderForEmail.totalCents,
          items: orderForEmail.items.map((it: any) => ({
            productNameSnapshot: it.productNameSnapshot,
            quantity: it.quantity,
            unitPriceCents: it.unitPriceCents,
            totalPriceCents: it.totalPriceCents,
          })),
          shippingAddress: (orderForEmail as any).shippingAddress ?? null,
          notes: (orderForEmail as any).notes ?? null,
        });
      } catch (e) {
        console.error("Email admin nouvelle commande payée (Resend) échoué:", e);
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
