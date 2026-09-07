import Link from 'next/link'
import { Mail, Phone, User } from 'lucide-react'

const ACCOUNT_ITEMS = [
  {
    icon: User,
    title: 'Espace compte',
    description: 'La page compte n’était pas encore implémentée. Elle existe maintenant pour éviter la navigation cassée.',
  },
  {
    icon: Mail,
    title: 'Support email',
    description: 'support@shift.local',
  },
  {
    icon: Phone,
    title: 'Contact rapide',
    description: '01 80 00 00 00',
  },
]

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto max-w-4xl px-6 py-16 md:px-8 md:py-24">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0047FF]">Compte</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-zinc-900">
          Espace compte et contact
        </h1>
        <p className="mt-4 max-w-2xl text-base text-zinc-500">
          Page de transition propre pour remplacer le 404 actuel du menu.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {ACCOUNT_ITEMS.map(({ icon: Icon, title, description }) => (
            <article key={title} className="glass-panel rounded-3xl p-6">
              <div className="glass-chip flex h-11 w-11 items-center justify-center rounded-2xl bg-white/40 text-zinc-700">
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
            Retour au comparateur
          </Link>
        </div>
      </div>
    </div>
  )
}
