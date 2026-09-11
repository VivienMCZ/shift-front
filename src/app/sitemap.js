import { SITE_URL } from '@/app/lib/site-info'

/**
 * Pages publiques et stables.
 *
 * Les fiches d'auto-école n'y sont pas encore : plus de 50 000 URL dépassent la
 * limite d'un fichier sitemap (50 000) et exigent de lister les identifiants
 * depuis l'API au moment de la génération — donc une route backend dédiée et
 * `generateSitemaps` pour découper. Noté en dette (AGENTS.md § 11).
 */
const PAGES = [
  { path: '', changeFrequency: 'weekly', priority: 1 },
  { path: '/comparer', changeFrequency: 'daily', priority: 0.9 },
  { path: '/calculateur-aides', changeFrequency: 'monthly', priority: 0.9 },
  { path: '/about', changeFrequency: 'yearly', priority: 0.4 },
  { path: '/contact', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/mentions-legales', changeFrequency: 'yearly', priority: 0.1 },
  { path: '/confidentialite', changeFrequency: 'yearly', priority: 0.1 },
  { path: '/cgu', changeFrequency: 'yearly', priority: 0.1 },
]

export default function sitemap() {
  return PAGES.map(({ path, changeFrequency, priority }) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency,
    priority,
  }))
}
