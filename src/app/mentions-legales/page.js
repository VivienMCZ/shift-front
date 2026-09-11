import Link from 'next/link'
import LegalPage, { InfoLine } from '@/app/components/LegalPage'
import { EDITEUR, HEBERGEUR, SITE_NAME, SITE_URL } from '@/app/lib/site-info'

export const metadata = {
  title: 'Mentions légales',
  description: `Éditeur, hébergeur et informations légales du site ${SITE_NAME}.`,
}

export default function MentionsLegalesPage() {
  return (
    <LegalPage badge="Informations légales" title="Mentions légales">
      <p>
        Conformément à l’article 6 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans
        l’économie numérique (LCEN), voici l’identité des intervenants du site {SITE_NAME}, accessible
        à l’adresse {SITE_URL}.
      </p>

      <h2>Éditeur du site</h2>
      <ul>
        <InfoLine label="Nom ou raison sociale">{EDITEUR.nom}</InfoLine>
        <InfoLine label="Statut juridique">{EDITEUR.statut}</InfoLine>
        <InfoLine label="Adresse">{EDITEUR.adresse}</InfoLine>
        <InfoLine label="Immatriculation">{EDITEUR.immatriculation}</InfoLine>
        <InfoLine label="Contact">{EDITEUR.email}</InfoLine>
        <InfoLine label="Directeur de la publication">{EDITEUR.directeurPublication}</InfoLine>
      </ul>

      <h2>Hébergement</h2>
      <ul>
        <InfoLine label="Hébergeur">{HEBERGEUR.nom}</InfoLine>
        <InfoLine label="Adresse">{HEBERGEUR.adresse}</InfoLine>
        <InfoLine label="Téléphone">{HEBERGEUR.telephone}</InfoLine>
      </ul>

      <h2>Propriété intellectuelle</h2>
      <p>
        La structure du site, ses textes, graphismes et logiciels sont la propriété de l’éditeur, sauf
        mention contraire. Toute reproduction ou réutilisation, totale ou partielle, sans autorisation
        écrite préalable est interdite. Les marques et contenus de tiers (auto-écoles, organismes
        financeurs) restent la propriété de leurs titulaires respectifs.
      </p>

      <h2>Informations publiées</h2>
      <p>
        Les informations sur les auto-écoles et les aides au financement sont fournies à titre
        indicatif. Leur utilisation est encadrée par les{' '}
        <Link href="/cgu">conditions générales d’utilisation</Link>.
      </p>

      <h2>Données personnelles</h2>
      <p>
        Le traitement de vos données est décrit dans la{' '}
        <Link href="/confidentialite">politique de confidentialité</Link>.
      </p>
    </LegalPage>
  )
}
