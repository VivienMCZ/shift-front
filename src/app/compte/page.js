'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { LogOut, User, Mail, Phone, History, Heart, Trash2, ExternalLink, MapPin, Star, Navigation, ArrowRight } from 'lucide-react'
import { useAuth } from '@/app/context/AuthContext'
import { GLASS_SHELL_STYLE } from '@/app/lib/glass-styles'
import { Translate } from '@/app/calculateur-aides/translation'

export default function ComptePage() {
  const router = useRouter()
  const { user, loading, logout } = useAuth()
  const [searches, setSearches] = useState([])
  const [favorites, setFavorites] = useState([])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth')
    }
  }, [user, loading, router])

  // Récupère l'historique des recherches + les auto-écoles favorites
  useEffect(() => {
    if (!user) return
    const API_URL = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '')

    fetch(`${API_URL}/api/v1/aides/saves`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setSearches(Array.isArray(data) ? data : []))
      .catch(() => setSearches([]))

    fetch(`${API_URL}/api/ecoles/favorites`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setFavorites(Array.isArray(data) ? data : []))
      .catch(() => setFavorites([]))
  }, [user])

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

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F7FC]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4F7FC] px-4 pb-20 pt-28 md:pt-32">
      <div className="mx-auto max-w-4xl space-y-8">
        
        {/* En-tête */}
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-black text-slate-900">
              <Translate id="compte.greeting" />, {user.first_name} ! 👋
            </h1>
            <p className="mt-2 text-slate-600">
              <Translate id="compte.welcome" />
            </p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-red-600 shadow-sm ring-1 ring-inset ring-slate-200 transition-all hover:bg-red-50 hover:ring-red-300"
          >
            <LogOut size={18} />
            <Translate id="compte.logout" />
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Informations personnelles */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="col-span-1 rounded-[2rem] bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-100"
          >
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <User size={20} />
              </div>
              <h2 className="text-lg font-bold text-slate-900"><Translate id="compte.info.title" /></h2>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider"><Translate id="compte.info.fullname" /></label>
                <p className="mt-1 font-medium text-slate-900">{user.first_name} {user.last_name}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider"><Translate id="compte.info.email" /></label>
                <div className="mt-1 flex items-center gap-2 text-slate-900">
                  <Mail size={16} className="text-slate-400" />
                  <span className="font-medium">{user.email}</span>
                </div>
              </div>
              {user.phone && (
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider"><Translate id="compte.info.phone" /></label>
                  <div className="mt-1 flex items-center gap-2 text-slate-900">
                    <Phone size={16} className="text-slate-400" />
                    <span className="font-medium">{user.phone}</span>
                  </div>
                </div>
              )}
              {user.age && (
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider"><Translate id="compte.info.age" /></label>
                  <p className="mt-1 font-medium text-slate-900">{user.age} <Translate id="compte.info.years" /></p>
                </div>
              )}
              {user.statut && (
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider"><Translate id="compte.info.status" /></label>
                  <p className="mt-1 font-medium text-slate-900 capitalize">{user.statut}</p>
                </div>
              )}
              {user.postal_code && (
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider"><Translate id="compte.info.postal_code" /></label>
                  <p className="mt-1 font-medium text-slate-900">{user.postal_code}</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Favoris et Historique (Placeholders) */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="col-span-1 md:col-span-2 space-y-6"
          >
            <div className="rounded-[2rem] bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-100 relative overflow-hidden">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                  <Heart size={20} />
                </div>
                <h2 className="text-lg font-bold text-slate-900"><Translate id="compte.favorites.title" /></h2>
              </div>

              {favorites.length === 0 ? (
                <p className="text-slate-500">
                  <Translate id="compte.favorites.empty" />
                </p>
              ) : (
                <div className="space-y-3">
                  <div className="mb-4">
                    <Link
                      href="/compte/comparateur"
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md active:scale-95"
                    >
                      <ArrowRight size={18} />
                      Comparer mes favoris
                    </Link>
                  </div>
                  {favorites.map((ecole) => (
                    <div
                      key={ecole.id}
                      className="group relative flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 transition-all hover:border-slate-200 hover:bg-white hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-base font-bold text-slate-900">{ecole.name}</h3>
                          <div className="mt-1 flex items-center gap-2 text-xs font-medium text-slate-500">
                            <span className="flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-yellow-700">
                              <Star size={12} className="fill-yellow-500 text-yellow-500" />
                              {ecole.rating > 0 ? ecole.rating.toFixed(1) : '-'}
                            </span>
                            <span className="truncate flex items-center gap-1">
                              <MapPin size={12} />
                              {ecole.address ? ecole.address : ecole.city}
                            </span>
                          </div>
                        </div>
                        {ecole.price != null && (
                          <div className="shrink-0 text-right">
                            <span className="text-xl font-black text-[#0037FF]">{ecole.price}€</span>
                          </div>
                        )}
                      </div>

                      {/* Info / Tags area */}
                      {ecole.tags && ecole.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {ecole.tags.slice(0, 3).map((tag, idx) => (
                            <span key={idx} className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 uppercase tracking-wide">
                              {tag.label ? tag.label : tag}
                            </span>
                          ))}
                          {ecole.tags.length > 3 && (
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                              +{ecole.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="mt-2 flex items-center gap-2 pt-3 border-t border-slate-100/80">
                        <Link
                          href={`/ecoles/${ecole.id}`}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-50 py-2 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100"
                        >
                          <ExternalLink size={14} />
                          Détails
                        </Link>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${ecole.name} ${ecole.address || ecole.city}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-slate-100 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200"
                        >
                          <Navigation size={14} />
                          Itinéraire
                        </a>
                        <button
                          onClick={() => removeFavorite(ecole.id)}
                          className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500 transition-colors hover:bg-red-100 hover:text-red-600"
                          title="Retirer des favoris"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-[2rem] bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-100 relative overflow-hidden">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                  <History size={20} />
                </div>
                <h2 className="text-lg font-bold text-slate-900"><Translate id="compte.history.title" /></h2>
              </div>

              {searches.length === 0 ? (
                <p className="text-slate-500">
                  <Translate id="compte.history.empty" />
                </p>
              ) : (
                <div className="space-y-3">
                  {searches.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold capitalize text-slate-900">
                          {s.profile?.statut
                            ? <Translate id={`calculateur.status.${s.profile.statut}`} />
                            : '—'}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {s.profile?.age ? <>{s.profile.age} <Translate id="compte.info.years" /> · </> : null}
                          {new Date(s.created_at).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-lg font-black text-emerald-600">{s.total_potentiel}€</p>
                        <p className="text-[11px] font-medium text-slate-400">
                          {s.aides?.length || 0} <Translate id="compte.history.aides_count" />
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  )
}
