import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params =
  | { params: { slug: string } }
  | { params: Promise<{ slug: string }> };

// GET /api/products/[slug]
export async function GET(
  _req: NextRequest,
  context: Params
) {
  // ✅ compat Next 15 : params peut être un Promise
  const { slug } = await Promise.resolve(
    (context as any).params
  );

  try {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        images: {
          orderBy: { position: "asc" },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Produit introuvable." },
        { status: 404 }
      );
    }

    const formatted = {
      id: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.priceCents / 100,
      isFeatured: product.isFeatured,
      isNew: product.isNew,
      isBestSeller: product.isBestSeller,
      tag: product.tag,
      mainImageUrl: product.mainImageUrl,
      stock: product.stock,
      lowStockThreshold: product.lowStockThreshold,
      isActive: product.isActive,
      images: product.images.map((img) => ({
        id: img.id,
        url: img.url,
        position: img.position,
      })),
    };

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Erreur chargement produit détail:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement du produit." },
      { status: 500 }
    );
  }
}
