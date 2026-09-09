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
 */
export function Translate({ id }) {
  const { t } = useLanguage();

  return <>{t(id)}</>;
}
