"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/app/cart-context";

const navLinks = [
  { href: "/", label: "Accueil" },
  { href: "/boutique", label: "Boutique" },
  // Tu pourras ajouter plus tard : { href: "/a-propos", label: "À propos" },
];

export function Navbar() {
  const pathname = usePathname();
  const { totalQuantity } = useCart();

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

        {/* Liens de navigation */}
        <div className="flex items-center gap-6">
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

          {/* Lien panier avec badge quantité */}
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
    </nav>
  );
}
