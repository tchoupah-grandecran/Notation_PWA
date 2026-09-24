import { createElement, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { GENRE_COLORS } from '../constants';
import { SmartPoster } from './SmartPoster';
import { ImaxTag } from './ImaxTag';
import {
  Armchair,
  CalendarDays,
  Clock3,
  CreditCard,
  Film,
  Languages,
  MapPin,
  RotateCcw,
  Ticket,
  Timer,
  X,
} from 'lucide-react';

const ChubbyHeart = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

function DetailRow({ icon, label, value }) {
  if (!value) return null;

  return (
    <div className="flex min-h-12 items-center gap-3 border-b border-[var(--theme-border)]/60 py-2.5 last:border-b-0">
      {createElement(icon, {
        size: 15,
        'aria-hidden': true,
        className: 'shrink-0 text-[var(--theme-accent)] opacity-80',
      })}
      <span className="w-[82px] shrink-0 font-outfit text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--theme-text)] opacity-45">
        {label}
      </span>
      <span className="min-w-0 flex-1 break-words text-right font-outfit text-[13px] font-medium tabular-nums text-[var(--theme-text)]">
        {value}
      </span>
    </div>
  );
}

const isMarked = (value) =>
  value === true ||
  value === 1 ||
  ['1', 'oui', 'true'].includes(String(value ?? '').trim().toLowerCase());

// Marge (px) entre les gélules et les bords de l'affiche.
const POSTER_INSET = 8;

// Le titre peut occuper jusqu’à deux lignes ; sa taille s’adapte à sa longueur.
const TITLE_MAX_PX = 88;
const TITLE_MIN_PX = 1;

// Les commandes reprennent la couleur du titre dans les deux thèmes.
const CONTROL_CLASSES =
  'border border-[var(--theme-border)] bg-[color-mix(in_srgb,var(--theme-text)_6%,var(--theme-surface))] text-[var(--theme-text)] shadow-md backdrop-blur-xl transition-colors hover:bg-[color-mix(in_srgb,var(--theme-text)_10%,var(--theme-surface))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]';

export function FilmDetailModal({ film, onClose, ratingScale = 5 }) {
  const [showDetails, setShowDetails] = useState(false);
  const [titleSize, setTitleSize] = useState(32);
  const titleBoxRef = useRef(null);
  const titleRef = useRef(null);

  // Mesure le titre avec Canvas : un seul titre est rendu dans l’interface.
  useLayoutEffect(() => {
    if (!film) return undefined;

    const box = titleBoxRef.current;
    const titleNode = titleRef.current;
    if (!box || !titleNode) return undefined;

    const context = document.createElement('canvas').getContext('2d');
    if (!context) return undefined;

    let active = true;

    const fit = () => {
      if (!active) return;

      const available = box.clientWidth;
      const computed = window.getComputedStyle(titleNode);

      const words = (film.titre || 'Film sans titre')
        .trim()
        .split(/\s+/)
        .filter(Boolean);

      const maxLines = words.length <= 1 ? 1 : 2;
      if (!available || !words.length) return;

      const fitsInAllowedLines = (fontSize) => {
        context.font = `${computed.fontStyle} ${computed.fontWeight} ${fontSize}px ${computed.fontFamily}`;

        let line = '';
        let lineCount = 1;

        for (const word of words) {
          if (context.measureText(word).width > available) return false;

          const candidate = line ? `${line} ${word}` : word;

          if (!line || context.measureText(candidate).width <= available) {
            line = candidate;
          } else {
            lineCount += 1;
            if (lineCount > maxLines) return false;
            line = word;
          }
        }

        return lineCount <= maxLines;
      };

      // Recherche la plus grande taille qui respecte les vrais retours à la ligne,
      // sans couper un mot. Un titre d’un seul mot reste sur une seule ligne.
      let low = TITLE_MIN_PX;
      let high = TITLE_MAX_PX;

      if (fitsInAllowedLines(high)) {
        low = high;
      } else {
        for (let attempt = 0; attempt < 18; attempt += 1) {
          const middle = (low + high) / 2;

          if (fitsInAllowedLines(middle)) {
            low = middle;
          } else {
            high = middle;
          }
        }
      }

      const size = Math.max(TITLE_MIN_PX, Math.floor(low * 10) / 10);
      setTitleSize((current) => (current === size ? current : size));
    };

    fit();

    const observer = new ResizeObserver(fit);
    observer.observe(box);
    document.fonts?.ready?.then(fit);

    return () => {
      active = false;
      observer.disconnect();
    };
  }, [film]);

  useEffect(() => {
    if (!film) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [film]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
      if (event.key === 'ArrowLeft' && showDetails) setShowDetails(false);
      if (event.key === 'ArrowRight' && !showDetails) setShowDetails(true);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, showDetails]);

  if (!film) return null;

  const title = film.titre || 'Film sans titre';
  const titleWords = title.trim().split(/\s+/).filter(Boolean);
  const titleMaxLines = titleWords.length <= 1 ? 1 : 2;
  const note = film.note ? String(film.note).replace(',', '.') : null;
  const genreClass = GENRE_COLORS[film.genre] || 'border-white/30 text-white/90';
  const formattedCost = film.depense
    ? `${String(film.depense).replace('.', ',')} €`
    : '';

  // Les gélules disparaissent au début du retournement et réapparaissent
  // au retour, car backdrop-filter peut ignorer backface-visibility.
  const overlayStyle = {
    opacity: showDetails ? 0 : 1,
    transition: showDetails
      ? 'opacity 110ms ease-out'
      : 'opacity 200ms ease-out 340ms',
  };

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center overflow-y-auto px-4 py-5"
      style={{
        paddingTop: 'max(1.25rem, env(safe-area-inset-top))',
        paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))',
      }}
    >
      <div
        className="absolute inset-0 animate-in fade-in duration-300"
        style={{
          background: 'rgba(0,0,0,.18)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
        }}
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Souvenir de séance : ${title}`}
        tabIndex={-1}
        className="film-card-scene relative z-[1] my-auto flex shrink-0 flex-col gap-2 overflow-visible"
        style={{
          width: 'min(88vw, 460px)',
          height:
            'min(calc(132vw + 112px), 802px, calc(100dvh - 2.5rem - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)))',
          perspective: '1600px',
        }}
      >
        <style>{`
          .film-card-inner {
            transform-style: preserve-3d;
            transition: transform 680ms cubic-bezier(.2,.72,.18,1);
          }
          .film-card-face {
            -webkit-backface-visibility: hidden;
            backface-visibility: hidden;
          }
          @media (prefers-reduced-motion: reduce) {
            .film-card-inner { transition: none; }
          }
        `}</style>

        {/* Titre unique, dimensionné selon sa longueur et la largeur disponible. */}
        <div className="flex min-h-11 shrink-0 items-center gap-3">
          <div ref={titleBoxRef} className="min-w-0 flex-1">
            <h2
              ref={titleRef}
              className="font-galinoy italic leading-none tracking-tight text-[var(--theme-text)]"
              style={{
                fontSize: `${titleSize}px`,
                lineHeight: 1.05,
                maxHeight: `${titleSize * titleMaxLines * 1.15}px`,
                overflow: 'hidden',
                whiteSpace: 'normal',
                wordBreak: 'normal',
                overflowWrap: 'normal',
              }}
            >
              {title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer la fiche du film"
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${CONTROL_CLASSES}`}
          >
            <X size={17} aria-hidden="true" />
          </button>
        </div>

        <div
          className="film-card-inner relative min-h-0 w-full flex-1 rounded-[1.8rem]"
          style={{ transform: showDetails ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
        >
          {/* Recto : l’affiche devient la couverture du souvenir. */}
          <section
            aria-hidden={showDetails}
            inert={showDetails}
            onClick={() => setShowDetails(true)}
            className="film-card-face absolute inset-0 cursor-pointer overflow-hidden border border-white/20 bg-[#171717] shadow-[0_32px_90px_rgba(0,0,0,.6)]"
            style={{ borderRadius: 24 }}
          >
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ borderRadius: 24, clipPath: 'inset(0 round 24px)' }}
            >
              <SmartPoster
                afficheInitiale={film.affiche}
                titre={title}
                className="h-full w-full rounded-[1.5rem]"
              />
            </div>

            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent via-35% to-black/90" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />

            {/* Calque des gélules : disparaît plus tôt au retournement. */}
            <div className="pointer-events-none absolute inset-0" style={overlayStyle}>
              <div
                className="absolute flex flex-wrap items-start gap-2"
                style={{
                  top: POSTER_INSET,
                  left: POSTER_INSET,
                  right: POSTER_INSET,
                }}
              >
                {film.numero && (
                  <span className="rounded-full border border-white/25 bg-black/25 px-3 py-2 font-outfit text-[9px] font-bold uppercase tracking-[0.16em] text-white/90 backdrop-blur-md">
                    Séance n° {film.numero}
                  </span>
                )}

                {film.date && (
                  <span className="flex items-center gap-1.5 rounded-full border border-white/25 bg-black/25 px-3 py-2 font-outfit text-[9px] font-semibold tracking-wide text-white/90 backdrop-blur-md">
                    <CalendarDays size={12} aria-hidden="true" />
                    {film.date}
                  </span>
                )}
              </div>

              <div
                className="absolute flex flex-wrap items-center gap-2"
                style={{
                  bottom: POSTER_INSET,
                  left: POSTER_INSET,
                  right: POSTER_INSET,
                }}
              >
                {film.genre && (
                  <span className={`rounded-full border bg-black/30 px-3 py-2 font-outfit text-[9px] font-bold uppercase tracking-[0.13em] backdrop-blur-md ${genreClass}`}>
                    {film.genre}
                  </span>
                )}

                {note && (
                  <span className="inline-flex items-baseline rounded-full border border-white/30 bg-black/30 px-3 py-2 text-white backdrop-blur-md">
                    <span className="font-galinoy text-[1.2rem] italic leading-none">{note}</span>
                    <span className="ml-1 font-outfit text-[9px] text-white/70">/{ratingScale}</span>
                  </span>
                )}

                <ImaxTag salle={film.salle} commentaire={film.commentaire} />

                {isMarked(film.capucine) && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-black/25 px-2 py-2 font-outfit text-[8px] font-semibold uppercase tracking-wide text-white/90 backdrop-blur-md">
                    <img
                      src="https://i.imgur.com/lg1bkrO.png"
                      className="h-3 w-3 object-contain"
                      alt=""
                    />
                    Capucines
                  </span>
                )}

                {isMarked(film.coupDeCoeur) && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200/30 bg-black/25 px-2 py-2 font-outfit text-[8px] font-semibold uppercase tracking-wide text-white/90 backdrop-blur-md">
                    <ChubbyHeart className="h-3 w-3 text-rose-300" />
                    Coup de cœur
                  </span>
                )}
              </div>
            </div>
          </section>

          {/* Verso : le commentaire puis les détails, présentés comme un souvenir. */}
          <section
            aria-hidden={!showDetails}
            inert={!showDetails}
            onClick={() => setShowDetails(false)}
            className="film-card-face absolute inset-0 flex cursor-pointer flex-col overflow-hidden rounded-[1.8rem] border border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--theme-text)] shadow-[0_32px_90px_rgba(0,0,0,.6)]"
            style={{ transform: 'rotateY(180deg)', borderRadius: 24 }}
          >
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5 pt-5 scrollbar-hide sm:px-8">
              <p className="mb-2 font-outfit text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--theme-accent)]">
                Le souvenir de la séance
              </p>

              <div className="mb-5 flex flex-wrap items-center gap-2">
                {note && (
                  <span className="inline-flex items-baseline rounded-full bg-[color-mix(in_srgb,var(--theme-accent)_14%,transparent)] px-3 py-1.5 text-[var(--theme-text)]">
                    <span className="font-galinoy text-[1.45rem] italic leading-none">{note}</span>
                    <span className="ml-1 font-outfit text-[9px] opacity-60">/{ratingScale}</span>
                  </span>
                )}

                {film.genre && (
                  <span className="rounded-full border border-[var(--theme-border)] px-3 py-2 font-outfit text-[9px] font-bold uppercase tracking-[0.12em] opacity-75">
                    {film.genre}
                  </span>
                )}

                {isMarked(film.coupDeCoeur) && (
                  <ChubbyHeart className="h-4 w-4 text-rose-500" />
                )}

                {isMarked(film.capucine) && (
                  <img
                    src="https://i.imgur.com/lg1bkrO.png"
                    className="h-4 w-4 object-contain"
                    alt="Séance avec Capucine"
                  />
                )}
              </div>

              {film.commentaire ? (
                <blockquote className="mb-6 border-l-2 border-[var(--theme-accent)]/55 pl-4 font-outfit text-[14px] font-light italic leading-relaxed text-[var(--theme-text)]/85">
                  “{film.commentaire}”
                </blockquote>
              ) : (
                <p className="mb-6 font-outfit text-[12px] italic text-[var(--theme-text)]/45">
                  Aucun commentaire pour cette séance.
                </p>
              )}

              <div className="mb-2 flex items-center gap-3">
                <h3 className="font-outfit text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--theme-text)]/45">
                  La séance
                </h3>
                <div className="h-px flex-1 bg-[var(--theme-border)]" />
              </div>

              <DetailRow icon={CalendarDays} label="Date" value={film.date} />
              <DetailRow icon={Clock3} label="Heure" value={film.heure} />
              <DetailRow icon={MapPin} label="Salle" value={film.salle} />
              <DetailRow icon={Armchair} label="Siège" value={film.siege} />
              <DetailRow icon={CreditCard} label="Dépense" value={formattedCost} />
              <DetailRow icon={Ticket} label="Séance n°" value={film.numero} />

              <div className="mb-2 mt-5 flex items-center gap-3">
                <h3 className="font-outfit text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--theme-text)]/45">
                  Le film
                </h3>
                <div className="h-px flex-1 bg-[var(--theme-border)]" />
              </div>

              <DetailRow icon={Timer} label="Durée" value={film.duree} />
              <DetailRow icon={Languages} label="Langue" value={film.langue} />
              <DetailRow icon={Film} label="Genre" value={film.genre} />

              {(film.salle || film.commentaire) && (
                <div className="mt-4">
                  <ImaxTag salle={film.salle} commentaire={film.commentaire} />
                </div>
              )}
            </div>
          </section>
        </div>

        <button
          type="button"
          onClick={() => setShowDetails((value) => !value)}
          aria-label={showDetails ? 'Revoir l’affiche' : `Voir les détails de ${title}`}
          className={`flex h-11 shrink-0 items-center justify-center gap-2 rounded-full font-outfit text-[11px] font-semibold ${CONTROL_CLASSES}`}
        >
          <RotateCcw size={14} aria-hidden="true" />
          {showDetails ? 'Revoir l’affiche' : 'Voir les détails'}
        </button>
      </div>
    </div>
  );
}