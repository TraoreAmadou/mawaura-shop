import Link from "next/link";
import React from "react";

export default function MentionsLegalesPage() {
  return (
    <main className="min-h-screen bg-white text-zinc-900">
      {/* Header / breadcrumb */}
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
              <span className="text-zinc-700 font-medium">Mentions légales</span>
            </nav>
          </div>
          <Link
            href="/"
            className="text-xs sm:text-sm text-zinc-500 hover:text-zinc-800"
          >
            ← Retour à l&apos;accueil
          </Link>
        </div>
      </header>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
        <header>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3">
            Mentions légales
          </h1>
          <p className="text-sm sm:text-base text-zinc-600">
            Les présentes mentions légales sont fournies à titre indicatif et
            doivent être adaptées à votre situation réelle. Faites-les valider
            par un professionnel du droit si nécessaire.
          </p>
        </header>

        <section className="space-y-2 text-sm sm:text-base text-zinc-700">
          <h2 className="font-semibold text-zinc-900">
            1. Éditeur du site
          </h2>
          <p>
            Le site <strong>Mawaura Accessories</strong> est édité par :
          </p>
          <p>
            <strong>Nom / Dénomination sociale :</strong> [Votre nom ou le nom
            de votre société]
            <br />
            <strong>Forme juridique :</strong> [Auto-entrepreneur / SAS / etc.]
            <br />
            <strong>Adresse :</strong> [Votre adresse ou siège social]
            <br />
            <strong>SIREN / SIRET :</strong> [Votre numéro SIREN/SIRET]
            <br />
            <strong>Responsable de la publication :</strong> [Nom, prénom]
            <br />
            <strong>Contact :</strong> [Adresse e-mail de contact]
          </p>
        </section>

        <section className="space-y-2 text-sm sm:text-base text-zinc-700">
          <h2 className="font-semibold text-zinc-900">
            2. Hébergeur du site
          </h2>
          <p>
            Le site est hébergé par :
            <br />
            <strong>Nom :</strong> [Nom de l&apos;hébergeur, ex : Vercel Inc.]
            <br />
            <strong>Adresse :</strong> [Adresse de l&apos;hébergeur]
            <br />
            <strong>Site web :</strong> [URL du site de l&apos;hébergeur]
          </p>
        </section>

        <section className="space-y-2 text-sm sm:text-base text-zinc-700">
          <h2 className="font-semibold text-zinc-900">
            3. Propriété intellectuelle
          </h2>
          <p>
            L&apos;ensemble des éléments présents sur le site
            <strong> Mawaura Accessories</strong> (textes, images, logos,
            graphiques, mise en page, etc.) sont, sauf mention contraire,
            la propriété exclusive de l&apos;éditeur et sont protégés par le
            droit de la propriété intellectuelle.
          </p>
          <p>
            Toute reproduction, représentation, modification, adaptation,
            diffusion ou exploitation, totale ou partielle, du contenu du site,
            par quelque procédé que ce soit, sans l&apos;autorisation écrite
            préalable de l&apos;éditeur est interdite et pourra faire l&apos;objet de
            poursuites.
          </p>
        </section>

        <section className="space-y-2 text-sm sm:text-base text-zinc-700">
          <h2 className="font-semibold text-zinc-900">
            4. Données personnelles
          </h2>
          <p>
            Les informations collectées via le site (formulaire de contact,
            commande, inscription à une newsletter, etc.) sont utilisées
            exclusivement dans le cadre de la relation commerciale avec
            <strong> Mawaura Accessories</strong>.
          </p>
          <p>
            Conformément au Règlement Général sur la Protection des Données
            (RGPD) et à la loi Informatique et Libertés, vous disposez d&apos;un
            droit d&apos;accès, de rectification, d&apos;opposition et de suppression
            de vos données personnelles. Vous pouvez exercer ces droits en
            contactant : [Votre e-mail de contact dédié RGPD].
          </p>
        </section>

        <section className="space-y-2 text-sm sm:text-base text-zinc-700">
          <h2 className="font-semibold text-zinc-900">
            5. Cookies
          </h2>
          <p>
            Le site peut être amené à utiliser des cookies afin d&apos;améliorer
            l&apos;expérience de navigation, mesurer l&apos;audience ou permettre
            certaines fonctionnalités (panier, préférences, etc.).
          </p>
          <p>
            Vous pouvez configurer votre navigateur pour accepter, refuser ou
            supprimer les cookies. Le refus de certains cookies peut altérer le
            fonctionnement du site.
          </p>
        </section>

        <section className="space-y-2 text-sm sm:text-base text-zinc-700">
          <h2 className="font-semibold text-zinc-900">
            6. Contact
          </h2>
          <p>
            Pour toute question concernant les mentions légales du site, vous
            pouvez nous écrire à : <strong>[Votre e-mail de contact]</strong>.
          </p>
        </section>
      </section>
    </main>
  );
}
