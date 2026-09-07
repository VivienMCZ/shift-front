'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { normalizeLocation } from '@/app/lib/location-utils'

const LocationContext = createContext(null)

const SESSION_KEY = 'shift_location'

export function LocationProvider({ children }) {
  const [location, setLocationState] = useState(null)

  useEffect(() => {
    let cancelled = false

    try {
      const params = new URLSearchParams(window.location.search)
      if (params.has('lat') && params.has('lng')) return undefined

      const stored = sessionStorage.getItem(SESSION_KEY)
      const storedLocation = stored ? normalizeLocation(JSON.parse(stored)) : null

      if (storedLocation) {
        queueMicrotask(() => {
          if (!cancelled) setLocationState(storedLocation)
        })
      }
    } catch {}

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
    <LocationContext.Provider value={{ location, setLocation, clearLocation }}>
      {children}
    </LocationContext.Provider>
  )
}

export function useLocation() {
  const ctx = useContext(LocationContext)
  if (!ctx) throw new Error('useLocation must be used inside LocationProvider')
  return ctx
}
