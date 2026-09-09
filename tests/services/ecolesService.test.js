import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ecolesPageKey,
  fetchEcolesPage,
  prefetchEcolesPage,
  readCachedEcolesPage,
  resetEcolesCache,
} from '@/services/ecolesService'

const reponse = (ecoles, total = String(ecoles.length)) => ({
  ok: true,
  headers: { get: (name) => (name === 'X-Total-Count' ? total : null) },
  json: async () => ecoles,
})

beforeEach(() => {
  resetEcolesCache()
  global.fetch = vi.fn(async () => reponse([{ id: 1 }]))
})

describe('ecolesPageKey', () => {
  it('distingue deux pages d’une même recherche', () => {
    expect(ecolesPageKey('radius=10', 0)).not.toBe(ecolesPageKey('radius=10', 1))
  })

  it('distingue deux recherches d’une même page', () => {
    expect(ecolesPageKey('radius=10', 0)).not.toBe(ecolesPageKey('radius=20', 0))
  })
})

describe('fetchEcolesPage', () => {
  it('construit une URL relative avec limit et offset', async () => {
    await fetchEcolesPage('radius=10', 2, { pageSize: 24 })

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/ecoles?radius=10&limit=24&offset=48',
      expect.objectContaining({ signal: undefined }),
    )
  })

  it('lit le total dans l’en-tête X-Total-Count', async () => {
    global.fetch = vi.fn(async () => reponse([{ id: 1 }], '57'))

    expect(await fetchEcolesPage('q', 0, { pageSize: 24 })).toEqual({
      ecoles: [{ id: 1 }],
      total: 57,
    })
  })

  it('retombe sur un total nul quand l’en-tête manque', async () => {
    global.fetch = vi.fn(async () => ({
      ok: true,
      headers: { get: () => null },
      json: async () => [{ id: 1 }],
    }))

    expect((await fetchEcolesPage('q', 0, { pageSize: 24 })).total).toBeNull()
  })

  it('lève sur une réponse en erreur', async () => {
    global.fetch = vi.fn(async () => ({ ok: false, status: 500 }))

    await expect(fetchEcolesPage('q', 0, { pageSize: 24 })).rejects.toThrow('Erreur 500')
  })

  it('mémorise la page chargée', async () => {
    await fetchEcolesPage('q', 0, { pageSize: 24 })

    expect(readCachedEcolesPage('q', 0)).toEqual({ ecoles: [{ id: 1 }], total: 1 })
    // Une autre page de la même recherche n'est pas pour autant en mémoire.
    expect(readCachedEcolesPage('q', 1)).toBeNull()
  })

  it('n’écrit rien en mémoire quand la requête échoue', async () => {
    global.fetch = vi.fn(async () => ({ ok: false, status: 503 }))

    await expect(fetchEcolesPage('q', 0, { pageSize: 24 })).rejects.toThrow()
    expect(readCachedEcolesPage('q', 0)).toBeNull()
  })
})

describe('prefetchEcolesPage', () => {
  it('charge une page absente du cache', async () => {
    prefetchEcolesPage('q', 1, { pageSize: 24 })
    await vi.waitFor(() => expect(readCachedEcolesPage('q', 1)).not.toBeNull())

    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it('ne redemande pas une page déjà en mémoire', async () => {
    await fetchEcolesPage('q', 1, { pageSize: 24 })
    global.fetch.mockClear()

    prefetchEcolesPage('q', 1, { pageSize: 24 })

    expect(global.fetch).not.toHaveBeenCalled()
  })

  /** Un préchargement est un confort : son échec ne doit rien casser. */
  it('avale l’erreur d’un préchargement', async () => {
    global.fetch = vi.fn(async () => ({ ok: false, status: 500 }))

    expect(() => prefetchEcolesPage('q', 1, { pageSize: 24 })).not.toThrow()
    await vi.waitFor(() => expect(global.fetch).toHaveBeenCalled())
  })
})
