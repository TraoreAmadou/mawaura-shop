"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  priceCents: number;
  category: string | null;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: string;
  mainImageUrl?: string | null;
};

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    price: "",
    category: "",
    description: "",
    isFeatured: false,
  });
  const [saving, setSaving] = useState(false);

  const isAdmin = (session?.user as any)?.role === "ADMIN";

  useEffect(() => {
    if (!isAdmin) return;
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);
        const res = await fetch("/api/admin/products");
        const data = await res.json();
        if (!res.ok) {
          setError(data?.error || "Erreur lors du chargement des produits.");
          return;
        }
        setProducts(data);
      } catch (err) {
        console.error(err);
        setError("Erreur lors du chargement des produits.");
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, [isAdmin]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type, checked } = e.target as any;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const formEl = e.currentTarget;
      const formData = new FormData(formEl);

      // on force la valeur booléenne dans le FormData
      formData.set("isFeatured", form.isFeatured ? "true" : "false");

      const res = await fetch("/api/admin/products", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Erreur lors de la création du produit.");
        return;
      }
      setProducts((prev) => [data, ...prev]);

      // reset
      formEl.reset();
      setForm({
        name: "",
        price: "",
        category: "",
        description: "",
        isFeatured: false,
      });
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la création du produit.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce produit ?")) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.error || "Erreur lors de la suppression.");
        return;
      }
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la suppression.");
    }
  };

  if (status === "loading") {
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
              <span className="text-zinc-700 font-medium">Admin</span>
            </nav>
          </div>
          <span className="inline-flex items-center rounded-full border border-zinc-900 px-3 py-1 text-[10px] uppercase tracking-[0.2em] bg-zinc-900 text-white">
            Back-office
          </span>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
          Gestion des bijoux
        </h1>

        {/* Formulaire création produit */}
        <div className="border border-zinc-200 rounded-2xl p-5 sm:p-6 bg-white shadow-sm">
          <h2 className="text-sm font-semibold mb-3">
            Ajouter un nouveau bijou
          </h2>
          {error && (
            <p className="mb-3 text-xs sm:text-sm text-red-600">{error}</p>
          )}
          <form
            onSubmit={handleCreate}
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
                placeholder="Ex : Boucles d’oreilles Aura"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium uppercase tracking-[0.16em] text-zinc-600">
                Prix (en €) *
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
                placeholder="Ex : 29.90"
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
                placeholder="Ex : Boucles d’oreilles"
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
                placeholder="Une phrase qui décrit le bijou..."
              />
            </div>

            {/* ✅ upload d’images (max 5) */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-xs font-medium uppercase tracking-[0.16em] text-zinc-600">
                Images du bijou (jusqu&apos;à 5)
              </label>
              <p className="text-[11px] text-zinc-500 mb-1">
                Uploadez vos images produits. La première image sera utilisée
                comme visuel principal sur la boutique.
              </p>
              <input
                name="images"
                type="file"
                accept="image/*"
                multiple
                className="block w-full text-xs text-zinc-600 file:mr-3 file:rounded-full file:border file:border-zinc-300 file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-zinc-700 hover:file:border-zinc-500"
              />
            </div>

            <div className="flex items-center gap-2 sm:col-span-2">
              <input
                id="isFeatured"
                name="isFeatured"
                type="checkbox"
                checked={form.isFeatured}
                onChange={handleChange}
                className="h-4 w-4 rounded border-zinc-300 text-zinc-900"
              />
              <label
                htmlFor="isFeatured"
                className="text-xs sm:text-sm text-zinc-600"
              >
                Mettre en avant ce bijou (pièce phare / collection spéciale)
              </label>
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center rounded-full border border-zinc-900 bg-zinc-900 px-6 py-2.5 text-xs font-medium uppercase tracking-[0.2em] text-white hover:bg-white hover:text-zinc-900 transition-colors disabled:opacity-60"
              >
                {saving ? "Enregistrement..." : "Ajouter le bijou"}
              </button>
            </div>
          </form>
        </div>

        {/* Liste produits */}
        <div className="border border-zinc-200 rounded-2xl p-5 sm:p-6 bg-white shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">
              Catalogue actuel ({products.length})
            </h2>
          </div>

          {loadingProducts ? (
            <p className="text-xs sm:text-sm text-zinc-500">
              Chargement des produits...
            </p>
          ) : products.length === 0 ? (
            <p className="text-xs sm:text-sm text-zinc-500">
              Aucun bijou enregistré pour l&apos;instant.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                    <th className="py-2 pr-3 text-left">Nom</th>
                    <th className="py-2 px-3 text-left">Prix</th>
                    <th className="py-2 px-3 text-left hidden sm:table-cell">
                      Catégorie
                    </th>
                    <th className="py-2 px-3 text-left hidden md:table-cell">
                      Mise en avant
                    </th>
                    <th className="py-2 pl-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-zinc-100 hover:bg-zinc-50"
                    >
                      <td className="py-2 pr-3">
                        <div className="font-medium text-zinc-800">
                          {p.name}
                        </div>
                        {p.description && (
                          <div className="text-[11px] text-zinc-500 line-clamp-1">
                            {p.description}
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-3 text-zinc-700">
                        {(p.priceCents / 100).toFixed(2)} €
                      </td>
                      <td className="py-2 px-3 text-zinc-600 hidden sm:table-cell">
                        {p.category || "—"}
                      </td>
                      <td className="py-2 px-3 hidden md:table-cell">
                        {p.isFeatured ? (
                          <span className="inline-flex items-center rounded-full bg-zinc-900 text-white px-2 py-0.5 text-[10px] uppercase tracking-[0.16em]">
                            En avant
                          </span>
                        ) : (
                          <span className="text-[11px] text-zinc-400">—</span>
                        )}
                      </td>
                      <td className="py-2 pl-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(p.id)}
                          className="text-[11px] text-red-500 hover:text-red-600"
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
