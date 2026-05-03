import { GENRE_COLORS } from '../constants';
import { SmartPoster } from './SmartPoster';
import { Heart, X, MapPin, CreditCard, Languages } from 'lucide-react';

export function FilmDetailModal({ film, onClose, ratingScale = 5 }) { // "10" par défaut au cas où
  if (!film) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <div
        className="absolute inset-0 backdrop-blur-md bg-black/80 animate-in fade-in duration-500"
        onClick={onClose}
      />

      <div className="relative w-full rounded-t-[3rem] border-t border-white/10 bg-[#080808] shadow-[0_-20px_100px_rgba(0,0,0,1)] max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom-full duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] scrollbar-hide pb-[calc(2rem+env(safe-area-inset-bottom))]">
        
        <div className="sticky top-0 z-10 pt-4 pb-2 bg-[#080808]/80 backdrop-blur-md">
          <div className="w-10 h-1 bg-white/10 rounded-full mx-auto" />
        </div>

        <div className="px-8 pt-4">
          <div className="flex flex-col items-center text-center mb-10">
            <div className="w-40 h-56 rounded-2xl overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.8)] border border-white/10 mb-8 transform -rotate-1 transition-transform hover:rotate-0 duration-500">
              <SmartPoster
                afficheInitiale={film.affiche}
                titre={film.titre}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-center gap-3">
                <span className="text-[var(--color-primary)] text-[10px] font-black uppercase tracking-[0.3em]">
                  Séance #{film.numero}
                </span>
                {film.coupDeCoeur && (
                  <Heart size={14} className="fill-red-500 text-red-500 animate-pulse" />
                )}
              </div>
              
              <h2 className="font-galinoy text-5xl text-white leading-[0.9] px-2">
                {film.titre}
              </h2>
              
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${GENRE_COLORS[film.genre] || 'border-white/10 text-white/40'}`}>
                  {film.genre}
                </span>
                {film.langue && (
                  <div className="flex items-center gap-1.5 bg-white/5 text-white/60 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
                    <Languages size={10} />
                    {film.langue}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section Note - SI LA NOTE EXISTE */}
          {film.note !== undefined && film.note !== null && (
            <div className="flex flex-col items-center pb-10 border-b border-white/5">
              <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-2">
                Appréciation
              </span>
              <div className="flex items-baseline gap-1">
                <span className="font-galinoy text-6xl text-white italic">
                  {film.note}
                </span>
                <span className="text-[var(--color-primary)] font-black text-xl italic opacity-50">
                  /{ratingScale}
                </span>
              </div>
            </div>
          )}

          {film.commentaire && (
            <div className="py-10 px-4">
               <p className="font-outfit text-lg text-white/80 leading-relaxed text-center italic font-light max-w-sm mx-auto">
                "{film.commentaire}"
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-px bg-white/5 border border-white/5 rounded-[2.5rem] overflow-hidden mb-8">
            <div className="bg-[#080808] p-6 flex flex-col items-center text-center">
              <MapPin size={16} className="text-white/20 mb-3" />
              <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/30 mb-1">Cinéma</span>
              <span className="font-outfit font-bold text-sm text-white uppercase truncate w-full">
                {film.salle || 'Non spécifié'}
              </span>
              <span className="text-[10px] text-white/40 mt-1 italic uppercase font-medium">Place {film.siege || '-'}</span>
            </div>
            
            <div className="bg-[#080808] p-6 flex flex-col items-center text-center">
              <CreditCard size={16} className="text-white/20 mb-3" />
              <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/30 mb-1">Investissement</span>
              <div className="flex items-baseline gap-1">
                <span className="font-galinoy text-2xl text-[var(--color-primary)]">
                  {film.depense || '--'}
                </span>
                {film.depense && <span className="text-[var(--color-primary)] text-[10px] font-black uppercase"></span>}
              </div>
              <span className="text-[10px] text-white/40 mt-1 uppercase tracking-tighter font-medium">Extra & Techno</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-6 flex items-center justify-center gap-3 text-white/20 hover:text-white active:scale-95 transition-all"
          >
            <X size={18} strokeWidth={3} />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Fermer le billet</span>
          </button>
        </div>
      </div>
    </div>
  );
}