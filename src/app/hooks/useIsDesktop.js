'use client'

import { useSyncExternalStore } from 'react'

/**
 * Le point de rupture `md` de Tailwind. Doit rester aligné sur les
 * `md:hidden` / `hidden md:block` qui masquent les arbres de /comparer : c'est
 * le CSS qui décide de ce qui est visible, ce hook décide seulement de ce qui
 * est monté.
 */
const DESKTOP_QUERY = '(min-width: 768px)'

/**
 * `matchMedia` peut manquer (moteur ancien, environnement de test) : on retombe
 * alors sur « largeur inconnue », donc sur les deux arbres montés — le
 * comportement d'avant, plutôt qu'une page qui plante.
 */
const mediaQuery = () => (typeof window !== 'undefined' && typeof window.matchMedia === 'function'
  ? window.matchMedia(DESKTOP_QUERY)
  : null)

const subscribe = (onChange) => {
  const query = mediaQuery()
  if (!query) return () => {}

  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

const getSnapshot = () => mediaQuery()?.matches ?? null

/**
 * Le serveur ne connaît pas la largeur de l'écran. `null` dit « on ne sait pas
 * encore » : React s'en sert au rendu serveur ET pendant l'hydratation, si bien
 * que les deux arbres restent montés le temps de ce premier rendu — exactement
 * ce que produisait le HTML jusqu'ici, donc aucun décalage d'hydratation, et
 * aucun écran vide le temps de savoir. La vraie valeur arrive au rendu suivant.
 */
const getServerSnapshot = () => null

/**
 * `true` sur un écran large, `false` sur un écran étroit, `null` tant que la
 * largeur est inconnue. Réévalué au redimensionnement.
 *
 * Sert à ne monter qu'un seul des deux arbres de /comparer. Les deux existent
 * dans le code — le mobile reste prêt à servir — mais `display: none` ne
 * dispense que de peindre : React montait et comparait les deux, et le DOM
 * portait 46 cartes pour 23 auto-écoles.
 */
export function useIsDesktop() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
