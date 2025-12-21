"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/app/cart-context";
import { useFavorites } from "@/app/favorites-context";
import { useSession, signOut } from "next-auth/react";

const navLinks = [
  { href: "/", label: "Accueil" },
  { href: "/boutique", label: "Boutique" },
];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function Navbar() {
  const pathname = usePathname();
  const { totalQuantity } = useCart();
  const { totalFavorites } = useFavorites();
  const { data: session, status } = useSession();

  const isAuthenticated = status === "authenticated";
  const userName = session?.user?.name || "Mon compte";

  // ✅ Mobile menu state
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // ✅ Fermer le menu quand on change de page
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // ✅ Fermer au clic dehors + ESC
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onClickOutside(e: MouseEvent) {
      if (!open) return;
      const target = e.target as Node;
      if (panelRef.current && !panelRef.current.contains(target)) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onClickOutside);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, [open]);

  // ✅ Optionnel : bloquer le scroll du body quand le menu est ouvert
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <nav className="fixed inset-x-0 top-0 z-30 border-b border-zinc-200 bg-white/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo / marque */}
        <Link href="/" className="flex items-baseline gap-2">
          <span className="text-base sm:text-lg font-semibold tracking-[0.25em] uppercase text-zinc-900">
            MAWAURA
          </span>
          <span className="text-xs sm:text-sm text-zinc-500 tracking-[0.3em] uppercase">
            Accessories
          </span>
        </Link>

        {/* ✅ Bouton menu mobile */}
        <button
          type="button"
          className="sm:hidden inline-flex items-center justify-center rounded-full border border-zinc-200 w-10 h-10 text-zinc-700 hover:bg-zinc-50 transition-colors"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="text-lg leading-none">{open ? "✕" : "☰"}</span>
        </button>

        {/* ✅ Desktop : Liens + actions (inchangé) */}
        <div className="hidden sm:flex items-center gap-4">
          {/* Liens principaux */}
          <div className="flex items-center gap-4 text-xs sm:text-sm">
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/" && pathname.startsWith(link.href));

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "uppercase tracking-[0.22em] text-[11px]",
                    isActive
                      ? "text-zinc-900"
                      : "text-zinc-500 hover:text-zinc-800"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Zone compte / auth */}
          <div className="flex items-center gap-3">
            {status === "loading" ? (
              <span className="text-[11px] sm:text-xs text-zinc-400">…</span>
            ) : isAuthenticated ? (
              <>
                <Link
                  href="/compte"
                  className="inline-flex items-center gap-1 text-[11px] sm:text-xs text-zinc-700 hover:text-zinc-900"
                >
                  <span className="uppercase tracking-[0.18em]">
                    {userName.length > 18
                      ? `${userName.slice(0, 16)}…`
                      : userName}
                  </span>
                </Link>

                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-[11px] sm:text-xs text-zinc-500 hover:text-zinc-900"
                >
                  Se déconnecter
                </button>
              </>
            ) : (
              <Link
                href="/connexion"
                className="text-[11px] sm:text-xs text-zinc-500 hover:text-zinc-900"
              >
                Se connecter
              </Link>
            )}

            {/* Favoris */}
            <Link
              href="/favoris"
              className="relative inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-3 py-1.5 text-[11px] sm:text-xs text-zinc-700 hover:border-yellow-500 hover:bg-yellow-50 transition-colors"
            >
              <span>Favoris</span>
              <span className="text-sm">♡</span>
              <span className="inline-flex items-center justify-center min-w-[1.4rem] h-5 rounded-full bg-zinc-900 text-white text-[10px] font-semibold">
                {totalFavorites}
              </span>
            </Link>

            {/* Panier */}
            <Link
              href="/panier"
              className="relative inline-flex items-center gap-2 rounded-full border border-zinc-200 px-3 py-1.5 text-[11px] sm:text-xs text-zinc-700 hover:border-yellow-500 hover:bg-yellow-50 transition-colors"
            >
              <span>Panier</span>
              <span className="inline-flex items-center justify-center min-w-[1.4rem] h-5 rounded-full bg-yellow-500 text-white text-[10px] font-semibold">
                {totalQuantity}
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* ✅ Mobile : panneau déroulant */}
      <div
        className={cn(
          "sm:hidden border-t border-zinc-200 bg-white overflow-hidden transition-[max-height] duration-300",
          open ? "max-h-[520px]" : "max-h-0"
        )}
      >
        <div ref={panelRef} className="max-w-6xl mx-auto px-4 py-4 space-y-4">
          {/* Liens principaux */}
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/" && pathname.startsWith(link.href));

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "rounded-xl px-3 py-2 text-sm border transition-colors",
                    isActive
                      ? "border-yellow-200 bg-yellow-50 text-zinc-900"
                      : "border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Compte / auth */}
          <div className="border border-zinc-200 rounded-2xl p-3">
            {status === "loading" ? (
              <div className="text-sm text-zinc-500">Chargement…</div>
            ) : isAuthenticated ? (
              <div className="space-y-2">
                <Link
                  href="/compte"
                  onClick={() => setOpen(false)}
                  className="block text-sm text-zinc-900 font-medium"
                >
                  {userName.length > 22 ? `${userName.slice(0, 20)}…` : userName}
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    signOut({ callbackUrl: "/" });
                  }}
                  className="w-full inline-flex items-center justify-center rounded-full border border-zinc-900 bg-zinc-900 px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.2em] text-white hover:bg-zinc-800 transition"
                >
                  Se déconnecter
                </button>
              </div>
            ) : (
              <Link
                href="/connexion"
                onClick={() => setOpen(false)}
                className="w-full inline-flex items-center justify-center rounded-full border border-zinc-900 bg-zinc-900 px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.2em] text-white hover:bg-zinc-800 transition"
              >
                Se connecter
              </Link>
            )}
          </div>

          {/* Favoris + Panier (versions mobile) */}
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/favoris"
              onClick={() => setOpen(false)}
              className="inline-flex items-center justify-between rounded-2xl border border-zinc-200 px-3 py-3 text-sm text-zinc-700 hover:border-yellow-500 hover:bg-yellow-50 transition-colors"
            >
              <span className="inline-flex items-center gap-2">
                <span>Favoris</span>
                <span>♡</span>
              </span>
              <span className="inline-flex items-center justify-center min-w-[1.7rem] h-6 rounded-full bg-zinc-900 text-white text-[11px] font-semibold px-2">
                {totalFavorites}
              </span>
            </Link>

            <Link
              href="/panier"
              onClick={() => setOpen(false)}
              className="inline-flex items-center justify-between rounded-2xl border border-zinc-200 px-3 py-3 text-sm text-zinc-700 hover:border-yellow-500 hover:bg-yellow-50 transition-colors"
            >
              <span>Panier</span>
              <span className="inline-flex items-center justify-center min-w-[1.7rem] h-6 rounded-full bg-yellow-500 text-white text-[11px] font-semibold px-2">
                {totalQuantity}
              </span>
            </Link>
          </div>

          {/* Lien “Fermer” (optionnel mais pratique) */}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-full inline-flex items-center justify-center rounded-full border border-zinc-200 bg-white px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-700 hover:bg-zinc-50 transition"
          >
            Fermer le menu
          </button>
        </div>
      </div>
    </nav>
  );
}
