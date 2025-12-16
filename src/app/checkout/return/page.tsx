"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/app/cart-context";

type StatusPayload = {
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "UNKNOWN";
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "UNKNOWN";
  paymentMethod?: string | null;
  orderId?: string | null;
  error?: string;
};

export default function CheckoutReturnPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const { clearCart } = useCart();

  const transactionId = useMemo(
    () => sp.get("transaction_id")?.trim() || "",
    [sp]
  );

  const [payload, setPayload] = useState<StatusPayload>({
    status: "UNKNOWN",
    paymentStatus: "UNKNOWN",
    orderId: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!transactionId) {
      setLoading(false);
      setPayload({
        status: "UNKNOWN",
        paymentStatus: "UNKNOWN",
        orderId: null,
        error: "Référence de paiement manquante.",
      });
      return;
    }

    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch(
          `/api/checkout/cinetpay/status?transaction_id=${encodeURIComponent(
            transactionId
          )}`,
          { cache: "no-store" }
        );

        const data = (await res.json().catch(() => null)) as StatusPayload | null;

        if (cancelled) return;

        if (!res.ok) {
          setPayload({
            status: "UNKNOWN",
            paymentStatus: "UNKNOWN",
            orderId: null,
            error: data?.error || "Impossible de vérifier le statut du paiement.",
          });
          setLoading(false);
          return;
        }

        if (data) {
          setPayload(data);
          setLoading(false);

          // Si paiement OK → on clear le panier et on redirige vers la page succès
          if (data.paymentStatus === "PAID" && data.orderId) {
            clearCart();
            router.replace(`/checkout/success?orderId=${encodeURIComponent(data.orderId)}`);
          }
        }
      } catch (e) {
        if (!cancelled) {
          setLoading(false);
          setPayload((prev) => ({
            ...prev,
            error:
              prev.error ||
              "Erreur réseau lors de la vérification du paiement. Réessayez.",
          }));
        }
      }
    };

    poll();
    const id = setInterval(poll, 2500); // toutes les 2.5s

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [transactionId, clearCart, router]);

  const isPending =
    payload.paymentStatus === "PENDING" ||
    (payload.paymentStatus === "UNKNOWN" && loading);

  const isFailed =
    payload.paymentStatus === "FAILED" || payload.status === "CANCELLED";

  return (
    <main className="min-h-screen bg-white text-zinc-900">
      <header className="border-b border-zinc-200 bg-zinc-50/80">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-2">
          <p className="tracking-[0.3em] uppercase text-[11px] text-yellow-600">
            Mawaura Paiement
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Retour de paiement
          </h1>
          <p className="text-sm text-zinc-600">
            Nous confirmons votre paiement. Cela peut prendre quelques secondes.
          </p>
        </div>
      </header>

      <section className="max-w-3xl mx-auto px-4 py-10 sm:py-14">
        <div className="border border-zinc-200 rounded-3xl bg-white shadow-sm px-5 py-8 sm:px-8 sm:py-10 text-center space-y-4">
          <p className="text-[11px] text-zinc-500">
            Référence : <span className="font-mono text-zinc-900">{transactionId || "—"}</span>
          </p>

          {payload.error ? (
            <div className="border border-red-200 bg-red-50/60 text-red-700 rounded-2xl px-4 py-3 text-sm">
              {payload.error}
            </div>
          ) : isPending ? (
            <>
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-50 border border-amber-200 mx-auto">
                <span className="text-xl">…</span>
              </div>
              <h2 className="text-lg sm:text-xl font-semibold tracking-tight">
                Paiement en cours de confirmation
              </h2>
              <p className="text-sm text-zinc-600">
                Si vous avez validé sur votre téléphone, patientez un instant.
              </p>
              <p className="text-[11px] text-zinc-500">
                Cette page se met à jour automatiquement.
              </p>
            </>
          ) : isFailed ? (
            <>
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-50 border border-red-200 mx-auto">
                <span className="text-xl">✕</span>
              </div>
              <h2 className="text-lg sm:text-xl font-semibold tracking-tight">
                Paiement non confirmé
              </h2>
              <p className="text-sm text-zinc-600">
                Votre paiement a été refusé ou annulé. Vous pouvez réessayer.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Link
                  href="/checkout"
                  className="inline-flex items-center justify-center rounded-full border border-zinc-900 bg-zinc-900 px-6 py-2.5 text-[11px] font-medium uppercase tracking-[0.2em] text-white hover:bg-zinc-800 transition"
                >
                  Réessayer le paiement
                </Link>
                <Link
                  href="/panier"
                  className="inline-flex items-center justify-center rounded-full border border-zinc-900 bg-white px-6 py-2.5 text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-900 hover:bg-zinc-900 hover:text-white transition"
                >
                  Retour au panier
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 mx-auto">
                <span className="text-xl">✓</span>
              </div>
              <h2 className="text-lg sm:text-xl font-semibold tracking-tight">
                Paiement confirmé
              </h2>
              <p className="text-sm text-zinc-600">
                Redirection en cours…
              </p>
            </>
          )}

          <div className="pt-3">
            <Link href="/boutique" className="text-[11px] text-zinc-500 hover:text-zinc-800">
              ← Continuer mes achats
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
