/**
 * Client d'API des auto-écoles, avec mémoire des pages déjà chargées.
 *
 * L'appel passe par une URL **relative** : le rewrite de `next.config.mjs` le
 * proxifie vers le backend, ce qui évite CORS et préflight (cf. AGENTS.md § 3).
 *
 * Le cache est partagé par tout le module — donc conservé d'une page à l'autre
 * tant que l'onglet vit. C'est exactement ce qui rend instantané un retour
 * depuis `/ecoles/[id]` vers `/comparer`.
 *
 * Rien de personnel ne transite ici : `/api/ecoles` est une route publique, sans
 * dépendance à l'utilisateur côté backend. Les favoris, eux, sont chargés à part
 * avec `credentials: 'include'` et ne doivent jamais entrer dans ce cache.
 */

import { createEcolesCache } from '@/app/lib/ecoles-cache'

const cache = createEcolesCache()

/** Vide le cache. Utilisé par les tests pour repartir d'un état connu. */
export function resetEcolesCache() {
  cache.clear()
}

/**
 * Clé d'une page de résultats. La query porte déjà tous les filtres (position,
 * rayon, budget, tri…) : seul le rang de page s'y ajoute.
 */
export function ecolesPageKey(query, page) {
  return `${query}::${page}`
}

/** Page déjà en mémoire, ou `null`. Lecture synchrone : aucun réseau. */
export function readCachedEcolesPage(query, page) {
  return cache.read(ecolesPageKey(query, page))
}

/**
 * Charge une page et la mémorise.
 *
 * Retourne `{ ecoles, total }`. `total` vient de l'en-tête `X-Total-Count` et
 * vaut `null` s'il manque — un proxy peut le filtrer, auquel cas le front ne
 * propose simplement pas de page suivante.
 */
export async function fetchEcolesPage(query, page, { pageSize, signal } = {}) {
  const url = `/api/ecoles?${query}&limit=${pageSize}&offset=${page * pageSize}`
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`Erreur ${response.status}`)

  // `Number(null)` vaut 0, pas NaN : sans ce test d'absence, un en-tête filtré
  // par un proxy se lirait comme « 0 résultat » et le compteur afficherait 0
  // au-dessus d'une grille pleine.
  const rawCount = response.headers?.get?.('X-Total-Count')
  const count = Number(rawCount)
  const data = await response.json()

  const result = {
    ecoles: Array.isArray(data) ? data : [],
    total: rawCount != null && Number.isFinite(count) && count >= 0 ? count : null,
  }

  cache.write(ecolesPageKey(query, page), result)
  return result
}

/**
 * Charge une page en avance, sans état ni erreur remontée.
 *
 * Déclenché au survol du bouton « voir plus » : entre le survol et le clic il
 * s'écoule assez de temps pour que la page suivante soit déjà là. Volontairement
 * **pas** déclenché au montage — la page ne doit demander qu'une seule page au
 * chargement (garde-fou verrouillé par `tests/components/comparer-pagination`).
 */
export function prefetchEcolesPage(query, page, options) {
  if (readCachedEcolesPage(query, page)) return
  fetchEcolesPage(query, page, options).catch(() => {})
}
