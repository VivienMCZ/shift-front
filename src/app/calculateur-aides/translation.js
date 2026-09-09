"use client";

import { useLanguage } from "@/app/context/LanguageContext";

/**
 * Affiche le libellé associé à `id` dans la langue courante.
 *
 * Purement synchrone : le dictionnaire complet est chargé une fois par le
 * `LanguageProvider` (voir `context/LanguageContext.js`). Ce composant ne
 * déclenche donc aucune requête et n'a aucun état propre — monter la même clé
 * cent fois ne coûte rien.
 *
 * Tant que le dictionnaire n'est pas arrivé, `t()` renvoie la clé : c'est aussi
 * ce que contient le HTML rendu côté serveur, l'hydratation reste alignée.
 *
 * `fallback` sert aux clés pas encore semées en base : le texte s'affiche
 * correctement dès maintenant, et cède la place à la traduction dès que la clé
 * existe. Sans lui, la clé brute resterait visible à l'écran.
 */
export function Translate({ id, fallback }) {
  const { t } = useLanguage();

  return <>{t(id, fallback ?? id)}</>;
}
