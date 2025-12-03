"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function ComptePage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <main className="min-h-screen bg-white text-zinc-900 flex items-center justify-center">
        <p className="text-sm text-zinc-500">Chargement de votre espace...</p>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="min-h-screen bg-white text-zinc-900 flex items-center justify-center">
        <div className="text-center px-4">
          <h1 className="text-xl sm:text-2xl font-semibold mb-2">
            Espace réservé
          </h1>
          <p className="text-sm sm:text-base text-zinc-600 mb-4">
            Vous devez être connecté(e) pour accéder à votre espace Mawaura.
          </p>
          <Link
            href="/connexion"
            className="inline-flex items-center justify-center rounded-full border border-zinc-900 bg-zinc-900 px-5 py-2.5 text-xs sm:text-sm font-medium uppercase tracking-[0.18em] text-white hover:bg-white hover:text-zinc-900 transition-colors"
          >
            Se connecter
          </Link>
        </div>
      </main>
    );
  }

  const user = session.user as any;

  return (
    <main className="min-h-screen bg-white text-zinc-900">
      <header className="border-b border-zinc-200 bg-zinc-50/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <p className="tracking-[0.25em] uppercase text-[11px] text-zinc-500">
              MAWAURA ACCESSORIES
            </p>
            <nav className="text-xs sm:text-sm text-zinc-500 mt-1">
              <Link href="/" className="hover:text-zinc-800">
                Accueil
              </Link>
              <span className="mx-1">/</span>
              <span className="text-zinc-700 font-medium">Mon compte</span>
            </nav>
          </div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-xs sm:text-sm text-zinc-500 hover:text-zinc-900"
          >
            Se déconnecter
          </button>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-4">
          Bonjour, {user.name || user.username || "Mawaura Lover"} 👋
        </h1>
        <p className="text-sm sm:text-base text-zinc-600 mb-6">
          Bienvenue dans votre espace Mawaura. Bientôt, vous pourrez suivre vos
          commandes, gérer vos informations et retrouver vos bijoux favoris.
        </p>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="border border-zinc-200 rounded-2xl p-5 bg-white shadow-sm">
            <h2 className="text-sm font-semibold mb-2">
              Informations du compte
            </h2>
            <dl className="text-xs sm:text-sm text-zinc-600 space-y-1.5">
              {user.email && (
                <div className="flex gap-2">
                  <dt className="w-28 text-zinc-500">Email</dt>
                  <dd>{user.email}</dd>
                </div>
              )}
              {user.role && (
                <div className="flex gap-2">
                  <dt className="w-28 text-zinc-500">Rôle</dt>
                  <dd>
                    {user.role === "ADMIN"
                      ? "Administrateur Mawaura"
                      : "Client"}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <div className="border border-zinc-200 rounded-2xl p-5 bg-white shadow-sm">
            <h2 className="text-sm font-semibold mb-2">
              Prochaines fonctionnalités
            </h2>
            <ul className="text-xs sm:text-sm text-zinc-600 space-y-1.5 list-disc list-inside">
              <li>Historique de commandes</li>
              <li>Adresse de livraison préférée</li>
              <li>Préférences de bijoux (style, couleur, matière)</li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
