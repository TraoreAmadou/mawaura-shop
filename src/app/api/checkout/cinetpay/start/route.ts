import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

const CINETPAY_ENDPOINT = "https://api-checkout.cinetpay.com/v2/payment";

function toXofIntegerFromCents(totalCents: number) {
  // tu gardes ta logique /100 en interne → CinetPay veut un entier XOF
  const amountXof = Math.round(totalCents / 100);
  return amountXof;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const apikey = process.env.CINETPAY_APIKEY;
  const site_id = process.env.CINETPAY_SITE_ID;
  const appUrl = process.env.APP_URL;

  if (!apikey || !site_id || !appUrl) {
    return NextResponse.json(
      { error: "CinetPay n'est pas configuré (env manquante)." },
      { status: 500 }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 });
  }

  const rawItems = body.items || body.cartItems || body.lines || [];
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return NextResponse.json({ error: "Panier vide." }, { status: 400 });
  }

  const parsedItems = rawItems.map((it: any) => ({
    productId: it.productId ?? it.id ?? it.product?.id,
    quantity: typeof it.quantity === "number" ? it.quantity : Number(it.quantity ?? 0),
  }));

  if (parsedItems.some((it: any) => !it.productId || !it.quantity || it.quantity <= 0)) {
    return NextResponse.json({ error: "Articles invalides." }, { status: 400 });
  }

  // 1) Recalcul serveur des montants + contrôle stock
  const productIds = parsedItems.map((it: any) => it.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  const productMap = new Map(products.map((p) => [p.id, p]));

  let totalCents = 0;
  const orderItemsData: any[] = [];

  for (const it of parsedItems) {
    const p = productMap.get(it.productId);
    if (!p || !p.isActive) {
      return NextResponse.json({ error: "Un produit n'est plus disponible." }, { status: 400 });
    }
    if (p.stock < it.quantity) {
      return NextResponse.json(
        { error: `Stock insuffisant pour "${p.name}".` },
        { status: 400 }
      );
    }

    const unitPriceCents = p.priceCents;
    const lineTotal = unitPriceCents * it.quantity;
    totalCents += lineTotal;

    orderItemsData.push({
      productId: p.id,
      quantity: it.quantity,
      unitPriceCents,
      totalPriceCents: lineTotal,
      productNameSnapshot: p.name,
      productSlugSnapshot: p.slug,
    });
  }

  const amountXof = toXofIntegerFromCents(totalCents);

  // CinetPay: montant doit être multiple de 5 :contentReference[oaicite:2]{index=2}
  if (amountXof <= 0 || amountXof % 5 !== 0) {
    return NextResponse.json(
      { error: "Montant invalide pour CinetPay (doit être un multiple de 5 XOF)." },
      { status: 400 }
    );
  }

  const email = session.user.email;
  const customerName = body.customerName || (session.user as any).name || null;

  const shippingAddress =
    typeof body.shippingAddress === "string" && body.shippingAddress.trim() ? body.shippingAddress.trim() : null;

  const notes =
    typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : null;

  // 2) Créer la commande en BDD (paiement PENDING)
  // + décrément stock (réservation)
  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        email,
        customerName,
        totalCents,
        status: "PENDING",
        shippingStatus: "PREPARATION",
        shippingAddress,
        notes,
        paymentProvider: "CINETPAY",
        paymentStatus: "PENDING",
        items: { create: orderItemsData },
      },
    });

    for (const item of orderItemsData) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    return created;
  });

  // 3) Init paiement CinetPay (Mobile Money uniquement)
  // transaction_id : évite les caractères spéciaux (on garde alphanum)
  const txId = `MAWAURA${order.id.replace(/[^a-zA-Z0-9]/g, "")}`;

  const initPayload = {
    apikey,
    site_id,
    transaction_id: txId,
    amount: amountXof,
    currency: "XOF",
    description: `Commande ${order.id}`,
    notify_url: `${appUrl}/api/payments/cinetpay/notify`,
    return_url: `${appUrl}/api/payments/cinetpay/return`,
    channels: "MOBILE_MONEY", // uniquement mobile money :contentReference[oaicite:3]{index=3}
    metadata: order.id,
    lang: "fr",
  };

  const res = await fetch(CINETPAY_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(initPayload),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok || !data?.data?.payment_url) {
    // rollback simple : annule la commande + recrédite stock
    await prisma.$transaction(async (tx) => {
      const existing = await tx.order.findUnique({ where: { id: order.id }, include: { items: true } });
      if (existing) {
        for (const item of existing.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
        await tx.order.update({
          where: { id: order.id },
          data: { status: "CANCELLED", paymentStatus: "FAILED" },
        });
      }
    });

    return NextResponse.json(
      { error: data?.description || data?.message || "Impossible d'initialiser le paiement." },
      { status: 500 }
    );
  }

  // stocker txId sur la commande
  await prisma.order.update({
    where: { id: order.id },
    data: { paymentTransactionId: txId },
  });

  return NextResponse.json(
    { orderId: order.id, paymentUrl: data.data.payment_url },
    { status: 200 }
  );
}
