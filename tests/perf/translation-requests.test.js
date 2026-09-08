import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ComparerPage from '@/app/comparer/page'
import HeroSection from '@/app/components/Home/HeroSection'
import ProofPillars from '@/app/components/Home/ProofPillars'
import { LanguageProvider } from '@/app/context/LanguageContext'
import { LocationProvider } from '@/app/context/LocationContext'
import { resetTranslationCache } from '@/app/calculateur-aides/translation'

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

beforeEach(() => {
  resetTranslationCache()
  translateCalls = []

  global.fetch = vi.fn(async (url) => {
    if (TRANSLATE_RE.test(url)) {
      translateCalls.push(url)
      return { ok: true, json: async () => ({ text: 'Libellé' }) }
    }
    return { ok: true, json: async () => SCHOOLS }
  })
})

/**
 * Garde-fou de performance réseau.
 *
 * /comparer monte son arbre mobile ET son arbre desktop, et répète les mêmes
 * libellés sur chacune des cartes. Sans mutualisation, chaque <Translate>
 * ouvrait sa propre requête : plusieurs centaines d'allers-retours pour
 * quelques dizaines de libellés distincts, en concurrence avec le chargement
 * des données. Le cache de `fetchTextByKey` ramène ce total au nombre de clés
 * réellement distinctes.
 */
describe('requêtes de traduction sur /comparer', () => {
  it('ne demande chaque clé qu\u2019une fois, quel que soit le nombre de cartes', async () => {
    render(
      <LanguageProvider>
        <LocationProvider>
          <ComparerPage />
        </LocationProvider>
      </LanguageProvider>,
    )

    // Les cartes n'arrivent qu'après le debounce de 300 ms : c'est là que les
    // mêmes libellés sont remontés, une fois par carte et par arbre.
    await waitFor(
      () => expect(screen.getAllByText('Auto-école 20').length).toBeGreaterThan(0),
      { timeout: 4000 },
    )
    await new Promise((resolve) => setTimeout(resolve, 100))

    const unique = new Set(translateCalls)
    console.log(`\n  → ${translateCalls.length} requêtes de traduction pour ${unique.size} clés distinctes (${SCHOOLS.length} auto-écoles)\n`)

    expect(translateCalls.length).toBe(unique.size)
  })
})

describe('requêtes de traduction sur la page d’accueil', () => {
  it('mutualise les clés partagées entre le hero et les piliers', async () => {
    render(
      <LanguageProvider>
        <HeroSection />
        <ProofPillars />
      </LanguageProvider>,
    )

    await waitFor(() => expect(translateCalls.length).toBeGreaterThan(10))
    await new Promise((resolve) => setTimeout(resolve, 100))

    const unique = new Set(translateCalls)
    console.log(`
  → accueil : ${translateCalls.length} requêtes pour ${unique.size} clés distinctes
`)

    expect(translateCalls.length).toBe(unique.size)
  })
})
