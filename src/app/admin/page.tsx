"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { formatXOF } from "@/lib/money";

type Product = {
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
  createdAt: string;
};

type AdminOrderItem = {
  id: string;
  productId: string;
  quantity: number;
  unitPriceCents: number;
  totalPriceCents: number;
  productNameSnapshot: string;
  productSlugSnapshot?: string | null;
};

type AdminOrder = {
  id: string;
  createdAt: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  totalCents: number;
  email: string;
  customerName?: string | null;
  shippingAddress?: string | null;
  notes?: string | null;
  items: AdminOrderItem[];
};

type RevenueStatusFilter = "CONFIRMED" | "PENDING_AND_CONFIRMED";

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
    isNew: false,
    isBestSeller: false,
    isActive: true,
    tag: "",
    stock: "",
    lowStockThreshold: "3",
  });
  const [saving, setSaving] = useState(false);

  // 🔹 État pour les commandes (dashboard)
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  // 🔹 Filtre : quels statuts entrent dans le calcul du CA
  const [revenueFilter, setRevenueFilter] =
    useState<RevenueStatusFilter>("CONFIRMED");

  // 🔹 Filtre d'année pour les graphiques
  const [selectedYear, setSelectedYear] = useState<string>("ALL");

  const isAdmin = (session?.user as any)?.role === "ADMIN";

  useEffect(() => {
    if (!isAdmin) return;

    let cancelled = false;

    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);
        const res = await fetch("/api/admin/products");
        const data = await res.json();
        if (!res.ok) {
          if (!cancelled) {
            setError(data?.error || "Erreur lors du chargement des produits.");
          }
          return;
        }
        if (!cancelled) {
          setProducts(data);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError("Erreur lors du chargement des produits.");
        }
      } finally {
        if (!cancelled) {
          setLoadingProducts(false);
        }
      }
    };

    const fetchOrders = async () => {
      try {
        setLoadingOrders(true);
        setOrdersError(null);
        const res = await fetch("/api/admin/orders");
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          if (!cancelled) {
            setOrdersError(
              data?.error || "Erreur lors du chargement des commandes."
            );
          }
          return;
        }
        if (!cancelled) {
          setOrders(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setOrdersError("Erreur réseau lors du chargement des commandes.");
        }
      } finally {
        if (!cancelled) {
          setLoadingOrders(false);
        }
      }
    };

    fetchProducts();
    fetchOrders();

    return () => {
      cancelled = true;
    };
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

      // ✅ booleans
      formData.set("isFeatured", form.isFeatured ? "true" : "false");
      formData.set("isNew", form.isNew ? "true" : "false");
      formData.set("isBestSeller", form.isBestSeller ? "true" : "false");
      formData.set("isActive", form.isActive ? "true" : "false");

      // ✅ nombres / textes
      formData.set("stock", form.stock || "0");
      formData.set("lowStockThreshold", form.lowStockThreshold || "0");
      formData.set("tag", form.tag || "");

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
        isNew: false,
        isBestSeller: false,
        isActive: true,
        tag: "",
        stock: "",
        lowStockThreshold: "3",
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

  const computeStatusLabel = (p: Product) => {
    if (!p.isActive) return "Désactivé";
    if (p.stock <= 0) return "Indisponible";
    if (p.stock <= p.lowStockThreshold) return "Derniers exemplaires";
    return "En stock";
  };

  // 🔹 Statistiques commandes globales (peu importe filtre CA)
  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => o.status === "PENDING").length;

  // 🔹 Années disponibles (pour le sélecteur de période)
  const availableYears = Array.from(
    new Set(
      orders.map((o) => {
        const d = new Date(o.createdAt);
        return d.getFullYear();
      })
    )
  ).sort((a, b) => a - b);

  // 🔹 Commandes prises en compte dans le CA selon le filtre de statut
  const filteredOrdersForRevenue = orders.filter((o) => {
    if (o.status === "CANCELLED") return false;
    if (revenueFilter === "CONFIRMED") {
      return o.status === "CONFIRMED";
    }
    // PENDING_AND_CONFIRMED
    return o.status === "PENDING" || o.status === "CONFIRMED";
  });

  // 🔹 On applique l'éventuel filtre d'année pour les graphiques (mais pas pour les tuiles globales)
  const revenueOrdersForCharts = filteredOrdersForRevenue.filter((o) => {
    if (selectedYear === "ALL") return true;
    const d = new Date(o.createdAt);
    return String(d.getFullYear()) === selectedYear;
  });

  const totalRevenue = filteredOrdersForRevenue.reduce(
    (sum, o) => sum + o.totalCents / 100,
    0
  );

  // 🔹 CA mensuel (6 derniers mois) basé sur revenueOrdersForCharts
  const monthlyRevenueMap = new Map<string, number>();

  revenueOrdersForCharts.forEach((order) => {
    const d = new Date(order.createdAt);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0"); // 01-12
    const key = `${year}-${month}`; // ex: 2025-03
    const current = monthlyRevenueMap.get(key) ?? 0;
    monthlyRevenueMap.set(key, current + order.totalCents / 100);
  });

  const monthlyRevenueArray = Array.from(monthlyRevenueMap.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .slice(-6); // 6 derniers mois

  const maxMonthlyRevenue =
    monthlyRevenueArray.reduce(
      (max, [, value]) => (value > max ? value : max),
      0
    ) || 0;

  const formatMonthLabel = (monthKey: string) => {
    // monthKey = "YYYY-MM"
    const [year, month] = monthKey.split("-");
    const d = new Date(Number(year), Number(month) - 1, 1);
    return d.toLocaleDateString("fr-FR", {
      month: "short",
      year: "2-digit",
    });
  };

  const revenueFilterLabel =
    revenueFilter === "CONFIRMED"
      ? "Commandes confirmées uniquement"
      : "En attente + confirmées (hors annulées)";

  // 🔹 CA par catégorie (avec même filtre statut + année)
  const productCategoryMap = new Map<string, string | null>();
  products.forEach((p) => {
    productCategoryMap.set(p.id, p.category);
  });

  const categoryRevenueMap = new Map<string, number>();

  revenueOrdersForCharts.forEach((order) => {
    order.items.forEach((item) => {
      const categoryRaw = productCategoryMap.get(item.productId);
      const category =
        categoryRaw && categoryRaw.trim().length > 0
          ? categoryRaw
          : "Sans catégorie";

      const current = categoryRevenueMap.get(category) ?? 0;
      categoryRevenueMap.set(
        category,
        current + item.totalPriceCents / 100
      );
    });
  });

  const categoryRevenueArray = Array.from(categoryRevenueMap.entries()).sort(
    (a, b) => b[1] - a[1]
  );

  const maxCategoryRevenue =
    categoryRevenueArray.reduce(
      (max, [, value]) => (value > max ? value : max),
      0
    ) || 0;

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
      {/* Header + nav admin */}
      <header className="border-b border-zinc-200 bg-zinc-50/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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

          <div className="flex flex-col items-start sm:items-end gap-2">
            <span className="inline-flex items-center rounded-full border border-zinc-900 px-3 py-1 text-[10px] uppercase tracking-[0.2em] bg-zinc-900 text-white">
              Back-office
            </span>

            {/* Nav interne admin : Produits / Commandes */}
            <nav className="inline-flex items-center gap-1 rounded-full bg-white/80 border border-zinc-200 px-1 py-1 text-[11px] font-medium uppercase tracking-[0.16em]">
              <span className="inline-flex items-center rounded-full bg-zinc-900 text-white px-3 py-1">
                Produits
              </span>
              <Link
                href="/admin/commandes"
                className="inline-flex items-center rounded-full px-3 py-1 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition"
              >
                Commandes
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        {/* 🔹 Mini dashboard commandes */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="border border-zinc-200 rounded-2xl p-4 bg-white/90">
            <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500 mb-1">
              Commandes totales
            </p>
            {loadingOrders ? (
              <p className="text-sm text-zinc-400">Chargement...</p>
            ) : ordersError ? (
              <p className="text-xs text-red-600">{ordersError}</p>
            ) : (
              <p className="text-2xl font-semibold text-zinc-900">
                {totalOrders}
              </p>
            )}
          </div>

          <div className="border border-zinc-200 rounded-2xl p-4 bg-white/90">
            <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500 mb-1">
              En attente
            </p>
            {loadingOrders ? (
              <p className="text-sm text-zinc-400">Chargement...</p>
            ) : ordersError ? (
              <p className="text-xs text-red-600">{ordersError}</p>
            ) : (
              <p className="text-2xl font-semibold text-amber-700">
                {pendingOrders}
              </p>
            )}
          </div>

          <div className="border border-zinc-200 rounded-2xl p-4 bg-white/90">
            <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500 mb-1">
              CA cumulé (filtré)
            </p>
            {loadingOrders ? (
              <p className="text-sm text-zinc-400">Chargement...</p>
            ) : ordersError ? (
              <p className="text-xs text-red-600">{ordersError}</p>
            ) : (
              <>
                <p className="text-2xl font-semibold text-zinc-900">
                  {/* {totalRevenue.toFixed(2).replace(".", ",")} € */} {/* en euro */}
                  {formatXOF(totalRevenue)} {/* en FCFA */}
                </p>
                <p className="mt-1 text-[10px] text-zinc-500">
                  {revenueFilterLabel}
                </p>
              </>
            )}
          </div>
        </div>

        {/* 🔹 Graphiques : CA mensuel + CA par catégorie */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Graphique mensuel */}
          <div className="border border-zinc-200 rounded-2xl p-4 sm:p-5 bg-white/90">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
              <div>
                <h2 className="text-sm font-semibold tracking-tight">
                  Évolution du CA (6 derniers mois)
                </h2>
                <p className="text-[11px] text-zinc-500">
                  Basé sur les commandes selon le filtre.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 justify-end">
                {/* Filtre de statut pour le CA */}
                <div className="inline-flex items-center rounded-full bg-zinc-50 border border-zinc-200 px-1 py-1 text-[11px] font-medium uppercase tracking-[0.16em]">
                  <button
                    type="button"
                    onClick={() => setRevenueFilter("CONFIRMED")}
                    className={`px-3 py-1 rounded-full ${
                      revenueFilter === "CONFIRMED"
                        ? "bg-zinc-900 text-white"
                        : "text-zinc-600 hover:bg-zinc-100"
                    }`}
                  >
                    Confirmées
                  </button>
                  <button
                    type="button"
                    onClick={() => setRevenueFilter("PENDING_AND_CONFIRMED")}
                    className={`px-3 py-1 rounded-full ${
                      revenueFilter === "PENDING_AND_CONFIRMED"
                        ? "bg-zinc-900 text-white"
                        : "text-zinc-600 hover:bg-zinc-100"
                    }`}
                  >
                    En attente + conf.
                  </button>
                </div>

                {/* Sélecteur d'année */}
                <div className="inline-flex items-center gap-1 text-[11px] text-zinc-600">
                  <span>Période</span>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="rounded-full border border-zinc-200 bg-white px-2 py-1 text-[11px] focus:outline-none focus:border-zinc-900"
                  >
                    <option value="ALL">Toutes années</option>
                    {availableYears.map((year) => (
                      <option key={year} value={String(year)}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {loadingOrders ? (
              <p className="text-sm text-zinc-400">
                Chargement des données de commandes...
              </p>
            ) : ordersError ? (
              <p className="text-sm text-red-600">{ordersError}</p>
            ) : monthlyRevenueArray.length === 0 ? (
              <p className="text-sm text-zinc-500">
                Pas encore de commandes (avec ces filtres) pour afficher le
                graphique.
              </p>
            ) : (
              <div className="mt-2">
                <div className="flex items-end gap-2 sm:gap-3 h-40">
                  {monthlyRevenueArray.map(([monthKey, value]) => {
                    const heightPercent =
                      maxMonthlyRevenue > 0
                        ? (value / maxMonthlyRevenue) * 100
                        : 0;

                    return (
                      <div
                        key={monthKey}
                        className="flex-1 flex flex-col items-center justify-end gap-1"
                      >
                        <div className="flex-1 flex items-end w-full">
                          <div
                            className="w-full rounded-t-full bg-zinc-900/80"
                            style={{
                              height: `${Math.max(heightPercent, 8)}%`,
                            }}
                            title={`${formatMonthLabel(
                              monthKey
                            )} — ${formatXOF(value)} `} 
                          />
                        </div>
                        <div className="text-[10px] text-zinc-500 text-center">
                          {formatMonthLabel(monthKey)}
                        </div>
                        <div className="text-[10px] text-zinc-700 text-center">
                          {/* {value.toFixed(0)} € */}
                          {formatXOF(value)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Graphique CA par catégorie */}
          <div className="border border-zinc-200 rounded-2xl p-4 sm:p-5 bg-white/90">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-semibold tracking-tight">
                  CA par catégorie
                </h2>
                <p className="text-[11px] text-zinc-500">
                  Même filtre de statut et d&apos;année que le graphique
                  mensuel.
                </p>
              </div>
            </div>

            {loadingOrders ? (
              <p className="text-sm text-zinc-400">
                Chargement des données de commandes...
              </p>
            ) : ordersError ? (
              <p className="text-sm text-red-600">{ordersError}</p>
            ) : categoryRevenueArray.length === 0 ? (
              <p className="text-sm text-zinc-500">
                Pas encore de données (avec ces filtres) pour afficher le
                graphique.
              </p>
            ) : (
              <div className="mt-2 space-y-2">
                {categoryRevenueArray.map(([category, value]) => {
                  const widthPercent =
                    maxCategoryRevenue > 0
                      ? (value / maxCategoryRevenue) * 100
                      : 0;

                  return (
                    <div
                      key={category}
                      className="flex items-center gap-2"
                    >
                      <div className="w-24 sm:w-32 text-[10px] text-zinc-600 truncate">
                        {category}
                      </div>
                      <div className="flex-1 h-4 rounded-full bg-zinc-100 overflow-hidden">
                        <div
                          className="h-full bg-zinc-900/80"
                          style={{
                            width: `${Math.max(widthPercent, 5)}%`,
                          }}
                          title={`${category} — ${formatXOF(value)}`}
                        />
                      </div>
                      <div className="w-14 text-right text-[10px] text-zinc-700">
                        {/* {value.toFixed(0)} € */}
                        {formatXOF(value)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

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
                {/* Prix (en €) * */}
                Prix (en FCFA) *
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
                placeholder="Ex : 5000"
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

            {/* Images */}
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
                placeholder="Ex : 10"
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
                placeholder="Ex : 3"
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
              <p className="text-[11px] text-zinc-500">
                Ce tag s’ajoute aux badges automatiques (stock, nouveau,
                best-seller…).
              </p>
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
                      Stock
                    </th>
                    <th className="py-2 px-3 text-left hidden md:table-cell">
                      Statut
                    </th>
                    <th className="py-2 px-3 text-left hidden md:table-cell">
                      Badges
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
                        {/* {(p.priceCents / 100).toFixed(2)} € */}
                        {formatXOF(p.priceCents / 100)}
                      </td>
                      <td className="py-2 px-3 text-zinc-600 hidden sm:table-cell">
                        {p.category || "—"}
                      </td>
                      <td className="py-2 px-3 text-zinc-700 hidden md:table-cell">
                        {p.stock}
                      </td>
                      <td className="py-2 px-3 hidden md:table-cell">
                        <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-zinc-700">
                          {computeStatusLabel(p)}
                        </span>
                      </td>
                      <td className="py-2 px-3 hidden md:table-cell space-x-1">
                        {p.isFeatured && (
                          <span className="inline-flex items-center rounded-full bg-zinc-900 text-white px-2 py-0.5 text-[10px] uppercase tracking-[0.16em]">
                            Phare
                          </span>
                        )}
                        {p.isNew && (
                          <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em]">
                            Nouveau
                          </span>
                        )}
                        {p.isBestSeller && (
                          <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em]">
                            Best-seller
                          </span>
                        )}
                        {p.tag && (
                          <span className="inline-flex items-center rounded-full bg-zinc-100 text-zinc-700 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em]">
                            {p.tag}
                          </span>
                        )}
                      </td>
                      <td className="py-2 pl-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/produits/${p.id}`}
                            className="text-[11px] text-zinc-500 hover:text-zinc-900"
                          >
                            Éditer
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(p.id)}
                            className="text-[11px] text-red-500 hover:text-red-600"
                          >
                            Supprimer
                          </button>
                        </div>
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
