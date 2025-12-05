"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useCart } from "../cart-context";

type ApiProduct = {
  id: string;
  slug: string;
  category: string | null;
  isFeatured?: boolean;
  isNew?: boolean;
  isBestSeller?: boolean;
  tag?: string | null;
  mainImageUrl?: string | null;
  stock: number;
  lowStockThreshold: number;
  isActive: boolean;
};

type StockStatus =
  | { label: "En stock"; variant: "ok" }
  | { label: "Derniers exemplaires"; variant: "warning" }
  | { label: "Bientôt de retour"; variant: "warning" }
  | { label: "Indisponible"; variant: "danger" };

type Badge = { key: string; label: string; className: string };

function getStockStatus(p?: ApiProduct | null): StockStatus | null {
  if (!p) return null;

  if (!p.isActive) {
    return { label: "Indisponible", variant: "danger" };
  }

  if (p.stock <= 0) {
    return { label: "Bientôt de retour", variant: "warning" };
  }

  if (p.lowStockThreshold > 0 && p.stock <= p.lowStockThreshold) {
    return { label: "Derniers exemplaires", variant: "warning" };
  }

  return { label: "En stock", variant: "ok" };
}

export default function PanierPage() {
  const {
    items,
    totalPrice,
    totalQuantity,
    increment,
    decrement,
    removeItem,
    clearCart,
  } = useCart();

  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const hasItems = items.length > 0;

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);
        const res = await fetch("/api/products");
        const data = await res.json();
        if (res.ok) {
          setProducts(data);
        }
      } catch (e) {
        console.error("Erreur chargement produits (panier):", e);
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <main className="min-h-screen bg-white text-zinc-900">
      {/* Bandeau haut */}
      <header className="border-b border-zinc-200 bg-zinc-50/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-2">
          <p className="tracking-[0.3em] uppercase text-[11px] text-yellow-600">
            Mawaura Panier
          </p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                Votre sélection
              </h1>
              <p className="text-sm sm:text-base text-zinc-600">
                Retrouvez ici les bijoux que vous avez ajoutés à votre panier.
              </p>
            </div>
            <nav className="text-[11px] sm:text-xs text-zinc-500">
              <Link href="/" className="hover:text-zinc-800">
                Accueil
              </Link>
              <span className="mx-1">/</span>
              <Link href="/boutique" className="hover:text-zinc-800">
                Boutique
              </Link>
              <span className="mx-1">/</span>
              <span className="text-zinc-800 font-medium">Panier</span>
            </nav>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 grid gap-8 md:grid-cols-[2fr,1fr]">
        {/* Colonne gauche : liste des articles */}
        <div className="space-y-4">
          {!hasItems ? (
            <div className="border border-dashed border-zinc-300 rounded-2xl px-4 py-6 sm:px-6 sm:py-8 bg-zinc-50/60 text-center">
              <p className="text-sm sm:text-base text-zinc-600 mb-3">
                Votre panier est actuellement vide.
              </p>
              <Link
                href="/boutique"
                className="inline-flex items-center justify-center rounded-full border border-yellow-500 bg-yellow-500 px-6 py-2.5 text-xs sm:text-sm font-medium uppercase tracking-[0.2em] text-white hover:bg-white hover:text-yellow-600 hover:border-yellow-600 transition-colors"
              >
                Découvrir les bijoux
              </Link>
            </div>
          ) : (
            <>
              {items.map((item) => {
                const product = products.find(
                  (p) => p.id === String(item.id)
                );
                const stockStatus = getStockStatus(product);

                let stockClass = "";
                if (stockStatus) {
                  stockClass =
                    stockStatus.variant === "ok"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : stockStatus.variant === "warning"
                      ? "border-amber-200 bg-amber-50 text-amber-700"
                      : "border-red-200 bg-red-50 text-red-700";
                }

                const href = product
                  ? `/boutique/${product.slug}`
                  : "/boutique";

                // 🔹 badges pour la ligne du panier
                const badges: Badge[] = [];

                if (product?.isNew) {
                  badges.push({
                    key: "new",
                    label: "Nouveau",
                    className:
                      "inline-flex items-center rounded-full bg-zinc-900 text-white px-2 py-0.5 text-[9px] uppercase tracking-[0.18em]",
                  });
                }

                if (product?.isBestSeller) {
                  badges.push({
                    key: "best",
                    label: "Best-seller",
                    className:
                      "inline-flex items-center rounded-full bg-white text-zinc-900 px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] border border-zinc-200",
                  });
                }

                if (stockStatus && stockStatus.label !== "En stock") {
                  badges.push({
                    key: "stock",
                    label: stockStatus.label,
                    className: `inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] ${stockClass}`,
                  });
                }

                if (product?.tag) {
                  badges.push({
                    key: "tag",
                    label: product.tag,
                    className:
                      "inline-flex items-center rounded-full bg-zinc-50 text-zinc-700 px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] border border-zinc-200",
                  });
                }

                if (product?.isFeatured) {
                  badges.push({
                    key: "featured",
                    label: "Phare",
                    className:
                      "inline-flex items-center rounded-full bg-yellow-500 text-white px-2 py-0.5 text-[9px] uppercase tracking-[0.18em]",
                  });
                }

                const lineTotal = item.price * item.quantity;

                return (
                  <article
                    key={item.id}
                    className="group border border-zinc-200 rounded-2xl overflow-hidden bg-white hover:border-yellow-300 hover:shadow-sm transition-[border,box-shadow] flex"
                  >
                    {/* Vignette image */}
                    <Link
                      href={href}
                      className="hidden sm:flex w-32 md:w-40 bg-gradient-to-br from-yellow-50 via-white to-zinc-100 items-center justify-center overflow-hidden"
                    >
                      {product?.mainImageUrl ? (
                        <img
                          src={product.mainImageUrl}
                          alt={item.name}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <span className="text-[11px] uppercase tracking-[0.2em] text-yellow-600">
                          Mawaura
                        </span>
                      )}
                    </Link>

                    {/* Contenu */}
                    <div className="flex-1 p-4 sm:p-5 flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <Link href={href}>
                            <h2 className="text-sm sm:text-base font-medium text-zinc-900 hover:underline">
                              {item.name}
                            </h2>
                          </Link>
                          <p className="text-[11px] text-zinc-500">
                            Prix unitaire :{" "}
                            {item.price.toFixed(2).replace(".", ",")} €
                          </p>
                          {product?.category && (
                            <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                              {product.category}
                            </p>
                          )}
                          {badges.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {badges.map((badge) => (
                                <span
                                  key={badge.key}
                                  className={badge.className}
                                >
                                  {badge.label}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="text-[11px] text-zinc-400 hover:text-red-500"
                        >
                          Retirer
                        </button>
                      </div>

                      {/* Quantité + total ligne */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-100">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                            Quantité
                          </span>
                          <div className="inline-flex items-center rounded-full border border-zinc-200 bg-white overflow-hidden">
                            <button
                              type="button"
                              onClick={() => decrement(item.id)}
                              className="w-8 h-8 flex items-center justify-center text-sm text-zinc-600 hover:bg-zinc-50"
                            >
                              –
                            </button>
                            <span className="w-10 text-center text-sm text-zinc-900">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => increment(item.id)}
                              className="w-8 h-8 flex items-center justify-center text-sm text-zinc-600 hover:bg-zinc-50"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                            Total
                          </p>
                          <p className="text-sm sm:text-base font-semibold text-zinc-900">
                            {lineTotal.toFixed(2).replace(".", ",")} €
                          </p>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}

              <div className="flex justify-between items-center mt-4 text-xs sm:text-sm">
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-zinc-500 hover:text-red-500"
                >
                  Vider le panier
                </button>
                <p className="text-zinc-500">
                  {totalQuantity} article(s) dans votre panier
                </p>
              </div>
            </>
          )}
        </div>

        {/* Colonne droite : récapitulatif */}
        <aside className="border border-zinc-200 rounded-2xl p-5 sm:p-6 bg-white shadow-sm h-fit">
          <h2 className="text-sm sm:text-base font-semibold mb-4">
            Récapitulatif
          </h2>
          <div className="space-y-2 text-sm text-zinc-700">
            <div className="flex justify-between">
              <span>Sous-total</span>
              <span>
                {totalPrice.toFixed(2).replace(".", ",")} €
              </span>
            </div>
            <div className="flex justify-between text-zinc-500 text-xs">
              <span>Livraison</span>
              <span>Calculée ultérieurement</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-zinc-200">
            <div className="flex justify-between items-center text-sm font-semibold">
              <span>Total</span>
              <span>
                {totalPrice.toFixed(2).replace(".", ",")} €
              </span>
            </div>
            <p className="mt-2 text-[11px] text-zinc-500">
              Les frais de livraison seront ajoutés lors de la validation de
              commande.
            </p>
          </div>

          <button
            type="button"
            disabled={!hasItems}
            className="mt-5 w-full inline-flex items-center justify-center rounded-full border border-yellow-500 bg-yellow-500 px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.2em] text-white hover:bg-white hover:text-yellow-600 hover:border-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Valider mon panier
          </button>

          <div className="mt-3 text-center">
            <Link
              href="/boutique"
              className="text-[11px] text-zinc-500 hover:text-zinc-800"
            >
              ← Continuer mes achats
            </Link>
          </div>
        </aside>
      </section>
    </main>
  );
}
