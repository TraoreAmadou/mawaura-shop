"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/app/cart-context";
import { useFavorites } from "@/app/favorites-context";
import { useSession, signOut } from "next-auth/react";

const navLinks = [
  { href: "/", label: "Accueil" },
  { href: "/boutique", label: "Boutique" },
];

export function Navbar() {
  const pathname = usePathname();
  const { totalQuantity } = useCart();
  const { totalFavorites } = useFavorites();
  const { data: session, status } = useSession();

  const isAuthenticated = status === "authenticated";
  const userName = session?.user?.name || "Mon compte";

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

        {/* Liens de navigation + actions */}
        <div className="flex items-center gap-4">
          {/* Liens principaux */}
          <div className="hidden sm:flex items-center gap-4 text-xs sm:text-sm">
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/" && pathname.startsWith(link.href));

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`uppercase tracking-[0.22em] ${
                    isActive
                      ? "text-zinc-900"
                      : "text-zinc-500 hover:text-zinc-800"
                  } text-[11px]`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Zone compte / auth */}
          <div className="flex items-center gap-3">
            {status === "loading" ? (
              // petit état de chargement discret
              <span className="text-[11px] sm:text-xs text-zinc-400">
                …
              </span>
            ) : isAuthenticated ? (
              <>
                {/* Lien vers l'espace compte */}
                <Link
                  href="/compte"
                  className="hidden sm:inline-flex items-center gap-1 text-[11px] sm:text-xs text-zinc-700 hover:text-zinc-900"
                >
                  <span className="uppercase tracking-[0.18em]">
                    {userName.length > 18
                      ? `${userName.slice(0, 16)}…`
                      : userName}
                  </span>
                </Link>

                {/* Bouton déconnexion */}
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-[11px] sm:text-xs text-zinc-500 hover:text-zinc-900"
                >
                  Se déconnecter
                </button>
              </>
            ) : (
              // Non connecté → lien classique
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
    </nav>
  );
}
