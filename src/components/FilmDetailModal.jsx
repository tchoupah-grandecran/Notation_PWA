import { GENRE_COLORS } from '../constants';
import { SmartPoster } from './SmartPoster';
import { ImaxTag } from './ImaxTag';
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
    <div className="fixed inset-0 z-[150] flex items-center justify-center px-5">
      {/* Overlay */}
      <div
        className="absolute inset-0 backdrop-blur-xl bg-black/75 animate-in fade-in duration-300"
        onClick={onClose}
      />

      <div
        className="relative w-full max-w-[400px] rounded-[2rem] bg-[var(--theme-surface)] border border-[var(--theme-border)] shadow-[0_30px_80px_rgba(0,0,0,0.5)] animate-in zoom-in-95 slide-in-from-bottom-4 duration-400 ease-[cubic-bezier(0.23,1,0.32,1)] overflow-hidden"
        style={{
          paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
        }}
      >

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full flex items-center justify-center bg-[var(--theme-text)]/5 hover:bg-[var(--theme-text)]/10 transition-colors"
        >
          <X size={14} className="text-[var(--theme-text)] opacity-50" strokeWidth={2.5} />
        </button>

        <div className="px-6 pt-6">

          {/* Header : poster + titre côte à côte */}
          <div className="flex gap-4 items-start pr-8">

            <div className="w-[84px] h-[122px] flex-shrink-0 rounded-[1.1rem] overflow-hidden shadow-lg border border-[var(--theme-border)]">
              <SmartPoster
                afficheInitiale={film.affiche}
                titre={film.titre}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="min-w-0 pt-0.5">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-outfit text-[9px] font-black uppercase tracking-[0.25em] text-[var(--theme-text)] opacity-30">
                  #{film.numero}
                </span>
                <span className="w-0.5 h-0.5 rounded-full bg-[var(--theme-text)] opacity-20" />
                <div className="flex items-center gap-1">
                  <Calendar size={9} className="text-[var(--theme-accent)]" />
                  <span className="font-outfit text-[9px] font-black uppercase tracking-[0.15em] text-[var(--theme-text)] opacity-55">
                    {film.date}
                  </span>
                </div>
              </div>

              <h2 className="font-galinoy text-[2.1rem] text-[var(--theme-text)] italic leading-[0.86] tracking-tight mb-2.5">
                {film.titre}
              </h2>

              <div className="flex flex-wrap gap-1.5">
                <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${GENRE_COLORS[film.genre] || 'border-[var(--theme-border)] text-[var(--theme-text)] opacity-40'}`}>
                  {film.genre}
                </span>

                <ImaxTag salle={film.salle} commentaire={film.commentaire} />

                {film.capucine && (
                  <div className="flex items-center gap-1 bg-red-900/20 border border-red-500/30 px-2 py-1 rounded-lg">
                    <img src="https://i.imgur.com/lg1bkrO.png" className="w-3 h-3 object-contain" alt="" />
                  </div>
                )}

                {film.coupDeCoeur && (
                  <div className="flex items-center gap-1 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-lg">
                    <ChubbyHeart className="w-3 h-3 text-red-500" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Ticket separator */}
          <div className="flex items-center gap-3 my-5 opacity-25">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--theme-text)] to-transparent" style={{ backgroundImage: 'repeating-linear-gradient(to right, var(--theme-text) 0 4px, transparent 4px 8px)' }} />
          </div>

          {/* Note + commentaire */}
          <div className="flex items-start gap-5 mb-5">
            {film.note && (
              <div className="flex items-baseline flex-shrink-0">
                <span className="font-galinoy text-[3.6rem] text-[var(--theme-text)] italic leading-none tracking-tighter">
                  {film.note}
                </span>
                <span className="font-galinoy text-lg text-[var(--theme-accent)] italic opacity-40 ml-0.5">
                  /{ratingScale}
                </span>
              </div>
            )}

            {film.commentaire && (
              <p className="font-outfit text-[13px] text-[var(--theme-text)] opacity-70 leading-snug italic font-light pt-2 line-clamp-3">
                "{film.commentaire}"
              </p>
            )}
          </div>

          {/* Stat strip */}
          <div
            className="flex items-stretch rounded-[1.4rem] overflow-hidden border"
            style={{ borderColor: 'var(--theme-border)' }}
          >
            <div className="flex-1 px-3 py-3.5 flex flex-col items-center text-center gap-1.5 border-r" style={{ borderColor: 'var(--theme-border)' }}>
              <MapPin size={13} className="text-[var(--theme-accent)]" />
              <span className="font-outfit font-bold text-[11px] text-[var(--theme-text)] uppercase truncate w-full">
                {film.salle || 'Cinéma'}
              </span>
              <span className="font-outfit text-[9px] text-[var(--theme-text)] opacity-40 uppercase tracking-wide">
                Salle
              </span>
            </div>

            <div className="flex-1 px-3 py-3.5 flex flex-col items-center text-center gap-1.5 border-r" style={{ borderColor: 'var(--theme-border)' }}>
              <span className="font-galinoy text-[15px] text-[var(--theme-accent)] italic leading-none">
                {film.siege || '—'}
              </span>
              <span className="font-outfit text-[9px] text-[var(--theme-text)] opacity-40 uppercase tracking-wide mt-0.5">
                Siège
              </span>
            </div>

            <div className="flex-1 px-3 py-3.5 flex flex-col items-center text-center gap-1.5 border-r" style={{ borderColor: 'var(--theme-border)' }}>
              <CreditCard size={13} className="text-[var(--theme-accent)]" />
              <span className="font-outfit font-bold text-[11px] text-[var(--theme-text)]">
                {film.depense || '--'}€
              </span>
              <span className="font-outfit text-[9px] text-[var(--theme-text)] opacity-40 uppercase tracking-wide">
                Prix
              </span>
            </div>

            <div className="flex-1 px-3 py-3.5 flex flex-col items-center text-center gap-1.5">
              <Languages size={13} className="text-[var(--theme-accent)]" />
              <span className="font-outfit font-bold text-[11px] text-[var(--theme-text)] uppercase">
                {film.langue || 'VOST'}
              </span>
              <span className="font-outfit text-[9px] text-[var(--theme-text)] opacity-40 uppercase tracking-wide">
                Langue
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}