import {
  CATEGORIE_PRET,
  SITUATIONS,
  buildAidesPayload,
  formatEuros,
  isPret,
  situationsForStatus,
} from '@/app/lib/aides-utils'

describe('buildAidesPayload', () => {
  it('envoie le code postal pour que le backend en déduise la région', () => {
    const payload = buildAidesPayload({ age: '20', postalCode: '93200', status: 'etudiant' })
    expect(payload).toMatchObject({ age: 20, statut: 'etudiant', code_postal: '93200' })
  })

  it('envoie chaque situation explicitement, cochée ou non', () => {
    const payload = buildAidesPayload({
      age: '30',
      postalCode: '75001',
      status: 'salarie',
      situations: { beneficiaire_rsa: true, secteur_btp: true },
    })
    for (const { field } of SITUATIONS) {
      expect(payload).toHaveProperty(field)
    }
    expect(payload.beneficiaire_rsa).toBe(true)
    expect(payload.secteur_btp).toBe(true)
    expect(payload.has_rqth).toBe(false)
    expect(payload.is_boursier).toBe(false)
  })

  it('tolère des situations absentes', () => {
    const payload = buildAidesPayload({ age: '18', postalCode: '31000', status: 'lyceen' })
    expect(SITUATIONS.every(({ field }) => payload[field] === false)).toBe(true)
  })
})

describe('situationsForStatus', () => {
  it('coche France Travail pour un demandeur d’emploi', () => {
    expect(situationsForStatus('chomeur', {})).toEqual({ inscrit_france_travail: true })
  })

  it('conserve les cases déjà cochées', () => {
    expect(situationsForStatus('chomeur', { beneficiaire_rsa: true })).toEqual({
      beneficiaire_rsa: true,
      inscrit_france_travail: true,
    })
  })

  it('ne touche à rien pour les autres statuts', () => {
    const current = { is_boursier: true }
    const next = situationsForStatus('etudiant', current)
    expect(next).toEqual(current)
    // Nouvel objet : l'état React ne doit jamais être muté en place.
    expect(next).not.toBe(current)
  })
})

describe('isPret', () => {
  it('reconnaît la catégorie prêt', () => {
    expect(isPret({ categorie: CATEGORIE_PRET })).toBe(true)
    expect(isPret({ categorie: 'Nationale' })).toBe(false)
    expect(isPret(null)).toBe(false)
  })
})

describe('formatEuros', () => {
  it('formate à la française, sans décimales', () => {
    // Intl insère une espace insécable (U+202F) comme séparateur de milliers.
    expect(formatEuros(1200).replace(/\s/g, ' ')).toBe('1 200 €')
    expect(formatEuros(500)).toBe('500 €')
  })
})

describe('SITUATIONS', () => {
  it('signale la RQTH comme donnée non conservée', () => {
    const rqth = SITUATIONS.find(({ field }) => field === 'has_rqth')
    expect(rqth.noteKey).toBeTruthy()
  })
})
