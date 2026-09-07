import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="mt-16 w-full border-t border-[#303235]/10 bg-white/40 pt-12 pb-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row md:items-start">
          <div className="flex flex-col items-center md:items-start">
            <Link href="/" className="text-xl font-black tracking-tight text-[#1e293b]">
              SHIFT<span className="text-[#0047FF]">.</span>
            </Link>
            <p className="mt-2 max-w-xs text-center text-sm text-[#64748b] md:text-left">
              Trouvez la meilleure auto-école et les aides pour financer votre permis.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm font-semibold text-[#475569]">
            <Link href="/about" className="transition-colors hover:text-[#0047FF]">À propos</Link>
            <Link href="/contact" className="transition-colors hover:text-[#0047FF]">Contact</Link>
            <Link href="#" className="transition-colors hover:text-[#0047FF]">Mentions légales</Link>
            <Link href="#" className="transition-colors hover:text-[#0047FF]">CGU</Link>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[#303235]/10 pt-6 text-xs text-[#94a3b8] md:flex-row">
          <p>© {new Date().getFullYear()} Shift. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  )
}
