import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LocationProvider, useLocation } from '@/app/context/LocationContext'

const SESSION_KEY = 'shift_location'

const wrapper = ({ children }) => <LocationProvider>{children}</LocationProvider>

function renderLocation() {
  return renderHook(() => useLocation(), { wrapper })
}

afterEach(() => {
  window.history.replaceState({}, '', '/')
})

describe('LocationProvider', () => {
  it('starts empty', () => {
    const { result } = renderLocation()
    expect(result.current.location).toBeNull()
  })

  it('normalises and stores a selected location', async () => {
    const { result } = renderLocation()

    act(() => result.current.setLocation({ municipality: 'Nantes', lat: 47.21, lng: -1.55 }))

    expect(result.current.location).toMatchObject({
      city: 'Nantes',
      label: 'Nantes',
      displayLabel: 'Nantes',
      lat: 47.21,
    })
    expect(JSON.parse(sessionStorage.getItem(SESSION_KEY))).toMatchObject({ city: 'Nantes' })
  })

  it('rehydrates from the session on mount', async () => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ city: 'Lyon', lat: 45.76, lng: 4.83 }))

    const { result } = renderLocation()

    await waitFor(() => expect(result.current.location).toMatchObject({ city: 'Lyon' }))
  })

  it('lets URL coordinates win over the stored location', async () => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ city: 'Lyon', lat: 45.76, lng: 4.83 }))
    window.history.replaceState({}, '', '/comparer?lat=48.85&lng=2.35')

    const { result } = renderLocation()

    // Deliberately not rehydrated: the page reads the coordinates from the URL.
    await waitFor(() => expect(result.current.location).toBeNull())
  })

  it('ignores a corrupted session payload', async () => {
    sessionStorage.setItem(SESSION_KEY, 'not json at all')

    const { result } = renderLocation()

    await waitFor(() => expect(result.current.location).toBeNull())
  })

  it('clears the location and the stored copy', async () => {
    const { result } = renderLocation()
    act(() => result.current.setLocation({ city: 'Nantes' }))
    expect(sessionStorage.getItem(SESSION_KEY)).not.toBeNull()

    act(() => result.current.clearLocation())

    expect(result.current.location).toBeNull()
    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull()
  })

  it('does not crash when sessionStorage refuses writes', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota', 'QuotaExceededError')
    })
    const { result } = renderLocation()

    expect(() => act(() => result.current.setLocation({ city: 'Nantes' }))).not.toThrow()
    expect(result.current.location).toMatchObject({ city: 'Nantes' })
    setItem.mockRestore()
  })
})

describe('useLocation', () => {
  it('fails loudly when used outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => renderHook(() => useLocation())).toThrow(
      'useLocation must be used inside LocationProvider',
    )
  })
})
