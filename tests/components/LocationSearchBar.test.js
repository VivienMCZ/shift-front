import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import LocationSearchBar from '@/app/components/LocationSearchBar'

/**
 * La barre de recherche d'adresse concentre la logique la moins couverte du
 * front : debounce des saisies, bascule du proxy vers l'API publique en cas
 * d'échec, navigation clavier, sélection, effacement et géolocalisation.
 *
 * On isole le composant en simulant ses deux dépendances de contexte
 * (`useLocation`, `useUserLocation`) : ce qui est testé ici, c'est le
 * comportement propre de la barre, pas celui de ces hooks (couverts ailleurs).
 * `featureToLocation` / `formatFeatureLabel` restent réels — ils sont purs et
 * déjà testés, les remplacer masquerait le vrai câblage.
 */
const setLocation = vi.hoisted(() => vi.fn())
const clearLocation = vi.hoisted(() => vi.fn())
const fetchUserLocation = vi.hoisted(() => vi.fn())
const setGeoError = vi.hoisted(() => vi.fn())
const locationState = vi.hoisted(() => ({ value: null }))
const geoState = vi.hoisted(() => ({ loading: false, error: null }))

vi.mock('@/app/context/LocationContext', () => ({
  useLocation: () => ({ location: locationState.value, setLocation, clearLocation }),
}))
vi.mock('@/app/hooks/useUserLocation', () => ({
  useUserLocation: () => ({
    fetchUserLocation,
    loading: geoState.loading,
    error: geoState.error,
    setError: setGeoError,
  }),
}))

/** Feature au format Base Adresse Nationale : coordonnées [lng, lat]. */
const feature = (label, overrides = {}) => ({
  geometry: { type: 'Point', coordinates: [2.35, 48.85] },
  properties: { id: label, label, city: 'Paris', postcode: '75001', context: 'Paris', ...overrides },
})

/** Réponse fetch réussie portant une liste de features. */
const banResponse = (features) => ({ ok: true, json: async () => ({ features }) })

beforeEach(() => {
  locationState.value = null
  geoState.loading = false
  geoState.error = null
  global.fetch = vi.fn()
})

describe('LocationSearchBar', () => {
  it('ne lance aucune requête sous deux caractères', async () => {
    const user = userEvent.setup()
    render(<LocationSearchBar />)

    await user.type(screen.getByRole('combobox'), 'p')
    // Laisse passer le délai de debounce : aucune requête ne doit partir.
    await new Promise((r) => setTimeout(r, 400))

    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('interroge le proxy après le debounce et affiche les suggestions', async () => {
    global.fetch.mockResolvedValue(banResponse([feature('Paris'), feature('Paris 12e')]))
    const user = userEvent.setup()
    render(<LocationSearchBar />)

    await user.type(screen.getByRole('combobox'), 'paris')

    expect(await screen.findAllByRole('option')).toHaveLength(2)
    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(global.fetch.mock.calls[0][0]).toContain('/api/locations/search?q=paris')
  })

  it('bascule sur l’API publique quand le proxy échoue', async () => {
    global.fetch
      .mockResolvedValueOnce({ ok: false, status: 502, json: async () => ({}) }) // proxy KO
      .mockResolvedValueOnce(banResponse([feature('Lyon')]))                       // BAN OK
    const user = userEvent.setup()
    render(<LocationSearchBar />)

    await user.type(screen.getByRole('combobox'), 'lyon')

    expect(await screen.findByRole('option')).toBeInTheDocument()
    expect(global.fetch).toHaveBeenCalledTimes(2)
    // Le premier appel vise le proxy, le second l'API publique de repli.
    expect(global.fetch.mock.calls[0][0]).toContain('/api/locations/search')
    expect(global.fetch.mock.calls[1][0]).toContain('api-adresse.data.gouv.fr')
  })

  it('sélectionne une suggestion au clic et pose la localisation', async () => {
    global.fetch.mockResolvedValue(banResponse([feature('Paris')]))
    const user = userEvent.setup()
    render(<LocationSearchBar />)

    await user.type(screen.getByRole('combobox'), 'paris')
    await screen.findByRole('option')
    // Le handler de sélection est sur le bouton interne (onMouseDown), pas sur le <li>.
    await user.click(within(screen.getByRole('option')).getByRole('button'))

    expect(setLocation).toHaveBeenCalledTimes(1)
    // La localisation posée porte bien les coordonnées de la feature choisie.
    expect(setLocation.mock.calls[0][0]).toMatchObject({ lat: 48.85, lng: 2.35 })
    // La liste se referme après sélection.
    expect(screen.queryByRole('option')).not.toBeInTheDocument()
  })

  it('sélectionne au clavier : flèche bas puis Entrée', async () => {
    global.fetch.mockResolvedValue(banResponse([feature('Paris'), feature('Reims')]))
    const user = userEvent.setup()
    render(<LocationSearchBar />)

    const input = screen.getByRole('combobox')
    await user.type(input, 'par')
    expect(await screen.findAllByRole('option')).toHaveLength(2)

    // La première option est active par défaut ; on descend sur la seconde.
    await user.keyboard('{ArrowDown}{Enter}')

    expect(setLocation).toHaveBeenCalledTimes(1)
    expect(setLocation.mock.calls[0][0]).toMatchObject({ city: 'Paris' })
  })

  it('signale l’absence de résultat', async () => {
    global.fetch.mockResolvedValue(banResponse([]))
    const user = userEvent.setup()
    render(<LocationSearchBar />)

    await user.type(screen.getByRole('combobox'), 'zzzzz')

    expect(await screen.findByText(/aucune adresse trouvée/i)).toBeInTheDocument()
  })

  it('affiche une erreur quand les deux sources échouent', async () => {
    global.fetch
      .mockResolvedValueOnce({ ok: false, status: 502, json: async () => ({}) })
      .mockRejectedValueOnce(new Error('direct_failed'))
    const user = userEvent.setup()
    render(<LocationSearchBar />)

    await user.type(screen.getByRole('combobox'), 'paris')

    expect(await screen.findByText(/erreur lors de la recherche/i)).toBeInTheDocument()
  })

  it('efface la saisie et la localisation', async () => {
    const user = userEvent.setup()
    render(<LocationSearchBar />)

    const input = screen.getByRole('combobox')
    await user.type(input, 'paris')
    await user.click(screen.getByRole('button', { name: /effacer l'adresse/i }))

    expect(clearLocation).toHaveBeenCalled()
    expect(input).toHaveValue('')
  })

  it('déclenche la géolocalisation et pose la position obtenue', async () => {
    fetchUserLocation.mockResolvedValue({ city: 'Nantes', lat: 47.2, lng: -1.5 })
    const user = userEvent.setup()
    render(<LocationSearchBar />)

    await user.click(screen.getByRole('button', { name: /utiliser ma position actuelle/i }))

    await waitFor(() => expect(setLocation).toHaveBeenCalledWith({ city: 'Nantes', lat: 47.2, lng: -1.5 }))
  })

  it('ne pose rien si la géolocalisation échoue', async () => {
    fetchUserLocation.mockResolvedValue(null)
    const user = userEvent.setup()
    render(<LocationSearchBar />)

    await user.click(screen.getByRole('button', { name: /utiliser ma position actuelle/i }))

    await waitFor(() => expect(fetchUserLocation).toHaveBeenCalled())
    expect(setLocation).not.toHaveBeenCalled()
  })

  it('pré-remplit le champ depuis une localisation déjà connue', () => {
    locationState.value = { displayLabel: 'Bordeaux, 33000', city: 'Bordeaux' }
    render(<LocationSearchBar />)

    expect(screen.getByRole('combobox')).toHaveValue('Bordeaux, 33000')
  })
})
