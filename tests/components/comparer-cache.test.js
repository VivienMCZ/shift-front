import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ComparerPage from '@/app/comparer/page'
import { LanguageProvider, resetDictionaryCache } from '@/app/context/LanguageContext'
import { LocationProvider } from '@/app/context/LocationContext'
import { resetEcolesCache } from '@/services/ecolesService'

const useAuth = vi.hoisted(() => vi.fn(() => ({ user: null, loading: false })))
vi.mock('@/app/context/AuthContext', () => ({ useAuth }))
vi.mock('next/link', () => ({ default: ({ children, href }) => <a href={href}>{children}</a> }))
vi.mock('next/image', () => ({ default: ({ alt }) => <span data-testid="img">{alt}</span> }))
vi.mock('framer-motion', () => ({
  LayoutGroup: ({ children }) => children,
  m: new Proxy({}, { get: () => ({ children, ...props }) => <span {...props}>{children}</span> }),
  AnimatePresence: ({ children }) => children,
}))

const TOTAL = 30

const school = (i) => ({
  id: i, name: `Auto-école ${i}`, city: 'Paris', rating: 4.5, price: 1200,
  distance: 2.5, permis_type: 'voiture', tags: [],
})

let calls

const forcerDesktop = () => {
  window.matchMedia = (query) => ({
    matches: query.includes('min-width: 768px'),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })
}

const renderPage = () => render(
  <LanguageProvider><LocationProvider><ComparerPage /></LocationProvider></LanguageProvider>,
)

/** Les squelettes n'ont pas de texte : on les repère à leur classe d'animation. */
const squelettes = () => document.querySelectorAll('.animate-pulse')

beforeEach(() => {
  forcerDesktop()
  resetDictionaryCache()
  resetEcolesCache()
  // La page reconstruit ses filtres depuis l'URL, que `replaceState` reecrit a
  // chaque changement. Sans remise a zero, un test repartirait des filtres du
  // precedent et n'emettrait pas la requete attendue.
  window.history.replaceState(null, '', '/comparer')
  calls = []
  global.fetch = vi.fn(async (url) => {
    const href = String(url)
    if (/\/api\/v1\/libs\//.test(href)) return { ok: true, json: async () => ({}) }

    calls.push(href)
    const params = new URLSearchParams(href.split('?')[1] ?? '')
    const limit = Number(params.get('limit'))
    const offset = Number(params.get('offset'))
    const page = Array.from(
      { length: Math.max(0, Math.min(limit, TOTAL - offset)) },
      (_, i) => school(offset + i + 1),
    )
    return {
      ok: true,
      headers: { get: (name) => (name === 'X-Total-Count' ? String(TOTAL) : null) },
      json: async () => page,
    }
  })
})

describe('affichage instantané de /comparer', () => {
  it('montre des squelettes tant qu’aucun résultat n’est arrivé', async () => {
    renderPage()

    expect(squelettes().length).toBeGreaterThan(0)
    await waitFor(() => expect(screen.getAllByText('Auto-école 1').length).toBeGreaterThan(0))
    expect(squelettes()).toHaveLength(0)
  })

  /**
   * Le cœur de la demande : un changement de filtre ne doit pas repasser la
   * grille en squelettes. Les cartes précédentes restent affichées jusqu'à
   * l'arrivée des nouvelles.
   */
  it('garde les cartes précédentes pendant un changement de filtre', async () => {
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => expect(screen.getAllByText('Auto-école 1').length).toBeGreaterThan(0))

    // Réponse retardée : la fenêtre pendant laquelle l'ancien contenu doit tenir.
    let libere
    const enAttente = new Promise((resolve) => { libere = resolve })
    global.fetch = vi.fn(async (url) => {
      if (/\/api\/v1\/libs\//.test(String(url))) return { ok: true, json: async () => ({}) }
      await enAttente
      return {
        ok: true,
        headers: { get: (name) => (name === 'X-Total-Count' ? '1' : null) },
        json: async () => [school(99)],
      }
    })

    await user.click(screen.getAllByText('80+')[0])
    await waitFor(() => expect(global.fetch).toHaveBeenCalled())

    // Requête en vol : ni squelettes, ni grille vidée.
    expect(squelettes()).toHaveLength(0)
    expect(screen.getAllByText('Auto-école 1').length).toBeGreaterThan(0)

    libere()
    await waitFor(() => expect(screen.getAllByText('Auto-école 99').length).toBeGreaterThan(0))
    expect(screen.queryByText('Auto-école 1')).not.toBeInTheDocument()
  })

  /**
   * Revenir sur une combinaison déjà vue ne doit rien redemander à l'API :
   * c'est ce qui rend le retour de curseur instantané.
   */
  it('ne redemande pas une recherche déjà obtenue', async () => {
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => expect(screen.getAllByText('Auto-école 1').length).toBeGreaterThan(0))

    await user.click(screen.getAllByText('80+')[0])
    await waitFor(() => expect(calls).toHaveLength(2))

    await user.click(screen.getAllByText('90+')[0])
    await waitFor(() => expect(calls).toHaveLength(3))

    // Retour sur « 80+ » : la reponse est deja en memoire.
    calls.length = 0
    await user.click(screen.getAllByText('80+')[0])

    await waitFor(() => expect(screen.getAllByText('Auto-école 1').length).toBeGreaterThan(0))
    expect(calls).toHaveLength(0)
    expect(squelettes()).toHaveLength(0)
  })

  it('précharge la page suivante au survol du bouton', async () => {
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => expect(screen.getAllByText('Auto-école 1').length).toBeGreaterThan(0))

    calls.length = 0
    await user.hover(screen.getAllByRole('button', { name: /voir plus/i })[0])

    await waitFor(() => expect(calls).toHaveLength(1))
    expect(calls[0]).toContain('offset=24')

    // Le clic qui suit consomme la page préchargée, sans second appel.
    calls.length = 0
    await user.click(screen.getAllByRole('button', { name: /voir plus/i })[0])

    await waitFor(() => expect(screen.getAllByText('Auto-école 25').length).toBeGreaterThan(0))
    expect(calls).toHaveLength(0)
  })
})
