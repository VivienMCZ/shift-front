import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ComparerPage from '@/app/comparer/page'
import { LanguageProvider, resetDictionaryCache } from '@/app/context/LanguageContext'
import { LocationProvider } from '@/app/context/LocationContext'

const useAuth = vi.hoisted(() => vi.fn(() => ({ user: null, loading: false })))
vi.mock('@/app/context/AuthContext', () => ({ useAuth }))
vi.mock('next/link', () => ({ default: ({ children, href }) => <a href={href}>{children}</a> }))
vi.mock('next/image', () => ({ default: ({ alt }) => <span data-testid="img">{alt}</span> }))
vi.mock('framer-motion', () => ({
  LayoutGroup: ({ children }) => children,
  m: new Proxy({}, { get: () => ({ children, ...props }) => <span {...props}>{children}</span> }),
  AnimatePresence: ({ children }) => children,
}))

const TOTAL = 57

const school = (i) => ({
  id: i, name: `Auto-école ${i}`, city: 'Paris', rating: 4.5, price: 1200,
  distance: 2.5, permis_type: 'voiture', tags: [],
})

let calls

/**
 * jsdom répond `false` à toute media query : sans ce forçage, seul l'arbre
 * mobile serait monté et les filtres de la barre latérale n'existeraient pas.
 */
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

beforeEach(() => {
  forcerDesktop()
  resetDictionaryCache()
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

describe('pagination de /comparer', () => {
  it('ne demande que la première page au chargement', async () => {
    renderPage()
    await waitFor(() => expect(screen.getAllByText('Auto-école 1').length).toBeGreaterThan(0))

    expect(calls).toHaveLength(1)
    expect(calls[0]).toContain('limit=24')
    expect(calls[0]).toContain('offset=0')
    // La 25e n'appartient pas à la première page.
    expect(screen.queryByText('Auto-école 25')).not.toBeInTheDocument()
  })

  it('affiche le total renvoyé par l’en-tête, pas ce qui est chargé', async () => {
    renderPage()
    await waitFor(() => expect(screen.getAllByText('Auto-école 1').length).toBeGreaterThan(0))

    // 57 au compteur alors que 24 cartes seulement sont montées.
    expect(screen.getAllByText(String(TOTAL)).length).toBeGreaterThan(0)
  })

  it('ajoute la page suivante sans remplacer la précédente', async () => {
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => expect(screen.getAllByText('Auto-école 1').length).toBeGreaterThan(0))

    await user.click(screen.getAllByRole('button', { name: /voir plus/i })[0])

    await waitFor(() => expect(screen.getAllByText('Auto-école 25').length).toBeGreaterThan(0))
    // La première page est toujours là : on ajoute, on ne remplace pas.
    expect(screen.getAllByText('Auto-école 1').length).toBeGreaterThan(0)
    expect(calls[1]).toContain('offset=24')
  })

  it('retire le bouton une fois la dernière page atteinte', async () => {
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => expect(screen.getAllByText('Auto-école 1').length).toBeGreaterThan(0))

    await user.click(screen.getAllByRole('button', { name: /voir plus/i })[0])
    await waitFor(() => expect(screen.getAllByText('Auto-école 25').length).toBeGreaterThan(0))
    await user.click(screen.getAllByRole('button', { name: /voir plus/i })[0])

    await waitFor(() => expect(screen.getAllByText(`Auto-école ${TOTAL}`).length).toBeGreaterThan(0))
    expect(screen.queryByRole('button', { name: /voir plus/i })).not.toBeInTheDocument()
  })

  /**
   * Le cas piégeux : la page courante n'appartient qu'à une recherche donnée.
   * Sans remise à zéro, changer de filtre irait chercher l'offset 24 d'une
   * liste qui vient de changer, et concaténerait deux jeux de résultats.
   */
  it('repart de la première page quand un filtre change', async () => {
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => expect(screen.getAllByText('Auto-école 1').length).toBeGreaterThan(0))

    await user.click(screen.getAllByRole('button', { name: /voir plus/i })[0])
    await waitFor(() => expect(screen.getAllByText('Auto-école 25').length).toBeGreaterThan(0))

    calls.length = 0
    await user.click(screen.getAllByText('80+')[0])

    await waitFor(() => expect(calls.length).toBeGreaterThan(0))
    await waitFor(() => expect(screen.queryByText('Auto-école 25')).not.toBeInTheDocument())

    expect(calls.every((c) => c.includes('offset=0'))).toBe(true)
    expect(calls[calls.length - 1]).toContain('min_score=80')
    expect(screen.getAllByText('Auto-école 1').length).toBeGreaterThan(0)
  })

  it('ne propose pas de page suivante sans en-tête de total', async () => {
    global.fetch = vi.fn(async (url) => {
      const href = String(url)
      if (/\/api\/v1\/libs\//.test(href)) return { ok: true, json: async () => ({}) }
      return {
        ok: true,
        headers: { get: () => null },
        json: async () => Array.from({ length: 24 }, (_, i) => school(i + 1)),
      }
    })

    renderPage()
    await waitFor(() => expect(screen.getAllByText('Auto-école 1').length).toBeGreaterThan(0))

    expect(screen.queryByRole('button', { name: /voir plus/i })).not.toBeInTheDocument()
  })
})
