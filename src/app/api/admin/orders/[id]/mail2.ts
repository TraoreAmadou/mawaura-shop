import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { shippingUpdateTemplate } from "@/lib/email-templates";

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

type ShippingStatus = "PREPARATION" | "SHIPPED" | "DELIVERED" | "RECEIVED";

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

// PATCH /api/admin/orders/:id → mise à jour statut & suivi (+ gestion stock)
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

  // ✅ Infos pour l’email (préparées dans la transaction)
  let shouldSendShippingEmail = false;
  let emailToNotify: string | null = null;
  let customerName: string | null = null;
  let newShippingStatus: ShippingStatus | null = null;

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

      const previousShipping: ShippingStatus =
        ((existing as any).shippingStatus as ShippingStatus | null) ??
        "PREPARATION";

      const paymentStatus = (existing as any).paymentStatus as
        | "PENDING"
        | "PAID"
        | "FAILED"
        | "CANCELLED"
        | undefined;

      const isPaid = paymentStatus === "PAID";

      // ✅ Détecter un vrai changement de shippingStatus
      // ✅ ET envoyer uniquement si commande payée
      if (
        isPaid &&
        typeof body.shippingStatus !== "undefined" &&
        body.shippingStatus !== previousShipping
      ) {
        shouldSendShippingEmail = true;
        emailToNotify = existing.email;
        customerName = existing.customerName ?? null;
        newShippingStatus = body.shippingStatus;
      }

      // Mise à jour de la commande
      const updated = await tx.order.update({
        where: { id },
        data: updates,
      });

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

      return updated;
    });

    // ✅ Email envoyé APRÈS transaction (ne bloque pas la réponse)
    if (shouldSendShippingEmail && emailToNotify && newShippingStatus) {
      try {
        const tpl = shippingUpdateTemplate({
          orderId: id,
          customerName,
          shippingStatus: newShippingStatus,
        });

        await sendEmail({
          to: emailToNotify,
          subject: tpl.subject,
          html: tpl.html,
          text: tpl.text,
        });
      } catch (e) {
        console.error("❌ Email shipping update failed:", e);
      }
    }

    return NextResponse.json(
      {
        id: result.id,
        status: result.status,
        shippingStatus: (result as any).shippingStatus ?? "PREPARATION",
        notes: (result as any).notes ?? null,
        shippingAddress: (result as any).shippingAddress ?? null,
      },
      { status: 200 }
    );
  } catch (error: any) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Commande introuvable." }, { status: 404 });
    }

    console.error("Erreur mise à jour commande admin:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la commande." },
      { status: 500 }
    );
  }
}
