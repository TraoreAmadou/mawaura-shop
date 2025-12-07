"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

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

function getStatusBadge(order: AdminOrder) {
  switch (order.status) {
    case "CONFIRMED":
      return {
        label: "Confirmée",
        className:
          "inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[10px] font-medium",
      };
    case "CANCELLED":
      return {
        label: "Annulée",
        className:
          "inline-flex items-center gap-1 rounded-full bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 text-[10px] font-medium",
      };
    default:
      return {
        label: "En attente",
        className:
          "inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 text-[10px] font-medium",
      };
  }
}

export default function AdminOrdersPage() {
  const { data: session, status } = useSession();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = (session?.user as any)?.role === "ADMIN";

  useEffect(() => {
    if (!isAdmin) return;

    let cancelled = false;

    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/admin/orders");
        const data = await res.json().catch(() => null);

        if (!res.ok) {
          const message =
            data?.error ||
            "Impossible de charger les commandes pour le moment.";
          if (!cancelled) setError(message);
          return;
        }

        if (!cancelled) {
          setOrders(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError(
            "Une erreur réseau est survenue lors du chargement des commandes."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchOrders();

    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

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
            className="inline-flex items-center justify-center rounded-full border border-zinc-900 bg-zinc-900 px-6 py-2 text-xs sm:text-sm font-medium uppercase tracking-[0.18em] text-white hover:bg-zinc-800 transition"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </main>
    );
  }

  const totalOrders = orders.length;
  const totalAmountEuros = orders.reduce(
    (sum, o) => sum + o.totalCents / 100,
    0
  );

  return (
    <main className="min-h-screen bg-white text-zinc-900">
      <section className="border-b border-zinc-200 bg-zinc-50/60">
        <div className="max-w-5xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500 mb-1">
              Administration
            </p>
            <h1 className="text-lg sm:text-xl font-semibold tracking-tight">
              Commandes
            </h1>
          </div>
          <Link
            href="/admin"
            className="text-[11px] text-zinc-500 hover:text-zinc-800"
          >
            ← Retour produits
          </Link>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-8 sm:py-10 space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="border border-zinc-200 rounded-2xl p-4 bg-white/80">
            <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500 mb-1">
              Nombre de commandes
            </p>
            <p className="text-xl font-semibold text-zinc-900">
              {totalOrders}
            </p>
          </div>
          <div className="border border-zinc-200 rounded-2xl p-4 bg-white/80">
            <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500 mb-1">
              Montant total (approx.)
            </p>
            <p className="text-xl font-semibold text-zinc-900">
              {totalAmountEuros.toFixed(2).replace(".", ",")} €
            </p>
          </div>
          <div className="border border-zinc-200 rounded-2xl p-4 bg-white/80">
            <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500 mb-1">
              En attente
            </p>
            <p className="text-xl font-semibold text-zinc-900">
              {
                orders.filter((o) => o.status === "PENDING")
                  .length
              }
            </p>
          </div>
        </div>

        <div className="border border-zinc-200 rounded-3xl bg-white/80 overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-200 flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight">
              Toutes les commandes
            </h2>
            <span className="text-[11px] text-zinc-500">
              Triées de la plus récente à la plus ancienne
            </span>
          </div>

          {loading ? (
            <div className="p-4 text-sm text-zinc-500">
              Chargement des commandes...
            </div>
          ) : error ? (
            <div className="p-4 text-sm text-red-600">{error}</div>
          ) : orders.length === 0 ? (
            <div className="p-4 text-sm text-zinc-500">
              Aucune commande pour le moment.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-zinc-50">
                  <tr className="border-b border-zinc-200">
                    <th className="py-2.5 pl-4 pr-2 font-medium text-zinc-500">
                      Date
                    </th>
                    <th className="py-2.5 px-2 font-medium text-zinc-500">
                      Client
                    </th>
                    <th className="py-2.5 px-2 font-medium text-zinc-500">
                      Articles
                    </th>
                    <th className="py-2.5 px-2 font-medium text-zinc-500">
                      Total
                    </th>
                    <th className="py-2.5 px-2 font-medium text-zinc-500">
                      Statut
                    </th>
                    <th className="py-2.5 pr-4 pl-2 font-medium text-right text-zinc-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const date = new Date(order.createdAt);
                    const dateStr = date.toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    });
                    const totalEuros = order.totalCents / 100;
                    const itemsCount = order.items.length;
                    const totalQty = order.items.reduce(
                      (sum, item) => sum + item.quantity,
                      0
                    );
                    const badge = getStatusBadge(order);

                    return (
                      <tr
                        key={order.id}
                        className="border-b border-zinc-100 last:border-b-0"
                      >
                        <td className="py-2.5 pl-4 pr-2 align-top whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-medium text-zinc-900">
                              {dateStr}
                            </span>
                            <span className="text-[11px] text-zinc-500">
                              n° {order.id.slice(0, 8)}…
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-2 align-top">
                          <div className="text-xs text-zinc-800">
                            {order.customerName || "Client Mawaura"}
                          </div>
                          <div className="text-[11px] text-zinc-500 break-all">
                            {order.email}
                          </div>
                        </td>
                        <td className="py-2.5 px-2 align-top text-[11px] text-zinc-600">
                          {itemsCount} article
                          {itemsCount > 1 ? "s" : ""} · {totalQty} pièce
                          {totalQty > 1 ? "s" : ""}
                        </td>
                        <td className="py-2.5 px-2 align-top whitespace-nowrap">
                          <span className="font-medium text-zinc-900">
                            {totalEuros.toFixed(2).replace(".", ",")} €
                          </span>
                        </td>
                        <td className="py-2.5 px-2 align-top">
                          <span className={badge.className}>
                            <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                            <span>{badge.label}</span>
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 pl-2 align-top text-right">
                          <Link
                            href={`/admin/commandes/${order.id}`}
                            className="text-[11px] text-zinc-600 hover:text-zinc-900"
                          >
                            Voir le détail →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
