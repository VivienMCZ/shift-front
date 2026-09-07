/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV !== 'production'

/**
 * Content-Security-Policy (OWASP A03 / A05).
 *
 * 'unsafe-inline' is still required for scripts and styles: Next.js inlines its
 * bootstrap script and Tailwind emits inline style attributes. Tightening this
 * to a nonce needs middleware — tracked as follow-up work.
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
  "img-src 'self' data: blob: https://api.dicebear.com https://maps.googleapis.com",
  "font-src 'self' data:",
  // api-adresse: address autocomplete fallback. prod.spline.design: the 3D scene.
  `connect-src 'self' https://api-adresse.data.gouv.fr https://prod.spline.design${isDev ? ' ws: wss:' : ''}`,
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  ...(isDev ? [] : ['upgrade-insecure-requests']),
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
    value: 'camera=(), microphone=(), payment=(), usb=(), interest-cohort=(), geolocation=(self)',
  },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
  // Only meaningful over HTTPS, so it is left out of local development.
  ...(isDev
    ? []
    : [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]),
]

const nextConfig = {
  reactCompiler: true,
  // Do not advertise the framework version (OWASP A05).
  poweredByHeader: false,

  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
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
