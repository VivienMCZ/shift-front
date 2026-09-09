import { describe, expect, it } from 'vitest'
import { createEcolesCache, DEFAULT_MAX_ENTRIES, DEFAULT_TTL_MS } from '@/app/lib/ecoles-cache'

/** Horloge contrôlée : `now` est injectable pour ne pas dépendre du temps réel. */
const horloge = (depart = 0) => {
  const etat = { valeur: depart }
  return {
    now: () => etat.valeur,
    avancer: (ms) => {
      etat.valeur += ms
    },
  }
}

describe('createEcolesCache', () => {
  it('relit ce qui a été écrit', () => {
    const cache = createEcolesCache()
    cache.write('a', { ecoles: [1], total: 1 })

    expect(cache.read('a')).toEqual({ ecoles: [1], total: 1 })
  })

  it('renvoie null sur une clé inconnue', () => {
    expect(createEcolesCache().read('absente')).toBeNull()
  })

  it('oublie une entrée expirée', () => {
    const temps = horloge()
    const cache = createEcolesCache({ ttlMs: 1000, now: temps.now })
    cache.write('a', 'valeur')

    temps.avancer(999)
    expect(cache.read('a')).toBe('valeur')

    temps.avancer(1)
    expect(cache.read('a')).toBeNull()
    // L'entrée périmée est purgée, pas seulement masquée.
    expect(cache.size()).toBe(0)
  })

  it('évince la plus ancienne au-delà de la capacité', () => {
    const cache = createEcolesCache({ maxEntries: 2 })
    cache.write('a', 1)
    cache.write('b', 2)
    cache.write('c', 3)

    expect(cache.size()).toBe(2)
    expect(cache.read('a')).toBeNull()
    expect(cache.read('b')).toBe(2)
    expect(cache.read('c')).toBe(3)
  })

  /**
   * Le cœur du LRU : sans le repositionnement à la lecture, une recherche
   * consultée en permanence serait évincée par des combinaisons de filtres
   * traversées une seule fois.
   */
  it('protège de l’éviction une entrée relue récemment', () => {
    const cache = createEcolesCache({ maxEntries: 2 })
    cache.write('a', 1)
    cache.write('b', 2)

    cache.read('a')
    cache.write('c', 3)

    expect(cache.read('a')).toBe(1)
    expect(cache.read('b')).toBeNull()
  })

  it('ne duplique pas le rang d’une clé réécrite', () => {
    const cache = createEcolesCache({ maxEntries: 2 })
    cache.write('a', 1)
    cache.write('b', 2)
    // Réécrire 'a' doit le rendre récent, donc évincer 'b' au prochain ajout.
    cache.write('a', 10)
    cache.write('c', 3)

    expect(cache.read('a')).toBe(10)
    expect(cache.read('b')).toBeNull()
    expect(cache.size()).toBe(2)
  })

  it('vide tout sur clear', () => {
    const cache = createEcolesCache()
    cache.write('a', 1)
    cache.clear()

    expect(cache.size()).toBe(0)
    expect(cache.read('a')).toBeNull()
  })

  it('expose des bornes par défaut non nulles', () => {
    expect(DEFAULT_MAX_ENTRIES).toBeGreaterThan(0)
    expect(DEFAULT_TTL_MS).toBeGreaterThan(0)
  })
})
