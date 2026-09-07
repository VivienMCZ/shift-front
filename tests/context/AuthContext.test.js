import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider, useAuth } from '@/app/context/AuthContext'

const USER = { id: 1, email: 'test@shift.example', firstName: 'Marc' }

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>

function renderAuth() {
  return renderHook(() => useAuth(), { wrapper })
}

/** jsdom refuses real navigation, so `window.location` is swapped for a plain object. */
function stubLocation() {
  const original = window.location
  const fake = { href: '/' }
  Object.defineProperty(window, 'location', { value: fake, writable: true, configurable: true })
  return {
    fake,
    restore: () => Object.defineProperty(window, 'location', {
      value: original,
      writable: true,
      configurable: true,
    }),
  }
}

beforeEach(() => {
  global.fetch = vi.fn()
})

afterEach(() => {
  delete global.fetch
})

describe('AuthProvider', () => {
  it('asks the backend who the user is, with cookies attached', async () => {
    global.fetch.mockResolvedValue({ ok: true, json: async () => USER })

    const { result } = renderAuth()

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(global.fetch).toHaveBeenCalledWith('/auth/me', {
      method: 'GET',
      credentials: 'include',
    })
    expect(result.current.user).toEqual(USER)
  })

  it('starts in a loading state', () => {
    global.fetch.mockResolvedValue({ ok: true, json: async () => USER })

    const { result } = renderAuth()

    expect(result.current.loading).toBe(true)
    expect(result.current.user).toBeNull()
  })

  it('leaves the user anonymous on a 401', async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 401, json: async () => ({}) })

    const { result } = renderAuth()

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.user).toBeNull()
  })

  it('leaves the user anonymous when the backend is unreachable', async () => {
    global.fetch.mockRejectedValue(new TypeError('Failed to fetch'))

    const { result } = renderAuth()

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.user).toBeNull()
  })

  it('re-reads the session when checkAuth is called again', async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 401, json: async () => ({}) })
    const { result } = renderAuth()
    await waitFor(() => expect(result.current.loading).toBe(false))

    global.fetch.mockResolvedValue({ ok: true, json: async () => USER })
    await act(async () => { await result.current.checkAuth() })

    expect(result.current.user).toEqual(USER)
  })

  it('logs out, clears the user and returns home', async () => {
    global.fetch.mockResolvedValue({ ok: true, json: async () => USER })
    const { result } = renderAuth()
    await waitFor(() => expect(result.current.user).toEqual(USER))
    const location = stubLocation()

    await act(async () => { await result.current.logout() })

    expect(global.fetch).toHaveBeenCalledWith('/auth/logout', {
      method: 'POST',
      credentials: 'include',
    })
    expect(result.current.user).toBeNull()
    expect(location.fake.href).toBe('/')
    location.restore()
  })

  it('clears the user even when the logout call fails', async () => {
    global.fetch.mockResolvedValue({ ok: true, json: async () => USER })
    const { result } = renderAuth()
    await waitFor(() => expect(result.current.user).toEqual(USER))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    global.fetch.mockRejectedValue(new TypeError('Failed to fetch'))
    const location = stubLocation()

    await act(async () => { await result.current.logout() })

    expect(result.current.user).toBeNull()
    location.restore()
  })
})
