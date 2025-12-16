"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { formatXOF } from "@/lib/money";

type ProductImage = {
  id: string;
  url: string;
  position: number;
};

type ProductDetails = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  priceCents: number;
  category: string | null;
  isFeatured: boolean;
  isActive: boolean;
  isNew: boolean;
  isBestSeller: boolean;
  tag: string | null;
  stock: number;
  lowStockThreshold: number;
  mainImageUrl?: string | null;
  images: ProductImage[];
};

export default function EditProductPage() {
  const { data: session, status } = useSession();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const productId = params.id;

  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    price: "",
    category: "",
    description: "",
    isFeatured: false,
    isNew: false,
    isBestSeller: false,
    isActive: true,
    tag: "",
    stock: "",
    lowStockThreshold: "3",
  });

  const isAdmin = (session?.user as any)?.role === "ADMIN";

  useEffect(() => {
    if (!isAdmin || !productId) return;

    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/products/${productId}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data?.error || "Erreur lors du chargement du produit.");
          return;
        }
        setProduct(data);
        setForm({
          name: data.name || "",
          price: (data.priceCents / 100).toString(),
          category: data.category || "",
          description: data.description || "",
          isFeatured: data.isFeatured,
          isNew: data.isNew,
          isBestSeller: data.isBestSeller,
          isActive: data.isActive,
          tag: data.tag || "",
          stock: data.stock.toString(),
          lowStockThreshold: data.lowStockThreshold.toString(),
        });
      } catch (err) {
        console.error(err);
        setError("Erreur lors du chargement du produit.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [isAdmin, productId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type, checked } = e.target as any;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!productId) return;
    setError(null);
    setSaving(true);
    try {
      const formEl = e.currentTarget;
      const formData = new FormData(formEl);

      formData.set("isFeatured", form.isFeatured ? "true" : "false");
      formData.set("isNew", form.isNew ? "true" : "false");
      formData.set("isBestSeller", form.isBestSeller ? "true" : "false");
      formData.set("isActive", form.isActive ? "true" : "false");

      formData.set("stock", form.stock || "0");
      formData.set("lowStockThreshold", form.lowStockThreshold || "0");
      formData.set("tag", form.tag || "");

      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "PUT",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Erreur lors de la mise à jour du produit.");
        return;
      }

      // Retour au back-office
      router.push("/admin");
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la mise à jour du produit.");
    } finally {
      setSaving(false);
    }
  };

  const getImageByPosition = (position: number) => {
    if (!product) return undefined;
    return product.images.find((img) => img.position === position);
  };

  if (status === "loading" || (loading && !product)) {
    return (
      <main className="min-h-screen bg-white text-zinc-900 flex items-center justify-center">
        <p className="text-sm text-zinc-500">Chargement...</p>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-white text-zinc-900 flex items-center justify-center">
        <div className="text-center px-4">
          <h1 className="text-xl sm:text-2xl font-semibold mb-2">
            Accès réservé
          </h1>
          <p className="text-sm sm:text-base text-zinc-600 mb-4">
            Cette page est réservée aux administrateurs Mawaura.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-zinc-900 bg-zinc-900 px-5 py-2.5 text-xs sm:text-sm font-medium uppercase tracking-[0.18em] text-white hover:bg-white hover:text-zinc-900 transition-colors"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-white text-zinc-900 flex items-center justify-center">
        <p className="text-sm text-zinc-500">
          Produit introuvable ou erreur de chargement.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-zinc-900">
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
              <Link href="/compte" className="hover:text-zinc-800">
                Mon compte
              </Link>
              <span>/</span>
              <Link href="/admin" className="hover:text-zinc-800">
                Admin
              </Link>
              <span>/</span>
              <span className="text-zinc-700 font-medium">Édition produit</span>
            </nav>
          </div>
          <Link
            href="/admin"
            className="text-xs sm:text-sm text-zinc-500 hover:text-zinc-800"
          >
            ← Retour au back-office
          </Link>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
          Modifier le bijou
        </h1>

        {error && (
          <p className="mb-3 text-xs sm:text-sm text-red-600">{error}</p>
        )}

        <form
          onSubmit={handleSubmit}
          encType="multipart/form-data"
          className="grid gap-4 sm:grid-cols-2 text-sm"
        >
          <div className="space-y-1.5 sm:col-span-2">
            <label className="block text-xs font-medium uppercase tracking-[0.16em] text-zinc-600">
              Nom du bijou *
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:border-zinc-900"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium uppercase tracking-[0.16em] text-zinc-600">
              {/* Prix (en €) * */}
              Prix (en XOF) *
            </label>
            <input
              name="price"
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:border-zinc-900"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium uppercase tracking-[0.16em] text-zinc-600">
              Catégorie
            </label>
            <input
              name="category"
              value={form.category}
              onChange={handleChange}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:border-zinc-900"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="block text-xs font-medium uppercase tracking-[0.16em] text-zinc-600">
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:border-zinc-900 min-h-[60px]"
            />
          </div>

          {/* Images existantes / remplacement */}
          <div className="sm:col-span-2 space-y-3">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-600">
              Images du produit
            </p>
            <p className="text-[11px] text-zinc-500">
              Vous pouvez remplacer une image existante en sélectionnant un
              fichier. Si vous ne choisissez pas de fichier pour une image, elle
              sera conservée. Maximum 5 images.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 5 }).map((_, position) => {
                const image = getImageByPosition(position);
                return (
                  <div
                    key={position}
                    className="border border-zinc-200 rounded-xl p-3 space-y-2"
                  >
                    <p className="text-[11px] text-zinc-500">
                      Image {position + 1}
                      {position === 0 && " (image principale)"}
                    </p>
                    {image ? (
                      <div className="aspect-[4/5] overflow-hidden rounded-lg bg-zinc-50 border border-zinc-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={image.url}
                          alt={`Image ${position + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="aspect-[4/5] rounded-lg bg-zinc-50 border border-dashed border-zinc-200 flex items-center justify-center text-[11px] text-zinc-400">
                        Aucune image
                      </div>
                    )}
                    <input
                      type="file"
                      name={`image${position}`}
                      accept="image/*"
                      className="block w-full text-[11px] text-zinc-600 file:mr-2 file:rounded-full file:border file:border-zinc-300 file:bg-white file:px-2.5 file:py-1 file:text-[11px] file:font-medium file:text-zinc-700 hover:file:border-zinc-500"
                    />
                    <p className="text-[10px] text-zinc-400">
                      {image
                        ? "Choisissez un fichier pour remplacer cette image."
                        : "Choisissez un fichier pour ajouter une image à cette position."}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stock */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium uppercase tracking-[0.16em] text-zinc-600">
              Stock disponible
            </label>
            <input
              name="stock"
              type="number"
              min="0"
              value={form.stock}
              onChange={handleChange}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:border-zinc-900"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium uppercase tracking-[0.16em] text-zinc-600">
              Seuil “Derniers exemplaires”
            </label>
            <input
              name="lowStockThreshold"
              type="number"
              min="0"
              value={form.lowStockThreshold}
              onChange={handleChange}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:border-zinc-900"
            />
            <p className="text-[11px] text-zinc-500">
              Quand le stock est inférieur ou égal à ce seuil, le badge
              “Derniers exemplaires” sera affiché.
            </p>
          </div>

          {/* Tag libre */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="block text-xs font-medium uppercase tracking-[0.16em] text-zinc-600">
              Tag personnalisé (optionnel)
            </label>
            <input
              name="tag"
              value={form.tag}
              onChange={handleChange}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:border-zinc-900"
              placeholder='Ex : "Édition limitée", "Coup de cœur", etc.'
            />
          </div>

          {/* Flags */}
          <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label className="inline-flex items-center gap-2 text-xs sm:text-sm text-zinc-700">
              <input
                type="checkbox"
                name="isFeatured"
                checked={form.isFeatured}
                onChange={handleChange}
                className="h-4 w-4 rounded border-zinc-300 text-zinc-900"
              />
              <span>Mettre en avant ce bijou (pièce phare)</span>
            </label>

            <label className="inline-flex items-center gap-2 text-xs sm:text-sm text-zinc-700">
              <input
                type="checkbox"
                name="isNew"
                checked={form.isNew}
                onChange={handleChange}
                className="h-4 w-4 rounded border-zinc-300 text-zinc-900"
              />
              <span>Marquer comme “Nouveau”</span>
            </label>

            <label className="inline-flex items-center gap-2 text-xs sm:text-sm text-zinc-700">
              <input
                type="checkbox"
                name="isBestSeller"
                checked={form.isBestSeller}
                onChange={handleChange}
                className="h-4 w-4 rounded border-zinc-300 text-zinc-900"
              />
              <span>Marquer comme “Best-seller”</span>
            </label>

            <label className="inline-flex items-center gap-2 text-xs sm:text-sm text-zinc-700">
              <input
                type="checkbox"
                name="isActive"
                checked={form.isActive}
                onChange={handleChange}
                className="h-4 w-4 rounded border-zinc-300 text-zinc-900"
              />
              <span>Produit actif (affiché sur le site)</span>
            </label>
          </div>

          <div className="sm:col-span-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center rounded-full border border-zinc-900 bg-zinc-900 px-6 py-2.5 text-xs font-medium uppercase tracking-[0.2em] text-white hover:bg-white hover:text-zinc-900 transition-colors disabled:opacity-60"
            >
              {saving ? "Enregistrement..." : "Sauvegarder les modifications"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/admin")}
              className="text-xs sm:text-sm text-zinc-500 hover:text-zinc-800"
            >
              Annuler
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
