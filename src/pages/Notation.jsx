import { useState, useEffect, useRef } from 'react';
import { saveFilmToSheet, getProchainNumeroSeance } from '../api';
import { ImaxTag } from '../components/ImaxTag';
import { GENRE_COLORS, THEME_COLORS } from '../constants';
import { Minus, Plus, MessageSquare, CreditCard, Ticket } from 'lucide-react';

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

function Notation({ films, token, spreadsheetId, onSaved, onSkip, isExiting, ratingScale = 5 }) {
  const film = films[0];
  const [rating, setRating] = useState(ratingScale / 2);
  const [comment, setComment] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [isCapucine, setIsCapucine] = useState(false);
  const [price, setPrice] = useState("0");
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [numeroSeance, setNumeroSeance] = useState("...");
  const [showLangSelector, setShowLangSelector] = useState(false);

  useEffect(() => {
    if (film && spreadsheetId && film.annee) {
      getProchainNumeroSeance(token, spreadsheetId, film.annee).then(num => {
        setNumeroSeance(num);
      });
    }
  }, [film, spreadsheetId, token]);

  const adjustRating = (amount) => {
    setRating(prev => Math.max(0, Math.min(ratingScale, prev + amount)));
  };

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

  if (!film) return null;

  return (
    <div 
      className={`fixed inset-0 w-full h-[100dvh] overflow-hidden transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] z-50 ${isExiting ? 'translate-y-full' : 'translate-y-0'}`}
      style={{ background: 'var(--theme-bg)' }}
    >
      {/* 1. BACKGROUND POSTER */}
      {film.affiche && (
        <div className="absolute inset-0 z-0 scale-110 blur-sm opacity-40">
          <img src={film.affiche} className="w-full h-full object-cover" alt="" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--theme-bg)]/80 to-[var(--theme-bg)]" />
        </div>
      )}

      {/* 2. SKIP BUTTON */}
      <div className="absolute top-0 right-0 pt-[env(safe-area-inset-top)] z-50 px-6">
        <button
          onClick={onSkip}
          className="mt-4 bg-[var(--theme-surface)]/40 backdrop-blur-md text-[var(--theme-text)] font-black text-[9px] tracking-[0.3em] uppercase px-5 py-2.5 rounded-full border border-[var(--theme-border)]"
        >
          Plus tard
        </button>
      </div>

      {/* 3. CONTENT CONTAINER */}
      <div className="absolute inset-0 z-10 overflow-y-auto scrollbar-hide flex flex-col">
        <div className="min-h-[35dvh] w-full" onClick={onSkip} />

        <div className="w-full bg-[var(--theme-bg)]/90 backdrop-blur-3xl rounded-t-[3.5rem] border-t border-[var(--theme-border)] px-8 pt-4 flex-grow shadow-[0_-20px_60px_rgba(0,0,0,0.5)]">
          <div className="w-12 h-1 bg-[var(--theme-text)]/10 rounded-full mx-auto mb-10" />

          {/* FILM HEADER */}
          <div className="mb-10">
             <div className="flex items-center gap-3 mb-2">
                <span className="text-[var(--theme-accent)] font-black text-[10px] uppercase tracking-widest">#{numeroSeance}</span>
                <ImaxTag salle={film.salle} commentaire={film.commentaire} />
             </div>
             <h2 className="font-galinoy text-5xl text-[var(--theme-text)] italic leading-[0.9] tracking-tight mb-4">
                {film.titre}
             </h2>
             <div className="flex gap-2">
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${GENRE_COLORS[film.genre] || 'border-[var(--theme-border)]'}`}>
                  {film.genre || "Cinéma"}
                </span>
                <span className="bg-[var(--theme-surface)] border border-[var(--theme-border)] text-[var(--theme-text)]/60 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
                  {film.annee}
                </span>
             </div>
          </div>

          {/* RATING SECTION */}
          <div className="flex flex-col items-center mb-12">
            <div className="flex items-center gap-8 mb-6">
              <button 
                onClick={() => adjustRating(-0.5)}
                className="w-12 h-12 rounded-full border border-[var(--theme-border)] flex items-center justify-center active:scale-90 transition-transform"
              >
                <Minus size={20} className="text-[var(--theme-text)]/60" />
              </button>
              
              <div className="flex items-baseline">
                <span className="font-galinoy text-8xl text-[var(--theme-text)] italic leading-none">{rating}</span>
                <span className="font-galinoy text-2xl text-[var(--theme-accent)] opacity-40 ml-2 italic">/{ratingScale}</span>
              </div>

              <button 
                onClick={() => adjustRating(0.5)}
                className="w-12 h-12 rounded-full border border-[var(--theme-border)] flex items-center justify-center active:scale-90 transition-transform"
              >
                <Plus size={20} className="text-[var(--theme-text)]/60" />
              </button>
            </div>

            <button 
              onClick={() => setIsFavorite(!isFavorite)}
              className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 border ${
                isFavorite 
                ? 'bg-red-500 border-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]' 
                : 'bg-transparent border-[var(--theme-border)] text-[var(--theme-text)]/40'
              }`}
            >
              Coup de cœur
            </button>
          </div>

          {/* COMMENT SECTION */}
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-3 text-[var(--theme-text)]/30">
               <MessageSquare size={12} />
               <span className="text-[9px] font-black uppercase tracking-widest">Critique à chaud</span>
            </div>
            <textarea
              value={comment} 
              rows={1}
              placeholder="Qu'as-tu pensé du film ?"
              onChange={(e) => {
                setComment(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              className="w-full bg-transparent border-0 border-b border-[var(--theme-border)] rounded-none pb-4 outline-none focus:border-[var(--theme-accent)] text-lg text-[var(--theme-text)] italic font-light resize-none transition-colors"
            />
          </div>

          {/* TICKET FIELDS */}
          <div className="grid grid-cols-2 gap-4 mb-12">
            <div 
              onClick={() => setIsCapucine(!isCapucine)}
              className={`p-6 rounded-3xl border transition-all cursor-pointer ${
                isCapucine ? 'bg-red-900/10 border-red-500/50' : 'bg-[var(--theme-surface)] border-[var(--theme-border)]'
              }`}
            >
              <p className="text-[8px] font-black uppercase tracking-widest text-[var(--theme-text)]/30 mb-3">Expérience</p>
              <img 
                src={isCapucine ? "https://i.imgur.com/lg1bkrO.png" : "https://i.imgur.com/7SaHwd8.png"} 
                className={`w-10 h-10 object-contain transition-opacity ${isCapucine ? 'opacity-100' : 'opacity-20'}`}
                alt="Capucine" 
              />
            </div>

            <div className="p-6 rounded-3xl bg-[var(--theme-surface)] border border-[var(--theme-border)]">
              <p className="text-[8px] font-black uppercase tracking-widest text-[var(--theme-text)]/30 mb-2">Investissement</p>
              <div className="flex items-baseline gap-1">
                <input
                  type="text" 
                  inputMode="decimal"
                  value={price === "0" ? "" : price} 
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="bg-transparent outline-none font-galinoy text-3xl text-[var(--theme-text)] w-20"
                />
                <span className="text-sm font-black text-[var(--theme-text)]/40">€</span>
              </div>
            </div>
          </div>

          {/* TICKET STUB RECAP */}
          <div className="mb-12 space-y-4 px-2">
            {[
              { label: 'Date', val: film.date },
              { label: 'Heure', val: film.heure },
              { label: 'Durée', val: film.duree },
              { label: 'Salle', val: film.salle || '?' },
              { label: 'Siège', val: film.siege || '?' },
              { label: 'Langue', val: film.langue || '?' }
            ].map((item, i) => (
              <div key={i} className="flex items-end justify-between gap-4">
                <span className="text-[9px] font-black uppercase tracking-widest text-[var(--theme-text)]/30 whitespace-nowrap">{item.label}</span>
                <div className="h-[1px] flex-1 border-b border-dotted border-[var(--theme-border)] mb-1" />
                <span className="text-[11px] font-bold text-[var(--theme-text)]/80 uppercase">{item.val}</span>
              </div>
            ))}
          </div>

          <button
            disabled={loading}
            onClick={handleSaveClick}
            className="w-full font-black py-6 rounded-3xl shadow-xl active:scale-[0.98] transition-all text-lg italic uppercase tracking-tighter mb-20"
            style={{ background: 'var(--theme-accent)', color: 'var(--theme-bg)' }}
          >
            {loading ? 'Archivage...' : 'Enregistrer la séance'}
          </button>
        </div>
      </div>

      {/* LANGUAGE MODAL */}
      {showLangSelector && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowLangSelector(false)} />
          <div className="relative w-full rounded-t-[3.5rem] p-8 pb-[calc(2rem+env(safe-area-inset-bottom))] border-t border-[var(--theme-border)] bg-[var(--theme-surface)] shadow-2xl">
            <div className="w-12 h-1 bg-[var(--theme-text)]/10 rounded-full mx-auto mb-8" />
            <h3 className="font-galinoy text-3xl italic text-center text-[var(--theme-text)] mb-8">Langue originale ?</h3>
            <div className="grid grid-cols-3 gap-4">
              {COMMON_LANGS.map((l) => (
                <button 
                  key={l.code}
                  onClick={() => executeSave(l.code)}
                  className="flex flex-col items-center justify-center py-5 bg-[var(--theme-bg)]/50 rounded-2xl border border-[var(--theme-border)] active:bg-[var(--theme-accent)] transition-all group"
                >
                  <span className="text-3xl mb-2">{l.flag}</span>
                  <span className="text-[10px] font-black tracking-widest text-[var(--theme-text)] group-active:text-[var(--theme-bg)]">{l.code}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION OVERLAY */}
      {showConfirmation && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[var(--theme-bg)]">
          <div className="relative">
            <div className="absolute inset-0 bg-[var(--theme-accent)] blur-3xl opacity-20 animate-pulse" />
            <span className="relative text-8xl mb-6 block animate-bounce">🍿</span>
          </div>
          <h2 className="text-5xl font-galinoy italic tracking-tighter text-[var(--theme-accent)] uppercase">Archivé !</h2>
        </div>
      )}
    </div>
  );
}

export default Notation;