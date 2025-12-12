"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
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

type ShippingStatus = "PREPARATION" | "SHIPPED" | "DELIVERED" | "RECEIVED";

type AdminOrder = {
  id: string;
  createdAt: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  shippingStatus: ShippingStatus;
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

function getShippingLabel(status: ShippingStatus): string {
  switch (status) {
    case "PREPARATION":
      return "En préparation";
    case "SHIPPED":
      return "Expédiée";
    case "DELIVERED":
      return "Livrée";
    case "RECEIVED":
      return "Colis reçu";
    default:
      return "En préparation";
  }
}

export default function AdminOrderDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();

  const orderId =
    typeof params?.id === "string"
      ? params.id
      : Array.isArray((params as any)?.id)
      ? (params as any).id[0]
      : undefined;

  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingShipping, setSavingShipping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = (session?.user as any)?.role === "ADMIN";

  useEffect(() => {
    if (!isAdmin || !orderId) return;

    let cancelled = false;

    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/admin/orders/${orderId}`);
        const data = await res.json().catch(() => null);

        if (!res.ok) {
          const message =
            data?.error ||
            "Impossible de charger la commande pour le moment.";
          if (!cancelled) setError(message);
          return;
        }

        if (!cancelled) {
          const o = data as AdminOrder;
          setOrder({
            ...o,
            shippingStatus: (o.shippingStatus as ShippingStatus) || "PREPARATION",
          });
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError(
            "Une erreur réseau est survenue lors du chargement de la commande."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchOrder();

    return () => {
      cancelled = true;
    };
  }, [isAdmin, orderId]);

  const updateStatus = async (status: AdminOrder["status"]) => {
    if (!orderId) return;
    setSavingStatus(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const message =
          data?.error ||
          "Impossible de mettre à jour le statut de la commande.";
        setError(message);
        return;
      }
      setOrder((prev) =>
        prev ? { ...prev, status: data.status as AdminOrder["status"] } : prev
      );
    } catch (err) {
      console.error(err);
      setError(
        "Une erreur réseau est survenue lors de la mise à jour du statut."
      );
    } finally {
      setSavingStatus(false);
    }
  };

  const updateShippingStatus = async (shippingStatus: ShippingStatus) => {
    if (!orderId) return;
    setSavingShipping(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shippingStatus }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const message =
          data?.error ||
          "Impossible de mettre à jour le suivi de la commande.";
        setError(message);
        return;
      }
      setOrder((prev) =>
        prev
          ? { ...prev, shippingStatus: data.shippingStatus as ShippingStatus }
          : prev
      );
    } catch (err) {
      console.error(err);
      setError(
        "Une erreur réseau est survenue lors de la mise à jour du suivi."
      );
    } finally {
      setSavingShipping(false);
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
            className="inline-flex items-center justify-center rounded-full border border-zinc-900 bg-zinc-900 px-6 py-2 text-xs sm:text-sm font-medium uppercase tracking-[0.18em] text-white hover:bg-zinc-800 transition"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </main>
    );
  }

  const badge = order ? getStatusBadge(order) : null;

  return (
    <main className="min-h-screen bg-white text-zinc-900">
      <section className="border-b border-zinc-200 bg-zinc-50/60">
        <div className="max-w-5xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500 mb-1">
              Administration
            </p>
            <h1 className="text-lg sm:text-xl font-semibold tracking-tight">
              Détail commande
            </h1>
            {order && (
              <p className="text-[11px] text-zinc-500 mt-1">
                n° {order.id}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="hidden sm:inline-flex items-center justify-center rounded-full border border-zinc-300 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-700 hover:bg-zinc-100 transition"
            >
              Retour
            </button>
            <Link
              href="/admin/commandes"
              className="text-[11px] text-zinc-500 hover:text-zinc-800"
            >
              ← Toutes les commandes
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-8 sm:py-10 space-y-6">
        {loading ? (
          <p className="text-sm text-zinc-500">
            Chargement de la commande...
          </p>
        ) : error ? (
          <div className="border border-red-200 bg-red-50/60 text-red-700 rounded-3xl p-6 sm:p-7">
            <p className="text-sm">{error}</p>
          </div>
        ) : !order ? (
          <div className="border border-zinc-200 bg-zinc-50/60 text-zinc-700 rounded-3xl p-6 sm:p-7">
            <p className="text-sm">
              Commande introuvable. Vérifiez l&apos;URL ou retournez à la
              liste des commandes.
            </p>
          </div>
        ) : (
          <>
            {/* Infos principales */}
            <div className="border border-zinc-200 rounded-3xl p-5 sm:p-6 bg-white/80 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-zinc-500">
                    Commande passée le{" "}
                    {new Date(order.createdAt).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-sm sm:text-base font-medium text-zinc-900">
                    {order.customerName || "Client Mawaura"}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {order.email}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm sm:text-base font-semibold text-zinc-900">
                    {(order.totalCents / 100)
                      .toFixed(2)
                      .replace(".", ",")}{" "}
                    €
                  </p>
                  {badge && (
                    <div className="mt-1">
                      <span className={badge.className}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                        <span>{badge.label}</span>
                      </span>
                    </div>
                  )}
                  <p className="mt-1 text-[11px] text-zinc-500">
                    Suivi : {getShippingLabel(order.shippingStatus)}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 text-xs sm:text-sm text-zinc-600">
                {order.shippingAddress && (
                  <div>
                    <p className="text-zinc-500 mb-0.5">
                      Adresse de livraison
                    </p>
                    <p className="whitespace-pre-line">
                      {order.shippingAddress}
                    </p>
                  </div>
                )}
                {order.notes && (
                  <div>
                    <p className="text-zinc-500 mb-0.5">
                      Notes du client
                    </p>
                    <p className="whitespace-pre-line">{order.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Statut administratif */}
            <div className="border border-zinc-200 rounded-3xl p-5 sm:p-6 bg-white/80">
              <h2 className="text-sm font-semibold tracking-tight mb-3">
                Statut administratif de la commande
              </h2>
              <p className="text-xs text-zinc-600 mb-4">
                Mettez à jour le statut global (paiement confirmé, commande
                annulée…).
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={savingStatus || order.status === "PENDING"}
                  onClick={() => updateStatus("PENDING")}
                  className={`inline-flex items-center justify-center rounded-full border px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] ${
                    order.status === "PENDING"
                      ? "bg-amber-100 border-amber-300 text-amber-800"
                      : "border-zinc-300 text-zinc-700 hover:bg-zinc-100"
                  } disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  En attente
                </button>
                <button
                  type="button"
                  disabled={savingStatus || order.status === "CONFIRMED"}
                  onClick={() => updateStatus("CONFIRMED")}
                  className={`inline-flex items-center justify-center rounded-full border px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] ${
                    order.status === "CONFIRMED"
                      ? "bg-emerald-100 border-emerald-300 text-emerald-800"
                      : "border-zinc-300 text-zinc-700 hover:bg-zinc-100"
                  } disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  Confirmée
                </button>
                <button
                  type="button"
                  disabled={savingStatus || order.status === "CANCELLED"}
                  onClick={() => updateStatus("CANCELLED")}
                  className={`inline-flex items-center justify-center rounded-full border px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] ${
                    order.status === "CANCELLED"
                      ? "bg-red-100 border-red-300 text-red-800"
                      : "border-zinc-300 text-zinc-700 hover:bg-zinc-100"
                  } disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  Annulée
                </button>
              </div>
              {savingStatus && (
                <p className="mt-2 text-[11px] text-zinc-500">
                  Mise à jour du statut en cours...
                </p>
              )}
            </div>

            {/* Suivi logistique */}
            <div className="border border-zinc-200 rounded-3xl p-5 sm:p-6 bg-white/80">
              <h2 className="text-sm font-semibold tracking-tight mb-3">
                Suivi logistique de la commande
              </h2>
              <p className="text-xs text-zinc-600 mb-4">
                Faites avancer la commande dans le parcours client : préparation,
                expédition, livraison, puis confirmation de réception.
              </p>

              <div className="flex flex-wrap gap-2 mb-3">
                <button
                  type="button"
                  disabled={
                    savingShipping || order.shippingStatus === "PREPARATION"
                  }
                  onClick={() => updateShippingStatus("PREPARATION")}
                  className={`inline-flex items-center justify-center rounded-full border px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] ${
                    order.shippingStatus === "PREPARATION"
                      ? "bg-zinc-900 border-zinc-900 text-white"
                      : "border-zinc-300 text-zinc-700 hover:bg-zinc-100"
                  } disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  En préparation
                </button>
                <button
                  type="button"
                  disabled={
                    savingShipping || order.shippingStatus === "SHIPPED"
                  }
                  onClick={() => updateShippingStatus("SHIPPED")}
                  className={`inline-flex items-center justify-center rounded-full border px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] ${
                    order.shippingStatus === "SHIPPED"
                      ? "bg-sky-100 border-sky-300 text-sky-800"
                      : "border-zinc-300 text-zinc-700 hover:bg-zinc-100"
                  } disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  Expédiée
                </button>
                <button
                  type="button"
                  disabled={
                    savingShipping || order.shippingStatus === "DELIVERED"
                  }
                  onClick={() => updateShippingStatus("DELIVERED")}
                  className={`inline-flex items-center justify-center rounded-full border px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] ${
                    order.shippingStatus === "DELIVERED"
                      ? "bg-emerald-100 border-emerald-300 text-emerald-800"
                      : "border-zinc-300 text-zinc-700 hover:bg-zinc-100"
                  } disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  Livrée
                </button>
                <button
                  type="button"
                  disabled={
                    savingShipping || order.shippingStatus === "RECEIVED"
                  }
                  onClick={() => updateShippingStatus("RECEIVED")}
                  className={`inline-flex items-center justify-center rounded-full border px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] ${
                    order.shippingStatus === "RECEIVED"
                      ? "bg-emerald-600 border-emerald-700 text-white"
                      : "border-zinc-300 text-zinc-700 hover:bg-zinc-100"
                  } disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  Colis reçu
                </button>
              </div>

              {savingShipping && (
                <p className="mt-1 text-[11px] text-zinc-500">
                  Mise à jour du suivi en cours...
                </p>
              )}

              <p className="text-[11px] text-zinc-500 mt-2">
                Le statut “Colis reçu” peut être utilisé lorsque le client
                confirme la bonne réception (par exemple après un échange avec
                lui).
              </p>
            </div>

            {/* Articles */}
            <div className="border border-zinc-200 rounded-3xl p-5 sm:p-6 bg-white/80">
              <h2 className="text-sm font-semibold tracking-tight mb-3">
                Articles de la commande
              </h2>
              <div className="space-y-3">
                {order.items.map((item) => {
                  const unitEuros = item.unitPriceCents / 100;
                  const totalEuros = item.totalPriceCents / 100;
                  return (
                    <div
                      key={item.id}
                      className="flex flex-col sm:flex-row justify-between gap-2 border-b last:border-b-0 border-zinc-100 pb-2 last:pb-0"
                    >
                      <div>
                        <p className="text-sm font-medium text-zinc-900">
                          {item.productNameSnapshot}
                        </p>
                        {item.productSlugSnapshot && (
                          <p className="text-[11px] text-zinc-500">
                            Référence : {item.productSlugSnapshot}
                          </p>
                        )}
                        <p className="text-[11px] text-zinc-500 mt-0.5">
                          Quantité : {item.quantity}
                        </p>
                      </div>
                      <div className="text-right text-xs sm:text-sm text-zinc-700">
                        <p>
                          {unitEuros.toFixed(2).replace(".", ",")} € / pièce
                        </p>
                        <p className="font-medium text-zinc-900">
                          {totalEuros.toFixed(2).replace(".", ",")} €
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
