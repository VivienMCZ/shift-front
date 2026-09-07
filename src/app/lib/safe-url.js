/**
 * Guard for URLs that come from the backend and end up in an `href`.
 *
 * Without it, a stored `javascript:` or `data:` URL turns a plain link into
 * script execution on click (OWASP A03 — injection / DOM XSS).
 */

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:'])

/** Returns the URL when it is safe to link to, otherwise `undefined`. */
export function safeExternalUrl(url) {
  if (typeof url !== 'string') return undefined

  const trimmed = url.trim()
  if (!trimmed) return undefined

  // A relative URL stays inside the app and cannot carry a protocol.
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return trimmed

  try {
    const parsed = new URL(trimmed)
    return ALLOWED_PROTOCOLS.has(parsed.protocol) ? trimmed : undefined
  } catch {
    return undefined
  }
}
