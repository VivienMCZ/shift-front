import { AuthProvider } from '@/app/context/AuthContext'
import { LocationProvider } from '@/app/context/LocationContext'
import { LanguageProvider } from '@/app/context/LanguageContext'
import Navbar from '@/app/components/Navbar'
import MotionProvider from '@/app/components/MotionProvider'
import './globals.css'

export const metadata = {
  title: 'Shift',
  description: "Comparer les auto-écoles et trouver des aides pour financer son permis.",
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        {/* Origines tierces contactées peu après le premier rendu. Ouvrir la
            connexion (DNS + TCP + TLS) en avance retire ces allers-retours du
            chemin critique. React 19 remonte ces balises dans <head>.

            `crossOrigin` doit refléter le mode de la vraie requête, sinon la
            connexion préchauffée n'est pas réutilisée : la scène Spline est
            récupérée en fetch (donc anonyme), les avatars en <img> simple. */}
        <link rel="preconnect" href="https://prod.spline.design" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://api.dicebear.com" />
        <link rel="dns-prefetch" href="https://www.gstatic.com" />
        <link rel="dns-prefetch" href="https://api-adresse.data.gouv.fr" />
        <MotionProvider>
        <LanguageProvider>
          <AuthProvider>
            <LocationProvider>
              <Navbar />
              {children}
            </LocationProvider>
          </AuthProvider>
        </LanguageProvider>
        </MotionProvider>
      </body>
    </html>
  )
}