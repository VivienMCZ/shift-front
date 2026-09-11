import { SITE_URL } from '@/app/lib/site-info'

export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Espace personnel et connexion : aucune valeur dans un index public.
      // `/api` et `/auth` sont proxifiés vers le backend.
      disallow: ['/compte', '/auth', '/api/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
