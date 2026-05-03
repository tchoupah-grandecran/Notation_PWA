import { GENRE_COLORS } from '../constants';
import { SmartPoster } from './SmartPoster';
import { X, MapPin, CreditCard, Languages, Calendar } from 'lucide-react';

// Réutilisation de ton cœur "dodu" personnalisé
const ChubbyHeart = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

export function FilmDetailModal({ film, onClose, ratingScale = 5 }) {
  if (!film) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center px-4">
      {/* Overlay avec flou profond */}
      <div
        className="absolute inset-0 backdrop-blur-xl bg-black/90 animate-in fade-in duration-500"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg rounded-t-[3.5rem] bg-[#050505] border-x border-t border-white/10 shadow-[0_-20px_80px_rgba(0,0,0,0.9)] max-h-[94vh] overflow-y-auto animate-in slide-in-from-bottom-full duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] scrollbar-hide pb-[env(safe-area-inset-bottom)]">
        
        {/* Handle de fermeture */}
        <div className="sticky top-0 z-20 py-4 bg-[#050505]/60 backdrop-blur-md">
          <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto" />
        </div>

        <div className="px-8 pb-10">
          {/* Header : Poster & Titre */}
          <div className="flex flex-col items-center text-center">
            <div className="relative group mb-10">
              <div className="absolute inset-0 bg-[var(--color-primary)] opacity-20 blur-3xl group-hover:opacity-40 transition-opacity" />
              <div className="relative w-48 h-64 rounded-[2rem] overflow-hidden shadow-2xl border border-white/10 rotate-2 transition-transform duration-700 group-hover:rotate-0">
                <SmartPoster
                  afficheInitiale={film.affiche}
                  titre={film.titre}
                  className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-700"
                />
              </div>
            </div>

            <div className="space-y-4 mb-10">
              <div className="flex items-center justify-center gap-4">
                <span className="font-outfit text-[10px] font-black uppercase tracking-[0.4em] text-white/30">
                  Séance #{film.numero}
                </span>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <div className="flex items-center gap-2">
                  <Calendar size={10} className="text-[var(--color-primary)]" />
                  <span className="font-outfit text-[10px] font-black uppercase tracking-[0.2em] text-white/60">
                    {film.date}
                  </span>
                </div>
              </div>
              
              <h2 className="font-galinoy text-6xl text-white italic leading-[0.85] tracking-tight">
                {film.titre}
              </h2>
              
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${GENRE_COLORS[film.genre] || 'border-white/10 text-white/40'}`}>
                  {film.genre}
                </span>
                
                {film.capucine && (
                  <div className="flex items-center gap-2 bg-[#4A0E0E]/40 border border-[#8B1A1A]/30 px-3 py-1.5 rounded-xl">
                    <img src="https://i.imgur.com/lg1bkrO.png" className="w-3.5 h-3.5 object-contain" alt="" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#FFBABA]">Capucines</span>
                  </div>
                )}

                {film.coupDeCoeur && (
                  <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-xl">
                    <ChubbyHeart className="w-3.5 h-3.5 text-red-500" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-red-400 font-outfit">Favori</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Ligne de séparation style ticket */}
          <div className="flex items-center gap-4 mb-10 opacity-20">
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white" />
            <div className="w-2 h-2 rounded-full border border-white" />
            <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white" />
          </div>

          {/* Section Note & Commentaire */}
          <div className="flex flex-col items-center space-y-8 mb-12">
            {film.note && (
              <div className="relative inline-flex items-baseline">
                <span className="font-galinoy text-[8rem] text-white italic leading-none tracking-tighter">
                  {film.note}
                </span>
                <span className="font-galinoy text-3xl text-[var(--color-primary)] italic opacity-40 ml-2">
                  /{ratingScale}
                </span>
              </div>
            )}

            {film.commentaire && (
              <div className="relative px-6 py-4 bg-white/[0.02] border border-white/5 rounded-[2rem]">
                <p className="font-outfit text-xl text-white/90 leading-relaxed text-center italic font-light">
                  "{film.commentaire}"
                </p>
              </div>
            )}
          </div>

          {/* Infos Techniques (Grille) */}
          <div className="grid grid-cols-2 gap-4 mb-10">
            <div className="bg-white/[0.03] border border-white/5 p-6 rounded-[2.5rem] flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <MapPin size={16} className="text-[var(--color-primary)]" />
              </div>
              <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/30 mb-1">Lieu & Siège</span>
              <span className="font-outfit font-bold text-sm text-white uppercase truncate w-full mb-1">
                {film.salle || 'Cinéma'}
              </span>
              <span className="font-galinoy text-xs text-[var(--color-primary)] italic opacity-60">
                Place {film.siege || '—'}
              </span>
            </div>
            
            <div className="bg-white/[0.03] border border-white/5 p-6 rounded-[2.5rem] flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <CreditCard size={16} className="text-[var(--color-primary)]" />
              </div>
              <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/30 mb-1">Investissement</span>
              <div className="flex items-baseline gap-1">
                <span className="font-galinoy text-2xl text-white italic">
                  {film.depense || '--'}
                </span>
                <span className="text-[10px] text-white/40 uppercase font-black tracking-tighter">€</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <Languages size={10} className="text-white/40" />
                <span className="text-[9px] text-white/40 uppercase font-black">{film.langue || 'VOST'}</span>
              </div>
            </div>
          </div>

          {/* Bouton de sortie */}
          <button
            onClick={onClose}
            className="w-full py-8 group flex flex-col items-center gap-4 transition-all"
          >
            <div className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center group-hover:border-[var(--color-primary)] group-hover:bg-[var(--color-primary)]/10 transition-all duration-500">
              <X size={20} className="text-white/40 group-hover:text-[var(--color-primary)]" strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20 group-hover:text-white transition-colors">
              Fermer le billet
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}