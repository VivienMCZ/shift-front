import { fetchEcoleMetadata } from '@/app/lib/ecole-metadata'

/**
 * La fiche est un Client Component, qui ne peut pas exporter de métadonnées :
 * ce layout serveur les porte à sa place.
 */
export async function generateMetadata({ params }) {
  const { id } = await params
  return (await fetchEcoleMetadata(id)) ?? { title: 'Auto-école' }
}

export default function EcoleLayout({ children }) {
  return children
}
