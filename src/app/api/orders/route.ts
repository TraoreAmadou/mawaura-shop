import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

// Utilitaire pour formater une commande dans un format API "propre"
function formatOrder(order: any) {
  return {
    id: order.id,
    createdAt: order.createdAt,
    status: order.status,
    totalCents: order.totalCents,
    email: order.email,
    customerName: order.customerName,
    shippingAddress: (order as any).shippingAddress ?? null,
    notes: (order as any).notes ?? null,
    // 🔹 IMPORTANT : inclure le statut de suivi pour le client
    shippingStatus: (order as any).shippingStatus ?? "PREPARATION",
    items: order.items.map((item: any) => ({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      totalPriceCents: item.totalPriceCents,
      productNameSnapshot: item.productNameSnapshot,
      productSlugSnapshot: item.productSlugSnapshot,
    })),
  };
}

// GET /api/orders → liste des commandes de l'utilisateur connecté
export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json(
      { error: "Non autorisé" },
      { status: 401 }
    );
  }

  try {
    const email = session.user.email;

    const orders = await prisma.order.findMany({
      where: { email },
      orderBy: { createdAt: "desc" },
      include: {
        items: true,
      },
    });

    const payload = orders.map(formatOrder);

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    console.error("Erreur GET /api/orders:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des commandes." },
      { status: 500 }
    );
  }
}

// POST /api/orders → création d'une nouvelle commande à partir du panier
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json(
      { error: "Vous devez être connecté pour passer une commande." },
      { status: 401 }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Corps de requête invalide." },
      { status: 400 }
    );
  }

  // On essaie d'être permissif sur le nom du champ contenant les lignes du panier
  const rawItems =
    body.items ||
    body.cartItems ||
    body.lines ||
    [];

  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return NextResponse.json(
      { error: "Aucun article dans la commande." },
      { status: 400 }
    );
  }

  type IncomingItem = {
    productId?: string;
    id?: string;
    quantity?: number;
  };

  const parsedItems: IncomingItem[] = rawItems.map((it: any) => ({
    productId: it.productId ?? it.id ?? it.product?.id,
    quantity:
      typeof it.quantity === "number"
        ? it.quantity
        : Number(it.quantity ?? 0),
  }));

  if (
    parsedItems.some(
      (it) => !it.productId || !it.quantity || it.quantity <= 0
    )
  ) {
    return NextResponse.json(
      { error: "Articles de commande invalides." },
      { status: 400 }
    );
  }

  const productIds = parsedItems.map((it) => it.productId!) as string[];

  try {
    // On récupère les produits concernés
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Vérifications + préparation des lignes
    let totalCents = 0;
    const orderItemsData: any[] = [];

    for (const item of parsedItems) {
      const product = productMap.get(item.productId!);
      if (!product || !product.isActive) {
        return NextResponse.json(
          { error: "Un des produits n'est plus disponible." },
          { status: 400 }
        );
      }

      const quantity = item.quantity ?? 0;
      if (quantity <= 0) {
        return NextResponse.json(
          { error: "Quantité invalide pour un des articles." },
          { status: 400 }
        );
      }

      // Vérification du stock
      if (product.stock < quantity) {
        return NextResponse.json(
          {
            error: `Stock insuffisant pour le produit "${product.name}".`,
          },
          { status: 400 }
        );
      }

      const unitPriceCents = product.priceCents;
      const lineTotal = unitPriceCents * quantity;
      totalCents += lineTotal;

      orderItemsData.push({
        productId: product.id,
        quantity,
        unitPriceCents,
        totalPriceCents: lineTotal,
        productNameSnapshot: product.name,
        productSlugSnapshot: product.slug,
      });
    }

    if (totalCents <= 0) {
      return NextResponse.json(
        { error: "Montant de commande invalide." },
        { status: 400 }
      );
    }

    const email = session.user.email!;
    const customerName =
      body.customerName || (session.user as any).name || null;

    const shippingAddress =
      typeof body.shippingAddress === "string" &&
      body.shippingAddress.trim().length > 0
        ? body.shippingAddress.trim()
        : null;

    const notes =
      typeof body.notes === "string" && body.notes.trim().length > 0
        ? body.notes.trim()
        : null;

    // Création de la commande + décrémentation du stock dans une transaction
    const createdOrder = await prisma.$transaction(async (tx) => {
      // Création de la commande
      const order = await tx.order.create({
        data: {
          email,
          customerName,
          totalCents,
          status: "PENDING",
          // 🔹 On initialise bien le suivi à PREPARATION
          shippingStatus: "PREPARATION",
          shippingAddress,
          notes,
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: true,
        },
      });

      // Décrémentation du stock
      for (const item of orderItemsData) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      return order;
    });

    const payload = formatOrder(createdOrder);

    return NextResponse.json(payload, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/orders:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la commande." },
      { status: 500 }
    );
  }
}
