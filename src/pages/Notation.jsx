import { useState, useEffect } from 'react';
import { saveFilmToSheet, getProchainNumeroSeance } from '../api';

function Notation({ films, token, spreadsheetId, onSaved, onSkip }) {
  const film = films[0];
  const [rating, setRating] = useState(7);
  const [comment, setComment] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [isCapucine, setIsCapucine] = useState(false);
  const [price, setPrice] = useState("0");
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [numeroSeance, setNumeroSeance] = useState("...");

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

      {/* 1. AFFICHE — couvre tout l'écran safe area comprise */}
      {film.affiche && (
        <img
          src={film.affiche}
          className="absolute top-0 left-0 w-full object-cover opacity-100 z-0"
          style={{
            height: 'calc(100dvh + env(safe-area-inset-bottom))',
          }}
          alt=""
        />
      )}

      {/* 2. BOUTON "Plus tard" — ancré sous la status bar */}
      <div className="fixed top-0 left-0 right-0 pt-[env(safe-area-inset-top)] z-50 px-6 flex justify-end">
        <button
          onClick={onSkip}
          className="mt-2 bg-white/90 backdrop-blur-md text-black font-bold text-[10px] tracking-widest uppercase px-4 py-2 rounded-full shadow-lg"
        >
          Plus tard
        </button>
      </div>

      {/* 3. ZONE SCROLLABLE — descend jusqu'au vrai bord de l'écran */}
      <div className="absolute inset-0 z-10 overflow-y-auto pt-[70dvh] scrollbar-hide">
        <div className="w-full bg-black/40 backdrop-blur-xl rounded-t-[40px] border-t border-white/20 px-8 pt-6 pb-8 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">

          <div className="w-12 h-1.5 bg-white/30 rounded-full mx-auto mb-8"></div>

          <h2 className="text-4xl font-black italic uppercase tracking-tighter leading-none mb-4 drop-shadow-xl">
            {film.titre}
          </h2>

          <div className="flex gap-2 mb-10">
            <span className="bg-black/30 border border-white/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-sm">
              {film.genre || "Cinéma"}
            </span>
            <span className="bg-black/30 border border-white/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-sm">
              {film.annee}
            </span>
          </div>

          {/* NOTE */}
          <div className="mb-12">
            <div className="flex justify-between items-center mb-6">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/70">Ma Note</label>
              <div className="bg-yellow-500 text-black font-black px-4 py-1 rounded-xl text-2xl">
                {rating}
              </div>
            </div>
            <input
              type="range" min="0" max="10" step="0.5" value={rating}
              onChange={(e) => setRating(e.target.value)}
              className="w-full h-2 bg-white/20 rounded-full appearance-none accent-yellow-500 cursor-pointer"
            />
            <div className="mt-8">
              <button onClick={() => setIsFavorite(!isFavorite)} className={`flex items-center gap-3 font-black text-xs tracking-widest uppercase transition-colors ${isFavorite ? 'text-red-500' : 'text-white/50'}`}>
                <span className="text-2xl">{isFavorite ? '❤️' : '🤍'}</span>
                Coup de coeur
              </button>
            </div>
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

          {/* Spacer — pousse le bouton au-dessus de la barre home */}
          <div style={{ height: 'env(safe-area-inset-bottom)' }} />

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