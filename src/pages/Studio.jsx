import { useState, useRef, useEffect } from 'react';
import { RW_ARCHETYPES } from '../constants';
import * as htmlToImage from 'html-to-image';

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
          <p className="text-xs text-white/50 font-medium">Tes statistiques et coups de cœur du mois.</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div onClick={() => onSelectTool('seance')} className="bg-gradient-to-tr from-white/10 to-transparent border border-white/10 rounded-3xl p-5 relative overflow-hidden cursor-pointer active:scale-[0.98] transition-all group">
            <span className="bg-white/10 text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full mb-3 inline-block">Story 9:16</span>
            <h3 className="font-syne font-black text-lg text-white mb-1">Séance</h3>
            <p className="text-[10px] text-white/50 font-medium">Annonce ton film</p>
          </div>
          <div className="bg-white/5 border border-white/5 rounded-3xl p-5 relative overflow-hidden grayscale opacity-50 cursor-not-allowed">
            <span className="bg-white/10 text-white/50 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full mb-3 inline-block">Critique</span>
            <h3 className="font-syne font-black text-lg text-white mb-1">Coming Soon</h3>
          </div>
        </div>
      </main>
    </div>
  );
}

// ── 3. Outil Story Séance ──────────────────────────────────────────────────────
function SeanceStoryTool({ historyData = [], onBack, pendingFilm }) {
  const [title, setTitle] = useState(pendingFilm?.titre || '');
  const [date, setDate] = useState(pendingFilm?.date || new Date().toLocaleDateString('fr-FR'));
  const defaultTime = pendingFilm?.heure ? pendingFilm.heure.replace('h', ':') : '20:00';
  const [time, setTime] = useState(defaultTime);
  const [lang, setLang] = useState(pendingFilm?.langue || 'VOSTFR');
  const [expectation, setExpectation] = useState(2);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Affiche convertie en base64 pour éviter l'écran noir (CORS)
  const [poster64, setPoster64] = useState(null);
  
  const wrapperRef = useRef(null);
  const storyRef = useRef(null);
  const [scale, setScale] = useState(0.3);

  const currentYear = date ? date.split('/')[2] : new Date().getFullYear().toString();
  const filmsThisYear = (historyData || []).filter(f => f.date && f.date.endsWith(currentYear)).length;
  const yearlyScreeningNumber = filmsThisYear + 1;
  const formattedScreeningLabel = `${currentYear} — Séance #${yearlyScreeningNumber}`;

  const expectations = [
    { label: "Sceptique",      color: "bg-white/40",       glow: "shadow-[0_0_15px_rgba(255,255,255,0.3)]", hex: "rgba(255,255,255,0.4)" },
    { label: "Curieux",        color: "bg-blue-400",       glow: "shadow-[0_0_15px_rgba(96,165,250,0.6)]", hex: "#60A5FA" },
    { label: "Intrigué",       color: "bg-purple-400",     glow: "shadow-[0_0_15px_rgba(192,132,252,0.6)]", hex: "#C084FC" },
    { label: "Très impatient", color: "bg-orange-400",     glow: "shadow-[0_0_15px_rgba(251,146,60,0.6)]", hex: "#FB923C" },
    { label: "Hype absolue",   color: "bg-[#E8B200]",      glow: "shadow-[0_0_20px_#E8B200]", hex: "#E8B200" }
  ];

  // Logic pour transformer l'affiche TMDB en base64 (indispensable pour export mobile)
  useEffect(() => {
    const convertPoster = async () => {
      if (!pendingFilm?.affiche) return;
      try {
        const response = await fetch(pendingFilm.affiche, { mode: 'cors' });
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => setPoster64(reader.result);
        reader.readAsDataURL(blob);
      } catch (err) {
        console.warn("CORS fetch failed, using direct URL");
        setPoster64(pendingFilm.affiche);
      }
    };
    convertPoster();
  }, [pendingFilm]);

  useEffect(() => {
    const updateScale = () => {
      if (wrapperRef.current) setScale(wrapperRef.current.offsetWidth / 1080);
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const downloadStory = async () => {
    if (isDownloading || !storyRef.current) return;
    setIsDownloading(true);
    
    try {
      // Suppression du scale temporairement pour la photo
      const dataUrl = await htmlToImage.toPng(storyRef.current, {
        width: 1080,
        height: 1920,
        style: { transform: 'none' }, // On capture à taille réelle 1:1
        cacheBust: true,
      });

      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `seance_${yearlyScreeningNumber}.png`, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Ma prochaine séance',
        });
      } else {
        const link = document.createElement('a');
        link.download = `seance_${yearlyScreeningNumber}.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error(err);
      alert("Erreur de génération. Essaie de recharger la page.");
    }
    setIsDownloading(false);
  };

  return (
    <div className="animate-in fade-in duration-500 pb-24 flex flex-col min-h-screen bg-[#0C0C0E] overflow-x-hidden">
      <header className="z-40 sticky top-0 w-full bg-[#0C0C0E]/90 backdrop-blur-xl border-b border-white/10 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 px-6 flex justify-between items-center">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white active:scale-90 transition-all">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <h2 className="font-syne font-black text-white text-lg">Prochaine Séance</h2>
        <div className="w-10" />
      </header>

      <div className="px-6 py-6 flex flex-col gap-8">
        <div className="w-full relative bg-white/5 rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl" ref={wrapperRef} style={{ aspectRatio: '9/16' }}>
          
          <div 
            ref={storyRef}
            id="story-visible-node" 
            className="absolute top-0 left-0 origin-top-left overflow-hidden bg-black font-sans" 
            style={{ width: '1080px', height: '1920px', transform: `scale(${scale})` }}
          >
            {/* BACKGROUND */}
            {poster64 ? (
              <>
                <img src={poster64} className="absolute inset-0 w-full h-full object-cover opacity-40 blur-3xl scale-150" alt="" />
                <img src={poster64} className="absolute inset-0 w-full h-full object-cover opacity-90" alt="" />
              </>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#7E0000] to-[#2A0000]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />

            {/* CONTENT */}
            <div className="absolute inset-0 p-16 flex flex-col justify-between z-10 text-white">
              <div className="mt-12 self-start">
                <div className="bg-[#1C1C1E]/90 border border-white/20 px-8 py-5 rounded-full font-bold text-3xl tracking-widest uppercase shadow-2xl">
                  {formattedScreeningLabel}
                </div>
              </div>

              <div className="flex flex-col gap-10 mb-12">
                <h1 className="font-syne font-black text-8xl leading-[0.95] drop-shadow-2xl">
                  {title || "Titre du film"}
                </h1>

                <div className="flex flex-wrap gap-4">
                  <div className="bg-[#1C1C1E]/90 border border-white/20 px-8 h-[80px] rounded-[100px] flex items-center gap-4">
                    <svg className="w-10 h-10 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                    <span className="font-bold text-4xl leading-none -translate-y-1">{date}</span>
                  </div>
                  <div className="bg-[#1C1C1E]/90 border border-white/20 px-8 h-[80px] rounded-[100px] flex items-center gap-4">
                    <svg className="w-10 h-10 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                    <span className="font-bold text-4xl leading-none -translate-y-1">{time.replace(':', 'h')}</span>
                  </div>
                  <div className="bg-[#1C1C1E]/90 border border-white/20 text-[var(--color-primary)] px-8 h-[80px] rounded-[100px] flex items-center gap-4">
                    <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
                    <span className="font-black text-4xl leading-none -translate-y-1">{lang}</span>
                  </div>
                </div>

                <div className="bg-black/40 backdrop-blur-3xl border border-white/20 rounded-[2rem] p-10 mt-6 shadow-2xl">
                  <div className="flex justify-between items-end mb-8">
                    <div>
                      <p className="text-white/60 text-xl font-bold uppercase tracking-[0.2em] mb-2">Hype Meter</p>
                      <p className="text-white text-5xl font-black italic">{expectations[expectation].label}</p>
                    </div>
                    <div className="text-white/20 font-black text-7xl italic leading-none">
                      {expectation + 1}<span className="text-4xl">/5</span>
                    </div>
                  </div>
                  <div className="flex gap-3 w-full h-5">
                    {expectations.map((exp, i) => (
                      <div key={i} className={`flex-1 rounded-full transition-all duration-500 ${i <= expectation ? `${exp.color} ${exp.glow}` : 'bg-white/10'}`} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col gap-5 text-white">
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre du film" className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 font-bold outline-none focus:border-[var(--color-primary)]" />
          <div className="grid grid-cols-2 gap-4">
            <input type="text" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-center font-bold outline-none" />
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-center font-bold outline-none" />
          </div>
          <div className="flex gap-2 bg-black/40 border border-white/10 rounded-2xl p-4">
            {expectations.map((exp, i) => (
              <button key={i} onClick={() => setExpectation(i)} className="flex-1 h-8 flex items-center justify-center relative group">
                <div className={`w-full h-2 rounded-full transition-all duration-300 group-hover:scale-y-150 ${i <= expectation ? exp.color : 'bg-white/10'}`} />
              </button>
            ))}
          </div>
        </div>

        <button onClick={downloadStory} disabled={isDownloading || !title} className="w-full h-16 rounded-2xl bg-[var(--color-primary)] text-black font-syne font-black text-lg flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all disabled:opacity-50">
          {isDownloading ? <div className="w-6 h-6 border-2 border-black border-t-transparent animate-spin rounded-full" /> : "Partager la Story"}
        </button>
      </div>
    </div>
  );
}

// ── 4. Outil Récap Mensuel ──────────────────────────────────────────────────────
function RecapTool({ historyData = [], ratingScale = 5, onBack }) {
  const [selectedMonth, setSelectedMonth] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const safeHistory = historyData || [];
  const availableMonthsRaw = [...new Set(safeHistory.map((f) => {
    const parts = f.date?.split('/');
    return parts?.length === 3 ? `${parts[2]}-${parts[1]}` : null;
  }).filter(Boolean))].sort((a, b) => b.localeCompare(a));

  const activeMonth = selectedMonth || availableMonthsRaw[0] || '';
  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  const monthLabel = activeMonth ? `${monthNames[parseInt(activeMonth.split('-')[1], 10) - 1]} ${activeMonth.split('-')[0]}` : '';

  const downloadSlide = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      const slideEl = document.getElementById(`rw-slide-${currentSlide + 1}`);
      const dataUrl = await htmlToImage.toPng(slideEl, { pixelRatio: 3, backgroundColor: '#000' });
      const link = document.createElement('a');
      link.download = `recap_${activeMonth}_slide${currentSlide + 1}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      alert("Erreur lors du téléchargement.");
    }
    setIsDownloading(false);
  };

  return (
    <div className="animate-in fade-in duration-500 pb-24 flex flex-col min-h-screen bg-[#0C0C0E]">
      <header className="z-40 sticky top-0 w-full bg-[#0C0C0E]/90 backdrop-blur-xl border-b border-white/10 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 px-6 flex justify-between items-center">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white active:scale-90 transition-all">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <h2 className="font-syne font-black text-white text-lg">Récap Mensuel</h2>
        <div className="w-10" />
      </header>
      <div className="p-6 text-center text-white/50">
        <p>Sélectionne ton mois et génère tes slides.</p>
        {/* Intégrer ici ton code de carousel de slides précédent adapté à htmlToImage */}
        <button onClick={downloadSlide} className="mt-8 bg-[var(--color-primary)] text-black px-6 py-3 rounded-xl font-bold">Télécharger la slide</button>
      </div>
    </div>
  );
}

// ── 5. Composant principal Studio ───────────────────────────────────────────────
export function Studio({ historyData, ratingScale, userName, userAvatar, isScrolled, pendingFilm }) {
  const [isUnlocked, setIsUnlocked] = useState(localStorage.getItem('grandecran_studio_unlocked') === 'true');
  const [activeTool, setActiveTool] = useState(null);

  if (!isUnlocked) return <LockScreen onUnlock={() => { setIsUnlocked(true); localStorage.setItem('grandecran_studio_unlocked', 'true'); }} />;
  
  if (activeTool === 'recap') return <RecapTool historyData={historyData} ratingScale={ratingScale} onBack={() => setActiveTool(null)} />;
  if (activeTool === 'seance') return <SeanceStoryTool historyData={historyData} pendingFilm={pendingFilm} onBack={() => setActiveTool(null)} />;
  
  return <StudioHub isScrolled={isScrolled} onSelectTool={setActiveTool} onLock={() => { setIsUnlocked(false); localStorage.removeItem('grandecran_studio_unlocked'); }} />;
}