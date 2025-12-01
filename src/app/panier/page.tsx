"use client";

import React from "react";
import Link from "next/link";
import { useCart } from "../cart-context";

function formatPrice(value: number): string {
  return value.toFixed(2).replace(".", ",") + " €";
}

export default function PanierPage() {
  const {
    items,
    totalPrice,
    totalQuantity,
    removeItem,
    clearCart,
    addItem,
    decreaseItem,
  } = useCart();

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
              <span className="text-zinc-700 font-medium">Panier</span>
            </nav>
          </div>
          <Link
            href="/boutique"
            className="text-xs sm:text-sm text-zinc-500 hover:text-zinc-800"
          >
            ← Continuer le shopping
          </Link>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-6">
          Votre panier
        </h1>

        {items.length === 0 ? (
          <div className="border border-dashed border-zinc-300 rounded-2xl p-8 text-center bg-zinc-50">
            <p className="text-sm sm:text-base text-zinc-600 mb-2">
              Votre panier est encore vide.
            </p>
            <p className="text-xs sm:text-sm text-zinc-500 mb-4">
              Ajoutez vos pièces préférées depuis la boutique Mawaura.
            </p>
            <Link
              href="/boutique"
              className="inline-flex items-center justify-center rounded-full border border-yellow-500 bg-yellow-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-yellow-400 hover:border-yellow-400 transition-colors"
            >
              Découvrir les bijoux
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-[2fr,1fr]">
            {/* Liste des articles */}
            <div className="space-y-4">
              {items.map((item) => {
                const unitPrice = Number(
                  item.price
                    .replace(/\s/g, "")
                    .replace("€", "")
                    .replace(",", ".")
                );
                const subtotal =
                  item.quantity * (Number.isNaN(unitPrice) ? 0 : unitPrice);

                return (
                  <article
                    key={item.id}
                    className="flex items-center justify-between gap-4 border border-zinc-200 rounded-2xl px-4 py-3 bg-white shadow-sm"
                  >
                    <div>
                      <h2 className="text-sm sm:text-base font-medium mb-1">
                        {item.name}
                      </h2>

                      {/* Zone quantité avec boutons - et + */}
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-xs sm:text-sm text-zinc-600">
                          Quantité :
                        </span>
                        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-300 px-2 py-1">
                          <button
                            type="button"
                            onClick={() => decreaseItem(item.id)}
                            className="w-6 h-6 flex items-center justify-center rounded-full text-xs font-semibold text-zinc-700 hover:bg-zinc-100"
                          >
                            −
                          </button>
                          <span className="text-xs sm:text-sm min-w-[1.5rem] text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              addItem({
                                id: item.id,
                                name: item.name,
                                price: item.price,
                              })
                            }
                            className="w-6 h-6 flex items-center justify-center rounded-full text-xs font-semibold text-zinc-700 hover:bg-zinc-100"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-zinc-500">
                        Prix unitaire : {item.price}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <p className="text-sm font-semibold text-yellow-700">
                        Sous-total : {formatPrice(subtotal)}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-[11px] sm:text-xs text-red-500 hover:text-red-600"
                      >
                        Retirer l&apos;article
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Résumé */}
            <aside className="border border-zinc-200 rounded-2xl p-5 bg-zinc-50 shadow-sm">
              <h2 className="text-sm sm:text-base font-semibold mb-4">
                Résumé de la commande
              </h2>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-zinc-600">Articles</span>
                <span className="font-medium">{totalQuantity}</span>
              </div>
              <div className="flex items-center justify-between text-sm mb-4">
                <span className="text-zinc-600">Total</span>
                <span className="font-semibold text-yellow-700">
                  {formatPrice(totalPrice)}
                </span>
              </div>
              <button
                type="button"
                className="w-full mb-3 inline-flex items-center justify-center rounded-full border border-yellow-500 bg-yellow-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-yellow-400 hover:border-yellow-400 transition-colors disabled:opacity-60"
                disabled
              >
                Paiement bientôt disponible
              </button>
              <button
                type="button"
                onClick={clearCart}
                className="w-full text-[11px] sm:text-xs text-zinc-500 hover:text-zinc-700"
              >
                Vider le panier
              </button>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}
