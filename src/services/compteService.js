/**
 * Client d'API de l'espace compte : rectification, export et effacement (RGPD).
 *
 * URL relatives, proxifiées par le rewrite de `next.config.mjs` ; le cookie de
 * session part avec `credentials: 'include'`. Rien de ce module n'est mis en
 * cache : ce sont des données personnelles, que le backend sert d'ailleurs en
 * `private, no-store`.
 */

/** Erreur d'API portant le statut HTTP et le `detail` renvoyé par FastAPI. */
export class CompteApiError extends Error {
  constructor(status, detail) {
    super(typeof detail === 'string' ? detail : `Erreur ${status}`)
    this.status = status
    this.detail = detail
  }
}

async function request(url, options = {}) {
  const response = await fetch(url, { credentials: 'include', ...options })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new CompteApiError(response.status, body.detail)
  }
  return response.status === 204 ? null : response.json()
}

/**
 * Met à jour le profil. Seuls les champs présents sont modifiés ; une chaîne
 * vide pour `phone` retire le numéro.
 */
export function updateProfile(fields) {
  return request('/auth/me', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  })
}

export function exportAccountData() {
  return request('/auth/me/export')
}

export function deleteAccount() {
  return request('/auth/me', { method: 'DELETE' })
}

export function deleteAideSave(saveId) {
  return request(`/api/v1/aides/saves/${encodeURIComponent(saveId)}`, { method: 'DELETE' })
}

/** Le backend répond ce `detail` quand le numéro appartient à un autre compte. */
export function isPhoneTaken(error) {
  return error instanceof CompteApiError && error.detail === 'Phone already registered'
}

/** Nom du fichier d'export : daté, pour ne pas écraser un export précédent. */
export function exportFileName(date = new Date()) {
  return `shift-mes-donnees-${date.toISOString().slice(0, 10)}.json`
}

/**
 * Champs modifiés par rapport au profil courant, prêts à envoyer.
 *
 * Un nom vidé est ignoré plutôt qu'envoyé : le backend le refuserait (422) et
 * l'utilisateur perdrait aussi ses autres modifications. Le téléphone, lui, est
 * facultatif : le vider est une demande de retrait, envoyée en `""`.
 */
export function profileChanges(user, form) {
  const changes = {}
  for (const field of ['first_name', 'last_name']) {
    const value = (form[field] ?? '').trim()
    if (value && value !== user[field]) changes[field] = value
  }
  const phone = (form.phone ?? '').trim()
  if (phone !== (user.phone ?? '')) changes.phone = phone
  return changes
}
