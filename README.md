# GreenChat - messagerie email-only chiffree

Application de messagerie locale, code original, avec identite par email uniquement. Aucun numero de telephone n'est demande.

## Fonctionnalites

- deverrouillage par email + phrase secrete;
- coffre local chiffre avec Web Crypto `AES-GCM`;
- cle derivee par `PBKDF2-SHA256`;
- cle d'identite locale `ECDH-P256` pour chiffrer les messages envoyes a un pair;
- backend optionnel HTTP + Server-Sent Events pour le temps reel;
- le serveur ne stocke que des enveloppes chiffrees et des cles publiques;
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

Avec le backend optionnel, le serveur voit seulement des identifiants derives de l'email, des cles publiques et des enveloppes chiffrees. Le texte clair reste cote navigateur.

Cette version est un prototype E2EE: elle ne gere pas encore verification forte d'identite, rotation de cles, groupes E2EE complets, anti-spam, recuperation de compte, notifications push natives, ni moderation abusive.

## Ouvrir

Double-cliquer sur `index.html`, ou ouvrir le site GitHub Pages.

## Backend temps reel

Le backend n'a aucune dependance externe.

```bash
npm start
```

Par defaut il ecoute sur `http://localhost:8787`.

Routes principales:

- `GET /health`
- `POST /api/register`
- `GET /api/users/:userId/public-key`
- `POST /api/messages`
- `GET /api/messages/:userId`
- `GET /api/events/:userId`

Pour connecter le frontend:

1. Deverrouiller GreenChat avec email + phrase secrete.
2. Aller dans `Reglages`.
3. Renseigner l'URL du backend, par exemple `http://localhost:8787`.
4. Cliquer sur `Connecter`.

Pour un deploiement public, deployer le serveur Node sur une plateforme qui accepte les connexions longues SSE, puis renseigner son URL HTTPS dans les reglages de l'app GitHub Pages.

## Fichiers

- `index.html`: structure de l'application.
- `styles.css`: interface responsive.
- `app.js`: chiffrement, etat local, rendu, interactions et persistance.
- `server/greenchat-server.cjs`: backend HTTP/SSE de synchronisation d'enveloppes chiffrees.
