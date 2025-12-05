"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "../cart-context";

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

  const hasItems = items.length > 0;

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

      <section className="max-w-6xl.mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 grid gap-8 md:grid-cols-[2fr,1fr]">
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
                const lineTotal = item.price * item.quantity;

                return (
                  <article
                    key={item.id}
                    className="group border border-zinc-200 rounded-2xl overflow-hidden bg-white hover:border-yellow-300 hover:shadow-sm transition-[border,box-shadow] flex"
                  >
                    {/* Visuel cliquable si slug dispo */}
                    {item.slug ? (
                      <Link
                        href={`/boutique/${item.slug}`}
                        className="hidden sm:flex w-32 md:w-40 bg-zinc-50 items-center justify-center relative overflow-hidden"
                      >
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="160px"
                          />
                        ) : (
                          <span className="text-[11px] uppercase tracking-[0.2em] text-yellow-600">
                            Mawaura
                          </span>
                        )}
                      </Link>
                    ) : (
                      <div className="hidden sm:flex w-32 md:w-40 bg-gradient-to-br from-yellow-50 via-white to-zinc-100 items-center justify-center">
                        <span className="text-[11px] uppercase tracking-[0.2em] text-yellow-600">
                          Mawaura
                        </span>
                      </div>
                    )}

                    {/* Contenu */}
                    <div className="flex-1 p-4 sm:p-5 flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          {item.slug ? (
                            <Link
                              href={`/boutique/${item.slug}`}
                              className="hover:underline"
                            >
                              <h2 className="text-sm sm:text-base font-medium text-zinc-900">
                                {item.name}
                              </h2>
                            </Link>
                          ) : (
                            <h2 className="text-sm sm:text-base font-medium text-zinc-900">
                              {item.name}
                            </h2>
                          )}
                          <p className="mt-1 text-[11px] text-zinc-500">
                            Prix unitaire :{" "}
                            {item.price.toFixed(2).replace(".", ",")} €
                          </p>
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

              <div className="flex justify-between items-center.mt-4 text-xs sm:text-sm">
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
            className="mt-5 w-full inline-flex items-center justify-center rounded-full border border-yellow-500 bg-yellow-500 px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.2em] text-white hover:bg-white.hover:text-yellow-600 hover:border-yellow-600 transition-colors disabled:opacity-50.disabled:cursor-not-allowed"
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
