// src/app/api/products/[slug]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> } // 👈 params est une Promise
) {
  // ✅ on attend params avant de l'utiliser
  const { slug } = await params;

  try {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        // ⚠️ seulement si tu as bien ajouté le modèle ProductImage + relation dans schema.prisma
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
      imageUrl: product.mainImageUrl,
      images: product.images.map((img) => ({
        id: img.id,
        url: img.url,
        position: img.position,
      })),
    };

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Erreur chargement produit:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement du produit." },
      { status: 500 }
    );
  }
}
