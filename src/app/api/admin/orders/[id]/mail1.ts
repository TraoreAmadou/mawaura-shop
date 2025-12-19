import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { sendShippingStatusEmail } from "@/lib/notifications";

export const runtime = "nodejs";

type ShippingStatus = "PREPARATION" | "SHIPPED" | "DELIVERED" | "RECEIVED";
type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "CANCELLED";

async function requireAdmin(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token || (token as any).role !== "ADMIN") return null;
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
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Commande introuvable." }, { status: 404 });
    }

    const formatted = {
      id: order.id,
      createdAt: order.createdAt,
      status: order.status,
      shippingStatus: ((order as any).shippingStatus ?? "PREPARATION") as ShippingStatus,
      paymentStatus: ((order as any).paymentStatus ?? "PENDING") as PaymentStatus,
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

// PATCH /api/admin/orders/:id → mise à jour statut & suivi (+ gestion stock) + email suivi
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
    shippingStatus?: ShippingStatus;
    notes?: string | null;
    shippingAddress?: string | null;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  const updates: any = {};

  if (body.status) {
    const allowed = ["PENDING", "CONFIRMED", "CANCELLED"] as const;
    if (!allowed.includes(body.status)) {
      return NextResponse.json({ error: "Statut invalide." }, { status: 400 });
    }
    updates.status = body.status;
  }

  if (body.shippingStatus) {
    const allowedShipping = ["PREPARATION", "SHIPPED", "DELIVERED", "RECEIVED"] as const;
    if (!allowedShipping.includes(body.shippingStatus)) {
      return NextResponse.json({ error: "Statut de suivi invalide." }, { status: 400 });
    }
    updates.shippingStatus = body.shippingStatus;
  }

  if (typeof body.notes !== "undefined") updates.notes = body.notes;
  if (typeof body.shippingAddress !== "undefined") updates.shippingAddress = body.shippingAddress;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Aucune mise à jour fournie." }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.order.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!existing) throw new Error("NOT_FOUND");

      const previousStatus = existing.status as "PENDING" | "CONFIRMED" | "CANCELLED";
      const previousShipping =
        (((existing as any).shippingStatus as ShippingStatus | null) ?? "PREPARATION") as ShippingStatus;

      const paymentStatus =
        (((existing as any).paymentStatus as PaymentStatus | null) ?? "PENDING") as PaymentStatus;

      // 🔒 Bloquer les étapes logistiques "avancées" si pas PAID
      if (
        body.shippingStatus &&
        ["SHIPPED", "DELIVERED", "RECEIVED"].includes(body.shippingStatus) &&
        paymentStatus !== "PAID"
      ) {
        throw new Error("NOT_PAID_SHIPPING_LOCK");
      }

      const updated = await tx.order.update({
        where: { id },
        data: updates,
      });

      // Recrédit stock si annulation (comme ton code)
      if (
        body.status === "CANCELLED" &&
        previousStatus !== "CANCELLED" &&
        !["SHIPPED", "DELIVERED", "RECEIVED"].includes(previousShipping)
      ) {
        for (const item of existing.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }

      const nextShipping =
        (((updated as any).shippingStatus as ShippingStatus | null) ?? "PREPARATION") as ShippingStatus;

      // 🔔 Email uniquement si changement + statut intéressant + commande payée
      const shouldNotify =
        !!body.shippingStatus &&
        nextShipping !== previousShipping &&
        ["SHIPPED", "DELIVERED", "RECEIVED"].includes(nextShipping) &&
        paymentStatus === "PAID";

      return {
        updated,
        notify: shouldNotify
          ? { to: existing.email, orderId: existing.id, shippingStatus: nextShipping }
          : null,
      };
    });

    // Envoi email après transaction
    if (result.notify) {
      try {
        await sendShippingStatusEmail(result.notify);
      } catch (e) {
        console.error("Email suivi commande échoué:", e);
      }
    }

    return NextResponse.json(
      {
        id: result.updated.id,
        status: result.updated.status,
        shippingStatus: (result.updated as any).shippingStatus ?? "PREPARATION",
        paymentStatus: (result.updated as any).paymentStatus ?? "PENDING",
        notes: (result.updated as any).notes ?? null,
        shippingAddress: (result.updated as any).shippingAddress ?? null,
      },
      { status: 200 }
    );
  } catch (error: any) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Commande introuvable." }, { status: 404 });
    }

    if (error instanceof Error && error.message === "NOT_PAID_SHIPPING_LOCK") {
      return NextResponse.json(
        { error: "Impossible d’expédier/livrer une commande non payée." },
        { status: 400 }
      );
    }

    console.error("Erreur mise à jour commande admin:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la commande." },
      { status: 500 }
    );
  }
}














// VERSION OU LE PAIEMENT N'EST PAS MODIFIER MEME SI L'ADMIN CHANGE LE STATUT EN CONFIRMED
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { sendShippingStatusEmail } from "@/lib/notifications";

export const runtime = "nodejs";

type ShippingStatus = "PREPARATION" | "SHIPPED" | "DELIVERED" | "RECEIVED";
type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "CANCELLED";

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
      shippingStatus: ((order as any).shippingStatus ?? "PREPARATION") as ShippingStatus,
      paymentStatus: ((order as any).paymentStatus ?? "PENDING") as PaymentStatus,
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

// PATCH /api/admin/orders/:id → mise à jour statut & suivi (+ gestion stock) + email suivi (si PAID)
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
    shippingStatus?: ShippingStatus;
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
    const allowedShipping = [
      "PREPARATION",
      "SHIPPED",
      "DELIVERED",
      "RECEIVED",
    ] as const;
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
    const result = await prisma.$transaction(async (tx) => {
      // On récupère la commande actuelle AVEC ses items
      const existing = await tx.order.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!existing) {
        throw new Error("NOT_FOUND");
      }

      const previousStatus = existing.status as
        | "PENDING"
        | "CONFIRMED"
        | "CANCELLED";

      const previousShipping =
        (((existing as any).shippingStatus as ShippingStatus | null) ??
          "PREPARATION") as ShippingStatus;

      const paymentStatus =
        (((existing as any).paymentStatus as PaymentStatus | null) ??
          "PENDING") as PaymentStatus;

      // 🔒 Bloquer l'avancement logistique si pas payé
      if (
        body.shippingStatus &&
        ["SHIPPED", "DELIVERED", "RECEIVED"].includes(body.shippingStatus) &&
        paymentStatus !== "PAID"
      ) {
        throw new Error("NOT_PAID_SHIPPING_LOCK");
      }

      // Mise à jour de la commande
      const updated = await tx.order.update({
        where: { id },
        data: updates,
      });

      const nextShipping =
        (((updated as any).shippingStatus as ShippingStatus | null) ??
          "PREPARATION") as ShippingStatus;

      // Si on passe en CANCELLED et qu'on n'était pas déjà annulé
      // ET que la commande n'a pas été expédiée/livrée/reçue → on recrédite le stock
      if (
        body.status === "CANCELLED" &&
        previousStatus !== "CANCELLED" &&
        !["SHIPPED", "DELIVERED", "RECEIVED"].includes(previousShipping)
      ) {
        for (const item of existing.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                increment: item.quantity,
              },
            },
          });
        }
      }

      // ✅ Mini-amélioration demandée :
      // on prépare l'envoi d'email de suivi UNIQUEMENT si paymentStatus === "PAID"
      const shouldNotifyShipping =
        !!body.shippingStatus &&
        nextShipping !== previousShipping &&
        ["SHIPPED", "DELIVERED", "RECEIVED"].includes(nextShipping) &&
        paymentStatus === "PAID";

      return {
        updated,
        notify: shouldNotifyShipping
          ? {
              to: existing.email,
              orderId: existing.id,
              shippingStatus: nextShipping,
            }
          : null,
      };
    });

    // 🔔 Envoi email APRES la transaction
    if (result.notify) {
      try {
        await sendShippingStatusEmail(result.notify);
      } catch (e) {
        console.error("Email suivi commande échoué:", e);
      }
    }

    return NextResponse.json(
      {
        id: result.updated.id,
        status: result.updated.status,
        shippingStatus: (result.updated as any).shippingStatus ?? "PREPARATION",
        paymentStatus: (result.updated as any).paymentStatus ?? "PENDING",
        notes: (result.updated as any).notes ?? null,
        shippingAddress: (result.updated as any).shippingAddress ?? null,
      },
      { status: 200 }
    );
  } catch (error: any) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json(
        { error: "Commande introuvable." },
        { status: 404 }
      );
    }

    if (error instanceof Error && error.message === "NOT_PAID_SHIPPING_LOCK") {
      return NextResponse.json(
        { error: "Impossible d’expédier/livrer une commande non payée." },
        { status: 400 }
      );
    }

    console.error("Erreur mise à jour commande admin:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la commande." },
      { status: 500 }
    );
  }
}
