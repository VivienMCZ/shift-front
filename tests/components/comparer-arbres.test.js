import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ComparerPage from '@/app/comparer/page'
import { LanguageProvider, resetDictionaryCache } from '@/app/context/LanguageContext'
import { LocationProvider } from '@/app/context/LocationContext'

const useAuth = vi.hoisted(() => vi.fn(() => ({ user: null, loading: false })))
vi.mock('@/app/context/AuthContext', () => ({ useAuth }))
vi.mock('next/link', () => ({ default: ({ children, href }) => <a href={href}>{children}</a> }))
vi.mock('next/image', () => ({ default: ({ alt }) => <span>{alt}</span> }))
vi.mock('framer-motion', () => ({
  LayoutGroup: ({ children }) => children,
  m: new Proxy({}, { get: () => ({ children, ...props }) => <span {...props}>{children}</span> }),
  AnimatePresence: ({ children }) => children,
}))

const SCHOOLS = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1, name: `Auto-école ${i + 1}`, city: 'Paris', rating: 4.5, price: 1200,
  distance: 2.5, permis_type: 'voiture', tags: [],
}))

const largeur = (estDesktop) => {
  window.matchMedia = (query) => ({
    matches: estDesktop && query.includes('min-width: 768px'),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })
}

beforeEach(() => {
  resetDictionaryCache()
  global.fetch = vi.fn(async (url) => (
    /\/api\/v1\/libs\//.test(String(url))
      ? { ok: true, json: async () => ({}) }
      : {
        ok: true,
        headers: { get: (n) => (n === 'X-Total-Count' ? String(SCHOOLS.length) : null) },
        json: async () => SCHOOLS,
      }
  ))
})

const renderPage = () => render(
  <LanguageProvider><LocationProvider><ComparerPage /></LocationProvider></LanguageProvider>,
)

/**
 * /comparer porte deux interfaces complètes, l'une masquée par `display: none`.
 * Masquer dispense de peindre, pas de monter : le DOM portait deux cartes par
 * auto-école, et React comparait les deux arbres à chaque changement d'état.
 */
describe('montage d’un seul arbre', () => {
  it('ne monte qu’une carte par auto-école sur un écran large', async () => {
    largeur(true)
    renderPage()
    await waitFor(() => expect(screen.getAllByText('Auto-école 12').length).toBeGreaterThan(0))

    expect(document.querySelectorAll('article')).toHaveLength(SCHOOLS.length)
    expect(screen.getAllByText('Auto-école 12')).toHaveLength(1)
  })

  it('ne monte qu’une carte par auto-école sur un écran étroit', async () => {
    largeur(false)
    renderPage()
    await waitFor(() => expect(screen.getAllByText('Auto-école 12').length).toBeGreaterThan(0))

    expect(document.querySelectorAll('article')).toHaveLength(SCHOOLS.length)
  })

  it('monte les deux arbres quand la largeur est indéterminable', async () => {
    // `matchMedia` absent : plutôt que de planter, le hook répond « largeur
    // inconnue » et la page retrouve son comportement d'avant.
    const vraiMatchMedia = window.matchMedia
    delete window.matchMedia
    try {
      renderPage()
      await waitFor(() => expect(screen.getAllByText('Auto-école 12').length).toBeGreaterThan(0))

      // Deux cartes par auto-école : rien n'a été élagué, c'est bien l'état
      // d'avant qui est restitué.
      expect(document.querySelectorAll('article')).toHaveLength(SCHOOLS.length * 2)
    } finally {
      window.matchMedia = vraiMatchMedia
    }
  })
})
