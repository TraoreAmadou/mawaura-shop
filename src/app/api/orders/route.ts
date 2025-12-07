import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";

type OrderItemInput = {
  productId: string;
  quantity: number;
};

type CheckoutBody = {
  items: OrderItemInput[];
  customer?: {
    name?: string | null;
    email?: string | null;
    notes?: string | null;
    shippingAddress?: string | null;
  };
};

// POST /api/orders → création d'une commande
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    const userId = token?.sub ?? null;

    const body = (await req.json()) as CheckoutBody;

    if (!body || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: "Votre panier est vide." },
        { status: 400 }
      );
    }

    const normalizedItems = body.items
      .map((item) => ({
        productId: String(item.productId),
        quantity: Number(item.quantity),
      }))
      .filter((item) => item.productId && item.quantity > 0);

    if (normalizedItems.length === 0) {
      return NextResponse.json(
        { error: "Aucun article valide dans le panier." },
        { status: 400 }
      );
    }

    const productIds = [...new Set(normalizedItems.map((i) => i.productId))];

    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        isActive: true,
      },
    });

    if (products.length === 0) {
      return NextResponse.json(
        { error: "Les produits de votre panier ne sont plus disponibles." },
        { status: 400 }
      );
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    let totalCents = 0;

    const orderItemsData = normalizedItems.map((item) => {
      const product = productMap.get(item.productId);

      if (!product) {
        throw new Error(
          "Un des produits de votre panier n'est plus disponible."
        );
      }

      if (product.stock < item.quantity) {
        throw new Error(
          `Stock insuffisant pour le produit "${product.name}".`
        );
      }

      const lineTotal = product.priceCents * item.quantity;
      totalCents += lineTotal;

      return {
        productId: product.id,
        quantity: item.quantity,
        unitPriceCents: product.priceCents,
        totalPriceCents: lineTotal,
        productNameSnapshot: product.name,
        productSlugSnapshot: product.slug,
      };
    });

    const emailFromSession = (token as any)?.email as string | undefined;
    const emailFromBody = body.customer?.email ?? undefined;
    const email = emailFromSession ?? emailFromBody;

    if (!email) {
      return NextResponse.json(
        {
          error:
            "Une adresse email est requise pour valider la commande (pour l'envoi de la confirmation).",
        },
        { status: 400 }
      );
    }

    const customerName =
      body.customer?.name ??
      ((token as any)?.name as string | undefined) ??
      null;

    const shippingAddress = body.customer?.shippingAddress ?? null;
    const notes = body.customer?.notes ?? null;

    const order = await prisma.$transaction(async (tx) => {
      // Mise à jour des stocks (avec protection concurrente)
      for (const item of normalizedItems) {
        const product = productMap.get(item.productId)!;

        const result = await tx.product.updateMany({
          where: {
            id: product.id,
            stock: { gte: item.quantity },
            isActive: true,
          },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });

        if (result.count === 0) {
          throw new Error(
            `Le stock du produit "${product.name}" a changé, veuillez actualiser votre panier.`
          );
        }
      }

      // Création de la commande + lignes
      const created = await tx.order.create({
        data: {
          userId,
          email,
          customerName,
          totalCents,
          status: "PENDING",
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

      return created;
    });

    return NextResponse.json(
      {
        id: order.id,
        status: order.status,
        totalCents: order.totalCents,
        createdAt: order.createdAt,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Erreur création commande:", error);

    const message =
      typeof error?.message === "string" && error.message.length < 200
        ? error.message
        : "Une erreur est survenue lors de la création de la commande.";

    // Souvent ce sera des erreurs de stock ou de produit indisponible → 400
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// GET /api/orders → commandes de l'utilisateur connecté
export async function GET(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token || !token.sub) {
    return NextResponse.json(
      {
        error:
          "Vous devez être connecté pour consulter vos commandes.",
      },
      { status: 401 }
    );
  }

  const userId = token.sub;

  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      items: true,
    },
  });

  const formatted = orders.map((order) => ({
    id: order.id,
    createdAt: order.createdAt,
    status: order.status,
    totalCents: order.totalCents,
    email: order.email,
    customerName: order.customerName,
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      totalPriceCents: item.totalPriceCents,
      productNameSnapshot: item.productNameSnapshot,
      productSlugSnapshot: item.productSlugSnapshot,
    })),
  }));

  return NextResponse.json(formatted);
}
