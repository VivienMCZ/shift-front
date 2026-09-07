import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LanguageProvider } from '@/app/context/LanguageContext'
import { Translate, fetchTextByKey } from '@/app/calculateur-aides/translation'

const okResponse = (text) => ({ ok: true, json: async () => ({ text }) })

function renderTranslated(ui) {
  return render(<LanguageProvider>{ui}</LanguageProvider>)
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  global.fetch = vi.fn()
})

afterEach(() => {
  delete global.fetch
})

describe('fetchTextByKey', () => {
  it('calls the translation endpoint for the requested key and language', async () => {
    global.fetch.mockResolvedValue(okResponse('Bonjour'))

    await fetchTextByKey('hero.title.part1', 'fr')

    expect(global.fetch).toHaveBeenCalledWith('/api/v1/libs/hero.title.part1/translate?lang=fr')
  })

  it('defaults to French when no language is given', async () => {
    global.fetch.mockResolvedValue(okResponse('Bonjour'))

    await fetchTextByKey('hero.title.part1')

    expect(global.fetch).toHaveBeenCalledWith('/api/v1/libs/hero.title.part1/translate?lang=fr')
  })

  it('returns the translated text', async () => {
    global.fetch.mockResolvedValue(okResponse('Find the best driving school'))

    await expect(fetchTextByKey('hero.title.part1', 'en')).resolves.toBe('Find the best driving school')
  })

  // Regression guard: when the backend is unreachable the UI used to render raw
  // keys such as "hero.title.part1" instead of any text at all.
  it('falls back to the key when the API answers with an error status', async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) })

    await expect(fetchTextByKey('hero.title.part1', 'fr')).resolves.toBe('hero.title.part1')
  })

  it('falls back to the key when the request fails outright', async () => {
    global.fetch.mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(fetchTextByKey('hero.title.part1', 'fr')).resolves.toBe('hero.title.part1')
  })

  it('falls back to the key when the payload carries no text', async () => {
    global.fetch.mockResolvedValue(okResponse(''))

    await expect(fetchTextByKey('hero.title.part1', 'fr')).resolves.toBe('hero.title.part1')
  })
})

describe('<Translate>', () => {
  it('replaces the key with the translated text', async () => {
    global.fetch.mockResolvedValue(okResponse('Trouvez la meilleure auto-école'))

    renderTranslated(<Translate id="hero.title.part1" />)

    await waitFor(() => {
      expect(screen.getByText('Trouvez la meilleure auto-école')).toBeInTheDocument()
    })
    expect(screen.queryByText('hero.title.part1')).not.toBeInTheDocument()
  })

  it('keeps showing the key when the translation cannot be fetched', async () => {
    global.fetch.mockRejectedValue(new TypeError('Failed to fetch'))

    renderTranslated(<Translate id="hero.title.part1" />)

    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
    expect(screen.getByText('hero.title.part1')).toBeInTheDocument()
  })

  it('uses the language from the context', async () => {
    localStorage.setItem('shift_app_lang', 'en')
    global.fetch.mockResolvedValue(okResponse('Find the best driving school'))

    renderTranslated(<Translate id="hero.title.part1" />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/v1/libs/hero.title.part1/translate?lang=en')
    })
  })

  it('lets an explicit lang prop win over the context', async () => {
    localStorage.setItem('shift_app_lang', 'en')
    global.fetch.mockResolvedValue(okResponse('Bonjour'))

    renderTranslated(<Translate id="hero.title.part1" lang="fr" />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/v1/libs/hero.title.part1/translate?lang=fr')
    })
  })

  it('refetches when the key changes', async () => {
    global.fetch.mockResolvedValue(okResponse('Texte'))

    const { rerender } = renderTranslated(<Translate id="hero.title.part1" />)
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1))

    rerender(
      <LanguageProvider>
        <Translate id="hero.title.part2" />
      </LanguageProvider>,
    )

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/v1/libs/hero.title.part2/translate?lang=fr')
    })
  })
})
