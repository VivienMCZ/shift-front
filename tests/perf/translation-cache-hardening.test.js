import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchTextByKey, resetTranslationCache } from '@/app/calculateur-aides/translation'

/**
 * Le cache de traductions retient des textes renvoyés par le backend. Ces tests
 * verrouillent les deux propriétés qui le rendent sûr : il ne laisse aucune
 * trace dans le stockage du navigateur, et il ne peut pas grossir
 * indéfiniment sous l'effet de données serveur (OWASP A04).
 */
describe('durcissement du cache de traductions', () => {
  beforeEach(() => {
    resetTranslationCache()
    global.fetch = vi.fn(async () => ({ ok: true, json: async () => ({ text: 'Libellé' }) }))
  })

  /**
   * `compte/page.js` bâtit `calculateur.status.${statut}` depuis le profil
   * renvoyé par le backend : le NOM de la clé encoderait le statut de
   * l'utilisateur. `logout()` naviguant sans fermer l'onglet, une entrée
   * persistée survivrait à la déconnexion sur un poste partagé.
   */
  it('ne laisse aucune trace dans le stockage du navigateur', async () => {
    await fetchTextByKey('calculateur.status.chomeur', 'fr')
    // L'écriture était auparavant différée : on laisse largement le temps.
    await new Promise((resolve) => setTimeout(resolve, 320))

    expect(sessionStorage.length).toBe(0)
    expect(localStorage.length).toBe(0)
  })

  it('sert bien la valeur mise en cache sans repasser par le réseau', async () => {
    await expect(fetchTextByKey('a.b', 'fr')).resolves.toBe('Libellé')
    await expect(fetchTextByKey('a.b', 'fr')).resolves.toBe('Libellé')

    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  // L'espace de clés n'est pas contraint côté client : le cache ne doit pas
  // grandir au rythme de ce que renvoie le serveur.
  it('reste borné quand le backend alimente des clés distinctes sans fin', async () => {
    for (let i = 0; i < 900; i++) {
      await fetchTextByKey(`calculateur.status.injecte-${i}`, 'fr')
    }
    expect(global.fetch).toHaveBeenCalledTimes(900)

    // La plus récente est retenue : aucune requête supplémentaire.
    await fetchTextByKey('calculateur.status.injecte-899', 'fr')
    expect(global.fetch).toHaveBeenCalledTimes(900)

    // La plus ancienne a été évincée : elle repart au réseau.
    await fetchTextByKey('calculateur.status.injecte-0', 'fr')
    expect(global.fetch).toHaveBeenCalledTimes(901)
  })

  it('sert une réponse démesurée sans la mémoriser', async () => {
    const huge = 'x'.repeat(5000)
    global.fetch = vi.fn(async () => ({ ok: true, json: async () => ({ text: huge }) }))

    await expect(fetchTextByKey('a.b', 'fr')).resolves.toBe(huge)
    await expect(fetchTextByKey('a.b', 'fr')).resolves.toBe(huge)

    // Affichée normalement, mais jamais retenue : chaque appel repart au réseau.
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  it('sépare les langues sans les confondre', async () => {
    global.fetch = vi.fn(async (url) => ({
      ok: true,
      json: async () => ({ text: url.includes('lang=en') ? 'Hello' : 'Bonjour' }),
    }))

    await expect(fetchTextByKey('a.b', 'fr')).resolves.toBe('Bonjour')
    await expect(fetchTextByKey('a.b', 'en')).resolves.toBe('Hello')
    await expect(fetchTextByKey('a.b', 'fr')).resolves.toBe('Bonjour')

    expect(global.fetch).toHaveBeenCalledTimes(2)
  })
})
