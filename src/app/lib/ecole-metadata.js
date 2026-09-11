/**
 * Métadonnées (titre, description) d'une fiche d'auto-école, calculées côté
 * serveur. La page elle-même est un Client Component : sans cela, les 50 000
 * fiches partageaient toutes le même titre dans les résultats de recherche.
 */

const ID_PATTERN = /^[1-9][0-9]{0,9}$/
const FETCH_TIMEOUT_MS = 3000
// Même fraîcheur que le `Cache-Control` public du backend sur cette route, à
// l'échelle près : un titre n'a pas besoin d'être plus frais que la fiche.
const REVALIDATE_SECONDS = 300

/**
 * Seul un identifiant numérique part vers l'API. L'`id` vient de l'URL et la
 * requête est émise **par le serveur**, vers l'API interne : sans ce filtre,
 * `/ecoles/..%2F..%2Fauth%2Fme` ferait appeler au serveur une autre route que
 * celle prévue (A10).
 */
export function isValidEcoleId(id) {
  return typeof id === 'string' && ID_PATTERN.test(id)
}

function apiBaseUrl() {
  return (process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')
    .replace(/\/+$/, '')
    .replace(/\/api(?:\/v\d+)?$/, '')
}

export function buildEcoleMetadata(ecole) {
  const lieu = [ecole.city, ecole.postal_code].filter(Boolean).join(' ')
  const details = [
    ecole.price != null ? `forfait à partir de ${ecole.price} €` : null,
    ecole.rating > 0 ? `note ${ecole.rating.toFixed(1)}/5` : null,
    ecole.speed_label ? `délai ${ecole.speed_label}` : null,
  ].filter(Boolean)

  const title = lieu ? `${ecole.name} — auto-école à ${lieu}` : ecole.name
  const description = details.length
    ? `${ecole.name}${lieu ? `, ${lieu}` : ''} : ${details.join(', ')}. Comparez avec les auto-écoles proches sur Shift.`
    : `${ecole.name}${lieu ? `, ${lieu}` : ''}. Comparez avec les auto-écoles proches sur Shift.`

  return { title, description, openGraph: { title, description } }
}

/**
 * Métadonnées de la fiche, ou `null` si elles ne peuvent pas être calculées.
 * Ne lève jamais : une API lente ou absente doit laisser la page s'afficher
 * avec le titre par défaut, pas la casser.
 */
export async function fetchEcoleMetadata(id, { fetchImpl = fetch } = {}) {
  if (!isValidEcoleId(id)) return null
  try {
    const response = await fetchImpl(`${apiBaseUrl()}/api/ecoles/${id}`, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      next: { revalidate: REVALIDATE_SECONDS },
    })
    if (!response.ok) return null
    return buildEcoleMetadata(await response.json())
  } catch {
    return null
  }
}
