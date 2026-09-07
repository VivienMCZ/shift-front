// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  featureToLocation,
  formatFeatureLabel,
  locationFromFeature,
  normalizeLocation,
} from '@/app/lib/location-utils'

/** A realistic BAN (api-adresse.data.gouv.fr) housenumber feature. */
const streetFeature = {
  properties: {
    label: '12 Rue de Rivoli 75001 Paris',
    name: '12 Rue de Rivoli',
    city: 'Paris',
    municipality: 'Paris',
    postcode: '75001',
    context: '75, Paris, Île-de-France',
    type: 'housenumber',
  },
  geometry: { type: 'Point', coordinates: [2.3522, 48.8566] },
}

/** A municipality feature, where the name and the city are the same. */
const cityFeature = {
  properties: {
    label: 'Lyon',
    name: 'Lyon',
    city: 'Lyon',
    postcode: '69000',
    context: '69, Rhône',
    type: 'municipality',
  },
  geometry: { type: 'Point', coordinates: [4.8357, 45.764] },
}

describe('normalizeLocation', () => {
  it('returns null for an empty input', () => {
    expect(normalizeLocation(null)).toBeNull()
    expect(normalizeLocation(undefined)).toBeNull()
  })

  it('fills city from municipality when city is absent', () => {
    expect(normalizeLocation({ municipality: 'Nantes' })).toMatchObject({
      city: 'Nantes',
      label: 'Nantes',
      displayLabel: 'Nantes',
    })
  })

  it('keeps an explicit displayLabel', () => {
    expect(normalizeLocation({ city: 'Paris', label: 'Paris', displayLabel: '12 Rue X, Paris' }))
      .toMatchObject({ displayLabel: '12 Rue X, Paris', label: 'Paris' })
  })

  it('derives label and city from displayLabel as a last resort', () => {
    expect(normalizeLocation({ displayLabel: 'Quelque part' })).toMatchObject({
      city: 'Quelque part',
      label: 'Quelque part',
      displayLabel: 'Quelque part',
    })
  })

  it('preserves unrelated fields such as coordinates', () => {
    const result = normalizeLocation({ city: 'Paris', lat: 48.85, lng: 2.35, source: 'address' })
    expect(result).toMatchObject({ lat: 48.85, lng: 2.35, source: 'address' })
  })

  it('is idempotent', () => {
    const once = normalizeLocation({ municipality: 'Nantes', lat: 47.2 })
    expect(normalizeLocation(once)).toEqual(once)
  })

  it('degrades to empty strings rather than undefined', () => {
    expect(normalizeLocation({})).toEqual({ city: '', label: '', displayLabel: '' })
  })
})

describe('formatFeatureLabel', () => {
  it('joins the street and the city when they differ', () => {
    expect(formatFeatureLabel(streetFeature)).toBe('12 Rue de Rivoli, Paris')
  })

  it('returns the plain label when the name is the city', () => {
    expect(formatFeatureLabel(cityFeature)).toBe('Lyon')
  })

  it('falls back to the city when there is no label', () => {
    expect(formatFeatureLabel({ properties: { city: 'Brest' } })).toBe('Brest')
  })

  it('uses the caller fallback for an unusable feature', () => {
    expect(formatFeatureLabel(undefined)).toBe('')
    expect(formatFeatureLabel({}, 'Position actuelle')).toBe('Position actuelle')
    expect(formatFeatureLabel({ properties: {} }, 'Position actuelle')).toBe('Position actuelle')
  })
})

describe('featureToLocation', () => {
  it('maps a street feature, unpacking coordinates as [lng, lat]', () => {
    expect(featureToLocation(streetFeature)).toEqual({
      label: '12 Rue de Rivoli 75001 Paris',
      displayLabel: '12 Rue de Rivoli, Paris',
      city: 'Paris',
      postalCode: '75001',
      context: '75, Paris, Île-de-France',
      lat: 48.8566,
      lng: 2.3522,
      source: 'address',
      type: 'housenumber',
    })
  })

  it('tags the location as coming from the address search', () => {
    expect(featureToLocation(cityFeature).source).toBe('address')
  })

  it('survives a feature without geometry', () => {
    const result = featureToLocation({ properties: { label: 'Nulle part', city: 'Nulle part' } })
    expect(result.lat).toBeUndefined()
    expect(result.lng).toBeUndefined()
    expect(result.city).toBe('Nulle part')
  })
})

describe('locationFromFeature', () => {
  it('maps a reverse-geocoded feature and tags it as a geolocation', () => {
    expect(locationFromFeature(streetFeature, 0, 0)).toEqual({
      label: '12 Rue de Rivoli 75001 Paris',
      displayLabel: '12 Rue de Rivoli, Paris',
      city: 'Paris',
      postalCode: '75001',
      context: '75, Paris, Île-de-France',
      lat: 48.8566,
      lng: 2.3522,
      source: 'geolocation',
    })
  })

  it('falls back to the device coordinates when the feature has no geometry', () => {
    const result = locationFromFeature({ properties: { label: 'Paris', city: 'Paris' } }, 48.85, 2.35)
    expect(result).toMatchObject({ lat: 48.85, lng: 2.35 })
  })

  it('labels an unidentifiable position rather than leaving it blank', () => {
    const result = locationFromFeature({}, 48.85, 2.35)
    expect(result.city).toBe('Position actuelle')
    expect(result.displayLabel).toBe('Position actuelle')
    expect(result.label).toBe('Position actuelle')
  })
})
