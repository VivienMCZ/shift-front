import Link from 'next/link'
import LegalPage from '@/app/components/LegalPage'
import { EDITEUR, SITE_NAME } from '@/app/lib/site-info'

export const metadata = {
  title: 'Conditions générales d’utilisation',
  description: `Règles d’utilisation du comparateur d’auto-écoles et du calculateur d’aides ${SITE_NAME}.`,
}

/**
 * Pondérations du score global, recopiées de `compute_match` dans
 * `shift-back/app/routers/ecoles.py`. Le Code de la consommation (art. L111-7)
 * impose de publier les critères de classement : si le backend change ses
 * poids, cette page doit suivre.
 */
const CRITERES_SCORE = [
  { critere: 'Délai pour obtenir le permis', poids: '35 %' },
  { critere: 'Note de l’auto-école', poids: '25 %' },
  { critere: 'Prix, rapporté à votre budget', poids: '25 %' },
  { critere: 'Distance de l’adresse choisie', poids: '15 %' },
]

export default function CguPage() {
  return (
    <LegalPage badge="Informations légales" title="Conditions générales d’utilisation">
      <h2>1. Objet</h2>
      <p>
        Les présentes conditions encadrent l’utilisation du site {SITE_NAME}, qui permet de comparer des
        auto-écoles et d’estimer les aides au financement du permis de conduire. Utiliser le site vaut
        acceptation de ces conditions.
      </p>

      <h2>2. Accès au service</h2>
      <p>
        Le service est gratuit. Comparer les auto-écoles et simuler ses aides ne nécessite pas de compte.
        Un compte permet en plus d’enregistrer des favoris et un historique de simulations.
      </p>

      <h2>3. Compte utilisateur</h2>
      <p>
        La connexion se fait par un code à usage unique envoyé à votre adresse e-mail. Vous vous engagez
        à fournir des informations exactes et à ne pas utiliser l’adresse d’un tiers. Vous pouvez
        modifier vos informations ou supprimer votre compte à tout moment depuis votre{' '}
        <Link href="/compte">espace compte</Link>.
      </p>

      <h2>4. Comparateur d’auto-écoles</h2>
      <p>
        Les informations affichées (prix, notes, délais, prestations) sont fournies à titre indicatif et
        peuvent évoluer. Elles ne constituent pas une offre de l’auto-école : vérifiez-les auprès d’elle
        avant de vous engager.
      </p>
      <h3>Critères de classement</h3>
      <p>
        Par défaut, les auto-écoles sont classées selon un score global sur 100, qui pondère :
      </p>
      <ul>
        {CRITERES_SCORE.map(({ critere, poids }) => (
          <li key={critere}>
            {critere} : <strong>{poids}</strong>
          </li>
        ))}
      </ul>
      <p>
        Sans adresse, la distance compte pour une valeur neutre identique pour toutes. Vous pouvez aussi
        trier les résultats par prix croissant ou décroissant. <strong>Aucune auto-école ne paie pour
        être référencée ou mieux classée.</strong>
      </p>

      <h2>5. Calculateur d’aides</h2>
      <p>
        Le calculateur estime, à partir des informations que vous déclarez, les aides auxquelles vous
        pourriez prétendre. Le résultat est indicatif et ne garantit pas leur obtention : les critères
        exacts, les montants et les démarches relèvent des organismes qui les attribuent. Les prêts (qui
        se remboursent) sont présentés à part des aides.
      </p>

      <h2>6. Responsabilité</h2>
      <p>
        L’éditeur s’efforce de maintenir le site accessible et ses informations à jour, sans pouvoir le
        garantir. Il ne saurait être tenu responsable d’une décision prise sur la seule base des
        informations du site, ni du contenu des sites tiers vers lesquels renvoient des liens.
      </p>

      <h2>7. Données personnelles</h2>
      <p>
        Le traitement de vos données est décrit dans la{' '}
        <Link href="/confidentialite">politique de confidentialité</Link>.
      </p>

      <h2>8. Modification des conditions</h2>
      <p>
        Ces conditions peuvent évoluer. La version en vigueur est celle publiée sur cette page, datée
        en tête.
      </p>

      <h2>9. Droit applicable et contact</h2>
      <p>
        Ces conditions sont régies par le droit français. Pour toute question ou réclamation, écrivez à{' '}
        {EDITEUR.email} ; à défaut de solution amiable, le litige relève des tribunaux français
        compétents.
      </p>
    </LegalPage>
  )
}
