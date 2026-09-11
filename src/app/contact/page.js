import Link from 'next/link'
import { Mail, ShieldCheck } from 'lucide-react'
import { Translate } from '@/app/calculateur-aides/translation'
import { EDITEUR } from '@/app/lib/site-info'

export const metadata = {
  title: 'Contact',
  description: 'Contacter l’équipe Shift.',
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto max-w-4xl px-6 pb-16 pt-28 md:px-8 md:pt-32">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0047FF]"><Translate id="contact.badge" /></p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-zinc-900">
          <Translate id="contact.title" />
        </h1>
        <p className="mt-4 max-w-2xl text-base text-zinc-500">
          <Translate id="contact.subtitle" />
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <article className="glass-panel rounded-3xl p-6">
            <div className="glass-chip flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0047FF]/10 text-[#0047FF]">
              <Mail size={20} />
            </div>
            <h2 className="mt-4 text-lg font-bold text-zinc-900"><Translate id="contact.email.title" /></h2>
            <p className="mt-2 text-sm font-semibold text-zinc-700">{EDITEUR.email}</p>
          </article>

          <article className="glass-panel rounded-3xl p-6">
            <div className="glass-chip flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
              <ShieldCheck size={20} />
            </div>
            <h2 className="mt-4 text-lg font-bold text-zinc-900"><Translate id="contact.privacy.title" /></h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-500"><Translate id="contact.privacy.desc" /></p>
            <Link href="/confidentialite" className="mt-3 inline-block text-sm font-semibold text-[#0047FF] hover:underline">
              <Translate id="footer.privacy" /> →
            </Link>
          </article>
        </div>

        <div className="mt-10">
          <Link
            href="/comparer"
            className="inline-flex items-center rounded-2xl bg-[#0047FF] px-5 py-3 text-sm font-bold text-white shadow-[0_10px_30px_rgba(0,71,255,0.22)] transition-all hover:bg-[#0037dd]"
          >
            <Translate id="contact.back" />
          </Link>
        </div>
      </div>
    </div>
  )
}
