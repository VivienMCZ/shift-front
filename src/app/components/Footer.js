import Link from 'next/link'
import { Translate } from '@/app/calculateur-aides/translation'

const LINKS = [
  { href: '/about', labelKey: 'footer.about' },
  { href: '/contact', labelKey: 'footer.contact' },
  { href: '/mentions-legales', labelKey: 'footer.legal' },
  { href: '/confidentialite', labelKey: 'footer.privacy' },
  { href: '/cgu', labelKey: 'footer.cgu' },
]

export default function Footer() {
  return (
    // Sur mobile, la barre de navigation est fixée en bas de l'écran : la
    // marge basse garde le pied de page lisible au-dessus d'elle.
    <footer className="w-full border-t border-[#303235]/10 bg-white/40 pt-12 pb-36 md:pb-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row md:items-start">
          <div className="flex flex-col items-center md:items-start">
            <Link href="/" className="text-xl font-black tracking-tight text-[#1e293b]">
              SHIFT<span className="text-[#0047FF]">.</span>
            </Link>
            <p className="mt-2 max-w-xs text-center text-sm text-[#64748b] md:text-left">
              <Translate id="footer.tagline" />
            </p>
          </div>
          <nav aria-label="Liens légaux" className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm font-semibold text-[#475569]">
            {LINKS.map(({ href, labelKey }) => (
              <Link key={href} href={href} className="transition-colors hover:text-[#0047FF]">
                <Translate id={labelKey} />
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[#303235]/10 pt-6 text-xs text-[#94a3b8] md:flex-row">
          <p>© {new Date().getFullYear()} Shift. <Translate id="footer.rights" /></p>
        </div>
      </div>
    </footer>
  )
}
