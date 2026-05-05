import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { saveFilmToSheet, getProchainNumeroSeance } from '../api';

// ─── ICONES SVG (COMPLETS) ───────────────────────────────────────────────────
const CalendarIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[13px] h-[13px]">
    <rect x="1" y="2.5" width="14" height="12" rx="2" />
    <path strokeLinecap="round" d="M1 6.5h14M5 1v3M11 1v3" />
  </svg>
);
const ClockIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[13px] h-[13px]">
    <circle cx="8" cy="8" r="6.5" />
    <path strokeLinecap="round" d="M8 4.5V8l2.5 2" />
  </svg>
);
const TimerIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[13px] h-[13px]">
    <path strokeLinecap="round" d="M8 2.5V1M6 1h4M8 2.5a6 6 0 100 11 6 6 0 000-11z" />
    <path strokeLinecap="round" d="M8 5.5V8.5l2 1.5" />
  </svg>
);
const GlobeIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[13px] h-[13px]">
    <circle cx="8" cy="8" r="6.5" />
    <path strokeLinecap="round" d="M1.5 8h13M8 1.5c-2 2-3 4-3 6.5s1 4.5 3 6.5M8 1.5c2 2 3 4 3 6.5s-1 4.5-3 6.5" />
  </svg>
);
const TheaterIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[13px] h-[13px]">
    <rect x="1" y="3.5" width="14" height="9" rx="1.5" />
    <path strokeLinecap="round" d="M4 3.5V2.5a1 1 0 011-1h6a1 1 0 011 1v1" />
    <path strokeLinecap="round" d="M5 8.5h6M8 6.5v4" />
  </svg>
);
const SeatIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[13px] h-[13px]">
    <path strokeLinecap="round" d="M3 4a1 1 0 011-1h8a1 1 0 011 1v5H3V4zM1.5 9h13v2a1 1 0 01-1 1H13M2.5 9v3.5M1.5 11h2M12.5 9v3.5M13.5 11h-2" />
  </svg>
);
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);
const ChubbyHeart = ({ filled }) => (
  <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" className="w-[20px] h-[20px]">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ─── COMPOSANT ETOILE ────────────────────────────────────────────────────────
function Star({ fill = 0 }) {
  const id = `star-grad-${Math.random().toString(36).slice(2)}`;
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" className="flex-shrink-0">
      <defs>
        <linearGradient id={id} x1="0" x2="1" y1="0" y2="0">
          <stop offset={`${fill * 100}%`} stopColor="var(--theme-accent)" />
          <stop offset={`${fill * 100}%`} stopColor="var(--theme-border)" />
        </linearGradient>
      </defs>
      <path
        d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
        fill={`url(#${id})`}
      />
    </svg>
  );
}

// ─── COMPOSANT PRINCIPAL ─────────────────────────────────────────────────────
function Notation({ films, token, spreadsheetId, ratingScale = 5, onSaved, onSkip }) {
  const film = films[0];

  const [rating, setRating] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [comment, setComment] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [isCapucine, setIsCapucine] = useState(false);
  const [price, setPrice] = useState('0.00');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [numeroSeance, setNumeroSeance] = useState('...');

  const starsRef = useRef(null);

  const posterUrl = film?.affiche
    ? (import.meta.env.DEV
        ? `/tmdb-proxy?url=${encodeURIComponent(film.affiche)}`
        : `/api/proxy-image?url=${encodeURIComponent(film.affiche)}`)
    : null;

  useEffect(() => {
    if (film && spreadsheetId) {
      getProchainNumeroSeance(token, spreadsheetId, film.annee).then(setNumeroSeance);
    }
  }, [film, spreadsheetId, token]);

  if (!film) return null;

  // Calcul de la note au drag
  const calculateRating = (e) => {
    if (!starsRef.current) return;
    const rect = starsRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const raw = (x / rect.width) * ratingScale;
    setRating(Math.round(raw * 2) / 2);
  };

  const handlePointerDown = (e) => {
    setIsDragging(true);
    calculateRating(e);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (isDragging) calculateRating(e);
  };

  const handlePointerUp = (e) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handleSave = async () => {
    setLoading(true);
    const success = await saveFilmToSheet(token, spreadsheetId, {
      ...film,
      numeroSeance,
      note: rating,
      commentaire: comment,
      coupDeCoeur: isFavorite ? 1 : 0,
      capucine: isCapucine ? 1 : 0,
      depense: price,
      langue: film.langue === 'VF' ? 'FRA' : 'VOST',
    });

    if (success) {
      setSaved(true);
      setTimeout(() => onSaved(), 1500);
    } else {
      alert('Erreur de sauvegarde');
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[50] font-outfit overflow-hidden" 
      style={{ backgroundColor: 'var(--theme-bg)' }}
    >
      {/* ── BACKGROUND POSTER (FIXE) ── */}
      <div className="fixed top-0 left-0 right-0 h-[62dvh] z-0">
        {posterUrl && (
          <img src={posterUrl} alt="" className="w-full h-full object-cover object-top" />
        )}
        <div 
          className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent" 
          style={{ backgroundColor: 'transparent', backgroundImage: 'linear-gradient(to bottom, transparent 100%, transparent 100%, var(--theme-bg) 100%)' }}
        />
      </div>

      {/* BOUTON PLUS TARD */}
      <button
        onClick={onSkip}
        className="fixed top-[62px] right-4 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-[11px] border border-white/10 text-[var(--theme-text)] text-[9px] font-bold z-20 active:scale-95 transition-transform"
      >
        Plus tard
      </button>

      {/* ── ZONE DE SCROLL ── */}
      <div className="absolute inset-0 z-10 overflow-y-auto scrollbar-hide flex flex-col">
        
        {/* Le Spacer qui garantit l'empiètement de 28px précisément */}
        <div style={{ height: 'calc(62dvh - 28px)' }} className="w-full flex-shrink-0" />

        {/* ── INTERFACE DE NOTATION (DRAWER) ── */}
        <div 
          className="relative w-full rounded-t-[29px] px-[15px] pt-[20px] pb-10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-[var(--theme-border)] flex-shrink-0"
          style={{ backgroundColor: 'var(--theme-surface)' }}
        >
          {/* Handle visuelle */}
          <div className="absolute top-[8px] left-1/2 -translate-x-1/2 w-[70px] h-[3px] bg-[var(--theme-border)] rounded-full" />

          <div className="flex w-full">
            {/* COLONNE GAUCHE */}
            <div className="w-[129px] flex-shrink-0">
              <img
                src={posterUrl}
                alt="Affiche"
                className="w-[129px] h-[172px] rounded-[14px] object-cover shadow-lg mb-[17px]"
              />

              <div className="space-y-[10px]">
                {/* TOGGLE CAPUCINE */}
                <button
                  onClick={() => setIsCapucine(!isCapucine)}
                  className={`w-full flex items-center gap-[10px] p-[2px] pr-[10px] rounded-[15px] border transition-all ${
                    isCapucine 
                    ? 'border-[var(--theme-accent)] bg-[var(--theme-accent-muted)]' 
                    : 'border-[var(--theme-border)] bg-transparent'
                  }`}
                >
                  {isCapucine ? (
                    <img src="https://i.imgur.com/lg1bkrO.png" className="w-[25px] h-[25px] rounded-full object-cover" alt="" />
                  ) : (
                    <div className="w-[25px] h-[25px] bg-[var(--theme-border)] rounded-full" />
                  )}
                  <span className={`text-[11px] font-medium transition-colors ${isCapucine ? 'text-[var(--theme-accent)]' : 'text-[var(--theme-text-secondary)]'}`}>
                    {isCapucine ? 'Capucine' : 'Pas Capucine'}
                  </span>
                </button>

                {/* INPUT DEPENSE (NUMPAD FORCE) */}
                <div className="flex items-center gap-[7px] h-[30px] px-[12px] rounded-[15px] border border-[var(--theme-border)]">
                  <span className="text-[10px] text-[var(--theme-text-secondary)] font-medium uppercase">Dépense</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="flex-1 bg-transparent text-[var(--theme-text)] text-xs font-medium outline-none text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-[var(--theme-text)] text-xs">€</span>
                </div>

                {/* DETAILS SEANCE (ORGANISE) */}
                <div className="pt-2 grid grid-cols-1 gap-y-[6px] opacity-60 px-1">
                  <div className="flex items-center gap-2 text-[var(--theme-text)] text-[10px] font-light italic">
                    <CalendarIcon /> {film.date || '00/00/2026'}
                  </div>
                  <div className="flex items-center gap-2 text-[var(--theme-text)] text-[10px] font-light italic">
                    <ClockIcon /> {film.heure || '00:00'}
                  </div>
                  <div className="flex items-center gap-2 text-[var(--theme-text)] text-[10px] font-light italic">
                    <TimerIcon /> {film.duree || '--h--'}
                  </div>
                  <div className="flex items-center gap-2 text-[var(--theme-text)] text-[10px] font-light italic">
                    <GlobeIcon /> {film.langue || 'VOST'}
                  </div>
                  <div className="flex items-center gap-2 text-[var(--theme-text)] text-[10px] font-light italic">
                    <TheaterIcon /> {film.salle || 'Salle --'}
                  </div>
                  <div className="flex items-center gap-2 text-[var(--theme-text)] text-[10px] font-light italic">
                    <SeatIcon /> {film.siege || 'F--'}
                  </div>
                </div>
              </div>
            </div>

            {/* COLONNE DROITE */}
            <div className="flex-1 ml-[18px] flex flex-col pt-1">
              <span className="text-[var(--theme-text-secondary)] text-xs font-light tracking-wide">
                #{numeroSeance}è séance
              </span>
              <h2 className="text-[var(--theme-text)] text-[26px] font-galinoy leading-[1.1] mt-1 mb-2">
                {film.titre}
              </h2>
              
              <div className="inline-flex self-start px-[10px] py-[2px] rounded-[14px] border border-[var(--theme-border)] bg-[var(--theme-accent-muted)]">
                <span className="text-[var(--theme-text-secondary)] text-[11px] font-medium tracking-wide">
                  {film.genre || 'Drame'}
                </span>
              </div>

              {/* SYSTEME DE NOTATION (STARS) */}
              <div className="relative mt-[18px] flex items-center gap-[5px] h-[34px]">
                <AnimatePresence>
                  {isDragging && (
                    <motion.div
                      className="absolute -top-12 left-0 bg-[var(--theme-accent)] text-[var(--theme-bg)] font-galinoy italic px-3 py-1 rounded-xl text-xl pointer-events-none z-20"
                      initial={{ opacity: 0, y: 5, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 5, scale: 0.8 }}
                    >
                      {rating}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div ref={starsRef} className="flex items-center gap-[5px]">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} fill={Math.max(0, Math.min(1, rating - i))} />
                  ))}
                </div>

                {/* Layer de capture tactile */}
                <div
                  className="absolute inset-0 z-10 touch-none cursor-pointer"
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                />
              </div>

              {/* TOGGLE COUP DE COEUR */}
              <button
                onClick={() => setIsFavorite(!isFavorite)}
                className={`mt-4 w-[46px] h-[36px] flex items-center justify-center rounded-[16px] border transition-all ${
                  isFavorite 
                  ? 'border-red-500/50 bg-red-500/10 text-red-500' 
                  : 'border-[var(--theme-border)] text-[var(--theme-text-secondary)]'
                }`}
              >
                <ChubbyHeart filled={isFavorite} />
              </button>

              {/* COMMENTAIRE */}
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Ton avis à chaud"
                className="mt-4 w-full h-[110px] bg-[var(--theme-bg)] rounded-[15px] p-3 text-xs font-light text-[var(--theme-text)] placeholder:text-[var(--theme-text-secondary)] outline-none resize-none border border-[var(--theme-border)] transition-colors focus:border-[var(--theme-accent)]"
              />
            </div>
          </div>

          {/* BOUTON NOTER (CENTRE & LARGE) */}
          <div className="mt-10 px-4 w-full flex justify-center">
            <motion.button
              disabled={loading}
              onClick={handleSave}
              className="w-full max-w-[280px] py-[14px] rounded-[22px] flex justify-center items-center font-outfit shadow-lg transition-all"
              style={{ 
                backgroundColor: saved ? '#22c55e' : 'var(--theme-text)', 
                color: saved ? '#fff' : 'var(--theme-surface)' 
              }}
              whileTap={{ scale: 0.97 }}
            >
              <AnimatePresence mode="wait">
                {saved ? (
                  <motion.span 
                    key="saved" 
                    className="flex items-center gap-2 font-bold text-lg"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  >
                    <CheckIcon /> Fait
                  </motion.span>
                ) : (
                  <motion.span 
                    key="noter" 
                    className="text-2xl font-light tracking-tight"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  >
                    {loading ? '...' : 'Noter'}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>

        {/* Fond du drawer pour le scroll infini */}
        <div className="flex-1 bg-[var(--theme-surface)] w-full" />
      </div>
    </div>
  );
}

export default Notation;