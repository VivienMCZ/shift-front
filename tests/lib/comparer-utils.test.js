import { describe, expect, it } from 'vitest'
import {
  clamp,
  compactPlaceLabel,
  formatDistance,
  formatPrice,
  getNumberParam,
  hasUsableLocation,
  localMatchScore,
  matchLabelKey,
  matchReasonKeys,
  scoreTone,
} from '@/app/lib/comparer-utils'

const RADIUS = 10
const BUDGET = [500, 2000]

describe('clamp', () => {
  it('leaves a value inside the range untouched', () => {
    expect(clamp(5, 0, 10)).toBe(5)
  })

  it('clamps on both bounds', () => {
    expect(clamp(-3, 0, 10)).toBe(0)
    expect(clamp(42, 0, 10)).toBe(10)
  })

  it('keeps the bounds themselves', () => {
    expect(clamp(0, 0, 10)).toBe(0)
    expect(clamp(10, 0, 10)).toBe(10)
  })
})

describe('formatPrice', () => {
  it('formats with the French thousands separator and a euro sign', () => {
    // fr-FR uses a narrow no-break space, which varies across ICU versions.
    expect(formatPrice(1200)).toMatch(/^1[\s  ]?200 €$/)
  })

  it('accepts numeric strings', () => {
    expect(formatPrice('900')).toBe('900 €')
  })
})

describe('formatDistance', () => {
  it('returns null when there is no distance', () => {
    expect(formatDistance(null)).toBeNull()
    expect(formatDistance(undefined)).toBeNull()
  })

  it('keeps one decimal below 10 km', () => {
    expect(formatDistance(3.45)).toMatch(/^3,[45] km$/)
  })

  it('shows a decimal only when relevant above 10 km', () => {
    expect(formatDistance(12)).toBe('12 km')
    expect(formatDistance(12.34)).toBe('12,3 km')
  })

  it('formats an exact zero', () => {
    expect(formatDistance(0)).toBe('0,0 km')
  })
})

describe('getNumberParam', () => {
  const params = new URLSearchParams('radius=20&budget_min=100&broken=abc&empty=')

  it('returns the fallback for a missing key', () => {
    expect(getNumberParam(params, 'missing', 7, 0, 50)).toBe(7)
  })

  it('returns the fallback for a non-numeric value', () => {
    expect(getNumberParam(params, 'broken', 7, 0, 50)).toBe(7)
  })

  it('reads and clamps a valid value', () => {
    expect(getNumberParam(params, 'radius', 10, 5, 50)).toBe(20)
    expect(getNumberParam(params, 'radius', 10, 5, 15)).toBe(15)
    expect(getNumberParam(params, 'budget_min', 500, 500, 2000)).toBe(500)
  })

  it('treats an empty value as zero, not as missing', () => {
    // Number('') === 0, so the empty param is clamped rather than defaulted.
    expect(getNumberParam(params, 'empty', 7, 0, 50)).toBe(0)
  })
})

describe('hasUsableLocation', () => {
  it('accepts numeric and numeric-string coordinates', () => {
    expect(hasUsableLocation({ lat: 48.85, lng: 2.35 })).toBe(true)
    expect(hasUsableLocation({ lat: '48.85', lng: '2.35' })).toBe(true)
    expect(hasUsableLocation({ lat: 0, lng: 0 })).toBe(true)
  })

  it('rejects missing or unparseable coordinates', () => {
    expect(hasUsableLocation(null)).toBe(false)
    expect(hasUsableLocation(undefined)).toBe(false)
    expect(hasUsableLocation({})).toBe(false)
    expect(hasUsableLocation({ lat: 48.85 })).toBe(false)
    expect(hasUsableLocation({ lat: 'paris', lng: 2.35 })).toBe(false)
  })
})

describe('compactPlaceLabel', () => {
  it('prefers displayLabel, then label, then city', () => {
    expect(compactPlaceLabel({ displayLabel: 'A', label: 'B', city: 'C' })).toBe('A')
    expect(compactPlaceLabel({ label: 'B', city: 'C' })).toBe('B')
    expect(compactPlaceLabel({ city: 'C' })).toBe('C')
  })

  it('falls back to an empty string', () => {
    expect(compactPlaceLabel(null)).toBe('')
    expect(compactPlaceLabel({})).toBe('')
  })
})

describe('localMatchScore', () => {
  it('gives 100 to a perfect school', () => {
    const ecole = { speed_level: 'rapide', rating: 5, price: 500, distance: 0 }
    expect(localMatchScore(ecole, RADIUS, BUDGET)).toBe(100)
  })

  it('gives the floor score to the worst school', () => {
    const ecole = { speed_level: 'faible', rating: 0, price: 2000, distance: 10 }
    // 48 * 0.35 = 16.8, everything else scores 0.
    expect(localMatchScore(ecole, RADIUS, BUDGET)).toBe(17)
  })

  it('applies neutral defaults when fields are missing', () => {
    // speed 74*0.35 + rating 0 + price 50*0.25 + distance 75*0.15 = 49.65
    expect(localMatchScore({}, RADIUS, BUDGET)).toBe(50)
  })

  it('treats an unknown speed level as the medium default', () => {
    const base = { rating: 4, price: 1000, distance: 3 }
    expect(localMatchScore({ ...base, speed_level: 'inconnu' }, RADIUS, BUDGET))
      .toBe(localMatchScore({ ...base, speed_level: 'moyen' }, RADIUS, BUDGET))
  })

  it('clamps a price below the budget floor instead of exceeding 100', () => {
    const cheap = { speed_level: 'rapide', rating: 5, price: 100, distance: 0 }
    expect(localMatchScore(cheap, RADIUS, BUDGET)).toBe(100)
  })

  it('clamps a school further away than the radius to a zero distance score', () => {
    const far = { speed_level: 'faible', rating: 0, price: 2000, distance: 500 }
    expect(localMatchScore(far, RADIUS, BUDGET)).toBe(17)
  })

  it('neutralises the price score when the budget range is degenerate', () => {
    const ecole = { speed_level: 'faible', rating: 0, price: 800, distance: 10 }
    // priceScore falls back to 50 -> 16.8 + 12.5 = 29.3
    expect(localMatchScore(ecole, RADIUS, [1000, 1000])).toBe(29)
  })

  it('rewards a closer school', () => {
    const near = { speed_level: 'moyen', rating: 4, price: 1000, distance: 1 }
    const far = { speed_level: 'moyen', rating: 4, price: 1000, distance: 9 }
    expect(localMatchScore(near, RADIUS, BUDGET)).toBeGreaterThan(localMatchScore(far, RADIUS, BUDGET))
  })

  it('always stays within 0 and 100', () => {
    const samples = [
      { speed_level: 'rapide', rating: 9, price: -50, distance: -5 },
      { speed_level: 'faible', rating: -3, price: 99999, distance: 99999 },
    ]
    for (const ecole of samples) {
      const score = localMatchScore(ecole, RADIUS, BUDGET)
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(100)
    }
  })
})

describe('matchLabelKey', () => {
  it('maps each score band to its translation key', () => {
    expect(matchLabelKey(100)).toBe('comparer.match.90')
    expect(matchLabelKey(90)).toBe('comparer.match.90')
    expect(matchLabelKey(89)).toBe('comparer.match.80')
    expect(matchLabelKey(80)).toBe('comparer.match.80')
    expect(matchLabelKey(79)).toBe('comparer.match.70')
    expect(matchLabelKey(70)).toBe('comparer.match.70')
    expect(matchLabelKey(69)).toBe('comparer.match.default')
    expect(matchLabelKey(0)).toBe('comparer.match.default')
  })
})

describe('matchReasonKeys', () => {
  it('returns every reason a school qualifies for', () => {
    expect(matchReasonKeys({ speed_level: 'rapide', rating: 4.8, distance: 2 })).toEqual([
      'comparer.reasons.speed_fast',
      'comparer.reasons.rating_excellent',
      'comparer.reasons.distance_close',
    ])
  })

  it('returns nothing when no threshold is met', () => {
    expect(matchReasonKeys({ speed_level: 'faible', rating: 3, distance: 40 })).toEqual([])
    expect(matchReasonKeys({})).toEqual([])
  })

  it('ignores distance when it is unknown rather than treating it as close', () => {
    expect(matchReasonKeys({ distance: null })).toEqual([])
  })

  it('applies the rating threshold at exactly 4.6', () => {
    expect(matchReasonKeys({ rating: 4.6 })).toContain('comparer.reasons.rating_excellent')
    expect(matchReasonKeys({ rating: 4.59 })).not.toContain('comparer.reasons.rating_excellent')
  })
})

describe('scoreTone', () => {
  it('returns a distinct class set per band', () => {
    const tones = [scoreTone(95), scoreTone(85), scoreTone(75), scoreTone(20)]
    expect(new Set(tones).size).toBe(4)
  })

  it('uses the green tone for excellent scores and the grey one below 70', () => {
    expect(scoreTone(90)).toContain('emerald')
    expect(scoreTone(69)).toContain('zinc')
  })
})
