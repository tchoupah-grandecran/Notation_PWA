import { useState, useRef, useEffect } from 'react';
import { RW_ARCHETYPES } from '../constants';
import * as htmlToImage from 'html-to-image';

// ── 1. Écran de verrouillage (Inchangé) ──────────────────────────────────────────
function LockScreen({ onUnlock }) {
  const [password, setPassword] = useState('');
  const STUDIO_PASSWORD = 'POPCORN';
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
      <div className="w-20 h-20 bg-white/5 rounded-full border border-white/10 flex items-center justify-center mb-6 shadow-2xl">
        <svg className="w-8 h-8 text-[var(--color-primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
      </div>
      <h2 className="font-syne font-black text-3xl mb-2 text-white">Zone Sécurisée</h2>
      <form onSubmit={(e) => { e.preventDefault(); if (password.toUpperCase() === STUDIO_PASSWORD) onUnlock(); else { alert('Incorrect'); setPassword(''); } }} className="flex flex-col gap-4 w-full max-w-xs">
        <input type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-black/40 border border-white/10 rounded-2xl p-4 text-center font-bold tracking-widest outline-none focus:border-[var(--color-primary)] transition-colors text-white" />
        <button type="submit" className="bg-[var(--color-primary)] text-black font-black uppercase tracking-widest py-4 rounded-2xl active:scale-95 transition-transform">Déverrouiller</button>
      </form>
    </div>
  );
}

// ── 2. Hub Studio (Inchangé) ─────────────────────────────────────────────────────
function StudioHub({ isScrolled, onSelectTool, onLock }) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      <header className={`z-40 sticky top-0 w-full transition-all duration-500 bg-[var(--color-bg)]/80 backdrop-blur-2xl border-b ${isScrolled ? 'pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-3 border-white/10 shadow-lg' : 'pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-5 border-transparent'}`}>
        <div className="px-6 flex justify-between items-center">
          <h1 className={`font-syne font-black text-white leading-none transition-all duration-500 ${isScrolled ? 'text-2xl' : 'text-4xl'}`}>Studio</h1>
          <button onClick={onLock} className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg></button>
        </div>
      </header>
      <main className="px-6 pt-6 space-y-4">
        <div onClick={() => onSelectTool('recap')} className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-3xl p-6 relative overflow-hidden cursor-pointer group active:scale-95 transition-all">
          <h3 className="font-syne font-black text-2xl text-white mb-2">Récap' Mensuel</h3>
          <p className="text-xs text-white/50 font-medium">Génère tes statistiques du mois.</p>
        </div>
        <div onClick={() => onSelectTool('seance')} className="bg-gradient-to-tr from-white/10 to-transparent border border-white/10 rounded-3xl p-5 cursor-pointer active:scale-95 transition-all">
          <h3 className="font-syne font-black text-lg text-white mb-1">Séance</h3>
          <p className="text-[10px] text-white/50 font-medium">Annonce ton film en story.</p>
        </div>
      </main>
    </div>
  );
}

// ── 3. Outil Story Séance (VERSION iOS ULTRA-ROBUSTE) ──────────────────────────
function SeanceStoryTool({ historyData = [], onBack, pendingFilm }) {
  const [title, setTitle] = useState(pendingFilm?.titre || '');
  const [date, setDate] = useState(pendingFilm?.date || new Date().toLocaleDateString('fr-FR'));
  const [time, setTime] = useState(pendingFilm?.heure ? pendingFilm.heure.replace('h', ':') : '20:00');
  const [lang, setLang] = useState(pendingFilm?.langue || 'VOSTFR');
  const [expectation, setExpectation] = useState(2);
  const [isDownloading, setIsDownloading] = useState(false);
  const [poster64, setPoster64] = useState(null);
  
  const wrapperRef = useRef(null);
  const storyRef = useRef(null);
  const [scale, setScale] = useState(0.3);

  const currentYear = date ? date.split('/')[2] : new Date().getFullYear().toString();
  const yearlyScreeningNumber = (historyData || []).filter(f => f.date && f.date.endsWith(currentYear)).length + 1;
  const formattedScreeningLabel = `${currentYear} — Séance #${yearlyScreeningNumber}`;

  const expectations = [
    { label: "Sceptique", color: "bg-white/40", hex: "rgba(255,255,255,0.4)" },
    { label: "Curieux", color: "bg-blue-400", hex: "#60A5FA" },
    { label: "Intrigué", color: "bg-purple-400", hex: "#C084FC" },
    { label: "Très impatient", color: "bg-orange-400", hex: "#FB923C" },
    { label: "Hype absolue", color: "bg-[#E8B200]", hex: "#E8B200" }
  ];

  // Force le chargement et le décodage de l'image pour iOS
  useEffect(() => {
    if (!pendingFilm?.affiche) return;
    const img = new Image();
    img.crossOrigin = "Anonymous";
    // Cache buster pour éviter les erreurs CORS de Vercel
    img.src = pendingFilm.affiche + "?t=" + new Date().getTime();
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      setPoster64(canvas.toDataURL('image/jpeg', 0.9));
    };
  }, [pendingFilm]);

  useEffect(() => {
    const updateScale = () => { if (wrapperRef.current) setScale(wrapperRef.current.offsetWidth / 1080); };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const downloadStory = async () => {
    if (isDownloading || !storyRef.current) return;
    setIsDownloading(true);
    
    try {
      // html-to-image config spécifique iOS
      const dataUrl = await htmlToImage.toPng(storyRef.current, {
        width: 1080,
        height: 1920,
        style: { transform: 'none', transformOrigin: 'top left' },
        cacheBust: true,
        backgroundColor: '#000000'
      });

      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `seance_${yearlyScreeningNumber}.png`, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Ma prochaine séance' });
      } else {
        const link = document.createElement('a');
        link.download = `story_seance.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error(err);
      alert("Erreur. Réessaie une fois l'affiche chargée.");
    }
    setIsDownloading(false);
  };

  return (
    <div className="animate-in fade-in pb-24 flex flex-col min-h-screen bg-[#0C0C0E] overflow-x-hidden">
      <header className="z-40 sticky top-0 w-full bg-[#0C0C0E]/90 backdrop-blur-xl border-b border-white/10 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 px-6 flex justify-between items-center text-white">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center"><svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg></button>
        <h2 className="font-syne font-black text-lg">Story Séance</h2>
        <div className="w-10" />
      </header>

      <div className="px-6 py-6 flex flex-col gap-8">
        {/* PREVIEW */}
        <div className="w-full relative bg-white/5 rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl" ref={wrapperRef} style={{ aspectRatio: '9/16' }}>
          <div ref={storyRef} className="absolute top-0 left-0 origin-top-left overflow-hidden bg-black font-sans" style={{ width: '1080px', height: '1920px', transform: `scale(${scale})` }}>
            {poster64 ? (
              <>
                <img src={poster64} className="absolute inset-0 w-full h-full object-cover opacity-40 blur-3xl scale-150" alt="" />
                <img src={poster64} className="absolute inset-0 w-full h-full object-cover opacity-90" alt="" />
              </>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#7E0000] to-[#2A0000]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

            <div className="absolute inset-0 p-16 flex flex-col justify-between z-10 text-white">
              <div className="mt-12 self-start bg-[#1C1C1E]/90 border border-white/20 px-8 py-5 rounded-full font-bold text-3xl uppercase tracking-widest">{formattedScreeningLabel}</div>
              <div className="flex flex-col gap-10 mb-12">
                <h1 className="font-syne font-black text-[100px] leading-[0.95] drop-shadow-2xl">{title || "Titre du film"}</h1>
                <div className="flex flex-wrap gap-4">
                  {[
                    { icon: <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />, text: date },
                    { icon: <circle cx="12" cy="12" r="10" />, text: time.replace(':', 'h') },
                    { icon: <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />, text: lang, color: 'text-[var(--color-primary)]' }
                  ].map((b, i) => (
                    <div key={i} className={`bg-[#1C1C1E]/95 border border-white/20 px-8 h-[85px] rounded-[100px] flex items-center gap-5 ${b.color || ''}`}>
                      <svg className="w-10 h-10 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{b.icon}</svg>
                      <span className="font-sans font-bold text-[42px] leading-none">{b.text}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-black/50 backdrop-blur-xl border border-white/20 rounded-[3rem] p-10 mt-6">
                  <div className="flex justify-between items-end mb-8">
                    <div><p className="text-white/60 text-xl font-bold uppercase tracking-widest mb-2">Hype Meter</p><p className="text-white text-5xl font-black italic">{expectations[expectation].label}</p></div>
                    <div className="text-white/20 font-black text-7xl italic leading-none">{expectation + 1}/5</div>
                  </div>
                  <div className="flex gap-3 w-full h-5">
                    {expectations.map((exp, i) => (
                      <div key={i} className={`flex-1 rounded-full transition-all duration-500 ${i <= expectation ? `${exp.color} shadow-[0_0_15px_${exp.hex}]` : 'bg-white/10'}`} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* EDITOR */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col gap-5 text-white">
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre" className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 font-bold outline-none" />
          <div className="grid grid-cols-2 gap-4">
            <input type="text" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-center" />
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-center" />
          </div>
          <div className="flex gap-2 bg-black/40 border border-white/10 rounded-2xl p-4">
            {expectations.map((exp, i) => (
              <button key={i} onClick={() => setExpectation(i)} className={`flex-1 h-8 rounded-full transition-all ${i <= expectation ? exp.color : 'bg-white/10'}`} />
            ))}
          </div>
        </div>

        <button onClick={downloadStory} disabled={isDownloading || !title} className="w-full h-16 rounded-2xl bg-[var(--color-primary)] text-black font-syne font-black text-lg flex items-center justify-center gap-3 active:scale-95 transition-all">
          {isDownloading ? <div className="w-6 h-6 border-2 border-black border-t-transparent animate-spin rounded-full" /> : "Partager la Story"}
        </button>
      </div>
    </div>
  );
}

// ── 4. Outil Récap Mensuel (Inchangé) ───────────────────────────────────────────
function RecapTool({ historyData = [], onBack }) {
  return (
    <div className="animate-in fade-in pb-24 flex flex-col min-h-screen bg-[#0C0C0E]">
      <header className="z-40 sticky top-0 w-full bg-[#0C0C0E]/90 backdrop-blur-xl border-b border-white/10 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 px-6 flex justify-between items-center text-white">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center"><svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg></button>
        <h2 className="font-syne font-black text-lg">Récap Mensuel</h2>
        <div className="w-10" />
      </header>
      <div className="p-6 text-center text-white/50"><p>Bientôt disponible...</p></div>
    </div>
  );
}

// ── 5. Composant principal Studio ───────────────────────────────────────────────
export function Studio({ historyData, pendingFilm, isScrolled }) {
  const [isUnlocked, setIsUnlocked] = useState(localStorage.getItem('grandecran_studio_unlocked') === 'true');
  const [activeTool, setActiveTool] = useState(null);
  if (!isUnlocked) return <LockScreen onUnlock={() => { setIsUnlocked(true); localStorage.setItem('grandecran_studio_unlocked', 'true'); }} />;
  if (activeTool === 'recap') return <RecapTool historyData={historyData} onBack={() => setActiveTool(null)} />;
  if (activeTool === 'seance') return <SeanceStoryTool historyData={historyData} pendingFilm={pendingFilm} onBack={() => setActiveTool(null)} />;
  return <StudioHub isScrolled={isScrolled} onSelectTool={setActiveTool} onLock={() => { setIsUnlocked(false); localStorage.removeItem('grandecran_studio_unlocked'); }} />;
}