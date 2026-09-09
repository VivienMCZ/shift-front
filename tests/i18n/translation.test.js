import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LanguageProvider, resetDictionaryCache } from '@/app/context/LanguageContext'
import { Translate } from '@/app/calculateur-aides/translation'

const dictionaryResponse = (entries) => ({ ok: true, json: async () => entries })

function renderTranslated(ui) {
  return render(<LanguageProvider>{ui}</LanguageProvider>)
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  global.fetch = vi.fn()
  // Le dictionnaire est mémorisé pour la session : chaque cas repart d'une
  // ardoise vierge pour observer les vrais appels réseau.
  resetDictionaryCache()
})

afterEach(() => {
  resetDictionaryCache()
  delete global.fetch
})

describe('chargement du dictionnaire', () => {
  it('ne fait qu’une seule requête, pour la langue courante', async () => {
    global.fetch.mockResolvedValue(dictionaryResponse({ 'hero.title.part1': 'Bonjour' }))

    renderTranslated(<Translate id="hero.title.part1" />)

    await waitFor(() => expect(screen.getByText('Bonjour')).toBeInTheDocument())
    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(global.fetch).toHaveBeenCalledWith('/api/v1/libs/dictionary?lang=fr')
  })

  it('utilise la langue restaurée depuis le stockage', async () => {
    localStorage.setItem('shift_app_lang', 'en')
    global.fetch.mockResolvedValue(dictionaryResponse({ 'hero.title.part1': 'Hello' }))

    renderTranslated(<Translate id="hero.title.part1" />)

    await waitFor(() => expect(screen.getByText('Hello')).toBeInTheDocument())
    expect(global.fetch).toHaveBeenCalledWith('/api/v1/libs/dictionary?lang=en')
  })

  /**
   * Le cœur de la migration : avant, chaque libellé ouvrait sa propre requête.
   * /comparer en monte 79, en concurrence avec le chargement des données.
   */
  it('sert N libellés distincts avec un seul aller-retour', async () => {
    global.fetch.mockResolvedValue(dictionaryResponse({
      'navbar.comparer': 'Comparer',
      'navbar.aides': 'Aides',
      'navbar.compte': 'Compte',
    }))

    renderTranslated(
      <>
        <span><Translate id="navbar.comparer" /></span>
        <span><Translate id="navbar.aides" /></span>
        <span><Translate id="navbar.compte" /></span>
        <span><Translate id="navbar.comparer" /></span>
      </>,
    )

    await waitFor(() => expect(screen.getAllByText('Comparer')).toHaveLength(2))
    expect(screen.getByText('Aides')).toBeInTheDocument()
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it('partage une seule requête entre plusieurs providers montés ensemble', async () => {
    global.fetch.mockResolvedValue(dictionaryResponse({ 'navbar.comparer': 'Comparer' }))

    render(
      <>
        <LanguageProvider><span><Translate id="navbar.comparer" /></span></LanguageProvider>
        <LanguageProvider><span><Translate id="navbar.comparer" /></span></LanguageProvider>
      </>,
    )

    await waitFor(() => expect(screen.getAllByText('Comparer')).toHaveLength(2))
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })
})

describe('<Translate>', () => {
  it('remplace la clé par sa traduction', async () => {
    global.fetch.mockResolvedValue(dictionaryResponse({
      'hero.title.part1': 'Trouvez la meilleure auto-école',
    }))

    renderTranslated(<Translate id="hero.title.part1" />)

    await waitFor(() => {
      expect(screen.getByText('Trouvez la meilleure auto-école')).toBeInTheDocument()
    })
    expect(screen.queryByText('hero.title.part1')).not.toBeInTheDocument()
  })

  // Garde-fou : sans dictionnaire, l'interface doit afficher quelque chose.
  it('retombe sur la clé quand le dictionnaire est injoignable', async () => {
    global.fetch.mockRejectedValue(new TypeError('Failed to fetch'))

    renderTranslated(<Translate id="hero.title.part1" />)

    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
    expect(screen.getByText('hero.title.part1')).toBeInTheDocument()
  })

  it('retombe sur la clé quand l’API répond une erreur', async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) })

    renderTranslated(<Translate id="hero.title.part1" />)

    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
    expect(screen.getByText('hero.title.part1')).toBeInTheDocument()
  })

  it('retombe sur la clé absente du dictionnaire', async () => {
    global.fetch.mockResolvedValue(dictionaryResponse({ 'autre.cle': 'Autre' }))

    renderTranslated(<Translate id="hero.title.part1" />)

    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
    expect(screen.getByText('hero.title.part1')).toBeInTheDocument()
  })

  it('change de libellé quand la clé change, sans nouvelle requête', async () => {
    global.fetch.mockResolvedValue(dictionaryResponse({
      'hero.title.part1': 'Un',
      'hero.title.part2': 'Deux',
    }))

    const { rerender } = renderTranslated(<Translate id="hero.title.part1" />)
    await waitFor(() => expect(screen.getByText('Un')).toBeInTheDocument())

    rerender(
      <LanguageProvider>
        <Translate id="hero.title.part2" />
      </LanguageProvider>,
    )

    expect(screen.getByText('Deux')).toBeInTheDocument()
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })
})
