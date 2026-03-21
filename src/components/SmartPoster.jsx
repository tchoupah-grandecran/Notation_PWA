import { useState, useEffect } from 'react';
import { getMissingPosterFromTMDB } from '../api';

/**
 * Affiche une affiche de film.
 * Si l'URL fournie est invalide, tente de la récupérer sur TMDB via le titre.
 */
export function SmartPoster({ afficheInitiale, titre, className = 'w-20 h-full' }) {
  const [posterUrl, setPosterUrl] = useState(null);

  useEffect(() => {
    const hasValidUrl =
      typeof afficheInitiale === 'string' && afficheInitiale.startsWith('http');

    if (hasValidUrl) {
      setPosterUrl(afficheInitiale);
    } else if (titre) {
      getMissingPosterFromTMDB(titre).then((url) => {
        if (url) setPosterUrl(url);
      });
    }
  }, [afficheInitiale, titre]);

  return (
    <div className={`${className} bg-white/10 flex-shrink-0 relative overflow-hidden`}>
      {posterUrl ? (
        <img
          src={posterUrl}
          alt={titre}
          className="w-full h-full object-cover animate-in fade-in duration-500"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-2xl opacity-50">
          🎬
        </div>
      )}
    </div>
  );
}