/**
 * Logique du calculateur d'aides, hors composant pour être testable.
 */

/**
 * Situations cumulables avec le statut principal, dans l'ordre d'affichage.
 * `field` est le nom du champ attendu par `/api/v1/aides/calculate`.
 *
 * Avant, ces réponses n'étaient jamais demandées et partaient à `false` : les
 * aides RQTH, RSA et boursiers étaient inaccessibles quel que soit le profil.
 */
export const SITUATIONS = [
  { field: 'inscrit_france_travail', labelKey: 'calculateur.situation.france_travail' },
  { field: 'is_boursier', labelKey: 'calculateur.situation.boursier' },
  { field: 'en_formation_qualifiante', labelKey: 'calculateur.situation.formation' },
  { field: 'beneficiaire_rsa', labelKey: 'calculateur.situation.rsa' },
  { field: 'reserviste', labelKey: 'calculateur.situation.reserviste' },
  { field: 'secteur_btp', labelKey: 'calculateur.situation.btp' },
  { field: 'secteur_hcr', labelKey: 'calculateur.situation.hcr' },
  // Donnée de santé (RGPD art. 9) : le backend ne sauvegarde jamais une
  // recherche qui la déclare. La note affichée sous la case le dit.
  { field: 'has_rqth', labelKey: 'calculateur.situation.rqth', noteKey: 'calculateur.situation.rqth_note' },
]

/** Catégorie des aides remboursables, telle que renvoyée par l'API. */
export const CATEGORIE_PRET = 'Prêt'

/**
 * Situations cochées d'office quand on choisit un statut. Un demandeur
 * d'emploi est presque toujours inscrit à France Travail ; il peut décocher.
 */
const SITUATIONS_PAR_STATUT = {
  chomeur: ['inscrit_france_travail'],
}

export function situationsForStatus(status, current = {}) {
  const next = { ...current }
  for (const field of SITUATIONS_PAR_STATUT[status] ?? []) next[field] = true
  return next
}

/**
 * Corps de la requête de calcul.
 *
 * Le code postal part tel quel : c'est le backend qui en déduit région et
 * département. Chaque situation est envoyée explicitement, cochée ou non.
 */
export function buildAidesPayload({ age, postalCode, status, situations = {} }) {
  const payload = {
    age: Number(age),
    statut: status,
    code_postal: postalCode,
  }
  for (const { field } of SITUATIONS) payload[field] = Boolean(situations[field])
  return payload
}

export function isPret(aide) {
  return aide?.categorie === CATEGORIE_PRET
}

/** « 1 200 € » — espace fine insécable, comme le reste du site en français. */
export function formatEuros(montant) {
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(montant)} €`
}
