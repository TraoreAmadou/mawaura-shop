import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

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

// GET /api/admin/orders → liste toutes les commandes
export async function GET(req: NextRequest) {
  const token = await requireAdmin(req);
  if (!token) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        items: true,
      },
    });

    const formatted = orders.map((order) => ({
      id: order.id,
      createdAt: order.createdAt,
      status: order.status,
      shippingStatus: (order as any).shippingStatus ?? "PREPARATION",
      totalCents: order.totalCents,
      email: order.email,
      customerName: order.customerName,
      shippingAddress: (order as any).shippingAddress ?? null,
      notes: (order as any).notes ?? null,
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
        totalPriceCents: item.totalPriceCents,
        productNameSnapshot: item.productNameSnapshot,
        productSlugSnapshot: item.productSlugSnapshot,
      })),
    }));

    return NextResponse.json(formatted, { status: 200 });
  } catch (error) {
    console.error("Erreur liste commandes admin:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des commandes." },
      { status: 500 }
    );
  }
}
