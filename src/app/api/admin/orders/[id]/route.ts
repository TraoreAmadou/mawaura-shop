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

// GET /api/admin/orders/:id → détail commande
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
      { error: "Identifiant commande manquant." },
      { status: 400 }
    );
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Commande introuvable." },
        { status: 404 }
      );
    }

    const formatted = {
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
    };

    return NextResponse.json(formatted, { status: 200 });
  } catch (error) {
    console.error("Erreur détail commande admin:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement de la commande." },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/orders/:id → mise à jour statut & suivi
export async function PATCH(
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
      { error: "Identifiant commande manquant." },
      { status: 400 }
    );
  }

  let body: {
    status?: "PENDING" | "CONFIRMED" | "CANCELLED";
    shippingStatus?: "PREPARATION" | "SHIPPED" | "DELIVERED";
    notes?: string | null;
    shippingAddress?: string | null;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Corps de requête invalide." },
      { status: 400 }
    );
  }

  const updates: any = {};

  if (body.status) {
    const allowed = ["PENDING", "CONFIRMED", "CANCELLED"] as const;
    if (!allowed.includes(body.status)) {
      return NextResponse.json(
        { error: "Statut invalide." },
        { status: 400 }
      );
    }
    updates.status = body.status;
  }

  if (body.shippingStatus) {
    const allowedShipping = ["PREPARATION", "SHIPPED", "DELIVERED"] as const;
    if (!allowedShipping.includes(body.shippingStatus)) {
      return NextResponse.json(
        { error: "Statut de suivi invalide." },
        { status: 400 }
      );
    }
    updates.shippingStatus = body.shippingStatus;
  }

  if (typeof body.notes !== "undefined") {
    updates.notes = body.notes;
  }

  if (typeof body.shippingAddress !== "undefined") {
    updates.shippingAddress = body.shippingAddress;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "Aucune mise à jour fournie." },
      { status: 400 }
    );
  }

  try {
    const updated = await prisma.order.update({
      where: { id },
      data: updates,
    });

    return NextResponse.json(
      {
        id: updated.id,
        status: updated.status,
        shippingStatus: (updated as any).shippingStatus ?? "PREPARATION",
        notes: (updated as any).notes ?? null,
        shippingAddress: (updated as any).shippingAddress ?? null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur mise à jour commande admin:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la commande." },
      { status: 500 }
    );
  }
}
