'use client'

import { LazyMotion } from 'framer-motion'

/**
 * Le moteur d'animation de framer-motion pèse une centaine de kilo-octets. La
 * Navbar vivant dans le layout racine, ce poids était embarqué dans le bundle
 * initial de toutes les pages, y compris celles qui n'animent rien.
 *
 * `LazyMotion` ne garde que la couche légère (les composants `m.*`) dans le
 * bundle initial et va chercher le moteur en parallèle, une fois la page
 * affichée. Les animations sont identiques ; elles démarrent simplement une
 * fois le chunk arrivé.
 */
export default function MotionProvider({ children }) {
  return (
    <LazyMotion features={() => import('@/app/lib/motion-features').then((mod) => mod.default)}>
      {children}
    </LazyMotion>
  )
}
