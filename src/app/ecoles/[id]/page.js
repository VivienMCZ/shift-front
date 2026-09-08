'use client'

import { useEffect, useState, use } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  MapPin,
  Star,
  BadgeEuro,
  Gauge,
  CarFront,
  Heart,
  Share2,
  Navigation,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { m } from 'framer-motion'
import { useAuth } from '@/app/context/AuthContext'
import { Translate } from '@/app/calculateur-aides/translation'

const API_URL = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '')

export default function EcoleDetailsPage({ params }) {
  // Unwrap params using React.use() as recommended in Next.js 15+ for async params
  const resolvedParams = use(params)
  const id = resolvedParams.id

  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  
  const [ecole, setEcole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const [isFavorite, setIsFavorite] = useState(false)
  const [isLiking, setIsLiking] = useState(false)

  // Fetch ecole data
  useEffect(() => {
    let active = true

    const fetchEcole = async () => {
      try {
        const res = await fetch(`${API_URL}/api/ecoles/${id}`)
        if (!res.ok) {
          if (res.status === 404) throw new Error("Auto-école introuvable")
          throw new Error("Erreur lors de la récupération des données")
        }
        const data = await res.json()
        if (active) setEcole(data)
      } catch (err) {
        if (active) setError(err.message)
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchEcole()
    
    return () => { active = false }
  }, [id])

  // Check favorite status if user is logged in
  useEffect(() => {
    if (!user || !ecole) return
    
    let active = true
    fetch(`${API_URL}/api/ecoles/favorites`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : []))
      .then((list) => {
        if (active && Array.isArray(list)) {
          setIsFavorite(list.some((e) => e.id === ecole.id))
        }
      })
      .catch(() => {})
      
    return () => { active = false }
  }, [user, ecole])

  const toggleFavorite = async () => {
    if (!user) {
      router.push('/auth')
      return
    }

    setIsLiking(true)
    const wasFavorite = isFavorite
    setIsFavorite(!wasFavorite)

    try {
      if (wasFavorite) {
        await fetch(`${API_URL}/api/ecoles/favorites/${ecole.id}`, {
          method: 'DELETE',
          credentials: 'include',
        })
      } else {
        await fetch(`${API_URL}/api/ecoles/favorites`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ auto_ecole_id: ecole.id }),
        })
      }
    } catch {
      // Revert on error
      setIsFavorite(wasFavorite)
    } finally {
      setIsLiking(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-transparent">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#0037FF]/20 border-t-[#0037FF]" />
          <p className="text-sm font-black uppercase tracking-widest text-[#0037FF]/60 animate-pulse">Chargement...</p>
        </div>
      </div>
    )
  }

  if (error || !ecole) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-transparent px-4">
        <div className="glass-panel-strong max-w-md rounded-[2rem] p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-500">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Oups !</h2>
          <p className="text-slate-600 mb-8">{error || "Une erreur inattendue s'est produite."}</p>
          <button
            onClick={() => router.back()}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#0037FF] px-6 py-4 text-sm font-black uppercase tracking-wider text-white shadow-lg transition-transform hover:scale-[1.02]"
          >
            <ArrowLeft size={18} /> Retour
          </button>
        </div>
      </div>
    )
  }

  // Override distance if passed in URL
  const displayDistance = searchParams.get('distance') ? parseFloat(searchParams.get('distance')) : ecole.distance;

  return (
    <div className="min-h-[100dvh] bg-transparent pb-24 pt-20 md:pt-32 px-4 md:px-8">
      <div className="mx-auto max-w-5xl">
        
        {/* Breadcrumb & Navigation */}
        <div className="mb-6 flex items-center justify-between">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 rounded-full bg-white/40 px-4 py-2 text-sm font-bold text-slate-700 backdrop-blur-md transition-all hover:bg-white/60 hover:pr-5"
          >
            <ArrowLeft size={16} /> Retour
          </button>
          
          <div className="flex gap-2">
            <button 
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: ecole.name,
                    url: window.location.href
                  }).catch(console.error);
                }
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/40 text-slate-700 backdrop-blur-md transition-all hover:bg-white/80"
              aria-label="Partager"
            >
              <Share2 size={18} />
            </button>
            <button 
              onClick={toggleFavorite}
              disabled={isLiking}
              className={`flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md transition-all hover:scale-105 ${
                isFavorite 
                  ? 'bg-rose-100 text-rose-500 shadow-[0_4px_12px_rgba(244,63,94,0.25)]' 
                  : 'bg-white/40 text-slate-600 hover:bg-white/80'
              }`}
              aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            >
              <Heart size={18} className={isFavorite ? 'fill-current' : ''} />
            </button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          
          {/* Main Info Column */}
          <div className="md:col-span-2 flex flex-col gap-6">
            
            {/* Header Card */}
            <m.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel-strong overflow-hidden rounded-[2rem] p-6 sm:p-8"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none mb-3">
                    {ecole.name}
                  </h1>
                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin size={16} className="text-[#0037FF]" />
                    <span className="font-medium">{ecole.address}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-1.5 rounded-2xl bg-yellow-400/10 px-4 py-2 text-yellow-600 shrink-0 self-start">
                  <Star size={20} className="fill-yellow-400 text-yellow-400" />
                  <span className="text-xl font-black">{ecole.rating?.toFixed(1) || 'N/A'}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {ecole.permis_type && (
                  <span className="liquid-glass-chip flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#0037FF]">
                    <CarFront size={14} /> Permis {ecole.permis_type}
                  </span>
                )}
                {ecole.tags && ecole.tags.map((tag, idx) => (
                  <span key={idx} className="liquid-glass-chip rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    {tag.label}
                  </span>
                ))}
              </div>
            </m.div>

            {/* Pricing & Speed Highlights */}
            <div className="grid grid-cols-2 gap-4 sm:gap-6">
              <m.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-panel flex flex-col items-center justify-center rounded-[2rem] p-6 text-center"
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-500">
                  <BadgeEuro size={24} />
                </div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Tarif estimé</p>
                <p className="text-2xl font-black text-slate-900">
                  {ecole.price ? `${ecole.price} €` : 'N/A'}
                </p>
                {ecole.price_label && (
                  <span className="mt-2 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-500">
                    {ecole.price_label}
                  </span>
                )}
              </m.div>

              <m.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="glass-panel flex flex-col items-center justify-center rounded-[2rem] p-6 text-center"
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#0037FF]/10 text-[#0037FF]">
                  <Gauge size={24} />
                </div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Passage</p>
                <p className="text-2xl font-black text-slate-900 capitalize">
                  {ecole.speed_level || 'N/A'}
                </p>
                {ecole.speed_label && (
                  <span className="mt-2 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-500">
                    {ecole.speed_label}
                  </span>
                )}
              </m.div>
            </div>
            
            {/* Additional Features/Description block (Placeholder for future data) */}
            <m.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-panel rounded-[2rem] p-6 sm:p-8"
            >
              <h3 className="mb-4 text-lg font-black text-slate-900">Pourquoi choisir cette auto-école ?</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-[#0037FF] shrink-0 mt-0.5" />
                  <span className="text-sm font-medium text-slate-600">Évaluation très positive de la part de nos élèves.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-[#0037FF] shrink-0 mt-0.5" />
                  <span className="text-sm font-medium text-slate-600">Préparation optimale à l'examen avec des formateurs diplômés.</span>
                </li>
                {ecole.price_label === 'pas_cher' && (
                  <li className="flex items-start gap-3">
                    <CheckCircle2 size={20} className="text-[#0037FF] shrink-0 mt-0.5" />
                    <span className="text-sm font-medium text-slate-600">Des tarifs parmi les plus compétitifs de votre secteur.</span>
                  </li>
                )}
              </ul>
            </m.div>

          </div>
          
          {/* Sidebar / CTA Column */}
          <div className="flex flex-col gap-6">
            <m.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
              className="glass-panel-strong sticky top-24 rounded-[2rem] p-6"
            >
              <div className="mb-6 aspect-square w-full rounded-2xl bg-slate-200 overflow-hidden relative">
                {/* Dummy map or image placeholder */}
                <div className="absolute inset-0 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=Paris&zoom=14&size=400x400&maptype=roadmap&sensor=false')] opacity-20 bg-cover bg-center grayscale" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Navigation size={48} className="text-[#0037FF]/40" />
                </div>
              </div>

              <div className="mb-6 space-y-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Localisation</p>
                  <p className="text-sm font-medium text-slate-700">{ecole.address}</p>
                </div>
                {displayDistance != null && !isNaN(displayDistance) && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Distance</p>
                    <p className="text-sm font-medium text-[#0037FF]">À {displayDistance.toFixed(1)} km de chez vous</p>
                  </div>
                )}
              </div>

              <a
                href={`https://www.google.com/maps/search/?api=1&query=${ecole.lat},${ecole.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#0037FF] px-6 py-4 text-sm font-black uppercase tracking-wider text-white shadow-[0_8px_20px_rgba(0,55,255,0.25)] transition-transform hover:scale-105"
              >
                <Navigation size={18} /> Voir sur la carte
              </a>
            </m.div>
          </div>

        </div>
      </div>
    </div>
  )
}
