import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (!session || role !== "ADMIN") {
    return null;
  }
  return session;
}

// GET /api/admin/products → liste des produits
export async function GET() {
  const session = await requireAdmin();
  // const session = "ADMIN"; // Pour tests locaux
  if (!session) {
    return NextResponse.json({ error: "Non autorisé " }, { status: 403 });
  }
  //else if ((session?.user as any)?.role !== "ADMIN") {
    //return NextResponse.json({ error: "Accès réservé aux administrateurs." }, { status: 403 });
  //}

  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(products);
}

// POST /api/admin/products → créer un produit
export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  //const session = "ADMIN"; // Pour tests locaux

  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, price, category, description, isFeatured } = body;

    if (!name || !price) {
      return NextResponse.json(
        { error: "Nom et prix sont obligatoires." },
        { status: 400 }
      );
    }

    const priceNumber = Number(price);
    if (Number.isNaN(priceNumber) || priceNumber <= 0) {
      return NextResponse.json(
        { error: "Le prix doit être un nombre positif." },
        { status: 400 }
      );
    }

    const priceCents = Math.round(priceNumber * 100);

    const slug = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description: description || null,
        priceCents,
        category: category || null,
        isFeatured: Boolean(isFeatured),
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Erreur création produit:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du produit." },
      { status: 500 }
    );
  }
}
