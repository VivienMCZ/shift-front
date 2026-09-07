import Link from 'next/link'
import { BadgeEuro, CircleHelp, MapPin } from 'lucide-react'
import { Translate } from '@/app/calculateur-aides/translation'

const HELP_ITEMS = [
  {
    id: 'financing',
    icon: BadgeEuro,
    title: <Translate id="about.help.financing.title" />,
    description: <Translate id="about.help.financing.desc" />,
  },
  {
    id: 'location',
    icon: MapPin,
    title: <Translate id="about.help.location.title" />,
    description: <Translate id="about.help.location.desc" />,
  },
  {
    id: 'comparison',
    icon: CircleHelp,
    title: <Translate id="about.help.comparison.title" />,
    description: <Translate id="about.help.comparison.desc" />,
  },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto max-w-5xl px-6 py-16 md:px-8 md:py-24">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0047FF]"><Translate id="about.badge" /></p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-zinc-900">
            <Translate id="about.title" />
          </h1>
          <p className="mt-4 text-base text-zinc-500">
            <Translate id="about.subtitle" />
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {HELP_ITEMS.map(({ id, icon: Icon, title, description }) => (
            <article key={id} className="glass-panel rounded-3xl p-6">
              <div className="glass-chip flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0047FF]/10 text-[#0047FF]">
                <Icon size={20} />
              </div>
              <h2 className="mt-4 text-lg font-bold text-zinc-900">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">{description}</p>
            </article>
          ))}
        </div>

        <div className="mt-10">
          <Link
            href="/comparer"
            className="inline-flex items-center rounded-2xl bg-[#0047FF] px-5 py-3 text-sm font-bold text-white shadow-[0_10px_30px_rgba(0,71,255,0.22)] transition-all hover:bg-[#0037dd]"
          >
            <Translate id="about.btn.back" />
          </Link>
        </div>
      </div>
    </div>
  )
}
