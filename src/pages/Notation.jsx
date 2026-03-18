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
          <h2 className="font-syne text-2xl font-black uppercase tracking-tighter leading-none mb-4 drop-shadow-xl">
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

          {/* AVIS (Design minimaliste & Auto-expand) */}
          <div className="mb-12 relative">
            
            {/* Le Textarea : 1 ligne par défaut, auto-extensible */}
            <textarea
              value={comment} 
              rows={1}
              onChange={(e) => {
                setComment(e.target.value);
                // Astuce JS pour l'auto-expand : on réinitialise la hauteur à 'auto' 
                // puis on lui donne exactement la hauteur du texte (scrollHeight)
                e.target.style.height = 'auto';
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              className="w-full bg-transparent border-0 border-b border-white/20 rounded-none pb-2 px-1 outline-none focus:ring-0 focus:border-yellow-500 text-base min-h-[36px] overflow-hidden resize-none transition-colors relative z-10 text-white leading-relaxed"
            />
            
            {/* Le faux "Placeholder" aligné sur la ligne unique */}
            {!comment && (
              <div className="absolute top-0 left-1 flex items-center gap-2 text-white/30 pointer-events-none transition-opacity duration-200 h-[36px] pb-2">
                {/* Icône Crayon */}
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9"></path>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                </svg>
                {/* truncate évite que le texte ne passe sur 2 lignes sur les tout petits écrans */}
                <span className="text-base italic truncate">Ton avis à chaud, en quelques mots...</span>
              </div>
            )}

          </div>

          {/* OPTIONS : Capucines & Extra (Sur 2 colonnes) */}
          <div className="mb-12 grid grid-cols-2 gap-4">
            
            {/* 1. BOUTON CAPUCINES */}
            <div 
              onClick={() => setIsCapucine(!isCapucine)} 
              className={`flex flex-col items-center justify-center p-4 rounded-xl border cursor-pointer transition-all duration-300 active:scale-95 ${isCapucine ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-500' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'}`}
            >
              {/* L'image change dynamiquement selon l'état */}
              <img 
                src={isCapucine ? "https://i.imgur.com/lg1bkrO.png" : "https://i.imgur.com/7SaHwd8.png"} 
                alt="Capucines" 
                className="w-10 h-10 mb-3 object-contain drop-shadow-md transition-transform duration-300"
              />
              {/* Le texte sur 2 lignes pour que "Sélectionné" tienne bien dans la colonne */}
              <span className="font-bold text-[9px] uppercase tracking-widest text-center leading-tight whitespace-pre-line">
                {isCapucine ? "Sélectionné\nCapucines" : "Capucines"}
              </span>
            </div>

            {/* 2. DÉPENSE / EXTRA */}
            <div className="flex flex-col items-center justify-center p-4 bg-white/5 rounded-xl border border-white/10 text-white relative">
              
              {/* Icône de Panier : On utilise "text-white opacity-30" au lieu de "text-white/30" */}
              <svg className="w-9 h-9 mb-2 text-white opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
                  className="bg-transparent text-right outline-none font-regular text-l w-16 placeholder:text-white/20 text-white"
                />
                <span className="font-black text-l text-white/50 ml-1 mt-0">€</span>
              </div>
            </div>
          </div>

          <button
            disabled={loading}
            onClick={handleSave}
            className="w-full bg-white text-black font-black py-3 rounded-3xl shadow-xl active:scale-95 transition-all text-xl italic uppercase tracking-tighter"
          >
            {loading ? 'CHARGEMENT...' : 'ENREGISTRER'}
          </button>

          {/* RÉCAP TECHNIQUE (Footer discret) */}
          {/* Ajout de mt-6 pour aérer vis-à-vis du bouton Enregistrer */}
          <div className="mt-6 mb-10 px-3">
            
            {/* En-tête : Séance de l'année */}
            {/* J'ai réduit le gap à gap-2 pour lier visuellement le label et le numéro */}
            <div className="flex items-center justify-center gap-2 mb-3 border-b border-white/10 pb-2 mx-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-500">#{numeroSeance}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Séance de l'année</span>
              {/* Typographie identique au label, couleur jaune conservée */}
              </div>

            {/* Grille : 2 lignes x 3 colonnes */}
            <div className="grid grid-cols-3 gap-y-3 gap-x-2">
              
              {/* Date (Calendrier) */}
              <div className="flex items-center justify-left gap-2">
                {/* Correction : text-white opacity-30 */}
                <svg className="w-4 h-4 text-white opacity-30 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <span className="text-xs font-bold text-white/80">{film.date}</span>
              </div>

              {/* Heure (Horloge) */}
              <div className="flex items-center justify-left gap-2">
                <svg className="w-4 h-4 text-white opacity-30 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span className="text-xs font-bold text-white/80">{film.heure}</span>
              </div>

              {/* Durée (Sablier) */}
              <div className="flex items-center justify-left gap-2">
                <svg className="w-4 h-4 text-white opacity-30 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 22h14"></path>
                  <path d="M5 2h14"></path>
                  <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"></path>
                  <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"></path>
                </svg>
                <span className="text-xs font-bold text-white/80">{film.duree}</span>
              </div>

              {/* Salle (Écran) */}
              <div className="flex items-center justify-left gap-2">
                <svg className="w-4 h-4 text-white opacity-30 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                  <line x1="8" y1="21" x2="16" y2="21"></line>
                  <line x1="12" y1="17" x2="12" y2="21"></line>
                </svg>
                <span className="text-xs font-bold text-white/80">{film.salle || "?"}</span>
              </div>

              {/* Siège (Fauteuil) */}
              <div className="flex items-center justify-left gap-2">
                <svg className="w-4 h-4 text-white opacity-30 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3"></path>
                  <path d="M3 11v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H7v-2a2 2 0 0 0-4 0Z"></path>
                  <path d="M5 18v2"></path>
                  <path d="M19 18v2"></path>
                </svg>
                <span className="text-xs font-bold text-white/80">{film.siege || "?"}</span>
              </div>

              {/* Langue (Globe) */}
              <div className="flex items-center justify-left gap-2">
                <svg className="w-4 h-4 text-white opacity-30 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="2" y1="12" x2="22" y2="12"></line>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                </svg>
                <span className="text-xs font-bold text-white/80 uppercase">{film.langue || "?"}</span>
              </div>

            </div>
          </div>
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

export default Notation;