import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/products → liste des produits actifs
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      include: {
        images: {
          orderBy: { position: "asc" },
        },
      },
    });

    const formatted = products.map((p) => {
      const mainImage =
        p.mainImageUrl || (p.images[0] ? p.images[0].url : null);

      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        description: p.description,
        category: p.category,
        price: p.priceCents / 100, // en euros
        isFeatured: p.isFeatured,
        isNew: p.isNew,
        isBestSeller: p.isBestSeller,
        tag: p.tag,
        mainImageUrl: mainImage,
        stock: p.stock,
        lowStockThreshold: p.lowStockThreshold,
        isActive: p.isActive,
      };
    });

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Erreur chargement produits:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des produits." },
      { status: 500 }
    );
  }
}
