import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { saveFilmToSheet, getProchainNumeroSeance } from '../api';

// ─── Icons ────────────────────────────────────────────────────────────────────
const CalendarIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[14px] h-[14px] flex-shrink-0">
    <rect x="1" y="2.5" width="14" height="12" rx="2" />
    <path strokeLinecap="round" d="M1 6.5h14M5 1v3M11 1v3" />
  </svg>
);
const ClockIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[14px] h-[14px] flex-shrink-0">
    <circle cx="8" cy="8" r="6.5" />
    <path strokeLinecap="round" d="M8 4.5V8l2.5 2" />
  </svg>
);
const TimerIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[14px] h-[14px] flex-shrink-0">
    <path strokeLinecap="round" d="M8 2.5V1M6 1h4M8 2.5a6 6 0 100 11 6 6 0 000-11z" />
    <path strokeLinecap="round" d="M8 5.5V8.5l2 1.5" />
  </svg>
);
const GlobeIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[14px] h-[14px] flex-shrink-0">
    <circle cx="8" cy="8" r="6.5" />
    <path strokeLinecap="round" d="M1.5 8h13M8 1.5c-2 2-3 4-3 6.5s1 4.5 3 6.5M8 1.5c2 2 3 4 3 6.5s-1 4.5-3 6.5" />
  </svg>
);
const TheaterIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[14px] h-[14px] flex-shrink-0">
    <rect x="1" y="3.5" width="14" height="9" rx="1.5" />
    <path strokeLinecap="round" d="M4 3.5V2.5a1 1 0 011-1h6a1 1 0 011 1v1" />
    <path strokeLinecap="round" d="M5 8.5h6M8 6.5v4" />
  </svg>
);
const SeatIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[14px] h-[14px] flex-shrink-0">
    <path strokeLinecap="round" d="M3 4a1 1 0 011-1h8a1 1 0 011 1v5H3V4zM1.5 9h13v2a1 1 0 01-1 1H13M2.5 9v3.5M1.5 11h2M12.5 9v3.5M13.5 11h-2" />
  </svg>
);
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);
const ChubbyHeart = ({ filled, className }) => (
  <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" className={className}>
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ─── Star component ────────────────────────────────────────────────────────────
function Star({ fill = 0, size = 34 }) {
  const id = `star-grad-${Math.random().toString(36).slice(2)}`;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="flex-shrink-0">
      <defs>
        <linearGradient id={id} x1="0" x2="1" y1="0" y2="0">
          <stop offset={`${fill * 100}%`} stopColor="#F5C842" />
          <stop offset={`${fill * 100}%`} stopColor="#D9D9D9" />
        </linearGradient>
      </defs>
      <path
        d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
        fill={`url(#${id})`}
      />
    </svg>
  );
}

// ─── Trigram Language Modal ────────────────────────────────────────────────────
const TRIGRAMS = ['ENG', 'ITA', 'GER', 'SPA', 'JAP', 'KOR'];

function VostModal({ onSelect, onCancel }) {
  const [customTrigram, setCustomTrigram] = useState('');

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onCancel} />

      <motion.div
        className="relative w-full max-w-sm rounded-[29px] bg-[#1E1E1E] border border-[#FFFDF2]/10 p-6 overflow-hidden"
        initial={{ y: 50, scale: 0.95 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 50, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        <h3 className="font-galinoy text-[22px] text-[#FFFDF2] mb-1">Trigramme VOST</h3>
        <p className="font-outfit text-xs text-[#FFFDF2]/40 mb-6">Choisis la langue d'origine</p>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {TRIGRAMS.map((lang) => (
            <button
              key={lang}
              onClick={() => onSelect(lang)}
              className="font-outfit text-sm py-2.5 rounded-[12px] border border-[#FFFDF2]/20 text-[#FFFDF2] active:scale-95 transition-all bg-[#FFFDF2]/5"
            >
              {lang}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            value={customTrigram}
            onChange={(e) => setCustomTrigram(e.target.value.toUpperCase().slice(0, 3))}
            placeholder="Autre (ex: POR)"
            className="flex-1 bg-[#FFFDF2]/5 border border-[#FFFDF2]/20 rounded-[12px] px-4 font-outfit text-sm text-[#FFFDF2] outline-none uppercase placeholder:text-[#FFFDF2]/30"
          />
          <button
            onClick={() => customTrigram.length > 0 && onSelect(customTrigram)}
            className="font-outfit font-bold text-sm px-5 rounded-[12px] bg-[#FFFDF2] text-[#1E1E1E] active:scale-95 transition-all"
          >
            OK
          </button>
        </div>

        <button
          onClick={onCancel}
          className="font-outfit text-xs text-[#FFFDF2]/30 w-full text-center mt-5 py-2 uppercase tracking-widest"
        >
          Annuler
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
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
  const [showVostModal, setShowVostModal] = useState(false);
  const [numeroSeance, setNumeroSeance] = useState('...');

  const starsRef = useRef(null);

  const posterUrl = film?.affiche
    ? (import.meta.env.DEV
        ? `/tmdb-proxy?url=${encodeURIComponent(film.affiche)}`
        : `/api/proxy-image?url=${encodeURIComponent(film.affiche)}`)
    : null;

  useEffect(() => {
    if (film && spreadsheetId && film.annee) {
      getProchainNumeroSeance(token, spreadsheetId, film.annee).then(setNumeroSeance);
    }
  }, [film, spreadsheetId, token]);

  if (!film) return null;

  // ── Star drag logic ──────────────────────────────────────────────────────────
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
  const handlePointerMove = (e) => { if (isDragging) calculateRating(e); };
  const handlePointerUp = (e) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  // ── Save flow ────────────────────────────────────────────────────────────────
  const handleNotClick = () => {
    const baseLang = (film.langue || '').toUpperCase();
    if (baseLang === 'VF') {
      doSave('FRA');
    } else {
      setShowVostModal(true);
    }
  };

  const handleVostSelect = (selectedLang) => {
    setShowVostModal(false);
    doSave(selectedLang);
  };

  const doSave = async (finalLangue) => {
    setLoading(true);
    const success = await saveFilmToSheet(token, spreadsheetId, {
      ...film,
      numeroSeance,
      note: rating,
      commentaire: comment,
      coupDeCoeur: isFavorite ? 1 : 0,
      capucine: isCapucine ? 1 : 0,
      depense: price,
      langue: finalLangue,
    });

    if (success) {
      setSaved(true);
      setTimeout(() => onSaved(), 1500);
    } else {
      alert('Erreur de sauvegarde');
      setLoading(false);
    }
  };

  const starFills = Array.from({ length: ratingScale }, (_, i) =>
    Math.max(0, Math.min(1, rating - i))
  );

  return (
    <>
      <div className="fixed inset-0 z-[50] bg-[#1F1F1F] font-outfit overflow-hidden">
        
        {/* ── Fixed Background Poster ─────────────────────────────────────────── */}
        <div className="fixed top-0 left-0 right-0 h-[62dvh] z-0">
          {posterUrl ? (
            <img src={posterUrl} alt="" className="w-full h-full object-cover object-top" />
          ) : (
            <div className="w-full h-full bg-zinc-800" />
          )}
          {/* Léger dégradé pour adoucir le bas du poster */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#1F1F1F]/70 pointer-events-none" />
        </div>

        {/* ── Fixed "Plus tard" Button ──────────────────────────────────────── */}
        <button
          onClick={onSkip}
          className="fixed top-[62px] right-4 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-[11px] border border-[#1E1E1E]/20 text-[#FFFDF2] text-[9px] font-semibold active:scale-95 transition-transform z-20"
        >
          Plus tard
        </button>

        {/* ── Scrollable Overlay ────────────────────────────────────────────── */}
        <div className="absolute inset-0 z-10 overflow-y-auto scrollbar-hide flex flex-col">
          
          {/* Spacer transparent qui pousse le drawer vers le bas. 
              La hauteur est exactement la taille du poster moins les 28px d'empiètement */}
          <div style={{ height: 'calc(62dvh - 28px)' }} className="w-full flex-shrink-0" />

          {/* ── Bottom Drawer ─────────────────────────────────────────────────── */}
          <div className="bg-[#1E1E1E] rounded-t-[29px] relative px-[15px] pt-[15px] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] h-[435px] w-full flex-shrink-0">
            {/* Handle */}
            <div className="absolute top-[7px] left-1/2 -translate-x-1/2 w-[70px] h-[3px] bg-[#D9D9D9] rounded-full" />

            <div className="flex h-full w-full">
              {/* Colonne de Gauche (Affiche + Inputs annexes) */}
              <div className="w-[129px] flex-shrink-0 flex flex-col pt-1">
                <img
                  src={posterUrl}
                  alt="Poster"
                  className="w-[129px] h-[172px] rounded-[14px] object-cover shadow-[0px_0px_12px_rgba(0,0,0,0.30)]"
                />

                <div className="mt-[17px] flex flex-col gap-3">
                  {/* Capucine Toggle */}
                  <button
                    onClick={() => setIsCapucine(!isCapucine)}
                    className="flex items-center gap-[11px] p-[2px] pr-[10px] rounded-[15px] border border-[#FFFDF2] transition-colors"
                  >
                    {isCapucine ? (
                      <img src="https://i.imgur.com/lg1bkrO.png" className="w-[25px] h-[25px] rounded-[13px] object-cover" alt="" />
                    ) : (
                      <div className="w-[25px] h-[25px] bg-[#FFFDF2] rounded-[13px] flex-shrink-0" />
                    )}
                    <span className="text-[#FFFDF2] text-xs font-light">Pas Capucine</span>
                  </button>

                  {/* Dépense */}
                  <div className="flex items-center gap-[7px] h-[29px] px-[10px] rounded-[15px] border border-[#FFFDF2]">
                    <span className="text-[#FFFDF2] text-xs font-light">Dépense</span>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-[30px] bg-transparent text-[#FFFDF2]/40 text-xs font-light outline-none text-right"
                      step="0.50"
                    />
                    <span className="text-[#FFFDF2] text-xs font-light">€</span>
                  </div>
                </div>

                {/* Movie Details Grid */}
                <div className="grid grid-cols-2 gap-x-1 gap-y-1 mt-[14px] opacity-40">
                  <div className="flex items-center gap-1.5 text-[#FFFDF2] text-[10px] font-light">
                    <CalendarIcon /> {film.date || 'DD/MM'}
                  </div>
                  <div className="flex items-center gap-1.5 text-[#FFFDF2] text-[10px] font-light">
                    <ClockIcon /> {film.heure || 'HH:MM'}
                  </div>
                  <div className="flex items-center gap-1.5 text-[#FFFDF2] text-[10px] font-light">
                    <TimerIcon /> {film.duree || 'xxhxx'}
                  </div>
                  <div className="flex items-center gap-1.5 text-[#FFFDF2] text-[10px] font-light">
                    <GlobeIcon /> {film.langue || 'LANG'}
                  </div>
                  <div className="flex items-center gap-1.5 text-[#FFFDF2] text-[10px] font-light">
                    <TheaterIcon /> {film.salle || 'Salle XX'}
                  </div>
                  <div className="flex items-center gap-1.5 text-[#FFFDF2] text-[10px] font-light">
                    <SeatIcon /> {film.siege || 'Siège XX'}
                  </div>
                </div>
              </div>

              {/* Colonne de Droite (Textes, Notes et Bouton) */}
              <div className="flex-1 relative ml-[18px] pt-[22px]">
                
                <div className="text-[#FFFDF2] text-xs font-light">#{numeroSeance}è séance</div>
                <h2 className="text-[#FFFDF2] text-2xl font-galinoy mt-1 mb-2 leading-tight">
                  {film.titre}
                </h2>
                
                <div className="inline-flex items-center justify-center px-[10px] py-[2px] rounded-[14px] border border-[#FFFDF2]">
                  <span className="text-[#FFFDF2] text-xs font-light">{film.genre || 'Cinéma'}</span>
                </div>

                {/* Stars Layout */}
                <div className="relative mt-4 flex items-center gap-[5px] h-[34px]">
                  {/* Rating Number Bubble */}
                  <AnimatePresence>
                    {isDragging && (
                      <motion.div
                        className="absolute -top-10 left-8 bg-[#F5C842] text-black font-galinoy italic px-3 py-1 rounded-xl text-xl pointer-events-none z-20"
                        initial={{ opacity: 0, y: 4, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.8 }}
                      >
                        {rating}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div ref={starsRef} className="flex items-center gap-[5px] w-full h-full">
                    {starFills.map((fill, i) => (
                      <Star key={i} fill={fill} size={34} />
                    ))}
                  </div>
                  {/* Touch layer */}
                  <div
                    className="absolute inset-0 z-10 touch-none cursor-pointer"
                    style={{ margin: '-10px' }}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                  />
                </div>

                {/* Heart */}
                <div className="mt-4">
                  <button
                    onClick={() => setIsFavorite(!isFavorite)}
                    className={`inline-flex items-center justify-center px-[10px] py-[2px] rounded-[15px] border transition-colors ${
                      isFavorite ? 'border-red-500 bg-red-500/20 text-red-500' : 'border-[#FFFDF2] text-[#FFFDF2]'
                    }`}
                  >
                    <ChubbyHeart filled={isFavorite} className="w-[25px] h-[25px]" />
                  </button>
                </div>

                {/* Textarea */}
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Ton avis à chaud"
                  className="absolute bottom-[65px] left-0 right-0 w-full h-[117px] bg-[#FFFDF2]/10 rounded-[15px] p-[10px] text-xs font-light text-[#FFFDF2] placeholder:text-[#FFFDF2]/60 outline-none resize-none"
                />

                {/* Submit Button */}
                <motion.button
                  disabled={loading}
                  onClick={handleNotClick}
                  className="absolute bottom-[10px] right-0 bg-[#FFFDF2] text-[#1E1E1E] rounded-[22px] px-[30px] py-[8px] flex justify-center items-center font-outfit"
                  animate={saved ? { scale: [1, 1.05, 1], backgroundColor: '#22c55e', color: '#fff' } : {}}
                >
                  <AnimatePresence mode="wait">
                    {saved ? (
                      <motion.span
                        key="saved"
                        className="flex items-center gap-2 font-medium text-lg"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <CheckIcon /> Fait
                      </motion.span>
                    ) : (
                      <motion.span
                        key="noter"
                        className="text-2xl font-light"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        {loading ? '...' : 'Noter'}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>
            </div>
          </div>
          
          {/* Permet de combler l'espace restant en bas de l'écran (si jamais l'écran est très grand) */}
          <div className="flex-1 bg-[#1E1E1E] w-full" />
        </div>
      </div>

      {/* ── VOST Language Modal ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {showVostModal && (
          <VostModal
            onSelect={handleVostSelect}
            onCancel={() => setShowVostModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default Notation;