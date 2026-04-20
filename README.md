# GreenChat - messagerie email-only chiffree

Application de messagerie locale, code original, avec identite par email uniquement. Aucun numero de telephone n'est demande.

## Fonctionnalites

- deverrouillage par email + phrase secrete;
- coffre local chiffre avec Web Crypto `AES-GCM`;
- cle derivee par `PBKDF2-SHA256`;
- discussions avec messages entrants/sortants;
- recherche par email, alias ou message;
- filtres: tous, non lus, groupes, favoris;
- statuts, appels et channels simules;
- creation de contact ou groupe par email;
- appels audio/video simules;
- message vocal simule;
- pieces jointes simulees;
- panneau d'informations contact;
- favoris, media locaux et journal d'appel.

## Confidentialite

Les donnees sont chiffrees avant stockage dans le navigateur. L'app ne demande pas de numero et ne communique avec aucun serveur applicatif dans cette version statique GitHub Pages.

Pour une vraie messagerie multi-utilisateur en temps reel, il faudra ajouter un backend avec authentification email, stockage de messages chiffres, synchronisation temps reel et echange de cles de bout en bout.

## Ouvrir

Double-cliquer sur `index.html`, ou ouvrir le site GitHub Pages.

## Fichiers

- `index.html`: structure de l'application.
- `styles.css`: interface responsive.
- `app.js`: chiffrement, etat local, rendu, interactions et persistance.
