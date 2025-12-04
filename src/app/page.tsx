"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "./cart-context";
import { useFavorites } from "./favorites-context";

type HomeProduct = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  category?: string | null;
  isFeatured?: boolean;
};

export default function Home() {
  const { addItem } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();

  const [products, setProducts] = useState<HomeProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/products");
        const data = await res.json();
        if (!res.ok) return;
        setProducts(data);
      } catch (err) {
        console.error("Erreur chargement produits accueil:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatured();
  }, []);

  const featuredProducts = useMemo(
    () =>
      products
        .filter((p) => p.isFeatured)
        .slice(0, 3), // comme ton ancienne section : 3 pièces phares
    [products]
  );

  return (
    <main className="min-h-screen bg-white text-zinc-900">
      {/* HERO + PIÈCES PHARES AVEC LA MÊME IMAGE DE FOND */}
      <section className="relative">
        {/* Image de fond sur toute la hauteur de la section */}
        <div className="absolute inset-0">
          <Image
            src="/mawaura-hero.jpg"
            alt="Bijoux Mawaura Accessories"
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        </div>

        {/* Overlay (voile) pour garder le texte lisible sur le hero */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/80 to-white/70" />

        {/* Contenu (hero + pièces phares) */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-14 sm:pt-20 sm:pb-20">
          {/* HERO */}
          <div className="max-w-xl py-8 sm:py-10">
            <p className="tracking-[0.35em] uppercase text-[11px] sm:text-xs text-zinc-500 mb-4">
              MAWAURA ACCESSORIES
            </p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-zinc-900">
              Bijoux créés pour{" "}
              <span className="text-yellow-500">révéler votre aura.</span>
            </h1>
            <p className="mt-5 text-sm sm:text-base text-zinc-600 leading-relaxed">
              Inspiré par Mawa, Mawaura Accessories célèbre une élégance douce,
              féminine et assumée. Des bijoux pensés comme une signature
              personnelle, pour briller sans en faire trop.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="#collection"
                className="inline-flex items-center justify-center rounded-full border border-yellow-500 bg-yellow-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-white hover:text-yellow-600 hover:border-yellow-600 transition-colors"
              >
                Voir les pièces phares
              </a>
            </div>

            <p className="mt-4 text-xs sm:text-sm text-zinc-500">
              ✨ Chaque pièce est une histoire à porter.
            </p>
          </div>

          {/* SECTION PIÈCES PHARES (toujours sur la même image de fond) */}
          <section id="collection" className="mt-10 sm:mt-14">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-semibold">
                  Pièces phares
                </h2>
                <p className="mt-2 text-sm sm:text-base text-zinc-600 max-w-md">
                  Une sélection de bijoux Mawaura pour commencer à écrire votre
                  histoire, éclat après éclat.
                </p>
              </div>
              {loading ? (
                <p className="text-xs sm:text-sm text-zinc-500">
                  Chargement de la sélection...
                </p>
              ) : (
                <p className="text-xs sm:text-sm text-zinc-500">
                  Collection disponible bientôt — restez connectée ✨
                </p>
              )}
            </div>

            {loading ? (
              <p className="text-sm text-zinc-500">
                Chargement des pièces phares...
              </p>
            ) : featuredProducts.length === 0 ? (
              <p className="text-sm text-zinc-500">
                Les pièces phares seront bientôt disponibles.
              </p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-5 sm:gap-6">
                {featuredProducts.map((product) => {
                  const favorite = isFavorite(product.id);

                  return (
                    <article
                      key={product.id}
                      className="group border border-zinc-200 rounded-2xl overflow-hidden bg-white hover:border-yellow-300 hover:shadow-sm transition-[border,box-shadow] flex flex-col"
                    >
                      {/* Visuel placeholder, même style que Boutique */}
                      <div className="aspect-[3/4] bg-gradient-to-br from-yellow-50 via-white to-zinc-100 flex items-center justify-center">
                        <span className="text-[11px] uppercase tracking-[0.2em] text-yellow-600">
                          Mawaura
                        </span>
                      </div>

                      <div className="flex-1 p-3 sm:p-4 flex flex-col gap-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            {product.category && (
                              <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500 mb-1">
                                {product.category}
                              </p>
                            )}
                            <h3 className="text-sm font-medium text-zinc-900 line-clamp-2">
                              {product.name}
                            </h3>
                          </div>
                          <span className="inline-flex items-center rounded-full bg-yellow-500 text-white px-2 py-0.5 text-[9px] uppercase tracking-[0.18em]">
                            Phare
                          </span>
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
                              })
                            }
                            className="flex-1 inline-flex items-center justify-center rounded-full border border-yellow-500 bg-yellow-500 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-white hover:bg-white hover:text-yellow-600 hover:border-yellow-600 transition-colors"
                          >
                            Ajouter au panier
                          </button>
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
        </div>
      </section>

      {/* Section univers de marque avec image de fond + effets dynamiques */}
      <section className="relative border-t border-zinc-200 overflow-hidden">
        {/* Image de fond pour l'univers Mawaura */}
        <div className="absolute inset-0">
          <Image
            src="/sect_univers.jpg"
            alt="Univers Mawaura Accessories"
            fill
            className="object-cover"
            sizes="100vw"
          />
        </div>

        {/* Contenu avec blocs blancs pour lisibilité */}
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 grid gap-10 md:grid-cols-[1.1fr,0.9fr] items-start">
          {/* Colonne gauche : storytelling dans un bloc blanc semi-transparent */}
          <div className="group relative rounded-2xl bg-white/90 px-4 sm:px-6 py-5 shadow-md border border-zinc-200/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            {/* Petit accent doré qui apparaît au survol */}
            <div className="pointer-events-none absolute -left-3 top-10 h-10 w-1 rounded-full bg-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <p className="tracking-[0.3em] uppercase text-[11px] text-zinc-500 mb-3">
              L&apos;univers Mawaura
            </p>
            <h2 className="text-2xl sm:text-3xl font-semibold mb-4 text-zinc-900">
              Une féminité lumineuse, douce mais affirmée.
            </h2>

            {/* Quote mise en avant */}
            <div className="rounded-2xl border border-yellow-100 bg-white/90 px-4 sm:px-5 py-4 mb-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)] transition-all duration-300 group-hover:shadow-lg">
              <p className="text-sm sm:text-base text-zinc-700 italic">
                « Nos bijoux ne crient pas pour être vus. Ils révèlent simplement la
                lumière qui est déjà en vous. »
              </p>
            </div>

            <p className="text-sm sm:text-base text-zinc-700 leading-relaxed mb-3">
              Mawaura Accessories est né de l&apos;envie de créer des bijoux qui
              parlent de vous avant même que vous ne disiez un mot. Inspiré par Mawa,
              chaque détail est pensé pour refléter une féminité lumineuse, délicate,
              mais sûre d&apos;elle.
            </p>
            <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
              Nos pièces sont imaginées pour s&apos;intégrer à votre vie quotidienne :
              un café entre amies, une présentation importante, un dîner improvisé.
              Toujours là, jamais de trop.
            </p>

            {/* Petits “pills” valeurs */}
            <div className="mt-5 flex flex-wrap gap-2 text-[11px] sm:text-xs">
              <span className="rounded-full bg-white px-3 py-1 border border-zinc-200 text-zinc-700">
                ✧ Élégance quotidienne
              </span>
              <span className="rounded-full bg-white px-3 py-1 border border-zinc-200 text-zinc-700">
                ✧ Finitions soignées
              </span>
              <span className="rounded-full bg-white px-3 py-1 border border-zinc-200 text-zinc-700">
                ✧ Aura & confiance
              </span>
            </div>
          </div>

          {/* Colonne droite : cartes “manifesto” plus dynamiques */}
          <div className="space-y-4 text-sm sm:text-base">
            <div className="rounded-2xl border border-zinc-200 bg-white/90 px-4 py-4 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-yellow-200">
              <h3 className="font-medium mb-1 text-zinc-900 flex items-center gap-2">
                <span className="text-yellow-500">①</span> Pensé comme une signature
              </h3>
              <p className="text-zinc-600">
                Chaque pièce Mawaura est conçue pour s&apos;accorder à votre style
                naturel, pas pour le remplacer. Vous restez le centre, le bijou
                souligne votre présence.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white/90 px-4 py-4 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-yellow-200">
              <h3 className="font-medium mb-1 text-zinc-900 flex items-center gap-2">
                <span className="text-yellow-500">②</span> Confort & légèreté
              </h3>
              <p className="text-zinc-600">
                Des pièces pensées pour être portées du matin au soir : légères,
                agréables sur la peau, faciles à associer à vos tenues du quotidien.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white/90 px-4 py-4 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-yellow-200">
              <h3 className="font-medium mb-1 text-zinc-900 flex items-center gap-2">
                <span className="text-yellow-500">③</span> Une vision à long terme
              </h3>
              <p className="text-zinc-600">
                Notre objectif : construire un e-shop de référence pour des bijoux
                accessibles, élégants et durables, avec une expérience en ligne simple
                et soignée.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-zinc-500">
          <p>© 2025 Mawaura Accessories. Tous droits réservés.</p>
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
