import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CalculatorForm from '@/app/components/Calculator/CalculatorForm'
import { LanguageProvider, resetDictionaryCache } from '@/app/context/LanguageContext'

/**
 * Le formulaire d'aides est un parcours métier complet et n'avait aucun test.
 * On vérifie ici qu'il remonte fidèlement le profil saisi — c'est ce profil qui
 * part au calculateur, une erreur ici fausse toute l'estimation.
 *
 * `LanguageProvider` charge le dictionnaire au montage : on mocke `fetch` pour
 * lui renvoyer un dictionnaire vide (les libellés s'affichent alors sous forme
 * de clé, ce qui suffit à les localiser).
 */
beforeEach(() => {
  resetDictionaryCache()
  global.fetch = vi.fn(async () => ({ ok: true, json: async () => ({}) }))
})

/** Profil minimal, piloté par le test via une capture des mises à jour. */
const profilInitial = {
  age: 18,
  region: '',
  statut: 'etudiant',
  has_rqth: false,
  is_boursier: false,
  inscrit_france_travail: false,
  beneficiaire_rsa: false,
  en_formation_qualifiante: false,
}

/**
 * Rend le formulaire avec un état réel : `setProfile` applique la mise à jour,
 * comme le ferait la page. On peut ainsi enchaîner plusieurs interactions.
 */
function renderForm({ onCalculate = vi.fn(), loading = false } = {}) {
  let profile = { ...profilInitial }
  const setProfile = vi.fn((next) => {
    profile = typeof next === 'function' ? next(profile) : next
    rerender()
  })
  const ui = () => (
    <LanguageProvider>
      <CalculatorForm
        profile={profile}
        setProfile={setProfile}
        onCalculate={onCalculate}
        loading={loading}
      />
    </LanguageProvider>
  )
  const { rerender: baseRerender } = render(ui())
  function rerender() {
    baseRerender(ui())
  }
  return { onCalculate, setProfile, getProfile: () => profile }
}

describe('CalculatorForm', () => {
  it('remonte l’âge saisi comme un nombre', async () => {
    const user = userEvent.setup()
    const { getProfile } = renderForm()

    const age = screen.getByRole('spinbutton')
    await user.clear(age)
    await user.type(age, '25')

    expect(getProfile().age).toBe(25)
  })

  it('remonte la région choisie', async () => {
    const user = userEvent.setup()
    const { getProfile } = renderForm()

    await user.selectOptions(screen.getAllByRole('combobox')[0], 'Bretagne')

    expect(getProfile().region).toBe('Bretagne')
  })

  it('bascule un critère spécifique sur Oui puis sur Non', async () => {
    const user = userEvent.setup()
    const { getProfile } = renderForm()

    // Premier critère de la liste : RQTH. Chaque critère a un couple Oui/Non.
    const oui = screen.getAllByRole('button', { name: /calculator_form\.btn\.yes/ })[0]
    await user.click(oui)
    expect(getProfile().has_rqth).toBe(true)

    const non = screen.getAllByRole('button', { name: /calculator_form\.btn\.no/ })[0]
    await user.click(non)
    expect(getProfile().has_rqth).toBe(false)
  })

  it('déclenche le calcul au clic sur le bouton d’estimation', async () => {
    const user = userEvent.setup()
    const { onCalculate } = renderForm()

    await user.click(screen.getByRole('button', { name: /calculator_form\.btn\.estimate/ }))

    expect(onCalculate).toHaveBeenCalledTimes(1)
  })

  it('désactive le bouton pendant le calcul', () => {
    renderForm({ loading: true })

    const bouton = screen.getByRole('button', { name: /calculator_form\.btn\.calculating/ })
    expect(bouton).toBeDisabled()
  })

  it('propose les treize régions plus l’option vide', () => {
    renderForm()

    const region = screen.getAllByRole('combobox')[0]
    // 13 régions + l'entrée « choisir une région ».
    expect(within(region).getAllByRole('option')).toHaveLength(14)
  })
})
