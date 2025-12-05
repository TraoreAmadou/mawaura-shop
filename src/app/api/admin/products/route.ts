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

// GET /api/admin/products → liste des produits
export async function GET(req: NextRequest) {
  const token = await requireAdmin(req);
  if (!token) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(products);
}

// POST /api/admin/products → créer un produit (FormData + images)
export async function POST(req: NextRequest) {
  const token = await requireAdmin(req);
  if (!token) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  try {
    const formData = await req.formData();

    const name = formData.get("name")?.toString().trim();
    const priceStr = formData.get("price")?.toString();
    const category = formData.get("category")?.toString().trim() || "";
    const description = formData.get("description")?.toString().trim() || "";
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
    const lowStockThreshold = Number.parseInt(lowStockThresholdStr, 10);

    // Génération du slug
    const slug = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    // Gestion des images (max 5)
    const images = formData.getAll("images") as File[];
    const validImages = images.filter(
      (f) => f instanceof File && (f as File).size > 0
    ) as File[];

    const uploadDir = path.join(process.cwd(), "public", "uploads", "products");
    await fs.mkdir(uploadDir, { recursive: true });

    const imageUrls: string[] = [];

    for (const [index, file] of validImages.slice(0, 5).entries()) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const safeName = file.name.replace(/\s+/g, "-");
      const fileName = `${Date.now()}-${index}-${Math.round(
        Math.random() * 1_000_000
      )}-${safeName}`;
      const filePath = path.join(uploadDir, fileName);

      await fs.writeFile(filePath, buffer);

      const relativeUrl = `/uploads/products/${fileName}`;
      imageUrls.push(relativeUrl);
    }

    const mainImageUrl = imageUrls[0] ?? null;

    const product = await prisma.product.create({
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
        mainImageUrl,
        images:
          imageUrls.length > 0
            ? {
                create: imageUrls.map((url, index) => ({
                  url,
                  position: index,
                })),
              }
            : undefined,
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
