"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useCart } from "../cart-context";
import { useFavorites } from "../favorites-context";

type ShopProduct = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  category?: string | null;
  price: number; // en euros
  isFeatured?: boolean;
  isNew?: boolean;
  isBestSeller?: boolean;
  tag?: string | null;
  mainImageUrl?: string | null;
  stock: number;
  lowStockThreshold: number;
  isActive: boolean;
};

// Helper pour le status de stock
function getStockStatus(p: ShopProduct) {
  if (!p.isActive) {
    return { label: "Indisponible", variant: "danger" as const };
  }

  if (p.stock <= 0) {
    return { label: "Bientôt de retour", variant: "warning" as const };
  }

  if (p.lowStockThreshold > 0 && p.stock <= p.lowStockThreshold) {
    return { label: "Derniers exemplaires", variant: "warning" as const };
  }

  return { label: "En stock", variant: "ok" as const };
}

// ✅ Petit composant de notification panier
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

export default function BoutiquePage() {
  const { addItem } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();

  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [onlyFeatured, setOnlyFeatured] = useState<boolean>(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/products");
        const data = await res.json();
        if (!res.ok) {
          setError(data?.error || "Erreur lors du chargement des bijoux.");
          return;
        }
        setProducts(data);
      } catch (err) {
        console.error(err);
        setError("Erreur lors du chargement des bijoux.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  const filteredProducts = useMemo(
    () =>
      products.filter((p) => {
        if (selectedCategory !== "all" && p.category !== selectedCategory) {
          return false;
        }
        if (onlyFeatured && !p.isFeatured) {
          return false;
        }
        return true;
      }),
    [products, selectedCategory, onlyFeatured]
  );

  return (
    <main className="min-h-screen bg-white text-zinc-900">
      {/* Bandeau haut / breadcrumb simple */}
      <section className="border-b border-zinc-200 bg-zinc-50/70">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-2">
          <p className="tracking-[0.3em] uppercase text-[11px] text-yellow-600">
            Mawaura Boutique
          </p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                Nos bijoux
              </h1>
              <p className="text-sm sm:text-base text-zinc-600">
                Sélectionnez vos pièces préférées et laissez parler votre aura.
              </p>
            </div>
            <nav className="text-[11px] sm:text-xs text-zinc-500">
              <Link href="/" className="hover:text-zinc-800">
                Accueil
              </Link>
              <span className="mx-1">/</span>
              <span className="text-zinc-800 font-medium">Boutique</span>
            </nav>
          </div>
        </div>
      </section>

      {/* Filtres */}
      <section className="border-b border-zinc-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={`px-3 py-1.5 rounded-full text-[11px] uppercase tracking-[0.18em] border transition-colors ${
                selectedCategory === "all"
                  ? "border-yellow-500 bg-yellow-500 text-white"
                  : "border-zinc-200 bg-white text-zinc-600 hover:border-yellow-500 hover:text-zinc-900"
              }`}
            >
              Tout
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-[11px] uppercase tracking-[0.18em] border transition-colors ${
                  selectedCategory === cat
                    ? "border-yellow-500 bg-yellow-500 text-white"
                    : "border-zinc-200 bg-white text-zinc-600 hover:border-yellow-500 hover:text-zinc-900"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setOnlyFeatured((prev) => !prev)}
            className={`px-3 py-1.5 rounded-full text-[11px] uppercase tracking-[0.18em] border inline-flex items-center gap-2 transition-colors ${
              onlyFeatured
                ? "border-yellow-500 bg-yellow-500 text-white"
                : "border-zinc-200 bg-white text-zinc-600 hover:border-yellow-500 hover:text-zinc-900"
            }`}
          >
            <span>Pièces phares</span>
            {onlyFeatured && <span>★</span>}
          </button>
        </div>
      </section>

      {/* Contenu */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {loading ? (
          <p className="text-sm text-zinc-500">Chargement des bijoux...</p>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : filteredProducts.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Aucun bijou ne correspond à vos filtres pour le moment.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5 sm:gap-6">
            {filteredProducts.map((product) => {
              const favorite = isFavorite(product.id);
              const stockStatus = getStockStatus(product);

              const stockClass =
                stockStatus.variant === "ok"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : stockStatus.variant === "warning"
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : "border-red-200 bg-red-50 text-red-700";

              return (
                <article
                  key={product.id}
                  className="group border border-zinc-200 rounded-2xl overflow-hidden bg-white hover:border-yellow-300 hover:shadow-sm transition-[border,box-shadow] flex flex-col"
                >
                  {/* visuel */}
                  <Link
                    href={`/boutique/${product.slug}`}
                    className="block overflow-hidden"
                  >
                    <div className="aspect-[3/4] bg-zinc-100 overflow-hidden">
                      {product.mainImageUrl ? (
                        <img
                          src={product.mainImageUrl}
                          alt={product.name}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-yellow-50 via-white to-zinc-100">
                          <span className="text-[11px] uppercase tracking-[0.2em] text-yellow-600">
                            Mawaura
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="flex-1 p-3 sm:p-4 flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link href={`/boutique/${product.slug}`}>
                          <h2 className="text-sm font-medium text-zinc-900 line-clamp-2 hover:underline">
                            {product.name}
                          </h2>
                        </Link>
                        {product.category && (
                          <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500 mt-1">
                            {product.category}
                          </p>
                        )}
                      </div>

                      {/* Badges à droite */}
                      <div className="flex flex-col items-end gap-1">
                        {/* Badge stock */}
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] ${stockClass}`}
                        >
                          {stockStatus.label}
                        </span>

                        {/* Autres badges */}
                        <div className="flex flex-wrap gap-1 justify-end">
                          {product.isFeatured && (
                            <span className="inline-flex items-center rounded-full bg-yellow-500 text-white px-2 py-0.5 text-[9px] uppercase tracking-[0.18em]">
                              Phare
                            </span>
                          )}
                          {product.isNew && (
                            <span className="inline-flex items-center rounded-full bg-zinc-900 text-white px-2 py-0.5 text-[9px] uppercase tracking-[0.18em]">
                              Nouveau
                            </span>
                          )}
                          {product.isBestSeller && (
                            <span className="inline-flex items-center rounded-full bg-zinc-100 text-zinc-800 px-2 py-0.5 text-[9px] uppercase tracking-[0.18em]">
                              Best-seller
                            </span>
                          )}
                          {product.tag && (
                            <span className="inline-flex items-center rounded-full bg-zinc-50 text-zinc-700 px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] border border-zinc-200">
                              {product.tag}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {product.description && (
                      <p className="text-[11px] text-zinc-500 line-clamp-2">
                        {product.description}
                      </p>
                    )}

                    <div className="mt-1 flex items-center justify-between">
                      <p className="text-sm font-semibold text-zinc-900">
                        {product.price.toFixed(2).replace(".", ",")} €
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          addItem({
                            id: product.id,
                            name: product.name,
                            price: product.price,
                            // si ton contexte panier accepte slug / image, tu peux les passer ici aussi
                          })
                        }
                        className="flex-1 inline-flex items-center justify-center rounded-full border border-yellow-500 bg-yellow-500 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-white hover:bg-white hover:text-yellow-600 hover:border-yellow-600 transition-colors disabled:opacity-60"
                        disabled={!product.isActive || product.stock <= 0}
                      >
                        {product.stock <= 0 || !product.isActive
                          ? "Indisponible"
                          : "Ajouter au panier"}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          toggleFavorite({
                            id: product.id,
                            name: product.name,
                            price: product.price,
                            category: product.category ?? undefined,
                          })
                        }
                        className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-zinc-200 hover:border-yellow-400 hover:bg-yellow-50 transition-colors"
                        aria-label={
                          favorite
                            ? "Retirer des favoris"
                            : "Ajouter aux favoris"
                        }
                      >
                        <span
                          className={`text-sm ${
                            favorite ? "text-red-500" : "text-zinc-500"
                          }`}
                        >
                          {favorite ? "♥" : "♡"}
                        </span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Toast panier */}
      <CartNotification />
    </main>
  );
}
