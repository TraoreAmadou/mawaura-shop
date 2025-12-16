import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sha512MasterKey } from "@/lib/paydunya";

function mapPaydunyaStatus(s?: string) {
  const v = (s || "").toLowerCase();
  if (v === "completed") return "PAID";
  if (v === "cancelled") return "CANCELLED";
  if (v === "failed") return "FAILED";
  return "PENDING";
}

export async function POST(req: NextRequest) {
  try {
    const raw = await req.text();
    const params = new URLSearchParams(raw);

    // PayDunya POST en form-urlencoded, avec des clés type data[...]
    const hash =
      params.get("data[hash]") || params.get("hash") || "";
    const status =
      params.get("data[status]") || params.get("status") || "";
    const token =
      params.get("data[invoice][token]") ||
      params.get("invoice[token]") ||
      params.get("token") ||
      "";

    const orderId =
      params.get("data[custom_data][orderId]") ||
      params.get("custom_data[orderId]") ||
      "";

    if (!token) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // Vérification hash (SHA-512 de la MasterKey)
    const masterKey = process.env.PAYDUNYA_MASTER_KEY || "";
    if (masterKey) {
      const expected = sha512MasterKey(masterKey);
      if (!hash || hash.toLowerCase() !== expected.toLowerCase()) {
        return NextResponse.json({ error: "Invalid hash" }, { status: 403 });
      }
    }

    const paymentStatus = mapPaydunyaStatus(status);

    const order = await prisma.order.findFirst({
      where: orderId ? { id: orderId } : { paymentProviderId: token },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    if (paymentStatus === "PAID") {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "PAID",
          paidAt: new Date(),
          status: order.status === "CANCELLED" ? "CANCELLED" : "CONFIRMED",
        },
      });
    } else if (paymentStatus === "CANCELLED" || paymentStatus === "FAILED") {
      // annuler + recréditer stock si pas expédié
      if (order.shippingStatus === "PREPARATION" && order.status !== "CANCELLED") {
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

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("PayDunya IPN error:", err);
    return NextResponse.json({ ok: true }, { status: 200 });
  }
}
