"use client";

import React from "react";
import Link from "next/link";
import { useFavorites } from "../favorites-context";
import { useCart } from "../cart-context";

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

  const formatPrice = (price: any) => {
    if (typeof price === "number") {
      return `${price.toFixed(2).replace(".", ",")} €`;
    }
    // ancien format string "29,90 €"
    return price;
  };

  const hasItems = items.length > 0;

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
              {items.map((item: any) => (
                <article
                  key={item.id}
                  className="group border border-zinc-200 rounded-2xl overflow-hidden bg-white hover:border-yellow-300 hover:shadow-sm transition-[border,box-shadow] flex flex-col"
                >
                  {/* visuel placeholder */}
                  <div className="aspect-[3/4] bg-gradient-to-br from-yellow-50 via-white to-zinc-100 flex items-center justify-center">
                    <span className="text-[11px] uppercase tracking-[0.2em] text-yellow-600">
                      Mawaura
                    </span>
                  </div>

                  <div className="flex-1 p-3 sm:p-4 flex flex-col gap-2">
                    {/* Titre + catégorie */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        {item.category && (
                          <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500 mb-1">
                            {item.category}
                          </p>
                        )}
                        <h2 className="text-sm sm:text-base font-medium text-zinc-900 line-clamp-2">
                          {item.name}
                        </h2>
                      </div>
                    </div>

                    {/* Prix */}
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
                      >
                        Ajouter au panier
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
              ))}
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
