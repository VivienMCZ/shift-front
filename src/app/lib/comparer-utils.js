/**
 * Pure helpers backing the school comparison page.
 * Kept free of JSX so they can be unit tested in isolation.
 */

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

export function formatPrice(value) {
  return `${Number(value).toLocaleString('fr-FR')} €`
}

export function formatDistance(value) {
  if (value == null) return null

  return `${new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: value < 10 ? 1 : 0,
    maximumFractionDigits: 1,
  }).format(value)} km`
}

export function getNumberParam(params, key, fallback, min, max) {
  const rawValue = params.get(key)
  if (rawValue == null) return fallback

  const value = Number(rawValue)
  if (!Number.isFinite(value)) return fallback

  return clamp(value, min, max)
}

export function hasUsableLocation(location) {
  return Number.isFinite(Number(location?.lat)) && Number.isFinite(Number(location?.lng))
}

export function compactPlaceLabel(location) {
  return location?.displayLabel || location?.label || location?.city || ''
}

export function localMatchScore(ecole, radius, budgetRange) {
  const speedScore = { rapide: 100, moyen: 74, faible: 48 }[ecole.speed_level] ?? 74
  const ratingScore = clamp(((ecole.rating ?? 0) / 5) * 100, 0, 100)
  const [budgetMin, budgetMax] = budgetRange
  const priceScore = ecole.price == null || budgetMax <= budgetMin
    ? 50
    : clamp(((budgetMax - ecole.price) / (budgetMax - budgetMin)) * 100, 0, 100)
  const distanceScore = ecole.distance == null
    ? 75
    : clamp((1 - (ecole.distance / radius)) * 100, 0, 100)

  return Math.round((speedScore * 0.35) + (ratingScore * 0.25) + (priceScore * 0.25) + (distanceScore * 0.15))
}

/** Translation key for a match score — the JSX wrapper lives in the page. */
export function matchLabelKey(score) {
  if (score >= 90) return 'comparer.match.90'
  if (score >= 80) return 'comparer.match.80'
  if (score >= 70) return 'comparer.match.70'
  return 'comparer.match.default'
}

/** Translation keys explaining why a school scored well. */
export function matchReasonKeys(ecole) {
  return [
    ecole.speed_level === 'rapide' ? 'comparer.reasons.speed_fast' : null,
    ecole.rating >= 4.6 ? 'comparer.reasons.rating_excellent' : null,
    ecole.distance != null && ecole.distance <= 5 ? 'comparer.reasons.distance_close' : null,
  ].filter(Boolean)
}

export function scoreTone(score) {
  if (score >= 90) return 'bg-linear-to-br from-emerald-500/85 to-teal-500/85 border-emerald-400/50 text-white shadow-md'
  if (score >= 80) return 'bg-linear-to-br from-[#0047FF]/85 to-cyan-500/85 border-blue-400/50 text-white shadow-md'
  if (score >= 70) return 'bg-linear-to-br from-amber-500/85 to-orange-500/85 border-amber-400/50 text-white shadow-md'
  return 'bg-linear-to-br from-zinc-500/85 to-slate-500/85 border-slate-400/50 text-white shadow-md'
}
