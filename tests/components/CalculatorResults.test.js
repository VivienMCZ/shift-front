import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CalculatorResults from '@/app/components/Calculator/CalculatorResults'
import { LanguageProvider, resetDictionaryCache } from '@/app/context/LanguageContext'

beforeEach(() => {
  resetDictionaryCache()
  global.fetch = vi.fn(async () => ({ ok: true, json: async () => ({}) }))
})

const renderResults = (results) => render(
  <LanguageProvider>
    <CalculatorResults results={results} />
  </LanguageProvider>,
)

const aide = (overrides = {}) => ({
  id: 1,
  nom: 'Permis à 1 euro',
  description: 'Prêt à taux zéro',
  montant: 1200,
  url_demande: 'https://service-public.fr/permis',
  ...overrides,
})

describe('CalculatorResults', () => {
  it('n’affiche rien tant qu’il n’y a pas de résultat', () => {
    const { container } = renderResults(null)
    expect(container).toBeEmptyDOMElement()
  })

  it('affiche le total potentiel et le détail des aides', () => {
    renderResults({ total_potentiel: 1200, aides: [aide()] })

    expect(screen.getByText('1200€')).toBeInTheDocument()
    expect(screen.getByText('Permis à 1 euro')).toBeInTheDocument()
    expect(screen.getByText('+1200€')).toBeInTheDocument()
    expect(screen.getByText('Prêt à taux zéro')).toBeInTheDocument()
  })

  it('affiche l’état vide quand aucune aide n’est trouvée', () => {
    renderResults({ total_potentiel: 0, aides: [] })

    expect(screen.getByText(/calculator_results\.no_aids_found/)).toBeInTheDocument()
  })

  it('rend le lien d’une aide vers une URL sûre', () => {
    renderResults({ total_potentiel: 1200, aides: [aide()] })

    const lien = screen.getByRole('link')
    expect(lien).toHaveAttribute('href', 'https://service-public.fr/permis')
    // Ouverture externe durcie contre le tabnabbing.
    expect(lien).toHaveAttribute('rel', expect.stringContaining('noopener'))
  })

  /**
   * A03 — DOM XSS. `url_demande` vient du backend : une aide dont l'URL est un
   * `javascript:` ne doit jamais devenir un lien exécutable. `safeExternalUrl`
   * la neutralise, le href tombe alors à vide.
   */
  it('neutralise une URL d’aide en javascript:', () => {
    renderResults({
      total_potentiel: 1200,
      aides: [aide({ url_demande: 'javascript:alert(document.cookie)' })],
    })

    // `safeExternalUrl` renvoie `undefined` : React retire alors l'attribut
    // `href`, l'ancre n'est plus navigable et n'expose plus le rôle « link ».
    // Aucun href ne doit porter le protocole javascript, où qu'il soit dans le DOM.
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    const hrefs = Array.from(document.querySelectorAll('a')).map((a) => a.getAttribute('href'))
    expect(hrefs.some((href) => href?.includes('javascript:'))).toBe(false)
  })

  it('n’affiche pas de lien quand l’aide n’a pas d’URL', () => {
    renderResults({ total_potentiel: 500, aides: [aide({ url_demande: null })] })

    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})
