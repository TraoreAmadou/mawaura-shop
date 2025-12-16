import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const url = new URL(req.url);
  const transaction_id = url.searchParams.get("transaction_id")?.trim();

  if (!transaction_id) {
    return NextResponse.json(
      { error: "transaction_id manquant" },
      { status: 400 }
    );
  }

  const order = await prisma.order.findFirst({
    where: { paymentTransactionId: transaction_id },
    select: {
      id: true,
      email: true,
      status: true,
      paymentStatus: true,
      paymentMethod: true,
    },
  });

  // Rien trouvé
  if (!order) {
    return NextResponse.json(
      { status: "UNKNOWN", paymentStatus: "UNKNOWN", orderId: null },
      { status: 200 }
    );
  }

  // Sécurité : le client connecté doit être le propriétaire de la commande
  if (order.email !== session.user.email) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  return NextResponse.json(
    {
      status: order.status,                 // PENDING | CONFIRMED | CANCELLED
      paymentStatus: order.paymentStatus,   // PENDING | PAID | FAILED
      paymentMethod: order.paymentMethod ?? null,
      orderId: order.id,
    },
    { status: 200 }
  );
}
