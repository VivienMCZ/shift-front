'use client'

import { useState } from 'react'
import { locationFromFeature } from '@/app/lib/location-utils'

const PROXY_REVERSE_URL = '/api/locations/reverse'
const DIRECT_REVERSE_URL = 'https://api-adresse.data.gouv.fr/reverse'

export function useUserLocation() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const getPosition = () =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('geolocation_unavailable'))
        return
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        timeout: 8000,
        maximumAge: 60000,
      })
    })

  const fetchReverse = async (url, lat, lng) => {
    const params = new URLSearchParams()

    if (url === PROXY_REVERSE_URL) {
      params.set('lat', String(lat))
      params.set('lng', String(lng))
    } else {
      params.set('lat', String(lat))
      params.set('lon', String(lng))
    }

    const res = await fetch(`${url}?${params.toString()}`)
    if (!res.ok) throw new Error('reverse_geocode_failed')
    return res.json()
  }

  const reverseGeocode = async (lat, lng) => {
    let data

    try {
      data = await fetchReverse(PROXY_REVERSE_URL, lat, lng)
    } catch {
      data = await fetchReverse(DIRECT_REVERSE_URL, lat, lng)
    }

    const feature = data?.features?.[0]
    if (!feature) throw new Error('reverse_geocode_no_result')

    return locationFromFeature(feature, lat, lng)
  }

  const fetchUserLocation = async () => {
    setLoading(true)
    setError(null)
    try {
      const position = await getPosition()
      const { latitude: lat, longitude: lng } = position.coords
      const loc = await reverseGeocode(lat, lng)
      setLoading(false)
      return loc
    } catch (err) {
      let message = 'Impossible de récupérer votre position.'
      if (err.code === 1 || err.message === 'geolocation_unavailable') {
        message = 'Géolocalisation refusée. Veuillez saisir votre adresse manuellement.'
      } else if (err.code === 3) {
        message = 'La géolocalisation a pris trop de temps. Réessayez.'
      }
      setError(message)
      setLoading(false)
      return null
    }
  }

  return { fetchUserLocation, loading, error, setError }
}
