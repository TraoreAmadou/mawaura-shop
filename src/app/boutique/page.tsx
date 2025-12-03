"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useCart } from "../cart-context";
import { useFavorites } from "../favorites-context";

type Category = "Boucles d’oreilles" | "Colliers" | "Bracelets" | "Bagues";

type Product = {
  id: number;
  name: string;
  description: string;
  price: string;
  category: Category;
  isNew?: boolean;
  isBestSeller?: boolean;
  tag?: "Édition limitée" | "Collection Aura" | "Indispensable";
};

const products: Product[] = [
  {
    id: 1,
    name: "Boucles d’oreilles Aura",
    description: "Fines et lumineuses, pour sublimer chaque mouvement.",
    price: "29,90 €",
    category: "Boucles d’oreilles",
    isNew: true,
    tag: "Collection Aura",
  },
  {
    id: 2,
    name: "Collier Signature Mawaura",
    description: "Un collier délicat pour révéler votre aura naturelle.",
    price: "39,90 €",
    category: "Colliers",
    isBestSeller: true,
    tag: "Édition limitée",
  },
  {
    id: 3,
    name: "Bracelet Lumière",
    description: "Une touche dorée pour accompagner vos journées.",
    price: "24,90 €",
    category: "Bracelets",
    tag: "Indispensable",
  },
  {
    id: 4,
    name: "Créoles Étoile",
    description: "Créoles dorées avec pendentif étoile minimaliste.",
    price: "27,90 €",
    category: "Boucles d’oreilles",
  },
  {
    id: 5,
    name: "Collier Lune Dorée",
    description: "Pendentif lune sur chaîne fine dorée, parfait au quotidien.",
    price: "34,90 €",
    category: "Colliers",
    tag: "Collection Aura",
  },
  {
    id: 6,
    name: "Bague Aura Fine",
    description: "Bague ajustable dorée, à porter seule ou en accumulation.",
    price: "19,90 €",
    category: "Bagues",
    isNew: true,
  },
];

const categoryFilters: Array<"Tous" | Category> = [
  "Tous",
  "Boucles d’oreilles",
  "Colliers",
  "Bracelets",
  "Bagues",
];

export default function BoutiquePage() {
  const { addItem, totalQuantity } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const [activeCategory, setActiveCategory] = useState<"Tous" | Category>("Tous");

  const filteredProducts =
    activeCategory === "Tous"
      ? products
      : products.filter((p) => p.category === activeCategory);

  return (
    <main className="min-h-screen bg-white text-zinc-900">
      {/* Bandeau haut + nav boutique */}
      <header className="border-b border-zinc-200 bg-gradient-to-b from-zinc-50/90 via-white to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-6 sm:pt-6 sm:pb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <p className="tracking-[0.25em] uppercase text-[11px] text-zinc-500">
                MAWAURA ACCESSORIES
              </p>
              <nav className="text-xs sm:text-sm text-zinc-500 mt-1 flex items-center gap-1">
                <Link href="/" className="hover:text-zinc-800">
                  Accueil
                </Link>
                <span>/</span>
                <span className="text-zinc-700 font-medium">Boutique</span>
              </nav>
            </div>
            <div className="flex items-center gap-4 text-xs sm:text-sm">
              <Link
                href="/panier"
                className="relative inline-flex items-center gap-2 rounded-full border border-zinc-200 px-3 py-1.5 text-xs sm:text-sm text-zinc-700 hover:border-yellow-500 hover:bg-yellow-50 transition-colors"
              >
                <span>Panier</span>
                <span className="inline-flex items-center justify-center min-w-[1.4rem] h-5 rounded-full bg-yellow-500 text-white text-[10px] font-semibold">
                  {totalQuantity}
                </span>
              </Link>
              <Link
                href="/"
                className="text-xs sm:text-sm text-zinc-500 hover:text-zinc-800"
              >
                ← Retour à l&apos;accueil
              </Link>
            </div>
          </div>

          {/* Hero boutique */}
          <div className="grid gap-4 sm:gap-6 md:grid-cols-[1.4fr,1fr] items-start">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight">
                Boutique Mawaura
              </h1>
              <p className="mt-3 max-w-2xl text-sm sm:text-base text-zinc-600 leading-relaxed">
                Découvrez notre sélection de bijoux pensés pour révéler votre
                aura : boucles d&apos;oreilles, colliers, bracelets et bagues,
                imaginés pour accompagner votre élégance au quotidien.
              </p>
            </div>
            <div className="flex flex-col items-start sm:items-end gap-2 text-xs sm:text-sm">
              <span className="inline-flex items-center gap-2 rounded-full bg-yellow-50 border border-yellow-100 px-3 py-1 text-yellow-800">
                <span className="text-[10px]">●</span>
                Nouvelle collection Aura en préparation
              </span>
              <span className="text-zinc-500">
                {products.length} modèles pour commencer l&apos;univers Mawaura.
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Filtres + catalogue */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Filtres de catégorie */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-wrap gap-2">
            {categoryFilters.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`rounded-full border px-3.5 py-1.5 text-xs sm:text-sm transition-all ${
                    isActive
                      ? "border-yellow-500 bg-yellow-500 text-white shadow-sm"
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-yellow-400 hover:text-yellow-700"
                  }`}
                >
                  {cat === "Tous" ? "Tous les bijoux" : cat}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs sm:text-sm text-zinc-500">
            {filteredProducts.length} modèle(s) affiché(s) • Filtre :{" "}
            <span className="font-medium text-zinc-700">
              {activeCategory === "Tous" ? "Tous les bijoux" : activeCategory}
            </span>
          </p>
        </div>

        {/* Grille produits */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => {
            const favorite = isFavorite(product.id);

            return (
              <article
                key={product.id}
                className="group relative border border-zinc-200 rounded-2xl p-4 sm:p-5 bg-white hover:border-yellow-400/80 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all"
              >
                {/* Badges en haut à gauche */}
                <div className="absolute top-4 left-4 flex flex-col gap-1">
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

                {/* Tag en haut à droite */}
                {product.tag && (
                  <div className="absolute top-4 right-4">
                    <span className="text-[10px] uppercase tracking-[0.16em] bg-white/90 border border-zinc-200 px-2 py-1 rounded-full text-zinc-700">
                      {product.tag}
                    </span>
                  </div>
                )}

                {/* Visuel placeholder */}
                <div className="aspect-[4/3] rounded-xl bg-zinc-100 mb-4 flex items-center justify-center text-[11px] text-zinc-400 group-hover:bg-zinc-50 transition-colors">
                  Image du bijou à venir
                </div>

                <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500 mb-1">
                  {product.category}
                </p>
                <h2 className="text-sm sm:text-base font-medium mb-1">
                  {product.name}
                </h2>
                <p className="text-xs sm:text-sm text-zinc-600 mb-3 line-clamp-2">
                  {product.description}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
                  <p className="text-sm font-semibold text-yellow-600">
                    {product.price}
                  </p>
                  <div className="flex items-center gap-2">
                    {/* Bouton favoris (cœur) */}
                    <button
                      type="button"
                      onClick={() =>
                        toggleFavorite({
                          id: product.id,
                          name: product.name,
                          price: product.price,
                          category: product.category,
                        })
                      }
                      className="w-8 h-8 flex items-center justify-center rounded-full border border-zinc-200 text-sm hover:border-yellow-400 hover:bg-yellow-50 transition-colors"
                      aria-label={
                        favorite
                          ? "Retirer des favoris"
                          : "Ajouter aux favoris"
                      }
                    >
                      <span
                        className={
                          favorite ? "text-red-500" : "text-zinc-400"
                        }
                      >
                        {favorite ? "♥" : "♡"}
                      </span>
                    </button>

                    {/* Bouton ajouter au panier */}
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
                </div>
              </article>
            );
          })}
        </div>

        {/* Petit message en bas de page */}
        <div className="mt-10 border border-dashed border-zinc-300 rounded-2xl px-4 py-4 sm:px-5 sm:py-5 bg-zinc-50/80 text-xs sm:text-sm text-zinc-600">
          <p className="mb-1">
            Ceci est une première version de la boutique Mawaura. Les photos,
            stocks et options (taille, couleur, etc.) seront ajoutés au fur et à
            mesure.
          </p>
          <p>
            Prochaine étape : ajout des vraies images produits, options de
            personnalisation et paiement sécurisé.
          </p>
        </div>
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
    </main>
  );
}
