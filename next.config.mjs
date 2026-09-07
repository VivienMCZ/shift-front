/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV !== 'production'

/** Hosts that are served over plain HTTP on purpose. */
const LOCAL_HOST_PATTERN = '^(localhost|127\\.0\\.0\\.1|\\[::1\\]|::1)(:\\d+)?$'

/**
 * Content-Security-Policy (OWASP A03 / A05).
 *
 * 'unsafe-inline' is still required for scripts and styles: Next.js inlines its
 * bootstrap script and Tailwind emits inline style attributes. Tightening this
 * to a nonce needs middleware — tracked as follow-up work.
 *
 * `upgrade-insecure-requests` is deliberately NOT here: it would break plain
 * HTTP hosts. It is added below, per request, for everything but localhost.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "frame-src 'none'",
  "form-action 'self'",
  // wasm-unsafe-eval: the Spline runtime instantiates a WebAssembly module.
  // unsafe-eval is dev-only, for React Fast Refresh.
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://api.dicebear.com https://maps.googleapis.com https://images.unsplash.com",
  "font-src 'self' data:",
  // api-adresse: address autocomplete fallback. prod.spline.design: the 3D scene. gstatic: Draco 3D decoders.
  `connect-src 'self' https://api-adresse.data.gouv.fr https://prod.spline.design https://www.gstatic.com${isDev ? ' ws: wss:' : ''}`,
  "worker-src 'self' blob:",
  "manifest-src 'self'",
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  // Clickjacking, for user agents predating frame-ancestors.
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Geolocation is used by the address bar; nothing else is needed.
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), payment=(), usb=(), geolocation=(self)',
  },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
]

/**
 * HTTPS-only hardening.
 *
 * These must never reach a plain HTTP origin: HSTS would pin the browser to a
 * scheme the host does not serve, and `upgrade-insecure-requests` rewrites the
 * page's own requests to https://. NODE_ENV cannot make that call — a
 * production build is exactly what runs in the local container — so the
 * decision is made per request, on the Host header, at runtime.
 *
 * A second Content-Security-Policy header is additive: browsers enforce every
 * policy they receive, and one carrying only `upgrade-insecure-requests`
 * restricts nothing else.
 */
const httpsOnlyHeaders = [
  { key: 'Content-Security-Policy', value: 'upgrade-insecure-requests' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
]

const nextConfig = {
  reactCompiler: true,
  // Do not advertise the framework version (OWASP A05).
  poweredByHeader: false,

  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      {
        source: '/:path*',
        missing: [{ type: 'host', value: LOCAL_HOST_PATTERN }],
        headers: httpsOnlyHeaders,
      },
    ]
  },

  async rewrites() {
    const apiBaseUrl =
      process.env.INTERNAL_API_URL
      || process.env.NEXT_PUBLIC_API_URL
      || 'http://localhost:8000'
    const normalizedBase = apiBaseUrl.replace(/\/+$/, '')
    const hasApiPrefix = /\/api(?:\/v\d+)?$/.test(normalizedBase)

    const backendBase = hasApiPrefix ? normalizedBase.replace(/\/api(?:\/v\d+)?$/, '') : normalizedBase;

    return [
      {
        source: '/api/:path*',
        destination: hasApiPrefix
          ? `${normalizedBase}/:path*`
          : `${normalizedBase}/api/:path*`,
      },
      {
        source: '/auth/:path*',
        destination: `${backendBase}/auth/:path*`,
      },
    ]
  },
};

export default nextConfig;
