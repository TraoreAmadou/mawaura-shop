import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { promises as fs } from "fs";
import path from "path";

async function requireAdmin(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token || (token as any).role !== "ADMIN") {
    return null;
  }
  return token;
}

// GET /api/admin/products/:id → détail produit + images
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const token = await requireAdmin(req);
  if (!token) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { id } = await context.params;

  if (!id) {
    return NextResponse.json(
      { error: "Identifiant produit manquant." },
      { status: 400 }
    );
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id },
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

    return NextResponse.json(product);
  } catch (error) {
    console.error("Erreur chargement produit (admin GET):", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement du produit." },
      { status: 500 }
    );
  }
}

// PUT /api/admin/products/:id → mise à jour produit + images
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const token = await requireAdmin(req);
  if (!token) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { id } = await context.params;

  if (!id) {
    return NextResponse.json(
      { error: "Identifiant produit manquant." },
      { status: 400 }
    );
  }

  try {
    const existing = await prisma.product.findUnique({
      where: { id },
      include: {
        images: {
          orderBy: { position: "asc" },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Produit introuvable." },
        { status: 404 }
      );
    }

    const formData = await req.formData();

    const name = formData.get("name")?.toString().trim();
    const priceStr = formData.get("price")?.toString();
    const category = formData.get("category")?.toString().trim() || "";
    const description =
      formData.get("description")?.toString().trim() || "";
    const tag = formData.get("tag")?.toString().trim() || "";

    const stockStr = formData.get("stock")?.toString() ?? "0";
    const lowStockThresholdStr =
      formData.get("lowStockThreshold")?.toString() ?? "0";

    const isFeatured = formData.get("isFeatured") === "true";
    const isNew = formData.get("isNew") === "true";
    const isBestSeller = formData.get("isBestSeller") === "true";
    const isActive = formData.get("isActive") === "true";

    if (!name || !priceStr) {
      return NextResponse.json(
        { error: "Nom et prix sont obligatoires." },
        { status: 400 }
      );
    }

    const priceNumber = Number(priceStr);
    if (Number.isNaN(priceNumber) || priceNumber <= 0) {
      return NextResponse.json(
        { error: "Le prix doit être un nombre positif." },
        { status: 400 }
      );
    }
    const priceCents = Math.round(priceNumber * 100);

    const stock = Number.parseInt(stockStr, 10);
    const lowStockThreshold = Number.parseInt(
      lowStockThresholdStr,
      10
    );

    // Nouveau slug basé sur le nom
    const slug = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    // Gestion des images (remplacement partiel)
    const uploadDir = path.join(process.cwd(), "public", "uploads", "products");
    await fs.mkdir(uploadDir, { recursive: true });

    let newMainImageUrl: string | null = existing.mainImageUrl ?? null;

    for (let position = 0; position < 5; position++) {
      const fieldName = `image${position}`;
      const file = formData.get(fieldName) as File | null;

      if (!file || !(file instanceof File) || file.size === 0) {
        continue; // aucune nouvelle image pour cette position
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const safeName = file.name.replace(/\s+/g, "-");
      const fileName = `${Date.now()}-${position}-${Math.round(
        Math.random() * 1_000_000
      )}-${safeName}`;
      const filePath = path.join(uploadDir, fileName);
      await fs.writeFile(filePath, buffer);

      const relativeUrl = `/uploads/products/${fileName}`;

      const existingImage = existing.images.find(
        (img) => img.position === position
      );

      if (existingImage) {
        await prisma.productImage.update({
          where: { id: existingImage.id },
          data: { url: relativeUrl },
        });
      } else {
        await prisma.productImage.create({
          data: {
            productId: id,
            url: relativeUrl,
            position,
          },
        });
      }

      if (position === 0) {
        newMainImageUrl = relativeUrl;
      }
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name,
        slug,
        description: description || null,
        priceCents,
        category: category || null,
        isFeatured,
        isNew,
        isBestSeller,
        isActive,
        tag: tag || null,
        stock: Number.isNaN(stock) ? 0 : stock,
        lowStockThreshold: Number.isNaN(lowStockThreshold)
          ? 0
          : lowStockThreshold,
        mainImageUrl: newMainImageUrl,
      },
      include: {
        images: {
          orderBy: { position: "asc" },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erreur mise à jour produit:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du produit." },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/products/:id
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const token = await requireAdmin(req);
  if (!token) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { id } = await context.params;

  if (!id) {
    return NextResponse.json(
      { error: "Identifiant produit manquant." },
      { status: 400 }
    );
  }

  try {
    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur suppression produit:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du produit." },
      { status: 500 }
    );
  }
}
