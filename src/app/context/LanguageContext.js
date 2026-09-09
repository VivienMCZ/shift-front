'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const LanguageContext = createContext(null)

const STORAGE_KEY = 'shift_app_lang'
const SUPPORTED_LANGS = ['fr', 'en']
const DEFAULT_LANG = 'fr'

const API_URL = typeof window !== 'undefined'
  ? ''
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '')

/**
 * ── Dictionnaire de traductions ───────────────────────────────────────────────
 *
 * Un seul appel réseau par langue, au montage du provider :
 *
 *     GET /api/v1/libs/dictionary?lang=fr  ->  { "navbar.comparer": "Comparer", ... }
 *
 * Auparavant chaque <Translate> résolvait sa propre clé, une requête chacune.
 * /comparer monte 79 clés distinctes : le chargement des libellés saturait la
 * connexion et repoussait derrière lui le `fetch('/api/ecoles')` dont dépend
 * l'affichage réel de la page. Un cache mémoire mutualisait les doublons, mais
 * pas ce fan-out initial — seul le lot le supprime.
 *
 * La réponse est mise en cache HTTP par le backend (ETag) : les visites
 * suivantes se résolvent en 304, on ne force donc aucun mode de cache ici.
 *
 * Le cache mémoire ci-dessous couvre les aller-retours entre langues dans la
 * même session, et le double montage du provider en mode strict.
 *
 * Il n'a plus besoin d'être borné : sa taille est celle du dictionnaire servi,
 * décidée par le backend, et non plus fonction des clés que le client construit
 * à l'exécution (`calculateur.status.${statut}` était bâtie sur une valeur
 * renvoyée par l'API — l'espace de clés n'était pas contraint côté client).
 */

/** Dictionnaires résolus, par langue. */
const dictionaries = new Map()
/** Requêtes en vol, par langue : N provider montés ⇒ une seule requête. */
const inFlight = new Map()

/** Un dictionnaire absent ne bloque rien : `t()` renvoie alors la clé. */
const EMPTY_DICTIONARY = new Map()

/** Vide le cache — utilisé par les tests pour isoler chaque cas. */
export function resetDictionaryCache() {
  dictionaries.clear()
  inFlight.clear()
}

/**
 * Une `Map` plutôt que l'objet brut : les clés viennent en partie du backend
 * (`calculateur.status.${statut}`), et une lecture par indexation d'objet
 * exposerait les membres du prototype — `t('constructor')` renverrait une
 * fonction au lieu de la clé.
 */
async function requestDictionary(lang) {
  const response = await fetch(`${API_URL}/api/v1/libs/dictionary?lang=${encodeURIComponent(lang)}`)
  if (!response.ok) throw new Error(`l'API a répondu ${response.status}`)

  const payload = await response.json()
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('réponse inattendue')
  }

  return new Map(Object.entries(payload).filter(([, text]) => typeof text === 'string'))
}

function loadDictionary(lang) {
  const resolved = dictionaries.get(lang)
  if (resolved) return Promise.resolve(resolved)

  const pending = inFlight.get(lang)
  if (pending) return pending

  const request = requestDictionary(lang)
    .then((dictionary) => {
      dictionaries.set(lang, dictionary)
      return dictionary
    })
    .catch((error) => {
      // Un échec n'est pas mémorisé : une coupure passagère figerait sinon les
      // libellés bruts pour toute la session.
      console.error(`[i18n] Dictionnaire "${lang}" indisponible :`, error)
      return EMPTY_DICTIONARY
    })
    .finally(() => inFlight.delete(lang))

  inFlight.set(lang, request)
  return request
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(DEFAULT_LANG)
  const [isInitialized, setIsInitialized] = useState(false)
  const [dictionary, setDictionary] = useState(EMPTY_DICTIONARY)

  // Quelle langue ? Lue après le montage : le HTML rendu côté serveur ne
  // connaît pas localStorage, y diverger dès le premier rendu casserait
  // l'hydratation.
  useEffect(() => {
    try {
      const storedLang = localStorage.getItem(STORAGE_KEY)
      if (storedLang && SUPPORTED_LANGS.includes(storedLang)) {
        setLangState(storedLang)
      }
    } catch (error) {
      console.warn('Could not read language from localStorage', error)
    }
    setIsInitialized(true)
  }, [])

  useEffect(() => {
    if (!isInitialized) return undefined

    // Langue déjà chargée : posée sans repasser par le réseau ni par un rendu
    // intermédiaire où les libellés retomberaient sur leurs clés.
    const resolved = dictionaries.get(lang)
    if (resolved) {
      setDictionary(resolved)
      return undefined
    }

    let active = true
    loadDictionary(lang).then((next) => {
      if (active) setDictionary(next)
    })

    return () => {
      active = false
    }
  }, [isInitialized, lang])

  /**
   * Synchrone : pas de requête, pas d'état, pas de rendu par libellé.
   *
   * `fallback` couvre le temps de chargement du dictionnaire et les clés
   * absentes. Il vaut la clé par défaut — visible, donc un libellé oublié se
   * repère —, mais un appelant qui affiche du texte hors balise (un
   * `placeholder`, un `aria-label`) a intérêt à fournir mieux.
   */
  const t = useCallback((key, fallback = key) => dictionary.get(key) ?? fallback, [dictionary])

  const setLang = useCallback((newLang) => {
    if (!SUPPORTED_LANGS.includes(newLang)) return

    setLangState(newLang)
    try {
      localStorage.setItem(STORAGE_KEY, newLang)
    } catch (error) {
      console.warn('Could not save language to localStorage', error)
    }
  }, [])

  const value = useMemo(
    () => ({ lang, setLang, isInitialized, dictionary, t }),
    [lang, setLang, isInitialized, dictionary, t],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
