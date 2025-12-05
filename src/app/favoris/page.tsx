"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useFavorites } from "../favorites-context";
import { useCart } from "../cart-context";

type ApiProduct = {
  id: string;
  slug: string;
  stock: number;
  lowStockThreshold: number;
  isActive: boolean;
  isNew?: boolean;
  isBestSeller?: boolean;
  isFeatured?: boolean;
  tag?: string | null;
  mainImageUrl?: string | null;
};

type StockStatus =
  | { label: "En stock"; variant: "ok" }
  | { label: "Derniers exemplaires"; variant: "warning" }
  | { label: "Bientôt de retour"; variant: "warning" }
  | { label: "Indisponible"; variant: "danger" };

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

// ✅ Toast réutilisable
function CartNotification() {
  const { lastAddedName, totalQuantity } = useCart();

  if (!lastAddedName) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="flex items-center gap-2 rounded-full bg-zinc-900/90 text-white text-xs sm:text-sm px-4 py-2 shadow-lg">
        <span className="text-green-400 text-base">✓</span>
        <span>
          « {lastAddedName} » ajouté au panier • {totalQuantity} article(s)
        </span>
      </div>
    </div>
  );
}

export default function FavorisPage() {
  const { items, removeFavorite, clearFavorites } = useFavorites();
  const { addItem } = useCart();

  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

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
        console.error("Erreur chargement produits favoris:", e);
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, []);

  const hasItems = items.length > 0;

  const formatPrice = (price: any) => {
    if (typeof price === "number") {
      return `${price.toFixed(2).replace(".", ",")} €`;
    }
    return price;
  };

  return (
    <main className="min-h-screen bg-white text-zinc-900">
      {/* Header / breadcrumb */}
      <header className="border-b border-zinc-200 bg-zinc-50/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <p className="tracking-[0.3em] uppercase text-[11px] text-yellow-600">
              MAWAURA FAVORIS
            </p>
            <nav className="text-xs sm:text-sm text-zinc-500 mt-1 flex items-center gap-1">
              <Link href="/" className="hover:text-zinc-800">
                Accueil
              </Link>
              <span>/</span>
              <Link href="/boutique" className="hover:text-zinc-800">
                Boutique
              </Link>
              <span>/</span>
              <span className="text-zinc-700 font-medium">Favoris</span>
            </nav>
          </div>
          <Link
            href="/boutique"
            className="text-xs sm:text-sm text-zinc-500 hover:text-zinc-800"
          >
            ← Retour à la boutique
          </Link>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-6">
          Vos favoris
        </h1>

        {!hasItems ? (
          <div className="border border-dashed border-zinc-300 rounded-2xl p-8 text-center bg-zinc-50/80">
            <p className="text-sm sm:text-base text-zinc-600 mb-2">
              Vous n&apos;avez pas encore ajouté de bijoux en favoris.
            </p>
            <p className="text-xs sm:text-sm text-zinc-500 mb-4">
              Cliquez sur le petit cœur dans la boutique pour enregistrer vos
              coups de cœur.
            </p>
            <Link
              href="/boutique"
              className="inline-flex items-center justify-center rounded-full border border-yellow-500 bg-yellow-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-white hover:text-yellow-600 hover:border-yellow-600 transition-colors"
            >
              Découvrir les bijoux
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6 text-xs sm:text-sm text-zinc-600">
              <p>{items.length} bijou(x) enregistré(s) en favoris.</p>
              <button
                type="button"
                onClick={clearFavorites}
                className="text-[11px] sm:text-xs text-zinc-500 hover:text-red-500"
              >
                Vider les favoris
              </button>
            </div>

            {/* Grille style Boutique */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5 sm:gap-6">
              {items.map((item: any) => {
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

                type Badge = { key: string; label: string; className: string };

                const topCandidates: Badge[] = [];

                if (product?.isNew) {
                  topCandidates.push({
                    key: "new",
                    label: "Nouveau",
                    className:
                      "inline-flex items-center rounded-full bg-zinc-900 text-white px-2 py-0.5 text-[9px] uppercase tracking-[0.18em]",
                  });
                }

                if (product?.isBestSeller) {
                  topCandidates.push({
                    key: "best",
                    label: "Best-seller",
                    className:
                      "inline-flex items-center rounded-full bg-white/90 text-zinc-900 px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] border border-zinc-200",
                  });
                }

                if (stockStatus && stockStatus.label !== "En stock") {
                  topCandidates.push({
                    key: "stock",
                    label: stockStatus.label,
                    className: `inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] ${stockClass}`,
                  });
                }

                if (product?.tag) {
                  topCandidates.push({
                    key: "tag",
                    label: product.tag,
                    className:
                      "inline-flex items-center rounded-full bg-zinc-50 text-zinc-700 px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] border border-zinc-200",
                  });
                }

                const topBadges = topCandidates.slice(0, 2);

                const bottomBadges: Badge[] = [
                  ...topCandidates.slice(2),
                  ...(product?.isFeatured
                    ? [
                        {
                          key: "featured",
                          label: "Phare",
                          className:
                            "inline-flex items-center rounded-full bg-yellow-500 text-white px-2 py-0.5 text-[9px] uppercase tracking-[0.18em]",
                        } as Badge,
                      ]
                    : []),
                ];

                return (
                  <article
                    key={item.id}
                    className="group border border-zinc-200 rounded-2xl overflow-hidden bg-white hover:border-yellow-300 hover:shadow-sm transition-[border,box-shadow] flex flex-col"
                  >
                    <Link href={href} className="block overflow-hidden">
                      <div className="relative aspect-[3/4] bg-zinc-100 overflow-hidden">
                        {product?.mainImageUrl ? (
                          <img
                            src={product.mainImageUrl}
                            alt={item.name}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-yellow-50 via-white to-zinc-100">
                            <span className="text-[11px] uppercase tracking-[0.2em] text-yellow-600">
                              Mawaura
                            </span>
                          </div>
                        )}

                        {/* ✅ badges principaux en haut gauche / droite */}
                        {topBadges[0] && (
                          <div className="absolute top-2 left-2">
                            <span className={topBadges[0].className}>
                              {topBadges[0].label}
                            </span>
                          </div>
                        )}
                        {topBadges[1] && (
                          <div className="absolute top-2 right-2">
                            <span className={topBadges[1].className}>
                              {topBadges[1].label}
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>

                    <div className="flex-1 p-3 sm:p-4 flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          {item.category && (
                            <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500 mb-1">
                              {item.category}
                            </p>
                          )}
                          <Link href={href}>
                            <h2 className="text-sm sm:text-base font-medium text-zinc-900 line-clamp-2 hover:underline">
                              {item.name}
                            </h2>
                          </Link>
                        </div>

                        {/* Badges restants en haut à droite du contenu (dont PHARE) */}
                        {bottomBadges.length > 0 && (
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex flex-wrap gap-1 justify-end">
                              {bottomBadges.map((badge) => (
                                <span
                                  key={badge.key}
                                  className={badge.className}
                                >
                                  {badge.label}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-1 flex items-center justify-between">
                        <p className="text-sm font-semibold text-zinc-900">
                          {formatPrice(item.price)}
                        </p>
                      </div>

                      {/* Boutons */}
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            addItem({
                              id: item.id,
                              name: item.name,
                              price: item.price,
                            })
                          }
                          className="flex-1 inline-flex items-center justify-center rounded-full border border-yellow-500 bg-yellow-500 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-white hover:bg-white hover:text-yellow-600 hover:border-yellow-600 transition-colors"
                          disabled={
                            stockStatus?.label === "Bientôt de retour" ||
                            stockStatus?.label === "Indisponible"
                          }
                        >
                          {stockStatus?.label === "Bientôt de retour" ||
                          stockStatus?.label === "Indisponible"
                            ? "Indisponible"
                            : "Ajouter au panier"}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFavorite(item.id)}
                          className="text-[11px] sm:text-xs text-red-500 hover:text-red-600"
                        >
                          Retirer
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-zinc-500">
          <p>
            © {new Date().getFullYear()} Mawaura Accessories. Tous droits
            réservés.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/mentions-legales" className="hover:text-zinc-700">
              Mentions légales
            </Link>
            <Link href="/cgv" className="hover:text-zinc-700">
              CGV
            </Link>
          </div>
        </div>
      </footer>

      {/* Toast panier */}
      <CartNotification />
    </main>
  );
}
