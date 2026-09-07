"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/app/context/LanguageContext";

/**
 * Fonction pour récupérer unitairement UN texte depuis la BDD via son libellé
 * en ciblant uniquement la langue choisie via la nouvelle route backend.
 */
export async function fetchTextByKey(key, lang = 'fr') {
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
 * Composant React pour afficher dynamiquement le texte asynchrone depuis l'API.
 */
export function Translate({ id, lang: propLang }) {
  const [text, setText] = useState(id);
  const { lang: contextLang, isInitialized } = useLanguage();
  const lang = propLang || contextLang;

  useEffect(() => {
    let isMounted = true;
    if (isInitialized) {
      fetchTextByKey(id, lang).then((result) => {
        if (isMounted && result !== id) setText(result);
      });
    }
    return () => { isMounted = false; };
  }, [id, lang, isInitialized]);

  return <>{text}</>;
}