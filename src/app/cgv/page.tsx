import Link from "next/link";
import React from "react";

export default function CgvPage() {
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
              <span className="text-zinc-700 font-medium">
                Conditions générales de vente
              </span>
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
            Conditions Générales de Vente (CGV)
          </h1>
          <p className="text-sm sm:text-base text-zinc-600">
            Ces conditions générales de vente sont fournies à titre indicatif.
            Elles doivent être adaptées à votre activité et validées par un
            professionnel si nécessaire.
          </p>
        </header>

        <section className="space-y-2 text-sm sm:text-base text-zinc-700">
          <h2 className="font-semibold text-zinc-900">
            1. Objet
          </h2>
          <p>
            Les présentes Conditions Générales de Vente (ci-après « CGV »)
            régissent les ventes de produits réalisées via le site
            <strong> Mawaura Accessories</strong> entre l&apos;éditeur du site
            (ci-après « le Vendeur ») et toute personne physique effectuant un
            achat à titre personnel (ci-après « le Client »).
          </p>
        </section>

        <section className="space-y-2 text-sm sm:text-base text-zinc-700">
          <h2 className="font-semibold text-zinc-900">
            2. Produits
          </h2>
          <p>
            Les produits proposés à la vente sont décrits avec la plus grande
            précision possible (photos, descriptions, matériaux, couleurs,
            dimensions, etc.). Des variations légères peuvent toutefois exister,
            notamment en raison du rendu des couleurs sur écran ou du caractère
            artisanal de certaines pièces.
          </p>
        </section>

        <section className="space-y-2 text-sm sm:text-base text-zinc-700">
          <h2 className="font-semibold text-zinc-900">
            3. Prix
          </h2>
          <p>
            Les prix sont indiqués en euros, toutes taxes comprises (TTC), sauf
            indication contraire. Les frais de livraison, le cas échéant, sont
            précisés lors de la validation du panier et avant le paiement.
          </p>
          <p>
            Le Vendeur se réserve le droit de modifier ses prix à tout moment,
            mais les produits seront facturés sur la base des tarifs en vigueur
            au moment de la validation de la commande.
          </p>
        </section>

        <section className="space-y-2 text-sm sm:text-base text-zinc-700">
          <h2 className="font-semibold text-zinc-900">
            4. Commande
          </h2>
          <p>
            Le Client peut passer commande via le site en sélectionnant les
            produits de son choix, qui seront ajoutés à son panier. La commande
            est définitivement enregistrée après validation du paiement.
          </p>
          <p>
            Le Vendeur se réserve le droit de refuser ou d&apos;annuler toute
            commande en cas de litige existant avec le Client, de suspicion de
            fraude ou de problème de paiement.
          </p>
        </section>

        <section className="space-y-2 text-sm sm:text-base text-zinc-700">
          <h2 className="font-semibold text-zinc-900">
            5. Paiement
          </h2>
          <p>
            Le règlement des achats s&apos;effectue en ligne par carte bancaire
            via une solution de paiement sécurisée (ex. Stripe). Aucune
            information bancaire n&apos;est conservée directement par le
            Vendeur.
          </p>
          <p>
            La commande n&apos;est considérée comme effective qu&apos;après
            confirmation de l&apos;acceptation du paiement par l&apos;organisme
            de paiement sécurisé.
          </p>
        </section>

        <section className="space-y-2 text-sm sm:text-base text-zinc-700">
          <h2 className="font-semibold text-zinc-900">
            6. Livraison
          </h2>
          <p>
            Les produits sont livrés à l&apos;adresse indiquée par le Client
            lors de la commande. Les délais de livraison sont donnés à titre
            indicatif et peuvent varier selon le transporteur et la destination.
          </p>
          <p>
            En cas de retard important ou de colis perdu, le Client est invité à
            contacter le Vendeur afin qu&apos;une solution soit recherchée avec
            le transporteur.
          </p>
        </section>

        <section className="space-y-2 text-sm sm:text-base text-zinc-700">
          <h2 className="font-semibold text-zinc-900">
            7. Droit de rétractation
          </h2>
          <p>
            Conformément au droit de la consommation, le Client dispose, sauf
            exception légale, d&apos;un délai de 14 jours à compter de la
            réception de sa commande pour exercer son droit de rétractation,
            sans avoir à justifier de motifs ni à payer de pénalités.
          </p>
          <p>
            Les produits doivent être retournés dans leur état d&apos;origine,
            non portés, non abîmés, dans leur emballage d&apos;origine. Les
            frais de retour sont à la charge du Client, sauf disposition
            contraire indiquée par le Vendeur.
          </p>
        </section>

        <section className="space-y-2 text-sm sm:text-base text-zinc-700">
          <h2 className="font-semibold text-zinc-900">
            8. Retours et remboursements
          </h2>
          <p>
            Après réception et vérification des produits retournés, le Vendeur
            procédera au remboursement dans un délai raisonnable, via le même
            moyen de paiement que celui utilisé lors de la commande.
          </p>
          <p>
            Certains produits personnalisés ou réalisés sur mesure peuvent ne pas
            être éligibles au droit de rétractation. Cette information est alors
            clairement indiquée lors de la commande.
          </p>
        </section>

        <section className="space-y-2 text-sm sm:text-base text-zinc-700">
          <h2 className="font-semibold text-zinc-900">
            9. Responsabilité
          </h2>
          <p>
            Le Vendeur ne saurait être tenu pour responsable de tout dommage
            indirect lié à l&apos;utilisation du site ou à l&apos;achat de
            produits, ni des éventuels inconvénients ou dommages liés à
            l&apos;utilisation du réseau Internet (rupture de service, intrusion
            extérieure, virus, etc.).
          </p>
        </section>

        <section className="space-y-2 text-sm sm:text-base text-zinc-700">
          <h2 className="font-semibold text-zinc-900">
            10. Données personnelles
          </h2>
          <p>
            Les données personnelles collectées lors des commandes sont
            utilisées uniquement pour le traitement de celles-ci et la gestion
            de la relation client, conformément à la Politique de
            confidentialité et à la réglementation en vigueur.
          </p>
        </section>

        <section className="space-y-2 text-sm sm:text-base text-zinc-700">
          <h2 className="font-semibold text-zinc-900">
            11. Droit applicable et litiges
          </h2>
          <p>
            Les présentes CGV sont soumises au droit français. En cas de litige,
            une solution amiable sera recherchée en priorité. À défaut,
            compétence est attribuée aux tribunaux français compétents.
          </p>
        </section>
      </section>
    </main>
  );
}
