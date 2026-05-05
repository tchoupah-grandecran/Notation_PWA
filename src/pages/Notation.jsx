import { useState, useEffect, useRef, useMemo } from 'react';
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
const PencilIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[13px] h-[13px]">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.5 2.5l2 2-8 8H3.5v-2l8-8zM10 4l2 2" />
  </svg>
);
const ImageIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[14px] h-[14px]">
    <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" />
    <circle cx="5.5" cy="6" r="1.2" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M1.5 11l3.5-3.5 2.5 2.5 2-2 3.5 3.5" />
  </svg>
);

// ─── COMPOSANT ETOILE ────────────────────────────────────────────────────────
function Star({ fill = 0, size = 34 }) {
  const id = useMemo(() => `star-grad-${Math.random().toString(36).slice(2)}`, []);
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="flex-shrink-0 transition-transform">
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

  // États pour la sélection de la langue
  const [selectedLang, setSelectedLang] = useState('FRA');
  const [customLang, setCustomLang] = useState('');

  // État pour la modification du titre
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const titleInputRef = useRef(null);

  // État pour le poster personnalisé
  const [customPoster, setCustomPoster] = useState(null); // data URL de l'image choisie
  const posterInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [numeroSeance, setNumeroSeance] = useState('...');

  const safeRatingScale = Number(ratingScale) || 5;
  const starSize = safeRatingScale > 5 ? 26 : 34;
  const gapSize = safeRatingScale > 5 ? "gap-[3px]" : "gap-[5px]";

  const starsRef = useRef(null);

  const tmdbPosterUrl = film?.affiche
    ? (import.meta.env.DEV
        ? `/tmdb-proxy?url=${encodeURIComponent(film.affiche)}`
        : `/api/proxy-image?url=${encodeURIComponent(film.affiche)}`)
    : null;

  // Le poster affiché : priorité au poster personnalisé
  const posterUrl = customPoster || tmdbPosterUrl;
  // Le titre affiché : priorité au titre édité
  const displayTitle = editedTitle || film?.titre || '';

  useEffect(() => {
    if (film && spreadsheetId) {
      getProchainNumeroSeance(token, spreadsheetId, film.annee).then(setNumeroSeance);
    }
  }, [film, spreadsheetId, token]);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  if (!film) return null;

  // ─── HANDLERS TITRE ───────────────────────────────────────────────────────
  const handleTitleEditStart = () => {
    setEditedTitle(displayTitle);
    setIsEditingTitle(true);
  };

  const handleTitleEditConfirm = () => {
    if (!editedTitle.trim()) setEditedTitle(film.titre);
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') handleTitleEditConfirm();
    if (e.key === 'Escape') {
      setEditedTitle(film.titre);
      setIsEditingTitle(false);
    }
  };

  // ─── HANDLERS POSTER ──────────────────────────────────────────────────────
  const handlePosterChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setCustomPoster(ev.target.result);
    reader.readAsDataURL(file);
    // Reset input pour permettre de re-sélectionner le même fichier
    e.target.value = '';
  };

  // ─── HANDLERS RATING ─────────────────────────────────────────────────────
  const calculateRating = (e) => {
    if (!starsRef.current) return;
    const rect = starsRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const raw = (x / rect.width) * safeRatingScale;
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

  // ─── SAVE ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setLoading(true);

    const finalLang = film.langue === 'VF'
      ? 'FRA'
      : (selectedLang === 'Autre' ? (customLang.toUpperCase() || 'ENG') : selectedLang);

    const success = await saveFilmToSheet(token, spreadsheetId, {
      ...film,
      titre: displayTitle,
      affiche: customPoster || film.affiche,
      numeroSeance,
      note: rating,
      commentaire: comment,
      coupDeCoeur: isFavorite ? 1 : 0,
      capucine: isCapucine ? 1 : 0,
      depense: price,
      langue: finalLang,
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
          className="absolute inset-0"
          style={{ backgroundImage: 'linear-gradient(to bottom, transparent 95%, var(--theme-bg) 100%)' }}
        />
      </div>

      {/* BOUTON PLUS TARD */}
      <button
        onClick={onSkip}
        className="fixed top-[62px] right-4 flex items-center justify-center px-3.5 py-1.5 bg-black/20 backdrop-blur-xl rounded-full border border-white/20 text-white text-[10px] font-bold z-20 shadow-lg active:scale-95 transition-all"
      >
        Plus tard
      </button>

      {/* ── INPUT FICHIER CACHÉ ── */}
      <input
        ref={posterInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePosterChange}
      />

      {/* ── ZONE DE SCROLL ── */}
      <div className="absolute inset-0 z-10 overflow-y-auto scrollbar-hide flex flex-col">

        <div style={{ height: 'calc(62dvh - 28px)' }} className="w-full flex-shrink-0" />

        {/* ── DRAWER ── */}
        <div
          className="relative w-full rounded-t-[28px] px-[18px] pt-[20px] pb-10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-[var(--theme-border)] flex-shrink-0"
          style={{ backgroundColor: 'var(--theme-surface)' }}
        >
          <div className="absolute top-[8px] left-1/2 -translate-x-1/2 w-[70px] h-[3px] bg-[var(--theme-border)] rounded-full" />

          {/* ── 1. POSTER BANNER ── */}
          <div className="relative w-full h-[140px] rounded-2xl overflow-hidden mb-5">
            {posterUrl && (
              <img
                src={posterUrl}
                alt="Affiche"
                className="w-full h-full object-cover object-center blur-sm scale-105"
              />
            )}

            <div
              className="absolute inset-0"
              style={{ backgroundImage: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)' }}
            />

            {/* Badge numéro de séance */}
            <div className="absolute top-3 left-4 px-2.5 py-1 rounded-full bg-black/20 backdrop-blur-md border border-white/10">
              <span className="text-white/80 text-[10px] font-medium block leading-none">
                #{numeroSeance}è séance
              </span>
            </div>

            {/* Bouton changer le poster */}
            <button
              onClick={() => posterInputRef.current?.click()}
              className="absolute top-3 right-3 flex items-center gap-[5px] px-2.5 py-1.5 rounded-full bg-black/30 backdrop-blur-md border border-white/20 text-white/80 text-[10px] font-medium active:scale-95 transition-all"
            >
              <ImageIcon />
              {customPoster ? 'Changer' : 'Affiche'}
            </button>

            {/* Titre éditable */}
            <div className="absolute bottom-3 left-4 right-[100px] flex items-end gap-[6px]">
              <AnimatePresence mode="wait">
                {isEditingTitle ? (
                  <motion.input
                    key="input"
                    ref={titleInputRef}
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onBlur={handleTitleEditConfirm}
                    onKeyDown={handleTitleKeyDown}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full text-white text-[22px] font-galinoy leading-[1.1] bg-transparent outline-none border-b border-white/40 pb-0.5"
                    style={{ caretColor: 'var(--theme-accent)' }}
                  />
                ) : (
                  <motion.h2
                    key="title"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-white text-[24px] font-galinoy leading-[1.1] line-clamp-2"
                  >
                    {displayTitle}
                  </motion.h2>
                )}
              </AnimatePresence>

              {/* Bouton crayon modifier le titre */}
              {!isEditingTitle && (
                <motion.button
                  onClick={handleTitleEditStart}
                  className="flex-shrink-0 mb-[3px] p-1 rounded-full bg-black/20 backdrop-blur-md border border-white/15 text-white/60 active:scale-90 transition-all"
                  whileTap={{ scale: 0.85 }}
                >
                  <PencilIcon />
                </motion.button>
              )}
            </div>

            <div className="absolute bottom-3 right-3 h-6 flex items-center px-3 rounded-full border border-white/20 bg-black/30 backdrop-blur-sm">
              <span className="text-white/90 text-[10px] font-semibold tracking-wide leading-none">
                {film.genre || 'Drame'}
              </span>
            </div>
          </div>

          {/* ── 2. STAR RATING ── */}
          <div className="relative flex items-center justify-center gap-[5px] h-[34px] mb-5">
            <AnimatePresence>
              {isDragging && (
                <motion.div
                  className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[var(--theme-accent)] text-[var(--theme-bg)] font-galinoy italic px-3 py-1 rounded-xl text-xl pointer-events-none z-20"
                  initial={{ opacity: 0, y: 5, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 5, scale: 0.8 }}
                >
                  {rating}
                </motion.div>
              )}
            </AnimatePresence>

            <div
              ref={starsRef}
              className={`flex items-center justify-center ${gapSize} w-full`}
            >
              {[...Array(safeRatingScale)].map((_, i) => (
                <Star
                  key={i}
                  size={starSize}
                  fill={Math.max(0, Math.min(1, rating - i))}
                />
              ))}
            </div>

            <div
              className="absolute inset-0 z-10 touch-none cursor-pointer"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            />
          </div>

          {/* ── 3. METADATA CHIPS ── */}
          <div className="flex flex-wrap gap-[6px] mb-4 opacity-50">
            {[
              { Icon: CalendarIcon, val: film.date || '00/00/2026' },
              { Icon: ClockIcon,    val: film.heure || '00:00' },
              { Icon: TimerIcon,    val: film.duree || '--h--' },
              { Icon: GlobeIcon,    val: film.langue || 'VOST' },
              { Icon: TheaterIcon,  val: film.salle || 'Salle --' },
              { Icon: SeatIcon,     val: film.siege || 'F--' },
            ].map(({ Icon, val }, idx) => (
              <div
                key={idx}
                className="flex items-center gap-[5px] px-[10px] py-[5px] rounded-full border border-[var(--theme-border)] bg-[var(--theme-bg)]"
              >
                <Icon />
                <span className="text-[var(--theme-text)] text-[10px] font-light italic">{val}</span>
              </div>
            ))}
          </div>

          {/* ── 3.5 SÉLECTION LANGUE (SI VOST) ── */}
          {film.langue !== 'FRA' && (
            <div className="mb-5 bg-[var(--theme-bg)] rounded-[16px] border border-[var(--theme-border)] p-3">
              <span className="text-[var(--theme-text-secondary)] text-[11px] font-medium block mb-2 opacity-70">
                Langue originale (Trigramme)
              </span>
              <div className="flex flex-wrap gap-2">
                {['ENG', 'GER', 'CHI', 'ITA', 'Autre'].map(lang => (
                  <button
                    key={lang}
                    onClick={() => setSelectedLang(lang)}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wide transition-all border ${
                      selectedLang === lang
                        ? 'bg-[var(--theme-accent)] border-[var(--theme-accent)] text-[var(--theme-bg)] shadow-sm'
                        : 'bg-transparent border-[var(--theme-border)] text-[var(--theme-text-secondary)]'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>

              <AnimatePresence>
                {selectedLang === 'Autre' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0, marginTop: 0 }}
                    animate={{ height: 'auto', opacity: 1, marginTop: 12 }}
                    exit={{ height: 0, opacity: 0, marginTop: 0 }}
                    className="overflow-hidden"
                  >
                    <input
                      type="text"
                      maxLength={3}
                      value={customLang}
                      onChange={(e) => setCustomLang(e.target.value.toUpperCase())}
                      placeholder="EX: JPN"
                      className="w-[80px] bg-transparent border-b border-[var(--theme-border)] text-[var(--theme-text)] text-xs font-bold outline-none uppercase pb-1 text-center focus:border-[var(--theme-accent)] transition-colors"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* ── 4. TOGGLES ROW (Coup de cœur + Capucine) ── */}
          <div className="flex gap-[10px] mb-4">
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className={`flex-1 flex items-center justify-center gap-[8px] h-[46px] rounded-[16px] border transition-all ${
                isFavorite
                ? 'border-red-500/50 bg-red-500/10 text-red-500'
                : 'border-[var(--theme-border)] text-[var(--theme-text-secondary)]'
              }`}
            >
              <ChubbyHeart filled={isFavorite} />
              <span className={`text-[11px] font-medium transition-colors ${isFavorite ? 'text-red-500' : 'text-[var(--theme-text-secondary)]'}`}>
                Coup de cœur
              </span>
            </button>

            <button
              onClick={() => setIsCapucine(!isCapucine)}
              className={`flex-1 flex items-center justify-center gap-[8px] h-[46px] rounded-[16px] border transition-all ${
                isCapucine
                ? 'border-[var(--theme-accent)] bg-[var(--theme-accent-muted)]'
                : 'border-[var(--theme-border)] bg-transparent'
              }`}
            >
              {isCapucine ? (
                <img src="https://i.imgur.com/lg1bkrO.png" className="w-[22px] h-[22px] rounded-full object-cover" alt="" />
              ) : (
                <div className="w-[22px] h-[22px] bg-[var(--theme-border)] rounded-full" />
              )}
              <span className={`text-[11px] font-medium transition-colors ${isCapucine ? 'text-[var(--theme-accent)]' : 'text-[var(--theme-text-secondary)]'}`}>
                {isCapucine ? 'Capucine' : 'Pas Capucine'}
              </span>
            </button>
          </div>

          {/* ── 5. DÉPENSE ROW ── */}
          <div className="flex items-center justify-between h-[50px] px-5 rounded-[16px] border border-[var(--theme-border)] bg-[var(--theme-bg)] mb-4">
            <div className="flex items-center gap-[8px]">
              <span className="text-[var(--theme-text-secondary)] text-[16px] font-light opacity-50">Extras</span>
            </div>
            <div className="flex items-center gap-[4px]">
              <input
                type="number"
                inputMode="decimal"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="bg-transparent text-[var(--theme-text)] text-sm font-bold outline-none text-right w-[72px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="text-[var(--theme-text-secondary)] text-[11px] font-black opacity-40">€</span>
            </div>
          </div>

          {/* ── 6. COMMENTAIRE ── */}
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Ton avis à chaud"
            className="w-full h-[80px] bg-[var(--theme-bg)] rounded-[15px] p-3 text-xs font-light text-[var(--theme-text)] placeholder:text-[var(--theme-text-secondary)] outline-none resize-none border border-[var(--theme-border)] transition-colors focus:border-[var(--theme-accent)]"
          />

          {/* ── 7. NOTER BUTTON ── */}
          <div className="mt-6 w-full flex justify-center">
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

        <div className="flex-1 bg-[var(--theme-surface)] w-full" />
      </div>
    </div>
  );
}

export default Notation;