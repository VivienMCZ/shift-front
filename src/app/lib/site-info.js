/**
 * Informations légales du site — **le seul fichier à compléter avant la mise
 * en production.**
 *
 * Les mentions légales (LCEN, art. 6 III), la politique de confidentialité
 * (RGPD, art. 13) et les CGU lisent toutes leurs coordonnées ici. Tant qu'une
 * valeur vaut `A_COMPLETER`, la page l'affiche telle quelle : un manque se voit
 * à l'écran au lieu de passer inaperçu.
 *
 * Rien de secret ici : tout ce fichier est destiné à être publié.
 */

export const A_COMPLETER = '[À compléter]'

export const SITE_NAME = 'Shift'

/**
 * URL publique du site, sans barre finale. Sert aux URL absolues du sitemap,
 * de robots.txt et des métadonnées. Lue au build : `sitemap.js` et `robots.js`
 * sont générés statiquement (ARG du Dockerfile, comme `INTERNAL_API_URL`).
 */
export const SITE_URL = (process.env.SITE_URL || 'http://localhost:3000').replace(/\/+$/, '')

/** Éditeur du site et responsable des traitements de données. */
export const EDITEUR = {
  // Personne physique : nom et prénom. Société : raison sociale et forme
  // juridique (SAS, SARL…), capital social.
  nom: A_COMPLETER,
  statut: A_COMPLETER,
  adresse: A_COMPLETER,
  // SIREN / RCS pour une société, SIRET pour un entrepreneur individuel.
  immatriculation: A_COMPLETER,
  directeurPublication: A_COMPLETER,
  email: A_COMPLETER,
}

/** Hébergeur du site et de l'API (LCEN : nom, adresse, téléphone). */
export const HEBERGEUR = {
  nom: A_COMPLETER,
  adresse: A_COMPLETER,
  telephone: A_COMPLETER,
}

/**
 * Durées de conservation annoncées dans la politique de confidentialité.
 *
 * Aucune purge automatique n'existe encore côté backend : un compte vit jusqu'à
 * sa suppression par son titulaire. La CNIL attend une durée bornée pour les
 * comptes inactifs (3 ans est l'usage) — l'annoncer ici suppose de l'implémenter.
 */
export const CONSERVATION = {
  compteInactif: A_COMPLETER,
  journauxTechniques: A_COMPLETER,
}

/** Date de dernière mise à jour affichée sur les pages légales. */
export const DERNIERE_MISE_A_JOUR = '11 septembre 2026'
