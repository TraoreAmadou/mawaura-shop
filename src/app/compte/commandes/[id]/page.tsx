"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { formatXOF } from "@/lib/money";

type ShippingStatus = "PREPARATION" | "SHIPPED" | "DELIVERED" | "RECEIVED";

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
  shippingAddress?: string | null;
  notes?: string | null;
  shippingStatus?: ShippingStatus;
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

// Helpers suivi logistique

function shippingStatusDescription(status: ShippingStatus): string {
  switch (status) {
    case "PREPARATION":
      return "Votre commande est en cours de préparation par Mawaura.";
    case "SHIPPED":
      return "Votre commande a été expédiée. Elle est en route jusqu’à vous.";
    case "DELIVERED":
      return "Votre commande a été livrée. Elle devrait vous parvenir très bientôt.";
    case "RECEIVED":
      return "Votre colis a été reçu. Nous espérons que vos bijoux vous plaisent ✨";
    default:
      return "";
  }
}

function shippingStepIndex(status: ShippingStatus): number {
  switch (status) {
    case "PREPARATION":
      return 0;
    case "SHIPPED":
      return 1;
    case "DELIVERED":
      return 2;
    case "RECEIVED":
      // 🔹 Toutes les étapes sont considérées comme complétées
      return 3;
    default:
      return 0;
  }
}

function ShippingStepper({ status }: { status: ShippingStatus }) {
  const steps = [
    { key: "PREPARATION", label: "En préparation" },
    { key: "SHIPPED", label: "Expédiée" },
    { key: "DELIVERED", label: "Livrée" },
  ] as const;

  const currentIndex = shippingStepIndex(status);

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between gap-2">
        {steps.map((step, index) => {
          const isDone = index < currentIndex;
          const isCurrent = index === currentIndex;

          const circleBase =
            "flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold";
          const labelBase = "text-[11px] font-medium";

          let circleClass = "bg-zinc-200 text-zinc-600";
          let labelClass = "text-zinc-400";

          if (isDone) {
            // Étapes terminées → vert
            circleClass = "bg-emerald-600 text-white";
            labelClass = "text-emerald-700";
          } else if (isCurrent) {
            // Étape courante → noir
            circleClass = "bg-zinc-900 text-white";
            labelClass = "text-zinc-900";
          }

          return (
            <div key={step.key} className="flex-1 flex flex-col items-center">
              <div className="flex items-center w-full">
                {index > 0 && (
                  <div
                    className={`h-[2px] flex-1 ${
                      index <= currentIndex ? "bg-zinc-900" : "bg-zinc-200"
                    }`}
                  />
                )}
                <div className={`${circleBase} ${circleClass}`}>
                  {index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-[2px] flex-1 ${
                      index < currentIndex ? "bg-zinc-900" : "bg-zinc-200"
                    }`}
                  />
                )}
              </div>
              <p className={`${labelBase} ${labelClass} mt-1 text-center`}>
                {step.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function CommandeDetailPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const orderId =
    typeof params?.id === "string"
      ? params.id
      : Array.isArray((params as any)?.id)
      ? (params as any).id[0]
      : undefined;

  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (!orderId) return;

    let cancelled = false;

    async function loadOrder() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/orders");
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          const message =
            data?.error ||
            "Impossible de charger les détails de la commande.";
          if (!cancelled) setError(message);
          return;
        }
        const data = (await res.json()) as ApiOrder[];

        const found =
          Array.isArray(data) &&
          data.find((o) => o.id === orderId);

        if (!cancelled) {
          if (!found) {
            setError("Commande introuvable.");
          } else {
            const ss =
              (found.shippingStatus as ShippingStatus | undefined) ||
              "PREPARATION";
            setOrder({
              ...found,
              shippingStatus: ss,
            });
          }
        }
      } catch (err) {
        console.error("Erreur chargement commande:", err);
        if (!cancelled) {
          setError(
            "Une erreur réseau est survenue lors du chargement de la commande."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadOrder();

    return () => {
      cancelled = true;
    };
  }, [status, orderId]);

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
            Détail de la commande
          </h1>
          <p className="text-sm text-zinc-600 mb-6">
            Connectez-vous pour accéder au détail de vos commandes.
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

  const badge = order ? getStatusBadge(order.status) : null;
  const shippingStatus: ShippingStatus =
    (order?.shippingStatus as ShippingStatus | undefined) || "PREPARATION";

  return (
    <main className="min-h-screen bg-white text-zinc-900">
      <header className="border-b border-zinc-200 bg-zinc-50/60">
        <div className="max-w-5xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500 mb-1">
              Mon compte
            </p>
            <h1 className="text-lg sm:text-xl font-semibold tracking-tight">
              Détail de la commande
            </h1>
          </div>
          <Link
            href="/compte/commandes"
            className="text-[11px] text-zinc-500 hover:text-zinc-800"
          >
            ← Retour aux commandes
          </Link>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-4 py-8 sm:py-10">
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
              Commande introuvable. Si le problème persiste, contactez
              Mawaura.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Résumé + suivi */}
            <div className="border border-zinc-200 rounded-3xl p-5 sm:p-6 bg-white/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-zinc-500">
                    Commande n° {order.id}
                  </p>
                  <p className="text-sm sm:text-base font-medium text-zinc-900">
                    Passée le{" "}
                    {new Date(order.createdAt).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    {order.items.length} article
                    {order.items.length > 1 ? "s" : ""} ·{" "}
                    {order.items.reduce(
                      (sum, item) => sum + item.quantity,
                      0
                    )}{" "}
                    pièce
                    {order.items.reduce(
                      (sum, item) => sum + item.quantity,
                      0
                    ) > 1
                      ? "s"
                      : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm sm:text-base font-semibold text-zinc-900">
                    {(formatXOF(order.totalCents / 100))}{" "}
                    
                  </p>
                  {badge && (
                    <div className="mt-1">
                      <span className={badge.className}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                        <span>{badge.label}</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Suivi logistique */}
              <div className="mt-4">
                <p className="text-xs font-medium text-zinc-700 mb-1">
                  Suivi de votre commande
                </p>
                <ShippingStepper status={shippingStatus} />
                <p className="mt-3 text-[11px] text-zinc-500">
                  {shippingStatusDescription(shippingStatus)}
                </p>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2 text-xs sm:text-sm text-zinc-600">
                <div>
                  <p className="text-zinc-500">Nom / Email</p>
                  <p className="mt-0.5">
                    {order.customerName
                      ? `${order.customerName} · ${order.email}`
                      : order.email}
                  </p>
                </div>
                {order.shippingAddress && (
                  <div>
                    <p className="text-zinc-500">Adresse de livraison</p>
                    <p className="mt-0.5 whitespace-pre-line">
                      {order.shippingAddress}
                    </p>
                  </div>
                )}
                {order.notes && (
                  <div className="sm:col-span-2">
                    <p className="text-zinc-500">Notes pour Mawaura</p>
                    <p className="mt-0.5 whitespace-pre-line">
                      {order.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Détail des articles */}
            <div className="border border-zinc-200 rounded-3xl p-5 sm:p-6 bg-white/80">
              <h2 className="text-sm font-semibold tracking-tight mb-4">
                Détail des articles
              </h2>
              <div className="space-y-3">
                {order.items.map((item) => {
                  const unitEuros = item.unitPriceCents / 100;
                  const lineEuros = item.totalPriceCents / 100;
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
                          {/* {unitEuros.toFixed(2).replace(".", ",")} € / pièce */}
                          {formatXOF(unitEuros)} / pièce
                        </p>
                        <p className="font-medium text-zinc-900">
                          {/* {lineEuros.toFixed(2).replace(".", ",")} € */}
                          {formatXOF(lineEuros) } {/* FCFA */}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="text-center">
              <Link
                href="/compte/commandes"
                className="inline-flex items-center justify-center rounded-full border border-zinc-900 px-6 py-2 text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-900 hover:bg-zinc-100 transition"
              >
                Retour à mes commandes
              </Link>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
