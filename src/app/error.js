'use client' // Les error boundaries sont des Client Components.

import { Translate } from '@/app/calculateur-aides/translation'

/**
 * Remplace le segment qui a planté, sous la barre de navigation qui reste en
 * place. Rien n'est journalisé ici : l'erreur peut porter des données de la
 * page, et il n'y a pas encore de service de suivi d'erreurs où l'envoyer.
 */
export default function Error({ retry }) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6 pt-28 pb-16">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-black text-zinc-900"><Translate id="error.title" /></h1>
        <p className="mt-2 text-zinc-500"><Translate id="error.desc" /></p>
        <button
          type="button"
          onClick={() => retry()}
          className="mt-8 inline-flex items-center rounded-2xl bg-[#0047FF] px-5 py-3 text-sm font-bold text-white shadow-[0_10px_30px_rgba(0,71,255,0.22)] transition-all hover:bg-[#0037dd]"
        >
          <Translate id="error.retry" />
        </button>
      </div>
    </div>
  )
}
