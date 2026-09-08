/**
 * Jeu de fonctionnalités framer-motion, isolé dans son propre module pour que
 * le bundler puisse en faire un chunk chargé à la demande (voir MotionProvider).
 *
 * `domMax` et non `domAnimation` : la Navbar anime sa pastille active avec
 * `layoutId`, ce qui exige le système de projection présent uniquement ici.
 */
export { domMax as default } from 'framer-motion'
