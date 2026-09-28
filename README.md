# Notation Ciné

Application React/Vite déployée sur Vercel. Les routes `api/` gèrent notamment la session OAuth Google et nécessitent le runtime Vercel.

## Développement local

1. Installer les dépendances avec `npm install`.
2. Se connecter une fois au compte Vercel depuis ce dossier avec `npx vercel login`, puis associer le projet avec `npx vercel link`.
3. Dans Vercel, configurer les variables d'environnement **Development** nécessaires à l'authentification et à l'application, puis lancer `npm run dev`.
4. Ouvrir `http://localhost:5173`.

`npm run dev` lance Vercel localement pour que les routes `/api/*` fonctionnent en même temps que l'interface Vite. Vercel CLI récupère les variables Development du projet. Les identifiants Google doivent autoriser `http://localhost:5173` parmi les origines JavaScript.

Variables serveur requises en Development : `POSTGRES_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` et `OAUTH_TOKEN_ENCRYPTION_KEY`. L'interface utilise aussi `VITE_GOOGLE_CLIENT_ID` et `VITE_TMDB_API_KEY`. Utiliser une base Neon de développement distincte de la production afin que les essais locaux ne modifient pas les sessions de production.

`npm run dev:vite` lance uniquement le serveur Vite, sans les fonctions API Vercel. La connexion persistante Google ne fonctionnera donc pas avec cette commande.

## Vérifications

- `npm run lint`
- `npm run build`
