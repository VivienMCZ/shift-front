import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildEcoleMetadata, fetchEcoleMetadata, isValidEcoleId } from '@/app/lib/ecole-metadata'

const ECOLE = {
  name: 'Auto-école l’Avenir',
  city: 'Paris',
  postal_code: '75015',
  price: 899,
  rating: 4.8,
  speed_label: '4-8 semaines',
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('isValidEcoleId', () => {
  it.each(['1', '42', '1234567890'])('accepte %s', (id) => {
    expect(isValidEcoleId(id)).toBe(true)
  })

  it.each(['0', '-1', '01', '1.5', 'abc', '../auth/me', '..%2F..%2Fauth%2Fme', '12345678901', '', undefined])(
    'refuse %s',
    (id) => {
      expect(isValidEcoleId(id)).toBe(false)
    },
  )
})

describe('buildEcoleMetadata', () => {
  it('compose un titre et une description propres à l’auto-école', () => {
    const meta = buildEcoleMetadata(ECOLE)
    expect(meta.title).toBe('Auto-école l’Avenir — auto-école à Paris 75015')
    expect(meta.description).toContain('forfait à partir de 899 €')
    expect(meta.description).toContain('note 4.8/5')
    expect(meta.description).toContain('délai 4-8 semaines')
    expect(meta.openGraph.title).toBe(meta.title)
  })

  it('omet les informations absentes', () => {
    const meta = buildEcoleMetadata({ name: 'École', city: 'Lyon', price: null, rating: 0 })
    expect(meta.title).toBe('École — auto-école à Lyon')
    expect(meta.description).not.toMatch(/forfait|note|délai/)
  })
})

describe('fetchEcoleMetadata', () => {
  const ok = (body) => vi.fn(async () => ({ ok: true, json: async () => body }))

  it('interroge l’API interne en priorité', async () => {
    vi.stubEnv('INTERNAL_API_URL', 'http://api:8000/')
    const fetchImpl = ok(ECOLE)

    const meta = await fetchEcoleMetadata('7', { fetchImpl })

    expect(fetchImpl.mock.calls[0][0]).toBe('http://api:8000/api/ecoles/7')
    expect(meta.title).toContain('Auto-école l’Avenir')
  })

  it('tolère une base d’URL qui porte déjà /api', async () => {
    vi.stubEnv('INTERNAL_API_URL', 'http://api:8000/api/v1')
    const fetchImpl = ok(ECOLE)
    await fetchEcoleMetadata('7', { fetchImpl })
    expect(fetchImpl.mock.calls[0][0]).toBe('http://api:8000/api/ecoles/7')
  })

  it('n’émet aucune requête pour un identifiant invalide', async () => {
    const fetchImpl = ok(ECOLE)
    expect(await fetchEcoleMetadata('../auth/me', { fetchImpl })).toBeNull()
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('renvoie null sur une fiche introuvable', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: false, status: 404 }))
    expect(await fetchEcoleMetadata('7', { fetchImpl })).toBeNull()
  })

  it('renvoie null quand l’API est injoignable, sans lever', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError('fetch failed')
    })
    expect(await fetchEcoleMetadata('7', { fetchImpl })).toBeNull()
  })
})
