"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";
import { useCart } from "../cart-context";

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const { data: session } = useSession();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successOrderId, setSuccessOrderId] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (session?.user) {
      if (!fullName && (session.user as any).name) {
        setFullName((session.user as any).name as string);
      }
      if (!email && session.user.email) {
        setEmail(session.user.email);
      }
    }
  }, [session, fullName, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (items.length === 0) {
      setError("Votre panier est vide.");
      return;
    }

    if (!email) {
      setError("Merci de renseigner une adresse email.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
          })),
          customer: {
            name: fullName || null,
            email,
            notes: notes || null,
            shippingAddress: shippingAddress || null,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(
          data?.error ||
            "Une erreur est survenue lors de la création de votre commande."
        );
        return;
      }

      clearCart();
      setSuccessOrderId(data.id as string);
    } catch (err) {
      console.error(err);
      setError("Une erreur réseau est survenue.");
    } finally {
      setLoading(false);
    }
  };

  // Cas panier vide (avant validation)
  if (items.length === 0 && !successOrderId) {
    return (
      <main className="min-h-screen bg-white text-zinc-900">
        <section className="max-w-3xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-4">
            Votre panier est vide
          </h1>
          <p className="text-sm text-zinc-600 mb-6">
            Ajoutez quelques pièces à votre panier avant de passer au
            paiement.
          </p>
          <Link
            href="/boutique"
            className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-6 py-2 text-xs font-medium uppercase tracking-[0.2em] text-white hover:bg-zinc-800 transition"
          >
            Découvrir la boutique
          </Link>
        </section>
      </main>
    );
  }

  // Cas commande validée
  if (successOrderId) {
    return (
      <main className="min-h-screen bg-white text-zinc-900">
        <section className="max-w-2xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-4">
            Merci pour votre confiance ✨
          </h1>
          <p className="text-sm text-zinc-600 mb-3">
            Votre commande a bien été enregistrée.
          </p>
          <p className="text-xs text-zinc-500 mb-6">
            Numéro de commande :{" "}
            <span className="font-mono text-[11px]">
              {successOrderId}
            </span>
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/compte"
              className="inline-flex items-center justify-center rounded-full border border-zinc-900 px-5 py-2 text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-900 hover:bg-zinc-100 transition"
            >
              Voir mon compte
            </Link>
            <Link
              href="/boutique"
              className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-5 py-2 text-[11px] font-medium uppercase tracking-[0.2em] text-white hover:bg-zinc-800 transition"
            >
              Continuer mes achats
            </Link>
          </div>
        </section>
      </main>
    );
  }

  // Cas normal : formulaire + récap
  return (
    <main className="min-h-screen bg-white text-zinc-900">
      <header className="border-b border-zinc-200">
        <div className="max-w-5xl mx-auto px-4 py-6 flex items-center justify-between">
          <h1 className="text-base sm:text-lg font-semibold tracking-tight">
            Finaliser ma commande
          </h1>
          <Link
            href="/panier"
            className="text-[11px] text-zinc-500 hover:text-zinc-800"
          >
            ← Retour au panier
          </Link>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-4 py-8 sm:py-10 grid gap-8 md:grid-cols-[2fr,1.4fr]">
        {/* Colonne gauche : formulaire */}
        <form
          onSubmit={handleSubmit}
          className="space-y-6 bg-zinc-50/80 border border-zinc-200 rounded-3xl p-6 sm:p-8"
        >
          <div className="space-y-1.5">
            <h2 className="text-sm font-semibold tracking-tight">
              Informations de contact
            </h2>
            <p className="text-xs text-zinc-500">
              Ces informations nous permettent de vous envoyer la
              confirmation de commande.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="fullName"
                className="block text-xs font-medium text-zinc-700"
              >
                Nom complet (optionnel)
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-full border border-zinc-200 px-4 py-2 text-sm outline-none focus:border-zinc-900"
                placeholder="Prénom Nom"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-xs font-medium text-zinc-700"
              >
                Email *
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-full border border-zinc-200 px-4 py-2 text-sm outline-none focus:border-zinc-900"
                placeholder="vous@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="shippingAddress"
                className="block text-xs font-medium text-zinc-700"
              >
                Adresse de livraison (optionnelle pour l'instant)
              </label>
              <textarea
                id="shippingAddress"
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                className="w-full rounded-2xl border border-zinc-200 px-4 py-2 text-sm outline-none focus:border-zinc-900 min-h-[80px]"
                placeholder="Rue, ville, pays..."
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="notes"
                className="block text-xs font-medium text-zinc-700"
              >
                Notes pour Mawaura (optionnel)
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-2xl border border-zinc-200 px-4 py-2 text-sm outline-none focus:border-zinc-900 min-h-[60px]"
                placeholder="Une précision sur votre commande..."
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-2xl px-4 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-6 py-2.5 text-[11px] font-medium uppercase tracking-[0.2em] text-white hover:bg-zinc-800 disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {loading ? "Validation en cours..." : "Confirmer ma commande"}
          </button>

          <p className="text-[11px] text-zinc-500">
            Aucun paiement en ligne n'est encore activé. Votre commande
            sera enregistrée et vous pourrez être contacté(e) par Mawaura
            pour la suite.
          </p>
        </form>

        {/* Colonne droite : récap panier */}
        <aside className="space-y-4">
          <div className="border border-zinc-200 rounded-3xl p-5 sm:p-6 bg-white/60">
            <h2 className="text-sm font-semibold tracking-tight mb-4">
              Récapitulatif
            </h2>

            <ul className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start justify-between gap-3 text-xs"
                >
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-[11px] text-zinc-500">
                      Quantité : {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {(item.price * item.quantity).toFixed(2)} €
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      {item.price.toFixed(2)} € / pièce
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-4 border-t border-dashed border-zinc-200 pt-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-600">Sous-total</span>
                <span className="font-medium">
                  {totalPrice.toFixed(2)} €
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600">Livraison</span>
                <span className="text-zinc-500">À définir</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-zinc-200 mt-2">
                <span className="text-zinc-900 font-semibold">
                  Total
                </span>
                <span className="text-zinc-900 font-semibold">
                  {totalPrice.toFixed(2)} €
                </span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-zinc-500 text-center">
            En validant, vous acceptez nos{" "}
            <Link
              href="/cgv"
              className="underline underline-offset-2 hover:text-zinc-800"
            >
              conditions générales de vente
            </Link>
            .
          </p>
        </aside>
      </section>
    </main>
  );
}
