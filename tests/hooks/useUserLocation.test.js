import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useUserLocation } from '@/app/hooks/useUserLocation'

const PARIS_FEATURE = {
  properties: {
    label: '12 Rue de Rivoli 75001 Paris',
    name: '12 Rue de Rivoli',
    city: 'Paris',
    postcode: '75001',
  },
  geometry: { coordinates: [2.3522, 48.8566] },
}

const banResponse = (features) => ({ ok: true, json: async () => ({ features }) })

function mockPosition(coords) {
  navigator.geolocation.getCurrentPosition.mockImplementation((onSuccess) => onSuccess({ coords }))
}

function mockPositionError(error) {
  navigator.geolocation.getCurrentPosition.mockImplementation((_onSuccess, onError) => onError(error))
}

beforeEach(() => {
  global.fetch = vi.fn()
  Object.defineProperty(navigator, 'geolocation', {
    value: { getCurrentPosition: vi.fn() },
    writable: true,
    configurable: true,
  })
})

afterEach(() => {
  delete global.fetch
})

describe('useUserLocation', () => {
  it('resolves the device position through the Next proxy', async () => {
    mockPosition({ latitude: 48.8566, longitude: 2.3522 })
    global.fetch.mockResolvedValue(banResponse([PARIS_FEATURE]))

    const { result } = renderHook(() => useUserLocation())
    let location
    await act(async () => { location = await result.current.fetchUserLocation() })

    expect(global.fetch).toHaveBeenCalledWith('/api/locations/reverse?lat=48.8566&lng=2.3522')
    expect(location).toMatchObject({
      city: 'Paris',
      displayLabel: '12 Rue de Rivoli, Paris',
      lat: 48.8566,
      lng: 2.3522,
      source: 'geolocation',
    })
    expect(result.current.error).toBeNull()
    expect(result.current.loading).toBe(false)
  })

  it('falls back to the public BAN API when the proxy fails, using its lon parameter', async () => {
    mockPosition({ latitude: 48.8566, longitude: 2.3522 })
    global.fetch
      .mockResolvedValueOnce({ ok: false, status: 502, json: async () => ({}) })
      .mockResolvedValueOnce(banResponse([PARIS_FEATURE]))

    const { result } = renderHook(() => useUserLocation())
    let location
    await act(async () => { location = await result.current.fetchUserLocation() })

    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      'https://api-adresse.data.gouv.fr/reverse?lat=48.8566&lon=2.3522',
    )
    expect(location).toMatchObject({ city: 'Paris' })
  })

  it('reports a generic error when reverse geocoding returns nothing', async () => {
    mockPosition({ latitude: 48.8566, longitude: 2.3522 })
    global.fetch.mockResolvedValue(banResponse([]))

    const { result } = renderHook(() => useUserLocation())
    let location
    await act(async () => { location = await result.current.fetchUserLocation() })

    expect(location).toBeNull()
    expect(result.current.error).toBe('Impossible de récupérer votre position.')
  })

  it('asks the user to type an address when permission is denied', async () => {
    mockPositionError({ code: 1, message: 'User denied Geolocation' })

    const { result } = renderHook(() => useUserLocation())
    let location
    await act(async () => { location = await result.current.fetchUserLocation() })

    expect(location).toBeNull()
    expect(result.current.error).toMatch(/Géolocalisation refusée/)
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('invites the user to retry on a timeout', async () => {
    mockPositionError({ code: 3, message: 'Timeout expired' })

    const { result } = renderHook(() => useUserLocation())
    await act(async () => { await result.current.fetchUserLocation() })

    expect(result.current.error).toMatch(/trop de temps/)
  })

  it('handles a browser without geolocation support', async () => {
    Object.defineProperty(navigator, 'geolocation', {
      value: undefined,
      writable: true,
      configurable: true,
    })

    const { result } = renderHook(() => useUserLocation())
    let location
    await act(async () => { location = await result.current.fetchUserLocation() })

    expect(location).toBeNull()
    expect(result.current.error).toMatch(/Géolocalisation refusée/)
  })

  it('clears a previous error on the next attempt', async () => {
    mockPositionError({ code: 1 })
    const { result } = renderHook(() => useUserLocation())
    await act(async () => { await result.current.fetchUserLocation() })
    expect(result.current.error).not.toBeNull()

    act(() => result.current.setError(null))

    expect(result.current.error).toBeNull()
  })

  it('stops loading even when everything fails', async () => {
    mockPosition({ latitude: 1, longitude: 2 })
    global.fetch.mockRejectedValue(new TypeError('Failed to fetch'))

    const { result } = renderHook(() => useUserLocation())
    await act(async () => { await result.current.fetchUserLocation() })

    await waitFor(() => expect(result.current.loading).toBe(false))
  })
})
