'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  AlertCircle,
  ArrowRight,
  ArrowUpDown,
  BadgeEuro,
  CarFront,
  CheckCircle2,
  Gauge,
  Heart,
  MapPin,
  Navigation,
  SlidersHorizontal,
  Sparkles,
  Star,
  Target,
  X,
} from 'lucide-react'
import LocationSearchBar from '@/app/components/LocationSearchBar'
import { useAuth } from '@/app/context/AuthContext'
import { useIsDesktop } from '@/app/hooks/useIsDesktop'
import { useLocation } from '@/app/context/LocationContext'
import { GLASS_SHELL_STYLE } from '@/app/lib/glass-styles'
import {
  compactPlaceLabel,
  formatDistance,
  formatPrice,
  getNumberParam,
  hasUsableLocation,
  localMatchScore,
  matchLabelKey,
  matchReasonKeys,
  scoreTone,
} from '@/app/lib/comparer-utils'
import { Translate } from '@/app/calculateur-aides/translation'

const API_URL = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '')

const MIN_BUDGET = 500
const MAX_BUDGET = 2000
const BUDGET_STEP = 50
const DEFAULT_RADIUS = 10
const DEFAULT_PERMIT = 'all'
const DEFAULT_BUDGET = [MIN_BUDGET, MAX_BUDGET]
const REQUEST_DEBOUNCE_MS = 300
/** Doit rester ≤ MAX_PAGE_SIZE côté backend (100). Son défaut est le même. */
const PAGE_SIZE = 24

const PERMIT_OPTIONS = [
  { id: 'all', label: <Translate id="comparer.permit.all" /> },
  { id: 'voiture', label: <Translate id="comparer.permit.voiture" /> },
  { id: 'moto', label: <Translate id="comparer.permit.moto" /> },
  { id: 'poids_lourd', label: <Translate id="comparer.permit.poids_lourd" /> },
]

const PERMIT_LABELS = Object.fromEntries(PERMIT_OPTIONS.map((option) => [option.id, option.label]))

const PRICE_SORT_OPTIONS = [
  { id: null, label: <Translate id="comparer.sort.score" /> },
  { id: 'asc', label: <Translate id="comparer.sort.asc" /> },
  { id: 'desc', label: <Translate id="comparer.sort.desc" /> },
]

const SCORE_OPTIONS = [
  { id: null, label: <Translate id="comparer.score.all" />, helper: <Translate id="comparer.score.all.helper" /> },
  { id: 70, label: '70+', helper: <Translate id="comparer.score.70.helper" /> },
  { id: 80, label: '80+', helper: <Translate id="comparer.score.80.helper" /> },
  { id: 90, label: '90+', helper: <Translate id="comparer.score.90.helper" /> },
]

const GEAR_OPTIONS = [
  { id: null, label: <Translate id="comparer.gear.all" /> },
  { id: 'auto', label: <Translate id="comparer.gear.auto" /> },
  { id: 'manuelle', label: <Translate id="comparer.gear.manuelle" /> },
]

const RADIUS_PRESETS = [5, 10, 20, 50]

const TAG_STYLES = {
  blue: 'bg-[#0047FF]/10 text-[#0037FF] ring-[#0047FF]/12',
  green: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  orange: 'bg-amber-100 text-amber-700 ring-amber-200',
  red: 'bg-rose-100 text-rose-700 ring-rose-200',
}

const REASON_TRANSLATIONS = {
  'Délai rapide': <Translate id="comparer.reasons.speed_fast" />,
  'Délai maîtrisé': <Translate id="comparer.reasons.speed_medium" />,
  'Très bien notée': <Translate id="comparer.reasons.rating_excellent" />,
  'Bonne note': <Translate id="comparer.reasons.rating_good" />,
  'Prix compétitif': <Translate id="comparer.reasons.price_competitive" />,
  'Budget plus élevé': <Translate id="comparer.reasons.price_high" />,
  'Très proche': <Translate id="comparer.reasons.distance_very_close" />,
  'Proche': <Translate id="comparer.reasons.distance_close" />,
}

const MATCH_LABEL_TRANSLATIONS = {
  '90+ Excellent': <Translate id="comparer.match.90" />,
  '80+ Très bon': <Translate id="comparer.match.80" />,
  '70+ Bon': <Translate id="comparer.match.70" />,
  'À comparer': <Translate id="comparer.match.default" />,
}

function matchLabel(score) {
  return <Translate id={matchLabelKey(score)} />
}

function enrichEcole(ecole, radius, budgetRange) {
  if (typeof ecole.match_score === 'number') return ecole

  const score = localMatchScore(ecole, radius, budgetRange)
  return {
    ...ecole,
    match_score: score,
    match_label: matchLabel(score),
    match_reasons: matchReasonKeys(ecole).map((key) => <Translate key={key} id={key} />),
  }
}

function useBodyLock(open) {
  useEffect(() => {
    if (!open) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])
}

function EcoleCardSkeleton({ mode = 'desktop' }) {
  const isMobile = mode === 'mobile'

  return (
    <div className={`glass-panel-strong-flat overflow-hidden rounded-[1.75rem] ${isMobile ? '' : 'min-h-[24rem]'}`}>
      <div className={`${isMobile ? 'h-44' : 'h-40'} w-full animate-pulse bg-slate-200`} />
      <div className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="h-5 w-40 animate-pulse rounded-full bg-slate-200" />
            <div className="h-4 w-32 animate-pulse rounded-full bg-slate-100" />
          </div>
          <div className="h-14 w-16 animate-pulse rounded-2xl bg-slate-100" />
        </div>
        <div className="flex gap-2">
          <div className="h-6 w-20 animate-pulse rounded-full bg-slate-100" />
          <div className="h-6 w-24 animate-pulse rounded-full bg-slate-100" />
        </div>
        <div className="h-12 animate-pulse rounded-2xl bg-slate-200" />
      </div>
    </div>
  )
}

function EcoleCard({ ecole, mode = 'desktop', isFavorite = false, onToggleFavorite, canFavorite = false }) {
  const isMobile = mode === 'mobile'
  const distanceLabel = formatDistance(ecole.distance)
  const matchReasons = Array.isArray(ecole.match_reasons) ? ecole.match_reasons.slice(0, 3) : []
  const score = typeof ecole.match_score === 'number' ? ecole.match_score : localMatchScore(ecole, DEFAULT_RADIUS, DEFAULT_BUDGET)
  const details = [ecole.city, distanceLabel].filter(Boolean)

  return (
    /* `backdrop-blur-xl` retiré : derrière la carte il n'y a que le dégradé du
       `body`, déjà lisse — le flouter redonne le même dégradé, pour une passe
       de composition par frame et par carte. `bg-white/78` laisse voir le fond
       à l'identique.

       `transition-all` remplacé par la liste explicite : il animait aussi le
       fond, la bordure et le filtre, tous repeints pendant tout le survol. */
    <article className="group render-when-visible flex h-full min-w-0 flex-col overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/78 shadow-[0_24px_70px_rgba(15,23,42,0.14)] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_34px_90px_rgba(15,23,42,0.2)]">
      <div className={`relative overflow-hidden bg-slate-200 ${isMobile ? 'h-44' : 'h-40'}`}>
        {ecole.image_url ? (
          /* `fill` : le parent porte déjà une hauteur fixe et `position:relative`.
             `sizes` décrit la largeur réellement occupée à chaque palier de la
             grille — sans lui, Next servirait la pleine largeur du viewport pour
             une vignette d'un quart d'écran.

             Le chargement reste paresseux (défaut de next/image) : la page monte
             l'arbre mobile ET l'arbre desktop, sans quoi chaque visuel serait
             téléchargé deux fois, y compris dans l'arbre masqué par
             `display: none` que personne ne verra. */
          <Image
            src={ecole.image_url}
            alt={ecole.name}
            fill
            sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, (max-width: 1535px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.035]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-slate-200 via-white to-blue-50">
            <CarFront size={38} className="text-slate-400" />
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-slate-950/18 via-transparent to-slate-950/10" />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3.5">
          <div className={`rounded-2xl border backdrop-blur-md px-3 py-2 ${scoreTone(score)}`}>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-90"><Translate id="comparer.card.score" /></p>
            <p className="text-2xl font-black leading-none">{score}</p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {canFavorite && (
              <button
                type="button"
                aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                onClick={() => onToggleFavorite?.(ecole.id)}
                className="liquid-glass-chip flex h-8 w-8 items-center justify-center rounded-full transition-transform active:scale-90"
              >
                <Heart size={16} className={isFavorite ? 'fill-rose-500 text-rose-500' : 'text-white'} />
              </button>
            )}
            <div className="liquid-glass-chip flex items-center gap-1 rounded-full px-2.5 py-1.5">
              <Star size={14} className="fill-amber-400 text-amber-400" />
              <span className="text-sm font-black text-white/90">{ecole.rating}</span>
            </div>
          </div>
        </div>
      </div>

      <div className={`${isMobile ? 'p-4' : 'p-5'} flex min-w-0 flex-1 flex-col`}>
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <div className="min-w-0">
            <h3 className={`${isMobile ? 'text-[1.55rem]' : 'text-[1.35rem]'} break-words font-black leading-[0.98] tracking-tight text-slate-950`}>
              {ecole.name}
            </h3>
            <div className="mt-2 flex min-w-0 items-start gap-2 text-sm font-medium text-slate-500">
              <MapPin size={14} className="mt-0.5 shrink-0" />
              <div className="flex min-w-0 flex-wrap gap-x-2 gap-y-1">
                {details.map((detail, index) => (
                  <span key={`${ecole.id}-${detail}`} className="inline-flex min-w-0 items-center gap-2">
                    {index > 0 && <span className="text-slate-300">•</span>}
                    <span className="truncate">{detail}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Variante `-flat` : cet encart est posé sur le fond blanc de la
              carte, le filtre n'aurait rien à flouter. Idem plus bas. */}
          <div className="glass-panel-soft-flat min-w-[5.15rem] max-w-[5.7rem] rounded-2xl px-2.5 py-2 text-right">
            <p className="text-[1.28rem] font-black leading-none text-[#0037FF]">
              {ecole.price != null ? `${ecole.price}€` : <Translate id="comparer.card.quote" />}
            </p>
            <p className="mt-1 line-clamp-2 text-[8px] font-black uppercase tracking-[0.14em] text-slate-400">
              {ecole.price_label || <Translate id="comparer.card.package" />}
            </p>
          </div>
        </div>

        <div className="glass-panel-soft-flat mt-3 rounded-2xl px-3 py-2">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#0037FF]">
            {typeof ecole.match_label === 'string' && MATCH_LABEL_TRANSLATIONS[ecole.match_label]
              ? MATCH_LABEL_TRANSLATIONS[ecole.match_label]
              : (ecole.match_label || matchLabel(score))}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {matchReasons.length > 0 ? matchReasons.map((reason, idx) => (
              <span key={idx} className="inline-flex items-center gap-1 rounded-full bg-white/74 px-2 py-1 text-[10px] font-bold text-slate-600 ring-1 ring-white/80">
                <CheckCircle2 size={11} className="text-emerald-500" />
                {typeof reason === 'string' && REASON_TRANSLATIONS[reason] ? REASON_TRANSLATIONS[reason] : reason}
              </span>
            )) : (
              <span className="text-xs font-semibold text-slate-500"><Translate id="comparer.card.calculated" /></span>
            )}
          </div>
        </div>

        <div className="mt-3 flex min-w-0 flex-wrap gap-2">
          {(ecole.tags ?? []).slice(0, 2).map((tag) => (
            <span
              key={tag.label}
              className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] ring-1 ${TAG_STYLES[tag.color] ?? TAG_STYLES.blue}`}
            >
              {tag.label}
            </span>
          ))}

          {ecole.permis_type && (
            <span className="liquid-glass-chip-flat rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white/80">
              {PERMIT_LABELS[ecole.permis_type] ?? ecole.permis_type}
            </span>
          )}
        </div>

        <div className="mt-auto pt-4">
          <Link
            href={`/ecoles/${ecole.id}${ecole.distance != null ? `?distance=${ecole.distance}` : ''}`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0037FF] px-4 py-3.5 text-sm font-black text-white shadow-[0_14px_34px_rgba(0,55,255,0.28)] transition-all hover:bg-[#002fd4] active:scale-[0.99]"
          >
            <Translate id="comparer.card.details" />
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </article>
  )
}

function FilterSection({ icon: Icon, title, hint, children, mode = 'desktop' }) {
  const isMobile = mode === 'mobile'

  return (
    <section className={isMobile ? 'rounded-[1.5rem] border border-white/14 bg-white/8 p-4' : 'space-y-3.5'}>
      <div className="flex items-start gap-3">
        <div className={`liquid-glass-chip flex shrink-0 items-center justify-center text-white/78 ${isMobile ? 'h-10 w-10 rounded-2xl' : 'h-9 w-9 rounded-[1.1rem]'}`}>
          <Icon size={16} />
        </div>
        <div className="min-w-0">
          <p className={`${isMobile ? 'text-sm' : 'text-[15px]'} font-black text-white`}>{title}</p>
          {hint && <p className={`${isMobile ? 'text-sm' : 'text-[13px]'} mt-0.5 leading-snug text-white/58`}>{hint}</p>}
        </div>
      </div>
      <div className={isMobile ? 'mt-4 space-y-3' : 'space-y-2.5'}>{children}</div>
    </section>
  )
}

function SegmentedButton({ active, children, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`rounded-full px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.14em] transition-all ${
        active
          ? 'bg-[#0037FF] text-white shadow-[0_10px_24px_rgba(0,55,255,0.32)]'
          : 'liquid-glass-chip text-white/74 hover:bg-white/12'
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

function FilterControls({
  location,
  radius,
  setRadius,
  permitFilter,
  setPermitFilter,
  budgetRange,
  setBudgetRange,
  priceSort,
  setPriceSort,
  minScore,
  setMinScore,
  gearFilter,
  setGearFilter,
  onReset,
  onApply,
  hasReset,
  resultCount,
  loading,
  mode = 'desktop',
}) {
  const isMobile = mode === 'mobile'
  const locationActive = hasUsableLocation(location)
  const optionButtonClass = isMobile ? 'min-w-[7rem] flex-1' : 'min-w-[7rem]'

  return (
    <div className={`flex min-w-0 flex-col ${isMobile ? 'gap-4' : 'gap-6'}`}>
      <FilterSection
        icon={Target}
        title={<Translate id="comparer.filter.score.title" />}
        hint={<Translate id="comparer.filter.score.hint" />}
        mode={mode}
      >
        <div className="grid grid-cols-2 gap-2">
          {SCORE_OPTIONS.map((option, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setMinScore(option.id)}
              className={`rounded-2xl border px-3 py-3 text-left transition-all ${
                minScore === option.id
                  ? 'border-[#75A7FF]/45 bg-[#0037FF] text-white shadow-[0_14px_30px_rgba(0,55,255,0.28)]'
                  : 'border-white/15 bg-white/10 text-white/76 shadow-[0_10px_24px_rgba(16,20,38,0.08)] hover:bg-white/14'
              }`}
            >
              <p className="text-sm font-black">{option.label}</p>
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.12em] opacity-70">{option.helper}</p>
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection
        icon={Navigation}
        title={<Translate id="comparer.filter.radius.title" />}
        hint={locationActive ? <><Translate id="comparer.filter.radius.hint_active" /> {compactPlaceLabel(location)}.</> : <Translate id="comparer.filter.radius.hint_inactive" />}
        mode={mode}
      >
        <div className={`space-y-4 ${!locationActive ? 'opacity-50' : ''}`}>
          <div className="flex items-center justify-between gap-3">
            <span className="rounded-full bg-[#0037FF] px-3 py-1.5 text-sm font-black text-white shadow-[0_10px_22px_rgba(0,55,255,0.24)]">{radius} km</span>
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-white/42">{locationActive ? <Translate id="comparer.filter.radius.max" /> : <Translate id="comparer.filter.radius.inactive" />}</span>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {RADIUS_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                disabled={!locationActive}
                onClick={() => setRadius(preset)}
                className={`rounded-full px-2 py-2 text-xs font-black transition-all disabled:cursor-not-allowed ${
                  radius === preset && locationActive
                    ? 'bg-[#0037FF] text-white shadow-[0_10px_22px_rgba(0,55,255,0.24)]'
                    : 'bg-white/10 text-white/72 shadow-[0_10px_22px_rgba(16,20,38,0.08)] ring-1 ring-white/15 hover:bg-white/14'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          <input
            type="range"
            min={5}
            max={50}
            step={1}
            disabled={!locationActive}
            value={radius}
            onChange={(event) => setRadius(Number(event.target.value))}
            className="w-full accent-[#0037FF] disabled:cursor-not-allowed"
          />
          <div className="flex justify-between text-xs font-semibold text-white/42">
            <span>5 km</span>
            <span>50 km</span>
          </div>
        </div>
      </FilterSection>

      <FilterSection
        icon={BadgeEuro}
        title={<Translate id="comparer.filter.budget.title" />}
        hint={<Translate id="comparer.filter.budget.hint" />}
        mode={mode}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <span className="rounded-full bg-[#0037FF] px-3 py-1.5 text-sm font-black text-white shadow-[0_10px_22px_rgba(0,55,255,0.24)]">
              {formatPrice(budgetRange[0])}
            </span>
            <span className="rounded-full bg-[#0037FF] px-3 py-1.5 text-sm font-black text-white shadow-[0_10px_22px_rgba(0,55,255,0.24)]">
              {formatPrice(budgetRange[1])}
            </span>
          </div>

          <div className="space-y-2">
            <input
              type="range"
              min={MIN_BUDGET}
              max={budgetRange[1] - BUDGET_STEP}
              step={BUDGET_STEP}
              value={budgetRange[0]}
              onChange={(event) => {
                const nextMin = Number(event.target.value)
                setBudgetRange((current) => [Math.min(nextMin, current[1] - BUDGET_STEP), current[1]])
              }}
              className="w-full accent-[#0037FF]"
            />
            <input
              type="range"
              min={budgetRange[0] + BUDGET_STEP}
              max={MAX_BUDGET}
              step={BUDGET_STEP}
              value={budgetRange[1]}
              onChange={(event) => {
                const nextMax = Number(event.target.value)
                setBudgetRange((current) => [current[0], Math.max(nextMax, current[0] + BUDGET_STEP)])
              }}
              className="w-full accent-[#0037FF]"
            />
          </div>
        </div>
      </FilterSection>

      <FilterSection
        icon={CarFront}
        title={<Translate id="comparer.filter.permit.title" />}
        hint={<Translate id="comparer.filter.permit.hint" />}
        mode={mode}
      >
        <div className="flex flex-col gap-2">
          {PERMIT_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setPermitFilter(option.id)}
              className={`rounded-2xl border px-4 py-2.5 text-left text-sm font-bold transition-all ${
                permitFilter === option.id
                  ? 'border-[#75A7FF]/45 bg-[#0037FF] text-white shadow-[0_14px_30px_rgba(0,55,255,0.28)]'
                  : 'border-white/15 bg-white/10 text-white/76 shadow-[0_10px_24px_rgba(16,20,38,0.08)] hover:bg-white/14'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection icon={ArrowUpDown} title={<Translate id="comparer.filter.sort.title" />} hint={<Translate id="comparer.filter.sort.hint" />} mode={mode}>
        <div className="flex flex-wrap gap-2">
          {PRICE_SORT_OPTIONS.map((option, idx) => (
            <SegmentedButton
              key={idx}
              active={priceSort === option.id}
              onClick={() => setPriceSort(option.id)}
              className={optionButtonClass}
            >
              {option.label}
            </SegmentedButton>
          ))}
        </div>
      </FilterSection>

      <FilterSection icon={SlidersHorizontal} title={<Translate id="comparer.filter.gear.title" />} hint={<Translate id="comparer.filter.gear.hint" />} mode={mode}>
        <div className="flex flex-wrap gap-2">
          {GEAR_OPTIONS.map((option, idx) => (
            <SegmentedButton
              key={idx}
              active={gearFilter === option.id}
              onClick={() => setGearFilter(option.id)}
              className={optionButtonClass}
            >
              {option.label}
            </SegmentedButton>
          ))}
        </div>
      </FilterSection>

      {!isMobile && hasReset && (
        <button
          type="button"
          onClick={onReset}
          className="liquid-glass-chip rounded-2xl px-4 py-2.5 text-[13px] font-bold text-white/74 transition-colors hover:bg-white/12 hover:text-white"
        >
          <Translate id="comparer.filter.reset" />
        </button>
      )}

      {isMobile && (
        <div className="liquid-glass-shell sticky bottom-0 -mx-4 mt-1 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4" style={GLASS_SHELL_STYLE}>
          <div className="mb-3 flex items-center justify-between gap-3">
            {hasReset ? (
              <button type="button" onClick={onReset} className="text-sm font-bold text-white/58 underline underline-offset-4">
                <Translate id="comparer.filter.reset_short" />
              </button>
            ) : (
              <span className="text-sm font-semibold text-white/44"><Translate id="comparer.filter.default" /></span>
            )}
            <span className="text-sm font-black text-white">
              {loading ? <Translate id="comparer.filter.updating" /> : <>{resultCount} <Translate id={resultCount > 1 ? "comparer.filter.results" : "comparer.filter.result"} /></>}
            </span>
          </div>

          <button
            type="button"
            onClick={onApply}
            className="w-full rounded-2xl bg-[#0037FF] px-4 py-4 text-base font-black text-white shadow-[0_14px_34px_rgba(0,55,255,0.28)] transition-all active:scale-[0.99]"
          >
            <Translate id="comparer.filter.close" />
          </button>
        </div>
      )}
    </div>
  )
}

function MobileFilterSheet({ open, onClose, children }) {
  const startYRef = useRef(null)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const handleTouchStart = (event) => {
    startYRef.current = event.touches[0]?.clientY ?? null
    setIsDragging(true)
  }

  const handleTouchMove = (event) => {
    if (startYRef.current == null) return

    const nextOffset = (event.touches[0]?.clientY ?? 0) - startYRef.current
    setDragOffset(nextOffset > 0 ? Math.min(nextOffset, 240) : 0)
  }

  const handleTouchEnd = () => {
    if (startYRef.current == null) return

    const shouldClose = dragOffset > 110
    startYRef.current = null
    setIsDragging(false)

    if (shouldClose) {
      setDragOffset(0)
      onClose()
      return
    }

    setDragOffset(0)
  }

  if (!open) return null

  return (
    <>
      <button type="button" aria-label="Fermer" onClick={onClose} className="fixed inset-0 z-[70] bg-slate-950/28 backdrop-blur-[3px]" />
      <div
        className="liquid-glass-shell fixed inset-x-0 bottom-0 z-[80] mx-auto flex max-h-[calc(100dvh-0.75rem)] w-full max-w-md flex-col overflow-hidden rounded-t-[2rem] md:hidden"
        style={{
          ...GLASS_SHELL_STYLE,
          transform: `translateY(${dragOffset}px)`,
          transition: isDragging ? 'none' : 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <div
          className="border-b border-white/14 px-4 pb-4 pt-4 touch-pan-y"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-2xl font-black tracking-tight text-white"><Translate id="comparer.mobile_sheet.title" /></p>
              <p className="mt-1 text-sm font-medium text-white/58"><Translate id="comparer.mobile_sheet.subtitle" /></p>
            </div>
            <button type="button" onClick={onClose} className="liquid-glass-chip flex h-10 w-10 items-center justify-center rounded-2xl text-white/74">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto overscroll-contain px-4 pb-0 pt-4">
          {children}
        </div>
      </div>
    </>
  )
}

function CardsArea({
  error,
  loading,
  ecoles,
  mode = 'desktop',
  favorites,
  onToggleFavorite,
  canFavorite = false,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
}) {
  const gridClasses = mode === 'mobile'
    ? 'grid min-w-0 grid-cols-1 gap-6'
    : 'grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'

  if (error) {
    return (
      <div className="rounded-3xl border border-rose-100 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-600">
        <div className="flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={gridClasses}>
        <EcoleCardSkeleton mode={mode} />
        <EcoleCardSkeleton mode={mode} />
        {mode !== 'mobile' && <EcoleCardSkeleton mode={mode} />}
      </div>
    )
  }

  if (ecoles.length === 0) {
    return (
      <div className="glass-panel rounded-[2rem] px-6 py-12 text-center text-sm font-semibold text-slate-500">
        <Translate id="comparer.cards_area.empty_1" />
        <br />
        <Translate id="comparer.cards_area.empty_2" />
      </div>
    )
  }

  return (
    <>
      <div className={gridClasses}>
        {ecoles.map((ecole) => (
          <EcoleCard
            key={ecole.id}
            ecole={ecole}
            mode={mode}
            canFavorite={canFavorite}
            isFavorite={favorites?.has(ecole.id) ?? false}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </div>

      {hasMore && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={loadingMore}
            className="glass-panel-strong rounded-2xl px-6 py-3.5 text-sm font-black text-slate-700 transition-transform active:scale-[0.99] disabled:cursor-wait disabled:opacity-70"
          >
            {loadingMore
              ? <Translate id="comparer.cards_area.loading_more" fallback="Chargement…" />
              : <Translate id="comparer.cards_area.load_more" fallback="Voir plus d'auto-écoles" />}
          </button>
        </div>
      )}
    </>
  )
}

export default function ComparerPage() {
  const { location, setLocation, isHydrated: locationHydrated } = useLocation()
  /**
   * Les deux arbres restent dans le code, mais un seul est monté : `null` (la
   * largeur n'est pas encore connue) les garde tous les deux le temps de
   * l'hydratation, puis l'un des deux disparaît.
   */
  const isDesktop = useIsDesktop()

  const [initialized, setInitialized] = useState(false)
  /** Faux jusqu'à la première position connue — voir l'effet de debounce. */
  const locationSettled = useRef(false)
  // Le debounce ne sert qu'à absorber les rafales d'un curseur qu'on fait
  // glisser. Au premier rendu aucun filtre n'a bougé : partir à 300 ms n'y
  // regroupait rien, ça retardait juste d'autant la seule requête qui remplit
  // la page.
  const [requestDelay, setRequestDelay] = useState(0)
  const [debouncedRequest, setDebouncedRequest] = useState(null)
  const [radius, setRadiusState] = useState(DEFAULT_RADIUS)
  const [permitFilter, setPermitFilterState] = useState(DEFAULT_PERMIT)
  const [budgetRange, setBudgetRangeState] = useState(DEFAULT_BUDGET)
  const [priceSort, setPriceSortState] = useState(null)
  const [minScore, setMinScoreState] = useState(null)
  const [gearFilter, setGearFilterState] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [ecoles, setEcoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  /**
   * Nombre total d'auto-écoles correspondant aux filtres, lu dans l'en-tête
   * `X-Total-Count`. `ecoles` n'en contient que les pages déjà chargées : c'est
   * ce total qu'il faut afficher, pas la longueur de la liste.
   */
  const [total, setTotal] = useState(null)
  /**
   * La page courante n'a de sens que pour une recherche donnée. Plutôt que de
   * la remettre à zéro dans un effet — ce qui provoquerait un rendu de plus, et
   * une requête sur l'ancienne page avant la remise à zéro —, on la dérive au
   * rendu : une clé qui ne correspond plus vaut page 0.
   */
  const [pageState, setPageState] = useState({ key: null, page: 0 })

  useBodyLock(showFilters)

  const { user } = useAuth()
  const [favorites, setFavorites] = useState(() => new Set())

  // Charge les auto-écoles déjà likées par l'utilisateur connecté
  useEffect(() => {
    if (!user) {
      setFavorites(new Set())
      return
    }
    let active = true
    fetch(`${API_URL}/api/ecoles/favorites`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : []))
      .then((list) => {
        if (active && Array.isArray(list)) setFavorites(new Set(list.map((e) => e.id)))
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [user])

  // Like / unlike avec mise à jour optimiste (rollback en cas d'erreur)
  const toggleFavorite = async (ecoleId) => {
    if (!user) return
    const wasFavorite = favorites.has(ecoleId)
    setFavorites((prev) => {
      const next = new Set(prev)
      if (wasFavorite) next.delete(ecoleId)
      else next.add(ecoleId)
      return next
    })
    try {
      if (wasFavorite) {
        await fetch(`${API_URL}/api/ecoles/favorites/${ecoleId}`, {
          method: 'DELETE',
          credentials: 'include',
        })
      } else {
        await fetch(`${API_URL}/api/ecoles/favorites`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ auto_ecole_id: ecoleId }),
        })
      }
    } catch {
      setFavorites((prev) => {
        const next = new Set(prev)
        if (wasFavorite) next.add(ecoleId)
        else next.delete(ecoleId)
        return next
      })
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const latParam = params.get('lat')
    const lngParam = params.get('lng')
    const lat = latParam === null ? Number.NaN : Number(latParam)
    const lng = lngParam === null ? Number.NaN : Number(lngParam)
    const place = params.get('place')

    setRadiusState(getNumberParam(params, 'radius', DEFAULT_RADIUS, 5, 50))
    setBudgetRangeState([
      getNumberParam(params, 'budget_min', DEFAULT_BUDGET[0], MIN_BUDGET, MAX_BUDGET - BUDGET_STEP),
      getNumberParam(params, 'budget_max', DEFAULT_BUDGET[1], MIN_BUDGET + BUDGET_STEP, MAX_BUDGET),
    ])

    const nextPermit = params.get('permis')
    if (PERMIT_LABELS[nextPermit]) setPermitFilterState(nextPermit)

    const nextPriceSort = params.get('price_sort')
    if (nextPriceSort === 'asc' || nextPriceSort === 'desc') setPriceSortState(nextPriceSort)

    const nextGear = params.get('gear')
    if (nextGear === 'auto' || nextGear === 'manuelle') setGearFilterState(nextGear)

    const nextMinScore = Number(params.get('min_score'))
    if ([70, 80, 90].includes(nextMinScore)) setMinScoreState(nextMinScore)

    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      setLocation({
        label: place || 'Adresse sélectionnée',
        displayLabel: place || 'Adresse sélectionnée',
        city: place || 'Adresse sélectionnée',
        lat,
        lng,
        source: 'url',
      })
    }

    setInitialized(true)
  }, [setLocation])

  const locationActive = hasUsableLocation(location)

  const setRadius = (value) => {
    setRequestDelay(REQUEST_DEBOUNCE_MS)
    setRadiusState(value)
  }

  const setBudgetRange = (value) => {
    setRequestDelay(REQUEST_DEBOUNCE_MS)
    setBudgetRangeState(value)
  }

  const setPermitFilter = (value) => {
    setRequestDelay(0)
    setPermitFilterState(value)
  }

  const setPriceSort = (value) => {
    setRequestDelay(0)
    setPriceSortState(value)
  }

  const setMinScore = (value) => {
    setRequestDelay(0)
    setMinScoreState(value)
  }

  const setGearFilter = (value) => {
    setRequestDelay(0)
    setGearFilterState(value)
  }

  /**
   * Une adresse saisie arrive caractère par caractère : on absorbe la rafale.
   * Mais la toute premiere position — celle de l'URL ou de la session — n'est
   * pas une saisie : la debouncer ne regroupait rien, ça ajoutait 300 ms au
   * chargement de la page.
   */
  useEffect(() => {
    if (!initialized || !locationHydrated) return
    if (!locationSettled.current) {
      locationSettled.current = true
      return
    }
    setRequestDelay(REQUEST_DEBOUNCE_MS)
  }, [initialized, locationHydrated, location?.lat, location?.lng, location?.displayLabel])

  useEffect(() => {
    if (!initialized) return

    const params = new URLSearchParams()

    if (locationActive) {
      params.set('place', compactPlaceLabel(location))
      params.set('lat', String(location.lat))
      params.set('lng', String(location.lng))
      params.set('radius', String(radius))
    }

    if (permitFilter !== DEFAULT_PERMIT) params.set('permis', permitFilter)
    if (budgetRange[0] !== DEFAULT_BUDGET[0]) params.set('budget_min', String(budgetRange[0]))
    if (budgetRange[1] !== DEFAULT_BUDGET[1]) params.set('budget_max', String(budgetRange[1]))
    if (priceSort) params.set('price_sort', priceSort)
    if (gearFilter) params.set('gear', gearFilter)
    if (minScore) params.set('min_score', String(minScore))

    const nextUrl = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname
    window.history.replaceState(null, '', nextUrl)
  }, [initialized, locationActive, location, radius, permitFilter, budgetRange, priceSort, gearFilter, minScore])

  const request = useMemo(() => {
    const params = new URLSearchParams()

    if (locationActive) {
      params.set('lat', String(location.lat))
      params.set('lng', String(location.lng))
      params.set('radius', String(radius))
    }

    if (permitFilter !== DEFAULT_PERMIT) params.set('permis', permitFilter)
    params.set('budget_min', String(budgetRange[0]))
    params.set('budget_max', String(budgetRange[1]))
    if (priceSort) params.set('price_sort', priceSort)
    if (gearFilter) params.set('gear', gearFilter)
    if (minScore) params.set('min_score', String(minScore))

    return {
      query: params.toString(),
      radius,
      budgetRange,
    }
  }, [locationActive, location?.lat, location?.lng, radius, permitFilter, budgetRange, priceSort, gearFilter, minScore])

  // On attend que la position soit hydratée : partir sans elle, c'est une
  // requête complète jetée, puis relancée avec les coordonnées.
  useEffect(() => {
    if (!initialized || !locationHydrated) return undefined

    const timer = setTimeout(() => {
      setDebouncedRequest(request)
    }, requestDelay)

    return () => clearTimeout(timer)
  }, [initialized, locationHydrated, request, requestDelay])

  // Page dérivée au rendu : une clé périmée (les filtres ont changé) vaut 0.
  const requestKey = debouncedRequest?.query ?? null
  const page = pageState.key === requestKey ? pageState.page : 0

  useEffect(() => {
    if (!debouncedRequest) return undefined

    const controller = new AbortController()
    const isFirstPage = page === 0

    const fetchEcoles = async () => {
      // Une page suivante s'ajoute sous la liste : remplacer les cartes par des
      // squelettes ferait sauter la position de lecture.
      if (isFirstPage) setLoading(true)
      else setLoadingMore(true)
      setError(null)

      try {
        const query = `${debouncedRequest.query}&limit=${PAGE_SIZE}&offset=${page * PAGE_SIZE}`
        const res = await fetch(`/api/ecoles?${query}`, { signal: controller.signal })
        if (!res.ok) throw new Error(`Erreur ${res.status}`)

        const count = Number(res.headers?.get?.('X-Total-Count'))
        const data = await res.json()
        const nextEcoles = Array.isArray(data)
          ? data.map((ecole) => enrichEcole(ecole, debouncedRequest.radius, debouncedRequest.budgetRange))
          : []

        setEcoles((prev) => (isFirstPage ? nextEcoles : [...prev, ...nextEcoles]))
        // L'en-tête manque si un proxy le filtre : on retombe alors sur ce qui
        // est chargé, quitte à ne pas proposer de page suivante.
        setTotal(Number.isFinite(count) && count >= 0 ? count : null)
      } catch (fetchError) {
        if (fetchError.name === 'AbortError') return
        setError(<Translate id="comparer.cards_area.error" />)
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
          setLoadingMore(false)
        }
      }
    }

    fetchEcoles()

    return () => controller.abort()
  }, [debouncedRequest, page])

  const resultCount = total ?? ecoles.length
  const hasMore = ecoles.length > 0 && total != null && ecoles.length < total

  const loadMore = () => {
    if (loading || loadingMore || !hasMore) return
    setPageState({ key: requestKey, page: page + 1 })
  }

  const resultLabel = locationActive ? <><Translate id="comparer.page.results_near" /> {compactPlaceLabel(location)}</> : <Translate id="comparer.page.results_score" />

  const hasReset = (
    (locationActive && radius !== DEFAULT_RADIUS)
    || permitFilter !== DEFAULT_PERMIT
    || budgetRange[0] !== DEFAULT_BUDGET[0]
    || budgetRange[1] !== DEFAULT_BUDGET[1]
    || priceSort !== null
    || minScore !== null
    || gearFilter !== null
  )

  const activeFilterCount = [
    locationActive && radius !== DEFAULT_RADIUS,
    permitFilter !== DEFAULT_PERMIT,
    budgetRange[0] !== DEFAULT_BUDGET[0] || budgetRange[1] !== DEFAULT_BUDGET[1],
    priceSort !== null,
    minScore !== null,
    gearFilter !== null,
  ].filter(Boolean).length

  const summaryChips = useMemo(() => {
    const chips = []

    if (locationActive) {
      chips.push(compactPlaceLabel(location))
        chips.push(<><Translate id="comparer.summary.radius" /> {radius} km</>)
    }
      if (minScore) chips.push(<><Translate id="comparer.summary.score" /> {minScore}+</>)
    if (permitFilter !== DEFAULT_PERMIT) chips.push(PERMIT_LABELS[permitFilter] ?? permitFilter)
      if (priceSort === 'asc') chips.push(<Translate id="comparer.summary.low_price" />)
      if (priceSort === 'desc') chips.push(<Translate id="comparer.summary.high_price" />)
      if (gearFilter === 'auto') chips.push(<Translate id="comparer.summary.auto" />)
      if (gearFilter === 'manuelle') chips.push(<Translate id="comparer.summary.manual" />)

    return chips.slice(0, 5)
  }, [locationActive, location, radius, minScore, permitFilter, priceSort, gearFilter])

  const mobilePills = useMemo(() => {
    const pills = []

    if (locationActive) pills.push(<><Translate id="comparer.summary.radius" /> {radius} km</>)
    if (minScore) pills.push(<><Translate id="comparer.summary.score" /> {minScore}+</>)
    else pills.push(<Translate id="comparer.summary.score" />)
    if (gearFilter === 'auto') pills.push(<Translate id="comparer.summary.auto" />)
    else if (gearFilter === 'manuelle') pills.push(<Translate id="comparer.summary.manual" />)
    else pills.push(<Translate id="comparer.summary.gearbox" />)
    if (priceSort === 'asc') pills.push(<Translate id="comparer.summary.low_price" />)
    else if (priceSort === 'desc') pills.push(<Translate id="comparer.summary.high_price" />)
    else pills.push(<Translate id="comparer.summary.sort_score" />)

    return pills
  }, [locationActive, radius, minScore, gearFilter, priceSort])

  const resetFilters = () => {
    setRequestDelay(0)
    setRadiusState(DEFAULT_RADIUS)
    setPermitFilterState(DEFAULT_PERMIT)
    setBudgetRangeState([...DEFAULT_BUDGET])
    setPriceSortState(null)
    setMinScoreState(null)
    setGearFilterState(null)
  }

  const filterControlProps = {
    location,
    radius,
    setRadius,
    permitFilter,
    setPermitFilter,
    budgetRange,
    setBudgetRange,
    priceSort,
    setPriceSort,
    minScore,
    setMinScore,
    gearFilter,
    setGearFilter,
    onReset: resetFilters,
    hasReset,
    resultCount,
    loading,
  }

  return (
    <div className="min-h-[100dvh] bg-transparent">
      {isDesktop !== true && (
      <div className="mx-auto min-h-[100dvh] max-w-md overflow-x-hidden bg-transparent md:hidden">
        <header className="glass-panel-strong sticky top-0 z-20 rounded-b-[1.75rem]">
          <div className="px-4 pb-4 pt-4">
            <LocationSearchBar />

            <div className="mt-4 flex max-w-full gap-2 overflow-x-auto pb-1 no-scrollbar">
              <button
                type="button"
                onClick={() => setShowFilters(true)}
                className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#0037FF] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-white shadow-[0_10px_25px_rgba(0,55,255,0.24)]"
              >
                <SlidersHorizontal size={14} />
                <Translate id="comparer.page.filters" />{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
              </button>

              {mobilePills.map((pill, idx) => (
                <span key={idx} className="liquid-glass-chip shrink-0 rounded-full px-4 py-3 text-xs font-bold text-white/74">
                  {pill}
                </span>
              ))}
            </div>
          </div>
        </header>

        <main className="min-w-0 px-4 pb-[calc(9rem+env(safe-area-inset-bottom))] pt-5">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-xs font-black uppercase tracking-[0.22em] text-slate-400">{resultLabel}</p>
              <h1 className="mt-2 text-[2rem] font-black leading-none tracking-tight text-slate-950">
                <Translate id="comparer.page.title" />
              </h1>
            </div>

            {!loading && !error && (
              <div className="shrink-0 text-right">
                <p className="text-2xl font-black text-[#0037FF]">{resultCount}</p>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400"><Translate id="comparer.page.results_count" /></p>
              </div>
            )}
          </div>

          <div className="glass-panel mb-6 rounded-[1.75rem] px-5 py-4">
            {locationActive ? (
              <>
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-[#0037FF]">
                  <Sparkles size={14} />
                  <Translate id="comparer.page.active_address" />
                </div>
                <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">
                  <Translate id="comparer.page.active_address_desc_1" /> <span className="font-black text-slate-950">{compactPlaceLabel(location)}</span>.
                </p>
              </>
            ) : (
              <p className="text-sm font-medium leading-relaxed text-slate-600">
                <Translate id="comparer.page.inactive_address_desc" />
              </p>
            )}
          </div>

          <CardsArea
            error={error}
            loading={loading}
            ecoles={ecoles}
            mode="mobile"
            canFavorite={!!user}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            hasMore={hasMore}
            loadingMore={loadingMore}
            onLoadMore={loadMore}
          />
        </main>
      </div>
      )}

      {isDesktop !== false && (
      <div className="hidden md:block">
        <div className="mx-auto flex min-h-[100dvh] max-w-[2160px] gap-6 px-6 pb-10 pt-24 xl:gap-8 xl:px-10">
          <aside className="w-[20rem] shrink-0">
            <div
              className="liquid-glass-shell no-scrollbar sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto overscroll-contain rounded-[2rem] px-5 py-6"
              style={GLASS_SHELL_STYLE}
            >
              <div className="mb-5 rounded-[1.5rem] border border-white/14 bg-white/8 p-4">
                <p className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-white/48"><Translate id="comparer.page.address" /></p>
                <LocationSearchBar />
              </div>

              <FilterControls mode="desktop" onApply={() => {}} {...filterControlProps} />
            </div>
          </aside>

          <main className="min-w-0 flex-1">
            <div className="mb-7 flex items-start justify-between gap-6">
              <div className="min-w-0 max-w-3xl">
                <p className="truncate text-xs font-black uppercase tracking-[0.24em] text-slate-400">{resultLabel}</p>
                <h1 className="mt-3 text-[2.65rem] font-black leading-[0.98] tracking-tight text-slate-950 xl:text-[3rem]">
                  <Translate id="comparer.page.desktop_title" />
                </h1>
                <p className="mt-3 max-w-2xl text-base font-medium leading-relaxed text-slate-500">
                  <Translate id="comparer.page.desktop_subtitle" />
                </p>

                {summaryChips.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {summaryChips.map((chip, idx) => (
                      <span key={idx} className="liquid-glass-chip rounded-full px-3.5 py-1.5 text-[13px] font-bold text-white/74">
                        {chip}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {!loading && !error && (
                <div className="glass-panel-strong shrink-0 rounded-[1.65rem] px-5 py-4 text-right">
                  <p className="text-4xl font-black leading-none text-[#0037FF]">{resultCount}</p>
                  <p className="mt-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400"><Translate id="comparer.page.desktop_schools" /></p>
                </div>
              )}
            </div>

            {!locationActive && (
              <div className="glass-panel mb-7 rounded-[1.5rem] px-5 py-4">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#0037FF]"><Translate id="comparer.page.radius_inactive" /></p>
                <p className="mt-2 max-w-2xl text-sm font-medium text-slate-600">
                  <Translate id="comparer.page.radius_inactive_desc" />
                </p>
              </div>
            )}

            <CardsArea
              error={error}
              loading={loading}
              ecoles={ecoles}
              mode="desktop"
              canFavorite={!!user}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
              hasMore={hasMore}
              loadingMore={loadingMore}
              onLoadMore={loadMore}
            />
          </main>
        </div>
      </div>
      )}

      <MobileFilterSheet open={showFilters} onClose={() => setShowFilters(false)}>
        <FilterControls mode="mobile" onApply={() => setShowFilters(false)} {...filterControlProps} />
      </MobileFilterSheet>
    </div>
  )
}
