import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const CHECK_ENDPOINT = "https://api-checkout.cinetpay.com/v2/payment/check";

function safeEq(a: string, b: string) {
  const ba = Buffer.from(a || "");
  const bb = Buffer.from(b || "");
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

function computeHmacFromNotify(form: Record<string, string>, secretKey: string) {
  // ordre exact décrit par CinetPay :contentReference[oaicite:7]{index=7}
  const data =
    (form.cpm_site_id || "") +
    (form.cpm_trans_id || "") +
    (form.cpm_trans_date || "") +
    (form.cpm_amount || "") +
    (form.cpm_currency || "") +
    (form.signature || "") +
    (form.payment_method || "") +
    (form.cel_phone_num || "") +
    (form.cpm_phone_prefixe || "") +
    (form.cpm_language || "") +
    (form.cpm_version || "") +
    (form.cpm_payment_config || "") +
    (form.cpm_page_action || "") +
    (form.cpm_custom || "") +
    (form.cpm_designation || "") +
    (form.cpm_error_message || "");

  return crypto.createHmac("sha256", secretKey).update(data).digest("hex");
}

// CinetPay ping aussi en GET (sans data) : il faut répondre 200 :contentReference[oaicite:8]{index=8}
export async function GET() {
  return NextResponse.json({ ok: true }, { status: 200 });
}

export async function POST(req: NextRequest) {
  const secretKey = process.env.CINETPAY_SECRET_KEY;
  const apikey = process.env.CINETPAY_APIKEY;
  const site_id = process.env.CINETPAY_SITE_ID;

  if (!secretKey || !apikey || !site_id) {
    return NextResponse.json({ error: "Config manquante." }, { status: 500 });
  }

  const receivedToken = req.headers.get("x-token") || "";

  const formData = await req.formData();
  const form: Record<string, string> = {};
  for (const [k, v] of formData.entries()) form[k] = String(v);

  // Vérif HMAC x-token :contentReference[oaicite:9]{index=9}
  const generated = computeHmacFromNotify(form, secretKey);
  if (!receivedToken || !safeEq(receivedToken, generated)) {
    return NextResponse.json({ error: "Token invalide" }, { status: 403 });
  }

  const txId = form.cpm_trans_id;
  if (!txId) return NextResponse.json({ ok: true }, { status: 200 });

  // Toujours re-vérifier le statut via /payment/check (CinetPay ne fait pas confiance au POST) :contentReference[oaicite:10]{index=10}
  const checkRes = await fetch(CHECK_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apikey, site_id, transaction_id: txId }),
  });

  const check = await checkRes.json().catch(() => null);
  const status = check?.data?.status; // ACCEPTED / REFUSED / WAITING_FOR_CUSTOMER :contentReference[oaicite:11]{index=11}
  const paymentMethod = check?.data?.payment_method || null;

  // retrouver la commande
  const order = await prisma.order.findFirst({
    where: { paymentTransactionId: txId },
    include: { items: true },
  });

  if (!order) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  // Si en attente de validation opérateur, ne pas marquer en échec :contentReference[oaicite:12]{index=12}
  if (status === "WAITING_FOR_CUSTOMER") {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  if (status === "ACCEPTED") {
    // idempotent
    if (order.paymentStatus !== "PAID") {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "PAID",
          paymentMethod,
          status: "CONFIRMED", // optionnel mais recommandé après paiement
        },
      });
    }
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  if (status === "REFUSED") {
    // si pas déjà annulée, on annule et on recrédite le stock
    if (order.status !== "CANCELLED") {
      await prisma.$transaction(async (tx) => {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
        await tx.order.update({
          where: { id: order.id },
          data: { status: "CANCELLED", paymentStatus: "FAILED", paymentMethod },
        });
      });
    }
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
