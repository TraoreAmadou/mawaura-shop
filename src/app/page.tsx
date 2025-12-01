import React from "react";
import Link from "next/link";

type Product = {
  id: number;
  name: string;
  description: string;
  price: string;
  tag?: string;
};

const featuredProducts: Product[] = [
  {
    id: 1,
    name: "Boucles d’oreilles Aura",
    description: "Fines et lumineuses, pour sublimer chaque mouvement.",
    price: "29,90 €",
    tag: "Nouveau",
  },
  {
    id: 2,
    name: "Collier Signature Mawaura",
    description: "Un collier délicat pour révéler votre aura naturelle.",
    price: "39,90 €",
    tag: "Best-seller",
  },
  {
    id: 3,
    name: "Bracelet Lumière",
    description: "Une touche dorée pour accompagner vos journées.",
    price: "24,90 €",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-zinc-900">
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* halo doré en fond */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_#facc15_0,_transparent_55%)] opacity-40 pointer-events-none" />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <p className="tracking-[0.35em] uppercase text-xs sm:text-sm text-zinc-500 mb-4">
            MAWAURA ACCESSORIES
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-zinc-900 max-w-2xl">
            Bijoux créés pour{" "}
            <span className="text-yellow-500">révéler votre aura.</span>
          </h1>
          <p className="mt-5 max-w-xl text-sm sm:text-base text-zinc-600 leading-relaxed">
            Inspiré par Mawa, Mawaura Accessories célèbre une élégance douce,
            féminine et assumée. Des bijoux pensés comme une signature
            personnelle, pas comme un simple accessoire.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href="#collection"
              className="inline-flex items-center justify-center rounded-full border border-yellow-500 bg-yellow-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-yellow-400 hover:border-yellow-400 transition-colors"
            >
              Voir les pièces phares
            </a>
            <Link
              href="/boutique"
              className="text-sm text-yellow-700 underline-offset-4 hover:underline"
            >
              Accéder à la boutique complète
            </Link>
          </div>
        </div>
      </section>

      {/* Section produits phares */}
      <section
        id="collection"
        className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16"
      >
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold">
              Pièces phares
            </h2>
            <p className="mt-2 text-sm sm:text-base text-zinc-600 max-w-md">
              Une sélection de bijoux Mawaura pour commencer à écrire votre
              histoire, éclat après éclat.
            </p>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500">
            Collection disponible bientôt — restez connectée ✨
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featuredProducts.map((product) => (
            <article
              key={product.id}
              className="relative border border-zinc-200 rounded-2xl p-5 bg-white hover:border-yellow-400/80 shadow-sm hover:shadow-md transition-all"
            >
              {product.tag && (
                <span className="absolute top-4 right-4 text-[11px] uppercase tracking-[0.18em] bg-yellow-400 text-zinc-900 px-2 py-1 rounded-full">
                  {product.tag}
                </span>
              )}
              <div className="aspect-[4/3] rounded-xl bg-zinc-100 mb-4 flex items-center justify-center text-xs text-zinc-400">
                {/* Ici plus tard tu mettras une vraie image produit */}
                Aperçu visuel à venir
              </div>
              <h3 className="text-sm sm:text-base font-medium mb-1">
                {product.name}
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 mb-3">
                {product.description}
              </p>
              <p className="text-sm font-semibold text-yellow-600">
                {product.price}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Section univers de marque */}
      <section className="border-t border-zinc-200 bg-zinc-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 grid gap-10 md:grid-cols-2">
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold mb-3">
              L&apos;univers Mawaura
            </h2>
            <p className="text-sm sm:text-base text-zinc-700 leading-relaxed mb-4">
              Mawaura Accessories est né de l&apos;envie de créer des bijoux
              qui parlent de vous avant même que vous ne disiez un mot. Inspiré
              par Mawa, chaque détail est pensé pour refléter une féminité
              lumineuse, douce mais affirmée.
            </p>
            <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
              Nos pièces sont imaginées pour s&apos;intégrer à votre vie
              quotidienne : un café entre amies, une présentation importante, un
              dîner improvisé. Toujours là, jamais de trop.
            </p>
          </div>
          <div className="space-y-4 text-sm sm:text-base">
            <div className="flex gap-3">
              <span className="mt-1 text-yellow-500">✧</span>
              <div>
                <h3 className="font-medium">Élégance douce</h3>
                <p className="text-zinc-600">
                  Des bijoux qui accompagnent votre style sans le dominer,
                  pensés pour durer dans le temps.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="mt-1 text-yellow-500">✧</span>
              <div>
                <h3 className="font-medium">Pensé pour vous</h3>
                <p className="text-zinc-600">
                  Une attention particulière portée aux détails : confort,
                  légèreté, finitions soignées.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="mt-1 text-yellow-500">✧</span>
              <div>
                <h3 className="font-medium">Un futur e-shop</h3>
                <p className="text-zinc-600">
                  Bientôt, vous pourrez commander vos pièces Mawaura
                  directement en ligne, en toute simplicité et sécurité.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer simple */}
      <footer className="border-t border-zinc-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-zinc-500">
          <p>
            © {new Date().getFullYear()} Mawaura Accessories. Tous droits
            réservés.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/mentions-legales"
              className="hover:text-zinc-700"
            >
              Mentions légales
            </Link>
            <Link href="/cgv" className="hover:text-zinc-700">
              CGV
            </Link>
          </div>
        </div>
      </footer>

    </main>
  );
}
