import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/cart → panier de l'utilisateur connecté
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json(
      { error: "Non autorisé" },
      { status: 401 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json([], { status: 200 });
  }

  const items = await prisma.cartItem.findMany({
    where: { userId: user.id },
    include: {
      product: true,
    },
  });

  const formatted = items.map((ci) => ({
    productId: ci.productId,
    quantity: ci.quantity,
    name: ci.product.name,
    slug: ci.product.slug,
    priceCents: ci.product.priceCents,
    mainImageUrl: ci.product.mainImageUrl,
  }));

  return NextResponse.json(formatted, { status: 200 });
}

// POST /api/cart → remplace le panier de l'utilisateur
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json(
      { error: "Non autorisé" },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => null);
  const items = body?.items;

  if (!Array.isArray(items)) {
    return NextResponse.json(
      { error: "Format invalide (items doit être un tableau)." },
      { status: 400 }
    );
  }

  const cleaned = items
    .map((it: any) => ({
      productId: String(it.productId),
      quantity: Number(it.quantity),
    }))
    .filter((it) => it.productId && it.quantity > 0);

  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { email: session.user!.email! },
        select: { id: true },
      });

      if (!user) {
        throw new Error("USER_NOT_FOUND");
      }

      // On supprime tout le panier puis on recrée
      await tx.cartItem.deleteMany({
        where: { userId: user.id },
      });

      if (cleaned.length > 0) {
        await tx.cartItem.createMany({
          data: cleaned.map((it) => ({
            userId: user.id,
            productId: it.productId,
            quantity: it.quantity,
          })),
        });
      }
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error: any) {
    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      return NextResponse.json(
        { error: "Utilisateur introuvable." },
        { status: 400 }
      );
    }

    console.error("Erreur POST /api/cart:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du panier." },
      { status: 500 }
    );
  }
}
