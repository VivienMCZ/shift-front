import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  CompteApiError,
  deleteAccount,
  deleteAideSave,
  exportAccountData,
  exportFileName,
  isPhoneTaken,
  profileChanges,
  updateProfile,
} from '@/services/compteService'

const reponse = (status, body) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
})

beforeEach(() => {
  global.fetch = vi.fn(async () => reponse(200, {}))
})

describe('appels d’API', () => {
  it('envoie toujours le cookie de session', async () => {
    await exportAccountData()
    expect(global.fetch).toHaveBeenCalledWith(
      '/auth/me/export',
      expect.objectContaining({ credentials: 'include' }),
    )
  })

  it('met à jour le profil en PUT JSON', async () => {
    global.fetch = vi.fn(async () => reponse(200, { first_name: 'Marie' }))
    expect(await updateProfile({ first_name: 'Marie' })).toEqual({ first_name: 'Marie' })

    const [url, options] = global.fetch.mock.calls[0]
    expect(url).toBe('/auth/me')
    expect(options.method).toBe('PUT')
    expect(JSON.parse(options.body)).toEqual({ first_name: 'Marie' })
  })

  it('supprime le compte et accepte un 204 sans corps', async () => {
    global.fetch = vi.fn(async () => ({ ok: true, status: 204, json: async () => { throw new Error('vide') } }))
    expect(await deleteAccount()).toBeNull()
    expect(global.fetch.mock.calls[0][1].method).toBe('DELETE')
  })

  it('encode l’identifiant d’une recherche dans l’URL', async () => {
    global.fetch = vi.fn(async () => ({ ok: true, status: 204 }))
    await deleteAideSave('12/../x')
    expect(global.fetch.mock.calls[0][0]).toBe('/api/v1/aides/saves/12%2F..%2Fx')
  })

  it('remonte le statut et le detail en cas d’échec', async () => {
    global.fetch = vi.fn(async () => reponse(400, { detail: 'Phone already registered' }))
    const erreur = await updateProfile({ phone: '0612345678' }).catch((e) => e)

    expect(erreur).toBeInstanceOf(CompteApiError)
    expect(erreur.status).toBe(400)
    expect(isPhoneTaken(erreur)).toBe(true)
  })

  it('résiste à un corps d’erreur illisible', async () => {
    global.fetch = vi.fn(async () => ({ ok: false, status: 502, json: async () => { throw new Error() } }))
    const erreur = await exportAccountData().catch((e) => e)
    expect(erreur.status).toBe(502)
    expect(isPhoneTaken(erreur)).toBe(false)
  })
})

describe('profileChanges', () => {
  const user = { first_name: 'Jean', last_name: 'Dupont', phone: null }

  it('ne renvoie que les champs modifiés', () => {
    expect(profileChanges(user, { first_name: 'Jean', last_name: 'Martin', phone: '' })).toEqual({
      last_name: 'Martin',
    })
  })

  it('ignore un nom vidé plutôt que d’envoyer une valeur refusée', () => {
    expect(profileChanges(user, { first_name: '  ', last_name: 'Dupont', phone: '' })).toEqual({})
  })

  it('envoie une chaîne vide pour retirer un téléphone existant', () => {
    const avecTel = { ...user, phone: '0612345678' }
    expect(profileChanges(avecTel, { first_name: 'Jean', last_name: 'Dupont', phone: '' })).toEqual({
      phone: '',
    })
  })

  it('retire les espaces autour des saisies', () => {
    expect(profileChanges(user, { first_name: ' Marie ', last_name: 'Dupont', phone: ' 0612345678 ' })).toEqual({
      first_name: 'Marie',
      phone: '0612345678',
    })
  })
})

describe('exportFileName', () => {
  it('date le fichier', () => {
    expect(exportFileName(new Date('2026-09-11T10:00:00Z'))).toBe('shift-mes-donnees-2026-09-11.json')
  })
})
