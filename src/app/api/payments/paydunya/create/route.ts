import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { paydunyaCreateInvoice } from "@/lib/paydunya";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
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

  const parsedItems = rawItems
    .map((it: any) => ({
      productId: String(it.productId ?? it.id ?? it.product?.id ?? ""),
      quantity: Number(it.quantity ?? 0),
    }))
    .filter((it: any) => it.productId && it.quantity > 0);

  if (parsedItems.length === 0) {
    return NextResponse.json({ error: "Articles invalides." }, { status: 400 });
  }

  const productIds = parsedItems.map((it: any) => it.productId);

  const siteUrl = process.env.NEXTAUTH_URL || req.nextUrl.origin;

  let createdOrderId: string | null = null;

  try {
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    let totalCents = 0;
    const orderItemsData: any[] = [];

    for (const item of parsedItems) {
      const product = productMap.get(item.productId);
      if (!product || !product.isActive) {
        return NextResponse.json(
          { error: "Un des produits n'est plus disponible." },
          { status: 400 }
        );
      }
      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Stock insuffisant pour "${product.name}".` },
          { status: 400 }
        );
      }

      const unitPriceCents = product.priceCents;
      const lineTotal = unitPriceCents * item.quantity;
      totalCents += lineTotal;

      orderItemsData.push({
        productId: product.id,
        quantity: item.quantity,
        unitPriceCents,
        totalPriceCents: lineTotal,
        productNameSnapshot: product.name,
        productSlugSnapshot: product.slug,
      });
    }

    if (totalCents <= 0) {
      return NextResponse.json({ error: "Montant invalide." }, { status: 400 });
    }

    // ✅ Montant PayDunya en XOF entier (on garde ta logique /100 en BDD)
    const amountXof = Math.round(totalCents / 100);

    const customerName = body.customerName || (session.user as any).name || null;
    const shippingAddress =
      typeof body.shippingAddress === "string" && body.shippingAddress.trim()
        ? body.shippingAddress.trim()
        : null;
    const notes =
      typeof body.notes === "string" && body.notes.trim()
        ? body.notes.trim()
        : null;

    // 1) Créer l'order + décrémenter le stock (comme ton /api/orders)
    const createdOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          email: session.user!.email!,
          customerName,
          totalCents,
          status: "PENDING",
          shippingStatus: "PREPARATION",
          paymentStatus: "PENDING",
          paymentProvider: "PAYDUNYA",
          shippingAddress,
          notes,
          items: { create: orderItemsData },
        },
      });

      for (const it of orderItemsData) {
        await tx.product.update({
          where: { id: it.productId },
          data: { stock: { decrement: it.quantity } },
        });
      }

      return order;
    });

    createdOrderId = createdOrder.id;

    // 2) Créer la facture PayDunya
    const storeName = process.env.PAYDUNYA_STORE_NAME || "Mawaura";

    const payload = {
      invoice: {
        total_amount: amountXof,
        description: `Paiement de ${amountXof} FCFA pour votre commande Mawaura`,
        customer: {
          name: customerName || "Client Mawaura",
          email: session.user!.email!,
          phone: "", // tu peux ajouter un champ phone plus tard
        },
        // ✅ Mobile Money CI uniquement (on ajoutera "card" plus tard)
        channels: ["orange-money-ci", "mtn-ci", "moov-ci", "wave-ci"],
        items: orderItemsData.reduce((acc, it, idx) => {
          const unitXof = Math.round(it.unitPriceCents / 100);
          const totalXof = Math.round(it.totalPriceCents / 100);
          acc[`item_${idx}`] = {
            name: it.productNameSnapshot,
            quantity: it.quantity,
            unit_price: String(unitXof),
            total_price: String(totalXof),
            description: "",
          };
          return acc;
        }, {} as any),
      },
      store: {
        name: storeName,
        website_url: process.env.PAYDUNYA_STORE_WEBSITE || siteUrl,
        phone: process.env.PAYDUNYA_STORE_PHONE || "",
      },
      custom_data: {
        orderId: createdOrder.id,
      },
      actions: {
        cancel_url: `${siteUrl}/checkout/cancel?orderId=${createdOrder.id}`,
        return_url: `${siteUrl}/checkout/success?orderId=${createdOrder.id}`,
        callback_url: `${siteUrl}/api/payments/paydunya/ipn`,
      },
    };

    const { paymentUrl, token } = await paydunyaCreateInvoice(payload);

    // 3) Sauver le token + l'URL
    await prisma.order.update({
      where: { id: createdOrder.id },
      data: {
        paymentProviderId: token,
        paymentCheckoutUrl: paymentUrl,
      },
    });

    return NextResponse.json(
      { orderId: createdOrder.id, paymentUrl, token },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("PayDunya create error:", err);

    // rollback stock + order si on a déjà créé l'order
    if (createdOrderId) {
      try {
        await prisma.$transaction(async (tx) => {
          const order = await tx.order.findUnique({
            where: { id: createdOrderId! },
            include: { items: true },
          });
          if (order) {
            for (const item of order.items) {
              await tx.product.update({
                where: { id: item.productId },
                data: { stock: { increment: item.quantity } },
              });
            }
            await tx.orderItem.deleteMany({ where: { orderId: order.id } });
            await tx.order.delete({ where: { id: order.id } });
          }
        });
      } catch (rollbackErr) {
        console.error("Rollback error:", rollbackErr);
      }
    }

    const msg =
      err?.message === "PAYDUNYA_KEYS_MISSING"
        ? "Clés PayDunya manquantes dans .env"
        : "Erreur lors de l'initialisation du paiement.";

    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
