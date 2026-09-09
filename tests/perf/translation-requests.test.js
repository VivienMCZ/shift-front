import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ComparerPage from '@/app/comparer/page'
import HeroSection from '@/app/components/Home/HeroSection'
import ProofPillars from '@/app/components/Home/ProofPillars'
import { LanguageProvider, resetDictionaryCache } from '@/app/context/LanguageContext'
import { LocationProvider } from '@/app/context/LocationContext'

const useAuth = vi.hoisted(() => vi.fn(() => ({ user: null, loading: false })))
vi.mock('@/app/context/AuthContext', () => ({ useAuth }))
vi.mock('next/link', () => ({ default: ({ children, href }) => <a href={href}>{children}</a> }))
vi.mock('@splinetool/react-spline', () => ({ default: () => null }))
vi.mock('framer-motion', () => ({
  LayoutGroup: ({ children }) => children,
  m: new Proxy({}, { get: () => ({ children, ...props }) => <span {...props}>{children}</span> }),
  AnimatePresence: ({ children }) => children,
}))

const SCHOOLS = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  name: `Auto-école ${i + 1}`,
  city: 'Paris',
  rating: 4.5,
  price: 1200,
  distance: 2.5,
  permis_type: 'voiture',
  tags: [],
}))

const TRANSLATE_RE = /\/api\/v1\/libs\//

let translateCalls
let schoolCalls

beforeEach(() => {
  resetDictionaryCache()
  translateCalls = []
  schoolCalls = []

  global.fetch = vi.fn(async (url) => {
    if (TRANSLATE_RE.test(url)) {
      translateCalls.push(String(url))
      return { ok: true, json: async () => ({ 'comparer.page.title': 'Comparer' }) }
    }
    schoolCalls.push(String(url))
    return { ok: true, json: async () => SCHOOLS }
  })
})

/**
 * Garde-fou de performance réseau.
 *
 * /comparer monte son arbre mobile ET son arbre desktop, et répète les mêmes
 * libellés sur chacune des cartes : 79 clés distinctes. Chaque <Translate>
 * résolvait autrefois la sienne, une requête chacune — un fan-out qui saturait
 * la connexion et repoussait derrière lui le chargement des données. Le
 * dictionnaire est désormais chargé en un seul appel, par langue.
 */
describe('requêtes de traduction sur /comparer', () => {
  it('charge tous les libellés en un seul aller-retour', async () => {
    render(
      <LanguageProvider>
        <LocationProvider>
          <ComparerPage />
        </LocationProvider>
      </LanguageProvider>,
    )

    await waitFor(
      () => expect(screen.getAllByText('Auto-école 20').length).toBeGreaterThan(0),
      { timeout: 4000 },
    )
    await new Promise((resolve) => setTimeout(resolve, 100))

    console.log(`\n  → ${translateCalls.length} requête(s) de traduction pour ${SCHOOLS.length} auto-écoles\n`)

    expect(translateCalls).toEqual(['/api/v1/libs/dictionary?lang=fr'])
  })

  /**
   * La position n'est connue qu'après le montage. Partir la chercher sans elle,
   * c'est une requête complète jetée puis relancée avec les coordonnées.
   */
  it('ne demande les auto-écoles qu’une fois au chargement', async () => {
    render(
      <LanguageProvider>
        <LocationProvider>
          <ComparerPage />
        </LocationProvider>
      </LanguageProvider>,
    )

    await waitFor(
      () => expect(screen.getAllByText('Auto-école 20').length).toBeGreaterThan(0),
      { timeout: 4000 },
    )
    await new Promise((resolve) => setTimeout(resolve, 500))

    expect(schoolCalls).toHaveLength(1)
  })
})

describe('requêtes de traduction sur la page d’accueil', () => {
  it('partage le dictionnaire entre le hero et les piliers', async () => {
    render(
      <LanguageProvider>
        <HeroSection />
        <ProofPillars />
      </LanguageProvider>,
    )

    await waitFor(() => expect(translateCalls.length).toBeGreaterThan(0))
    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(translateCalls).toEqual(['/api/v1/libs/dictionary?lang=fr'])
  })
})
