import { createElement, useEffect } from 'react';
import { GENRE_COLORS } from '../constants';
import { SmartPoster } from './SmartPoster';
import { ImaxTag } from './ImaxTag';
import { X, MapPin, CreditCard, Languages, Calendar, Clock3, Timer, Armchair } from 'lucide-react';

// Réutilisation de ton cœur "dodu" personnalisé
const ChubbyHeart = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

function DetailStatCard({ icon, value, label }) {
  const iconNode = createElement(icon, { size: 15, 'aria-hidden': true, className: 'text-[var(--theme-accent)]' });
  return (
    <div className="min-w-0 rounded-2xl border border-[var(--theme-border)] bg-[color-mix(in_srgb,var(--theme-text)_4%,transparent)] px-3 py-3 flex flex-col items-center text-center gap-1.5">
      {iconNode}
      <span className="w-full truncate font-outfit text-[12px] font-semibold tabular-nums text-[var(--theme-text)]" title={String(value || '—')}>
        {value || '—'}
      </span>
      <span className="font-outfit text-[9px] font-medium text-[var(--theme-text)] opacity-45 uppercase tracking-[0.12em]">
        {label}
      </span>
    </div>
  );
}

const isMarked = (value) => value === true || value === 1 || ['1', 'oui', 'true'].includes(String(value ?? '').trim().toLowerCase());

export function FilmDetailModal({ film, onClose, ratingScale = 5 }) {
  useEffect(() => {
    if (!film) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event) => { if (event.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [film, onClose]);

  if (!film) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center overflow-y-auto px-4 py-4" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))', paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
      {/* Overlay */}
      <div
        className="absolute inset-0 backdrop-blur-xl bg-black/75 animate-in fade-in duration-300"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="film-detail-title"
        tabIndex={-1}
        className="relative my-auto w-full max-w-[400px] max-h-[calc(100dvh-2rem)] rounded-[2rem] bg-[var(--theme-surface)] border border-[var(--theme-border)] shadow-[0_30px_80px_rgba(0,0,0,0.5)] animate-in zoom-in-95 slide-in-from-bottom-4 duration-400 ease-[cubic-bezier(0.23,1,0.32,1)] overflow-y-auto overscroll-contain"
        style={{
          paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
        }}
      >

        {/* Close */}
        <button
          onClick={onClose}
          type="button"
          aria-label="Fermer la fiche du film"
          className="absolute top-3 right-3 z-20 w-11 h-11 rounded-full flex items-center justify-center bg-[var(--theme-surface)]/90 border border-[var(--theme-border)] hover:bg-[var(--theme-text)]/10 transition-colors"
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
                {film.numero && <span className="font-outfit text-[9px] font-black uppercase tracking-[0.25em] text-[var(--theme-text)] opacity-40">Séance #{film.numero}</span>}
                {film.numero && film.date && <span aria-hidden="true" className="w-0.5 h-0.5 rounded-full bg-[var(--theme-text)] opacity-20" />}
                <div className="flex items-center gap-1">
                  <Calendar size={9} className="text-[var(--theme-accent)]" />
                  <span className="font-outfit text-[9px] font-black uppercase tracking-[0.15em] text-[var(--theme-text)] opacity-55">
                    {film.date}
                  </span>
                </div>
              </div>

              <h2 id="film-detail-title" className="font-galinoy text-[1.75rem] sm:text-[2.1rem] text-[var(--theme-text)] italic leading-[0.92] tracking-tight mb-2.5 break-words">
                {film.titre}
              </h2>

              <div className="flex flex-wrap gap-1.5">
                {film.genre && <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${GENRE_COLORS[film.genre] || 'border-[var(--theme-border)] text-[var(--theme-text)] opacity-40'}`}>
                  {film.genre}
                </span>}

                <ImaxTag salle={film.salle} commentaire={film.commentaire} />

                {isMarked(film.capucine) && (
                  <div className="flex items-center gap-1 bg-red-900/20 border border-red-500/30 px-2 py-1 rounded-lg">
                    <img src="https://i.imgur.com/lg1bkrO.png" className="w-3 h-3 object-contain" alt="" />
                    <span className="font-outfit text-[8px] font-bold uppercase tracking-wide text-[var(--theme-text)]">Capucines</span>
                  </div>
                )}

                {isMarked(film.coupDeCoeur) && (
                  <div className="flex items-center gap-1 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-lg">
                    <ChubbyHeart className="w-3 h-3 text-red-500" />
                    <span className="font-outfit text-[8px] font-bold uppercase tracking-wide text-[var(--theme-text)]">Coup de cœur</span>
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
              <p className="min-w-0 font-outfit text-[13px] text-[var(--theme-text)] opacity-70 leading-relaxed italic font-light pt-2 whitespace-pre-wrap break-words">
                “{film.commentaire}”
              </p>
            )}
          </div>

          {/* Détails de la séance : mêmes repères visuels pour chaque information */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <DetailStatCard icon={Clock3} value={film.heure} label="Heure" />
            <DetailStatCard icon={Timer} value={film.duree} label="Durée" />
            <DetailStatCard icon={MapPin} value={film.salle} label="Salle" />
            <DetailStatCard icon={Armchair} value={film.siege} label="Siège" />
            <DetailStatCard icon={CreditCard} value={film.depense ? `${film.depense} €` : ''} label="Dépense" />
            <DetailStatCard icon={Languages} value={film.langue} label="Langue" />
          </div>

        </div>
      </div>
    </div>
  );
}
