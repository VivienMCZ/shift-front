import Link from 'next/link'
import { Translate } from '@/app/calculateur-aides/translation'

export const metadata = {
  title: 'Page introuvable',
  robots: { index: false },
}

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6 pt-28 pb-16">
      <div className="max-w-md text-center">
        <p className="text-6xl font-black text-[#0047FF]">404</p>
        <h1 className="mt-4 text-2xl font-black text-zinc-900"><Translate id="notfound.title" /></h1>
        <p className="mt-2 text-zinc-500"><Translate id="notfound.desc" /></p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center rounded-2xl bg-[#0047FF] px-5 py-3 text-sm font-bold text-white shadow-[0_10px_30px_rgba(0,71,255,0.22)] transition-all hover:bg-[#0037dd]"
        >
          <Translate id="notfound.home" />
        </Link>
      </div>
    </div>
  )
}
