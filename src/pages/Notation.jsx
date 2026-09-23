import { createElement, useState, useEffect, useRef, useId } from 'react';
// ESLint's no-unused-vars does not detect Framer Motion's JSX namespace usage.
// eslint-disable-next-line no-unused-vars
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
  const id = `star-grad-${useId().replace(/:/g, '')}`;
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

function ValidationField({ label, value, onChange, placeholder, inputMode = 'text' }) {
  return (
    <label className="block">
      <span className="block text-[9px] font-black uppercase tracking-[0.18em] text-[var(--theme-text-secondary)] opacity-60 mb-1.5">
        {label}
      </span>
      <input
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className="w-full h-11 bg-[var(--theme-bg)] border border-[var(--theme-border)] rounded-[14px] px-3 text-[13px] font-semibold text-[var(--theme-text)] outline-none focus:border-[var(--theme-accent)] transition-colors"
      />
    </label>
  );
}

// Chaque séance possède une instance de formulaire indépendante. Quand la file
// avance, le nouvel identifiant remonte le formulaire sans hériter de « Fait ».
function Notation({ films, ...props }) {
  const film = films?.[0] || null;
  if (!film) return null;
  const filmKey = film.messageId || film.fingerprint || `${film.titre || film.title}-${film.date}-${film.heure}`;
  return <NotationForm key={filmKey} initialFilm={film} {...props} />;
}

function createValidationDraft(film) {
  return {
    titre: film.titre || film.title || '',
    date: film.date || '',
    heure: film.heure || '',
    duree: film.duree && film.duree !== '--h--' ? film.duree : '',
    langue: film.langue && film.langue !== '?' ? film.langue : '',
    salle: film.salle || '',
    siege: film.siege || '',
    depense: film.depense || '0,00',
  };
}

// ─── FORMULAIRE DE NOTATION ─────────────────────────────────────────────────
function NotationForm({ initialFilm, token, spreadsheetId, ratingScale = 5, onSaved, onSkip }) {
  // 1. D'abord, on déclare tous les états locaux (Hooks d'état en premier)
  const [rating, setRating] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [comment, setComment] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [isCapucine, setIsCapucine] = useState(false);
  const [price, setPrice] = useState(initialFilm.depense || '0.00');

  const [selectedLang, setSelectedLang] = useState(null);
  const [customLang, setCustomLang] = useState('');
  const [langError, setLangError] = useState(false);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const titleInputRef = useRef(null);
  const starsRef = useRef(null);

  const [customPoster, setCustomPoster] = useState(null);
  const posterInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [ratingError, setRatingError] = useState('');
  const [saveError, setSaveError] = useState('');
  const saveTimerRef = useRef(null);
  const [numeroSeance, setNumeroSeance] = useState('...');
  const [validatedFilm, setValidatedFilm] = useState(null);
  const [validationDraft, setValidationDraft] = useState(() => createValidationDraft(initialFilm));
  const [showValidation, setShowValidation] = useState(Boolean(initialFilm.needsValidation));
  const [validationError, setValidationError] = useState('');

  const film = validatedFilm || initialFilm;

  // 4. Récupération des données de séance
  useEffect(() => {
    // On utilise une détection adaptative de l'année pour l'API
    const screeningYear = initialFilm?.date?.split('/')?.[2];
    const filmYear = screeningYear || initialFilm?.annee || initialFilm?.release_date?.split('-')[0] || String(new Date().getFullYear());
    if (initialFilm && spreadsheetId) {
      let active = true;
      getProchainNumeroSeance(token, spreadsheetId, filmYear).then((value) => {
        if (active) setNumeroSeance(value);
      });
      return () => { active = false; };
    }
  }, [initialFilm, spreadsheetId, token]);

  useEffect(() => () => clearTimeout(saveTimerRef.current), []);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  // Fallbacks adaptatifs pour l'affichage (gère les clés FR et EN de TMDB)
  const movieTitle = film.titre || film.title || '';
  const moviePoster = film.affiche || film.poster_path || null;

  const tmdbPosterUrl = moviePoster
    ? (import.meta.env.DEV
        ? `/tmdb-proxy?url=${encodeURIComponent(moviePoster)}`
        : `/api/proxy-image?url=${encodeURIComponent(moviePoster)}`)
    : null;

  const posterUrl = customPoster || tmdbPosterUrl;
  const displayTitle = editedTitle || movieTitle;

  const safeRatingScale = Number(ratingScale) || 5;
  const starSize = safeRatingScale > 5 ? 26 : 34;
  const gapSize = safeRatingScale > 5 ? "gap-[3px]" : "gap-[5px]";

  const handleValidationChange = (key, value) => {
    setValidationDraft((prev) => ({ ...(prev || {}), [key]: value }));
    setValidationError('');
  };

  const handleValidationConfirm = () => {
    const draft = validationDraft || {};
    if (!draft.titre?.trim() || !draft.date?.trim() || !draft.heure?.trim()) {
      setValidationError('Titre, date et heure sont nécessaires pour enregistrer la séance.');
      return;
    }
    const nextFilm = {
      ...initialFilm,
      titre: draft.titre.trim(),
      date: draft.date.trim(),
      heure: draft.heure.trim(),
      duree: draft.duree?.trim() || initialFilm.duree || '--h--',
      langue: draft.langue?.trim().toUpperCase() || '?',
      salle: draft.salle?.trim(),
      siege: draft.siege?.trim(),
      depense: draft.depense?.trim() || '0,00',
      needsValidation: false,
      validationReasons: [],
    };
    setValidatedFilm(nextFilm);
    setEditedTitle(nextFilm.titre);
    setPrice(nextFilm.depense || '0,00');
    if (nextFilm.langue && nextFilm.langue !== '?' && nextFilm.langue !== 'FRA') {
      setSelectedLang(nextFilm.langue);
    }
    setShowValidation(false);
  };

  // ─── HANDLERS TITRE ───────────────────────────────────────────────────────
  const handleTitleEditStart = () => {
    setEditedTitle(displayTitle);
    setIsEditingTitle(true);
  };

  const handleTitleEditConfirm = () => {
    if (!editedTitle.trim()) setEditedTitle(movieTitle);
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') handleTitleEditConfirm();
    if (e.key === 'Escape') {
      setEditedTitle(movieTitle);
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
    setRatingError('');
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
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handleRatingKeyDown = (event) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      event.preventDefault();
      setRating((current) => Math.min(safeRatingScale, current + 0.5));
      setRatingError('');
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      event.preventDefault();
      setRating((current) => Math.max(0, current - 0.5));
      setRatingError('');
    } else if (event.key === 'Home') {
      event.preventDefault();
      setRating(0);
      setRatingError('');
    } else if (event.key === 'End') {
      event.preventDefault();
      setRating(safeRatingScale);
      setRatingError('');
    }
  };

  // ─── SAVE ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (loading || saved) return;
    if (rating <= 0) {
      setRatingError('Choisis une note pour continuer.');
      return;
    }
    const isVost = film.langue !== 'FRA' && film.langue !== 'VF';
    const hasLang = selectedLang && (selectedLang !== 'Autre' || customLang.trim().length > 0);
    if (isVost && !hasLang) {
      setLangError(true);
      return;
    }
    setLangError(false);
    setSaveError('');
    setLoading(true);

    const finalLang = (film.langue === 'VF' || film.langue === 'FRA')
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
      saveTimerRef.current = setTimeout(() => onSaved?.(film), 700);
    } else {
      setSaveError('La sauvegarde a échoué. Vérifie ta connexion puis réessaie.');
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
        type="button"
        className="fixed top-[calc(env(safe-area-inset-top)+12px)] right-4 min-h-11 flex items-center justify-center px-4 bg-black/30 backdrop-blur-xl rounded-full border border-white/20 text-white text-[11px] font-bold z-20 shadow-lg active:scale-95 transition-all"
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

          {showValidation ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="pt-4"
            >
              <div className="mb-5">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--theme-accent)] mb-1">
                      Vérification
                    </p>
                    <h2 className="font-galinoy italic text-[30px] leading-[0.95] text-[var(--theme-text)]">
                      Séance détectée
                    </h2>
                  </div>
                  {initialFilm?.source && (
                    <span className="px-3 py-1 rounded-full bg-[var(--theme-bg)] border border-[var(--theme-border)] text-[9px] font-black uppercase tracking-[0.14em] text-[var(--theme-text-secondary)]">
                      {initialFilm.source}
                    </span>
                  )}
                </div>

                {initialFilm?.validationReasons?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {initialFilm.validationReasons.map((reason) => (
                      <span
                        key={reason}
                        className="px-2.5 py-1 rounded-full bg-[var(--theme-accent-muted)] text-[var(--theme-accent)] text-[9px] font-bold"
                      >
                        {reason}
                      </span>
                    ))}
                  </div>
                )}

                <p className="text-[12px] leading-relaxed text-[var(--theme-text-secondary)]">
                  Confirme les infos extraites de l'e-mail avant de passer à la notation.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="col-span-2">
                  <ValidationField
                    label="Film"
                    value={validationDraft?.titre}
                    onChange={(value) => handleValidationChange('titre', value)}
                    placeholder="Titre du film"
                  />
                </div>
                <ValidationField
                  label="Date"
                  value={validationDraft?.date}
                  onChange={(value) => handleValidationChange('date', value)}
                  placeholder="JJ/MM/AAAA"
                  inputMode="numeric"
                />
                <ValidationField
                  label="Heure"
                  value={validationDraft?.heure}
                  onChange={(value) => handleValidationChange('heure', value)}
                  placeholder="20:30"
                  inputMode="numeric"
                />
                <ValidationField
                  label="Durée"
                  value={validationDraft?.duree}
                  onChange={(value) => handleValidationChange('duree', value)}
                  placeholder="1h42"
                />
                <ValidationField
                  label="Langue"
                  value={validationDraft?.langue}
                  onChange={(value) => handleValidationChange('langue', value.toUpperCase())}
                  placeholder="FRA, ENG..."
                />
                <ValidationField
                  label="Salle"
                  value={validationDraft?.salle}
                  onChange={(value) => handleValidationChange('salle', value)}
                  placeholder="Salle 2"
                />
                <ValidationField
                  label="Siège"
                  value={validationDraft?.siege}
                  onChange={(value) => handleValidationChange('siege', value)}
                  placeholder="K / 14"
                />
                <div className="col-span-2">
                  <ValidationField
                    label="Dépense"
                    value={validationDraft?.depense}
                    onChange={(value) => handleValidationChange('depense', value)}
                    placeholder="0,00"
                    inputMode="decimal"
                  />
                </div>
              </div>

              {validationError && (
                <p className="text-[11px] text-red-500 font-semibold mb-4">
                  {validationError}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onSkip}
                  className="min-h-12 px-5 rounded-full border border-[var(--theme-border)] text-[var(--theme-text-secondary)] text-[11px] font-bold active:scale-95 transition-transform"
                >
                  Plus tard
                </button>
                <motion.button
                  type="button"
                  onClick={handleValidationConfirm}
                  className="flex-1 h-12 rounded-full bg-[var(--theme-text)] text-[var(--theme-surface)] text-[13px] font-black active:scale-95 transition-transform"
                  whileTap={{ scale: 0.98 }}
                >
                  Valider la séance
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <>
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
                Séance n° {numeroSeance}
              </span>
            </div>

            {/* Bouton changer le poster */}
            <button
              onClick={() => posterInputRef.current?.click()}
              type="button"
              aria-label={customPoster ? 'Changer l’affiche' : 'Ajouter une affiche'}
              className="absolute top-3 right-3 min-h-11 flex items-center gap-[5px] px-3 rounded-full bg-black/30 backdrop-blur-md border border-white/20 text-white/90 text-[11px] font-medium active:scale-95 transition-all"
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
                  type="button"
                  aria-label="Modifier le titre du film"
                  className="flex-shrink-0 min-w-11 min-h-11 flex items-center justify-center mb-[3px] rounded-full bg-black/30 backdrop-blur-md border border-white/20 text-white active:scale-90 transition-all"
                  whileTap={{ scale: 0.85 }}
                >
                  <PencilIcon />
                </motion.button>
              )}
            </div>

            <div className="absolute bottom-3 right-3 h-6 flex items-center px-3 rounded-full border border-white/20 bg-black/30 backdrop-blur-sm">
              <span className="text-white/90 text-[10px] font-semibold tracking-wide leading-none">
                {film.genre || 'Genre à préciser'}
              </span>
            </div>
          </div>

          {/* ── 2. STAR RATING ── */}
          <div className="relative flex items-center justify-center gap-[5px] h-12 mb-5">
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
              className={`flex items-center justify-center ${gapSize} w-full pointer-events-none`}
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
              className="absolute inset-0 z-10 touch-none cursor-pointer rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] focus-visible:ring-inset"
              role="slider"
              tabIndex={0}
              aria-label="Note du film"
              aria-valuemin={0}
              aria-valuemax={safeRatingScale}
              aria-valuenow={rating}
              aria-valuetext={rating > 0 ? `${rating} sur ${safeRatingScale}` : 'Aucune note sélectionnée'}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onKeyDown={handleRatingKeyDown}
            />
          </div>
          {ratingError && <p role="alert" className="-mt-3 mb-4 text-center text-[11px] font-semibold text-red-500">{ratingError}</p>}

          {/* ── 3. METADATA CHIPS ── */}
          <div className="flex flex-wrap gap-[6px] mb-4 opacity-50">
            {[
              { Icon: CalendarIcon, val: film.date || '—' },
              { Icon: ClockIcon,    val: film.heure || '—' },
              { Icon: TimerIcon,    val: film.duree && film.duree !== '--h--' ? film.duree : '—' },
              { Icon: GlobeIcon,    val: film.langue && film.langue !== '?' ? film.langue : '—' },
              { Icon: TheaterIcon,  val: film.salle || '—' },
              { Icon: SeatIcon,     val: film.siege || '—' },
            ].map(({ Icon, val }, idx) => (
              <div
                key={idx}
                className="flex items-center gap-[5px] px-[10px] py-[5px] rounded-full border border-[var(--theme-border)] bg-[var(--theme-bg)]"
              >
                {createElement(Icon)}
                <span className="text-[var(--theme-text)] text-[10px] font-light italic">{val}</span>
              </div>
            ))}
          </div>

          {/* ── 3.5 SÉLECTION LANGUE (SI VOST) ── */}
          {film.langue !== 'FRA' && film.langue !== 'VF' && (
            <div className={`mb-5 bg-[var(--theme-bg)] rounded-[16px] border p-3 transition-colors ${langError ? 'border-red-500' : 'border-[var(--theme-border)]'}`}>
  <span className={`text-[11px] font-medium block mb-2 transition-colors ${langError ? 'text-red-500 opacity-100' : 'text-[var(--theme-text-secondary)] opacity-70'}`}>
    {langError ? '⚠ Sélectionne une langue pour continuer' : 'Langue originale (Trigramme)'}
  </span>
  <div className="flex flex-wrap gap-2">
    {['ENG', 'GER', 'CHI', 'ITA', 'Autre'].map(lang => (
                    <button
                      key={lang}
                      type="button"
                      aria-pressed={selectedLang === lang}
                      onClick={() => { setSelectedLang(lang); setLangError(false); }}
                    className={`min-h-11 px-4 rounded-full text-[11px] font-bold tracking-wide transition-all border ${
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
                      aria-label="Préciser la langue"
                      maxLength={3}
                      value={customLang}
                      onChange={(e) => setCustomLang(e.target.value.toUpperCase())}
                      placeholder="EX: JPN"
                      className="w-[96px] min-h-11 bg-transparent border-b border-[var(--theme-border)] text-[var(--theme-text)] text-xs font-bold outline-none uppercase pb-1 text-center focus:border-[var(--theme-accent)] transition-colors"
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
              type="button"
              aria-pressed={isFavorite}
              className={`flex-1 flex items-center justify-center gap-[8px] h-[46px] rounded-[23px] border transition-all ${
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
              type="button"
              aria-pressed={isCapucine}
              className={`flex-1 flex items-center justify-center gap-[8px] h-[46px] rounded-[23px] border transition-all ${
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
              <label htmlFor="ticket-price" className="text-[var(--theme-text-secondary)] text-[14px] font-medium">Dépense</label>
            </div>
            <div className="flex items-center gap-[4px]">
              <input
                id="ticket-price"
                aria-label="Dépense en euros"
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
            aria-label="Commentaire sur la séance"
            placeholder="Ton avis à chaud"
            className="w-full min-h-[96px] bg-[var(--theme-bg)] rounded-[15px] p-3 text-xs font-light text-[var(--theme-text)] placeholder:text-[var(--theme-text-secondary)] outline-none resize-y border border-[var(--theme-border)] transition-colors focus:border-[var(--theme-accent)]"
          />

          {/* ── 7. NOTER BUTTON ── */}
          {saveError && <p role="alert" className="mt-4 text-center text-[11px] font-semibold text-red-500">{saveError}</p>}
          <div className="mt-5 w-full flex justify-center">
            <motion.button
              type="button"
              disabled={loading || saved}
              aria-live="polite"
              onClick={handleSave}
              className="w-full max-w-[280px] py-[14px] rounded-[42px] flex justify-center items-center font-outfit shadow-lg transition-all"
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
                    {loading ? 'Enregistrement…' : 'Noter'}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
            </>
          )}
        </div>

        <div className="flex-1 bg-[var(--theme-surface)] w-full" />
      </div>
    </div>
  );
}

export default Notation;
