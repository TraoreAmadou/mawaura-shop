"use client";

import React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function CheckoutCancelPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  return (
    <main className="min-h-screen bg-white text-zinc-900">
      {/* Bandeau haut */}
      <header className="border-b border-zinc-200 bg-zinc-50/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-2">
          <p className="tracking-[0.3em] uppercase text-[11px] text-yellow-600">
            Mawaura Paiement
          </p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                Paiement annulé
              </h1>
              <p className="text-sm sm:text-base text-zinc-600">
                Votre paiement n&apos;a pas été finalisé.
              </p>
            </div>
            <nav className="text-[11px] sm:text-xs text-zinc-500">
              <Link href="/" className="hover:text-zinc-800">
                Accueil
              </Link>
              <span className="mx-1">/</span>
              <span className="text-zinc-800 font-medium">Annulation</span>
            </nav>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="border border-zinc-200 rounded-3xl bg-white shadow-sm px-5 py-8 sm:px-8 sm:py-10 text-center space-y-5">
          {/* Icône */}
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-red-50 border border-red-200 mx-auto mb-2">
            <span className="text-2xl">✕</span>
          </div>

          <h2 className="text-lg sm:text-xl font-semibold tracking-tight">
            Votre paiement a été annulé
          </h2>

          {orderId ? (
            <p className="text-sm sm:text-base text-zinc-600">
              Référence de commande :{" "}
              <span className="font-mono text-zinc-900">{orderId}</span>
              <br />
              Vous pouvez réessayer le paiement ou revenir plus tard.
            </p>
          ) : (
            <p className="text-sm sm:text-base text-zinc-600">
              Vous pouvez réessayer le paiement ou revenir plus tard.
            </p>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mt-4">
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

            <Link
              href="/boutique"
              className="text-[11px] text-zinc-500 hover:text-zinc-800"
            >
              Continuer mes achats →
            </Link>
          </div>

          <p className="mt-4 text-[11px] text-zinc-500">
            Si le problème persiste, vérifiez votre solde Mobile Money ou
            essayez un autre moyen de paiement.
          </p>
        </div>
      </section>
    </main>
  );
}
