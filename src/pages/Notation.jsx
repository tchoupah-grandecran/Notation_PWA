import { useState, useEffect, useRef } from 'react';
import { saveFilmToSheet, getProchainNumeroSeance } from '../api';
import { ImaxTag } from '../components/ImaxTag';

// --- THÈMES COULEURS ---
const THEME_COLORS = {
  'dark-grey': {
    bg: '#08090F',
    bgGradient: 'linear-gradient(180deg, rgba(8,9,15,0) 0%, rgba(8,9,15,0.4) 30%, rgba(8,9,15,0.9) 60%, #08090F 100%)',
    primary: '#D4AF37',
    primaryMuted: 'rgba(212,175,55,0.12)',
    textOnAccent: '#08090F',
  },
  // ... autres thèmes à la demande
};

const GENRE_COLORS = {
  "Action": "bg-red-500/20 border-red-500/50 text-red-400",
  "Comédie": "bg-yellow-500/20 border-yellow-500/50 text-yellow-400",
  "Drame": "bg-blue-500/20 border-blue-500/50 text-blue-400",
  "Science-Fiction": "bg-purple-500/20 border-purple-500/50 text-purple-400",
  "default": "bg-white/10 border-white/30 text-white"
};

const COMMON_LANGS = [
  { code: "ENG", flag: "🇬🇧" }, { code: "JPN", flag: "🇯🇵" },
  { code: "KOR", flag: "🇰🇷" }, { code: "ESP", flag: "🇪🇸" },
  { code: "ITA", flag: "🇮🇹" }, { code: "GER", flag: "🇩🇪" },
  { code: "FRA", flag: "🇫🇷" }
];

function Notation({ films, token, spreadsheetId, onSaved, onSkip, isExiting, ratingScale = 5 }) {
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
  const [showLangSelector, setShowLangSelector] = useState(false);
  
  const starsRef = useRef(null);

  useEffect(() => {
    if (film && spreadsheetId && film.annee) {
      getProchainNumeroSeance(token, spreadsheetId, film.annee).then(setNumeroSeance);
    }
  }, [film, spreadsheetId, token]);

  const calculateRating = (e) => {
    if (!starsRef.current) return;
    const rect = starsRef.current.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    let x = clientX - rect.left;
    x = Math.max(0, Math.min(x, rect.width));
    const newRating = Math.round((x / rect.width) * ratingScale * 2) / 2;
    if (newRating !== rating) {
      if (window.navigator.vibrate) window.navigator.vibrate(5);
      setRating(newRating);
    }
  };

  const executeSave = async (langueFinale) => {
    setLoading(true);
    const success = await saveFilmToSheet(token, spreadsheetId, {
      ...film,
      langue: langueFinale,
      note: String(rating).replace('.', ','),
      commentaire: comment,
      coupDeCoeur: isFavorite ? 1 : 0,
      capucine: isCapucine ? 1 : 0,
      depense: price.replace('.', ','),
      numeroSeance
    });

    if (success) {
      setShowLangSelector(false);
      setShowConfirmation(true);
      setTimeout(() => onSaved(), 2200);
    } else {
      alert("Erreur de sauvegarde");
      setLoading(false);
    }
  };

  if (!film) return null;

  return (
    <div 
      className={`fixed inset-0 w-full h-[100dvh] overflow-hidden z-50 transition-transform duration-500 ease-out font-outfit ${isExiting ? 'translate-y-full' : 'translate-y-0'}`}
      style={{ backgroundColor: theme.bg }}
    >
      {/* AFFICHE - VISIBILITÉ MAXIMISÉE */}
      {film.affiche && (
        <div className="absolute inset-0 z-0 h-[75dvh] w-full overflow-hidden">
           <img src={film.affiche} className="w-full h-full object-cover animate-in fade-in duration-700" alt="" />
           <div className="absolute inset-0" style={{ background: theme.bgGradient }} />
        </div>
      )}

      {/* HEADER ACTIONS */}
      <div className="relative z-50 px-6 pt-[env(safe-area-inset-top)] flex justify-end">
        <button onClick={onSkip} className="mt-4 bg-black/10 backdrop-blur-md text-white font-outfit font-bold text-[10px] tracking-[0.2em] uppercase px-5 py-2.5 rounded-full border border-white/10 active:scale-95 transition-all">
          Plus tard
        </button>
      </div>

      <div className="absolute inset-0 z-10 overflow-y-auto scrollbar-hide pt-[42dvh]">
        <div className="min-h-full px-8 pb-[env(safe-area-inset-bottom)]">
          
          {/* TITRE - GALINOY STANDARD ITALIC */}
          <h2 className="font-galinoy text-4xl text-white leading-tight mb-2 italic">
            {film.titre}
          </h2>

          <div className="flex flex-wrap gap-2 mb-8 items-center">
            <span className={`px-3 py-1 rounded-full text-[10px] font-outfit font-black uppercase tracking-widest border ${GENRE_COLORS[film.genre] || GENRE_COLORS.default}`}>
              {film.genre || "Cinéma"}
            </span>
            <ImaxTag salle={film.salle} commentaire={film.commentaire} />
          </div>

          {/* RATING SECTION */}
          <div className="mb-10 flex items-center gap-4 bg-white/5 p-5 rounded-[32px] border border-white/10 backdrop-blur-xl shadow-2xl">
            <div ref={starsRef} className="relative flex-1 h-12 flex items-center touch-none">
              <div className={`absolute -top-14 left-1/2 -translate-x-1/2 font-galinoy text-4xl text-[var(--color-primary)] italic transition-all duration-200 ${isDragging ? 'opacity-100 scale-110' : 'opacity-0 scale-75'}`}>
                {rating}
              </div>
              <div className="flex justify-between w-full pointer-events-none px-1">
                {Array.from({ length: ratingScale }).map((_, i) => (
                  <svg key={i} className={`w-8 h-8 transition-colors duration-300 ${rating > i ? 'text-[var(--color-primary)]' : 'text-white/10'}`} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                ))}
              </div>
              <div onPointerDown={(e) => { setIsDragging(true); calculateRating(e); e.target.setPointerCapture(e.pointerId); }} onPointerMove={(e) => isDragging && calculateRating(e)} onPointerUp={() => setIsDragging(false)} className="absolute inset-0 z-20 cursor-pointer" />
            </div>

            <button onClick={() => setIsFavorite(!isFavorite)} className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${isFavorite ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)] scale-105' : 'bg-white/5 text-white/20 border border-white/10'}`}>
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            </button>
          </div>

          {/* COMMENTAIRE - OUTFIT */}
          <div className="mb-10">
            <textarea
              value={comment}
              placeholder="Ajouter un avis..."
              onChange={(e) => setComment(e.target.value)}
              className="w-full bg-transparent border-l-2 border-[var(--color-primary)] pl-5 py-1 outline-none font-outfit text-lg text-white/90 placeholder:text-white/20 resize-none"
              rows={2}
            />
          </div>

          {/* OPTIONS GRID */}
          <div className="grid grid-cols-2 gap-4 mb-10">
            <div onClick={() => setIsCapucine(!isCapucine)} className={`p-4 rounded-[24px] border flex flex-col items-center gap-2 transition-all active:scale-95 ${isCapucine ? 'bg-[var(--color-primary-muted)] border-[var(--color-primary)]' : 'bg-white/5 border-white/10 opacity-30'}`}>
              <img src={isCapucine ? "https://i.imgur.com/lg1bkrO.png" : "https://i.imgur.com/7SaHwd8.png"} className="w-8 h-8 object-contain" alt="" />
              <span className="font-outfit font-black text-[9px] uppercase tracking-widest text-white">Capucines</span>
            </div>
            
            <div className="p-4 rounded-[24px] border border-white/10 bg-white/5 flex flex-col items-center gap-1">
              <span className="font-outfit font-bold text-[9px] uppercase text-white/40 tracking-widest">Dépense</span>
              <div className="flex items-center">
                <input type="number" inputMode="decimal" value={price === "0" ? "" : price} onChange={(e) => setPrice(e.target.value)} className="w-12 bg-transparent text-center font-galinoy text-2xl text-white outline-none italic" placeholder="0" />
                <span className="font-galinoy text-xl text-white/30 ml-1 italic">€</span>
              </div>
            </div>
          </div>

          {/* ACTION BUTTON - OUTFIT BLACK */}
          <button
            disabled={loading}
            onClick={() => (!film.langue || film.langue.includes("VO")) ? setShowLangSelector(true) : executeSave(film.langue)}
            className="w-full py-5 rounded-[26px] font-outfit font-black text-[13px] uppercase tracking-[0.4em] shadow-xl active:scale-95 transition-all disabled:opacity-50 mb-12"
            style={{ background: theme.primary, color: theme.textOnAccent }}
          >
            {loading ? 'Archivage...' : 'Confirmer la séance'}
          </button>

          {/* TECHNICAL INFO GRID (OUTFIT) */}
          <div className="grid grid-cols-2 gap-y-7 gap-x-8 border-t border-white/10 pt-10 pb-24">
            <div>
              <p className="font-outfit font-black text-[10px] uppercase tracking-[0.15em] text-white/30 mb-1.5">Séance</p>
              <p className="font-outfit text-white text-[15px] font-medium italic">#{numeroSeance}</p>
            </div>
            <div>
              <p className="font-outfit font-black text-[10px] uppercase tracking-[0.15em] text-white/30 mb-1.5">Cinéma</p>
              <p className="font-outfit text-white text-[15px] font-medium truncate">{film.cinema || "Grand Écran"}</p>
            </div>
            <div>
              <p className="font-outfit font-black text-[10px] uppercase tracking-[0.15em] text-white/30 mb-1.5">Date & Heure</p>
              <p className="font-outfit text-white text-[15px] font-medium">{film.date} • {film.heure}</p>
            </div>
            <div>
              <p className="font-outfit font-black text-[10px] uppercase tracking-[0.15em] text-white/30 mb-1.5">Durée</p>
              <p className="font-outfit text-white text-[15px] font-medium">{film.duree || "N/A"}</p>
            </div>
            <div>
              <p className="font-outfit font-black text-[10px] uppercase tracking-[0.15em] text-white/30 mb-1.5">Salle & Siège</p>
              <p className="font-outfit text-white text-[15px] font-medium">{film.salle} • {film.siege || "Libre"}</p>
            </div>
            <div>
              <p className="font-outfit font-black text-[10px] uppercase tracking-[0.15em] text-white/30 mb-1.5">Langue</p>
              <p className="font-outfit text-white text-[15px] font-medium uppercase tracking-tighter">{film.langue || "Standard"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* SELECTEUR LANGUE */}
      {showLangSelector && (
        <div className="fixed inset-0 z-[100] flex items-end animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setShowLangSelector(false)} />
          <div className="relative w-full bg-[#08090F] rounded-t-[40px] border-t border-white/10 p-8 pb-[calc(2.5rem+env(safe-area-inset-bottom))]">
             <h3 className="font-galinoy text-2xl text-white text-center mb-8 italic">Langue de la séance</h3>
             <div className="grid grid-cols-3 gap-3">
                {COMMON_LANGS.map(l => (
                  <button key={l.code} onClick={() => executeSave(l.code)} className="flex flex-col items-center p-5 bg-white/5 rounded-3xl border border-white/5 active:bg-[var(--color-primary)] active:text-black transition-all active:scale-95">
                    <span className="text-3xl mb-1">{l.flag}</span>
                    <span className="font-outfit font-black text-[10px] tracking-widest">{l.code}</span>
                  </button>
                ))}
             </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION */}
      {showConfirmation && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#08090F] animate-in zoom-in duration-500">
          <div className="text-8xl animate-bounce mb-8">🎬</div>
          <h2 className="font-galinoy text-4xl text-[var(--color-primary)] italic uppercase tracking-tighter">Séance Archivée</h2>
        </div>
      )}
    </div>
  );
}

export default Notation;