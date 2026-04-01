import React, { useState, useEffect } from 'react';
import { Ticket, Star, X } from 'lucide-react';

const PendingRatingToast = ({ film, onOpen, count = 1 }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Gestion de la fermeture automatique (au chargement ET à la réouverture)
  useEffect(() => {
    let timer;
    
    if (isExpanded) {
      // On définit le délai : 5 secondes si c'est ouvert
      timer = setTimeout(() => {
        setIsExpanded(false);
      }, 5000);
    }

    // Nettoyage crucial du timer si l'état change ou si le composant est démonté
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isExpanded]); // Le useEffect se relance dès que isExpanded change

  if (!film) return null;

  const posterUrl = film.affiche 
    ? (import.meta.env.DEV ? `/tmdb-proxy?url=${encodeURIComponent(film.affiche)}` : `/api/proxy-image?url=${encodeURIComponent(film.affiche)}`)
    : null;

  return (
    <div 
      onClick={() => { if (!isExpanded) setIsExpanded(true); }}
      className={`fixed right-4 z-50 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] origin-bottom-right
        ${isExpanded 
          ? 'bottom-24 w-[calc(100vw-2rem)] max-w-[400px] h-[80px] cursor-default' 
          : 'bottom-[104px] w-[52px] h-[52px] cursor-pointer hover:scale-105 active:scale-95'
        }
      `}
    >
      <div className="absolute inset-0 rounded-full overflow-hidden backdrop-blur-xl border border-white/10 bg-[#1A1A1F]/90 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        
        {/* ÉTAT : BULLE (Rétracté) */}
        <div 
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 
            ${isExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100 delay-200'}
          `}
        >
          <Star size={22} className="text-[#E8B200] fill-[#E8B200]" strokeWidth={1.5} />
        </div>

        {/* ÉTAT : GÉLULE (Étendu) */}
        <div 
          className={`absolute inset-y-0 right-0 flex items-center justify-between py-3 px-4 gap-3 w-[calc(100vw-2rem)] max-w-[400px] transition-opacity duration-300
            ${isExpanded ? 'opacity-100 delay-100' : 'opacity-0 pointer-events-none'}
          `}
        >
          <div 
            onClick={onOpen}
            className="w-10 h-14 rounded-lg overflow-hidden bg-white/5 flex-shrink-0 border border-white/5 cursor-pointer ml-1"
          >
            {posterUrl ? (
              <img src={posterUrl} className="w-full h-full object-cover" alt="" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/20">
                <Ticket size={16} />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 cursor-pointer" onClick={onOpen}>
            <p className="text-[10px] font-bold text-[#E8B200] uppercase tracking-widest mb-0.5 whitespace-nowrap">
              Séance en attente
            </p>
            <p className="text-sm font-semibold text-white truncate pr-2">
              Note "{film.titre}"
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 mr-1">
            <button 
              onClick={onOpen}
              className="bg-[#E8B200] text-black text-[10px] font-black uppercase px-4 py-2.5 rounded-full shadow-lg active:scale-95 transition-transform whitespace-nowrap"
            >
              Noter
            </button>
            
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(false);
              }}
              className="p-2 rounded-full text-white/40 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
            >
              <X size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      {/* Badge de notification (déborde de la bulle) */}
      <div 
        className={`absolute top-0 right-0 bg-red-500 text-white text-[10px] font-black rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center shadow-md border-2 border-[#1A1A1F] transform translate-x-1/4 -translate-y-1/4 transition-opacity duration-300
          ${isExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100 delay-200'}
        `}
      >
        {count}
      </div>
    </div>
  );
};

export default PendingRatingToast;