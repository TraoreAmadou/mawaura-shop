// "use client";

// import React, { useEffect, useRef, useState } from "react";
// import Link from "next/link";
// import { usePathname } from "next/navigation";
// import { useCart } from "@/app/cart-context";
// import { useFavorites } from "@/app/favorites-context";
// import { useSession, signOut } from "next-auth/react";

// const navLinks = [
//   { href: "/", label: "Accueil" },
//   { href: "/boutique", label: "Boutique" },
// ];

// function cn(...classes: Array<string | false | null | undefined>) {
//   return classes.filter(Boolean).join(" ");
// }

// export function Navbar() {
//   const pathname = usePathname();
//   const { totalQuantity } = useCart();
//   const { totalFavorites } = useFavorites();
//   const { data: session, status } = useSession();

//   const isAuthenticated = status === "authenticated";
//   const userName = session?.user?.name || "Mon compte";

//   // ✅ Mobile menu full-screen
//   const [open, setOpen] = useState(false);
//   const closeBtnRef = useRef<HTMLButtonElement | null>(null);

//   // Fermer quand on change de page
//   useEffect(() => {
//     setOpen(false);
//   }, [pathname]);

//   // ESC + focus close
//   useEffect(() => {
//     function onKeyDown(e: KeyboardEvent) {
//       if (e.key === "Escape") setOpen(false);
//     }
//     document.addEventListener("keydown", onKeyDown);

//     if (open) {
//       setTimeout(() => closeBtnRef.current?.focus(), 50);
//     }

//     return () => document.removeEventListener("keydown", onKeyDown);
//   }, [open]);

//   // Bloquer scroll derrière
//   useEffect(() => {
//     if (!open) return;
//     const prev = document.body.style.overflow;
//     document.body.style.overflow = "hidden";
//     return () => {
//       document.body.style.overflow = prev;
//     };
//   }, [open]);

//   return (
//     <nav className="fixed inset-x-0 top-0 z-30 border-b border-zinc-200 bg-white/80 backdrop-blur-md">
//       <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
//         {/* Logo / marque */}
//         <Link href="/" className="flex items-baseline gap-2">
//           <span className="text-base sm:text-lg font-semibold tracking-[0.25em] uppercase text-zinc-900">
//             MAWAURA
//           </span>
//           <span className="text-xs sm:text-sm text-zinc-500 tracking-[0.3em] uppercase">
//             Accessories
//           </span>
//         </Link>

//         {/* ✅ Mobile right actions: favoris + panier + menu */}
//         <div className="sm:hidden flex items-center gap-2">
//           <Link
//             href="/favoris"
//             className="relative inline-flex items-center justify-center rounded-full border border-zinc-200 w-10 h-10 text-zinc-700 hover:bg-zinc-50 transition-colors"
//             aria-label="Favoris"
//           >
//             <span className="text-lg">♡</span>
//             <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[1.3rem] h-5 rounded-full bg-zinc-900 text-white text-[10px] font-semibold px-1">
//               {totalFavorites}
//             </span>
//           </Link>

//           <Link
//             href="/panier"
//             className="relative inline-flex items-center justify-center rounded-full border border-zinc-200 w-10 h-10 text-zinc-700 hover:bg-zinc-50 transition-colors"
//             aria-label="Panier"
//           >
//             <span className="text-base">🛒</span>
//             <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[1.3rem] h-5 rounded-full bg-yellow-500 text-white text-[10px] font-semibold px-1">
//               {totalQuantity}
//             </span>
//           </Link>

//           <button
//             type="button"
//             className="inline-flex items-center justify-center rounded-full border border-zinc-200 w-10 h-10 text-zinc-700 hover:bg-zinc-50 transition-colors"
//             aria-label="Ouvrir le menu"
//             aria-expanded={open}
//             onClick={() => setOpen(true)}
//           >
//             <span className="text-lg leading-none">☰</span>
//           </button>
//         </div>

//         {/* ✅ Desktop : inchangé */}
//         <div className="hidden sm:flex items-center gap-4">
//           {/* Liens principaux */}
//           <div className="flex items-center gap-4 text-xs sm:text-sm">
//             {navLinks.map((link) => {
//               const isActive =
//                 pathname === link.href ||
//                 (link.href !== "/" && pathname.startsWith(link.href));

//               return (
//                 <Link
//                   key={link.href}
//                   href={link.href}
//                   className={cn(
//                     "uppercase tracking-[0.22em] text-[11px]",
//                     isActive
//                       ? "text-zinc-900"
//                       : "text-zinc-500 hover:text-zinc-800"
//                   )}
//                 >
//                   {link.label}
//                 </Link>
//               );
//             })}
//           </div>

//           {/* Zone compte / auth */}
//           <div className="flex items-center gap-3">
//             {status === "loading" ? (
//               <span className="text-[11px] sm:text-xs text-zinc-400">…</span>
//             ) : isAuthenticated ? (
//               <>
//                 <Link
//                   href="/compte"
//                   className="inline-flex items-center gap-1 text-[11px] sm:text-xs text-zinc-700 hover:text-zinc-900"
//                 >
//                   <span className="uppercase tracking-[0.18em]">
//                     {userName.length > 18
//                       ? `${userName.slice(0, 16)}…`
//                       : userName}
//                   </span>
//                 </Link>

//                 <button
//                   type="button"
//                   onClick={() => signOut({ callbackUrl: "/" })}
//                   className="text-[11px] sm:text-xs text-zinc-500 hover:text-zinc-900"
//                 >
//                   Se déconnecter
//                 </button>
//               </>
//             ) : (
//               <Link
//                 href="/connexion"
//                 className="text-[11px] sm:text-xs text-zinc-500 hover:text-zinc-900"
//               >
//                 Se connecter
//               </Link>
//             )}

//             {/* Favoris */}
//             <Link
//               href="/favoris"
//               className="relative inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-3 py-1.5 text-[11px] sm:text-xs text-zinc-700 hover:border-yellow-500 hover:bg-yellow-50 transition-colors"
//             >
//               <span>Favoris</span>
//               <span className="text-sm">♡</span>
//               <span className="inline-flex items-center justify-center min-w-[1.4rem] h-5 rounded-full bg-zinc-900 text-white text-[10px] font-semibold">
//                 {totalFavorites}
//               </span>
//             </Link>

//             {/* Panier */}
//             <Link
//               href="/panier"
//               className="relative inline-flex items-center gap-2 rounded-full border border-zinc-200 px-3 py-1.5 text-[11px] sm:text-xs text-zinc-700 hover:border-yellow-500 hover:bg-yellow-50 transition-colors"
//             >
//               <span>Panier</span>
//               <span className="inline-flex items-center justify-center min-w-[1.4rem] h-5 rounded-full bg-yellow-500 text-white text-[10px] font-semibold">
//                 {totalQuantity}
//               </span>
//             </Link>
//           </div>
//         </div>
//       </div>

//       {/* ✅ MOBILE MENU FULLSCREEN */}
//       <div
//         className={cn(
//           "sm:hidden fixed inset-0 z-50 transition-opacity",
//           open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
//         )}
//         aria-hidden={!open}
//       >
//         {/* ✅ overlay plus visible + blur (pour éviter que le menu “se perde” sur fond blanc) */}
//         <div
//           className={cn(
//             "absolute inset-0 bg-black/55 backdrop-blur-[1px] transition-opacity duration-200",
//             open ? "opacity-100" : "opacity-0"
//           )}
//           onClick={() => setOpen(false)}
//         />

//         {/* ✅ panel plein écran : bien opaque + shadow/ring */}
//         <div
//           className={cn(
//             "absolute inset-0 bg-white shadow-2xl ring-1 ring-zinc-200 transition-transform duration-200",
//             open ? "translate-y-0" : "translate-y-2"
//           )}
//           role="dialog"
//           aria-modal="true"
//           aria-label="Menu"
//           onClick={(e) => e.stopPropagation()}
//         >
//           {/* header menu */}
//           <div className="h-16 px-4 border-b border-zinc-200 flex items-center justify-between bg-white">
//             <div className="flex flex-col leading-tight">
//               <span className="text-sm font-semibold tracking-[0.22em] uppercase text-zinc-900">
//                 MAWAURA
//               </span>
//               <span className="text-[10px] text-zinc-500 tracking-[0.3em] uppercase">
//                 Accessories
//               </span>
//             </div>

//             <button
//               ref={closeBtnRef}
//               type="button"
//               className="inline-flex items-center justify-center rounded-full border border-zinc-200 w-10 h-10 text-zinc-700 hover:bg-zinc-50 transition-colors"
//               aria-label="Fermer le menu"
//               onClick={() => setOpen(false)}
//             >
//               <span className="text-lg leading-none">✕</span>
//             </button>
//           </div>

//           {/* ✅ content scrollable (dvh -> mieux sur mobile) */}
//           <div className="h-[calc(100dvh-4rem)] overflow-y-auto px-4 py-5 space-y-4 bg-white">
//             {/* liens principaux */}
//             <div className="space-y-2">
//               {navLinks.map((link) => {
//                 const isActive =
//                   pathname === link.href ||
//                   (link.href !== "/" && pathname.startsWith(link.href));

//                 return (
//                   <Link
//                     key={link.href}
//                     href={link.href}
//                     onClick={() => setOpen(false)}
//                     className={cn(
//                       "block w-full rounded-2xl px-4 py-4 border text-zinc-800 bg-white",
//                       isActive
//                         ? "border-yellow-200 bg-yellow-50"
//                         : "border-zinc-200 hover:bg-zinc-50"
//                     )}
//                   >
//                     <span className="uppercase tracking-[0.18em] text-[12px] font-medium">
//                       {link.label}
//                     </span>
//                   </Link>
//                 );
//               })}
//             </div>

//             {/* bloc compte */}
//             <div className="border border-zinc-200 rounded-3xl p-4 space-y-3 bg-white">
//               {status === "loading" ? (
//                 <div className="text-sm text-zinc-500">Chargement…</div>
//               ) : isAuthenticated ? (
//                 <>
//                   <div className="text-sm text-zinc-900 font-medium">
//                     {userName.length > 26 ? `${userName.slice(0, 24)}…` : userName}
//                   </div>

//                   <div className="grid gap-2">
//                     <Link
//                       href="/compte"
//                       onClick={() => setOpen(false)}
//                       className="inline-flex items-center justify-center rounded-full border border-zinc-900 bg-zinc-900 px-4 py-3 text-[11px] font-medium uppercase tracking-[0.2em] text-white hover:bg-zinc-800 transition"
//                     >
//                       Mon compte
//                     </Link>

//                     <button
//                       type="button"
//                       onClick={() => {
//                         setOpen(false);
//                         signOut({ callbackUrl: "/" });
//                       }}
//                       className="inline-flex items-center justify-center rounded-full border border-zinc-200 bg-white px-4 py-3 text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-700 hover:bg-zinc-50 transition"
//                     >
//                       Se déconnecter
//                     </button>
//                   </div>
//                 </>
//               ) : (
//                 <Link
//                   href="/connexion"
//                   onClick={() => setOpen(false)}
//                   className="inline-flex items-center justify-center w-full rounded-full border border-zinc-900 bg-zinc-900 px-4 py-3 text-[11px] font-medium uppercase tracking-[0.2em] text-white hover:bg-zinc-800 transition"
//                 >
//                   Se connecter
//                 </Link>
//               )}
//             </div>

//             {/* favoris / panier (version “grands boutons”) */}
//             <div className="grid grid-cols-1 gap-3">
//               <Link
//                 href="/favoris"
//                 onClick={() => setOpen(false)}
//                 className="inline-flex items-center justify-between rounded-3xl border border-zinc-200 px-4 py-4 text-zinc-800 bg-white hover:border-yellow-500 hover:bg-yellow-50 transition-colors"
//               >
//                 <span className="inline-flex items-center gap-2">
//                   <span className="text-base">♡</span>
//                   <span className="text-sm font-medium">Favoris</span>
//                 </span>
//                 <span className="inline-flex items-center justify-center min-w-[2rem] h-7 rounded-full bg-zinc-900 text-white text-[12px] font-semibold px-2">
//                   {totalFavorites}
//                 </span>
//               </Link>

//               <Link
//                 href="/panier"
//                 onClick={() => setOpen(false)}
//                 className="inline-flex items-center justify-between rounded-3xl border border-zinc-200 px-4 py-4 text-zinc-800 bg-white hover:border-yellow-500 hover:bg-yellow-50 transition-colors"
//               >
//                 <span className="inline-flex items-center gap-2">
//                   <span className="text-base">🛒</span>
//                   <span className="text-sm font-medium">Panier</span>
//                 </span>
//                 <span className="inline-flex items-center justify-center min-w-[2rem] h-7 rounded-full bg-yellow-500 text-white text-[12px] font-semibold px-2">
//                   {totalQuantity}
//                 </span>
//               </Link>
//             </div>

//             <div className="pt-2">
//               <Link
//                 href="/boutique"
//                 onClick={() => setOpen(false)}
//                 className="block text-center text-[11px] text-zinc-500 hover:text-zinc-800"
//               >
//                 Continuer mes achats →
//               </Link>
//             </div>
//           </div>
//         </div>
//       </div>
//     </nav>
//   );
// }

// Version “card panel” plus légère : POPOP

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

  // ✅ Mobile menu “card panel”
  const [open, setOpen] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  // Fermer quand on change de page
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // ESC + focus close
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);

    if (open) {
      setTimeout(() => closeBtnRef.current?.focus(), 50);
    }

    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // Bloquer scroll derrière (utile même en “card”)
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

        {/* ✅ Mobile right actions: favoris + panier + menu */}
        <div className="sm:hidden flex items-center gap-2">
          <Link
            href="/favoris"
            className="relative inline-flex items-center justify-center rounded-full border border-zinc-200 w-10 h-10 text-zinc-700 hover:bg-zinc-50 transition-colors"
            aria-label="Favoris"
          >
            <span className="text-lg">♡</span>
            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[1.3rem] h-5 rounded-full bg-zinc-900 text-white text-[10px] font-semibold px-1">
              {totalFavorites}
            </span>
          </Link>

          <Link
            href="/panier"
            className="relative inline-flex items-center justify-center rounded-full border border-zinc-200 w-10 h-10 text-zinc-700 hover:bg-zinc-50 transition-colors"
            aria-label="Panier"
          >
            <span className="text-base">🛒</span>
            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[1.3rem] h-5 rounded-full bg-yellow-500 text-white text-[10px] font-semibold px-1">
              {totalQuantity}
            </span>
          </Link>

          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full border border-zinc-200 w-10 h-10 text-zinc-700 hover:bg-zinc-50 transition-colors"
            aria-label="Ouvrir le menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            <span className="text-lg leading-none">☰</span>
          </button>
        </div>

        {/* ✅ Desktop : inchangé */}
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

      {/* ✅ MOBILE MENU “CARD PANEL” */}
      <div
        className={cn(
          "sm:hidden fixed inset-0 z-50 transition-opacity",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        aria-hidden={!open}
      >
        {/* overlay */}
        <div
          className={cn(
            "absolute inset-0 bg-black/45 backdrop-blur-[1px] transition-opacity duration-200",
            open ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setOpen(false)}
        />

        {/* panel : une “carte” sous la navbar */}
        <div
          className={cn(
            "absolute left-3 right-3 top-[4.25rem] rounded-3xl bg-white shadow-2xl ring-1 ring-zinc-200 overflow-hidden transition-all duration-200",
            open ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
          )}
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          onClick={(e) => e.stopPropagation()}
        >
          {/* header panel */}
          <div className="px-4 py-3 border-b border-zinc-200 flex items-center justify-between bg-white">
            <div className="flex flex-col leading-tight">
              <span className="text-xs font-semibold tracking-[0.22em] uppercase text-zinc-900">
                Menu
              </span>
              <span className="text-[10px] text-zinc-500 tracking-[0.3em] uppercase">
                Mawaura
              </span>
            </div>

            <button
              ref={closeBtnRef}
              type="button"
              className="inline-flex items-center justify-center rounded-full border border-zinc-200 w-10 h-10 text-zinc-700 hover:bg-zinc-50 transition-colors"
              aria-label="Fermer le menu"
              onClick={() => setOpen(false)}
            >
              <span className="text-lg leading-none">✕</span>
            </button>
          </div>

          {/* content : scrollable mais dans une carte */}
          <div className="max-h-[70dvh] overflow-y-auto px-4 py-4 space-y-4 bg-white">
            {/* liens principaux */}
            <div className="space-y-2">
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
                      "block w-full rounded-2xl px-4 py-4 border text-zinc-800 bg-white",
                      isActive
                        ? "border-yellow-200 bg-yellow-50"
                        : "border-zinc-200 hover:bg-zinc-50"
                    )}
                  >
                    <span className="uppercase tracking-[0.18em] text-[12px] font-medium">
                      {link.label}
                    </span>
                  </Link>
                );
              })}
            </div>

            {/* bloc compte */}
            <div className="border border-zinc-200 rounded-3xl p-4 space-y-3 bg-white">
              {status === "loading" ? (
                <div className="text-sm text-zinc-500">Chargement…</div>
              ) : isAuthenticated ? (
                <>
                  <div className="text-sm text-zinc-900 font-medium">
                    {userName.length > 26 ? `${userName.slice(0, 24)}…` : userName}
                  </div>

                  <div className="grid gap-2">
                    <Link
                      href="/compte"
                      onClick={() => setOpen(false)}
                      className="inline-flex items-center justify-center rounded-full border border-zinc-900 bg-zinc-900 px-4 py-3 text-[11px] font-medium uppercase tracking-[0.2em] text-white hover:bg-zinc-800 transition"
                    >
                      Mon compte
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        signOut({ callbackUrl: "/" });
                      }}
                      className="inline-flex items-center justify-center rounded-full border border-zinc-200 bg-white px-4 py-3 text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-700 hover:bg-zinc-50 transition"
                    >
                      Se déconnecter
                    </button>
                  </div>
                </>
              ) : (
                <Link
                  href="/connexion"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center justify-center w-full rounded-full border border-zinc-900 bg-zinc-900 px-4 py-3 text-[11px] font-medium uppercase tracking-[0.2em] text-white hover:bg-zinc-800 transition"
                >
                  Se connecter
                </Link>
              )}
            </div>

            {/* favoris / panier (grands boutons) */}
            <div className="grid grid-cols-1 gap-3">
              <Link
                href="/favoris"
                onClick={() => setOpen(false)}
                className="inline-flex items-center justify-between rounded-3xl border border-zinc-200 px-4 py-4 text-zinc-800 bg-white hover:border-yellow-500 hover:bg-yellow-50 transition-colors"
              >
                <span className="inline-flex items-center gap-2">
                  <span className="text-base">♡</span>
                  <span className="text-sm font-medium">Favoris</span>
                </span>
                <span className="inline-flex items-center justify-center min-w-[2rem] h-7 rounded-full bg-zinc-900 text-white text-[12px] font-semibold px-2">
                  {totalFavorites}
                </span>
              </Link>

              <Link
                href="/panier"
                onClick={() => setOpen(false)}
                className="inline-flex items-center justify-between rounded-3xl border border-zinc-200 px-4 py-4 text-zinc-800 bg-white hover:border-yellow-500 hover:bg-yellow-50 transition-colors"
              >
                <span className="inline-flex items-center gap-2">
                  <span className="text-base">🛒</span>
                  <span className="text-sm font-medium">Panier</span>
                </span>
                <span className="inline-flex items-center justify-center min-w-[2rem] h-7 rounded-full bg-yellow-500 text-white text-[12px] font-semibold px-2">
                  {totalQuantity}
                </span>
              </Link>
            </div>

            <div className="pt-1">
              <Link
                href="/boutique"
                onClick={() => setOpen(false)}
                className="block text-center text-[11px] text-zinc-500 hover:text-zinc-800"
              >
                Continuer mes achats →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
