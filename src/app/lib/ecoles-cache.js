/**
 * Cache mémoire des pages de résultats déjà obtenues par /comparer.
 *
 * Pourquoi : un curseur de budget qu'on fait glisser puis revenir, un aller-retour
 * vers la fiche d'une auto-école ou le bouton « précédent » du navigateur rejouent
 * une recherche déjà obtenue. Sans mémoire, chacun de ces gestes repart en requête
 * et repasse la grille en squelettes — alors que la réponse est identique.
 *
 * Borné en nombre d'entrées **et** en durée, sur le modèle du cache de géocodage
 * du backend (`app/routers/locations.py`, ReponseCache) : chaque cran de curseur
 * crée une clé, une Map non bornée sur cette page serait une fuite mémoire.
 *
 * Le module est volontairement pur — aucun accès réseau, aucun DOM, aucune
 * dépendance React — pour rester testable et couvert.
 */

/** 60 entrées ≈ deux ou trois pages pour une vingtaine de combinaisons de filtres. */
export const DEFAULT_MAX_ENTRIES = 60

/**
 * 5 minutes : au-delà, mieux vaut revalider. Le catalogue bouge peu, mais une
 * session ouverte toute une journée ne doit pas afficher des prix de la veille.
 */
export const DEFAULT_TTL_MS = 5 * 60 * 1000

/**
 * Cache LRU à expiration.
 *
 * `now` est injectable pour que les tests puissent faire avancer le temps sans
 * horloge factice globale.
 */
export function createEcolesCache({
  maxEntries = DEFAULT_MAX_ENTRIES,
  ttlMs = DEFAULT_TTL_MS,
  now = Date.now,
} = {}) {
  /**
   * Une `Map` conserve l'ordre d'insertion : c'est ce qui sert de classement
   * LRU. La plus ancienne entrée est toujours la première clé.
   */
  const entries = new Map()

  const read = (key) => {
    const entry = entries.get(key)
    if (!entry) return null

    if (now() - entry.storedAt >= ttlMs) {
      entries.delete(key)
      return null
    }

    // Une relecture est un usage récent : on repousse l'entrée en fin de Map
    // pour qu'elle ne soit pas la prochaine évincée.
    entries.delete(key)
    entries.set(key, entry)
    return entry.value
  }

  const write = (key, value) => {
    // Supprimer avant d'écrire : sans ça, une clé déjà présente garderait son
    // rang d'insertion d'origine et serait évincée trop tôt.
    entries.delete(key)
    entries.set(key, { value, storedAt: now() })

    while (entries.size > maxEntries) {
      const oldest = entries.keys().next().value
      entries.delete(oldest)
    }
  }

  const clear = () => {
    entries.clear()
  }

  const size = () => entries.size

  return { read, write, clear, size }
}
