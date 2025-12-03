"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";

type Tab = "login" | "register";

export default function ConnexionPage() {
  const [activeTab, setActiveTab] = useState<Tab>("login");

  const handleLoginSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    alert("Connexion : fonctionnalité en cours de développement ✨");
  };

  const handleRegisterSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    alert("Création de compte : fonctionnalité en cours de développement ✨");
  };

  return (
    <main className="min-h-screen bg-white text-zinc-900">
      {/* Bandeau haut très minimal */}
      <header className="border-b border-zinc-200 bg-white relative z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="text-base sm:text-lg font-semibold tracking-[0.25em] uppercase text-zinc-900">
              MAWAURA
            </span>
            <span className="text-xs sm:text-sm text-zinc-500 tracking-[0.3em] uppercase">
              Accessories
            </span>
          </Link>
          <nav className="hidden sm:flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-zinc-500">
            <Link href="/" className="hover:text-zinc-900">
              Accueil
            </Link>
            <span>/</span>
            <span className="text-zinc-900">Connexion</span>
          </nav>
        </div>
      </header>

      {/* Contenu principal avec IMAGE DE FOND */}
      <section className="relative min-h-[calc(100vh-4rem)] flex items-stretch">
        {/* Image de fond */}
        <div className="absolute inset-0">
          <Image
            src="/image_connexion2.png"
            alt="Connexion à votre compte Mawaura"
            fill
            className="object-cover"
            sizes="100vw"
          />
        </div>

        {/* Voile léger pour lisibilité (mais on voit toujours l'image) */}
        <div className="absolute inset-0 bg-white/70" />

        {/* Contenu centré */}
        <div className="relative z-10 w-full">
          <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
            <div className="grid gap-10 lg:gap-16 md:grid-cols-[1.1fr,0.9fr] items-start">
              {/* COLONNE GAUCHE : branding + texte */}
              <div className="space-y-5">
                <p className="tracking-[0.35em] uppercase text-[11px] text-zinc-500">
                  MAWAURA ACCESSORIES
                </p>
                <h1 className="text-2xl sm:text-3xl md:text-[32px] font-semibold tracking-tight">
                  Votre espace client
                </h1>
                <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
                  Connectez-vous à votre compte pour retrouver vos favoris,
                  suivre vos commandes et profiter d&apos;une expérience Mawaura
                  personnalisée. Si vous êtes nouvelle, créez votre compte en
                  quelques instants.
                </p>

                <div className="space-y-3 text-xs sm:text-sm text-zinc-600">
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 text-zinc-400">•</span>
                    <p>Accédez rapidement à vos bijoux favoris.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 text-zinc-400">•</span>
                    <p>Suivez vos commandes et votre historique d&apos;achats.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 text-zinc-400">•</span>
                    <p>Bénéficiez d&apos;une expérience plus fluide sur la boutique.</p>
                  </div>
                </div>

                <div className="pt-2 text-xs sm:text-sm text-zinc-500">
                  <Link
                    href="/boutique"
                    className="underline underline-offset-4 hover:text-zinc-900"
                  >
                    Continuer sans compte
                  </Link>
                </div>
              </div>

              {/* COLONNE DROITE : bloc connexion / inscription */}
              <div className="border border-zinc-200 rounded-2xl shadow-sm bg-white/95 backdrop-blur-sm">
                {/* Onglets en haut */}
                <div className="flex border-b border-zinc-200 text-xs sm:text-sm">
                  <button
                    type="button"
                    onClick={() => setActiveTab("login")}
                    className={`flex-1 px-4 py-3 text-center uppercase tracking-[0.22em] ${
                      activeTab === "login"
                        ? "text-zinc-900 border-b-2 border-zinc-900 font-medium"
                        : "text-zinc-400 border-b-2 border-transparent hover:text-zinc-800"
                    }`}
                  >
                    Se connecter
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("register")}
                    className={`flex-1 px-4 py-3 text-center uppercase tracking-[0.22em] ${
                      activeTab === "register"
                        ? "text-zinc-900 border-b-2 border-zinc-900 font-medium"
                        : "text-zinc-400 border-b-2 border-transparent hover:text-zinc-800"
                    }`}
                  >
                    Créer un compte
                  </button>
                </div>

                {/* Contenu formulaire */}
                <div className="p-5 sm:p-6 lg:p-7">
                  {activeTab === "login" ? (
                    <form
                      onSubmit={handleLoginSubmit}
                      className="space-y-4 text-sm"
                    >
                      <div className="space-y-1.5">
                        <label
                          htmlFor="login-identifier"
                          className="block text-xs font-medium tracking-[0.16em] uppercase text-zinc-600"
                        >
                          Pseudo ou e-mail
                        </label>
                        <input
                          id="login-identifier"
                          name="identifier"
                          type="text"
                          required
                          className="w-full rounded-none border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:border-zinc-900 bg-white"
                          placeholder="mawaura_off ou vous@example.com"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label
                          htmlFor="login-password"
                          className="block text-xs font-medium tracking-[0.16em] uppercase text-zinc-600"
                        >
                          Mot de passe
                        </label>
                        <input
                          id="login-password"
                          name="password"
                          type="password"
                          required
                          className="w-full rounded-none border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:border-zinc-900 bg-white"
                          placeholder="Votre mot de passe"
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-zinc-500">
                        <label className="inline-flex items-center gap-2">
                          <input
                            type="checkbox"
                            name="remember"
                            className="h-3.5 w-3.5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                          />
                          <span>Se souvenir de moi</span>
                        </label>
                        <button
                          type="button"
                          className="uppercase tracking-[0.16em] hover:text-zinc-900"
                        >
                          Mot de passe oublié ?
                        </button>
                      </div>

                      <button
                        type="submit"
                        className="mt-4 w-full inline-flex items-center justify-center border border-zinc-900 bg-zinc-900 px-4 py-2.5 text-xs font-medium uppercase tracking-[0.22em] text-white hover:bg-white hover:text-zinc-900 transition-colors"
                      >
                        Se connecter
                      </button>

                      <p className="mt-4 text-[11px] text-zinc-500">
                        Pas encore de compte ?{" "}
                        <button
                          type="button"
                          className="underline underline-offset-4 hover:text-zinc-900"
                          onClick={() => setActiveTab("register")}
                        >
                          Créer un compte
                        </button>
                      </p>
                    </form>
                  ) : (
                    <form
                      onSubmit={handleRegisterSubmit}
                      className="space-y-4 text-sm"
                    >
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <label
                            htmlFor="register-firstname"
                            className="block text-xs font-medium tracking-[0.16em] uppercase text-zinc-600"
                          >
                            Prénom *
                          </label>
                          <input
                            id="register-firstname"
                            name="firstname"
                            type="text"
                            required
                            className="w-full rounded-none border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:border-zinc-900 bg-white"
                            placeholder="Mawa"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label
                            htmlFor="register-lastname"
                            className="block text-xs font-medium tracking-[0.16em] uppercase text-zinc-600"
                          >
                            Nom *
                          </label>
                          <input
                            id="register-lastname"
                            name="lastname"
                            type="text"
                            required
                            className="w-full rounded-none border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:border-zinc-900 bg-white"
                            placeholder="Traoré"
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <label
                            htmlFor="register-username"
                            className="block text-xs font-medium tracking-[0.16em] uppercase text-zinc-600"
                          >
                            Pseudo *
                          </label>
                          <input
                            id="register-username"
                            name="username"
                            type="text"
                            required
                            className="w-full rounded-none border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:border-zinc-900 bg-white"
                            placeholder="mawaura_off"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label
                            htmlFor="register-birthdate"
                            className="block text-xs font-medium tracking-[0.16em] uppercase text-zinc-600"
                          >
                            Date de naissance *
                          </label>
                          <input
                            id="register-birthdate"
                            name="birthdate"
                            type="date"
                            required
                            className="w-full rounded-none border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:border-zinc-900 bg-white"
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <label
                            htmlFor="register-email"
                            className="block text-xs font-medium tracking-[0.16em] uppercase text-zinc-600"
                          >
                            Adresse e-mail (optionnel)
                          </label>
                          <input
                            id="register-email"
                            name="email"
                            type="email"
                            className="w-full rounded-none border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:border-zinc-900 bg-white"
                            placeholder="vous@example.com"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label
                            htmlFor="register-phone"
                            className="block text-xs font-medium tracking-[0.16em] uppercase text-zinc-600"
                          >
                            Téléphone (optionnel)
                          </label>
                          <input
                            id="register-phone"
                            name="phone"
                            type="tel"
                            className="w-full rounded-none border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:border-zinc-900 bg-white"
                            placeholder="+33 6 12 34 56 78"
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <label
                            htmlFor="register-password"
                            className="block text-xs font-medium tracking-[0.16em] uppercase text-zinc-600"
                          >
                            Mot de passe *
                          </label>
                          <input
                            id="register-password"
                            name="password"
                            type="password"
                            required
                            className="w-full rounded-none border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:border-zinc-900 bg-white"
                            placeholder="••••••••"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label
                            htmlFor="register-password-confirm"
                            className="block text-xs font-medium tracking-[0.16em] uppercase text-zinc-600"
                          >
                            Confirmation *
                          </label>
                          <input
                            id="register-password-confirm"
                            name="passwordConfirm"
                            type="password"
                            required
                            className="w-full rounded-none border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:border-zinc-900 bg-white"
                            placeholder="••••••••"
                          />
                        </div>
                      </div>

                      <p className="text-[11px] text-zinc-500">
                        Les champs marqués d&apos;une astérisque (*) sont
                        obligatoires.
                      </p>

                      <button
                        type="submit"
                        className="mt-4 w-full inline-flex items-center justify-center border border-zinc-900 bg-zinc-900 px-4 py-2.5 text-xs font-medium uppercase tracking-[0.22em] text-white hover:bg-white hover:text-zinc-900 transition-colors"
                      >
                        Créer mon compte
                      </button>

                      <p className="mt-4 text-[11px] text-zinc-500">
                        Vous avez déjà un compte ?{" "}
                        <button
                          type="button"
                          className="underline underline-offset-4 hover:text-zinc-900"
                          onClick={() => setActiveTab("login")}
                        >
                          Se connecter
                        </button>
                      </p>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
