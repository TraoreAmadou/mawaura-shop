import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/favorites → favoris de l'utilisateur
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json([], { status: 200 });
  }

  const favorites = await prisma.favorite.findMany({
    where: { userId: user.id },
    include: { product: true },
  });

  const formatted = favorites.map((fav) => ({
    productId: fav.productId,
    slug: fav.product.slug,
    name: fav.product.name,
    priceCents: fav.product.priceCents,
    category: fav.product.category,
    mainImageUrl: fav.product.mainImageUrl,
  }));

  return NextResponse.json(formatted, { status: 200 });
}

// POST /api/favorites → remplace la liste des favoris de l'utilisateur
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);

  // ✅ Force le type à string[]
  const productIds: string[] = Array.isArray(body?.productIds)
    ? (body.productIds as unknown[])
        .filter((id): id is string => typeof id === "string")
        .map((id) => id.trim())
        .filter(Boolean)
    : [];

  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { email: session.user!.email! },
        select: { id: true },
      });

      if (!user) {
        throw new Error("USER_NOT_FOUND");
      }

      // ✅ uniqueIds est bien string[]
      const uniqueIds: string[] = Array.from(new Set<string>(productIds));

      // On supprime tous les favoris puis on recrée
      await tx.favorite.deleteMany({
        where: { userId: user.id },
      });

      if (uniqueIds.length > 0) {
        await tx.favorite.createMany({
          data: uniqueIds.map((productId) => ({
            userId: user.id,
            productId, // ✅ string
          })),
        });
      }
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error: any) {
    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 400 });
    }

    console.error("Erreur POST /api/favorites:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour des favoris." },
      { status: 500 }
    );
  }
}
