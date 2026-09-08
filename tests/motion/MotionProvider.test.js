import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { m } from 'framer-motion'
import MotionProvider from '@/app/components/MotionProvider'

/**
 * Le moteur d'animation de framer-motion est chargé à la demande pour le sortir
 * du bundle initial de chaque page. Les composants `m.*` rendus avant son
 * arrivée appliquent leur style `initial` — typiquement `opacity: 0`.
 *
 * Ces tests verrouillent le contrat qui rend ce découpage sûr : le contenu
 * existe dès le premier rendu, et l'état animé est bien atteint une fois le
 * moteur chargé. Sans cela, une régression de chargement rendrait invisibles
 * le titre du hero, les cartes du compte et la fiche auto-école.
 */
describe('MotionProvider', () => {
  it('rend le contenu animé dès le premier passage', () => {
    render(
      <MotionProvider>
        <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          Titre du hero
        </m.div>
      </MotionProvider>,
    )

    expect(screen.getByText('Titre du hero')).toBeInTheDocument()
  })

  it('atteint l\u2019état animé une fois le moteur chargé', async () => {
    render(
      <MotionProvider>
        <m.div data-testid="fade" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          Titre du hero
        </m.div>
      </MotionProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('fade')).toHaveStyle({ opacity: '1' })
    })
  })

  it('charge le jeu de fonctionnalités complet (layoutId de la Navbar)', async () => {
    const features = (await import('@/app/lib/motion-features')).default

    // `domMax` embarque `layout`, contrairement à `domAnimation` : sans lui, la
    // pastille `layoutId` de la Navbar ne se déplacerait plus entre les onglets.
    expect(features).toHaveProperty('layout')
    expect(features).toHaveProperty('animation')
  })
})
