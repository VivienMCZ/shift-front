// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { safeExternalUrl } from '@/app/lib/safe-url'

describe('safeExternalUrl', () => {
  it('lets ordinary web links through untouched', () => {
    expect(safeExternalUrl('https://permis.gouv.fr/aide')).toBe('https://permis.gouv.fr/aide')
    expect(safeExternalUrl('http://example.test/a?b=c#d')).toBe('http://example.test/a?b=c#d')
  })

  it('allows mailto and tel links', () => {
    expect(safeExternalUrl('mailto:contact@shift.example')).toBe('mailto:contact@shift.example')
    expect(safeExternalUrl('tel:+33123456789')).toBe('tel:+33123456789')
  })

  it('allows an in-app relative path', () => {
    expect(safeExternalUrl('/comparer')).toBe('/comparer')
  })

  it('rejects script-bearing URLs', () => {
    expect(safeExternalUrl('javascript:alert(1)')).toBeUndefined()
    expect(safeExternalUrl('JavaScript:alert(1)')).toBeUndefined()
    expect(safeExternalUrl('  javascript:alert(1)  ')).toBeUndefined()
    expect(safeExternalUrl('java\tscript:alert(1)')).toBeUndefined()
  })

  it('rejects data and other unexpected protocols', () => {
    expect(safeExternalUrl('data:text/html,<script>alert(1)</script>')).toBeUndefined()
    expect(safeExternalUrl('vbscript:msgbox(1)')).toBeUndefined()
    expect(safeExternalUrl('file:///etc/passwd')).toBeUndefined()
  })

  it('rejects a protocol-relative URL, which is not a local path', () => {
    expect(safeExternalUrl('//evil.example/phish')).toBeUndefined()
  })

  it('rejects anything that is not a usable string', () => {
    expect(safeExternalUrl(undefined)).toBeUndefined()
    expect(safeExternalUrl(null)).toBeUndefined()
    expect(safeExternalUrl('')).toBeUndefined()
    expect(safeExternalUrl('   ')).toBeUndefined()
    expect(safeExternalUrl(42)).toBeUndefined()
    expect(safeExternalUrl({ href: 'https://example.test' })).toBeUndefined()
    expect(safeExternalUrl('pas une url du tout')).toBeUndefined()
  })
})
