import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const transaction_id = url.searchParams.get("transaction_id") || "";
  const redirectTo = new URL(`/checkout/return?transaction_id=${encodeURIComponent(transaction_id)}`, url.origin);
  return NextResponse.redirect(redirectTo, 302);
}

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const transaction_id = form ? String(form.get("transaction_id") || "") : "";
  const url = new URL(req.url);
  const redirectTo = new URL(`/checkout/return?transaction_id=${encodeURIComponent(transaction_id)}`, url.origin);
  return NextResponse.redirect(redirectTo, 302);
}
