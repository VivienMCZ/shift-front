'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { normalizeLocation } from '@/app/lib/location-utils'

const LocationContext = createContext(null)

const SESSION_KEY = 'shift_location'

export function LocationProvider({ children }) {
  const [location, setLocationState] = useState(null)
  /**
   * La position n'est connue qu'après le montage (URL ou sessionStorage). Les
   * consommateurs qui déclenchent une requête réseau à partir d'elle doivent
   * pouvoir attendre : sans ce drapeau, /comparer partait chercher les
   * auto-écoles sans coordonnées, puis relançait tout dès la restauration.
   */
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    let cancelled = false

    const restore = () => {
      try {
        // Une position dans l'URL fait foi : la page la lit elle-même et
        // appellera `setLocation`. Rien à restaurer ici.
        const params = new URLSearchParams(window.location.search)
        if (params.has('lat') && params.has('lng')) return null

        const stored = sessionStorage.getItem(SESSION_KEY)
        return stored ? normalizeLocation(JSON.parse(stored)) : null
      } catch {
        return null
      }
    }

    const storedLocation = restore()

    queueMicrotask(() => {
      if (cancelled) return
      if (storedLocation) setLocationState(storedLocation)
      setIsHydrated(true)
    })

    return () => {
      cancelled = true
    }
  }, [])

  const setLocation = useCallback((loc) => {
    const normalizedLocation = normalizeLocation(loc)
    setLocationState(normalizedLocation)
    try {
      if (normalizedLocation) sessionStorage.setItem(SESSION_KEY, JSON.stringify(normalizedLocation))
      else sessionStorage.removeItem(SESSION_KEY)
    } catch {}
  }, [])

  const clearLocation = useCallback(() => setLocation(null), [setLocation])

  return (
    <LocationContext.Provider value={{ location, setLocation, clearLocation, isHydrated }}>
      {children}
    </LocationContext.Provider>
  )
}

export function useLocation() {
  const ctx = useContext(LocationContext)
  if (!ctx) throw new Error('useLocation must be used inside LocationProvider')
  return ctx
}
