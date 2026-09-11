import Link from 'next/link'
import LegalPage, { InfoLine } from '@/app/components/LegalPage'
import { A_COMPLETER, CONSERVATION, EDITEUR, SITE_NAME } from '@/app/lib/site-info'

export const metadata = {
  title: 'Politique de confidentialité',
  description: `Données personnelles traitées par ${SITE_NAME}, finalités, durées de conservation et droits.`,
}

/**
 * Chaque ligne décrit un traitement réellement effectué par le code (front et
 * backend). Ajouter une collecte sans mettre ce tableau à jour rend la
 * politique fausse : c'est à relire à chaque nouvelle donnée.
 */
const TRAITEMENTS = [
  {
    donnees: 'E-mail, prénom, nom, téléphone (facultatif)',
    finalite: 'Créer et gérer votre compte, vous connecter par code à usage unique',
    base: 'Exécution des CGU',
  },
  {
    donnees: 'Âge, statut, code postal (facultatifs)',
    finalite: 'Pré-remplir le calculateur d’aides',
    base: 'Exécution des CGU',
  },
  {
    donnees: 'Auto-écoles mises en favori',
    finalite: 'Retrouver et comparer vos auto-écoles',
    base: 'Exécution des CGU',
  },
  {
    donnees:
      'Simulations d’aides faites en étant connecté : âge, statut, code postal, situations cochées (boursier, France Travail, RSA, formation, réserve, secteur d’activité) et aides obtenues',
    finalite: 'Afficher votre historique de simulations',
    base: 'Exécution des CGU',
  },
  {
    donnees: 'Adresse saisie ou position de l’appareil',
    finalite: 'Trouver les auto-écoles proches',
    base: 'Votre demande (la position n’est lue qu’après votre accord dans le navigateur)',
  },
  {
    donnees: 'Adresse IP',
    finalite: 'Limiter les demandes abusives de code de connexion, journaux techniques',
    base: 'Intérêt légitime (sécurité du service)',
  },
]

export default function ConfidentialitePage() {
  return (
    <LegalPage badge="Données personnelles" title="Politique de confidentialité">
      <p>
        Cette page explique quelles données {SITE_NAME} traite, pourquoi, combien de temps, et comment
        exercer vos droits, conformément au Règlement général sur la protection des données (RGPD) et à
        la loi Informatique et Libertés.
      </p>

      <h2>Responsable du traitement</h2>
      <ul>
        <InfoLine label="Responsable">{EDITEUR.nom}</InfoLine>
        <InfoLine label="Adresse">{EDITEUR.adresse}</InfoLine>
        <InfoLine label="Contact">{EDITEUR.email}</InfoLine>
      </ul>

      <h2>Données traitées</h2>
      <p>
        Vous pouvez comparer les auto-écoles et simuler vos aides <strong>sans créer de compte</strong> :
        une simulation faite sans être connecté n’est pas enregistrée.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-zinc-900">
              <th className="py-2 pr-4 font-bold">Données</th>
              <th className="py-2 pr-4 font-bold">Finalité</th>
              <th className="py-2 font-bold">Base légale</th>
            </tr>
          </thead>
          <tbody>
            {TRAITEMENTS.map(({ donnees, finalite, base }) => (
              <tr key={donnees} className="border-b border-zinc-100 align-top">
                <td className="py-2 pr-4">{donnees}</td>
                <td className="py-2 pr-4">{finalite}</td>
                <td className="py-2">{base}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3>Situation de handicap (RQTH)</h3>
      <p>
        Une reconnaissance de handicap est une donnée de santé. Si vous la cochez dans le calculateur,
        elle sert au calcul puis est oubliée : <strong>la simulation n’est jamais enregistrée</strong>,
        même si vous êtes connecté.
      </p>

      <h3>Code de connexion</h3>
      <p>
        Le code envoyé pour vous connecter n’est jamais stocké en clair : seule une empreinte chiffrée
        est conservée. Elle devient inutilisable au bout de 10 minutes et est effacée dès que le code
        a servi.
      </p>

      <h2>Destinataires</h2>
      <p>
        Vos données ne sont ni vendues ni cédées. Elles sont accessibles à l’éditeur et à ses
        prestataires techniques, dans la stricte limite de leur mission :
      </p>
      <ul>
        <InfoLine label="Hébergement du site et de la base de données">voir les <Link href="/mentions-legales">mentions légales</Link></InfoLine>
        <InfoLine label="Envoi des codes de connexion par e-mail">{A_COMPLETER}</InfoLine>
        <InfoLine label="Recherche d’adresse">
          service de géocodage de l’IGN (Géoplateforme) et, en secours, Base Adresse Nationale
          (api-adresse.data.gouv.fr) — ils reçoivent l’adresse saisie ou la position, pas votre identité
        </InfoLine>
      </ul>
      <p>
        Certaines pages chargent en outre des contenus de tiers, qui reçoivent à cette occasion votre
        adresse IP : la scène 3D de l’accueil (Spline, et des décodeurs servis par Google via
        www.gstatic.com), les avatars d’illustration (DiceBear) et le fond de carte de la fiche d’une
        auto-école (Google Maps). Certains de ces prestataires peuvent être situés hors de l’Union
        européenne. Les liens « Itinéraire » vous font quitter le site vers Google Maps.
      </p>

      <h2>Durées de conservation</h2>
      <ul>
        <InfoLine label="Compte, favoris et historique">
          jusqu’à la suppression de votre compte, et au plus {CONSERVATION.compteInactif} après votre
          dernière connexion
        </InfoLine>
        <InfoLine label="Une simulation de l’historique">jusqu’à ce que vous la supprimiez, ou avec votre compte</InfoLine>
        <InfoLine label="Code de connexion">utilisable 10 minutes au plus, effacé à la connexion</InfoLine>
        <InfoLine label="Compteur de demandes par adresse IP">15 minutes, en mémoire uniquement</InfoLine>
        <InfoLine label="Journaux techniques">{CONSERVATION.journauxTechniques}</InfoLine>
      </ul>

      <h2>Cookies et stockage local</h2>
      <p>
        {SITE_NAME} n’utilise <strong>aucun cookie publicitaire ni de mesure d’audience</strong>. Les
        seuls éléments déposés sont strictement nécessaires au service et ne requièrent donc pas votre
        consentement :
      </p>
      <ul>
        <InfoLine label="access_token (cookie)">maintient votre session une fois connecté, 7 jours au plus ; illisible par les scripts de la page</InfoLine>
        <InfoLine label="shift_app_lang (stockage local)">mémorise la langue choisie</InfoLine>
        <InfoLine label="shift_location (stockage de session)">garde l’adresse de recherche, effacé à la fermeture de l’onglet</InfoLine>
      </ul>

      <h2>Vos droits</h2>
      <p>
        Vous disposez d’un droit d’accès, de rectification, d’effacement, de portabilité, de limitation
        et d’opposition sur vos données. Depuis votre <Link href="/compte">espace compte</Link>, vous
        pouvez directement :
      </p>
      <ul>
        <li>modifier vos informations ;</li>
        <li>télécharger une copie de toutes vos données (format JSON) ;</li>
        <li>supprimer une simulation de votre historique ;</li>
        <li>supprimer votre compte, avec vos favoris et votre historique.</li>
      </ul>
      <p>
        Pour toute autre demande, écrivez à {EDITEUR.email}. Si vous estimez, après nous avoir contactés,
        que vos droits ne sont pas respectés, vous pouvez adresser une réclamation à la CNIL
        (<a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">www.cnil.fr</a>).
      </p>
    </LegalPage>
  )
}
