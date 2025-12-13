"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type RecoProduct = {
  id: string;
  slug: string;
  name: string;
  price: number | string; // prix en euros, comme dans /api/products
  category: string | null;
  mainImageUrl?: string | null;
  isFeatured?: boolean;
  isNew?: boolean;
  isBestSeller?: boolean;
  tag?: string | null;
  isActive?: boolean;
};

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const hasOrderId = !!orderId;

  const [recommendations, setRecommendations] = useState<RecoProduct[]>([]);
  const [loadingReco, setLoadingReco] = useState(true);

  // Chargement des produits recommandés
  useEffect(() => {
    let cancelled = false;

    const loadRecommendations = async () => {
      try {
        setLoadingReco(true);
        const res = await fetch("/api/products", { cache: "no-store" });
        const data = await res.json().catch(() => []);

        if (!res.ok || !Array.isArray(data)) {
          return;
        }

        if (cancelled) return;

        const products = data as RecoProduct[];

        // On privilégie les produits mis en avant / best-seller / nouveaux
        const highlighted = products.filter(
          (p) =>
            (p.isActive ?? true) &&
            (p.isFeatured || p.isBestSeller || p.isNew)
        );

        let recos = highlighted.slice(0, 4);

        // Si pas assez de produits "highlighted", on complète avec des produits actifs
        if (recos.length < 4) {
          const more = products.filter(
            (p) =>
              (p.isActive ?? true) &&
              !recos.some((r) => r.id === p.id)
          );
          recos = [...recos, ...more].slice(0, 4);
        }

        setRecommendations(recos);
      } catch (error) {
        console.error("Erreur chargement recommandations:", error);
      } finally {
        if (!cancelled) setLoadingReco(false);
      }
    };

    loadRecommendations();

    return () => {
      cancelled = true;
    };
  }, []);

  // Normalisation du prix (au cas où ce serait une string)
  const getPriceEuros = (p: RecoProduct) => {
    if (typeof p.price === "number") return p.price;
    const n = Number(
      String(p.price)
        .replace("€", "")
        .replace(",", ".")
        .trim()
    );
    return Number.isNaN(n) ? 0 : n;
  };

  return (
    <main className="min-h-screen bg-white text-zinc-900">
      {/* Bandeau haut */}
      <header className="border-b border-zinc-200 bg-zinc-50/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-2">
          <p className="tracking-[0.3em] uppercase text-[11px] text-yellow-600">
            Mawaura Merci
          </p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                Merci pour votre commande 🌿
              </h1>
              <p className="text-sm sm:text-base text-zinc-600">
                Votre commande a bien été enregistrée. Vous allez recevoir un
                récapitulatif par email.
              </p>
            </div>
            <nav className="text-[11px] sm:text-xs text-zinc-500">
              <Link href="/" className="hover:text-zinc-800">
                Accueil
              </Link>
              <span className="mx-1">/</span>
              <span className="text-zinc-800 font-medium">
                Confirmation
              </span>
            </nav>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Carte de confirmation */}
        <div className="border border-zinc-200 rounded-3xl bg-white shadow-sm px-5 py-8 sm:px-8 sm:py-10 text-center space-y-5">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-emerald-50 border border-emerald-200 mx-auto mb-2">
            <span className="text-2xl">✓</span>
          </div>

          <h2 className="text-lg sm:text-xl font-semibold tracking-tight">
            Votre commande est en préparation
          </h2>

          {hasOrderId ? (
            <p className="text-sm sm:text-base text-zinc-600">
              Numéro de commande :{" "}
              <span className="font-mono text-zinc-900">
                {orderId}
              </span>
              <br />
              Vous pouvez suivre l&apos;état de votre commande depuis votre
              espace compte.
            </p>
          ) : (
            <p className="text-sm sm:text-base text-zinc-600">
              Vous pouvez retrouver vos commandes et leur suivi dans votre
              espace compte.
            </p>
          )}

          {/* Boutons d’action */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mt-4">
            {hasOrderId ? (
              <Link
                href={`/compte/commandes/${orderId}`}
                className="inline-flex items-center justify-center rounded-full border border-zinc-900 bg-zinc-900 px-6 py-2.5 text-[11px] font-medium uppercase tracking-[0.2em] text-white hover:bg-zinc-800 transition"
              >
                Voir le détail de ma commande
              </Link>
            ) : (
              <Link
                href="/compte/commandes"
                className="inline-flex items-center justify-center rounded-full border border-zinc-900 bg-zinc-900 px-6 py-2.5 text-[11px] font-medium uppercase tracking-[0.2em] text-white hover:bg-zinc-800 transition"
              >
                Voir mes commandes
              </Link>
            )}

            {/* Bouton "Continuer mes achats" */}
            <Link
              href="/boutique"
              className="inline-flex items-center justify-center rounded-full border border-zinc-900 bg-white px-6 py-2.5 text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-900 hover:bg-zinc-900 hover:text-white transition"
            >
              Continuer mes achats
            </Link>
          </div>

          <p className="mt-4 text-[11px] text-zinc-500">
            Si vous avez la moindre question, vous pouvez répondre directement à
            l&apos;email de confirmation ou nous contacter depuis la page
            contact.
          </p>
        </div>

        {/* Bloc "Vous aimerez aussi" */}
        {!loadingReco && recommendations.length > 0 && (
          <div className="mt-10">
            <h3 className="text-sm sm:text-base font-semibold mb-4">
              Vous aimerez aussi
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {recommendations.map((product) => {
                const priceEuros = getPriceEuros(product);

                return (
                  <Link
                    key={product.id}
                    href={`/boutique/${product.slug}`}
                    className="group border border-zinc-200 rounded-2xl overflow-hidden bg-white hover:border-yellow-300 hover:shadow-sm transition-[border,box-shadow]"
                  >
                    {/* 🔴 Image agrandie */}
                    <div className="h-72 sm:h-80 bg-gradient-to-br from-yellow-50 via-white to-zinc-100 flex items-center justify-center overflow-hidden">
                      {product.mainImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.mainImageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <span className="text-[11px] uppercase tracking-[0.2em] text-yellow-600">
                          Mawaura
                        </span>
                      )}
                    </div>

                    {/* Contenu texte */}
                    <div className="p-4 space-y-1.5">
                      <p className="text-sm sm:text-base font-medium text-zinc-900 line-clamp-2">
                        {product.name}
                      </p>
                      {product.category && (
                        <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                          {product.category}
                        </p>
                      )}
                      <p className="text-sm sm:text-base font-semibold text-zinc-900 mt-1">
                        {priceEuros.toFixed(2).replace(".", ",")} €
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {loadingReco && (
          <div className="mt-10 text-[11px] text-zinc-500">
            Chargement de quelques idées de bijoux pour vous...
          </div>
        )}
      </section>
    </main>
  );
}
