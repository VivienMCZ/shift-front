"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/app/context/LanguageContext";

/**
 * ── Cache de traductions ──────────────────────────────────────────────────────
 *
 * Chaque <Translate> déclenchait sa propre requête HTTP. Une page comme
 * /comparer monte plus de 80 clés — rendues deux fois (arbre mobile + arbre
 * desktop) et répétées sur chaque carte — soit plusieurs centaines d'allers-
 * retours pour quelques dizaines de libellés distincts.
 *
 * Deux niveaux, tous deux transparents pour l'appelant (même URL, même
 * contrat, mêmes valeurs de repli) :
 *   1. `cache`    — clé déjà résolue : réponse immédiate, zéro requête.
 *   2. `inFlight` — même clé demandée par N composants au même instant :
 *                   ils partagent une seule requête au lieu de N.
 *
 * Volontairement en mémoire seulement, jamais dans sessionStorage. La quasi-
 * totalité des clés sont des littéraux du code, mais `compte/page.js` construit
 * `calculateur.status.${statut}` à partir du profil renvoyé par le backend :
 * persister le cache laisserait dans l'onglet une entrée dont le NOM encode le
 * statut de l'utilisateur. Or `logout()` navigue sans fermer l'onglet, et
 * sessionStorage y survivrait. Le gain de la persistance se limitait aux
 * rechargements complets, rares dans une SPA — le cache mémoire suffit,
 * puisqu'il survit aux navigations client.
 *
 * Uniquement côté navigateur : côté serveur, un cache au niveau du module
 * serait partagé entre toutes les requêtes de tous les visiteurs.
 */

/**
 * Bornes du cache (OWASP A04 — consommation de ressources non maîtrisée).
 *
 * `calculateur.status.${statut}` étant bâti sur une valeur backend, l'espace de
 * clés n'est pas contraint côté client. Le cache ne doit pas grandir avec ce
 * que renvoie le serveur : on plafonne le nombre d'entrées (éviction de la plus
 * ancienne, l'ordre d'insertion d'une Map étant garanti) et la taille d'une
 * valeur mémorisée. Au-delà, la traduction s'affiche toujours — elle n'est
 * simplement plus mémorisée.
 */
const MAX_ENTRIES = 500
const MAX_TEXT_LENGTH = 2000

const cache = new Map()
const inFlight = new Map()

const isBrowser = () => typeof window !== 'undefined'

/**
 * Identifiant d'entrée du cache.
 *
 * Le séparateur est un NUL : il n'apparaît ni dans une langue ni dans une clé
 * de traduction, donc deux couples (langue, clé) distincts ne peuvent pas
 * produire le même identifiant — y compris quand la clé est bâtie sur une
 * valeur venue du backend, qui pourrait contenir n'importe quel caractère
 * imprimable.
 */
const SEPARATOR = '\u0000'

const entryId = (key, lang) => `${lang}${SEPARATOR}${key}`

/** Mémorise un texte si — et seulement si — il tient dans les bornes du cache. */
function rememberText(id, text) {
  if (typeof text !== 'string' || text.length > MAX_TEXT_LENGTH) return false

  if (cache.size >= MAX_ENTRIES && !cache.has(id)) {
    const oldest = cache.keys().next()
    if (!oldest.done) cache.delete(oldest.value)
  }

  cache.set(id, text)
  return true
}

/** Vide le cache — utilisé par les tests pour isoler chaque cas. */
export function resetTranslationCache() {
  cache.clear()
  inFlight.clear()
}

/**
 * Requête réseau brute. Renvoie la clé elle-même en cas d'échec, pour que
 * l'interface affiche quelque chose plutôt que du vide.
 */
async function requestTextByKey(key, lang) {
  try {
    let baseUrl = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '');

    const response = await fetch(`${baseUrl}/api/v1/libs/${encodeURIComponent(key)}/translate?lang=${encodeURIComponent(lang)}`);
    if (!response.ok) {
      console.error(`[Erreur Traduction] L'API a répondu ${response.status} pour la clé: ${key}`);
      return key;
    }
    const data = await response.json();
    return data.text || key;
  } catch (error) {
    console.error(`[Erreur Traduction] Erreur réseau/CORS pour la clé "${key}":`, error);
    return key;
  }
}

/**
 * Fonction pour récupérer unitairement UN texte depuis la BDD via son libellé
 * en ciblant uniquement la langue choisie via la nouvelle route backend.
 */
export async function fetchTextByKey(key, lang = 'fr') {
  if (!isBrowser()) return requestTextByKey(key, lang)

  const id = entryId(key, lang)

  const cached = cache.get(id)
  if (cached !== undefined) return cached

  const pending = inFlight.get(id)
  if (pending) return pending

  const request = requestTextByKey(key, lang).then((text) => {
    inFlight.delete(id)
    // Un échec renvoie la clé : on ne le mémorise pas, sinon une coupure
    // réseau passagère figerait les libellés bruts pour toute la session.
    if (text !== key) rememberText(id, text)
    return text
  })

  inFlight.set(id, request)
  return request
}

/**
 * Composant React pour afficher dynamiquement le texte asynchrone depuis l'API.
 */
export function Translate({ id, lang: propLang }) {
  const [text, setText] = useState(id);
  const { lang: contextLang, isInitialized } = useLanguage();
  const lang = propLang || contextLang;

  useEffect(() => {
    let isMounted = true;
    if (isInitialized) {
      // Une clé déjà résolue revient du cache sans requête réseau : le composant
      // n'a rien de particulier à faire. (On ne pré-remplit pas `useState` avec
      // le cache : le HTML rendu côté serveur contient la clé, y diverger dès le
      // premier rendu casserait l'hydratation.)
      fetchTextByKey(id, lang).then((result) => {
        if (isMounted && result !== id) setText(result);
      });
    }
    return () => { isMounted = false; };
  }, [id, lang, isInitialized]);

  return <>{text}</>;
}
