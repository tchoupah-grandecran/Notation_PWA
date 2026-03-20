import { useState, useEffect, useRef } from 'react';
import { saveFilmToSheet, getProchainNumeroSeance } from '../api';

// --- DICTIONNAIRE DES THÈMES ---
const THEME_COLORS = {
  'dark-grey': {
    bg:               '#08090F',
    bgGradient:       'linear-gradient(160deg, #08090F 0%, #0D0E18 100%)',
    surfaceOverlay:   'rgba(0,0,0,0.65)',
    text:             '#FFFFFF',
    textOnAccent:     '#08090F',
    primary:          '#D4AF37',
    primaryHover:     '#F5CC2A',
    primaryMuted:     'rgba(212,175,55,0.12)',
    headerBg:         'rgba(18,17,14,0.75)',
    navbarBg:         'rgba(18,17,14,0.88)',
    shadowStrong:     '0 8px 40px rgba(0,0,0,0.75)',
  },
  'velvet-red': {
    bg:               '#7A0A0A',
    bgGradient:       'linear-gradient(135deg, #7A0A0A 0%, #520606 100%)',
    surfaceOverlay:   'rgba(0,0,0,0.70)',
    text:             '#FFFFFF',
    textOnAccent:     '#1A0000',
    primary:          '#FFD700',
    primaryHover:     '#FFE44D',
    primaryMuted:     'rgba(255,215,0,0.15)',
    headerBg:         'rgba(62,5,5,0.82)',
    navbarBg:         'rgba(52,3,3,0.92)',
    shadowStrong:     '0 8px 40px rgba(0,0,0,0.80)',
  },
  'pine-green': {
    bg:               '#0A4D3C',
    bgGradient:       'linear-gradient(135deg, #0A4D3C 0%, #063227 100%)',
    surfaceOverlay:   'rgba(0,0,0,0.65)',
    text:             '#FFFFFF',
    textOnAccent:     '#021A13',
    primary:          '#A8E063',
    primaryHover:     '#BFEE80',
    primaryMuted:     'rgba(168,224,99,0.15)',
    headerBg:         'rgba(5,35,27,0.80)',
    navbarBg:         'rgba(4,28,21,0.90)',
    shadowStrong:     '0 8px 40px rgba(0,0,0,0.75)',
  },
  'coffee-cream': {
    bg:               '#382618',
    bgGradient:       'linear-gradient(135deg, #382618 0%, #4E3218 100%)',
    surfaceOverlay:   'rgba(20,10,5,0.70)',
    text:             '#FAEDCD',
    textOnAccent:     '#2C1A0E',
    primary:          '#CF9060',
    primaryHover:     '#E0A878',
    primaryMuted:     'rgba(207,144,96,0.18)',
    headerBg:         'rgba(28,16,10,0.82)',
    navbarBg:         'rgba(22,12,6,0.92)',
    shadowStrong:     '0 8px 40px rgba(0,0,0,0.75)',
  },
  'pearl-white': {
    bg:               '#FAF8F3',
    bgGradient:       'linear-gradient(135deg, #FFFFFF 0%, #EDE8DC 100%)',
    surfaceOverlay:   'rgba(0,0,0,0.50)',
    text:             '#1C1C1E',
    textOnAccent:     '#FFFFFF',
    primary:          '#A07800',
    primaryHover:     '#8A6600',
    primaryMuted:     'rgba(160,120,0,0.12)',
    headerBg:         'rgba(255,255,255,0.82)',
    navbarBg:         'rgba(255,255,255,0.92)',
    shadowStrong:     '0 8px 40px rgba(0,0,0,0.18)',
  },
  'ocean-blue': {
    bg:               '#0A2463',
    bgGradient:       'linear-gradient(135deg, #0A2463 0%, #0D3B7A 50%, #1E5B8E 100%)',
    surfaceOverlay:   'rgba(0,10,40,0.70)',
    text:             '#FFFFFF',
    textOnAccent:     '#000D2E',
    primary:          '#4FC3F7',
    primaryHover:     '#81D4FA',
    primaryMuted:     'rgba(79,195,247,0.15)',
    headerBg:         'rgba(5,15,55,0.82)',
    navbarBg:         'rgba(4,12,45,0.92)',
    shadowStrong:     '0 8px 40px rgba(0,0,0,0.75)',
  },
  'rose-quartz': {
    bg:               '#4A1040',
    bgGradient:       'linear-gradient(135deg, #4A1040 0%, #7B2560 100%)',
    surfaceOverlay:   'rgba(0,0,0,0.65)',
    text:             '#FFFFFF',
    textOnAccent:     '#2A0018',
    primary:          '#F9A8D4',
    primaryHover:     '#FBC8E4',
    primaryMuted:     'rgba(249,168,212,0.15)',
    headerBg:         'rgba(38,6,32,0.82)',
    navbarBg:         'rgba(30,4,25,0.92)',
    shadowStrong:     '0 8px 40px rgba(0,0,0,0.75)',
  },
  'golden-age': {
    bg:               '#FCFAF5',
    bgGradient:       'linear-gradient(135deg, #FFF8E7 0%, #F0E4CC 100%)',
    surfaceOverlay:   'rgba(252,250,245,0.85)',
    text:             '#4A3B22',
    textOnAccent:     '#2C1A00',
    primary:          '#B8830A',
    primaryHover:     '#9A6E08',
    primaryMuted:     'rgba(184,131,10,0.14)',
    headerBg:         'rgba(255,255,255,0.82)',
    navbarBg:         'rgba(255,255,255,0.92)',
    shadowStrong:     '0 8px 40px rgba(74,59,34,0.15)',
  },
  'pride': {
    bg:               '#1A1A2E',
    bgGradient:       'linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)',
    surfaceOverlay:   'rgba(0,0,0,0.68)',
    text:             '#FFFFFF',
    textOnAccent:     '#1A1A2E',
    primary:          '#B794F4',
    primaryHover:     '#C9A8FF',
    primaryMuted:     'rgba(183,148,244,0.15)',
    headerBg:         'linear-gradient(90deg, #E40303 0%, #FF8C00 20%, #FFED00 40%, #008026 60%, #004DFF 80%, #750787 100%)',
    navbarBg:         'rgba(10,10,22,0.94)',
    shadowStrong:     '0 8px 40px rgba(0,0,0,0.80)',
  },
};

// Dictionnaire des couleurs par genre
const GENRE_COLORS = {
  "Action": "bg-red-500/20 border-red-500/50 text-red-400",
  "Comédie": "bg-yellow-500/20 border-yellow-500/50 text-yellow-400",
  "Drame": "bg-blue-500/20 border-blue-500/50 text-blue-400",
  "Science-Fiction": "bg-purple-500/20 border-purple-500/50 text-purple-400",
  "Horreur": "bg-red-900/40 border-red-700/50 text-red-500",
  "Thriller": "bg-emerald-500/20 border-emerald-500/50 text-emerald-400",
  "Animation": "bg-pink-500/20 border-pink-500/50 text-pink-400",
  "Aventure": "bg-orange-500/20 border-orange-500/50 text-orange-400",
  "Romance": "bg-rose-500/20 border-rose-500/50 text-rose-400",
  "Documentaire": "bg-teal-500/20 border-teal-500/50 text-teal-400",
  "default": "bg-white/10 border-white/30 text-white"
};

// Liste des langues pour la modale
const COMMON_LANGS = [
  { code: "ENG", flag: "🇬🇧", label: "Anglais" },
  { code: "JPN", flag: "🇯🇵", label: "Japonais" },
  { code: "KOR", flag: "🇰🇷", label: "Coréen" },
  { code: "ESP", flag: "🇪🇸", label: "Espagnol" },
  { code: "ITA", flag: "🇮🇹", label: "Italien" },
  { code: "GER", flag: "🇩🇪", label: "Allemand" },
  { code: "CHI", flag: "🇨🇳", label: "Chinois" },
  { code: "POR", flag: "🇵🇹", label: "Portugais" },
  { code: "FRA", flag: "🇫🇷", label: "Français" }
];

function Notation({ films, token, spreadsheetId, onSaved, onSkip, isExiting }) {
  // --- CHARGEMENT DU THÈME ---
  const currentThemeKey = localStorage.getItem('grandecran_theme') || 'dark-grey';
  const theme = THEME_COLORS[currentThemeKey] || THEME_COLORS['dark-grey'];

  const film = films[0];
  const [rating, setRating] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [comment, setComment] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [isCapucine, setIsCapucine] = useState(false);
  const [price, setPrice] = useState("0");
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [numeroSeance, setNumeroSeance] = useState("...");
  const starsRef = useRef(null);
  const [showLangSelector, setShowLangSelector] = useState(false);

  const calculateRating = (e) => {
    if (!starsRef.current) return;
    const rect = starsRef.current.getBoundingClientRect();
    let x = e.clientX - rect.left;
    x = Math.max(0, Math.min(x, rect.width));
    const percent = x / rect.width;
    const rawRating = percent * 10;
    setRating(Math.round(rawRating * 2) / 2);
  };

  const handlePointerDown = (e) => {
    setIsDragging(true);
    calculateRating(e);
    e.target.setPointerCapture(e.pointerId); 
  };

  const handlePointerMove = (e) => {
    if (isDragging) calculateRating(e);
  };

  const handlePointerUp = (e) => {
    setIsDragging(false);
    e.target.releasePointerCapture(e.pointerId);
  };

  useEffect(() => {
    if (film && spreadsheetId && film.annee) {
      getProchainNumeroSeance(token, spreadsheetId, film.annee).then(num => {
        setNumeroSeance(num);
      });
    }
  }, [film, spreadsheetId, token]);

  if (!film) return null;

  const executeSave = async (langueFinale) => {
    setLoading(true);
    const success = await saveFilmToSheet(token, spreadsheetId, {
      ...film,
      langue: langueFinale,
      note: rating,
      commentaire: comment,
      coupDeCoeur: isFavorite ? 1 : 0,
      capucine: isCapucine ? 1 : 0,
      depense: price,
      numeroSeance: numeroSeance
    });

    if (success) {
      setShowLangSelector(false);
      setShowConfirmation(true);
      setTimeout(() => onSaved(), 2000);
    } else {
      alert("Erreur de sauvegarde");
      setLoading(false);
    }
  };

  const handleSaveClick = () => {
    if (!film.langue || film.langue === "?" || film.langue.includes("VO")) {
      setShowLangSelector(true);
    } else {
      executeSave(film.langue);
    }
  };

  return (
    <div 
      // h-[100dvh] z-50 et fixed inset-0 pour couvrir l'application
      // Gestion dynamique de translate-y-full (Slide down) et opacité pour révéler le fond
      className={`fixed inset-0 h-[100dvh] w-full font-sans overflow-hidden transition-all duration-800 ease-[cubic-bezier(0.16,1,0.3,1)] z-50 ${isExiting ? 'translate-y-full' : 'translate-y-0 opacity-100 animate-in fade-in zoom-in-95 duration-300'}`}
      style={{ 
        background: theme.bgGradient, 
        color: theme.text,
        '--color-primary': theme.primary,
        '--color-primary-muted': theme.primaryMuted,
        '--color-text-on-accent': theme.textOnAccent,
        '--color-navbar': theme.navbarBg
      }}
    >

      {/* 1. AFFICHE */}
      {film.affiche && (
        <img
          src={film.affiche}
          className="absolute top-0 left-0 w-full object-cover opacity-100 z-0"
          style={{ height: 'calc(100dvh + env(safe-area-inset-bottom))' }}
          alt=""
        />
      )}

      {/* 2. BOUTON "Plus tard" (Assombri légèrement pour plus de lisibilité sur fonds clairs) */}
      <div className="fixed top-0 left-0 right-0 pt-[env(safe-area-inset-top)] z-50 px-6 flex justify-end">
        <button
          onClick={onSkip}
          className="mt-2 bg-black/50 backdrop-blur-md text-white font-bold text-[10px] tracking-widest uppercase px-4 py-2 rounded-full shadow-lg border border-white/20"
        >
          Plus tard
        </button>
      </div>

      {/* 3. ZONE SCROLLABLE */}
      <div
        className="absolute left-0 right-0 z-10 overflow-y-auto scrollbar-hide"
        style={{
          top: 0,
          bottom: 'calc(-3 * env(safe-area-inset-bottom))',
        }}
      >
        <div style={{ height: '82dvh' }} onClick={onSkip} />

        {/* Overlay glassmorphism : Assombri et flou augmenté pour garantir le contraste */}
        <div
          className="w-full bg-black/50 backdrop-blur-2xl rounded-t-[32px] border-t border-white/10 px-8 pt-3 shadow-[0_-20px_60px_rgba(0,0,0,0.8)]"
          style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}
        >
          <div className="w-16 h-1 bg-white/20 rounded-full mx-auto mb-8"></div>

          {/* TITRE DU FILM */}
          <h2 className="font-syne text-2xl font-black uppercase tracking-tighter leading-none mb-4 drop-shadow-xl text-white">
            {film.titre}
          </h2>

          <div className="flex gap-2 mb-10">
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors ${GENRE_COLORS[film.genre] || GENRE_COLORS.default}`}>
              {film.genre || "Cinéma"}
            </span>
            <span className="bg-white/10 border border-white/20 text-white/90 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
              {film.annee}
            </span>
          </div>

          {/* NOTE & COUP DE COEUR */}
          <div className="mb-14 flex items-center justify-between h-16">
            
            <div ref={starsRef} className="relative flex-1 h-full flex items-center pr-2">
              
              <div className={`absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--color-primary)] text-[var(--color-text-on-accent)] font-black px-3 py-1 rounded-xl text-xs transition-all duration-200 pointer-events-none z-50 shadow-lg ${isDragging ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-90'}`}>
                {rating}
              </div>

              <div className="absolute inset-0 flex justify-between items-center pointer-events-none w-full">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((index) => {
                  const fillPercent = Math.max(0, Math.min(1, rating - (index - 1))) * 100;
                  return (
                    <div key={index} className="relative w-[22px] h-[22px] flex-shrink-0">
                      <svg className="absolute inset-0 w-full h-full text-white/20" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                      {fillPercent > 0 && (
                        <svg 
                          className="absolute inset-0 w-full h-full text-[var(--color-primary)] drop-shadow-md" 
                          fill="currentColor" 
                          viewBox="0 0 24 24"
                          style={{ clipPath: `inset(0 ${100 - fillPercent}% 0 0)` }}
                        >
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                      )}
                    </div>
                  );
                })}
              </div>

              <div
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className="absolute -top-8 -bottom-8 left-0 right-0 z-10 touch-none cursor-pointer"
              />
            </div>

            <div className="w-px h-8 bg-white/20 mx-3"></div>

            <button 
              onClick={() => setIsFavorite(!isFavorite)} 
              className={`relative h-full flex items-center justify-center transition-all duration-300 active:scale-75 focus:outline-none flex-shrink-0 z-20 px-1 ${isFavorite ? 'text-red-500 scale-110' : 'text-white/30 hover:text-white/60'}`}
              aria-label="Coup de coeur"
            >
              <div className="relative w-[22px] h-[22px]">
                <svg className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${isFavorite ? 'opacity-0' : 'opacity-100'}`} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path>
                </svg>
                <svg className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${isFavorite ? 'opacity-100' : 'opacity-0'}`} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path>
                </svg>
              </div>
            </button>
          </div>

          {/* AVIS */}
          <div className="mb-12 relative">
            <textarea
              value={comment} 
              rows={1}
              onChange={(e) => {
                setComment(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              className="w-full bg-transparent border-0 border-b border-white/30 rounded-none pb-2 px-1 outline-none focus:ring-0 focus:border-[var(--color-primary)] text-base min-h-[36px] overflow-hidden resize-none transition-colors relative z-10 text-white/90 leading-relaxed"
            />
            {!comment && (
              <div className="absolute top-0 left-1 flex items-center gap-2 text-white/50 pointer-events-none transition-opacity duration-200 h-[36px] pb-2">
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9"></path>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                </svg>
                <span className="text-base italic truncate">Ton avis à chaud, en quelques mots...</span>
              </div>
            )}
          </div>

          {/* OPTIONS : Capucines & Extra */}
          <div className="mb-12 grid grid-cols-2 gap-4">
            <div 
              onClick={() => setIsCapucine(!isCapucine)} 
              className={`flex flex-col items-center justify-center p-4 rounded-xl border cursor-pointer transition-all duration-300 active:scale-95 ${isCapucine ? 'bg-[var(--color-primary-muted)] border-[var(--color-primary)] text-[var(--color-primary)]' : 'bg-white/5 border-white/20 text-white/60 hover:bg-white/10'}`}
            >
              <img 
                src={isCapucine ? "https://i.imgur.com/lg1bkrO.png" : "https://i.imgur.com/7SaHwd8.png"} 
                alt="Capucines" 
                className="w-10 h-10 mb-3 object-contain drop-shadow-md transition-transform duration-300"
              />
              <span className="font-bold text-[9px] uppercase tracking-widest text-center leading-tight whitespace-pre-line">
                {isCapucine ? "Sélectionné\nCapucines" : "Capucines"}
              </span>
            </div>

            <div className="flex flex-col items-center justify-center p-4 bg-white/5 rounded-xl border border-white/20 text-white relative">
              <svg className="w-9 h-9 mb-2 text-white/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
              <div className="flex items-center justify-center w-full">
                <input
                  type="text" 
                  inputMode="decimal"
                  value={price === "0" ? "" : price} 
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0,00"
                  className="bg-transparent text-right outline-none font-medium text-lg w-16 placeholder:text-white/40 text-white"
                />
                <span className="font-black text-lg text-white/70 ml-1 mt-0">€</span>
              </div>
            </div>
          </div>

          <button
            disabled={loading}
            onClick={handleSaveClick}
            className="w-full font-black py-4 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.4)] active:scale-95 transition-all text-xl italic uppercase tracking-tighter"
            style={{ background: theme.primary, color: theme.textOnAccent }}
          >
            {loading ? 'CHARGEMENT...' : 'ENREGISTRER'}
          </button>

          {/* RÉCAP TECHNIQUE (Repensé en 2 colonnes pour plus de lisibilité) */}
          <div className="mt-8 mb-10 px-1">
            <div className="flex items-center justify-center gap-2 mb-4 pb-4 border-b border-white/10 mx-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-primary)]">#{numeroSeance}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Séance de l'année</span>
            </div>

            <div className="grid grid-cols-2 gap-y-4 gap-x-3">
              <div className="flex items-center justify-left gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                <svg className="w-5 h-5 text-white/50 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                <span className="text-sm font-medium text-white/90">{film.date}</span>
              </div>
              <div className="flex items-center justify-left gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                <svg className="w-5 h-5 text-white/50 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                <span className="text-sm font-medium text-white/90">{film.heure}</span>
              </div>
              <div className="flex items-center justify-left gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                <svg className="w-5 h-5 text-white/50 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 22h14"></path><path d="M5 2h14"></path><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"></path><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"></path></svg>
                <span className="text-sm font-medium text-white/90">{film.duree}</span>
              </div>
              <div className="flex items-center justify-left gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                <svg className="w-5 h-5 text-white/50 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                <span className="text-sm font-medium text-white/90 truncate">{film.salle || "?"}</span>
              </div>
              <div className="flex items-center justify-left gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                <svg className="w-5 h-5 text-white/50 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3"></path><path d="M3 11v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H7v-2a2 2 0 0 0-4 0Z"></path><path d="M5 18v2"></path><path d="M19 18v2"></path></svg>
                <span className="text-sm font-medium text-white/90">Siège {film.siege || "?"}</span>
              </div>
              <div className="flex items-center justify-left gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                <svg className="w-5 h-5 text-white/50 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                <span className="text-sm font-medium text-white/90 uppercase">{film.langue || "?"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODALE DE SÉLECTION DE LANGUE */}
      {showLangSelector && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center overflow-hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={() => setShowLangSelector(false)}></div>
          
          <div className="relative w-full rounded-t-[32px] p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] animate-slide-in-bottom border-t border-white/10 shadow-[0_-20px_60px_rgba(0,0,0,0.9)]" style={{ background: theme.navbarBg }}>
            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6"></div>
            
            <h3 className="font-syne text-2xl font-bold mb-2 text-center leading-none text-white">Langue originale ?</h3>
            <p className="text-center text-white/50 text-[10px] uppercase tracking-widest font-black mb-6">Sélectionne le trigramme</p>
            
            <div className="grid grid-cols-3 gap-3">
              {COMMON_LANGS.map((l) => (
                <button 
                  key={l.code}
                  onClick={() => executeSave(l.code)}
                  className="flex flex-col items-center justify-center py-4 bg-white/5 rounded-2xl active:bg-[var(--color-primary-muted)] active:border-[var(--color-primary)] active:text-[var(--color-primary)] transition-all border border-white/10 active:scale-95 text-white/90"
                >
                  <span className="text-3xl mb-1 drop-shadow-md">{l.flag}</span>
                  <span className="text-[10px] font-black tracking-widest">{l.code}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION */}
      {showConfirmation && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
          <span className="text-8xl mb-6 drop-shadow-2xl">🍿</span>
          <h2 className="text-4xl font-black uppercase italic tracking-tighter text-[var(--color-primary)] drop-shadow-lg">Archivé !</h2>
        </div>
      )}
    </div>
  );
}

export default Notation;