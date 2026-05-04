import { useState, useEffect, useRef } from 'react';
import { saveFilmToSheet, getProchainNumeroSeance } from '../api';

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
  // Valeur de secours si le genre n'est pas dans la liste ou est vide
  "default": "bg-white/10 border-white/30 text-white"
};

function Notation({ films, token, spreadsheetId, onSaved, onSkip }) {
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
    
    // Position X du doigt relative à la zone des étoiles
    let x = e.clientX - rect.left;
    // On contraint x pour qu'il ne dépasse pas les bords
    x = Math.max(0, Math.min(x, rect.width));
    
    // Calcul du pourcentage et de la note sur 10
    const percent = x / rect.width;
    const rawRating = percent * 10;
    
    // Arrondi au demi-point le plus proche
    setRating(Math.round(rawRating * 2) / 2);
  };

  const handlePointerDown = (e) => {
    setIsDragging(true);
    calculateRating(e);
    // Capture le pointeur pour continuer à glisser même si le doigt sort un peu de la zone
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

  return (
    <div className="h-full w-full bg-black text-white font-sans overflow-hidden">

      {/* 1. AFFICHE */}
      {film.affiche && (
        <img
          src={film.affiche}
          className="absolute top-0 left-0 w-full object-cover opacity-100 z-0"
          style={{ height: 'calc(100dvh + env(safe-area-inset-bottom))' }}
          alt=""
        />
      )}

      {/* 2. BOUTON "Plus tard" */}
      <div className="fixed top-0 left-0 right-0 pt-[env(safe-area-inset-top)] z-50 px-6 flex justify-end">
        <button
          onClick={onSkip}
          className="mt-2 bg-white/90 backdrop-blur-md text-black font-bold text-[10px] tracking-widest uppercase px-4 py-2 rounded-full shadow-lg"
        >
          Plus tard
        </button>
      </div>

      {/* 3. ZONE SCROLLABLE
          — top: 0, bottom négatif pour déborder sous la home bar
          — le spacer en haut pousse l'overlay à 70dvh initialement
          — on peut scroller vers le haut pour révéler le poster en dessous */}
      <div
        className="absolute left-0 right-0 z-10 overflow-y-auto scrollbar-hide"
        style={{
          top: 0,
          bottom: 'calc(-3 * env(safe-area-inset-bottom))',
        }}
      >
        {/* Spacer transparent — cliquable pour skip, pousse l'overlay vers le bas */}
        <div style={{ height: '82dvh' }} onClick={onSkip} />

        {/* Overlay glassmorphism */}
        <div
          className="w-full bg-black/30 backdrop-blur-xl rounded-t-[25px] border-t border-white/20 px-8 pt-2 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]"
          style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}
        >
          <div className="w-20 h-1 bg-white/30 rounded-full mx-auto mb-8"></div>

          {/* TITRE DU FILM EN SYNE BOLD */}
          <h2 className="font-syne text-4xl font-bold uppercase tracking-tighter leading-none mb-4 drop-shadow-xl">
            {film.titre}
          </h2>

          <div className="flex gap-2 mb-10">
            {/* Gélule GENRE - Dynamique */}
            <span 
              className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-sm border transition-colors ${GENRE_COLORS[film.genre] || GENRE_COLORS.default}`}
            >
              {film.genre || "Cinéma"}
            </span>
            
            {/* Gélule ANNÉE - Reste neutre */}
            <span className="bg-black/30 border border-white/30 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-sm">
              {film.annee}
            </span>
          </div>

          {/* NOTE & COUP DE COEUR */}
          <div className="mb-14 flex items-center justify-between h-16">
            
            {/* ETOILES & ZONE TACTILE ÉLARGIE */}
            {/* On ajoute ref={starsRef} ici pour mesurer cette div */}
            <div ref={starsRef} className="relative flex-1 h-full flex items-center pr-2">
              
              {/* Bulle flottante (remontée à -top-16 pour éviter d'être sous le gros doigt) */}
              <div 
                className={`absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-black font-black px-3 py-1 rounded-xl text-xs transition-all duration-200 pointer-events-none z-50 ${isDragging ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-90'}`}
              >
                {rating}
              </div>

              {/* Visuel des 10 Etoiles SVG */}
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

              {/* NOUVELLE ZONE DE TOUCH (Remplaçant l'input range) */}
              {/* -top-8 et -bottom-8 étendent massivement la zone cliquable en haut et en bas. touch-none empêche le scroll de la page pendant le swipe */}
              <div
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className="absolute -top-8 -bottom-8 left-0 right-0 z-10 touch-none cursor-pointer"
              />
            </div>

            {/* LIGNE DE SÉPARATION DISCRÈTE */}
            <div className="w-px h-8 bg-white/10 mx-3"></div>

            {/* BOUTON COEUR (Design plat, 100% fiable sur iOS) */}
            <button 
              onClick={() => setIsFavorite(!isFavorite)} 
              className={`relative h-full flex items-center justify-center transition-all duration-300 active:scale-75 focus:outline-none flex-shrink-0 z-20 px-1 ${isFavorite ? 'text-red-500 scale-110' : 'text-white/20 hover:text-white/60'}`}
              aria-label="Coup de coeur"
            >
              <div className="relative w-[22px] h-[22px]">
                
                {/* Cœur vide */}
                <svg 
                  className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${isFavorite ? 'opacity-0' : 'opacity-100'}`} 
                  viewBox="0 0 24 24" 
                  fill="currentColor" 
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path>
                </svg>

                {/* Cœur plein : Finis les effets d'ombre, place à la simplicité */}
                <svg 
                  className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${isFavorite ? 'opacity-100' : 'opacity-0'}`} 
                  viewBox="0 0 24 24" 
                  fill="currentColor" 
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path>
                </svg>
                
              </div>
            </button>
          </div>

          {/* AVIS */}
          <div className="mb-12">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/70 mb-4 block">Avis express</label>
            <textarea
              value={comment} onChange={(e) => setComment(e.target.value)}
              placeholder="Qu'as-tu pensé du film ?"
              className="w-full bg-black/30 border border-white/10 rounded-3xl p-5 outline-none focus:border-yellow-500 text-sm h-28 resize-none placeholder:text-white/30"
            />
          </div>

          {/* OPTIONS */}
          <div className="mb-12 space-y-4">
            <div onClick={() => setIsCapucine(!isCapucine)} className={`flex items-center justify-between p-5 rounded-3xl border cursor-pointer transition-all ${isCapucine ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500' : 'bg-black/30 border-white/10 text-white/50'}`}>
              <span className="font-bold text-xs uppercase tracking-widest">Sélection Capucines</span>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isCapucine ? 'border-yellow-500 bg-yellow-500' : 'border-white/20'}`}>
                {isCapucine && <span className="text-black text-xs font-bold">✓</span>}
              </div>
            </div>
            <div className="flex items-center justify-between p-5 bg-black/30 rounded-3xl border border-white/10 text-white">
              <span className="font-bold text-xs uppercase tracking-widest text-white/50">Dépense séance (€)</span>
              <input
                type="number" value={price} onChange={(e) => setPrice(e.target.value)}
                className="bg-transparent text-right outline-none font-black text-2xl w-24"
              />
            </div>
          </div>

          {/* RÉCAP TECHNIQUE */}
          <div className="bg-black/50 rounded-3xl p-6 mb-12 border border-white/10 grid grid-cols-2 gap-y-6">
            <div className="col-span-2 border-b border-white/10 pb-4 mb-2 flex justify-between items-center">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-500">Séance de l'année</p>
              <p className="text-2xl font-black italic tracking-tighter">#{numeroSeance}</p>
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
            className="w-full bg-white text-black font-black py-6 rounded-3xl shadow-xl active:scale-95 transition-all text-xl italic uppercase tracking-tighter"
          >
            {loading ? 'CHARGEMENT...' : 'ENREGISTRER'}
          </button>

        </div>
      </div>

      {/* CONFIRMATION */}
      {showConfirmation && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
          <span className="text-8xl mb-6">🍿</span>
          <h2 className="text-4xl font-black uppercase italic tracking-tighter text-yellow-500">Archivé !</h2>
        </div>
      )}
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div>
      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50 mb-1">{label}</p>
      <p className="text-sm font-bold uppercase tracking-tight">{value}</p>
    </div>
  );
}

export default Notation;