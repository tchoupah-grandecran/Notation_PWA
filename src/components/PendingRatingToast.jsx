import React from 'react';
import { Ticket } from 'lucide-react';

const PendingRatingToast = ({ film, onOpen }) => {
  if (!film) return null;

  // Utilisation du proxy pour l'affiche
  const posterUrl = film.affiche 
    ? (import.meta.env.DEV ? `/tmdb-proxy?url=${encodeURIComponent(film.affiche)}` : `/api/proxy-image?url=${encodeURIComponent(film.affiche)}`)
    : null;

  return (
    <div 
      onClick={onOpen}
      className="fixed bottom-24 left-4 right-4 z-50 animate-in slide-in-from-bottom-8 duration-500 cursor-pointer"
    >
      <div className="bg-[#1A1A1F]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-3 flex items-center gap-4 shadow-[0_8px_32px_rgba(0,0,0,0.4)] active:scale-95 transition-transform">
        {/* Miniature Affiche */}
        <div className="w-10 h-14 rounded-lg overflow-hidden bg-white/5 flex-shrink-0 border border-white/5">
          {posterUrl ? (
            <img src={posterUrl} className="w-full h-full object-cover" alt="" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/20">
              <Ticket size={16} />
            </div>
          )}
        </div>

        {/* Texte */}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-[#E8B200] uppercase tracking-widest mb-0.5">
            Séance en attente
          </p>
          <p className="text-sm font-semibold text-white truncate">
            Note "{film.titre}"
          </p>
        </div>

        {/* Bouton Action */}
        <div className="bg-[#E8B200] text-black text-[10px] font-black uppercase px-4 py-2 rounded-full shadow-lg">
          Noter
        </div>
      </div>
    </div>
  );
};

export default PendingRatingToast;