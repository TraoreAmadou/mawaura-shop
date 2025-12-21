// src/lib/requireAdmin.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function requireAdminOrThrow() {
  const session = await getServerSession(authOptions);

  const role = (session?.user as any)?.role;
  if (!session?.user || role !== "ADMIN") {
    return { session: null, errorResponse: NextResponse.json({ error: "Non autorisé" }, { status: 403 }) };
  }

  return { session, errorResponse: null };
}
