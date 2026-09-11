// Espace personnel : rien à indexer. Hérité par /compte/comparateur.
export const metadata = {
  title: 'Mon compte',
  robots: { index: false, follow: false },
}

export default function CompteLayout({ children }) {
  return children
}
