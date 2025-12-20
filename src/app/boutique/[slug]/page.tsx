"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "../../cart-context";
import { useFavorites } from "../../favorites-context";
import { formatXOF } from "@/lib/money";

type ProductImage = {
  id: string;
  url: string;
  position: number;
};

type ProductDetail = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  category?: string | null;
  price: number;
  isFeatured?: boolean;
  // nouveaux champs (tous optionnels pour être compatibles)
  isNew?: boolean;
  isBestSeller?: boolean;
  tag?: string | null;
  mainImageUrl?: string | null;
  imageUrl?: string | null; // compat ancien champ
  stock?: number | null;
  lowStockThreshold?: number | null;
  isActive?: boolean | null;
  images: ProductImage[];
};

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const { addItem } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!slug) return;

    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/products/${slug}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data?.error || "Produit introuvable.");
          return;
        }
        setProduct(data);
        setCurrentIndex(0);
      } catch (err) {
        console.error(err);
        setError("Erreur lors du chargement du produit.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  const imagesForDisplay = useMemo(() => {
    if (!product) return [];
    if (product.images && product.images.length > 0) {
      return product.images;
    }
    const fallback = product.mainImageUrl || product.imageUrl;
    if (fallback) {
      return [{ id: "main", url: fallback, position: 0 }];
    }
    return [];
  }, [product]);

  useEffect(() => {
    if (!imagesForDisplay.length) {
      setCurrentIndex(0);
      return;
    }
    if (currentIndex >= imagesForDisplay.length) {
      setCurrentIndex(0);
    }
  }, [imagesForDisplay, currentIndex]);

  const handlePrev = () => {
    if (!imagesForDisplay.length) return;
    setCurrentIndex((prev) =>
      prev === 0 ? imagesForDisplay.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    if (!imagesForDisplay.length) return;
    setCurrentIndex((prev) =>
      prev === imagesForDisplay.length - 1 ? 0 : prev + 1
    );
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-white text-zinc-900 flex items-center justify-center">
        <p className="text-sm text-zinc-500">Chargement du bijou...</p>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="min-h-screen bg-white text-zinc-900 flex items-center justify-center">
        <div className="text-center px-4">
          <h1 className="text-xl sm:text-2xl font-semibold mb-2">
            Bijou introuvable
          </h1>
          <p className="text-sm sm:text-base text-zinc-600 mb-4">
            Ce bijou n&apos;est plus disponible ou l&apos;adresse est incorrecte.
          </p>
          <Link
            href="/boutique"
            className="inline-flex items-center justify-center rounded-full border border-zinc-900 bg-zinc-900 px-5 py-2.5 text-xs sm:text-sm font-medium uppercase tracking-[0.18em] text-white hover:bg-white hover:text-zinc-900 transition-colors"
          >
            Retour à la boutique
          </Link>
        </div>
      </main>
    );
  }

  const favorite = isFavorite(product.id);
  const displayImageUrl =
    product.mainImageUrl ||
    product.imageUrl ||
    imagesForDisplay[0]?.url ||
    undefined;

  // ✅ Gestion propre de la disponibilité & du stock

  // Indisponible seulement si isActive === false (si undefined => on considère comme disponible)
  const isUnavailable = product.isActive === false;

  const stock = typeof product.stock === "number" ? product.stock : null;
  const lowStockThreshold =
    typeof product.lowStockThreshold === "number"
      ? product.lowStockThreshold
      : null;

  // Rupture de stock uniquement si on a une info de stock ET que stock === 0
  const isOutOfStock = !isUnavailable && stock !== null && stock === 0;

  // Derniers exemplaires uniquement si stock et seuil sont définis
  const isLowStock =
    !isUnavailable &&
    stock !== null &&
    lowStockThreshold !== null &&
    stock > 0 &&
    stock <= lowStockThreshold;

  const disableAddToCart = isUnavailable || isOutOfStock;

  return (
    <main className="min-h-screen bg-white text-zinc-900">
      {/* Header / breadcrumb */}
      <header className="border-b border-zinc-200 bg-zinc-50/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <p className="tracking-[0.25em] uppercase text-[11px] text-zinc-500">
              MAWAURA ACCESSORIES
            </p>
            <nav className="text-xs sm:text-sm text-zinc-500 mt-1 flex flex-wrap items-center gap-1">
              <Link href="/" className="hover:text-zinc-800">
                Accueil
              </Link>
              <span>/</span>
              <Link href="/boutique" className="hover:text-zinc-800">
                Boutique
              </Link>
              <span>/</span>
              <span className="text-zinc-700 font-medium line-clamp-1 max-w-[200px] sm:max-w-xs">
                {product.name}
              </span>
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

      {/* Contenu principal */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 grid gap-10 md:grid-cols-[1.2fr,0.8fr] items-start">
        {/* Colonne gauche : carrousel */}
        <div className="space-y-4">
          <div className="relative w-full max-w-lg lg:max-w-xl mx-auto aspect-[3/4]">
            {imagesForDisplay.length > 0 ? (
              <>
                <Image
                  key={imagesForDisplay[currentIndex].id}
                  src={imagesForDisplay[currentIndex].url}
                  alt={product.name}
                  fill
                  className="object-contain"
                  sizes="(min-width: 1024px) 50vw, 100vw"
                />

                {imagesForDisplay.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={handlePrev}
                      className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 border border-zinc-200 w-8 h-8 flex items-center justify-center text-xs text-zinc-700 hover:bg-white"
                      aria-label="Image précédente"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 border border-zinc-200 w-8 h-8 flex items-center justify-center text-xs text-zinc-700 hover:bg-white"
                      aria-label="Image suivante"
                    >
                      ›
                    </button>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-[11px] uppercase tracking-[0.2em] text-zinc-400">
                  Visuel en préparation
                </span>
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {imagesForDisplay.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {imagesForDisplay.map((img, index) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setCurrentIndex(index)}
                  className={`relative flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl border overflow-hidden ${
                    index === currentIndex
                      ? "border-zinc-900"
                      : "border-zinc-200 hover:border-zinc-400"
                  }`}
                >
                  <Image
                    src={img.url}
                    alt={`${product.name} miniature ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Colonne droite : infos produit */}
        <div className="space-y-4">
          {product.category && (
            <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
              {product.category}
            </p>
          )}

          {/* Titre + gros badges (Nouveau / Best-seller) */}
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              {product.name}
            </h1>
            <div className="flex flex-wrap gap-2">
              {product.isNew && (
                <span className="inline-flex items-center rounded-full bg-zinc-900 text-white px-3 py-1.5 text-[11px] uppercase tracking-[0.22em]">
                  Nouveau
                </span>
              )}
              {product.isBestSeller && (
                <span className="inline-flex items-center rounded-full bg-white text-zinc-900 px-3 py-1.5 text-[11px] uppercase tracking-[0.22em] border border-zinc-300">
                  Best-seller
                </span>
              )}
            </div>
          </div>

          {/* Tag éventuel sous le titre */}
          {product.tag && (
            <p className="text-xs sm:text-sm text-zinc-500">{product.tag}</p>
          )}

          {product.isFeatured && (
            <p className="text-xs sm:text-sm text-yellow-600">
              ✨ Pièce phare de la collection Mawaura.
            </p>
          )}

          {/* Prix + messages de stock */}
          <div className="space-y-1">
            <p className="text-lg sm:text-xl font-semibold text-zinc-900">
              {formatXOF(product.price)}
            </p>

            {isUnavailable && (
              <p className="text-xs sm:text-sm text-red-600 font-medium">
                Indisponible pour le moment.
              </p>
            )}

            {!isUnavailable && isOutOfStock && (
              <p className="text-xs sm:text-sm text-amber-600 font-medium">
                Bientôt de retour.
              </p>
            )}

            {!isUnavailable && isLowStock && stock !== null && (
              <p className="text-xs sm:text-sm text-amber-600 font-medium">
                Derniers exemplaires ({stock} restant{stock > 1 ? "s" : ""}).
              </p>
            )}
          </div>

          {product.description && (
            <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
              {product.description}
            </p>
          )}

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() =>
                addItem({
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  imageUrl: displayImageUrl ?? null,
                })
              }
              disabled={disableAddToCart}
              className="inline-flex items-center justify-center rounded-full border border-yellow-500 bg-yellow-500 px-6 py-2.5 text-xs sm:text-sm font-medium uppercase tracking-[0.2em] text-white hover:bg-white hover:text-yellow-600 hover:border-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {disableAddToCart ? "Indisponible" : "Ajouter au panier"}
            </button>

            <button
              type="button"
              onClick={() =>
                toggleFavorite({
                  id: product.id,
                  slug: product.slug, // ✅ CORRECTION : obligatoire pour FavoriteItem
                  name: product.name,
                  price: product.price,
                  category: product.category,
                  imageUrl: displayImageUrl ?? null,
                })
              }
              className="inline-flex items-center justify-center rounded-full border border-zinc-200 px-4 py-2 text-xs sm:text-sm text-zinc-700 hover:border-yellow-500 hover:bg-yellow-50 transition-colors"
            >
              <span className="mr-1">{favorite ? "♥" : "♡"}</span>
              {favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
            </button>
          </div>

          <div className="pt-4 border-t border-zinc-200 text-xs sm:text-sm text-zinc-500 space-y-1.5">
            <p>• Livraison standard en 3 à 7 jours ouvrés.</p>
            <p>• Paiement sécurisé. Retour possible sous 14 jours.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
