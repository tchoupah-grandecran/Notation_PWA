import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy local pour les images TMDB en développement.
      // Contourne les restrictions CORS du navigateur sans avoir besoin
      // de déployer la route Vercel /api/proxy-image.
      // Usage : fetch('/tmdb-proxy?url=https://image.tmdb.org/...')
      '/tmdb-proxy': {
        target: 'https://image.tmdb.org',
        changeOrigin: true,
        rewrite: (path) => {
          // Extrait l'URL cible du paramètre ?url=
          const match = path.match(/\?url=(.+)/);
          if (!match) return path;
          try {
            const targetUrl = new URL(decodeURIComponent(match[1]));
            // Ne retourner que le pathname+search de l'URL TMDB
            return targetUrl.pathname + targetUrl.search;
          } catch {
            return path;
          }
        },
      },
    },
  },
})