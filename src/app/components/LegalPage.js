import { DERNIERE_MISE_A_JOUR } from '@/app/lib/site-info'

/**
 * Gabarit des pages légales (mentions, confidentialité, CGU).
 *
 * Server Component : ces pages ne portent aucun état, elles doivent s'afficher
 * — et s'indexer — sans JavaScript. Leur texte est en français seulement : c'est
 * la version qui fait foi en droit français.
 */
export default function LegalPage({ badge, title, children }) {
  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto max-w-3xl px-6 pb-16 pt-28 md:px-8 md:pt-32">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0047FF]">{badge}</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-zinc-900">{title}</h1>
        <p className="mt-3 text-sm text-zinc-500">Dernière mise à jour : {DERNIERE_MISE_A_JOUR}</p>

        <div className="glass-panel mt-10 rounded-3xl p-6 text-sm leading-relaxed text-zinc-600 md:p-10 [&_a]:font-semibold [&_a]:text-[#0047FF] [&_a:hover]:underline [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-zinc-900 [&_h2:first-child]:mt-0 [&_h3]:mt-6 [&_h3]:font-bold [&_h3]:text-zinc-900 [&_li]:mt-1 [&_p]:mt-3 [&_strong]:text-zinc-800 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">
          {children}
        </div>
      </div>
    </div>
  )
}

/** Ligne « libellé : valeur » d'un bloc d'identité. */
export function InfoLine({ label, children }) {
  return (
    <li>
      <strong>{label} :</strong> {children}
    </li>
  )
}
