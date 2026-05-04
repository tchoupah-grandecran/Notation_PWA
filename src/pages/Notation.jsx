import { useState, useEffect, useRef } from 'react';
import { saveFilmToSheet, getProchainNumeroSeance } from '../api';

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

// Ajout de ratingScale dans les props
function Notation({ films, token, spreadsheetId, ratingScale = 10, onSaved, onSkip }) {
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

  const calculateRating = (e) => {
    if (!starsRef.current) return;
    const rect = starsRef.current.getBoundingClientRect();
    let x = e.clientX - rect.left;
    x = Math.max(0, Math.min(x, rect.width));
    
    const percent = x / rect.width;
    // On multiplie par ratingScale (5 ou 10) au lieu d'une valeur fixe
    const rawRating = percent * ratingScale;
    
    // Arrondi au demi-point
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

  const handleSave = async () => {
    setLoading(true);
    // On sauvegarde la note telle quelle (elle sera soit /5 soit /10 selon le scale)
    const success = await saveFilmToSheet(token, spreadsheetId, {
      ...film,
      note: rating,
      commentaire: comment,
      coupDeCoeur: isFavorite ? "OUI" : "NON",
      capucine: isCapucine ? 1 : 0,
      depense: price
    });

    if (success) {
      setShowConfirmation(true);
      setTimeout(() => onSaved(), 2000);
    } else {
      alert("Erreur de sauvegarde");
      setLoading(false);
    }
  };

  // Générer le tableau d'index basé sur l'échelle (ex: [1,2,3,4,5])
  const starIndices = Array.from({ length: ratingScale }, (_, i) => i + 1);

  return (
    <div className="h-full w-full bg-black text-white font-outfit overflow-hidden">
      {/* 1. BACKGROUND AFFICHE */}
      {film.affiche && (
        <img
          src={film.affiche}
          className="fixed top-0 left-0 w-full object-cover z-0"
          style={{ height: 'calc(100dvh + env(safe-area-inset-bottom))' }}
          alt=""
        />
      )}

      {/* 2. SKIP BUTTON */}
      <div className="fixed top-0 left-0 right-0 pt-[env(safe-area-inset-top)] z-50 px-6 flex justify-end">
        <button
          onClick={onSkip}
          className="mt-2 bg-white/90 backdrop-blur-md text-black font-black text-[10px] tracking-[0.2em] uppercase px-5 py-2.5 rounded-full shadow-lg"
        >
          Plus tard
        </button>
      </div>

      {/* 3. SCROLLABLE CONTENT */}
      <div
        className="absolute left-0 right-0 z-10 overflow-y-auto scrollbar-hide"
        style={{ top: 0, bottom: 'calc(-1 * env(safe-area-inset-bottom))' }}
      >
        <div style={{ height: '70dvh' }} onClick={onSkip} />

        <div
          className="w-full bg-black/30 backdrop-blur-xl rounded-t-[32px] border-t border-white/20 px-8 pt-3 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]"
          style={{ paddingBottom: 'calc(4rem + env(safe-area-inset-bottom))' }}
        >
          <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-10"></div>

          <h2 
            className="font-galinoy italic text-white drop-shadow-lg mb-4"
            style={{ fontSize: 'clamp(36px, 9vw, 52px)', lineHeight: '0.88', letterSpacing: '-0.04em' }}
          >
            {film.titre}
          </h2>

          <div className="flex gap-2 mb-12">
            <span className={`px-3 py-1 rounded-full text-[9px] font-black font-outfit uppercase tracking-widest border ${GENRE_COLORS[film.genre] || GENRE_COLORS.default}`}>
              {film.genre || "Cinéma"}
            </span>
            <span className="bg-white/10 border border-white/20 text-white px-3 py-1 rounded-full text-[9px] font-black font-outfit uppercase tracking-widest">
              {film.annee}
            </span>
          </div>

          {/* RATING & FAVORITE */}
          <div className="mb-14 flex items-center justify-between h-16">
            <div ref={starsRef} className="relative flex-1 h-full flex items-center pr-4">
              {/* RATING BUBBLE */}
              <div 
                className={`absolute -top-6 left-1/2 -translate-x-1/2 bg-yellow-500 text-black font-galinoy italic px-4 py-1.5 rounded-2xl text-[22px] transition-all duration-200 pointer-events-none z-50 ${isDragging ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-90'}`}
              >
                {rating}
              </div>

              {/* DYNAMIC STAR VISUALS */}
              <div className="absolute inset-0 flex justify-between items-center pointer-events-none w-full">
                {starIndices.map((index) => {
                  const fillPercent = Math.max(0, Math.min(1, rating - (index - 1))) * 100;
                  return (
                    <div key={index} 
                      className="relative flex-shrink-0"
                      style={{ width: ratingScale === 5 ? '32px' : '20px', height: ratingScale === 5 ? '32px' : '20px' }}
                    >
                      <svg className="absolute inset-0 w-full h-full text-white/10" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                      {fillPercent > 0 && (
                        <svg 
                          className="absolute inset-0 w-full h-full text-yellow-500" 
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
                className="absolute -top-10 -bottom-10 left-0 right-0 z-10 touch-none cursor-pointer"
              />
            </div>

            <div className="w-px h-8 bg-white/10 mx-4"></div>

            <button 
              onClick={() => setIsFavorite(!isFavorite)} 
              className={`relative h-full flex items-center justify-center transition-all duration-300 active:scale-75 flex-shrink-0 px-2 ${isFavorite ? 'text-red-500 scale-110' : 'text-white/20'}`}
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path>
              </svg>
            </button>
          </div>

          {/* AVIS EXPRESS */}
          <div className="mb-12">
            <label className="text-[9px] font-black font-outfit uppercase tracking-[0.3em] text-white opacity-60 mb-4 block">Avis express</label>
            <textarea
              value={comment} onChange={(e) => setComment(e.target.value)}
              placeholder="Qu'as-tu pensé du film ?"
              className="w-full bg-black/40 border border-white/5 rounded-3xl p-6 outline-none focus:border-white/20 font-outfit text-sm h-32 resize-none placeholder:text-white/20"
            />
          </div>

          {/* OPTIONS */}
          <div className="mb-12 space-y-4">
            <div onClick={() => setIsCapucine(!isCapucine)} className={`flex items-center justify-between p-6 rounded-3xl border transition-all ${isCapucine ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-500' : 'bg-black/30 border-white/5 text-white/40'}`}>
              <span className="font-outfit font-black text-[9px] uppercase tracking-[0.3em]">Sélection Capucines</span>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isCapucine ? 'border-yellow-500 bg-yellow-500' : 'border-white/20'}`}>
                {isCapucine && <span className="text-black text-[10px] font-black">✓</span>}
              </div>
            </div>
            <div className="flex items-center justify-between p-6 bg-black/30 rounded-3xl border border-white/5">
              <span className="font-outfit font-black text-[9px] uppercase tracking-[0.3em] text-white opacity-60">Dépense séance (€)</span>
              <input
                type="number" value={price} onChange={(e) => setPrice(e.target.value)}
                className="bg-transparent text-right outline-none font-outfit font-black text-2xl w-24 text-white"
              />
            </div>
          </div>

          {/* TECHNICAL RECAP */}
          <div className="bg-black/40 rounded-3xl p-8 mb-12 border border-white/5 grid grid-cols-2 gap-y-8">
            <div className="col-span-2 border-b border-white/5 pb-5 mb-2 flex justify-between items-end">
              <p className="font-outfit text-[9px] font-black uppercase tracking-[0.3em] text-yellow-500">Séance de l'année</p>
              <p className="font-outfit text-[26px] font-black tracking-tighter leading-none">#{numeroSeance}</p>
            </div>
            <DetailItem label="Date" value={film.date} />
            <DetailItem label="Heure" value={film.heure} />
            <DetailItem label="Salle" value={film.salle || "?"} />
            <DetailItem label="Siège" value={film.siege || "?"} />
            <DetailItem label="Langue" value={film.langue || "?"} />
            <DetailItem label="Durée" value={film.duree} />
          </div>

          <button
            disabled={loading}
            onClick={handleSave}
            className="w-full bg-white text-black font-outfit font-black py-6 rounded-3xl shadow-2xl active:scale-[0.98] transition-all text-[16px] uppercase tracking-tighter"
          >
            {loading ? 'CHARGEMENT...' : 'ENREGISTRER'}
          </button>
        </div>
      </div>

      {/* CONFIRMATION */}
      {showConfirmation && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-2xl animate-in fade-in duration-300">
          <span className="text-8xl mb-8">🍿</span>
          <h2 className="font-galinoy italic text-4xl tracking-tighter text-yellow-500">Archivé !</h2>
        </div>
      )}
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="font-outfit text-[8px] font-black uppercase tracking-[0.2em] text-white opacity-40">{label}</p>
      <p className="font-outfit text-[13px] font-bold uppercase tracking-wide text-white">{value}</p>
    </div>
  );
}

export default Notation;