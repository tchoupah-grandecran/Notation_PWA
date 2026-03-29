import { useState, useRef, useEffect } from 'react';
import { RW_ARCHETYPES } from '../constants';
import html2canvas from 'html2canvas';

// ── 1. Écran de verrouillage ────────────────────────────────────────────────────
function LockScreen({ onUnlock }) {
  const [password, setPassword] = useState('');
  const STUDIO_PASSWORD = 'POPCORN';

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
      <div className="w-20 h-20 bg-white/5 rounded-full border border-white/10 flex items-center justify-center mb-6 shadow-2xl">
        <svg className="w-8 h-8 text-[var(--color-primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>
      <h2 className="font-syne font-black text-3xl mb-2 text-white">Zone Sécurisée</h2>
      <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-8 text-center">Réservé aux créateurs de contenu</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (password.toUpperCase() === STUDIO_PASSWORD) {
            onUnlock();
          } else {
            alert('Mot de passe incorrect');
            setPassword('');
          }
        }}
        className="flex flex-col gap-4 w-full max-w-xs"
      >
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="bg-black/40 border border-white/10 rounded-2xl p-4 text-center font-bold tracking-widest outline-none focus:border-[var(--color-primary)] transition-colors text-white"
        />
        <button type="submit" className="bg-[var(--color-primary)] text-black font-black uppercase tracking-widest py-4 rounded-2xl active:scale-95 transition-transform">
          Déverrouiller
        </button>
      </form>
    </div>
  );
}

// ── 2. Hub Studio ───────────────────────────────────────────────────────────────
function StudioHub({ isScrolled, onSelectTool, onLock }) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      <header className={`z-40 sticky top-0 w-full transition-all duration-500 bg-[var(--color-bg)]/80 backdrop-blur-2xl border-b ${isScrolled ? 'pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-3 border-white/10 shadow-lg' : 'pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-5 border-transparent'}`}>
        <div className="px-6 flex justify-between items-center">
          <div className="flex flex-col">
            <p className={`font-bold uppercase tracking-widest text-[var(--color-primary)] transition-all duration-500 ${isScrolled ? 'opacity-0 h-0 overflow-hidden mb-0 text-[0px]' : 'opacity-100 h-3 text-[10px] mb-1'}`}>Générateur</p>
            <h1 className={`font-syne font-black text-white leading-none transition-all duration-500 ${isScrolled ? 'text-2xl' : 'text-4xl'}`}>Studio</h1>
          </div>
          <button 
            className="group flex items-center justify-center gap-2 h-10 px-4 rounded-full border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 text-[var(--color-primary)] active:scale-95 transition-all flex-shrink-0 shadow-lg"
          >
            <svg className="w-4 h-4 flex-shrink-0 transition-transform duration-500 group-active:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 2v6h-6" />
              <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
              <path d="M3 22v-6h6" />
              <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
            </svg>
            <span className="font-black uppercase tracking-widest text-[10px]">Sync</span>
          </button>
          <button onClick={onLock} className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20 active:scale-90 transition-all">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </button>
        </div>
      </header>
      <main className="px-6 pt-6 space-y-4">
        <div onClick={() => onSelectTool('recap')} className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-3xl p-6 relative overflow-hidden cursor-pointer active:scale-[0.98] transition-all group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <svg className="w-24 h-24 text-[var(--color-primary)]" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 9h-2V7h-2v5H6v2h2v5h2v-5h2v-2z" /></svg>
          </div>
          <span className="bg-[var(--color-primary-muted)] text-[var(--color-primary)] text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-[var(--color-primary)]/20 mb-4 inline-block">Post 4:5</span>
          <h3 className="font-syne font-black text-2xl text-white mb-2">Récap' Mensuel</h3>
          <p className="text-xs text-white/50 font-medium">Génère un carrousel de 6 slides avec tes statistiques et coups de cœur du mois.</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div onClick={() => onSelectTool('seance')} className="bg-gradient-to-tr from-white/10 to-transparent border border-white/10 rounded-3xl p-5 relative overflow-hidden cursor-pointer active:scale-[0.98] transition-all group">
            <span className="bg-white/10 text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full mb-3 inline-block">Story 9:16</span>
            <h3 className="font-syne font-black text-lg text-white mb-1">Séance</h3>
            <p className="text-[10px] text-white/50 font-medium">Annonce ton film</p>
          </div>

          <div className="bg-white/5 border border-white/5 rounded-3xl p-5 relative overflow-hidden grayscale opacity-50 cursor-not-allowed">
            <span className="bg-white/10 text-white/50 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full mb-3 inline-block">Post 4:5</span>
            <h3 className="font-syne font-black text-lg text-white mb-1">Critique</h3>
            <p className="text-[10px] text-white/40">Bientôt</p>
          </div>
        </div>
      </main>
    </div>
  );
}

// ── Outil Story Séance ──────────────────────────────────────────────────────
function SeanceStoryTool({ historyData = [], userAvatar, onBack, pendingFilm }) {
  // On pré-remplit avec pendingFilm (qui correspond à films[0] dans App.jsx)
  const [title, setTitle] = useState(pendingFilm?.titre || '');
  const [date, setDate] = useState(pendingFilm?.date || new Date().toLocaleDateString('fr-FR'));
  
  // Si on a l'heure dans les données du film, on formate. Sinon 20:00.
  const defaultTime = pendingFilm?.heure ? pendingFilm.heure.replace('h', ':') : '20:00';
  const [time, setTime] = useState(defaultTime);
  
  const [lang, setLang] = useState(pendingFilm?.langue || 'VOSTFR');
  const [poster, setPoster] = useState(pendingFilm?.affiche || null);
  
  const [expectation, setExpectation] = useState(2);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const wrapperRef = useRef(null);
  const [scale, setScale] = useState(0.3);

  const screeningNumber = (historyData?.length || 0) + 1;

  // NOUVEAU : Vocabulaire plus classe et couleurs premium (façon néon)
  const expectations = [
    { label: "Sceptique",      color: "bg-white/40",       glow: "shadow-[0_0_15px_rgba(255,255,255,0.3)]" },
    { label: "Curieux(se)",    color: "bg-blue-400",       glow: "shadow-[0_0_15px_rgba(96,165,250,0.6)]" },
    { label: "Intrigué(e)",    color: "bg-purple-400",     glow: "shadow-[0_0_15px_rgba(192,132,252,0.6)]" },
    { label: "Très impatient", color: "bg-orange-400",     glow: "shadow-[0_0_15px_rgba(251,146,60,0.6)]" },
    { label: "Hype absolue",   color: "bg-[#E8B200]",      glow: "shadow-[0_0_20px_#E8B200]" }
  ];

  useEffect(() => {
    const updateScale = () => {
      if (wrapperRef.current) {
        setScale(wrapperRef.current.offsetWidth / 1080);
      }
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setPoster(event.target.result);
      reader.readAsDataURL(file);
    }
  };

  const downloadStory = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      const slideEl = document.getElementById('story-export-node');
      const canvas = await html2canvas(slideEl, { 
        scale: 2, 
        useCORS: true, 
        allowTaint: false,
        backgroundColor: '#000000',
      });
      
      const link = document.createElement('a');
      link.download = `seance_${screeningNumber}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error("Erreur html2canvas:", err);
      alert("Erreur lors de la génération. Assure-toi d'être en réseau.");
    }
    setIsDownloading(false);
  };

  return (
    <div className="animate-in fade-in duration-500 pb-24 flex flex-col min-h-screen bg-[#0C0C0E]">
      <header className="z-40 sticky top-0 w-full bg-[#0C0C0E]/90 backdrop-blur-xl border-b border-white/10 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 px-6 flex justify-between items-center">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white active:scale-90 transition-all">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-bold text-[var(--color-primary)] uppercase tracking-widest">Story 9:16</span>
          <h2 className="font-syne font-black text-white text-lg">Prochaine Séance</h2>
        </div>
        <div className="w-10" />
      </header>

      <div className="px-6 py-6 flex flex-col gap-8">
        {/* PRÉVISUALISATION */}
        <div className="w-full relative bg-white/5 rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl" ref={wrapperRef} style={{ aspectRatio: '9/16' }}>
          <div 
            id="story-export-node" 
            className="absolute top-0 left-0 origin-top-left overflow-hidden bg-black font-sans"
            style={{ width: '1080px', height: '1920px', transform: `scale(${scale})` }}
          >
            {poster ? (
              <img src={poster} crossOrigin="anonymous" className="absolute inset-0 w-full h-full object-cover scale-110 blur-3xl opacity-50" alt="" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#7E0000] to-[#2A0000]" />
            )}

            {poster && (
              <img src={poster} crossOrigin="anonymous" className="absolute inset-0 w-full h-full object-cover opacity-90" alt="" />
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />

            <div className="absolute inset-0 p-16 flex flex-col justify-between z-10">
              <div className="flex justify-between items-start mt-12">
                <div className="bg-black/70 backdrop-blur-xl border border-white/30 text-white px-8 py-4 rounded-full font-bold text-3xl tracking-widest uppercase shadow-lg">
                  Séance #{screeningNumber}
                </div>
              </div>

              <div className="flex flex-col gap-10 mb-12">
                <h1 className="font-syne font-black text-white text-[100px] leading-[0.95] drop-shadow-2xl">
                  {title || "Titre du film"}
                </h1>

                {/* Badges infos */}
                <div className="flex flex-wrap gap-4">
                  <div className="bg-black/40 backdrop-blur-md border border-white/20 text-white px-8 py-5 rounded-3xl font-bold text-4xl flex items-center gap-4">
                    <svg className="w-8 h-8 opacity-80 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    {date}
                  </div>
                  <div className="bg-black/40 backdrop-blur-md border border-white/20 text-white px-8 py-5 rounded-3xl font-bold text-4xl flex items-center gap-4">
                    <svg className="w-8 h-8 opacity-80 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    {time.replace(':', 'h')}
                  </div>
                  <div className="bg-black/40 backdrop-blur-md border border-white/20 text-white px-8 py-5 rounded-3xl font-black text-4xl flex items-center gap-4">
                    <svg className="w-8 h-8 opacity-80 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="2" y1="12" x2="22" y2="12"></line>
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                    </svg>
                    {lang.toUpperCase()}
                  </div>
                </div>

                {/* Jauge d'attente (HYPE METER minimaliste) */}
                <div className="bg-black/30 backdrop-blur-3xl border border-white/20 rounded-[2rem] p-8 mt-6 relative overflow-hidden">
                  <div className="flex justify-between items-end mb-8">
                    <div>
                      <p className="text-white/60 text-xl font-bold uppercase tracking-[0.2em] mb-2">Hype Meter</p>
                      <p className="text-white text-5xl font-black italic">
                        {expectations[expectation].label}
                      </p>
                    </div>
                    <div className="text-white/20 font-black text-6xl italic leading-none">
                      {expectation + 1}<span className="text-3xl">/5</span>
                    </div>
                  </div>
                  
                  {/* Barres lumineuses segmentées */}
                  <div className="flex gap-3 w-full h-4">
                    {expectations.map((exp, i) => (
                      <div 
                        key={i} 
                        className={`flex-1 rounded-full transition-all duration-500 ${i <= expectation ? `${exp.color} ${exp.glow}` : 'bg-white/10'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

          <div>
            <div className="flex justify-between items-end mb-3">
              <label className="text-xs font-bold text-white/50 uppercase tracking-widest">Niveau d'attente</label>
              <span className="text-xs font-bold text-[var(--color-primary)] uppercase tracking-widest">
                {expectations[expectation].label}
              </span>
            </div>
            
            <div className="flex gap-2 bg-black/40 border border-white/10 rounded-2xl p-4">
              {expectations.map((exp, i) => (
                <button
                  key={i}
                  onClick={() => setExpectation(i)}
                  className="flex-1 h-8 flex items-center justify-center relative group"
                >
                  {/* Segment cliquable */}
                  <div className={`w-full h-2 rounded-full transition-all duration-300 group-hover:scale-y-150 ${i <= expectation ? exp.color : 'bg-white/10'}`} />
                </button>
              ))}
            </div>
          </div>

          <div>
             <label className="text-xs font-bold text-white/50 uppercase tracking-widest mb-2 block mt-2">Affiche / Photo perso</label>
             <label className="w-full bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 text-[var(--color-primary)] rounded-2xl p-4 font-bold flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all">
               <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
               {poster && poster !== pendingFilm?.affiche ? "Changer la photo" : "Remplacer l'affiche"}
               <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
             </label>
          </div>


        {/* BOUTON D'EXPORT */}
        <button onClick={downloadStory} disabled={isDownloading || !title} className="w-full h-16 rounded-2xl bg-[var(--color-primary)] text-[#0A0A0A] font-syne font-black text-lg tracking-wide flex items-center justify-center gap-3 shadow-[0_4px_20px_var(--color-primary-muted)] hover:shadow-[0_8px_30px_var(--color-primary-muted)] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
          {isDownloading ? (
            <svg className="w-6 h-6 animate-spin text-[#0A0A0A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.25" /><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" /></svg>
          ) : (
            <svg className="w-6 h-6 stroke-[#0A0A0A]" viewBox="0 0 24 24" fill="none" strokeWidth="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
          )}
          {isDownloading ? 'Génération...' : 'Sauvegarder la Story'}
        </button>
      </div>
    </div>
  );
}

// ── 3. Outil Récap Mensuel ──────────────────────────────────────────────────────
function RecapTool({ historyData = [], ratingScale = 5, userAvatar, onBack }) {
  const [selectedMonth, setSelectedMonth] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const carouselRef = useRef(null);
  const safeHistory = historyData || [];

  const availableMonthsRaw = [...new Set(safeHistory.map((f) => {
    const parts = f.date?.split('/');
    return parts?.length === 3 ? `${parts[2]}-${parts[1]}` : null;
  }).filter(Boolean))].sort((a, b) => b.localeCompare(a));

  const activeMonth = selectedMonth || availableMonthsRaw[0] || '';

  const monthData = activeMonth
    ? safeHistory.filter((f) => {
        if (!f.date) return false;
        const [y, m] = activeMonth.split('-');
        return f.date.endsWith(`${m}/${y}`);
      })
    : [];

  const totalFilms = monthData.length;
  const notes = monthData.map((f) => parseFloat(String(f.note).replace(',', '.'))).filter((n) => !isNaN(n) && n > 0);
  const avgNote = notes.length > 0 ? notes.reduce((a, b) => a + b, 0) / notes.length : 0;
  const highStarCount = notes.filter((n) => n >= 4).length;

  const durations = monthData.map((f) => {
    if (!f.duree) return 110;
    const str = String(f.duree).toLowerCase().replace(/\s/g, '');
    if (str.includes('h')) return parseInt(str.split('h')[0], 10) * 60 + (parseInt(str.split('h')[1], 10) || 0);
    return parseInt(str, 10) || 110;
  });
  const avgDuration = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;

  const genreCounts = {};
  monthData.forEach((f) => { if (f.genre) genreCounts[f.genre] = (genreCounts[f.genre] || 0) + 1; });
  const topGenres = Object.entries(genreCounts).sort((a, b) => b[1] - a[1]);
  const maxGenreCount = topGenres.length ? topGenres[0][1] : 1;

  const langCounts = {};
  monthData.forEach((f) => { const l = (f.langue || 'VF').toUpperCase().trim(); langCounts[l] = (langCounts[l] || 0) + 1; });
  const topLangs = Object.entries(langCounts).sort((a, b) => b[1] - a[1]);

  const seatCounts = {}, roomCounts = {};
  monthData.forEach((f) => {
    const s = String(f.siege || '').trim().toUpperCase();
    const r = String(f.salle || '').trim();
    if (s && s !== '?' && s !== '-' && s !== 'LIBRE') seatCounts[s] = (seatCounts[s] || 0) + 1;
    if (r && r !== '?' && r !== '-') roomCounts[r] = (roomCounts[r] || 0) + 1;
  });
  const favSeat = Object.entries(seatCounts).sort((a, b) => b[1] - a[1])[0];
  const favRoom = Object.entries(roomCounts).sort((a, b) => b[1] - a[1])[0];
  const capuCount = monthData.filter((f) => f.capucine || f.capucines).length;

  const sortedByNote = [...monthData].filter((f) => f.note).sort((a, b) => parseFloat(String(b.note).replace(',', '.')) - parseFloat(String(a.note).replace(',', '.')));
  const bestMovie = sortedByNote[0];
  const worstMovie = sortedByNote[sortedByNote.length - 1];

  const arch = RW_ARCHETYPES[topGenres[0]?.[0]] || RW_ARCHETYPES['default'];
  const ratio = ratingScale > 0 ? avgNote / ratingScale : 0;
  const bucket = ratio >= 0.72 ? 'high' : ratio >= 0.48 ? 'mid' : 'low';
  const activeArch = arch[bucket];

  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  const monthLabel = activeMonth ? `${monthNames[parseInt(activeMonth.split('-')[1], 10) - 1]} ${activeMonth.split('-')[0]}` : '';

  const slideTitles = [
    { title: `En ${monthLabel}`, desc: 'Mes films vus et notés' },
    { title: 'Les films du mois', desc: `${totalFilms} films vus` },
    { title: 'Les stats', desc: 'Les chiffres marquants' },
    { title: 'Mes genres', desc: "Ce que j'ai préféré" },
    { title: 'Top & Flop', desc: 'Le meilleur et le pire' },
    { title: 'Mon profil ciné', desc: 'Mon archétype du mois' },
  ];

  const downloadSlide = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      const slideEl = document.getElementById(`rw-slide-${currentSlide + 1}`);
      const canvas = await html2canvas(slideEl, { 
        scale: 3, 
        useCORS: true, 
        allowTaint: true,
        backgroundColor: null, 
        logging: false,
        onclone: (clonedDoc) => {
          const elements = clonedDoc.querySelectorAll('*');
          elements.forEach(el => {
            el.style.backdropFilter = 'none';
            el.style.webkitBackdropFilter = 'none';
          });
        }
      });
      
      const link = document.createElement('a');
      link.download = `recap_${activeMonth}_slide${currentSlide + 1}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error("Erreur html2canvas:", err);
      alert("Erreur lors de la génération. Assure-toi que les images autorisent le CORS.");
    }
    setIsDownloading(false);
  };

  const renderStars = (note, scale) => {
    const stars = [];
    for (let i = 0; i < scale; i++) {
      const isFilled = i < Math.floor(note);
      const isHalf = !isFilled && i < note;
      stars.push(
        <svg key={i} viewBox="0 0 24 24" className="w-[13px] h-[13px] flex-shrink-0">
          {isHalf ? (
            <>
              <defs>
                <linearGradient id={`grad-${i}`}>
                  <stop offset="50%" stopColor="#E8B200" />
                  <stop offset="50%" stopColor="rgba(255,255,255,0.1)" />
                </linearGradient>
              </defs>
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill={`url(#grad-${i})`} />
            </>
          ) : (
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill={isFilled ? "#E8B200" : "rgba(255,255,255,0.1)"} />
          )}
        </svg>
      );
    }
    return <div className="flex items-center gap-[3px]">{stars}</div>;
  };

  const historicalCSS = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500;600;700&display=swap');
    .rw-post-card { background: #fff; border-radius: 18px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.06) inset, 0 32px 64px rgba(0,0,0,0.4); max-width: 480px; margin: 0 auto; }
    .rw-carousel-wrapper { position: relative; overflow: hidden; width: 100%; aspect-ratio: 4/5; user-select: none; }
    .rw-slide-track { display: flex; width: 600%; height: 100%; transition: transform 0.38s cubic-bezier(0.4,0,0.2,1); will-change: transform; }
    .rw-slide { width: calc(100% / 6); height: 100%; flex-shrink: 0; position: relative; box-sizing: border-box; overflow: hidden; }
    .rw-slide::before { content: ''; position: absolute; inset: 0; z-index: 50; pointer-events: none; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); background-size: 160px 160px; }
    #rw-slide-1::before, #rw-slide-4::before, #rw-slide-5::before, #rw-slide-6::before { opacity: 0.05; mix-blend-mode: overlay; }
    #rw-slide-2::before, #rw-slide-3::before { opacity: 0.05; mix-blend-mode: multiply; }
    #rw-slide-1, #rw-slide-6, #rw-slide-4, #rw-slide-5 { background: #0A0A0A; }
    #rw-slide-2, #rw-slide-3 { background: #F5F2EC; }
    .rw-pill-dark { display: inline-flex; align-items: center; gap: 7px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.18); border-radius: 40px; padding: 7px 14px 7px 10px; white-space: nowrap; backdrop-filter: blur(4px); }
    .rw-pill-dark svg { width: 12px; height: 12px; stroke: #E8B200; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; flex-shrink: 0; }
    .rw-pill-dark span { font-family: 'DM Sans', sans-serif; font-size: 10px; font-weight: 600; color: rgba(255,255,255,0.75); letter-spacing: 0.07em; text-transform: uppercase; }
    .rw-pill-light { display: inline-flex; align-items: center; gap: 7px; background: rgba(255,255,255,0.72); border: 1px solid rgba(30,30,30,0.14); border-radius: 40px; padding: 7px 14px 7px 10px; white-space: nowrap; backdrop-filter: blur(4px); box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
    .rw-pill-light svg { width: 12px; height: 12px; stroke: #1E1E1E; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; opacity: 0.6; flex-shrink: 0; }
    .rw-pill-light span { font-family: 'DM Sans', sans-serif; font-size: 10px; font-weight: 600; color: rgba(30,30,30,0.7); letter-spacing: 0.07em; text-transform: uppercase; }
    .rw-top-row { position: absolute; top: 0; left: 0; right: 0; height: 60px; display: flex; align-items: center; justify-content: space-between; padding: 0 16px; z-index: 10; }
    .rw-logo { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
    .rw-glow-a { position: absolute; bottom: -80px; left: -60px; width: 300px; height: 300px; border-radius: 50%; background: radial-gradient(circle, rgba(232,178,0,0.07) 0%, transparent 65%); pointer-events: none; z-index: 1; }
    .rw-glow-b { position: absolute; top: -60px; right: 20px; width: 200px; height: 200px; border-radius: 50%; background: radial-gradient(circle, rgba(255,255,255,0.018) 0%, transparent 70%); pointer-events: none; z-index: 1; }
  `;

  return (
    <div className="animate-in fade-in duration-500 pb-24 flex flex-col min-h-screen bg-[#0C0C0E]">
      <style dangerouslySetInnerHTML={{__html: historicalCSS}} />

      <header className="z-40 sticky top-0 w-full bg-[#0C0C0E]/90 backdrop-blur-xl border-b border-white/10 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 px-6 flex justify-between items-center">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white active:scale-90 transition-all">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-bold text-[var(--color-primary)] uppercase tracking-widest">Éditeur 4:5</span>
          <h2 className="font-syne font-black text-white text-lg">Récap Mensuel</h2>
        </div>
        <div className="w-10" />
      </header>

      <div className="px-6 py-5 flex flex-col gap-5">
        <div className="flex overflow-x-auto gap-3 scrollbar-hide snap-x">
          {availableMonthsRaw.map((m) => {
            const label = `${monthNames[parseInt(m.split('-')[1], 10) - 1].substring(0, 3)} ${m.split('-')[0].substring(2)}`;
            const isActive = m === activeMonth;
            return (
              <button key={m} onClick={() => { setSelectedMonth(m); setCurrentSlide(0); }} className={`snap-start flex-shrink-0 w-[4.5rem] h-[3.5rem] rounded-2xl border flex flex-col items-center justify-center transition-all ${isActive ? 'bg-[#E8B200]/10 border-[#E8B200]' : 'bg-white/5 border-white/10 opacity-60'}`}>
                <span className={`text-xs font-bold uppercase ${isActive ? 'text-[#E8B200]' : 'text-white'}`}>{label.split(' ')[0]}</span>
                <span className={`text-[10px] font-bold ${isActive ? 'text-[#E8B200]/70' : 'text-white/40'}`}>{label.split(' ')[1]}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5 px-2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} onClick={() => setCurrentSlide(i)} className={`h-1.5 flex-1 rounded-full cursor-pointer transition-all ${i === currentSlide ? 'bg-[#E8B200] scale-y-150' : i < currentSlide ? 'bg-[#E8B200]/40' : 'bg-white/10'}`} />
          ))}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-syne font-bold text-white text-sm">{slideTitles[currentSlide].title}</span>
            <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest">{slideTitles[currentSlide].desc}</span>
          </div>
          <span className="text-[10px] font-black text-[#E8B200] bg-[#E8B200]/10 px-3 py-1 rounded-full border border-[#E8B200]/20">{currentSlide + 1} / 6</span>
        </div>
      </div>

      {totalFilms > 0 ? (
        <div className="px-6 mb-6 relative">
          <div className="rw-post-card relative">
            {currentSlide > 0 && (
              <button onClick={() => setCurrentSlide(s => s - 1)} className="absolute left-2 top-1/2 -translate-y-1/2 z-[60] w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-lg">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
            )}
            {currentSlide < 5 && (
              <button onClick={() => setCurrentSlide(s => s + 1)} className="absolute right-2 top-1/2 -translate-y-1/2 z-[60] w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-lg">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            )}

            <div className="rw-carousel-wrapper" ref={carouselRef}>
              <div className="rw-slide-track" style={{ transform: `translateX(-${currentSlide * (100 / 6)}%)` }}>

                <div className="rw-slide" id="rw-slide-1">
                  <div className="rw-glow-a" />
                  <div className="rw-glow-b" />
                  <div className="absolute top-[25px] left-[16px] z-30">
                    <span className="font-syne font-black text-[25px] leading-none text-[#E8B200] tracking-[-0.2px] uppercase">Mon récap'</span>
                    <span className="block font-sans font-light text-[10px] text-white/25 tracking-[0.15em] uppercase mt-[3px]">ciné du mois</span>
                  </div>
                  <img className="rw-logo" src={userAvatar} alt="" style={{ position: 'absolute', top: '14px', right: '14px', zIndex: 30 }} crossOrigin="anonymous" />
                  <div className="absolute top-[160px] left-[12px] right-0 flex flex-col justify-end px-[20px] pb-[16px] z-10">
                    <div className="font-syne font-black text-[clamp(80px,22vw,150px)] leading-[0.88] text-white tracking-[-3px] flex items-baseline">
                      {Math.round(avgDuration * totalFilms / 60 * 10) / 10}
                      <span className="font-normal text-[clamp(28px,9vw,44px)] tracking-[-1px] text-[#E8B200] ml-[4px]">h</span>
                    </div>
                    <div className="font-sans font-normal text-[12px] text-white/40 tracking-[0.01em] mt-[6px] leading-[1.4]">
                      dans le noir en <strong className="text-white/70 font-semibold">{monthLabel}</strong>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-[22px] p-[10px_20px_14px] z-20 border-t border-white/5">
                    <div className="font-sans font-medium text-[11px] text-white/35 tracking-[0.12em] uppercase">{monthLabel}</div>
                  </div>
                </div>

                <div className="rw-slide" id="rw-slide-2">
                  <div className="absolute inset-0 flex flex-row gap-[3px] z-1 overflow-hidden right-0 -top-[50px] -left-[50px] w-[125%] rotate-[12deg]">
                    {[0, 1, 2, 3, 4, 5, 6, 7].map((col) => (
                      <div key={col} className={`flex-1 flex flex-col gap-[3px] min-w-0 ${col % 2 !== 0 ? 'pt-0' : col % 3 === 0 ? 'pt-[12px]' : 'pt-[24px]'}`}>
                        {[0, 1, 2, 3, 4, 5, 6].map((row) => {
                          const f = monthData[(col * 7 + row) % monthData.length];
                          return (
                            <div key={row} className="flex-shrink-0 w-full aspect-[2/3] bg-[#ddd] overflow-hidden relative rounded-[8px]">
                              {f?.affiche && <img src={f.affiche} className="w-full h-full object-cover object-top block saturate-[0.65] brightness-90" crossOrigin="anonymous" />}
                              {f?.capucine && <img src="https://i.imgur.com/lg1bkrO.png" className="absolute top-[3px] right-[3px] w-[14px] h-[14px] rounded-full bg-white p-[1.5px] object-contain z-10 shadow-md" crossOrigin="anonymous" />}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                  <div className="absolute inset-0 right-0 z-2" style={{ background: 'linear-gradient(180deg,rgba(245,242,236,0.08) 0%,rgba(245,242,236,0.02) 25%,rgba(245,242,236,0.18) 45%,rgba(245,242,236,0.78) 62%,rgba(245,242,236,0.97) 78%,rgba(245,242,236,1.00) 88%)', bottom: '-2px' }} />
                  <div className="absolute inset-0 right-[22px] z-10 flex flex-col justify-between px-[16px] pb-[18px]">
                    <div className="rw-top-row">
                      <div className="rw-pill-light">
                        <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        <span>{monthLabel}</span>
                      </div>
                      <img className="rw-logo" src={userAvatar} alt="" crossOrigin="anonymous" />
                    </div>
                    <div>
                      <div className="font-syne font-black text-[42px] leading-[0.92] text-[#1E1E1E] tracking-[-2px] mb-[7px]">
                        {totalFilms} films<br /><span className="text-[#c49a10]">ce mois</span>
                      </div>
                      <div className="flex flex-wrap gap-[6px] mt-[10px]">
                        {monthData.slice(0, 5).map((f, i) => (
                          <div key={i} className={`inline-flex items-center gap-[5px] bg-[#1E1E1E]/80 border border-[#1E1E1E]/10 rounded-[20px] px-[8px] py-[3px] font-sans text-[8px] font-medium text-white/90 whitespace-nowrap max-w-[250px] overflow-hidden text-ellipsis ${f.capucine ? 'bg-[rgba(180,30,60,0.75)] border-[rgba(139,26,58,0.35)]' : ''}`}>
                            {f.capucine && <span className="w-[10px] h-[10px] rounded-full bg-[url('https://i.imgur.com/lg1bkrO.png')] bg-center bg-cover flex-shrink-0" />}
                            {f.titre}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rw-slide" id="rw-slide-3">
                  <div className="rw-top-row">
                    <div className="rw-pill-light">
                      <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      <span>{monthLabel}</span>
                    </div>
                    <img className="rw-logo" src={userAvatar} alt="" crossOrigin="anonymous" />
                  </div>
                  <div className="absolute top-[60px] bottom-0 left-0 right-[22px] flex flex-col px-[16px] pb-[14px] z-10 overflow-hidden">
                    <div className="flex-none flex items-start justify-between pt-[6px] border-b border-[#1E1E1E]/10 pb-[10px] mb-[10px]">
                      <div>
                        <div className="font-sans text-[8.5px] font-semibold text-[#1E1E1E]/35 tracking-[0.13em] uppercase mb-[3px]">Note moyenne</div>
                        <div className="font-syne font-black text-[65px] leading-[0.88] text-[#1E1E1E] tracking-[-4px] flex items-baseline">
                          {avgNote.toFixed(1)}<span className="text-[28px] font-normal tracking-[-0.5px] text-[#E8B200] ml-[4px]">/ {ratingScale}</span>
                        </div>
                      </div>
                      {highStarCount > 0 && (
                        <div className="text-right">
                          <div className="font-syne font-black text-[52px] leading-[0.92] text-[#1E1E1E]/10 tracking-[-2px]">{highStarCount}</div>
                          <div className="font-sans text-[8.5px] font-normal text-[#1E1E1E]/30 leading-[1.4] mt-[2px] max-w-[70px] text-right">notes sup. à 4</div>
                        </div>
                      )}
                    </div>
                    <div className="flex-none border-b border-[#1E1E1E]/10 pb-[10px] mb-[10px]">
                      <div className="font-sans text-[8.5px] font-semibold text-[#1E1E1E]/35 tracking-[0.13em] uppercase mb-[3px]">Durée moyenne</div>
                      <div className="font-syne font-black text-[72px] leading-[0.88] text-[#1E1E1E] tracking-[-3px] flex items-baseline">
                        {Math.floor(avgDuration / 60)}<span className="text-[22px] font-normal text-[#E8B200] ml-[4px]">h</span>{String(avgDuration % 60).padStart(2, '0')}
                      </div>
                    </div>
                    <div className="flex-none flex items-start justify-between border-b border-[#1E1E1E]/10 pb-[10px] mb-[10px]">
                      <div>
                        <div className="font-sans text-[8.5px] font-semibold text-[#1E1E1E]/35 tracking-[0.13em] uppercase mb-[3px]">Siège favori</div>
                        <div className="font-syne font-black text-[28px] leading-none text-[#1E1E1E] tracking-[-1px]">{favSeat ? favSeat[0] : '—'}</div>
                        <div className="font-sans text-[9.5px] font-normal text-[#1E1E1E]/40 mt-[2px]">{favSeat ? `${Math.round((favSeat[1] / totalFilms) * 100)}% des séances` : ''}</div>
                      </div>
                      {favRoom && (
                        <div className="border-l border-[#1E1E1E]/10 pl-[14px]">
                          <div className="font-sans text-[8.5px] font-semibold text-[#1E1E1E]/35 tracking-[0.13em] uppercase mb-[3px]">Salle favorite</div>
                          <div className="font-syne font-black text-[28px] leading-none text-[#1E1E1E] tracking-[-1px]">{favRoom[0]}</div>
                          <div className="font-sans text-[9.5px] font-normal text-[#1E1E1E]/40 mt-[2px]">{Math.round((favRoom[1] / totalFilms) * 100)}% des séances</div>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 flex items-center min-h-0">
                      {capuCount > 0 && (
                        <div className="flex items-center gap-[7px] bg-[#fdf0f3] border border-[#8B1A3A]/10 rounded-[12px] px-[11px] py-[7px]">
                          <img src="https://i.imgur.com/lg1bkrO.png" className="w-[20px] h-[20px] object-contain rounded-full" crossOrigin="anonymous" />
                          <div>
                            <div className="font-syne font-black text-[16px] leading-none text-[#8B1A3A] tracking-[-0.5px]">{capuCount}</div>
                            <div className="font-sans text-[7.5px] font-normal text-[#8B1A3A]/60 mt-[1px] leading-[1.3] max-w-[75px]">films en compétition</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rw-slide" id="rw-slide-4" style={{ background: 'linear-gradient(180deg,#0D0D0D 0%,#111 100%)' }}>
                  <div className="absolute bottom-0 left-0 right-0 h-[18%] bg-[#F5F2EC] z-0" />
                  <div className="absolute inset-0 right-[22px] z-10 flex flex-col pt-[12px] px-[16px] pb-0">
                    <div className="rw-top-row !relative !p-0 mb-[8px] flex-shrink-0">
                      <div className="rw-pill-dark">
                        <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        <span>{monthLabel}</span>
                      </div>
                      <img className="rw-logo" src={userAvatar} alt="" crossOrigin="anonymous" />
                    </div>
                    <div className="flex-shrink-0 mb-[12px]">
                      <div className="font-sans text-[8.5px] font-semibold text-white/28 tracking-[0.14em] uppercase mb-[5px]">Ce que j'ai regardé</div>
                      <div className="font-syne font-black leading-[0.94] text-white text-[clamp(24px,7vw,34px)] tracking-[-0.5px]">Mes genres<br /><span className="text-[#E8B200]">du mois</span></div>
                    </div>
                    <div className="flex flex-col gap-[10px] flex-1 min-h-0 justify-start">
                      {topGenres.slice(0, 5).map(([g, c], i) => {
                        const pct = Math.round((c / maxGenreCount) * 100);
                        const rowStyles = [
                          { size: '15px', th: '16px', fill: 'linear-gradient(90deg,#c49a10,#FFD341)', txt: '#fff' },
                          { size: '13px', th: '13px', fill: 'linear-gradient(90deg,#383838,#555)', txt: 'rgba(255,255,255,0.82)' },
                          { size: '12px', th: '11px', fill: 'linear-gradient(90deg,#7E0000,#b03010)', txt: 'rgba(255,255,255,0.68)' },
                          { size: '11px', th: '9px', fill: 'rgba(255,255,255,0.18)', txt: 'rgba(255,255,255,0.48)' },
                          { size: '10px', th: '7px', fill: 'rgba(255,255,255,0.1)', txt: 'rgba(255,255,255,0.32)' },
                        ][i] || { size: '10px', th: '7px', fill: 'rgba(255,255,255,0.1)', txt: 'rgba(255,255,255,0.32)' };
                        const medal = ['🥇', '🥈', '🥉', '', ''][i];
                        return (
                          <div key={g} className="flex flex-col gap-[5px]">
                            <div className="flex items-baseline justify-between">
                              <div className="flex items-center gap-[7px]">
                                {medal && <span className="text-[12px] leading-none flex-shrink-0">{medal}</span>}
                                <span className="font-syne font-bold tracking-[-0.3px]" style={{ fontSize: rowStyles.size, color: rowStyles.txt }}>{g}</span>
                              </div>
                              <span className="font-sans text-[9px] font-semibold tracking-[0.04em] text-white/35">{c} film{c > 1 ? 's' : ''}</span>
                            </div>
                            <div className="w-full rounded-[3px] overflow-hidden bg-white/5" style={{ height: rowStyles.th }}>
                              <div className="h-full rounded-[3px]" style={{ width: `${pct}%`, background: rowStyles.fill }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="h-[18%] flex-shrink-0 flex items-center pb-[6px] gap-0 overflow-hidden">
                      <div className="font-sans text-[8px] font-semibold text-[#1E1E1E]/35 tracking-[0.13em] uppercase mr-[12px] flex-shrink-0">Langues :</div>
                      <div className="flex items-center flex-1 min-w-0 flex-nowrap overflow-hidden">
                        {topLangs.slice(0, 4).map(([l, c], i) => (
                          <div key={l} className={`flex items-baseline gap-[3px] px-[8px] flex-shrink-0 ${i !== 0 ? 'border-l border-[#1E1E1E]/10' : 'pl-0'}`}>
                            <span className={`font-syne font-black text-[16px] leading-none tracking-[-0.5px] ${i === 0 ? 'text-[#c49a10]' : 'text-[#1E1E1E]'}`}>{Math.round((c / totalFilms) * 100)}%</span>
                            <span className="font-sans text-[8px] font-semibold text-[#1E1E1E]/35 tracking-[0.13em] uppercase flex-shrink-0">{l}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rw-slide" id="rw-slide-5">
                  <div className="absolute left-0 right-0 w-full h-[50%] overflow-hidden top-0">
                    {bestMovie?.affiche && <div className="absolute inset-0 bg-cover bg-center z-0 saturate-[0.8] brightness-[0.55]" style={{ backgroundImage: `url(${bestMovie.affiche})` }} crossOrigin="anonymous" />}
                    <div className="absolute inset-0 z-1" style={{ background: 'linear-gradient(180deg,rgba(0,0,0,0.15) 0%,rgba(0,0,0,0.05) 30%,rgba(0,0,0,0.55) 70%,rgba(0,0,0,0.82) 100%)' }} />
                    <div className="absolute inset-0 z-10 flex flex-col justify-end p-[10px_16px_12px]">
                      <div className="font-sans text-[8px] font-bold tracking-[0.16em] uppercase mb-[5px] flex items-center gap-[6px] text-white/50"><div className="w-[18px] h-[2px] bg-[#E8B200] rounded-[2px] flex-shrink-0" />Coup de cœur</div>
                      <div className="font-syne font-black text-[21px] leading-[1.05] tracking-[-0.5px] mb-[6px] line-clamp-2 text-white">{bestMovie ? bestMovie.titre : '—'}</div>
                      <div className="flex items-center gap-[6px]">
                        {bestMovie && renderStars(parseFloat(bestMovie.note), ratingScale)}
                        {bestMovie?.capucine && <div className="w-[18px] h-[18px] rounded-full bg-[url('https://i.imgur.com/lg1bkrO.png')] bg-center bg-cover shadow-sm ml-1" />}
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-[50%] left-0 right-0 h-[1px] z-20 bg-white/10" />
                  <div className="absolute left-0 right-0 w-full h-[50%] overflow-hidden bottom-0">
                    {worstMovie?.affiche && <div className="absolute inset-0 bg-cover bg-center z-0 brightness-[0.75] saturate-50 sepia-[0.15]" style={{ backgroundImage: `url(${worstMovie.affiche})` }} crossOrigin="anonymous" />}
                    <div className="absolute inset-0 z-1" style={{ background: 'linear-gradient(180deg,rgba(245,242,236,0.2) 0%,rgba(245,242,236,0.05) 25%,rgba(245,242,236,0.65) 65%,rgba(245,242,236,0.92) 100%)', bottom: '-2px' }} />
                    <div className="absolute inset-0 z-10 flex flex-col justify-end p-[10px_16px_12px]">
                      <div className="font-sans text-[8px] font-bold tracking-[0.16em] uppercase mb-[5px] flex items-center gap-[6px] text-[#1E1E1E]/45"><div className="w-[18px] h-[2px] bg-[#1E1E1E]/30 rounded-[2px] flex-shrink-0" />À oublier</div>
                      <div className="font-syne font-black text-[21px] leading-[1.05] tracking-[-0.5px] mb-[6px] line-clamp-2 text-[#1E1E1E]">{worstMovie ? worstMovie.titre : '—'}</div>
                      <div className="flex items-center gap-[6px]">
                         {worstMovie && renderStars(parseFloat(worstMovie.note), ratingScale)}
                         {worstMovie?.capucine && <div className="w-[18px] h-[18px] rounded-full bg-[url('https://i.imgur.com/lg1bkrO.png')] bg-center bg-cover shadow-sm ml-1" />}
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-0 left-0 right-0 h-[58px] flex items-center justify-between px-[16px] z-30">
                    <div className="rw-pill-dark !bg-black/35 !border-white/10">
                      <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      <span>{monthLabel}</span>
                    </div>
                    <img className="rw-logo" src={userAvatar} alt="" crossOrigin="anonymous" />
                  </div>
                </div>

                <div className="rw-slide" id="rw-slide-6">
                  <div className="rw-glow-a" />
                  <div className="rw-glow-b" />
                  <div className="rw-top-row">
                    <div className="rw-pill-dark">
                      <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      <span>{monthLabel}</span>
                    </div>
                    <img className="rw-logo" src={userAvatar} alt="" crossOrigin="anonymous" />
                  </div>
                  <div className="absolute top-[64px] left-[14px] right-[14px] border border-white/10 rounded-[14px] p-[16px_16px_14px] z-10 flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between mb-[12px]">
                      <span className="font-sans text-[8px] font-bold text-white/20 tracking-[0.18em] uppercase">Profil ciné du mois</span>
                      <span className="font-sans text-[8px] font-medium text-white/15">— {activeMonth.split('-')[1]} / {activeMonth.split('-')[0]}</span>
                    </div>
                    <div className="font-syne font-black text-[clamp(32px,10vw,48px)] leading-[0.92] text-white tracking-[-2px] mb-[7px] break-words whitespace-pre-line">
                      {activeArch?.name.split('\n')[0]}<br /><span className="text-[#E8B200]">{activeArch?.name.split('\n')[1]}</span>
                    </div>
                    <div className="font-sans text-[9.5px] font-light text-white/35 leading-[1.5]">{activeArch?.desc}</div>
                    <div className="w-full h-[1px] bg-white/5 my-[12px]" />
                    <div className="grid grid-cols-2 gap-y-[12px] gap-x-[10px]">
                      <div>
                        <div className="font-sans text-[7.5px] font-semibold text-white/20 tracking-[0.14em] uppercase mb-[2px]">Genre dominant</div>
                        <div className="font-syne font-bold text-[13px] leading-none text-white">{topGenres[0]?.[0] || '—'}</div>
                      </div>
                      <div>
                        <div className="font-sans text-[7.5px] font-semibold text-white/20 tracking-[0.14em] uppercase mb-[2px]">Note moyenne</div>
                        <div className="font-syne font-bold text-[18px] leading-none text-white tracking-[-0.6px] flex items-baseline">
                          {avgNote.toFixed(1)}<span className="text-[11px] font-normal text-[#E8B200] ml-[2px]">/ {ratingScale}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-[22px] p-[10px_16px_14px] z-10 border-t border-white/5">
                    <div className="font-syne font-semibold text-[10.5px] text-white/30 tracking-[-0.2px] leading-[1.5]">
                      RDV <strong>le mois prochain</strong><br />pour découvrir mon prochain profil
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <button
              onClick={downloadSlide}
              disabled={isDownloading}
              className="w-full max-w-sm h-14 rounded-2xl bg-[#E8B200] text-[#0A0A0A] font-syne font-black text-sm tracking-wide flex items-center justify-center gap-3 shadow-[0_4px_20px_rgba(232,178,0,0.25)] hover:shadow-[0_8px_28px_rgba(232,178,0,0.35)] active:scale-95 transition-all disabled:opacity-50"
            >
              {isDownloading ? (
                <svg className="w-5 h-5 animate-spin text-[#0A0A0A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.25" /><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" /></svg>
              ) : (
                <svg className="w-5 h-5 stroke-[#0A0A0A]" viewBox="0 0 24 24" fill="none" strokeWidth="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
              )}
              {isDownloading ? 'Génération...' : 'Télécharger cette slide'}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center pt-20 px-6 opacity-50">
          <svg className="w-16 h-16 text-white mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><circle cx="12" cy="12" r="10" /><path d="M16 16s-1.5-2-4-2-4 2-4 2M9 9h.01M15 9h.01" /></svg>
          <p className="text-center text-sm font-bold text-white">Aucun film trouvé pour ce mois.</p>
        </div>
      )}
    </div>
  );
}

// ── 4. Composant principal Studio ───────────────────────────────────────────────
export function Studio({ historyData, ratingScale, userName, userAvatar, isScrolled, pendingFilm }) {
  const [isUnlocked, setIsUnlocked] = useState(
    localStorage.getItem('grandecran_studio_unlocked') === 'true'
  );
  const [activeTool, setActiveTool] = useState(null);

  const handleUnlock = () => {
    setIsUnlocked(true);
    localStorage.setItem('grandecran_studio_unlocked', 'true');
  };

  const handleLock = () => {
    setIsUnlocked(false);
    localStorage.removeItem('grandecran_studio_unlocked');
  };

  if (!isUnlocked) return <LockScreen onUnlock={handleUnlock} />;
  
  if (activeTool === 'recap') {
    return <RecapTool historyData={historyData} ratingScale={ratingScale} userAvatar={userAvatar} onBack={() => setActiveTool(null)} />;
  }

  if (activeTool === 'seance') {
    return <SeanceStoryTool historyData={historyData} userAvatar={userAvatar} pendingFilm={pendingFilm} onBack={() => setActiveTool(null)} />;
  }
  
  return <StudioHub isScrolled={isScrolled} onSelectTool={setActiveTool} onLock={handleLock} />;
}