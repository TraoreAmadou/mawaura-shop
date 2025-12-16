"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCart } from "../cart-context";
import { formatXOF } from "@/lib/money";

type ApiOrder = {
  id: string;
};

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const {
    items,
    totalPrice,
    totalQuantity,
    clearCart,
  } = useCart();

  const [customerName, setCustomerName] = useState("");
  const [email, setEmail] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasItems = items.length > 0;

  // Pré-remplir nom et email depuis la session quand elle arrive
  useEffect(() => {
    if (session?.user) {
      if (session.user.name) {
        setCustomerName((prev) => prev || session.user!.name!);
      }
      if (session.user.email) {
        setEmail((prev) => prev || session.user!.email!);
      }
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!hasItems) return;

    setError(null);
    setSubmitting(true);

    try {
      const payload = {
        items: items.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
        customerName: customerName || null,
        shippingAddress: shippingAddress || null,
        notes: notes || null,
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const message =
          data?.error ||
          "Une erreur est survenue lors de la validation de votre commande.";
        setError(message);
        return;
      }

      const order = data as ApiOrder;
      clearCart();

      // Redirection vers le détail de la commande
      // router.push(`/compte/commandes/${order.id}`);
      // Redirection vers la page de confirmation dédiée
      router.push(`/checkout/success?orderId=${order.id}`);
    } catch (err) {
      console.error("Erreur checkout:", err);
      setError(
        "Une erreur réseau est survenue lors de la validation de votre commande."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Loading de la session
  if (status === "loading") {
    return (
      <main className="min-h-screen bg-white text-zinc-900 flex items-center justify-center">
        <p className="text-sm text-zinc-500">
          Chargement de votre espace...
        </p>
      </main>
    );
  }

  // Si pas connecté → demander la connexion
  if (status !== "authenticated" || !session?.user) {
    return (
      <main className="min-h-screen bg-white text-zinc-900">
        <header className="border-b border-zinc-200 bg-zinc-50/80">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-2">
            <p className="tracking-[0.3em] uppercase text-[11px] text-yellow-600">
              Mawaura Checkout
            </p>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                  Validation de la commande
                </h1>
                <p className="text-sm sm:text-base text-zinc-600">
                  Connectez-vous pour finaliser votre commande.
                </p>
              </div>
              <nav className="text-[11px] sm:text-xs text-zinc-500">
                <Link href="/" className="hover:text-zinc-800">
                  Accueil
                </Link>
                <span className="mx-1">/</span>
                <Link href="/panier" className="hover:text-zinc-800">
                  Panier
                </Link>
                <span className="mx-1">/</span>
                <span className="text-zinc-800 font-medium">
                  Checkout
                </span>
              </nav>
            </div>
          </div>
        </header>

        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center">
          <p className="text-sm sm:text-base text-zinc-600 mb-6">
            Vous devez être connecté pour passer une commande.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link
              href="/connexion"
              className="inline-flex items-center justify-center rounded-full border border-zinc-900 bg-zinc-900 px-6 py-2.5 text-[11px] font-medium uppercase tracking-[0.2em] text-white hover:bg-zinc-800 transition"
            >
              Se connecter
            </Link>
            <Link
              href="/panier"
              className="text-[11px] text-zinc-500 hover:text-zinc-800"
            >
              ← Retourner au panier
            </Link>
          </div>
        </section>
      </main>
    );
  }

  // Si le panier est vide
  if (!hasItems) {
    return (
      <main className="min-h-screen bg-white text-zinc-900">
        <header className="border-b border-zinc-200 bg-zinc-50/80">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-2">
            <p className="tracking-[0.3em] uppercase text-[11px] text-yellow-600">
              Mawaura Checkout
            </p>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                  Validation de la commande
                </h1>
                <p className="text-sm sm:text-base text-zinc-600">
                  Votre panier est actuellement vide.
                </p>
              </div>
              <nav className="text-[11px] sm:text-xs text-zinc-500">
                <Link href="/" className="hover:text-zinc-800">
                  Accueil
                </Link>
                <span className="mx-1">/</span>
                <Link href="/panier" className="hover:text-zinc-800">
                  Panier
                </Link>
                <span className="mx-1">/</span>
                <span className="text-zinc-800 font-medium">
                  Checkout
                </span>
              </nav>
            </div>
          </div>
        </header>

        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center">
          <p className="text-sm sm:text-base text-zinc-600 mb-4">
            Ajoutez des bijoux à votre panier avant de valider votre
            commande.
          </p>
          <Link
            href="/boutique"
            className="inline-flex items-center justify-center rounded-full border border-yellow-500 bg-yellow-500 px-6 py-2.5 text-[11px] font-medium uppercase tracking-[0.2em] text-white hover:bg-white hover:text-yellow-600 hover:border-yellow-600 transition-colors"
          >
            Découvrir les bijoux
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-zinc-900">
      {/* Bandeau haut */}
      <header className="border-b border-zinc-200 bg-zinc-50/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-2">
          <p className="tracking-[0.3em] uppercase text-[11px] text-yellow-600">
            Mawaura Checkout
          </p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                Validation de la commande
              </h1>
              <p className="text-sm sm:text-base text-zinc-600">
                Vérifiez vos informations et confirmez votre commande.
              </p>
            </div>
            <nav className="text-[11px] sm:text-xs text-zinc-500">
              <Link href="/" className="hover:text-zinc-800">
                Accueil
              </Link>
              <span className="mx-1">/</span>
              <Link href="/panier" className="hover:text-zinc-800">
                Panier
              </Link>
              <span className="mx-1">/</span>
              <span className="text-zinc-800 font-medium">Checkout</span>
            </nav>
          </div>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 grid gap-8 lg:grid-cols-[3fr,2fr]">
        {/* Formulaire informations client */}
        <div className="space-y-6">
          {error && (
            <div className="border border-red-200 bg-red-50/70 text-red-700 rounded-2xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="border border-zinc-200 rounded-2xl p-4 sm:p-5 bg-white shadow-sm">
              <h2 className="text-sm sm:text-base font-semibold mb-3">
                Vos coordonnées
              </h2>

              <div className="space-y-3 text-sm">
                <div className="space-y-1">
                  <label className="block text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ex : Marie Dupont"
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:border-zinc-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                    Adresse e-mail
                  </label>
                  <input
                    type="email"
                    value={email}
                    readOnly
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-500"
                  />
                  <p className="text-[11px] text-zinc-500">
                    Votre email est utilisé pour vous envoyer la confirmation
                    de commande.
                  </p>
                </div>
              </div>
            </div>

            <div className="border border-zinc-200 rounded-2xl p-4 sm:p-5 bg-white shadow-sm">
              <h2 className="text-sm sm:text-base font-semibold mb-3">
                Adresse de livraison
              </h2>
              <div className="space-y-3 text-sm">
                <div className="space-y-1">
                  <label className="block text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                    Adresse complète
                  </label>
                  <textarea
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder={
                      "Ex : 12 rue des Fleurs\n75000 Paris\nFrance"
                    }
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:border-zinc-900 min-h-[90px] resize-vertical"
                  />
                  <p className="text-[11px] text-zinc-500">
                    Indiquez votre rue, code postal, ville et pays. Vous
                    pourrez préciser des informations complémentaires si
                    besoin.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                    Notes pour Mawaura (optionnel)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Une précision sur la livraison, un message cadeau, etc."
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:border-zinc-900 min-h-[70px] resize-vertical"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link
                href="/panier"
                className="text-[11px] text-zinc-500 hover:text-zinc-800"
              >
                ← Retour au panier
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center rounded-full border border-zinc-900 bg-zinc-900 px-6 py-2.5 text-[11px] font-medium uppercase tracking-[0.2em] text-white hover:bg-zinc-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? "Validation en cours..." : "Confirmer ma commande"}
              </button>
            </div>
          </form>
        </div>

        {/* Récapitulatif panier */}
        <aside className="border border-zinc-200 rounded-2xl p-4 sm:p-5 bg-white shadow-sm h-fit">
          <h2 className="text-sm sm:text-base font-semibold mb-4">
            Récapitulatif des bijoux
          </h2>

          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
            {items.map((item) => {
              const lineTotal = item.price * item.quantity;
              return (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-3 border-b border-zinc-100 pb-2 last:border-b-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm font-medium text-zinc-900">
                      {item.name}
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      {/*{item.price.toFixed(2).replace(".", ",")} € / pièce ·{" "} */} {/* Conversion en Euro */}
                      {formatXOF(item.price)} / pièce ·{" "}
                      {item.quantity}{" "}
                      {item.quantity > 1 ? "pièces" : "pièce"}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-zinc-900">
                    {/*{lineTotal.toFixed(2).replace(".", ",")} € */} {/* Conversion en Euro */}
                    {formatXOF(lineTotal)} {/* Conversion en FCFA */}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-4 space-y-2 text-sm text-zinc-700">
            <div className="flex justify-between">
              <span>Sous-total</span>
              <span>
                {/*{totalPrice.toFixed(2).replace(".", ",")} € */} {/* Conversion en Euro */}
                {formatXOF(totalPrice)} {/* Conversion en FCFA */}
              </span>
            </div>
            <div className="flex justify-between text-xs text-zinc-500">
              <span>Articles</span>
              <span>
                {totalQuantity} article
                {totalQuantity > 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex justify-between text-xs text-zinc-500">
              <span>Livraison</span>
              <span>Calculée ultérieurement</span>
            </div>

            <div className="border-t border-zinc-200 pt-3 mt-2">
              <div className="flex justify-between items-center text-sm font-semibold">
                <span>Total estimé</span>
                <span>
                  {/* {totalPrice.toFixed(2).replace(".", ",")} € */} {/* Conversion en Euro */}
                  {formatXOF(totalPrice)} {/* Conversion en FCFA */}
                </span>
              </div>
              <p className="mt-2 text-[11px] text-zinc-500">
                Le montant final peut varier légèrement selon les frais de
                livraison. Vous recevrez un récapitulatif détaillé par email
                après confirmation.
              </p>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
