// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { isActivePath } from '@/app/lib/nav-utils'

describe('isActivePath', () => {
  it('matches the exact route', () => {
    expect(isActivePath('/comparer', '/comparer')).toBe(true)
  })

  it('matches a nested route', () => {
    expect(isActivePath('/compte/comparateur', '/compte')).toBe(true)
    expect(isActivePath('/ecoles/42', '/ecoles')).toBe(true)
  })

  it('does not match a route that merely shares a prefix', () => {
    expect(isActivePath('/comparateur', '/comparer')).toBe(false)
    expect(isActivePath('/comparerXYZ', '/comparer')).toBe(false)
  })

  it('only highlights home on home itself', () => {
    expect(isActivePath('/', '/')).toBe(true)
    expect(isActivePath('/comparer', '/')).toBe(false)
  })

  it('is falsy when the pathname is not known yet', () => {
    expect(isActivePath(undefined, '/comparer')).toBeFalsy()
    expect(isActivePath(null, '/comparer')).toBeFalsy()
  })
})
