// Écran de connexion : sans intérêt dans un moteur de recherche.
export const metadata = {
  title: 'Connexion',
  robots: { index: false, follow: false },
}

export default function AuthLayout({ children }) {
  return children
}
