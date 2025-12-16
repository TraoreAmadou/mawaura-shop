"use client";

import React, { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { formatXOF } from "@/lib/money";

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

export default function ComptePage() {
  const { data: session, status } = useSession();
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;

    let cancelled = false;

    async function loadOrders() {
      setLoadingOrders(true);
      setOrdersError(null);
      try {
        const res = await fetch("/api/orders", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          const message =
            data?.error ||
            "Impossible de charger vos commandes pour le moment.";
          if (!cancelled) setOrdersError(message);
          return;
        }

        const data = (await res.json()) as ApiOrder[];
        if (!cancelled) {
          setOrders(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Erreur chargement commandes:", error);
        if (!cancelled) {
          setOrdersError(
            "Une erreur réseau est survenue lors du chargement de vos commandes."
          );
        }
      } finally {
        if (!cancelled) setLoadingOrders(false);
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
        <section className="max-w-3xl mx-auto px-4 py-16 sm:py-20">
          <div className="border border-zinc-200 rounded-3xl p-8 sm:p-10 bg-zinc-50/60">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight mb-3">
              Espace compte Mawaura
            </h1>
            <p className="text-sm text-zinc-600 mb-6">
              Connectez-vous pour retrouver vos commandes, vos informations
              et vos préférences.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/connexion"
                className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-6 py-2.5 text-[11px] font-medium uppercase tracking-[0.2em] text-white hover:bg-zinc-800 transition"
              >
                Se connecter
              </Link>
              <Link
                href="/boutique"
                className="inline-flex items-center justify-center rounded-full border border-zinc-900 px-6 py-2.5 text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-900 hover:bg-zinc-100 transition"
              >
                Découvrir la boutique
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const user = session.user as any;
  const isAdmin = user?.role === "ADMIN";
  const email = session.user?.email ?? "Email non renseigné";
  const name =
    user?.firstname && user?.lastname
      ? `${user.firstname} ${user.lastname}`
      : (user?.name as string | undefined) || email;

  const hasOrders = orders.length > 0;
  const totalOrders = orders.length;
  const recentOrders = orders.slice(0, 3);

  return (
    <main className="min-h-screen bg-white text-zinc-900">
      <section className="border-b border-zinc-200 bg-zinc-50/60">
        <div className="max-w-5xl mx-auto px-4 py-8 sm:py-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500 mb-1.5">
                Mon compte
              </p>
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
                Bonjour, {name}
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-zinc-500">
                {email}
              </p>

              {/* 🔹 Badge nombre de commandes */}
              {!loadingOrders && !ordersError && (
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-zinc-900 text-white px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em]">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  <span>
                    {totalOrders === 0
                      ? "Aucune commande pour l’instant"
                      : `${totalOrders} commande${
                          totalOrders > 1 ? "s" : ""
                        } passée${totalOrders > 1 ? "s" : ""}`}
                  </span>
                </div>
              )}

              {isAdmin && (
                <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-zinc-900/20 bg-zinc-900/5 px-3 py-1.5 ml-0 sm:ml-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-900" />
                  <span className="text-[11px] font-medium tracking-[0.18em] uppercase text-zinc-900">
                    Admin Mawaura
                  </span>
                  <Link
                    href="/admin"
                    className="text-[11px] text-zinc-600 underline underline-offset-2 hover:text-zinc-900"
                  >
                    Accéder à l’interface
                  </Link>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => signOut()}
              className="hidden sm:inline-flex items-center justify-center rounded-full border border-zinc-300 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-700 hover:bg-zinc-100 transition"
            >
              Se déconnecter
            </button>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-8 sm:py-10 space-y-8">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Carte infos compte */}
          <div className="border border-zinc-200 rounded-3xl p-6 sm:p-7 bg-white/80">
            <h2 className="text-sm font-semibold tracking-tight mb-3">
              Mes informations
            </h2>
            <dl className="space-y-2 text-xs sm:text-sm text-zinc-600">
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Nom</dt>
                <dd className="text-right">{name}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Email</dt>
                <dd className="text-right break-all">{email}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Rôle</dt>
                <dd className="text-right">
                  {isAdmin ? "Administrateur" : "Client Mawaura"}
                </dd>
              </div>
            </dl>

            <div className="mt-5 text-[11px] text-zinc-500">
              <p className="mb-1 font-medium text-zinc-700">
                À venir prochainement :
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Adresse de livraison préférée</li>
                <li>Préférences de bijoux (style, couleur, matière)</li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => signOut()}
              className="mt-5 inline-flex sm:hidden items-center justify-center rounded-full border border-zinc-300 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-700 hover:bg-zinc-100 transition"
            >
              Se déconnecter
            </button>
          </div>

          {/* Carte commandes récentes */}
          <div className="border border-zinc-200 rounded-3xl p-6 sm:p-7 bg-white/80">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold tracking-tight">
                Mes dernières commandes
              </h2>
              {hasOrders && (
                <Link
                  href="/compte/commandes"
                  className="text-[11px] text-zinc-500 hover:text-zinc-800"
                >
                  Tout voir →
                </Link>
              )}
            </div>

            {loadingOrders ? (
              <p className="text-xs text-zinc-500">
                Chargement de vos commandes...
              </p>
            ) : ordersError ? (
              <p className="text-xs text-red-600">
                {ordersError}
              </p>
            ) : !hasOrders ? (
              <div className="text-xs text-zinc-500">
                <p>Vous n&apos;avez pas encore passé de commande.</p>
                <p className="mt-2">
                  Commencez par découvrir la{" "}
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
              <ul className="space-y-3 text-xs sm:text-sm">
                {recentOrders.map((order) => {
                  const badge = getStatusBadge(order.status);
                  const date = new Date(order.createdAt);
                  const dateStr = date.toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  });
                  const totalEuros = order.totalCents / 100;
                  const itemsCount = order.items.length;
                  const totalQuantity = order.items.reduce(
                    (sum, item) => sum + item.quantity,
                    0
                  );
                  return (
                    <li
                      key={order.id}
                      className="border border-zinc-200 rounded-2xl px-3 py-2.5 bg-zinc-50/80"
                    >
                      <div className="flex justify-between gap-3">
                        <div>
                          <p className="font-medium text-zinc-900">
                            Commande du {dateStr}
                          </p>
                          <p className="text-[11px] text-zinc-500">
                            {itemsCount} article
                            {itemsCount > 1 ? "s" : ""} ·{" "}
                            {totalQuantity} pièce
                            {totalQuantity > 1 ? "s" : ""}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {/*{totalEuros.toFixed(2).replace(".", ",")} € */} 
                            {formatXOF(totalEuros)}
                          </p>
                          <div className="mt-1">
                            <span className={badge.className}>
                              <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                              <span>{badge.label}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 flex justify-between items-center">
                        <p className="text-[11px] text-zinc-500">
                          N° {order.id.slice(0, 8)}…
                        </p>
                        <Link
                          href={`/compte/commandes/${order.id}`}
                          className="text-[11px] text-zinc-700 hover:text-zinc-900 underline underline-offset-2"
                        >
                          Voir le détail
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="border border-dashed border-zinc-200 rounded-3xl p-6 sm:p-7 bg-zinc-50/40">
          <h2 className="text-sm font-semibold tracking-tight mb-2">
            À venir dans votre espace Mawaura
          </h2>
          <ul className="text-xs sm:text-sm text-zinc-600 space-y-1.5 list-disc list-inside">
            <li>Historique de commandes détaillé par produit</li>
            <li>Suivi de livraison</li>
            <li>Préférences de bijoux personnalisées</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
