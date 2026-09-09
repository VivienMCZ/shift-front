import { render, screen, waitFor } from '@testing-library/react'
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LanguageProvider, resetDictionaryCache, useLanguage } from '@/app/context/LanguageContext'
import { Translate } from '@/app/calculateur-aides/translation'

const dictionaryResponse = (entries) => ({ ok: true, json: async () => entries })

const wrapper = ({ children }) => <LanguageProvider>{children}</LanguageProvider>

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  resetDictionaryCache()
  global.fetch = vi.fn()
})

afterEach(() => {
  resetDictionaryCache()
  delete global.fetch
})

describe('cache par langue', () => {
  it('recharge le dictionnaire au changement de langue, puis le mémorise', async () => {
    global.fetch.mockImplementation(async (url) => (
      String(url).includes('lang=en')
        ? dictionaryResponse({ 'navbar.comparer': 'Compare' })
        : dictionaryResponse({ 'navbar.comparer': 'Comparer' })
    ))

    const { result } = renderHook(() => useLanguage(), { wrapper })
    await waitFor(() => expect(result.current.t('navbar.comparer')).toBe('Comparer'))

    act(() => result.current.setLang('en'))
    await waitFor(() => expect(result.current.t('navbar.comparer')).toBe('Compare'))
    expect(global.fetch).toHaveBeenCalledTimes(2)

    // Retour au français : déjà en mémoire, aucune requête de plus.
    act(() => result.current.setLang('fr'))
    await waitFor(() => expect(result.current.t('navbar.comparer')).toBe('Comparer'))
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  // Une coupure passagère ne doit pas figer les libellés bruts pour la session.
  it('ne mémorise pas un échec', async () => {
    global.fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))

    const { result } = renderHook(() => useLanguage(), { wrapper })
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1))
    expect(result.current.t('navbar.comparer')).toBe('navbar.comparer')

    global.fetch.mockResolvedValue(dictionaryResponse({ 'navbar.comparer': 'Comparer' }))
    act(() => result.current.setLang('en'))
    act(() => result.current.setLang('fr'))

    await waitFor(() => expect(result.current.t('navbar.comparer')).toBe('Comparer'))
  })
})

describe('robustesse du dictionnaire', () => {
  /**
   * Les clés ne sont pas toutes des littéraux du code : `compte/page.js` bâtit
   * `calculateur.status.${statut}` sur une valeur renvoyée par le backend. Lire
   * le dictionnaire par indexation d'objet exposerait alors son prototype —
   * `t('constructor')` renverrait une fonction au lieu de la clé.
   */
  it('n’expose pas les membres du prototype', async () => {
    global.fetch.mockResolvedValue(dictionaryResponse({ 'navbar.comparer': 'Comparer' }))

    const { result } = renderHook(() => useLanguage(), { wrapper })
    await waitFor(() => expect(result.current.t('navbar.comparer')).toBe('Comparer'))

    expect(result.current.t('constructor')).toBe('constructor')
    expect(result.current.t('__proto__')).toBe('__proto__')
    expect(result.current.t('toString')).toBe('toString')
  })

  it('ignore les valeurs qui ne sont pas du texte', async () => {
    global.fetch.mockResolvedValue(dictionaryResponse({
      'navbar.comparer': 'Comparer',
      'navbar.aides': { nested: 'objet' },
      'navbar.compte': 42,
    }))

    const { result } = renderHook(() => useLanguage(), { wrapper })
    await waitFor(() => expect(result.current.t('navbar.comparer')).toBe('Comparer'))

    expect(result.current.t('navbar.aides')).toBe('navbar.aides')
    expect(result.current.t('navbar.compte')).toBe('navbar.compte')
  })

  it('retombe sur les clés si la réponse n’est pas un objet', async () => {
    global.fetch.mockResolvedValue({ ok: true, json: async () => ['Comparer'] })

    render(
      <LanguageProvider>
        <Translate id="navbar.comparer" />
      </LanguageProvider>,
    )

    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
    expect(screen.getByText('navbar.comparer')).toBeInTheDocument()
  })
})

describe('repli de t()', () => {
  it('rend le repli fourni tant que le dictionnaire n’est pas là', async () => {
    let resolveDictionary
    global.fetch.mockImplementation(() => new Promise((resolve) => { resolveDictionary = resolve }))

    const { result } = renderHook(() => useLanguage(), { wrapper })

    // Un placeholder doit rester lisible pendant le chargement.
    expect(result.current.t('auth.placeholder.email', 'nom@exemple.fr')).toBe('nom@exemple.fr')

    resolveDictionary(dictionaryResponse({ 'auth.placeholder.email': 'Votre e-mail' }))
    await waitFor(() => {
      expect(result.current.t('auth.placeholder.email', 'nom@exemple.fr')).toBe('Votre e-mail')
    })
  })

  it('rend la clé quand aucun repli n’est donné', async () => {
    global.fetch.mockResolvedValue(dictionaryResponse({}))

    const { result } = renderHook(() => useLanguage(), { wrapper })
    await waitFor(() => expect(global.fetch).toHaveBeenCalled())

    expect(result.current.t('navbar.comparer')).toBe('navbar.comparer')
  })
})
