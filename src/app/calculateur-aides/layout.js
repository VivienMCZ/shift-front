// La page est un Client Component : ses métadonnées vivent dans ce layout.
export const metadata = {
  title: 'Calculateur d’aides au permis de conduire',
  description:
    'Estimez en 2 minutes les aides pour financer votre permis : CPF, aides régionales, départementales, handicap, apprentis et jeunes en insertion.',
}

export default function CalculateurLayout({ children }) {
  return children
}
