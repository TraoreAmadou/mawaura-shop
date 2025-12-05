import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/products → liste des produits actifs
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    // On normalise un peu pour le front
    const formatted = products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      category: p.category,
      price: p.priceCents / 100, // en euros
      isFeatured: p.isFeatured,
      imageUrl: p.mainImageUrl || null, // ✅ image principale
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Erreur chargement produits:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des produits." },
      { status: 500 }
    );
  }
}



/* // Version avec les images associées 


import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
      },
      orderBy: { createdAt: "desc" },
      include: {
        images: {
          orderBy: { position: "asc" },
        },
      },
    });

    // ✅ on adapte la forme pour le front
    const formatted = products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      category: p.category,
      price: p.priceCents / 100, // ← nombre en euros
      isFeatured: p.isFeatured,
      images: p.images,
    }));

    return NextResponse.json(formatted);
  } catch (err) {
    console.error("Erreur GET /api/products :", err);
    return NextResponse.json(
      { error: "Erreur lors du chargement des produits." },
      { status: 500 }
    );
  }
}
*/