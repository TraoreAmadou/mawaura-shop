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
      include: { items: true },
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
      shippingStatus: ((order as any).shippingStatus ??
        "PREPARATION") as ShippingStatus,
      paymentStatus: ((order as any).paymentStatus ??
        "PENDING") as PaymentStatus,
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
    // (optionnel) permet à l'admin de forcer le paiement, si tu veux l'utiliser côté front
    paymentStatus?: PaymentStatus;
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
      return NextResponse.json({ error: "Statut invalide." }, { status: 400 });
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

  if (typeof body.notes !== "undefined") updates.notes = body.notes;
  if (typeof body.shippingAddress !== "undefined")
    updates.shippingAddress = body.shippingAddress;

  // Optionnel : si tu permets au front admin de forcer paymentStatus
  if (body.paymentStatus) {
    const allowedPayment = ["PENDING", "PAID", "FAILED", "CANCELLED"] as const;
    if (!allowedPayment.includes(body.paymentStatus)) {
      return NextResponse.json(
        { error: "Statut de paiement invalide." },
        { status: 400 }
      );
    }
    updates.paymentStatus = body.paymentStatus;
    if (body.paymentStatus === "PAID") {
      updates.paidAt = new Date();
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "Aucune mise à jour fournie." },
      { status: 400 }
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.order.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!existing) throw new Error("NOT_FOUND");

      const previousStatus = existing.status as
        | "PENDING"
        | "CONFIRMED"
        | "CANCELLED";

      const previousShipping =
        (((existing as any).shippingStatus as ShippingStatus | null) ??
          "PREPARATION") as ShippingStatus;

      const previousPaymentStatus =
        (((existing as any).paymentStatus as PaymentStatus | null) ??
          "PENDING") as PaymentStatus;

      const previousPaidAt = (existing as any).paidAt as Date | null;

      // ✅ Règle : si un admin passe la commande en CONFIRMED,
      // on considère que le paiement est validé (comme si PayDunya l’avait confirmé)
      const finalUpdates = { ...updates } as any;

      // 1) Si admin confirme -> paymentStatus=PAID (idempotent)
      if (body.status === "CONFIRMED" && previousPaymentStatus !== "PAID") {
        finalUpdates.paymentStatus = "PAID";
        finalUpdates.paidAt = previousPaidAt ?? new Date();
      }

      // 2) Si admin annule -> paymentStatus=CANCELLED si pas déjà PAID (optionnel mais cohérent)
      if (
        body.status === "CANCELLED" &&
        previousStatus !== "CANCELLED" &&
        previousPaymentStatus !== "PAID"
      ) {
        finalUpdates.paymentStatus = "CANCELLED";
      }

      // ✅ paiement “effectif” (après update) pour appliquer le verrou logistique
      const effectivePaymentStatus: PaymentStatus =
        (finalUpdates.paymentStatus as PaymentStatus | undefined) ??
        previousPaymentStatus;

      // 🔒 Bloquer l'avancement logistique si pas payé (avec le statut effectif)
      if (
        body.shippingStatus &&
        ["SHIPPED", "DELIVERED", "RECEIVED"].includes(body.shippingStatus) &&
        effectivePaymentStatus !== "PAID"
      ) {
        throw new Error("NOT_PAID_SHIPPING_LOCK");
      }

      // Mise à jour de la commande
      const updated = await tx.order.update({
        where: { id },
        data: finalUpdates,
      });

      const nextShipping =
        (((updated as any).shippingStatus as ShippingStatus | null) ??
          "PREPARATION") as ShippingStatus;

      const nextPaymentStatus =
        (((updated as any).paymentStatus as PaymentStatus | null) ??
          "PENDING") as PaymentStatus;

      // Recrédit stock si annulation (comme avant)
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

      // ✅ Email suivi UNIQUEMENT si commande PAID
      const shouldNotifyShipping =
        !!body.shippingStatus &&
        nextShipping !== previousShipping &&
        ["SHIPPED", "DELIVERED", "RECEIVED"].includes(nextShipping) &&
        nextPaymentStatus === "PAID";

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
        paidAt: (result.updated as any).paidAt ?? null,
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
