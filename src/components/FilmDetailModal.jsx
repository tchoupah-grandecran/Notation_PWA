import { GENRE_COLORS } from '../constants';
import { SmartPoster } from './SmartPoster';
import { ImaxTag } from '../components/ImaxTag';

/**
 * Modale de détail d'un film (slide-up depuis le bas).
 * Fermeture au clic sur l'overlay ou sur le bouton.
 */
export function FilmDetailModal({ film, onClose }) {
  if (!film) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center animate-in fade-in duration-300">
      {/* Overlay */}
      <div
        className="absolute inset-0 backdrop-blur-sm bg-black/70"
        onClick={onClose}
      />

      {/* Panneau */}
      <div className="relative w-full rounded-t-[32px] p-6 pb-[calc(2rem+env(safe-area-inset-bottom))] border-t border-white/10 shadow-[0_-20px_60px_rgba(0,0,0,0.8)] max-h-[90vh] overflow-y-auto bg-[#111] animate-in slide-in-from-bottom duration-300 scrollbar-hide">
        {/* Handle */}
        <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mb-6 flex-shrink-0" />

        {/* Header */}
        <div className="flex gap-5 mb-7 items-start">
          <div className="w-24 min-h-[9rem] rounded-xl overflow-hidden bg-white/5 flex-shrink-0 border border-white/10 shadow-lg">
            <SmartPoster
              afficheInitiale={film.affiche}
              titre={film.titre}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex flex-col flex-1 min-w-0">
            {/* Badges haut */}
            <div className="flex items-center gap-2 mb-2">
              {film.numero && (
                <span className="text-[var(--color-primary)] text-[10px] font-black uppercase tracking-widest bg-[var(--color-primary-muted)] px-3 py-1 rounded-full border border-[var(--color-primary)]/10">
                  Séance #{film.numero}
                </span>
              )}
              {film.capucine && (
                <div className="w-5 h-5 rounded-full flex items-center justify-center bg-[#FFD1DC] shadow-lg flex-shrink-0">
                  <img src="https://i.imgur.com/lg1bkrO.png" alt="Capucine" className="w-3.5 h-3.5 object-contain" />
                </div>
              )}
            </div>

            <h2 className="font-syne text-2xl font-black leading-tight mb-4 text-white drop-shadow-xl">
              {film.titre}
            </h2>
            
            {/* Tags */}
            <div className="flex flex-wrap gap-2 items-center">
              <ImaxTag salle={film.salle} commentaire={film.commentaire} />
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${GENRE_COLORS[film.genre] || GENRE_COLORS.default}`}>
                {film.genre}
              </span>
              {film.capucine && (
                <div className="w-5 h-5 rounded-full flex items-center justify-center shadow-md bg-[#FFD1DC]">
                  <img src="https://i.imgur.com/lg1bkrO.png" alt="Capucine" className="w-3 h-3 object-contain" />
                </div>
              )}
              {film.note && (
                <span className="bg-[var(--color-primary-muted)] text-[var(--color-primary)] border border-[var(--color-primary)]/20 px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-1 shadow-sm">
                  <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                  {film.note}
                </span>
              )}
              {film.langue && (
                <span className="bg-white/5 border border-white/10 text-white/70 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                  {film.langue}
                </span>
              )}
              {film.coupDeCoeur && (
                <span className="bg-red-500/10 text-red-500 border border-red-500/20 px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-1.5 shadow-sm">
                  <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                  Coup de Cœur
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Commentaire */}
        {film.commentaire && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-5 shadow-inner">
            <p className="text-sm italic text-white/90 leading-relaxed font-medium">
              "{film.commentaire}"
            </p>
          </div>
        )}

        {/* Infos techniques */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10 shadow-inner flex flex-col justify-center">
            <span className="block text-[9px] uppercase font-bold tracking-widest text-white/40 mb-1.5">
              Salle & Siège
            </span>
            <div className="flex flex-col">
              <span className="font-syne font-bold text-lg text-white leading-tight">
                {film.salle || '?'}
              </span>
              <span className="font-bold text-sm text-white/40 leading-tight">
                Place {film.siege || '?'}
              </span>
            </div>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10 shadow-inner flex flex-col justify-center">
            <span className="block text-[9px] uppercase font-bold tracking-widest text-white/40 mb-1.5">
              Dépense Séance
            </span>
            <span className="font-sans font-black text-xl text-[var(--color-primary)] drop-shadow-md">
              {film.depense ? `${film.depense}` : '--'}
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-4 mt-2 bg-white/10 rounded-2xl border border-white/5 font-black text-xs uppercase tracking-widest text-white/80 active:scale-95 transition-all shadow-xl"
        >
          Fermer le billet
        </button>
      </div>
    </div>
  );
}