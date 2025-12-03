"use client";

import React from "react";
import Link from "next/link";
import { useFavorites } from "../favorites-context";
import { useCart } from "../cart-context";

export default function FavorisPage() {
  const { items, removeFavorite, clearFavorites } = useFavorites();
  const { addItem } = useCart();

  return (
    <main className="min-h-screen bg-white text-zinc-900">
      {/* Header / breadcrumb */}
      <header className="border-b border-zinc-200 bg-zinc-50/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <p className="tracking-[0.25em] uppercase text-[11px] text-zinc-500">
              MAWAURA ACCESSORIES
            </p>
            <nav className="text-xs sm:text-sm text-zinc-500 mt-1">
              <Link href="/" className="hover:text-zinc-800">
                Accueil
              </Link>
              <span className="mx-1">/</span>
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

        {items.length === 0 ? (
          <div className="border border-dashed border-zinc-300 rounded-2xl p-8 text-center bg-zinc-50">
            <p className="text-sm sm:text-base text-zinc-600 mb-2">
              Vous n&apos;avez pas encore ajouté de bijoux en favoris.
            </p>
            <p className="text-xs sm:text-sm text-zinc-500 mb-4">
              Cliquez sur le petit cœur dans la boutique pour enregistrer vos
              coups de cœur.
            </p>
            <Link
              href="/boutique"
              className="inline-flex items-center justify-center rounded-full border border-yellow-500 bg-yellow-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-yellow-400 hover:border-yellow-400 transition-colors"
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

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="border border-zinc-200 rounded-2xl p-4 sm:p-5 bg-white shadow-sm hover:shadow-md hover:-translate-y-1 transition-all"
                >
                  <div className="aspect-[4/3] rounded-xl bg-zinc-100 mb-4 flex items-center justify-center text-[11px] text-zinc-400">
                    Image du bijou à venir
                  </div>

                  {item.category && (
                    <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500 mb-1">
                      {item.category}
                    </p>
                  )}
                  <h2 className="text-sm sm:text-base font-medium mb-1">
                    {item.name}
                  </h2>
                  <p className="text-sm font-semibold text-yellow-600 mb-3">
                    {item.price}
                  </p>

                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() =>
                        addItem({
                          id: item.id,
                          name: item.name,
                          price: item.price,
                        })
                      }
                      className="text-[11px] sm:text-xs font-medium rounded-full border border-yellow-500 text-yellow-700 px-3 py-1.5 hover:bg-yellow-500 hover:text-white transition-colors"
                    >
                      Ajouter au panier
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFavorite(item.id)}
                      className="text-[11px] sm:text-xs text-red-500 hover:text-red-600"
                    >
                      Retirer des favoris
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
