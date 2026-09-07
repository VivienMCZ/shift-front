'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Star, MapPin, ExternalLink, Trash2, Gauge, CarFront, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/app/context/AuthContext'
import { GLASS_SHELL_STYLE } from '@/app/lib/glass-styles'
import { Translate } from '@/app/calculateur-aides/translation'

export default function ComparateurFavorisPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.push('/auth')
      return
    }

    const API_URL = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '')
    fetch(`${API_URL}/api/ecoles/favorites`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setFavorites(data)
      })
      .catch((err) => {
        console.error(err)
        setFavorites([])
      })
      .finally(() => setLoading(false))
  }, [user, authLoading, router])

  const removeFavorite = async (ecoleId) => {
    try {
      const API_URL = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '')
      const res = await fetch(`${API_URL}/api/ecoles/favorites/${ecoleId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      if (res.ok) {
        setFavorites(prev => prev.filter(f => f.id !== ecoleId))
      }
    } catch (err) {
      console.error(err)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F7FC]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4F7FC] pb-24 pt-24 selection:bg-blue-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/compte"
            className="group mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-900"
          >
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
            Retour à mon compte
          </Link>
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-black text-slate-900">
              Comparateur de Favoris
            </h1>
            <p className="text-slate-600">
              Compare tes auto-écoles sauvegardées côte à côte pour faire le meilleur choix.
            </p>
          </div>
        </div>

        {/* Content */}
        {favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[2rem] bg-white p-12 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-100">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-400">
              <Star size={32} />
            </div>
            <h3 className="mb-2 text-lg font-bold text-slate-900">Aucun favori pour le moment</h3>
            <p className="mb-6 max-w-md text-sm text-slate-500">
              Explore la carte et ajoute des auto-écoles à tes favoris pour pouvoir les comparer ici.
            </p>
            <Link
              href="/comparer"
              className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md"
            >
              Rechercher une auto-école
            </Link>
          </div>
        ) : (
          <div className="rounded-[2rem] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th scope="col" className="p-6 font-semibold text-slate-900 w-48 sticky left-0 bg-slate-50/95 backdrop-blur z-10 border-r border-slate-100">
                      Critères
                    </th>
                    {favorites.map((ecole) => (
                      <th key={ecole.id} scope="col" className="min-w-[280px] p-6 align-top">
                        <div className="flex flex-col gap-3">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-lg font-bold text-slate-900 leading-tight">{ecole.name}</h3>
                            <button
                              onClick={() => removeFavorite(ecole.id)}
                              className="shrink-0 text-slate-400 hover:text-red-500 transition-colors"
                              title="Retirer"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {ecole.tags && ecole.tags.slice(0, 3).map((tag, idx) => (
                              <span key={idx} className="rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600 uppercase tracking-wide shadow-sm">
                                {tag.label ? tag.label : tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  
                  {/* Prix */}
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-6 font-medium text-slate-900 sticky left-0 bg-white/95 backdrop-blur z-10 border-r border-slate-100 group-hover:bg-slate-50/95">
                      <div className="flex items-center gap-2">
                        <div className="rounded bg-blue-50 p-1 text-blue-600">
                          <span className="font-bold">€</span>
                        </div>
                        Prix Total
                      </div>
                    </td>
                    {favorites.map((ecole) => (
                      <td key={ecole.id} className="p-6">
                        {ecole.price != null ? (
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-[#0037FF]">{ecole.price}€</span>
                            {ecole.price_label && <span className="text-xs text-slate-500">({ecole.price_label})</span>}
                          </div>
                        ) : (
                          <span className="text-slate-400">Non communiqué</span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Note */}
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-6 font-medium text-slate-900 sticky left-0 bg-white/95 backdrop-blur z-10 border-r border-slate-100 group-hover:bg-slate-50/95">
                      <div className="flex items-center gap-2">
                        <div className="rounded bg-yellow-50 p-1 text-yellow-600">
                          <Star size={16} />
                        </div>
                        Note
                      </div>
                    </td>
                    {favorites.map((ecole) => (
                      <td key={ecole.id} className="p-6">
                        <div className="flex items-center gap-2">
                          <Star size={18} className={ecole.rating > 0 ? "fill-yellow-400 text-yellow-400" : "text-slate-300"} />
                          <span className="font-bold text-slate-900">{ecole.rating > 0 ? ecole.rating.toFixed(1) : '-'}</span>
                          <span className="text-xs text-slate-500">/5</span>
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Localisation */}
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-6 font-medium text-slate-900 sticky left-0 bg-white/95 backdrop-blur z-10 border-r border-slate-100 group-hover:bg-slate-50/95">
                      <div className="flex items-center gap-2">
                        <div className="rounded bg-emerald-50 p-1 text-emerald-600">
                          <MapPin size={16} />
                        </div>
                        Localisation
                      </div>
                    </td>
                    {favorites.map((ecole) => (
                      <td key={ecole.id} className="p-6">
                        <p className="font-medium text-slate-900">{ecole.city}</p>
                        {ecole.address && <p className="mt-1 text-xs text-slate-500 leading-relaxed max-w-[200px]">{ecole.address}</p>}
                      </td>
                    ))}
                  </tr>

                  {/* Rapidité */}
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-6 font-medium text-slate-900 sticky left-0 bg-white/95 backdrop-blur z-10 border-r border-slate-100 group-hover:bg-slate-50/95">
                      <div className="flex items-center gap-2">
                        <div className="rounded bg-purple-50 p-1 text-purple-600">
                          <Gauge size={16} />
                        </div>
                        Rapidité
                      </div>
                    </td>
                    {favorites.map((ecole) => (
                      <td key={ecole.id} className="p-6">
                        {ecole.speed_level ? (
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize
                              ${ecole.speed_level === 'rapide' ? 'bg-green-100 text-green-700' : ''}
                              ${ecole.speed_level === 'moyen' ? 'bg-orange-100 text-orange-700' : ''}
                              ${ecole.speed_level === 'faible' ? 'bg-red-100 text-red-700' : ''}
                            `}>
                              {ecole.speed_level}
                            </span>
                            {ecole.speed_label && <span className="text-xs text-slate-500">({ecole.speed_label})</span>}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Actions */}
                  <tr className="bg-slate-50/30">
                    <td className="p-6 sticky left-0 bg-slate-50/95 backdrop-blur z-10 border-r border-slate-100">
                      
                    </td>
                    {favorites.map((ecole) => (
                      <td key={ecole.id} className="p-6">
                        <Link
                          href={`/ecoles/${ecole.id}`}
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 transition-all hover:bg-slate-50 hover:ring-slate-300"
                        >
                          Voir la fiche
                          <ExternalLink size={16} className="text-slate-400" />
                        </Link>
                      </td>
                    ))}
                  </tr>

                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
