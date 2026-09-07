import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { aidesService } from '@/services/aidesService'

const PROFILE = { age: 18, statut: 'apprenti', codePostal: '75001' }

describe('aidesService.calculateAides', () => {
  beforeEach(() => {
    // The service logs every failure; keep the test output readable.
    vi.spyOn(console, 'error').mockImplementation(() => {})
    global.fetch = vi.fn()
  })

  afterEach(() => {
    delete global.fetch
  })

  it('posts the profile as JSON to the same-origin proxy', async () => {
    global.fetch.mockResolvedValue({ ok: true, json: async () => ({ total: 500, aides: [] }) })

    await aidesService.calculateAides(PROFILE)

    expect(global.fetch).toHaveBeenCalledTimes(1)
    const [url, options] = global.fetch.mock.calls[0]
    // In the browser the service goes through the Next rewrite, not the backend host.
    expect(url).toBe('/api/v1/aides/calculate')
    expect(options.method).toBe('POST')
    expect(options.headers).toMatchObject({ 'Content-Type': 'application/json' })
    expect(JSON.parse(options.body)).toEqual(PROFILE)
  })

  it('returns the parsed payload on success', async () => {
    const payload = { total: 1200, aides: [{ id: 'permis_1_euro', montant: 1200 }] }
    global.fetch.mockResolvedValue({ ok: true, json: async () => payload })

    await expect(aidesService.calculateAides(PROFILE)).resolves.toEqual(payload)
  })

  it('surfaces the backend error message when there is one', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({ message: 'Code postal invalide' }),
    })

    await expect(aidesService.calculateAides(PROFILE)).rejects.toThrow('Code postal invalide')
  })

  it('falls back to the status code when the error body has no message', async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) })

    await expect(aidesService.calculateAides(PROFILE)).rejects.toThrow('Erreur serveur: 500')
  })

  it('falls back to the status code when the error body is not JSON', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => {
        throw new SyntaxError('Unexpected token < in JSON')
      },
    })

    await expect(aidesService.calculateAides(PROFILE)).rejects.toThrow('Erreur serveur: 502')
  })

  it('propagates a network failure instead of swallowing it', async () => {
    global.fetch.mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(aidesService.calculateAides(PROFILE)).rejects.toThrow('Failed to fetch')
    expect(console.error).toHaveBeenCalled()
  })
})
