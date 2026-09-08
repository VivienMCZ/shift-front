'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { HelpCircle, Scale, User } from 'lucide-react'
import { GLASS_SHELL_STYLE } from '@/app/lib/glass-styles'
import { m, LayoutGroup } from 'framer-motion'
import { useAuth } from '@/app/context/AuthContext'
import { Translate } from '@/app/calculateur-aides/translation'
import { useLanguage } from '@/app/context/LanguageContext'
import { isActivePath } from '@/app/lib/nav-utils'

const links = [
  { id: 'comparer', href: '/comparer', label: <Translate id="navbar.comparer" />, icon: Scale },
  { id: 'aides', href: '/calculateur-aides', label: <Translate id="navbar.aides" />, icon: HelpCircle },
  { id: 'compte', href: '/auth', label: <Translate id="navbar.compte" />, icon: User },
]

export default function Navbar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const { lang, setLang } = useLanguage()

  const dynamicLinks = links.map(link => {
    if (link.id === 'compte') {
      return { ...link, href: user ? '/compte' : '/auth' }
    }
    return link
  })

  return (
    <LayoutGroup>
      <header className="fixed left-1/2 top-4 z-50 hidden w-[min(calc(100%-2rem),72rem)] -translate-x-1/2 md:block">
        <div
          className="flex h-14 items-center justify-between rounded-full px-3"
          style={GLASS_SHELL_STYLE}
        >
          <Link href="/" className="px-4 text-lg font-black tracking-tight text-white">
            SHIFT<span className="text-[#74A3FF]">.</span>
          </Link>

          <nav className="flex items-center gap-1" aria-label="Navigation principale">
            {dynamicLinks.map((link) => {
              const Icon = link.icon
              const isActive = isActivePath(pathname, link.href)

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? 'page' : undefined}
                  className="relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black transition-colors"
                >
                  {isActive && (
                    <m.span
                      layoutId="navbar-desktop-pill"
                      layout
                      className="liquid-active-plaque absolute inset-0 rounded-full"
                      transition={{ type: 'spring', stiffness: 380, damping: 36 }}
                    />
                  )}
                  <Icon
                    size={16}
                    strokeWidth={isActive ? 2.5 : 2}
                    className={`relative z-10 ${isActive ? 'text-white' : 'text-white/64'}`}
                  />
                  <span className={`relative z-10 ${isActive ? 'text-white' : 'text-white/68'}`}>
                    {link.label}
                  </span>
                </Link>
              )
            })}

            <div className="mx-2 h-6 w-px bg-white/20" />
            <div className="flex items-center gap-1 rounded-full bg-white/10 p-1">
              <button
                onClick={() => setLang('fr')}
                className={`rounded-full px-2.5 py-1 text-[10px] font-black transition-all ${lang === 'fr' ? 'bg-white text-[#0037FF]' : 'text-white/70 hover:text-white'}`}
              >
                FR
              </button>
              <button
                onClick={() => setLang('en')}
                className={`rounded-full px-2.5 py-1 text-[10px] font-black transition-all ${lang === 'en' ? 'bg-white text-[#0037FF]' : 'text-white/70 hover:text-white'}`}
              >
                EN
              </button>
            </div>
          </nav>
        </div>
      </header>

      <div className="fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 px-3 pb-3 md:hidden">
        {/* Sélecteur de langue — pilule flottante distincte, séparée de la navigation */}
        <div className="flex w-full max-w-[34rem] justify-end">
          <div className="flex items-center gap-1 rounded-full p-1" style={GLASS_SHELL_STYLE}>
            {['fr', 'en'].map((code) => (
              <button
                key={code}
                onClick={() => setLang(code)}
                aria-pressed={lang === code}
                className={`rounded-full px-3.5 py-1.5 text-[11px] font-black uppercase tracking-[0.1em] transition-all ${
                  lang === code ? 'bg-white text-[#0037FF] shadow-[0_4px_12px_rgba(0,55,255,0.25)]' : 'text-white/70'
                }`}
              >
                {code}
              </button>
            ))}
          </div>
        </div>

        <nav
          className="w-full max-w-[34rem] overflow-hidden rounded-[2.15rem] px-1.5 pt-1.5 pb-[calc(env(safe-area-inset-bottom)+0.45rem)]"
          style={GLASS_SHELL_STYLE}
          aria-label="Navigation principale"
        >
          <div className="flex items-center justify-around">
            {dynamicLinks.map((link) => {
              const Icon = link.icon
              const isActive = isActivePath(pathname, link.href)

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? 'page' : undefined}
                  className="relative flex min-w-0 flex-1 flex-col items-center gap-1 rounded-[1.25rem] py-3 text-center transition-transform active:scale-[0.98]"
                >
                  {isActive && (
                    <m.span
                      layoutId="navbar-mobile-pill"
                      layout
                      className="liquid-active-plaque absolute inset-x-1.5 inset-y-1 rounded-[1.2rem]"
                      transition={{ type: 'spring', stiffness: 380, damping: 36 }}
                    />
                  )}
                  <Icon
                    size={23}
                    strokeWidth={isActive ? 2.5 : 2}
                    className={`relative z-10 transition-colors ${isActive ? 'text-white' : 'text-white/70'}`}
                  />
                  <span
                    className={`relative z-10 text-[10px] font-black uppercase tracking-[0.12em] transition-colors ${
                      isActive ? 'text-white' : 'text-white/62'
                    }`}
                  >
                    {link.label}
                  </span>
                </Link>
              )
            })}
          </div>
        </nav>
      </div>
    </LayoutGroup>
  )
}
