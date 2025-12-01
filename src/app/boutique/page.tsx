"use client";

import React from "react";
import Link from "next/link";
import { useCart } from "../cart-context";

type Product = {
  id: number;
  name: string;
  description: string;
  price: string;
  category: "Boucles d’oreilles" | "Colliers" | "Bracelets" | "Bagues";
  isNew?: boolean;
  isBestSeller?: boolean;
};

const products: Product[] = [
  {
    id: 1,
    name: "Boucles d’oreilles Aura",
    description: "Fines et lumineuses, pour sublimer chaque mouvement.",
    price: "29,90 €",
    category: "Boucles d’oreilles",
    isNew: true,
  },
  {
    id: 2,
    name: "Collier Signature Mawaura",
    description: "Un collier délicat pour révéler votre aura naturelle.",
    price: "39,90 €",
    category: "Colliers",
    isBestSeller: true,
  },
  {
    id: 3,
    name: "Bracelet Lumière",
    description: "Une touche dorée pour accompagner vos journées.",
    price: "24,90 €",
    category: "Bracelets",
  },
  {
    id: 4,
    name: "Créoles Étoile",
    description: "Créoles dorées avec un pendentif étoile minimaliste.",
    price: "27,90 €",
    category: "Boucles d’oreilles",
  },
  {
    id: 5,
    name: "Collier Lune Dorée",
    description: "Pendentif lune sur chaîne fine dorée, parfait au quotidien.",
    price: "34,90 €",
    category: "Colliers",
  },
  {
    id: 6,
    name: "Bague Aura Fine",
    description: "Bague ajustable dorée, à porter seule ou en accumulation.",
    price: "19,90 €",
    category: "Bagues",
  },
];

export default function BoutiquePage() {
  const { addItem, totalQuantity } = useCart();

  return (
    <main className="min-h-screen bg-white text-zinc-900">
      {/* Bandeau haut + breadcrumb */}
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
              <span className="text-zinc-700 font-medium">Boutique</span>
            </nav>
          </div>
          <div className="flex gap-4 items-center">
            <Link
              href="/panier"
              className="text-xs sm:text-sm text-zinc-700 hover:text-zinc-900"
            >
              Panier ({totalQuantity})
            </Link>
            <Link
              href="/"
              className="text-xs sm:text-sm text-zinc-500 hover:text-zinc-800"
            >
              ← Retour à l&apos;accueil
            </Link>
          </div>
        </div>
      </header>

      {/* Hero boutique */}
      <section className="border-b border-zinc-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight">
            Boutique Mawaura
          </h1>
          <p className="mt-3 max-w-2xl text-sm sm:text-base text-zinc-600 leading-relaxed">
            Explorez notre sélection de bijoux pensés pour révéler votre aura :
            boucles d&apos;oreilles, colliers, bracelets et bagues, imaginés
            pour accompagner votre élégance au quotidien.
          </p>
        </div>
      </section>

      {/* Catalogue */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Petite barre d’info simplifiée, on fera les filtres plus tard */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <p className="text-sm text-zinc-600">
            {products.length} modèles disponibles • Collection en cours de
            création
          </p>
          <p className="text-xs sm:text-sm text-zinc-500">
            Bientôt : filtres par catégorie, couleur et prix.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <article
              key={product.id}
              className="relative border border-zinc-200 rounded-2xl p-4 sm:p-5 bg-white hover:border-yellow-400/80 shadow-sm hover:shadow-md transition-all"
            >
              {/* Badges */}
              <div className="absolute top-4 left-4 flex gap-2">
                {product.isNew && (
                  <span className="text-[10px] uppercase tracking-[0.18em] bg-yellow-400 text-zinc-900 px-2 py-1 rounded-full">
                    Nouveau
                  </span>
                )}
                {product.isBestSeller && (
                  <span className="text-[10px] uppercase tracking-[0.18em] bg-zinc-900 text-yellow-400 px-2 py-1 rounded-full">
                    Best-seller
                  </span>
                )}
              </div>

              {/* Visuel placeholder */}
              <div className="aspect-[4/3] rounded-xl bg-zinc-100 mb-4 flex items-center justify-center text-[11px] text-zinc-400">
                Image du bijou à venir
              </div>

              <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500 mb-1">
                {product.category}
              </p>
              <h2 className="text-sm sm:text-base font-medium mb-1">
                {product.name}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-600 mb-3">
                {product.description}
              </p>

              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-yellow-600">
                  {product.price}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    addItem({
                      id: product.id,
                      name: product.name,
                      price: product.price,
                    })
                  }
                  className="text-[11px] sm:text-xs font-medium rounded-full border border-yellow-500 text-yellow-700 px-3 py-1.5 hover:bg-yellow-500 hover:text-white transition-colors"
                >
                  Ajouter au panier
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-zinc-500">
          <p>
            © {new Date().getFullYear()} Mawaura Accessories. Tous droits
            réservés.
          </p>
          <p className="text-zinc-400">
            Bientôt : panier, paiement sécurisé et suivi de commande.
          </p>
        </div>
      </footer>
    </main>
  );
}
