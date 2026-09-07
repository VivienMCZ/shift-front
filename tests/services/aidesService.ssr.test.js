// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * The service resolves its base URL at import time from `typeof window`.
 * This file runs in the node environment to cover the server-side branch,
 * which the jsdom suite cannot reach.
 */
describe('aidesService base URL on the server', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
  })

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_API_URL
    delete global.fetch
  })

  it('targets the loopback backend when NEXT_PUBLIC_API_URL is unset', async () => {
    delete process.env.NEXT_PUBLIC_API_URL
    const { aidesService } = await import('@/services/aidesService')

    await aidesService.calculateAides({})

    expect(global.fetch.mock.calls[0][0]).toBe('http://127.0.0.1:8000/api/v1/aides/calculate')
  })

  it('uses NEXT_PUBLIC_API_URL when it is provided', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'https://api.shift.example'
    const { aidesService } = await import('@/services/aidesService')

    await aidesService.calculateAides({})

    expect(global.fetch.mock.calls[0][0]).toBe('https://api.shift.example/api/v1/aides/calculate')
  })

  it('strips a trailing slash so the path is not doubled', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'https://api.shift.example/'
    const { aidesService } = await import('@/services/aidesService')

    await aidesService.calculateAides({})

    expect(global.fetch.mock.calls[0][0]).toBe('https://api.shift.example/api/v1/aides/calculate')
  })
})
