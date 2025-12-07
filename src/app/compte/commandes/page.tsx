"use client";
// Nouveau fichier pour la liste complète des commandes :
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

type ApiOrderItem = {
  id: string;
  productId: string;
  quantity: number;
  unitPriceCents: number;
  totalPriceCents: number;
  productNameSnapshot: string;
  productSlugSnapshot?: string | null;
};

type ApiOrder = {
  id: string;
  createdAt: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  totalCents: number;
  email: string;
  customerName?: string | null;
  items: ApiOrderItem[];
};

function getStatusBadge(status: ApiOrder["status"]) {
  switch (status) {
    case "CONFIRMED":
      return {
        label: "Confirmée",
        className:
          "inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700",
      };
    case "CANCELLED":
      return {
        label: "Annulée",
        className:
          "inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-700",
      };
    default:
      return {
        label: "En attente",
        className:
          "inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700",
      };
  }
}

export default function CommandesPage() {
  const { data: session, status } = useSession();
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;

    let cancelled = false;

    async function loadOrders() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/orders");
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          const message =
            data?.error ||
            "Impossible de charger vos commandes pour le moment.";
          if (!cancelled) setError(message);
          return;
        }
        const data = (await res.json()) as ApiOrder[];
        if (!cancelled) {
          setOrders(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Erreur chargement commandes:", err);
        if (!cancelled) {
          setError(
            "Une erreur réseau est survenue lors du chargement de vos commandes."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadOrders();

    return () => {
      cancelled = true;
    };
  }, [status]);

  if (status === "loading") {
    return (
      <main className="min-h-screen bg-white text-zinc-900 flex items-center justify-center">
        <p className="text-sm text-zinc-500">
          Chargement de votre espace...
        </p>
      </main>
    );
  }

  if (status !== "authenticated" || !session) {
    return (
      <main className="min-h-screen bg-white text-zinc-900">
        <section className="max-w-3xl mx-auto px-4 py-16 sm:py-20 text-center">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight mb-3">
            Mes commandes
          </h1>
          <p className="text-sm text-zinc-600 mb-6">
            Connectez-vous pour accéder à l&apos;historique de vos commandes.
          </p>
          <Link
            href="/connexion"
            className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-6 py-2.5 text-[11px] font-medium uppercase tracking-[0.2em] text-white hover:bg-zinc-800 transition"
          >
            Se connecter
          </Link>
        </section>
      </main>
    );
  }

  const hasOrders = orders.length > 0;

  return (
    <main className="min-h-screen bg-white text-zinc-900">
      <header className="border-b border-zinc-200 bg-zinc-50/60">
        <div className="max-w-5xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500 mb-1">
              Mon compte
            </p>
            <h1 className="text-lg sm:text-xl font-semibold tracking-tight">
              Mes commandes
            </h1>
          </div>
          <Link
            href="/compte"
            className="text-[11px] text-zinc-500 hover:text-zinc-800"
          >
            ← Retour au compte
          </Link>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-4 py-8 sm:py-10">
        {loading ? (
          <p className="text-sm text-zinc-500">
            Chargement de vos commandes...
          </p>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : !hasOrders ? (
          <div className="border border-dashed border-zinc-200 rounded-3xl p-6 sm:p-8 bg-zinc-50/60 text-center">
            <p className="text-sm text-zinc-600">
              Vous n&apos;avez pas encore passé de commande.
            </p>
            <p className="mt-3 text-sm text-zinc-500">
              Laissez-vous inspirer par nos créations dans la{" "}
              <Link
                href="/boutique"
                className="underline underline-offset-2 hover:text-zinc-800"
              >
                boutique Mawaura
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const badge = getStatusBadge(order.status);
              const date = new Date(order.createdAt);
              const dateStr = date.toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              });
              const totalEuros = order.totalCents / 100;
              const itemsCount = order.items.length;
              const totalQuantity = order.items.reduce(
                (sum, item) => sum + item.quantity,
                0
              );

              return (
                <div
                  key={order.id}
                  className="border border-zinc-200 rounded-3xl p-5 sm:p-6 bg-white/80"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-zinc-500">
                        Commande n° {order.id}
                      </p>
                      <p className="text-sm sm:text-base font-medium text-zinc-900">
                        Passée le {dateStr}
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">
                        {itemsCount} article
                        {itemsCount > 1 ? "s" : ""} · {totalQuantity} pièce
                        {totalQuantity > 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm sm:text-base font-semibold text-zinc-900">
                        {totalEuros.toFixed(2).replace(".", ",")} €
                      </p>
                      <div className="mt-1">
                        <span className={badge.className}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                          <span>{badge.label}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap justify-between items-center gap-2">
                    <p className="text-[11px] text-zinc-500">
                      {order.customerName
                        ? `Au nom de ${order.customerName}`
                        : `Envoyée à ${order.email}`}
                    </p>
                    <Link
                      href={`/compte/commandes/${order.id}`}
                      className="text-[11px] text-zinc-700 hover:text-zinc-900 underline underline-offset-2"
                    >
                      Voir le détail →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
