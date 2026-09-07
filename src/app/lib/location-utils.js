/**
 * Pure helpers for the address / geolocation features (BAN api-adresse payloads).
 */

/** Shape a stored or freshly picked location so every consumer sees the same fields. */
export function normalizeLocation(loc) {
  if (!loc) return null

  const city = loc.city || loc.municipality || loc.label || loc.displayLabel || ''
  const label = loc.label || loc.displayLabel || city

  return {
    ...loc,
    city,
    label,
    displayLabel: loc.displayLabel || label,
  }
}

/** "12 rue X, Paris" when the street and the city differ, otherwise the plain label. */
export function formatFeatureLabel(feature, fallback = '') {
  const properties = feature?.properties ?? {}
  const name = properties.name || properties.label
  const city = properties.city || properties.municipality

  if (name && city && name !== city) return `${name}, ${city}`
  return properties.label || city || fallback
}

/** BAN feature -> location, for an address picked in the search bar. */
export function featureToLocation(feature) {
  const properties = feature?.properties ?? {}
  const [lng, lat] = feature?.geometry?.coordinates ?? []
  const city = properties.city || properties.municipality || properties.label || ''

  return {
    label: properties.label || formatFeatureLabel(feature),
    displayLabel: formatFeatureLabel(feature),
    city,
    postalCode: properties.postcode,
    context: properties.context,
    lat,
    lng,
    source: 'address',
    type: properties.type,
  }
}

/** BAN feature -> location, for a reverse geocode of the device position. */
export function locationFromFeature(feature, fallbackLat, fallbackLng) {
  const properties = feature?.properties ?? {}
  const coordinates = feature?.geometry?.coordinates ?? [fallbackLng, fallbackLat]
  const [lng, lat] = coordinates
  const city = properties.city || properties.municipality || properties.label || 'Position actuelle'

  return {
    label: properties.label || city,
    displayLabel: formatFeatureLabel(feature, 'Position actuelle'),
    city,
    postalCode: properties.postcode,
    context: properties.context,
    lat,
    lng,
    source: 'geolocation',
  }
}
