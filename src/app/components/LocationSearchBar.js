'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { AlertCircle, Loader2, LocateFixed, MapPin, Search, X } from 'lucide-react'
import { useLocation } from '@/app/context/LocationContext'
import { useUserLocation } from '@/app/hooks/useUserLocation'
import { featureToLocation, formatFeatureLabel } from '@/app/lib/location-utils'

const PROXY_AUTOCOMPLETE_URL = '/api/locations/search'
const DIRECT_AUTOCOMPLETE_URL = 'https://api-adresse.data.gouv.fr/search'

async function fetchAddressSuggestions(query, signal) {
  const params = new URLSearchParams({
    q: query,
    autocomplete: '1',
    limit: '8',
  })

  try {
    const proxyResponse = await fetch(`${PROXY_AUTOCOMPLETE_URL}?q=${encodeURIComponent(query)}`, { signal })
    if (!proxyResponse.ok) throw new Error('proxy_failed')
    return proxyResponse.json()
  } catch (error) {
    if (error.name === 'AbortError') throw error
    const directResponse = await fetch(`${DIRECT_AUTOCOMPLETE_URL}/?${params.toString()}`, { signal })
    if (!directResponse.ok) throw new Error('direct_failed')
    return directResponse.json()
  }
}

export default function LocationSearchBar() {
  const { location, setLocation, clearLocation } = useLocation()
  const { fetchUserLocation, loading: geoLoading, error: geoError, setError: setGeoError } = useUserLocation()

  const listboxId = useId()
  const [inputValue, setInputValue] = useState(location?.displayLabel ?? location?.city ?? '')
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [activeIndex, setActiveIndex] = useState(-1)
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [searchError, setSearchError] = useState(null)
  const [isOpen, setIsOpen] = useState(false)

  const wrapperRef = useRef(null)
  const inputRef = useRef(null)
  const requestIdRef = useRef(0)

  useEffect(() => {
    const nextValue = location?.displayLabel ?? location?.label ?? location?.city ?? ''
    setInputValue(nextValue)
  }, [location?.displayLabel, location?.label, location?.city])

  useEffect(() => {
    const handleClick = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false)
        setActiveIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    const trimmedQuery = query.trim()

    if (trimmedQuery.length < 2) {
      setSuggestions([])
      setIsOpen(false)
      setActiveIndex(-1)
      setLoadingSuggestions(false)
      return undefined
    }

    const controller = new AbortController()
    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId

    const timer = setTimeout(async () => {
      setLoadingSuggestions(true)
      setSearchError(null)

      try {
        const data = await fetchAddressSuggestions(trimmedQuery, controller.signal)
        if (requestId !== requestIdRef.current) return

        const features = Array.isArray(data?.features) ? data.features : []
        setSuggestions(features)
        setActiveIndex(features.length > 0 ? 0 : -1)
        setIsOpen(true)
        setSearchError(features.length > 0 ? null : `Aucune adresse trouvée pour « ${trimmedQuery} »`)
      } catch (error) {
        if (error.name === 'AbortError') return
        if (requestId !== requestIdRef.current) return
        setSuggestions([])
        setActiveIndex(-1)
        setIsOpen(false)
        setSearchError('Erreur lors de la recherche. Vérifiez votre connexion.')
      } finally {
        if (requestId === requestIdRef.current) setLoadingSuggestions(false)
      }
    }, 300)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  const selectSuggestion = (feature) => {
    const nextLocation = featureToLocation(feature)
    setLocation(nextLocation)
    setInputValue(nextLocation.displayLabel)
    setQuery('')
    setSuggestions([])
    setIsOpen(false)
    setSearchError(null)
    setActiveIndex(-1)
  }

  const handleInputChange = (event) => {
    const value = event.target.value
    setInputValue(value)
    setQuery(value)
    setGeoError(null)

    if (!value) {
      clearLocation()
      setSuggestions([])
      setIsOpen(false)
      setSearchError(null)
      setActiveIndex(-1)
    }
  }

  const handleKeyDown = (event) => {
    if (!isOpen && event.key === 'ArrowDown' && suggestions.length > 0) {
      setIsOpen(true)
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((current) => Math.min(current + 1, suggestions.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((current) => Math.max(current - 1, 0))
    } else if (event.key === 'Enter' && isOpen && activeIndex >= 0) {
      event.preventDefault()
      selectSuggestion(suggestions[activeIndex])
    } else if (event.key === 'Escape') {
      setIsOpen(false)
      setActiveIndex(-1)
    }
  }

  const handleGeolocate = async () => {
    setSearchError(null)
    const loc = await fetchUserLocation()
    if (loc) setLocation(loc)
  }

  const handleClear = () => {
    setInputValue('')
    setQuery('')
    clearLocation()
    setSuggestions([])
    setIsOpen(false)
    setSearchError(null)
    setGeoError(null)
    setActiveIndex(-1)
    inputRef.current?.focus()
  }

  const errorMessage = geoError || searchError
  const activeOptionId = activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined

  return (
    <div className="flex min-w-0 flex-col gap-2" ref={wrapperRef}>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          {loadingSuggestions
            ? <Loader2 size={18} className="animate-spin text-white/50" />
            : <Search size={18} className="text-white/50" />
          }
        </div>

        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Adresse, ville ou code postal"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-activedescendant={activeOptionId}
          className="liquid-glass-input block w-full rounded-2xl py-3.5 pl-11 pr-10 text-sm font-semibold text-white placeholder:text-white/44 focus:outline-none focus:ring-2 focus:ring-[#75A7FF]/50"
        />

        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-white/50 transition-colors hover:text-white"
            aria-label="Effacer l'adresse"
          >
            <X size={16} />
          </button>
        )}

        {isOpen && suggestions.length > 0 && (
          <ul
            id={listboxId}
            role="listbox"
            className="liquid-glass-shell absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-2xl p-1"
          >
            {suggestions.map((feature, index) => {
              const properties = feature.properties ?? {}
              const isActive = index === activeIndex

              return (
                <li key={properties.id ?? `${properties.label}-${index}`} role="option" aria-selected={isActive} id={`${listboxId}-${index}`}>
                  <button
                    type="button"
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseDown={(event) => {
                      event.preventDefault()
                      selectSuggestion(feature)
                    }}
                    className={`flex w-full min-w-0 items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors ${
                      isActive ? 'bg-white/14 shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]' : 'hover:bg-white/10'
                    }`}
                  >
                    <MapPin size={16} className="mt-0.5 shrink-0 text-[#0047FF]" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-white">
                        {formatFeatureLabel(feature)}
                      </span>
                      <span className="mt-0.5 block truncate text-xs font-medium text-white/58">
                        {[properties.postcode, properties.context].filter(Boolean).join(' · ')}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <button
        type="button"
        onClick={handleGeolocate}
        disabled={geoLoading}
        className="liquid-glass-chip inline-flex max-w-full items-center gap-2 self-start rounded-full px-4 py-2 text-xs font-bold text-white/82 transition-all hover:bg-white/12 active:scale-95 disabled:opacity-60"
      >
        {geoLoading
          ? <Loader2 size={14} className="shrink-0 animate-spin" />
          : <LocateFixed size={14} className="shrink-0 text-[#0047FF]" />
        }
        <span className="truncate">{geoLoading ? 'Localisation...' : 'Utiliser ma position actuelle'}</span>
      </button>

      {errorMessage && (
        <div className="glass-panel-soft flex items-center gap-2 rounded-2xl bg-rose-50/80 px-3 py-2 text-xs font-semibold text-rose-600">
          <AlertCircle size={14} className="shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  )
}
