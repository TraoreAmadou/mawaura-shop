// import { NextRequest, NextResponse } from "next/server";
// import { getToken } from "next-auth/jwt";
// import { prisma } from "@/lib/prisma";



// async function requireAdmin(req: NextRequest) {
//   const token = await getToken({
//     req,
//     secret: process.env.NEXTAUTH_SECRET,
//   });

//   if (!token || (token as any).role !== "ADMIN") {
//     return null;
//   }
//   return token;
// }

// // GET /api/admin/orders → liste toutes les commandes
// export async function GET(req: NextRequest) {
//   const token = await requireAdmin(req);
//   if (!token) {
//     return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
//   }

//   try {
//     const orders = await prisma.order.findMany({
//       orderBy: { createdAt: "desc" },
//       include: {
//         items: true,
//       },
//     });

//     const formatted = orders.map((order) => ({
//       id: order.id,
//       createdAt: order.createdAt,
//       status: order.status,
//       shippingStatus: (order as any).shippingStatus ?? "PREPARATION",
//       totalCents: order.totalCents,
//       email: order.email,
//       customerName: order.customerName,
//       shippingAddress: (order as any).shippingAddress ?? null,
//       notes: (order as any).notes ?? null,
//       items: order.items.map((item) => ({
//         id: item.id,
//         productId: item.productId,
//         quantity: item.quantity,
//         unitPriceCents: item.unitPriceCents,
//         totalPriceCents: item.totalPriceCents,
//         productNameSnapshot: item.productNameSnapshot,
//         productSlugSnapshot: item.productSlugSnapshot,
//       })),
//     }));

//     return NextResponse.json(formatted, { status: 200 });
//   } catch (error) {
//     console.error("Erreur liste commandes admin:", error);
//     return NextResponse.json(
//       { error: "Erreur lors du chargement des commandes." },
//       { status: 500 }
//     );
//   }
// }


// src/app/api/admin/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const runtime = "nodejs";

type ShippingStatus = "PREPARATION" | "SHIPPED" | "DELIVERED" | "RECEIVED";
type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "CANCELLED";

async function requireAdmin() {
  // ✅ database sessions friendly
  const session = await getServerSession(authOptions);

  const email = session?.user?.email;
  if (!email) return null;

  // ✅ Source de vérité: rôle en BDD
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true, email: true },
  });

  if (!user || user.role !== "ADMIN") return null;

  return { userId: user.id, email: user.email, role: user.role };
}

// GET /api/admin/orders → liste toutes les commandes
export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: { items: true },
    });

    const formatted = orders.map((order) => ({
      id: order.id,
      createdAt: order.createdAt,
      status: order.status,
      shippingStatus: (((order as any).shippingStatus ?? "PREPARATION") as ShippingStatus),
      paymentStatus: (((order as any).paymentStatus ?? "PENDING") as PaymentStatus),
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
