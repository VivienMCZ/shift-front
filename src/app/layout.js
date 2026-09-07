import { AuthProvider } from '@/app/context/AuthContext'
import { LocationProvider } from '@/app/context/LocationContext'
import { LanguageProvider } from '@/app/context/LanguageContext'
import Navbar from '@/app/components/Navbar'
import './globals.css'

export const metadata = {
  title: 'Shift',
  description: "Comparer les auto-écoles et trouver des aides pour financer son permis.",
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <LanguageProvider>
          <AuthProvider>
            <LocationProvider>
              <Navbar />
              {children}
            </LocationProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}