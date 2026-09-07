import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { LanguageProvider, useLanguage } from '@/app/context/LanguageContext'

const STORAGE_KEY = 'shift_app_lang'

const wrapper = ({ children }) => <LanguageProvider>{children}</LanguageProvider>

function renderLanguage() {
  return renderHook(() => useLanguage(), { wrapper })
}

describe('LanguageProvider', () => {
  it('starts in French and reports when hydration is done', async () => {
    const { result } = renderLanguage()

    expect(result.current.lang).toBe('fr')
    await waitFor(() => expect(result.current.isInitialized).toBe(true))
  })

  it('restores a previously chosen language', async () => {
    localStorage.setItem(STORAGE_KEY, 'en')

    const { result } = renderLanguage()

    await waitFor(() => expect(result.current.lang).toBe('en'))
  })

  it('ignores an unsupported stored language', async () => {
    localStorage.setItem(STORAGE_KEY, 'de')

    const { result } = renderLanguage()

    await waitFor(() => expect(result.current.isInitialized).toBe(true))
    expect(result.current.lang).toBe('fr')
  })

  it('persists a language change', async () => {
    const { result } = renderLanguage()
    await waitFor(() => expect(result.current.isInitialized).toBe(true))

    act(() => result.current.setLang('en'))

    expect(result.current.lang).toBe('en')
    expect(localStorage.getItem(STORAGE_KEY)).toBe('en')
  })

  it('rejects a language outside the supported set', async () => {
    const { result } = renderLanguage()
    await waitFor(() => expect(result.current.isInitialized).toBe(true))

    act(() => result.current.setLang('es'))

    expect(result.current.lang).toBe('fr')
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('still renders when localStorage is unavailable', async () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError')
    })
    vi.spyOn(console, 'warn').mockImplementation(() => {})

    const { result } = renderLanguage()

    await waitFor(() => expect(result.current.isInitialized).toBe(true))
    expect(result.current.lang).toBe('fr')
    getItem.mockRestore()
  })
})

describe('useLanguage', () => {
  it('fails loudly when used outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => renderHook(() => useLanguage())).toThrow(
      'useLanguage must be used within a LanguageProvider',
    )
  })
})
