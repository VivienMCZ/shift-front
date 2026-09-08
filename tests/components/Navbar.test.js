import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Navbar from '@/app/components/Navbar'
import { LanguageProvider } from '@/app/context/LanguageContext'

const usePathname = vi.hoisted(() => vi.fn(() => '/'))
const useAuth = vi.hoisted(() => vi.fn(() => ({ user: null, loading: false })))

vi.mock('next/navigation', () => ({ usePathname }))
vi.mock('@/app/context/AuthContext', () => ({ useAuth }))

/** Framer Motion's layout animations are noise here, and jsdom cannot run them. */
// La Navbar utilise les composants légers `m.*` : le moteur d'animation est
// chargé à la demande par MotionProvider, absent de ce rendu isolé.
vi.mock('framer-motion', () => ({
  LayoutGroup: ({ children }) => children,
  m: new Proxy({}, { get: () => ({ children, ...props }) => <span {...props}>{children}</span> }),
}))

function renderNavbar() {
  return render(
    <LanguageProvider>
      <Navbar />
    </LanguageProvider>,
  )
}

/** The desktop <header> and the mobile nav both render the links; scope to the first. */
function mainNav() {
  return screen.getAllByRole('navigation', { name: 'Navigation principale' })[0]
}

beforeEach(() => {
  usePathname.mockReturnValue('/')
  useAuth.mockReturnValue({ user: null, loading: false })
  // Every label goes through <Translate>, which hits the translation endpoint.
  global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ text: 'Libellé' }) })
})

afterEach(() => {
  delete global.fetch
})

describe('Navbar', () => {
  it('renders the three main destinations', () => {
    renderNavbar()

    const nav = mainNav()
    expect(within(nav).getByRole('link', { name: /comparer|Libellé/i })).toBeInTheDocument()
    expect(within(nav).getAllByRole('link')).toHaveLength(3)
  })

  it('sends an anonymous visitor to the sign-in page', () => {
    renderNavbar()

    const hrefs = within(mainNav()).getAllByRole('link').map((link) => link.getAttribute('href'))
    expect(hrefs).toContain('/auth')
    expect(hrefs).not.toContain('/compte')
  })

  it('sends a signed-in user to their account', () => {
    useAuth.mockReturnValue({ user: { id: 1 }, loading: false })

    renderNavbar()

    const hrefs = within(mainNav()).getAllByRole('link').map((link) => link.getAttribute('href'))
    expect(hrefs).toContain('/compte')
    expect(hrefs).not.toContain('/auth')
  })

  it('marks the current route as the active page', () => {
    usePathname.mockReturnValue('/comparer')

    renderNavbar()

    const active = within(mainNav()).getAllByRole('link').filter((l) => l.getAttribute('aria-current') === 'page')
    expect(active).toHaveLength(1)
    expect(active[0]).toHaveAttribute('href', '/comparer')
  })

  it('marks a parent route as active on a nested page', () => {
    usePathname.mockReturnValue('/compte/comparateur')
    useAuth.mockReturnValue({ user: { id: 1 }, loading: false })

    renderNavbar()

    const active = within(mainNav()).getAllByRole('link').filter((l) => l.getAttribute('aria-current') === 'page')
    expect(active[0]).toHaveAttribute('href', '/compte')
  })

  it('marks nothing as active on the home page', () => {
    usePathname.mockReturnValue('/')

    renderNavbar()

    const active = within(mainNav()).getAllByRole('link').filter((l) => l.getAttribute('aria-current') === 'page')
    expect(active).toHaveLength(0)
  })

  it('switches the language and remembers the choice', async () => {
    const user = userEvent.setup()
    renderNavbar()

    await user.click(screen.getAllByRole('button', { name: 'EN' })[0])

    await waitFor(() => expect(localStorage.getItem('shift_app_lang')).toBe('en'))
  })
})
