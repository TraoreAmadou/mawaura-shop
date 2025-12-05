import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export const runtime = "nodejs"; // ✅ pour pouvoir utiliser fs

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

// POST /api/admin/products → créer un produit (avec upload images)
export async function POST(req: NextRequest) {
  const token = await requireAdmin(req);
  if (!token) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  try {
    const formData = await req.formData();

    const name = String(formData.get("name") || "").trim();
    const priceRaw = String(formData.get("price") || "").trim();
    const category = String(formData.get("category") || "").trim() || null;
    const description =
      String(formData.get("description") || "").trim() || null;

    const isFeaturedRaw = formData.get("isFeatured");
    const isFeatured =
      isFeaturedRaw === "on" || isFeaturedRaw === "true" || isFeaturedRaw === "1";

    if (!name || !priceRaw) {
      return NextResponse.json(
        { error: "Nom et prix sont obligatoires." },
        { status: 400 }
      );
    }

    const priceNumber = Number(priceRaw);
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

    // ✅ gestion des fichiers images
    const files = formData.getAll("images") as File[];

    // on limite à 5 fichiers max
    const selectedFiles = files.slice(0, 5);

    const uploadDir = path.join(process.cwd(), "public", "uploads", "products");
    await fs.mkdir(uploadDir, { recursive: true });

    const savedImageUrls: string[] = [];

    for (const file of selectedFiles) {
      if (!file || typeof file.arrayBuffer !== "function") continue;

      const buffer = Buffer.from(await file.arrayBuffer());
      const ext = path.extname(file.name) || ".jpg";

      const randomName = crypto.randomBytes(16).toString("hex");
      const fileName = `${Date.now()}-${randomName}${ext}`;

      const filePath = path.join(uploadDir, fileName);
      await fs.writeFile(filePath, buffer);

      // chemin relatif pour Next/Image et le front
      const relativeUrl = `/uploads/products/${fileName}`;
      savedImageUrls.push(relativeUrl);
    }

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description,
        priceCents,
        category,
        isFeatured,
        mainImageUrl: savedImageUrls[0] || null,
        images:
          savedImageUrls.length > 0
            ? {
                create: savedImageUrls.map((url, index) => ({
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
