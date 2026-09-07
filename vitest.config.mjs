import { fileURLToPath } from 'node:url'
import { defineConfig, transformWithOxc } from 'vite'
import react from '@vitejs/plugin-react'

const SOURCE_RE = /[\\/](src|tests)[\\/].*\.jsx?$/
const LOOKS_LIKE_JSX_RE = /<[A-Za-z][\w.]*[\s/>]|<>/

/**
 * Next.js accepts JSX inside plain `.js` files; Vite 8 does not — its oxc
 * transform excludes `.js` outright and infers the parser from the extension.
 * This runs before the react plugin and parses our own `.js` files as JSX.
 */
const jsxInJsFiles = {
  name: 'shift:jsx-in-js',
  enforce: 'pre',
  async transform(code, id) {
    const [filepath] = id.split('?')
    if (!SOURCE_RE.test(filepath) || !LOOKS_LIKE_JSX_RE.test(code)) return null

    return transformWithOxc(code, filepath, {
      lang: 'jsx',
      jsx: { runtime: 'automatic', importSource: 'react' },
    })
  },
}

export default defineConfig({
  plugins: [jsxInJsFiles, react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.js'],
    include: ['tests/**/*.test.js'],
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      // lcov is what the Sonar scanner reads (sonar.javascript.lcov.reportPaths).
      reporter: ['text-summary', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.js'],
      exclude: ['src/app/layout.js', 'src/app/**/page.js', 'src/app/lib/glass-styles.js'],
    },
  },
})
