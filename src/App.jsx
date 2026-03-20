import { useGoogleLogin } from '@react-oauth/google';
import { useState, useEffect } from 'react';
import { 
  getFilmsANoter, 
  saveFilmToSheet, 
  getProchainNumeroSeance, 
  getStats, 
  getFullHistory, 
  getMissingPosterFromTMDB,
  savePreferencesToSheet,
  getPreferencesFromSheet
} from './api';
import Notation from './pages/Notation';
import { LineChart, Line, ComposedChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PolarGrid, PolarAngleAxis, RadarChart, Radar } from 'recharts';

// --- DICTIONNAIRE DES THÈMES ---
const THEME_COLORS = {
  'dark-grey': {
    bg: '#08090F',
    bgGradient: 'linear-gradient(160deg, #08090F 0%, #0D0E18 100%)',
    surfaceOverlay: 'rgba(0,0,0,0.65)',
    text: '#FFFFFF',
    textOnAccent: '#08090F',
    primary: '#D4AF37',
    primaryHover: '#F5CC2A',
    primaryMuted: 'rgba(212,175,55,0.12)',
  },
  'velvet-red': {
    bg: '#7A0A0A',
    bgGradient: 'linear-gradient(135deg, #7A0A0A 0%, #520606 100%)',
    surfaceOverlay: 'rgba(0,0,0,0.70)',
    text: '#FFFFFF',
    textOnAccent: '#1A0000',
    primary: '#FFD700',
    primaryHover: '#FFE44D',
    primaryMuted: 'rgba(255,215,0,0.15)',
  },
  'pine-green': {
    bg: '#0A4D3C',
    bgGradient: 'linear-gradient(135deg, #0A4D3C 0%, #063227 100%)',
    surfaceOverlay: 'rgba(0,0,0,0.65)',
    text: '#FFFFFF',
    textOnAccent: '#021A13',
    primary: '#A8E063',
    primaryHover: '#BFEE80',
    primaryMuted: 'rgba(168,224,99,0.15)',
  },
  'coffee-cream': {
    bg: '#382618',
    bgGradient: 'linear-gradient(135deg, #382618 0%, #4E3218 100%)',
    surfaceOverlay: 'rgba(20,10,5,0.70)',
    text: '#FAEDCD',
    textOnAccent: '#2C1A0E',
    primary: '#CF9060',
    primaryHover: '#E0A878',
    primaryMuted: 'rgba(207,144,96,0.18)',
  },
  'pearl-white': {
    bg: '#FAF8F3',
    bgGradient: 'linear-gradient(135deg, #FFFFFF 0%, #EDE8DC 100%)',
    surfaceOverlay: 'rgba(0,0,0,0.50)',
    text: '#1C1C1E',
    textOnAccent: '#FFFFFF',
    primary: '#A07800',
    primaryHover: '#8A6600',
    primaryMuted: 'rgba(160,120,0,0.12)',
  },
  'ocean-blue': {
    bg: '#0A2463',
    bgGradient: 'linear-gradient(135deg, #0A2463 0%, #0D3B7A 50%, #1E5B8E 100%)',
    surfaceOverlay: 'rgba(0,10,40,0.70)',
    text: '#FFFFFF',
    textOnAccent: '#000D2E',
    primary: '#4FC3F7',
    primaryHover: '#81D4FA',
    primaryMuted: 'rgba(79,195,247,0.15)',
  },
  'rose-quartz': {
    bg: '#4A1040',
    bgGradient: 'linear-gradient(135deg, #4A1040 0%, #7B2560 100%)',
    surfaceOverlay: 'rgba(0,0,0,0.65)',
    text: '#FFFFFF',
    textOnAccent: '#2A0018',
    primary: '#F9A8D4',
    primaryHover: '#FBC8E4',
    primaryMuted: 'rgba(249,168,212,0.15)',
  },
  'golden-age': {
    bg: '#FCFAF5',
    bgGradient: 'linear-gradient(135deg, #FFF8E7 0%, #F0E4CC 100%)',
    surfaceOverlay: 'rgba(252,250,245,0.85)',
    text: '#4A3B22',
    textOnAccent: '#2C1A00',
    primary: '#B8830A',
    primaryHover: '#9A6E08',
    primaryMuted: 'rgba(184,131,10,0.14)',
  },
  'pride': {
    bg: '#1A1A2E',
    bgGradient: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)',
    surfaceOverlay: 'rgba(0,0,0,0.68)',
    text: '#FFFFFF',
    textOnAccent: '#1A1A2E',
    primary: '#B794F4',
    primaryHover: '#C9A8FF',
    primaryMuted: 'rgba(183,148,244,0.15)',
  },
};

const GENRE_COLORS = {
  "Action": "bg-red-500/10 border-red-500/40 text-red-400",
  "Thriller": "bg-orange-600/10 border-orange-600/40 text-orange-400",
  "Policier": "bg-orange-900/20 border-orange-800/50 text-orange-200",
  "Comédie noire": "bg-zinc-800/40 border-zinc-600/50 text-zinc-300",
  "Comédie": "bg-yellow-400/10 border-yellow-400/40 text-yellow-300",
  "Romance": "bg-rose-400/10 border-rose-400/40 text-rose-300",
  "Animation": "bg-pink-500/10 border-pink-500/40 text-pink-300",
  "Musical": "bg-fuchsia-500/10 border-fuchsia-500/40 text-fuchsia-300",
  "Drame": "bg-blue-500/10 border-blue-500/40 text-blue-300",
  "Société": "bg-cyan-500/10 border-cyan-500/40 text-cyan-300",
  "Historique": "bg-amber-800/10 border-amber-700/40 text-amber-200",
  "Biopic": "bg-indigo-400/10 border-indigo-400/40 text-indigo-300",
  "Aventure": "bg-emerald-500/10 border-emerald-500/40 text-emerald-300",
  "Science fiction": "bg-purple-500/10 border-purple-500/40 text-purple-300",
  "Fantastique": "bg-violet-600/10 border-violet-500/40 text-violet-300",
  "Satire": "bg-lime-400/10 border-lime-400/40 text-lime-300",
  "Documentaire": "bg-teal-500/10 border-teal-500/40 text-teal-300",
  "default": "bg-white/5 border-white/20 text-white/70"
};

const AVATAR_PRESETS = [
  'https://i.imgur.com/54i18a4.png', 'https://i.imgur.com/wh92836.png',
  'https://i.imgur.com/0OmLvJA.png', 'https://i.imgur.com/6GdXcue.png',
  'https://i.imgur.com/gtbDH4p.png', 'https://i.imgur.com/0m6rNRf.png',
  'https://i.imgur.com/NWaeMDI.png', 'https://i.imgur.com/PYzEx97.png',
  'https://i.imgur.com/V5RJuqj.png', 'https://i.imgur.com/884g6CY.png',
  'https://i.imgur.com/cNIOilm.png', 'https://i.imgur.com/xEJPFzP.png',
  'https://i.imgur.com/SRm2Lvv.png'
];

const SmartPoster = ({ afficheInitiale, titre, className = "w-20 h-full" }) => {
  const [posterUrl, setPosterUrl] = useState(null);
  useEffect(() => {
    const hasValidUrl = typeof afficheInitiale === 'string' && afficheInitiale.startsWith('http');
    if (hasValidUrl) {
      setPosterUrl(afficheInitiale);
    } else if (titre) {
      getMissingPosterFromTMDB(titre).then((url) => { if (url) setPosterUrl(url); });
    }
  }, [afficheInitiale, titre]);
  return (
    <div className={`${className} bg-white/10 flex-shrink-0 relative overflow-hidden`}>
      {posterUrl ? (
        <img src={posterUrl} alt={titre} className="w-full h-full object-cover animate-in fade-in duration-500" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-2xl opacity-50">🎬</div>
      )}
    </div>
  );
};

// ==========================================
// COMPOSANT STUDIO (Générateur Instagram)
// ==========================================
const RW_ARCHETYPES = {
  'Drame':     { high:{name:'Le\nSensible',  desc:'Tu cherches à être touché, bousculé. Le cinéma est un miroir dans lequel tu t\'autorises à regarder.'}, mid: {name:'Le\nLucide',    desc:'Tu acceptes que l\'émotion soit rare. Quand elle est là, elle compte.'}, low: {name:'Le\nSceptique', desc:'Beaucoup de drames, peu de conviction. Peut-être que le mois prochain sera différent.'} },
  'Thriller':  { high:{name:'Le\nTendu',     desc:'Tu aimes les films qui ne te lâchent pas. La tension comme langage cinématographique.'}, mid: {name:'L\'Enquêteur', desc:'Tu analyses, tu décortiques. Le thriller est un puzzle que tu résous.'}, low: {name:'Le\nDéçu',     desc:'Beaucoup de promesses, peu de résolutions. Le genre t\'a laissé sur ta faim.'} },
  'Biopic':    { high:{name:'Le\nCurieux',   desc:'Les vies des autres te fascinent. Tu sors de chaque film avec de nouvelles questions.'}, mid: {name:'L\'Historien', desc:'Entre le réel et la mise en scène, tu navigues avec un regard averti.'}, low: {name:'Le\nRéviseur', desc:'Tu connais trop bien les histoires pour te laisser convaincre facilement.'} },
  'Horreur':   { high:{name:'Le\nCourageux', desc:'Tu affrontes tes peurs les yeux grands ouverts — et tu en ressors grandi.'}, mid: {name:'L\'Amateur',  desc:'Le genre t\'attire sans toujours te convaincre. La peur, ça se mérite.'}, low: {name:'Le\nRésistant',desc:'Ni convaincu, ni effrayé. Le genre a encore du travail pour t\'avoir.'} },
  'Animation': { high:{name:'Le\nRêveur',   desc:'Tu crois que les images animées parlent aux adultes autant qu\'aux enfants. Tu as raison.'}, mid: {name:'L\'Ouvert',   desc:'Tu ne t\'interdis rien. L\'animation est un langage comme un autre.'}, low: {name:'L\'Exigeant', desc:'Pour toi, l\'animation doit justifier son format. Pas toujours évident.'} },
  'Comédie':   { high:{name:'Le\nJoyeux',   desc:'Tu sors léger, tu rigoles fort. Le cinéma n\'a pas toujours besoin d\'être sérieux.'}, mid: {name:'Le\nMitigé',  desc:'Tu souris, parfois tu ris. Mais tu es venu pour plus que ça.'}, low: {name:'Le\nDifficile',desc:'Peu de choses te font rire au cinéma. Tu as des exigences.'} },
  'Action':    { high:{name:'L\'Aventurier',desc:'Tu aimes que ça bouge. L\'adrénaline sur grand écran est ton carburant.'}, mid: {name:'Le\nSélectif',desc:'Pas toute l\'action — la bonne action. Celle qui raconte quelque chose.'}, low: {name:'Le\nDépassé', desc:'L\'action ne t\'a pas conquis ce mois-ci. Tu méritais mieux.'} },
  'default':   { high:{name:'L\'Éclectique',desc:'Aucun genre ne te définit. Tu vas là où le cinéma t\'emmène.'}, mid: {name:'Le\nVoyageur',desc:'Tu explores sans carte. Chaque film est un territoire nouveau.'}, low: {name:'Le\nChercheur',desc:'Tu tâtonnes, tu essaies. La perle rare se mérite.'} }
};

const Studio = ({ historyData, ratingScale, userName, isScrolled }) => {
  const [isUnlocked, setIsUnlocked] = useState(localStorage.getItem('grandecran_studio_unlocked') === 'true');
  const [password, setPassword] = useState('');
  const [activeTool, setActiveTool] = useState(null); // 'recap', 'story', 'review', 'festival'
  const [selectedMonth, setSelectedMonth] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  const STUDIO_PASSWORD = "POPCORN"; // <-- Change le mot de passe ici

  // --- 1. ECRAN DE VERROUILLAGE ---
  if (!isUnlocked) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-white/5 rounded-full border border-white/10 flex items-center justify-center mb-6 shadow-2xl">
          <svg className="w-8 h-8 text-[var(--color-primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
        </div>
        <h2 className="font-syne font-black text-3xl mb-2 text-white">Zone Sécurisée</h2>
        <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-8 text-center">Réservé aux créateurs de contenu</p>
        <form onSubmit={(e) => { e.preventDefault(); if(password.toUpperCase() === STUDIO_PASSWORD) { setIsUnlocked(true); localStorage.setItem('grandecran_studio_unlocked', 'true'); } else { alert("Mot de passe incorrect"); setPassword(''); } }} className="flex flex-col gap-4 w-full max-w-xs">
          <input type="password" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} className="bg-black/40 border border-white/10 rounded-2xl p-4 text-center font-bold tracking-widest outline-none focus:border-[var(--color-primary)] transition-colors text-white" />
          <button type="submit" className="bg-[var(--color-primary)] text-black font-black uppercase tracking-widest py-4 rounded-2xl active:scale-95 transition-transform">Déverrouiller</button>
        </form>
      </div>
    );
  }

  // --- 2. LE HUB DU STUDIO ---
  if (!activeTool) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
        <header className={`z-40 sticky top-0 w-full transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] bg-[var(--color-bg)]/80 backdrop-blur-2xl border-b ${isScrolled ? 'pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-3 border-white/10 shadow-lg' : 'pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-5 border-transparent shadow-none'}`}>
          <div className="px-6 flex justify-between items-center">
            <div className="flex flex-col">
              <p className={`font-bold uppercase tracking-widest text-[var(--color-primary)] transition-all duration-500 origin-left ${isScrolled ? 'opacity-0 h-0 overflow-hidden mb-0 text-[0px]' : 'opacity-100 h-3 text-[10px] mb-1'}`}>Générateur</p>
              <h1 className={`font-syne font-black text-white leading-none transition-all duration-500 origin-left ${isScrolled ? 'text-2xl' : 'text-4xl'}`}>Studio</h1>
            </div>
            <button onClick={() => { setIsUnlocked(false); localStorage.removeItem('grandecran_studio_unlocked'); }} className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20 active:scale-90 transition-all"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg></button>
          </div>
        </header>

        <main className="px-6 pt-6 space-y-4">
          <div onClick={() => setActiveTool('recap')} className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-3xl p-6 relative overflow-hidden cursor-pointer active:scale-[0.98] transition-all group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><svg className="w-24 h-24 text-[var(--color-primary)]" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 9h-2V7h-2v5H6v2h2v5h2v-5h2v-2z"/></svg></div>
            <span className="bg-[var(--color-primary-muted)] text-[var(--color-primary)] text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-[var(--color-primary)]/20 mb-4 inline-block">Post 4:5</span>
            <h3 className="font-syne font-black text-2xl text-white mb-2">Récap' Mensuel</h3>
            <p className="text-xs text-white/50 font-medium">Génère un carrousel de 6 slides avec tes statistiques et coups de cœur du mois.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/5 rounded-3xl p-5 relative overflow-hidden grayscale opacity-50 cursor-not-allowed">
              <span className="bg-white/10 text-white/50 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full mb-3 inline-block">Story 9:16</span>
              <h3 className="font-syne font-black text-lg text-white mb-1">Séance</h3>
              <p className="text-[10px] text-white/40">Bientôt</p>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-3xl p-5 relative overflow-hidden grayscale opacity-50 cursor-not-allowed">
              <span className="bg-white/10 text-white/50 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full mb-3 inline-block">Post 4:5</span>
              <h3 className="font-syne font-black text-lg text-white mb-1">Critique</h3>
              <p className="text-[10px] text-white/40">Bientôt</p>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-3xl p-5 relative overflow-hidden grayscale opacity-50 cursor-not-allowed col-span-2">
              <span className="bg-white/10 text-white/50 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full mb-3 inline-block">Post 4:5</span>
              <h3 className="font-syne font-black text-lg text-white mb-1">Saison des Festivals</h3>
              <p className="text-[10px] text-white/40">Bientôt</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // --- 3. L'OUTIL RECAP MENSUEL ---
  if (activeTool === 'recap') {
    // 3A. Extraire les mois dispo
    const availableMonthsRaw = [...new Set(historyData.map(f => {
      const parts = f.date?.split('/');
      return parts?.length === 3 ? `${parts[2]}-${parts[1]}` : null;
    }).filter(Boolean))].sort((a, b) => b.localeCompare(a)); 

    // Sécurité : on s'assure d'avoir une valeur par défaut vide si aucun historique
    const activeMonth = selectedMonth || availableMonthsRaw[0] || "";

    // 3B. Filtrer les data du mois sélectionné (avec vérification)
    const monthData = activeMonth 
      ? historyData.filter(f => f.date && f.date.endsWith(`${activeMonth.split('-')[1]}/${activeMonth.split('-')[0]}`))
      : [];
    
    // 3C. Calculs des métriques
    const totalFilms = monthData.length;
    const notes = monthData.map(f => parseFloat(String(f.note).replace(',', '.'))).filter(n => !isNaN(n) && n > 0);
    const avgNote = notes.length > 0 ? (notes.reduce((a, b) => a + b, 0) / notes.length) : 0;
    const highStarCount = notes.filter(n => n >= 4).length;
    
    const durations = monthData.map(f => {
      if (!f.duree) return 110;
      const str = String(f.duree).toLowerCase().replace(/\s/g, ''); 
      if (str.includes('h')) return (parseInt(str.split('h')[0], 10) * 60) + (parseInt(str.split('h')[1], 10) || 0);
      return parseInt(str, 10) || 110;
    });
    const avgDuration = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;

    const genreCounts = {}; monthData.forEach(f => { if(f.genre) genreCounts[f.genre] = (genreCounts[f.genre] || 0) + 1; });
    const topGenres = Object.entries(genreCounts).sort((a,b) => b[1] - a[1]);
    const maxGenreCount = topGenres.length ? topGenres[0][1] : 1;

    const langCounts = {}; monthData.forEach(f => { const l = (f.langue||'VF').toUpperCase().trim(); langCounts[l] = (langCounts[l] || 0) + 1; });
    const topLangs = Object.entries(langCounts).sort((a,b) => b[1] - a[1]);

    const seatCounts = {}; const roomCounts = {};
    monthData.forEach(f => {
      const s = String(f.siege || '').trim().toUpperCase(); const r = String(f.salle || '').trim();
      if (s && s !== '?') seatCounts[s] = (seatCounts[s] || 0) + 1;
      if (r && r !== '?') roomCounts[r] = (roomCounts[r] || 0) + 1;
    });
    const favSeat = Object.entries(seatCounts).sort((a,b) => b[1] - a[1])[0];
    const favRoom = Object.entries(roomCounts).sort((a,b) => b[1] - a[1])[0];

    const capuCount = monthData.filter(f => f.capucine).length;
    
    const sortedByNote = [...monthData].filter(f => f.note).sort((a, b) => parseFloat(String(b.note).replace(',','.')) - parseFloat(String(a.note).replace(',','.')));
    const bestMovie = sortedByNote[0];
    const worstMovie = sortedByNote[sortedByNote.length - 1];

    const arch = RW_ARCHETYPES[topGenres[0]?.[0]] || RW_ARCHETYPES['default'];
    const ratio = scale => scale > 0 ? avgNote / scale : 0;
    const bucket = ratio(ratingScale) >= 0.72 ? 'high' : ratio(ratingScale) >= 0.48 ? 'mid' : 'low';
    const activeArch = arch[bucket];

    const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
    const monthLabel = activeMonth ? `${monthNames[parseInt(activeMonth.split('-')[1], 10)-1]} ${activeMonth.split('-')[0]}` : '';

    const slideTitles = [
      { title: `En ${monthLabel}`, desc: `Mes films vus et notés` },
      { title: 'Les films du mois', desc: `${totalFilms} films vus` },
      { title: 'Les stats', desc: 'Les chiffres marquants' },
      { title: 'Mes genres', desc: 'Ce que j\'ai préféré' },
      { title: 'Top & Flop', desc: 'Le meilleur et le pire' },
      { title: 'Mon profil ciné', desc: 'Mon archétype du mois' }
    ];

    const downloadSlide = async () => {
      if (isDownloading) return;
      setIsDownloading(true);
      try {
        if (!window.html2canvas) {
          await new Promise((res, rej) => {
            const s = document.createElement('script');
            s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
            s.onload = res; s.onerror = rej; document.head.appendChild(s);
          });
        }
        const slideEl = document.getElementById(`rw-slide-${currentSlide + 1}`);
        const canvas = await window.html2canvas(slideEl, { scale: 3, useCORS: true, backgroundColor: null, logging: false });
        const link = document.createElement('a');
        link.download = `recap_${activeMonth}_slide${currentSlide + 1}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch (err) {
        console.error(err);
        alert("Erreur lors de la génération de l'image. Essaie de recharger la page.");
      }
      setIsDownloading(false);
    };

    return (
      <div className="animate-in fade-in duration-500 pb-24 flex flex-col min-h-screen relative bg-[#0C0C0E]">
        {/* CORRECTION : Utilisation de dangerouslySetInnerHTML au lieu de SetContent */}
        <style dangerouslySetInnerHTML={{__html: `
          .rw-post-card { background: #fff; border-radius: 18px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.5); width: 100%; max-width: 400px; margin: 0 auto; }
          .rw-carousel-wrapper { position: relative; overflow: hidden; width: 100%; aspect-ratio: 4/5; }
          .rw-slide-track { display: flex; width: 600%; height: 100%; transition: transform 0.4s cubic-bezier(0.4,0,0.2,1); }
          .rw-slide { width: calc(100% / 6); height: 100%; flex-shrink: 0; position: relative; box-sizing: border-box; overflow: hidden; }
          .rw-slide::before { content: ''; position: absolute; inset: 0; z-index: 50; pointer-events: none; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); background-size: 160px 160px; }
          #rw-slide-1::before, #rw-slide-4::before, #rw-slide-5::before, #rw-slide-6::before { opacity: 0.05; mix-blend-mode: overlay; }
          #rw-slide-2::before, #rw-slide-3::before { opacity: 0.05; mix-blend-mode: multiply; }
          #rw-slide-1, #rw-slide-6, #rw-slide-4, #rw-slide-5 { background: #0A0A0A; }
          #rw-slide-2, #rw-slide-3 { background: #F5F2EC; }
          .rw-pill-dark { display: inline-flex; align-items: center; gap: 7px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.18); border-radius: 40px; padding: 7px 14px 7px 10px; white-space: nowrap; backdrop-filter: blur(4px); }
          .rw-pill-light { display: inline-flex; align-items: center; gap: 7px; background: rgba(255,255,255,0.72); border: 1px solid rgba(30,30,30,0.14); border-radius: 40px; padding: 7px 14px 7px 10px; white-space: nowrap; backdrop-filter: blur(4px); box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
          .rw-top-row { position: absolute; top: 0; left: 0; right: 0; height: 60px; display: flex; align-items: center; justify-content: space-between; padding: 0 16px; z-index: 10; }
          .rw-logo { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
          .rw-glow-a { position: absolute; bottom: -80px; left: -60px; width: 300px; height: 300px; border-radius: 50%; background: radial-gradient(circle, rgba(232,178,0,0.07) 0%, transparent 65%); z-index: 1; }
          .rw-s1-title-main { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 25px; line-height: 1; color: #E8B200; text-transform: uppercase; }
          .rw-s1-number { font-family: 'Syne', sans-serif; font-weight: 800; font-size: clamp(80px, 22vw, 150px); line-height: 0.88; color: #fff; letter-spacing: -3px; display: flex; align-items: baseline; }
        `}} />

        {/* CHROME STUDIO: Header */}
        <header className="z-40 sticky top-0 w-full bg-[#0C0C0E]/90 backdrop-blur-xl border-b border-white/10 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 px-6 flex justify-between items-center">
          <button onClick={() => setActiveTool(null)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white active:scale-90 transition-all"><svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg></button>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold text-[var(--color-primary)] uppercase tracking-widest">Éditeur 4:5</span>
            <h2 className="font-syne font-black text-white text-lg">Récap Mensuel</h2>
          </div>
          <div className="w-10"></div>
        </header>

        {/* CHROME STUDIO: Selector & Controls */}
        <div className="px-6 py-5 flex flex-col gap-5">
          {/* SÉLECTEUR DE MOIS FLUIDE */}
          <div className="flex overflow-x-auto gap-3 scrollbar-hide snap-x">
            {availableMonthsRaw.map(m => {
              const label = `${monthNames[parseInt(m.split('-')[1], 10)-1].substring(0,3)} ${m.split('-')[0].substring(2)}`;
              const isActive = m === activeMonth;
              return (
                <button key={m} onClick={() => setSelectedMonth(m)} className={`snap-start flex-shrink-0 w-[4.5rem] h-[3.5rem] rounded-2xl border flex flex-col items-center justify-center transition-all ${isActive ? 'bg-[var(--color-primary-muted)] border-[var(--color-primary)] shadow-[0_0_15px_var(--color-primary-muted)]' : 'bg-white/5 border-white/10 opacity-60'}`}>
                  <span className={`text-xs font-bold uppercase ${isActive ? 'text-[var(--color-primary)]' : 'text-white'}`}>{label.split(' ')[0]}</span>
                  <span className={`text-[10px] font-bold ${isActive ? 'text-[var(--color-primary)]/70' : 'text-white/40'}`}>{label.split(' ')[1]}</span>
                </button>
              );
            })}
          </div>

          {/* STEPPER */}
          <div className="flex items-center gap-1.5 px-2">
            {[0,1,2,3,4,5].map(i => (
              <div key={i} onClick={() => setCurrentSlide(i)} className={`h-1.5 flex-1 rounded-full cursor-pointer transition-all ${i === currentSlide ? 'bg-[var(--color-primary)] scale-y-150' : i < currentSlide ? 'bg-[var(--color-primary)]/40' : 'bg-white/10'}`}></div>
            ))}
          </div>

          {/* LABEL DYNAMIQUE DU SLIDE */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-syne font-bold text-white text-sm">{slideTitles[currentSlide].title}</span>
              <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest">{slideTitles[currentSlide].desc}</span>
            </div>
            <span className="text-[10px] font-black text-[var(--color-primary)] bg-[var(--color-primary-muted)] px-3 py-1 rounded-full border border-[var(--color-primary)]/20">{currentSlide + 1} / 6</span>
          </div>
        </div>

        {/* STAGE: LE CARROUSEL DES SLIDES */}
        {totalFilms > 0 ? (
          <div className="px-6 mb-6">
            <div className="rw-post-card relative shadow-[0_10px_40px_rgba(0,0,0,0.8)] border border-white/10">
              {/* Flèches de navigation */}
              {currentSlide > 0 && <button onClick={() => setCurrentSlide(s => s-1)} className="absolute left-2 top-1/2 -translate-y-1/2 z-50 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white flex items-center justify-center shadow-lg"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg></button>}
              {currentSlide < 5 && <button onClick={() => setCurrentSlide(s => s+1)} className="absolute right-2 top-1/2 -translate-y-1/2 z-50 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white flex items-center justify-center shadow-lg"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg></button>}

              <div className="rw-carousel-wrapper">
                <div className="rw-slide-track" style={{ transform: `translateX(-${currentSlide * (100/6)}%)` }}>
                  
                  {/* SLIDE 1: INTRO */}
                  <div className="rw-slide" id="rw-slide-1">
                    <div className="rw-glow-a"></div><div className="rw-glow-b" style={{ position: 'absolute', top: '-60px', right: '20px', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.018) 0%, transparent 70%)'}}></div>
                    <div className="absolute top-[25px] left-[16px] z-30">
                      <span className="rw-s1-title-main">Mon récap'</span>
                      <span className="block font-sans font-light text-[10px] text-white/25 tracking-[0.15em] uppercase mt-[3px]">ciné du mois</span>
                    </div>
                    <img className="rw-logo" src={userAvatar} alt="" style={{position:'absolute',top:'14px',right:'14px',zIndex:30}} crossOrigin="anonymous" />
                    <div className="absolute top-[160px] left-[12px] right-0 flex flex-col justify-end px-[20px] pb-[16px] z-10">
                      <div className="rw-s1-number">
                        {Math.floor(avgDuration * totalFilms / 60)}
                        <span className="text-[clamp(28px,9vw,44px)] font-normal tracking-[-1px] text-[#E8B200] ml-1 flex-shrink-0">h</span>
                      </div>
                      <div className="font-sans font-normal text-xs text-white/40 tracking-[0.01em] mt-1.5 leading-snug">
                        dans le noir en <strong className="text-white/70 font-semibold">{monthLabel}</strong>
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-[22px] p-[10px_20px_14px] z-20 border-t border-white/5">
                      <div className="font-sans font-medium text-[11px] text-white/35 tracking-[0.12em] uppercase">{monthLabel}</div>
                    </div>
                  </div>

                  {/* SLIDE 2: COLLAGE FILMS */}
                  <div className="rw-slide" id="rw-slide-2">
                    <div className="absolute inset-0 flex flex-row gap-[3px] z-1 overflow-hidden right-0 -top-[50px] -left-[50px] w-[125%] rotate-[12deg]">
                      {[0,1,2,3,4,5,6,7].map(col => (
                        <div key={col} className={`flex-1 flex flex-col gap-[3px] min-w-0 ${col%2!==0?'pt-0':col%3===0?'pt-[12px]':'pt-[24px]'}`}>
                          {[0,1,2,3,4,5,6].map(row => {
                            const f = monthData[(col*7 + row) % monthData.length];
                            return (
                              <div key={row} className="flex-shrink-0 w-full aspect-[2/3] bg-[#ddd] overflow-hidden relative rounded-[8px]">
                                {f?.affiche && <img src={f.affiche} className="w-full h-full object-cover object-top block saturate-[0.65] brightness-90" crossOrigin="anonymous" />}
                                {f?.capucine && <img src="https://i.imgur.com/lg1bkrO.png" className="absolute top-[3px] right-[3px] w-[14px] h-[14px] rounded-full bg-white p-[1.5px] object-contain z-10 shadow-md" crossOrigin="anonymous"/>}
                              </div>
                            )
                          })}
                        </div>
                      ))}
                    </div>
                    <div className="absolute inset-0 right-0 z-2 bottom-[-2px]" style={{ background: 'linear-gradient(180deg, rgba(245,242,236,0.08) 0%, rgba(245,242,236,0.02) 25%, rgba(245,242,236,0.18) 45%, rgba(245,242,236,0.78) 62%, rgba(245,242,236,0.97) 78%, rgba(245,242,236,1.00) 88%)'}}></div>
                    <div className="absolute inset-0 right-[22px] z-10 flex flex-col justify-between px-[16px] pb-[18px]">
                      <div className="rw-top-row">
                        <div className="rw-pill-light"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg><span>{monthLabel}</span></div>
                        <img className="rw-logo" src={userAvatar} alt="" crossOrigin="anonymous" />
                      </div>
                      <div>
                        <div className="font-syne font-extrabold text-[42px] leading-[0.92] text-[#1E1E1E] tracking-[-2px] mb-[7px]">
                          {totalFilms} films<br/><span className="text-[#c49a10]">ce mois</span>
                        </div>
                        <div className="flex flex-wrap gap-[6px] mt-[10px]">
                          {monthData.slice(0, 5).map((f, i) => (
                            <div key={i} className={`inline-flex items-center gap-[5px] bg-[#1E1E1E]/80 border border-[#1E1E1E]/10 rounded-[20px] px-[8px] py-[3px] font-sans text-[8px] font-medium text-white/90 whitespace-nowrap max-w-[250px] overflow-hidden text-ellipsis ${f.coupDeCoeur ? 'bg-[#b41e3c]/75' : ''} ${f.capucine ? 'border-[#8b1a3a]/35' : ''}`}>
                              {f.capucine && <span className="w-[10px] h-[10px] rounded-full bg-[url('https://i.imgur.com/lg1bkrO.png')] bg-center bg-cover flex-shrink-0"></span>}
                              {f.titre}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SLIDE 3: STATS */}
                  <div className="rw-slide" id="rw-slide-3">
                    <div className="rw-top-row">
                      <div className="rw-pill-light"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg><span>{monthLabel}</span></div>
                      <img className="rw-logo" src={userAvatar} alt="" crossOrigin="anonymous" />
                    </div>
                    <div className="absolute top-[60px] bottom-0 left-0 right-[22px] flex flex-col px-[16px] pb-[14px] z-10 overflow-hidden">
                      <div className="flex-none flex items-start justify-between pt-[6px] border-b border-[#1E1E1E]/10 pb-[10px] mb-[10px]">
                        <div>
                          <div className="font-sans text-[8.5px] font-semibold text-[#1E1E1E]/35 tracking-[0.13em] uppercase mb-[3px]">Note moyenne</div>
                          <div className="font-syne font-extrabold text-[65px] leading-[0.88] text-[#1E1E1E] tracking-[-4px] flex items-baseline">{avgNote.toFixed(1)}<span className="text-[28px] font-normal tracking-[-0.5px] text-[#E8B200] ml-1">/ {ratingScale}</span></div>
                        </div>
                        {highStarCount > 0 && (
                          <div className="text-right">
                            <div className="font-syne font-extrabold text-[52px] leading-[0.92] text-[#1E1E1E]/10 tracking-[-2px]">{highStarCount}</div>
                            <div className="font-sans text-[8.5px] font-normal text-[#1E1E1E]/30 leading-[1.4] mt-[2px] text-right max-w-[70px]">notes sup. à 4</div>
                          </div>
                        )}
                      </div>
                      <div className="flex-none border-b border-[#1E1E1E]/10 pb-[10px] mb-[10px]">
                        <div className="font-sans text-[8.5px] font-semibold text-[#1E1E1E]/35 tracking-[0.13em] uppercase mb-[3px]">Durée moyenne</div>
                        <div className="font-syne font-extrabold text-[72px] leading-[0.88] text-[#1E1E1E] tracking-[-3px] flex items-baseline">{Math.floor(avgDuration/60)}h{String(avgDuration%60).padStart(2,'0')}</div>
                      </div>
                      <div className="flex-none flex items-start justify-between border-b border-[#1E1E1E]/10 pb-[10px] mb-[10px]">
                        <div>
                          <div className="font-sans text-[8.5px] font-semibold text-[#1E1E1E]/35 tracking-[0.13em] uppercase mb-[3px]">Siège favori</div>
                          <div className="font-syne font-extrabold text-[28px] leading-none text-[#1E1E1E] tracking-[-1px]">{favSeat ? favSeat[0] : '—'}</div>
                          <div className="font-sans text-[9.5px] font-normal text-[#1E1E1E]/40 mt-[2px]">{favSeat ? `${Math.round((favSeat[1]/totalFilms)*100)}% des séances` : ''}</div>
                        </div>
                        {favRoom && (
                          <div className="border-l border-[#1E1E1E]/10 pl-[14px]">
                            <div className="font-sans text-[8.5px] font-semibold text-[#1E1E1E]/35 tracking-[0.13em] uppercase mb-[3px]">Salle favorite</div>
                            <div className="font-syne font-extrabold text-[28px] leading-none text-[#1E1E1E] tracking-[-1px]">{favRoom[0]}</div>
                            <div className="font-sans text-[9.5px] font-normal text-[#1E1E1E]/40 mt-[2px]">{Math.round((favRoom[1]/totalFilms)*100)}% des séances</div>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 flex items-center min-h-0">
                        {capuCount > 0 && (
                          <div className="flex items-center gap-[7px] bg-[#fdf0f3] border border-[#8B1A3A]/10 rounded-[12px] px-[11px] py-[7px]">
                            <img src="https://i.imgur.com/lg1bkrO.png" className="w-[20px] h-[20px] object-contain rounded-full" crossOrigin="anonymous"/>
                            <div>
                              <div className="font-syne font-extrabold text-[16px] leading-none text-[#8B1A3A] tracking-[-0.5px]">{capuCount}</div>
                              <div className="font-sans text-[7.5px] font-normal text-[#8B1A3A]/60 mt-[1px] leading-[1.3] max-w-[75px]">films en compétition</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* SLIDE 4: GENRES */}
                  <div className="rw-slide" id="rw-slide-4" style={{background: 'linear-gradient(180deg, #0D0D0D 0%, #111 100%)'}}>
                    <div className="absolute bottom-0 left-0 right-0 h-[18%] bg-[#F5F2EC] z-0"></div>
                    <div className="absolute inset-0 right-[22px] z-10 flex flex-col pt-[12px] px-[16px] pb-0">
                      <div className="rw-top-row !relative !p-0 mb-[8px] flex-shrink-0">
                        <div className="rw-pill-dark"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg><span>{monthLabel}</span></div>
                        <img className="rw-logo" src={userAvatar} alt="" crossOrigin="anonymous" />
                      </div>
                      <div className="flex-shrink-0 mb-[12px]">
                        <div className="font-sans text-[8.5px] font-semibold tracking-[0.14em] uppercase mb-[5px] text-white/30">Ce que j'ai regardé</div>
                        <div className="font-syne font-extrabold leading-[0.94] text-white text-[clamp(24px,7vw,34px)] tracking-[-0.5px]">Mes genres<br/><span className="text-[#E8B200]">du mois</span></div>
                      </div>
                      <div className="flex flex-col gap-[10px] flex-1 min-h-0 justify-start">
                        {topGenres.slice(0,5).map(([g, c], i) => {
                          const pct = Math.round((c/maxGenreCount)*100);
                          const rowStyles = [
                            { size: '15px', th: '16px', fill: 'linear-gradient(90deg, #c49a10, #FFD341)', txt: '#fff' },
                            { size: '13px', th: '13px', fill: 'linear-gradient(90deg, #383838, #555)', txt: 'rgba(255,255,255,0.82)' },
                            { size: '12px', th: '11px', fill: 'linear-gradient(90deg, #7E0000, #b03010)', txt: 'rgba(255,255,255,0.68)' },
                            { size: '11px', th: '9px', fill: 'rgba(255,255,255,0.18)', txt: 'rgba(255,255,255,0.48)' },
                            { size: '10px', th: '7px', fill: 'rgba(255,255,255,0.1)', txt: 'rgba(255,255,255,0.32)' },
                          ][i] || { size: '10px', th: '7px', fill: 'rgba(255,255,255,0.1)', txt: 'rgba(255,255,255,0.32)' };
                          const medal = ['🥇','🥈','🥉','',''][i];

                          return (
                            <div key={g} className="flex flex-col gap-[5px]">
                              <div className="flex items-baseline justify-between">
                                <div className="flex items-center gap-[7px]">
                                  {medal && <span className="text-[12px] leading-none flex-shrink-0">{medal}</span>}
                                  <span className="font-syne font-bold tracking-[-0.3px]" style={{fontSize: rowStyles.size, color: rowStyles.txt}}>{g}</span>
                                </div>
                                <span className="font-sans text-[9px] font-semibold tracking-[0.04em] text-white/35">{c} film{c>1?'s':''}</span>
                              </div>
                              <div className="w-full rounded-[3px] overflow-hidden bg-white/5" style={{height: rowStyles.th}}>
                                <div className="h-full rounded-[3px]" style={{width: `${pct}%`, background: rowStyles.fill}}></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="h-[18%] flex-shrink-0 flex items-center pb-[6px] gap-0 overflow-hidden">
                        <div className="font-sans text-[8px] font-semibold text-[#1E1E1E]/35 tracking-[0.13em] uppercase mr-[12px] flex-shrink-0">Langues :</div>
                        <div className="flex items-center flex-1 min-w-0 flex-nowrap overflow-hidden">
                          {topLangs.slice(0,4).map(([l, c], i) => (
                            <div key={l} className={`flex items-baseline gap-[3px] px-[8px] flex-shrink-0 ${i!==0 ? 'border-l border-[#1E1E1E]/10' : 'pl-0'}`}>
                              <span className={`font-syne font-extrabold text-[16px] leading-none tracking-[-0.5px] ${i===0 ? 'text-[#c49a10]' : 'text-[#1E1E1E]'}`}>{Math.round((c/totalFilms)*100)}%</span>
                              <span className="font-sans text-[8px] font-semibold text-[#1E1E1E]/35 tracking-[0.13em] uppercase mr-[12px] flex-shrink-0">{l}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SLIDE 5: TOP/FLOP */}
                  <div className="rw-slide" id="rw-slide-5">
                    <div className="absolute left-0 right-0 w-full h-[50%] overflow-hidden top-0">
                      {bestMovie?.affiche && <div className="absolute inset-0 bg-cover bg-center z-0 saturate-80 brightness-[0.55]" style={{backgroundImage: `url(${bestMovie.affiche})`}}></div>}
                      <div className="absolute inset-0 z-1" style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.05) 30%, rgba(0,0,0,0.55) 70%, rgba(0,0,0,0.82) 100%)'}}></div>
                      <div className="absolute inset-0 z-10 flex flex-col justify-end p-[10px_16px_12px]">
                        <div className="font-sans text-[8px] font-bold tracking-[0.16em] uppercase mb-[5px] flex items-center gap-[6px] text-white/50"><div className="w-[18px] h-[2px] bg-[#E8B200] rounded-[2px] flex-shrink-0"></div>Coup de cœur</div>
                        <div className="font-syne font-extrabold text-[21px] leading-[1.05] tracking-[-0.5px] mb-[6px] line-clamp-2 text-white">{bestMovie ? bestMovie.titre : '—'}</div>
                        <div className="flex items-center gap-[3px] text-[#E8B200]">
                          <span className="text-xs font-black mr-1">{bestMovie?.note}</span><svg className="w-[13px] h-[13px] fill-current" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                        </div>
                      </div>
                    </div>
                    <div className="absolute top-[50%] left-0 right-0 h-[1px] z-20 bg-white/10"></div>
                    <div className="absolute left-0 right-0 w-full h-[50%] overflow-hidden bottom-0">
                      {worstMovie?.affiche && <div className="absolute inset-0 bg-cover bg-center z-0 brightness-[0.75] saturate-50 sepia-[0.15]" style={{backgroundImage: `url(${worstMovie.affiche})`}}></div>}
                      <div className="absolute inset-0 z-1 bottom-[-2px]" style={{background: 'linear-gradient(180deg, rgba(245,242,236,0.2) 0%, rgba(245,242,236,0.05) 25%, rgba(245,242,236,0.65) 65%, rgba(245,242,236,0.92) 100%)'}}></div>
                      <div className="absolute inset-0 z-10 flex flex-col justify-end p-[10px_16px_12px]">
                        <div className="font-sans text-[8px] font-bold tracking-[0.16em] uppercase mb-[5px] flex items-center gap-[6px] text-[#1E1E1E]/45"><div className="w-[18px] h-[2px] bg-[#1E1E1E]/30 rounded-[2px] flex-shrink-0"></div>À oublier</div>
                        <div className="font-syne font-extrabold text-[21px] leading-[1.05] tracking-[-0.5px] mb-[6px] line-clamp-2 text-[#1E1E1E]">{worstMovie ? worstMovie.titre : '—'}</div>
                        <div className="flex items-center gap-[3px] text-[#1E1E1E]/40">
                          <span className="text-xs font-black mr-1">{worstMovie?.note}</span><svg className="w-[13px] h-[13px] fill-current" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                        </div>
                      </div>
                    </div>
                    <div className="absolute top-0 left-0 right-0 h-[58px] flex items-center justify-between px-[16px] z-30">
                      <div className="rw-pill-dark !bg-black/35 !border-white/10"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg><span>{monthLabel}</span></div>
                      <img className="rw-logo" src={userAvatar} alt="" crossOrigin="anonymous" />
                    </div>
                  </div>

                  {/* SLIDE 6: ARCHETYPE */}
                  <div className="rw-slide" id="rw-slide-6">
                    <div className="rw-glow-a"></div><div className="rw-glow-b" style={{ position: 'absolute', top: '-60px', right: '20px', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.018) 0%, transparent 70%)'}}></div>
                    <div className="rw-top-row">
                      <div className="rw-pill-dark"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg><span>{monthLabel}</span></div>
                      <img className="rw-logo" src={userAvatar} alt="" crossOrigin="anonymous" />
                    </div>
                    <div className="absolute top-[64px] left-[14px] right-[14px] border border-white/10 rounded-[14px] p-[16px_16px_14px] z-10 flex flex-col overflow-hidden">
                      <div className="flex items-center justify-between mb-[12px]">
                        <span className="font-sans text-[8px] font-bold text-white/20 tracking-[0.18em] uppercase">Profil ciné du mois</span>
                        <span className="font-sans text-[8px] font-medium text-white/15 tracking-[0.1em]">— {activeMonth.split('-')[1]} / {activeMonth.split('-')[0]}</span>
                      </div>
                      <div className="font-sans text-[8px] font-semibold text-white/25 tracking-[0.14em] uppercase mb-[3px]">Archétype du mois</div>
                      <div className="font-syne font-extrabold text-[clamp(32px,10vw,48px)] leading-[0.92] text-white tracking-[-2px] mb-[7px] break-words whitespace-pre-line">
                        {activeArch.name.split('\n')[0]}<br/><span className="text-[#E8B200]">{activeArch.name.split('\n')[1]}</span>
                      </div>
                      <div className="font-sans text-[9.5px] font-light text-white/35 leading-[1.5]">{activeArch.desc}</div>
                      <div className="w-full h-[1px] bg-white/5 my-[12px]"></div>
                      <div className="grid grid-cols-2 gap-y-[12px] gap-x-[10px]">
                        <div>
                          <div className="font-sans text-[7.5px] font-semibold text-white/20 tracking-[0.14em] uppercase mb-[2px]">Genre dominant</div>
                          <div className="font-syne font-bold text-[18px] leading-none text-white tracking-[-0.6px]"><span className="text-[13px] tracking-[-0.3px]">{topGenres[0]?.[0] || '—'}</span></div>
                        </div>
                        <div>
                          <div className="font-sans text-[7.5px] font-semibold text-white/20 tracking-[0.14em] uppercase mb-[2px]">Note moyenne</div>
                          <div className="font-syne font-bold text-[18px] leading-none text-white tracking-[-0.6px] flex items-baseline">{avgNote.toFixed(1)}<span className="text-[11px] font-normal text-[#E8B200] ml-[2px]">/ {ratingScale}</span></div>
                        </div>
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-[22px] p-[10px_16px_14px] z-10 border-t border-white/5">
                      <div className="font-syne font-semibold text-[10.5px] text-white/30 tracking-[-0.2px] leading-[1.5]">
                        Rendez-vous <strong>le mois prochain</strong><br/>pour découvrir mon prochain profil
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* BOUTON TÉLÉCHARGER */}
            <div className="mt-8 flex justify-center px-6">
              <button 
                onClick={downloadSlide}
                disabled={isDownloading}
                className="w-full max-w-sm h-14 rounded-2xl bg-[var(--color-primary)] text-black font-syne font-black text-sm tracking-wide flex items-center justify-center gap-3 shadow-[0_4px_20px_var(--color-primary-muted)] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
              >
                {isDownloading ? (
                  <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.25"></circle><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path></svg>
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                )}
                {isDownloading ? 'Génération...' : 'Télécharger cette slide'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center pt-20 px-6 opacity-50">
            <svg className="w-16 h-16 text-white mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2M9 9h.01M15 9h.01"/></svg>
            <p className="text-center text-sm font-bold text-white">Aucun film trouvé pour ce mois.</p>
          </div>
        )}
      </div>
    );
  }

  return null;
};

function App() {
  const [currentThemeKey, setCurrentThemeKey] = useState(localStorage.getItem('grandecran_theme') || 'dark-grey');
  const [userAvatar, setUserAvatar] = useState(localStorage.getItem('grandecran_avatar') || AVATAR_PRESETS[0]);
  const [userName, setUserName] = useState(localStorage.getItem('grandecran_username') || 'Cinéphile');
  const [ratingScale, setRatingScale] = useState(Number(localStorage.getItem('grandecran_rating_scale')) || 5);
  
  const [pricing, setPricing] = useState(() => {
    const saved = localStorage.getItem('grandecran_pricing');
    return saved ? JSON.parse(saved) : { default: { sub: 21.90, ticket: 13.00 } };
  });
  const [pricingYearEditor, setPricingYearEditor] = useState('default');
  const [showDetailedLang, setShowDetailedLang] = useState(false);
  const [dashView, setDashView] = useState('all');
  const [dashValue, setDashValue] = useState('');
  const theme = THEME_COLORS[currentThemeKey] || THEME_COLORS['dark-grey'];
  const [showStreakDetails, setShowStreakDetails] = useState(false);

  // --- MODIFICATION : GESTION INTELLIGENTE DU TOKEN (1 HEURE) ---
  const [userToken, setUserToken] = useState(() => {
    const token = localStorage.getItem('google_token');
    const expiry = localStorage.getItem('google_token_expiry');
    if (token && expiry && Date.now() < parseInt(expiry, 10)) {
      return token;
    }
    return null;
  });

  const [spreadsheetId, setSpreadsheetId] = useState(localStorage.getItem('grandecran_db_id') || "");
  const [films, setFilms] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isExitingNotation, setIsExitingNotation] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [stats, setStats] = useState({ totalFilms: "--", coupsDeCoeur: "--" });
  const [historyData, setHistoryData] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState('newest');
  const [selectedFilm, setSelectedFilm] = useState(null); 
  const [displayCount, setDisplayCount] = useState(15); 

  useEffect(() => {
    const syncCloudPrefs = async () => {
      if (userToken && spreadsheetId) {
        const cloud = await getPreferencesFromSheet(userToken, spreadsheetId);
        if (cloud) {
          if (cloud.userName) setUserName(cloud.userName);
          if (cloud.userAvatar) setUserAvatar(cloud.userAvatar);
          if (cloud.themeKey) setCurrentThemeKey(cloud.themeKey);
          if (cloud.ratingScale) setRatingScale(cloud.ratingScale);
          if (cloud.pricing) setPricing(cloud.pricing);

          localStorage.setItem('grandecran_username', cloud.userName || userName);
          localStorage.setItem('grandecran_avatar', cloud.userAvatar || userAvatar);
          localStorage.setItem('grandecran_theme', cloud.themeKey || currentThemeKey);
          localStorage.setItem('grandecran_rating_scale', cloud.ratingScale || ratingScale);
          localStorage.setItem('grandecran_pricing', JSON.stringify(cloud.pricing || pricing));
        }
      }
    };
    syncCloudPrefs();
  }, [userToken, spreadsheetId]);

  const triggerCloudSave = (overrides = {}) => {
    if (!userToken || !spreadsheetId) return;
    savePreferencesToSheet(userToken, spreadsheetId, {
      userName: overrides.userName || userName,
      userAvatar: overrides.userAvatar || userAvatar,
      themeKey: overrides.themeKey || currentThemeKey,
      ratingScale: overrides.ratingScale || ratingScale,
      pricing: overrides.pricing || pricing
    });
  };

  const login = useGoogleLogin({
    onSuccess: async (codeResponse) => {
      const token = codeResponse.access_token;
      setUserToken(token);
      localStorage.setItem('google_token', token);
      
      // --- MODIFICATION : Expiration à 55 minutes (3300s) ---
      localStorage.setItem('google_token_expiry', (Date.now() + 3300 * 1000).toString());

      try {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.given_name && !localStorage.getItem('grandecran_username')) {
          setUserName(data.given_name);
          localStorage.setItem('grandecran_username', data.given_name);
        }
      } catch (err) { console.error(err); }
      if (spreadsheetId) handleScan(token);
    },
    scope: "https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/userinfo.profile",
  });

  const handleScan = async (token) => {
    setIsSearching(true);
    try {
      const found = await getFilmsANoter(token);
      setFilms(found);
    } catch (err) {
      // --- MODIFICATION : Expulse proprement en cas d'erreur de Token ---
      setUserToken(null);
      localStorage.removeItem('google_token');
      localStorage.removeItem('google_token_expiry');
    }
    setIsSearching(false);
  };

  useEffect(() => {
    if (userToken && spreadsheetId && films.length === 0 && !isSearching) {
      handleScan(userToken);
    }
  }, [userToken, spreadsheetId]);

  useEffect(() => {
    if (userToken && spreadsheetId && activeTab === 'home') {
      getStats(userToken, spreadsheetId).then(setStats);
    }
  }, [userToken, spreadsheetId, activeTab]);

  useEffect(() => {
    if (userToken && spreadsheetId && historyData.length === 0 && !isLoadingHistory) {
      setIsLoadingHistory(true);
      getFullHistory(userToken, spreadsheetId).then(data => {
        setHistoryData(data);
        setIsLoadingHistory(false);
      });
    }
  }, [userToken, spreadsheetId, historyData.length]);

  const logout = () => {
    localStorage.removeItem('google_token');
    localStorage.removeItem('google_token_expiry');
    setUserToken(null);
    setFilms([]);
  };

  const anneesDisponibles = [...new Set(historyData.map(f => {
    const parts = f.date?.split('/');
    return parts?.length === 3 ? parts[2] : null;
  }).filter(Boolean))].sort((a, b) => b - a);

  let filteredHistory = historyData.filter(film => {
    let categoryMatch = true;
    if (activeFilter === 'coeur') categoryMatch = film.coupDeCoeur;
    else if (activeFilter === 'capucine') categoryMatch = film.capucine;
    else if (activeFilter === 'top') categoryMatch = Number(film.note) >= (ratingScale === 5 ? 4 : 8);
    else if (anneesDisponibles.includes(activeFilter)) categoryMatch = film.date?.endsWith(activeFilter);
    let searchMatch = !searchQuery || film.titre.toLowerCase().includes(searchQuery.toLowerCase());
    return categoryMatch && searchMatch;
  });

  filteredHistory.sort((a, b) => {
    const getTime = (d) => {
      const p = d?.split('/');
      return p?.length === 3 ? new Date(p[2], p[1]-1, p[0]).getTime() : 0;
    };
    return sortOrder === 'oldest' ? getTime(a.date) - getTime(b.date) : getTime(b.date) - getTime(a.date);
  });

  // --- MODIFICATION : ECRAN WELCOME BACK FLUIDE ---
  if (!userToken) {
    const isReturning = !!localStorage.getItem('grandecran_username');
    const savedName = localStorage.getItem('grandecran_username') || 'Cinéphile';

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center relative overflow-hidden" style={{ background: theme.bgGradient, color: theme.text }}>
        {/* Déco d'arrière-plan */}
        <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-center">
          <svg className="w-[150%] h-[150%] text-white animate-[spin_120s_linear_infinite]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5"><circle cx="12" cy="12" r="10"/><path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07L19.07 4.93"/></svg>
        </div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-24 h-24 mb-6 rounded-full bg-white/5 border-2 flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.1)]" style={{ borderColor: theme.primary }}>
            <span className="text-4xl">🍿</span>
          </div>
          <h1 className="text-5xl font-black mb-2 tracking-tighter italic uppercase">Grand Écran</h1>
          
          {isReturning ? (
            <>
              <p className="text-white/60 mb-10 font-bold leading-relaxed">
                Heureux de te revoir, <span className="text-white">{savedName}</span> !<br/>
                <span className="text-[10px] uppercase tracking-widest" style={{ color: theme.primary }}>Session expirée par sécurité (1h)</span>
              </p>
              <button onClick={() => login()} className="font-black py-4 px-8 rounded-full active:scale-95 transition-all flex items-center gap-3 shadow-[0_0_20px_var(--color-primary-muted)]" style={{ background: theme.primary, color: theme.textOnAccent }}>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/></svg>
                RECONNEXION RAPIDE
              </button>
            </>
          ) : (
            <>
              <p className="text-white/60 mb-10 font-bold">Ton journal de bord cinématographique personnel.</p>
              <button onClick={() => login()} className="font-black py-4 px-10 rounded-full active:scale-95 transition-all shadow-[0_0_20px_var(--color-primary-muted)]" style={{ background: theme.primary, color: theme.textOnAccent }}>
                CONNEXION GOOGLE
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  if (!spreadsheetId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center" style={{ background: theme.bgGradient, color: theme.text }}>
        <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-4">Configuration</h2>
        <form onSubmit={(e) => { 
          e.preventDefault(); 
          const id = e.target.sheetId.value; 
          setSpreadsheetId(id); 
          localStorage.setItem('grandecran_db_id', id); 
          handleScan(userToken);
        }} className="w-full max-w-sm flex flex-col gap-4">
          <input name="sheetId" type="text" placeholder="ID du Spreadsheet" required className="bg-white/10 border border-white/20 p-4 rounded-2xl outline-none text-center" />
          <button type="submit" className="font-black py-4 rounded-2xl uppercase tracking-widest" style={{ background: theme.primary, color: theme.textOnAccent }}>Enregistrer l'ID</button>
        </form>
      </div>
    );
  }

  if (isSearching) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: theme.bgGradient, color: theme.text }}>
        <div className="relative mb-8">
          <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ background: theme.primary }}></div>
          <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center relative z-10" style={{ color: theme.primary, boxShadow: `0 0 30px ${theme.primary}40` }}>
            <svg className="w-8 h-8 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242M12 12v9M8 17l4 4 4-4"></path></svg>
          </div>
        </div>
        <p className="font-syne text-xl font-bold mb-2">Recherche de billets</p>
        <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-10">Analyse de la boîte mail...</p>
      </div>
    );
  }

  const getPrice = (year, type) => {
    let p = pricing.default[type] || (type === 'sub' ? 21.90 : 13.00);
    if (pricing[year] && pricing[year][type] !== undefined) p = pricing[year][type];
    return parseFloat(p) || 0; 
  };

  const chartTooltipFormatter = (value, name) => {
    if (typeof value === 'number') {
      const rounded = Number.isInteger(value) ? value : Number(value.toFixed(1));
      if (name === 'Valeur Billets' || name === 'Coût Abo') {
        return [`${rounded}€`, name];
      }
      return [rounded, name];
    }
    return [value, name];
  };

  return (
    <div 
      className="h-[100dvh] w-full font-sans flex flex-col overflow-hidden transition-colors duration-500 relative"
      style={{ 
        background: theme.bgGradient, color: theme.text,
        '--color-primary': theme.primary, '--color-primary-muted': theme.primaryMuted,
        '--color-text-on-accent': theme.textOnAccent, '--color-bg': theme.bg
      }}
    >
      <div 
        id="main-scroll-container"
        className="flex-1 overflow-y-auto pb-[calc(env(safe-area-inset-bottom))] scrollbar-hide"
        onScroll={(e) => {
          const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
          setIsScrolled(scrollTop > 20);
          if (scrollHeight - scrollTop <= clientHeight + 150) setDisplayCount(prev => prev + 15);
        }}
      >
        {/* ONGLET 1 : DASHBOARD */}
        {activeTab === 'home' && (
          <div className="animate-in fade-in duration-500 pb-24 min-h-screen">
            
            {(() => {
              const availableYears = [...new Set(historyData.map(f => f.date?.split('/')[2]).filter(Boolean))].sort((a, b) => a - b);
              const availableMonthsRaw = [...new Set(historyData.map(f => {
                const parts = f.date?.split('/');
                return parts?.length === 3 ? `${parts[2]}-${parts[1]}` : null;
              }).filter(Boolean))].sort((a, b) => a.localeCompare(b)); 

              const options = dashView === 'year' ? availableYears : availableMonthsRaw;

              const dashData = historyData.filter(film => {
                if (!film.date) return false;
                if (dashView === 'year') return film.date.endsWith(dashValue);
                if (dashView === 'month') {
                  const [y, m] = dashValue.split('-');
                  if (!y || !m) return false;
                  return film.date.endsWith(`${m}/${y}`);
                }
                return true; 
              });

              const totalFilms = dashData.length;
              const notes = dashData.map(f => parseFloat(String(f.note).replace(',', '.'))).filter(n => !isNaN(n) && n > 0);
              const avgNote = notes.length > 0 ? (notes.reduce((a, b) => a + b, 0) / notes.length) : 0;
              
              const durations = dashData.map(f => {
                if (!f.duree) return 110;
                const str = String(f.duree).toLowerCase().replace(/\s/g, ''); 
                if (str.includes('h')) {
                  const parts = str.split('h');
                  return (parseInt(parts[0], 10) * 60) + (parseInt(parts[1], 10) || 0);
                }
                const fallback = parseInt(str, 10);
                return isNaN(fallback) ? 110 : fallback;
              });
              const totalMinutes = durations.reduce((a, b) => a + b, 0);
              const avgDuration = durations.length > 0 ? Math.round(totalMinutes / durations.length) : 0;

              const latestPoster = dashData.find(f => f.affiche)?.affiche || historyData.find(f => f.affiche)?.affiche;
              const genreCounts = {}; dashData.forEach(f => { if(f.genre) genreCounts[f.genre] = (genreCounts[f.genre] || 0) + 1; });
              const topGenres = Object.entries(genreCounts).sort((a,b) => b[1] - a[1]).slice(0, 4);
              const maxGenreCount = topGenres.length ? topGenres[0][1] : 1;

              // --- CALCULS FINANCIERS ---
              const now = new Date();
              const currentYear = now.getFullYear().toString();
              const currentMonthIndex = now.getMonth(); 

              const totalStandardValue = dashData.reduce((acc, film) => {
                const year = film.date?.split('/')[2] || currentYear;
                return acc + getPrice(year, 'ticket');
              }, 0);

              let totalSubCost = 0;
              const getMonthsToCharge = (y) => y === currentYear ? currentMonthIndex + 1 : 12;

              if (dashView === 'month') {
                const year = dashValue.split('-')[0];
                totalSubCost = getPrice(year, 'sub');
              } else if (dashView === 'year') {
                totalSubCost = getMonthsToCharge(dashValue) * getPrice(dashValue, 'sub');
              } else if (dashView === 'all') {
                availableYears.forEach(y => {
                  totalSubCost += getMonthsToCharge(y) * getPrice(y, 'sub');
                });
              }

              const savings = totalStandardValue - totalSubCost;
              const costPerFilm = totalFilms > 0 ? (totalSubCost / totalFilms) : 0;
              const isProfitable = savings >= 0;
              
              // --- CALCUL DU STREAK (GAMIFICATION & RECORDS) ---
              const getMondayDate = (d) => {
                const dObj = new Date(d);
                const day = dObj.getDay();
                const diff = dObj.getDate() - day + (day === 0 ? -6 : 1);
                dObj.setDate(diff);
                dObj.setHours(0, 0, 0, 0);
                return dObj.getTime();
              };

              const activeWeeks = new Set();
              historyData.forEach(film => {
                if (film.date) {
                  const [day, month, year] = film.date.split('/');
                  const dateObj = new Date(year, month - 1, day);
                  if (!isNaN(dateObj)) activeWeeks.add(getMondayDate(dateObj));
                }
              });

              const sortedWeeks = Array.from(activeWeeks).sort();
              const allStreaks = [];
              let tempStart = null, tempEnd = null, tempCount = 0;

              sortedWeeks.forEach(w => {
                if (tempCount === 0) {
                  tempStart = w; tempEnd = w; tempCount = 1;
                } else {
                  const diffDays = Math.round((w - tempEnd) / (1000 * 3600 * 24));
                  if (diffDays === 7) {
                    tempEnd = w; tempCount++;
                  } else {
                    allStreaks.push({ start: tempStart, end: tempEnd, count: tempCount });
                    tempStart = w; tempEnd = w; tempCount = 1;
                  }
                }
              });
              if (tempCount > 0) allStreaks.push({ start: tempStart, end: tempEnd, count: tempCount });

              const todayObj = new Date();
              const currentMondayTime = getMondayDate(todayObj);
              const lastMondayObj = new Date(currentMondayTime);
              lastMondayObj.setDate(lastMondayObj.getDate() - 7);
              const lastMondayTime = lastMondayObj.getTime();

              let currentStreakObj = null;
              let pastStreaks = [...allStreaks];

              if (allStreaks.length > 0) {
                const last = allStreaks[allStreaks.length - 1];
                if (last.end === currentMondayTime || last.end === lastMondayTime) {
                  currentStreakObj = last;
                  pastStreaks.pop(); 
                }
              }

              const streakCount = currentStreakObj ? currentStreakObj.count : 0;
              const streakAtRisk = currentStreakObj ? currentStreakObj.end === lastMondayTime : false;
              let daysLeftForStreak = 0;
              
              if (streakAtRisk) {
                const sundayObj = new Date(currentMondayTime);
                sundayObj.setDate(sundayObj.getDate() + 6);
                sundayObj.setHours(23, 59, 59, 999);
                daysLeftForStreak = Math.ceil((sundayObj.getTime() - todayObj.getTime()) / (1000 * 3600 * 24));
              }

              const lastExpiredStreak = pastStreaks.length > 0 ? pastStreaks[pastStreaks.length - 1] : null;
              const longestStreak = allStreaks.length > 0 ? allStreaks.reduce((prev, current) => (prev.count > current.count) ? prev : current) : null;

              const getExpirationLabel = (timestamp) => {
                if (!timestamp) return "";
                const d = new Date(timestamp);
                d.setDate(d.getDate() + 13); 
                return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
              };

              // --- CALCULS HABITUDES (SIÈGE, SALLE, PROFIL, LANGUES) ---
              const seatCounts = {};
              const roomCounts = {};
              const dayCounts = [0, 0, 0, 0, 0, 0, 0]; 
              const timeCounts = { 'Matin': 0, 'Après-midi': 0, 'Soirée': 0, 'Nuit': 0 };
              
              let vfCount = 0;
              let voCount = 0;
              const voDetails = {};

              dashData.forEach(f => {
                const siege = String(f.siege || '').trim().toUpperCase();
                const salle = String(f.salle || '').trim();
                if (siege && siege !== '?' && siege !== 'NON RENSEIGNÉ') seatCounts[siege] = (seatCounts[siege] || 0) + 1;
                if (salle && salle !== '?' && salle !== 'NON RENSEIGNÉE') roomCounts[salle] = (roomCounts[salle] || 0) + 1;

                if (f.date) {
                  const [d, m, y] = f.date.split('/');
                  const dateObj = new Date(y, m - 1, d);
                  if (!isNaN(dateObj)) dayCounts[dateObj.getDay()]++;
                }
                if (f.heure) {
                  const h = parseInt(f.heure.split(':')[0], 10);
                  if (!isNaN(h)) {
                    if (h < 12) timeCounts['Matin']++;
                    else if (h < 18) timeCounts['Après-midi']++;
                    else if (h < 22) timeCounts['Soirée']++;
                    else timeCounts['Nuit']++;
                  }
                }

                const l = (f.langue || 'VF').toUpperCase().trim();
                if (l === 'VF' || l === 'FRA' || l === 'VFQ') {
                  vfCount++;
                } else {
                  voCount++;
                  voDetails[l] = (voDetails[l] || 0) + 1;
                }
              });

              const favoriteSeat = Object.entries(seatCounts).sort((a,b) => b[1] - a[1])[0] || null; 
              const topRooms = Object.entries(roomCounts).sort((a,b) => b[1] - a[1]).slice(0, 3);
              const maxRoomCount = topRooms.length > 0 ? topRooms[0][1] : 1;

              const dayNames = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
              const favDayIndex = dayCounts.indexOf(Math.max(...dayCounts));
              const favDay = Math.max(...dayCounts) > 0 ? dayNames[favDayIndex] : "--";
              const favTime = Math.max(...Object.values(timeCounts)) > 0 ? Object.keys(timeCounts).reduce((a, b) => timeCounts[a] > timeCounts[b] ? a : b) : "--";

              const totalLang = vfCount + voCount;
              const voPct = totalLang > 0 ? Math.round((voCount / totalLang) * 100) : 0;
              const vfPct = totalLang > 0 ? 100 - voPct : 0;
              const topVoDetails = Object.entries(voDetails).sort((a,b) => b[1] - a[1]);

              // --- GRAPHIQUES ---
              let chartData = [];
              if (dashView === 'year' && dashValue) {
                const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
                const monthlyCounts = Array(12).fill(0);
                dashData.forEach(film => {
                  const month = parseInt(film.date?.split('/')[1], 10);
                  if (month >= 1 && month <= 12) monthlyCounts[month - 1]++;
                });

                let cumulativeSum = 0;
                chartData = monthlyCounts.map((count, index) => {
                  if (dashValue === currentYear && index > currentMonthIndex) return { name: monthNames[index] };
                  cumulativeSum += count;
                  return { name: monthNames[index], 'Films vus': count, 'Cumulé': cumulativeSum };
                });
              }

              let globalChartData = [];
              if (dashView === 'all' && availableYears.length > 0) {
                globalChartData = availableYears.map(year => {
                  const filmsOfYear = historyData.filter(f => f.date?.endsWith(year));
                  const count = filmsOfYear.length;
                  const yearNotes = filmsOfYear.map(f => parseFloat(String(f.note).replace(',', '.'))).filter(n => !isNaN(n) && n > 0);
                  const yearAvg = yearNotes.length > 0 ? (yearNotes.reduce((a, b) => a + b, 0) / yearNotes.length) : 0;
                  return { name: year, 'Films vus': count, 'Note moy.': parseFloat(yearAvg.toFixed(2)) };
                });
              }

              let monthlyGenreData = [];
              let dailyBreakEvenData = [];
              if (dashView === 'month' && dashData.length > 0) {
                const counts = {};
                dashData.forEach(f => { if(f.genre) counts[f.genre] = (counts[f.genre] || 0) + 1; });
                monthlyGenreData = Object.entries(counts).map(([name, value]) => ({ subject: name, A: value, fullMark: Math.max(...Object.values(counts)) + 1 }));

                const [y, m] = dashValue.split('-');
                const ticketP = getPrice(y, 'ticket');
                const subP = getPrice(y, 'sub');
                
                const daysInMonth = new Date(y, m, 0).getDate();
                let cumulatedVal = 0;
                
                dailyBreakEvenData = Array.from({length: daysInMonth}, (_, i) => {
                  const dayString = String(i+1).padStart(2, '0');
                  const dateStr = `${dayString}/${m}/${y}`;
                  const filmsThatDay = dashData.filter(f => f.date === dateStr).length;
                  cumulatedVal += filmsThatDay * ticketP;
                  
                  if (y === currentYear && (parseInt(m, 10) - 1) === currentMonthIndex && (i + 1) > now.getDate()) {
                    return { day: dayString };
                  }

                  return { day: dayString, 'Valeur Billets': cumulatedVal, 'Coût Abo': subP };
                });
              }

              const formatLabel = (val, view) => {
                if (!val) return '';
                if (view === 'year') return val;
                const [yy, mm] = val.split('-');
                const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
                return `${monthNames[parseInt(mm, 10)-1]} ${yy.slice(2)}`;
              };

              return (
                <>
                  <div className={`sticky top-0 z-40 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] overflow-hidden bg-[var(--color-bg)] w-full ${isScrolled ? 'pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-4' : 'pt-[calc(env(safe-area-inset-top)+1rem)] pb-6'}`}>
                    {latestPoster && (
                      <>
                        <div className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105" style={{backgroundImage: `url(${latestPoster})`}}></div>
                        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 60%, var(--color-bg) 95%, var(--color-bg) 100%)' }}></div>
                      </>
                    )}
                    
                    <header className={`relative z-10 flex justify-between items-center px-6 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${isScrolled ? 'mb-3' : 'mb-6'}`}>
                      <div className="flex flex-col drop-shadow-lg">
                        <span className={`font-bold uppercase tracking-widest text-[var(--color-primary)] transition-all duration-500 origin-left ${isScrolled ? 'opacity-0 h-0 overflow-hidden mb-0 text-[0px]' : 'opacity-100 h-3 text-[10px] mb-1'}`}>
                          Cinéphile
                        </span>
                        <h1 className={`font-syne font-black text-white leading-none transition-all duration-500 origin-left ${isScrolled ? 'text-2xl' : 'text-4xl'}`}>
                          {userName}
                        </h1>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <button onClick={() => handleScan(userToken)} className={`flex items-center justify-center rounded-full border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 text-[var(--color-primary)] active:scale-90 transition-all flex-shrink-0 shadow-lg ${isScrolled ? 'w-10 h-10' : 'w-12 h-12'}`}>
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242M12 12v9M8 17l4 4 4-4"></path></svg>
                        </button>
                        
                        <button onClick={() => setActiveTab('profile')} className={`rounded-full border-2 border-[var(--color-primary)] overflow-hidden shadow-[0_0_20px_var(--color-primary-muted)] active:scale-95 transition-all duration-500 bg-black flex-shrink-0 ${isScrolled ? 'w-10 h-10 border' : 'w-14 h-14'}`}>
                          <img src={userAvatar} alt="Profil" className="w-full h-full object-contain object-bottom scale-[1.15]" />
                        </button>
                      </div>
                    </header>

                    <div className="relative z-10 grid grid-cols-2 gap-3 px-6">
                      <div className={`bg-black/50 backdrop-blur-xl border border-white/10 rounded-3xl flex flex-col items-center justify-center shadow-lg transition-all duration-500 ${isScrolled ? 'h-16' : 'h-28'}`}>
                        <span className={`font-syne font-black text-white leading-none tracking-tight transition-all duration-500 ${isScrolled ? 'text-2xl' : 'text-5xl'}`}>{totalFilms}</span>
                        <span className={`font-bold text-white/60 transition-all duration-500 uppercase tracking-widest ${isScrolled ? 'text-[8px] mt-0.5' : 'text-[10px] mt-2'}`}>Total Films</span>
                      </div>
                      <div className={`bg-black/50 backdrop-blur-xl border border-white/10 rounded-3xl flex flex-col items-center justify-center shadow-lg transition-all duration-500 ${isScrolled ? 'h-16' : 'h-28'}`}>
                        <span className={`font-syne font-black text-[var(--color-primary)] leading-none tracking-tight transition-all duration-500 ${isScrolled ? 'text-2xl' : 'text-5xl'}`}>{avgNote > 0 ? avgNote.toFixed(1).replace('.', ',') : '--'}</span>
                        <span className={`font-bold text-white/60 transition-all duration-500 uppercase tracking-widest ${isScrolled ? 'text-[8px] mt-0.5' : 'text-[10px] mt-2'}`}>Note Moyenne</span>
                      </div>
                    </div>

                    <div className={`relative z-10 transition-all duration-500 overflow-hidden flex flex-col ${isScrolled ? 'max-h-0 opacity-0 mt-0' : 'max-h-40 opacity-100 mt-5'}`}>
                      <div className="px-6 mb-1">
                        <div className="bg-white/10 backdrop-blur-md rounded-full p-1 flex items-center justify-between">
                          <button onClick={() => { setDashView('all'); setDashValue(''); }} className={`flex-1 py-1.5 rounded-full text-[11px] font-bold transition-all ${dashView === 'all' ? 'bg-white/20 text-white shadow' : 'text-white/50'}`}>Global</button>
                          <button onClick={() => { setDashView('year'); setDashValue(availableYears[availableYears.length - 1] || ''); }} className={`flex-1 py-1.5 rounded-full text-[11px] font-bold transition-all ${dashView === 'year' ? 'bg-white/20 text-white shadow' : 'text-white/50'}`}>Annuel</button>
                          <button onClick={() => { setDashView('month'); setDashValue(availableMonthsRaw[availableMonthsRaw.length - 1] || ''); }} className={`flex-1 py-1.5 rounded-full text-[11px] font-bold transition-all ${dashView === 'month' ? 'bg-white/20 text-white shadow' : 'text-white/50'}`}>Mensuel</button>
                        </div>
                      </div>

                      {dashView !== 'all' && options.length > 0 && (
                        <div className="relative w-full flex items-center justify-center py-2 animate-in fade-in duration-300">
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-8 bg-white/5 rounded-full pointer-events-none border border-white/10 shadow-inner"></div>
                          <div 
                            key={dashView}
                            className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide items-center w-full px-[calc(50%-3rem)] relative z-10"
                            onScroll={(e) => {
                              const container = e.target;
                              const center = container.scrollLeft + container.clientWidth / 2;
                              let closest = null;
                              let minDiff = Infinity;
                              Array.from(container.children).forEach(child => {
                                const childCenter = child.offsetLeft + child.clientWidth / 2;
                                const diff = Math.abs(childCenter - center);
                                if (diff < minDiff) { minDiff = diff; closest = child.getAttribute('data-value'); }
                              });
                              if (closest && closest !== dashValue) setDashValue(closest);
                            }}
                            ref={(el) => {
                              if (el && !el.dataset.initialized) {
                                const activeChild = el.querySelector(`[data-value="${dashValue}"]`);
                                if (activeChild) el.scrollLeft = activeChild.offsetLeft - el.clientWidth / 2 + activeChild.clientWidth / 2;
                                el.dataset.initialized = 'true';
                              }
                            }}
                          >
                            {options.map(opt => (
                              <div key={opt} data-value={opt} onClick={(e) => {
                                  const container = e.target.closest('.overflow-x-auto');
                                  container.scrollTo({ left: e.currentTarget.offsetLeft - container.clientWidth / 2 + e.currentTarget.clientWidth / 2, behavior: 'smooth' });
                                }}
                                className="snap-center flex-shrink-0 w-24 flex items-center justify-center h-12 cursor-pointer"
                              >
                                <span className={`uppercase tracking-widest transition-all duration-300 ${dashValue === opt ? 'text-[12px] font-black text-[var(--color-primary)] drop-shadow-[0_0_8px_var(--color-primary-muted)] scale-110' : 'text-[10px] font-bold text-white/30 hover:text-white/50 scale-100'}`}>
                                  {formatLabel(opt, dashView)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <main className="px-6 pt-6 space-y-8">
                    {/* ZONE 1.5 : STREAK (GAMIFICATION & RECORDS) */}
                    {allStreaks.length > 0 && (
                      <div 
                        onClick={() => setShowStreakDetails(!showStreakDetails)}
                        className={`rounded-3xl p-4 sm:p-5 shadow-lg relative overflow-hidden transition-all duration-500 border cursor-pointer active:scale-[0.98] group ${
                          streakCount === 0 ? 'bg-white/5 border-white/10 grayscale-[0.5]' :
                          streakAtRisk ? 'bg-orange-500/10 border-orange-500/30' : 
                          'bg-gradient-to-r from-orange-500/20 to-rose-500/20 border-orange-500/30'
                        }`}
                      >
                        <svg className={`absolute -right-6 -bottom-6 w-32 h-32 pointer-events-none transition-opacity duration-1000 ${streakCount === 0 ? 'text-white/5' : streakAtRisk ? 'text-orange-500/10' : 'text-orange-500/20'}`} viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2.586A11.962 11.962 0 0 0 7.39 9.387c-.896 1.455-1.127 3.234-.593 4.86a6.386 6.386 0 0 1-1.399-5.187C3.593 11.164 2 13.914 2 16.5c0 5.523 4.477 10 10 10s10-4.477 10-10c0-2.73-1.637-5.568-3.66-7.553a6.435 6.435 0 0 1-1.42 5.093c.531-1.63-.585-3.567-2.146-4.577C13.565 8.683 12 5.86 12 2.586z"/>
                        </svg>
                        
                        <div className="flex justify-between items-center relative z-10 gap-2">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center shadow-inner ${streakCount === 0 ? 'bg-white/10 text-white/40' : streakAtRisk ? 'bg-orange-500/20 text-orange-400 animate-pulse' : 'bg-gradient-to-br from-orange-400 to-rose-500 text-white'}`}>
                              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 2.586A11.962 11.962 0 0 0 7.39 9.387c-.896 1.455-1.127 3.234-.593 4.86a6.386 6.386 0 0 1-1.399-5.187C3.593 11.164 2 13.914 2 16.5c0 5.523 4.477 10 10 10s10-4.477 10-10c0-2.73-1.637-5.568-3.66-7.553a6.435 6.435 0 0 1-1.42 5.093c.531-1.63-.585-3.567-2.146-4.577C13.565 8.683 12 5.86 12 2.586z"/></svg>
                            </div>
                            <div className="flex flex-col justify-center">
                              <div className="flex items-baseline gap-1.5">
                                <span className="font-syne font-black text-3xl text-white leading-none">{streakCount}</span>
                                <span className="text-[9px] font-bold uppercase tracking-widest text-white/70">Semaines</span>
                              </div>
                              <span className={`text-[9px] font-bold uppercase tracking-widest mt-1 ${streakCount === 0 ? 'text-white/40' : streakAtRisk ? 'text-orange-400' : 'text-orange-200'}`}>
                                {streakCount === 0 ? 'Série inactive' : streakAtRisk ? `Expire dans ${daysLeftForStreak} j.` : 'Série enflammée !'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="text-right flex-shrink-0 flex items-center gap-3">
                            {streakCount === 0 ? (
                              <span className="text-[10px] font-bold text-white/50 underline underline-offset-4 decoration-white/20">Relancer</span>
                            ) : streakAtRisk && (
                              <span className="bg-orange-500 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full animate-bounce shadow-[0_0_10px_rgba(249,115,22,0.5)] block text-center leading-tight">
                                Go au ciné !
                              </span>
                            )}
                            <svg className={`w-4 h-4 text-white/30 transition-transform duration-500 ${showStreakDetails ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                          </div>
                        </div>

                        <div className={`transition-all duration-500 overflow-hidden relative z-10 ${showStreakDetails ? 'max-h-40 opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0'}`}>
                          <div className="pt-4 border-t border-white/10 grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-[9px] uppercase font-bold tracking-widest text-white/50 mb-1">Dernière Série</p>
                              {lastExpiredStreak ? (
                                <>
                                  <div className="flex items-baseline gap-1">
                                    <p className="font-syne font-black text-lg text-white leading-none">{lastExpiredStreak.count}</p>
                                    <p className="text-[8px] font-bold uppercase tracking-widest text-white/60">Semaines</p>
                                  </div>
                                  <p className="text-[8px] font-bold uppercase tracking-widest text-white/40 mt-1">Fini le {getExpirationLabel(lastExpiredStreak.end)}</p>
                                </>
                              ) : (
                                <p className="text-[10px] font-bold text-white/30 italic py-1">Aucune</p>
                              )}
                            </div>
                            <div>
                              <p className="text-[9px] uppercase font-bold tracking-widest text-[var(--color-primary)]/80 mb-1">Record Absolu</p>
                              {longestStreak ? (
                                <>
                                  <div className="flex items-baseline gap-1">
                                    <p className="font-syne font-black text-lg text-[var(--color-primary)] drop-shadow-[0_0_8px_var(--color-primary-muted)] leading-none">{longestStreak.count}</p>
                                    <p className="text-[8px] font-bold uppercase tracking-widest text-[var(--color-primary)]/80">Semaines</p>
                                  </div>
                                  <p className="text-[8px] font-bold uppercase tracking-widest text-[var(--color-primary)]/60 mt-1">
                                    {longestStreak === currentStreakObj ? 'En cours 🔥' : `Fini le ${getExpirationLabel(longestStreak.end)}`}
                                  </p>
                                </>
                              ) : (
                                <p className="text-[10px] font-bold text-white/30 italic py-1">Aucun</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ZONE 2 : TEMPS PASSÉ */}
                    <div>
                      <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                        <h2 className="text-xs font-bold text-white uppercase tracking-widest">Temps Passé</h2>
                      </div>
                      <div className="flex items-start gap-8 bg-white/5 p-5 rounded-3xl border border-white/5 shadow-lg">
                        <div>
                          <p className="font-syne text-3xl font-black text-white leading-none tracking-tight uppercase">
                            {Math.floor(totalMinutes / 60)}H <span className="text-xl text-white/60">{String(totalMinutes % 60).padStart(2, '0')}M</span>
                          </p>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-primary)] mt-1.5">Devant l'écran</p>
                        </div>
                        <div>
                          <p className="font-syne text-xl font-black text-white leading-none tracking-tight uppercase mt-2">
                            {Math.floor(avgDuration / 60)}H <span className="text-sm text-white/60">{String(avgDuration % 60).padStart(2, '0')}M</span>
                          </p>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mt-1.5">Durée moyenne</p>
                        </div>
                      </div>
                    </div>

                    {/* ZONE BILAN FINANCIER */}
                    <div>
                      <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                        <h2 className="text-xs font-bold text-white uppercase tracking-widest">Rentabilité Abonnement</h2>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="bg-white/5 rounded-3xl p-4 border border-white/5 shadow-lg flex flex-col justify-center">
                          <span className="text-[9px] uppercase font-bold tracking-widest text-white/60 mb-2">Prix de Revient</span>
                          <span className="font-syne font-black text-2xl text-white leading-none">{costPerFilm.toFixed(2)}€</span>
                          <span className="text-[8px] uppercase tracking-widest mt-1 text-white/40">/ film vu</span>
                        </div>
                        <div className="bg-white/5 rounded-3xl p-4 border border-white/5 shadow-lg flex flex-col justify-center">
                          <span className="text-[9px] uppercase font-bold tracking-widest text-white/60 mb-2">Le Butin</span>
                          <span className={`font-syne font-black text-2xl leading-none ${isProfitable ? 'text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]' : 'text-rose-400'}`}>
                            {savings > 0 ? '+' : ''}{savings.toFixed(0)}€
                          </span>
                          <span className="text-[8px] uppercase tracking-widest mt-1 text-white/40">Économisés</span>
                        </div>
                      </div>

                      {dashView !== 'month' && (
                        <div className="bg-white/5 rounded-3xl p-5 border border-white/5 shadow-lg relative overflow-hidden">
                          <div className="flex justify-between items-end mb-2 relative z-10">
                            <span className="text-[10px] uppercase font-bold tracking-widest text-white/60">Objectif Rentabilité</span>
                            <span className="text-[10px] font-black text-white">{totalStandardValue > 0 ? Math.round((totalStandardValue / totalSubCost) * 100) : 0}%</span>
                          </div>
                          
                          <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden flex relative z-10 shadow-inner">
                            <div className="h-full bg-white/30 transition-all duration-1000" style={{ width: `${Math.min(100, (totalSubCost > 0 ? (totalSubCost / Math.max(totalStandardValue, totalSubCost)) * 100 : 0))}%` }}></div>
                            {isProfitable && (
                              <div className="h-full bg-[var(--color-primary)] shadow-[0_0_10px_var(--color-primary)] transition-all duration-1000" style={{ width: `${((totalStandardValue - totalSubCost) / totalStandardValue) * 100}%` }}></div>
                            )}
                          </div>
                          
                          <div className="flex justify-between mt-2 relative z-10">
                            <span className="text-[8px] font-bold text-white/40 uppercase">Abo: {totalSubCost.toFixed(0)}€</span>
                            <span className="text-[8px] font-bold text-white/40 uppercase">Valeur: {totalStandardValue.toFixed(0)}€</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* GRAPHIQUE BREAK-EVEN (Mensuel) */}
                    {dashView === 'month' && dailyBreakEvenData.length > 0 && (
                      <div className="animate-in fade-in duration-500">
                        <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                          <h2 className="text-xs font-bold text-white uppercase tracking-widest">Le Point d'Équilibre</h2>
                        </div>
                        <div className="bg-white/5 p-4 rounded-3xl border border-white/5 shadow-lg h-56">
                          <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={dailyBreakEvenData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }} interval="preserveStartEnd" minTickGap={20} />
                              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }} allowDecimals={false} />
                              <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px' }} itemStyle={{ color: 'white' }} labelStyle={{ display: 'none' }} formatter={chartTooltipFormatter} />
                              <Legend iconType="circle" wrapperStyle={{ fontSize: '9px', paddingTop: '10px', color: 'rgba(255,255,255,0.5)' }} />
                              
                              <Area type="stepAfter" dataKey="Valeur Billets" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.2} strokeWidth={2} animationDuration={1500} />
                              <Line type="monotone" dataKey="Coût Abo" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={false} animationDuration={1000} />
                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                    {/* HABITUDES SALLE, SIÈGE ET PROFIL DE SORTIE */}
                    {(favoriteSeat || topRooms.length > 0) && (
                      <div>
                        <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                          <h2 className="text-xs font-bold text-white uppercase tracking-widest">Habitudes</h2>
                        </div>
                        
                        {dashView !== 'month' && favDay !== '--' && (
                          <div className="bg-white/5 p-4 rounded-3xl border border-white/5 shadow-lg flex items-center justify-between mb-3 relative overflow-hidden">
                            <div className="flex flex-col z-10">
                              <span className="text-[9px] uppercase font-bold tracking-widest text-white/60 mb-1">Moment Préféré</span>
                              <span className="font-syne font-black text-xl text-white leading-tight capitalize">Le {favDay}</span>
                              <span className="text-[11px] font-bold text-[var(--color-primary)] uppercase tracking-widest">en {favTime}</span>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-black/40 flex items-center justify-center shadow-inner z-10 border border-white/5">
                              {favTime === 'Matin' && <svg className="w-6 h-6 text-yellow-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>}
                              {favTime === 'Après-midi' && <svg className="w-6 h-6 text-orange-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>}
                              {favTime === 'Soirée' && <svg className="w-6 h-6 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>}
                              {favTime === 'Nuit' && <svg className="w-6 h-6 text-cyan-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/><path d="M12 6v6l4 2"/></svg>}
                            </div>
                            <svg className="absolute -right-4 -bottom-4 w-24 h-24 text-[var(--color-primary)] opacity-[0.03] pointer-events-none" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white/5 p-4 rounded-3xl border border-white/5 shadow-lg flex flex-col justify-between relative overflow-hidden">
                            <svg className="absolute -right-4 -bottom-4 w-24 h-24 text-[var(--color-primary)] opacity-5 -rotate-12 pointer-events-none" viewBox="0 0 24 24" fill="currentColor"><path d="M4 18v3h2v-3h12v3h2v-3H4zm2-10h12v6H6V8zm-2 2v6H2v-6h2zm16 0v6h2v-6h-2zM7 4h10v3H7V4z"/></svg>
                            <div className="flex items-center gap-1.5 mb-2 relative z-10"><span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] animate-pulse"></span><h3 className="text-[9px] font-bold uppercase tracking-widest text-white/60">Place VIP</h3></div>
                            <div className="relative z-10 text-center py-2">
                              {favoriteSeat ? (
                                <><p className="font-syne text-4xl font-black text-[var(--color-primary)] drop-shadow-[0_0_15px_var(--color-primary-muted)] leading-none mb-1">{favoriteSeat[0]}</p><p className="text-[8px] font-bold uppercase tracking-widest text-white/40">Réservée {favoriteSeat[1]} fois</p></>
                              ) : <p className="text-xs font-bold text-white/30 italic py-2">Sans attache</p>}
                            </div>
                          </div>

                          <div className="bg-white/5 p-4 rounded-3xl border border-white/5 shadow-lg flex flex-col justify-between">
                            <div className="flex items-center gap-1.5 mb-3"><span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span><h3 className="text-[9px] font-bold uppercase tracking-widest text-white/60">Top Salles</h3></div>
                            <div className="space-y-2.5">
                              {topRooms.length > 0 ? topRooms.map(([room, count], idx) => {
                                const pct = (count / maxRoomCount) * 100;
                                return (
                                  <div key={room} className="relative">
                                    <div className="flex justify-between items-baseline mb-1 relative z-10"><span className="text-[10px] font-bold text-white truncate pr-2"><span className="text-white/30 mr-1">#{idx+1}</span>{room}</span><span className="text-[8px] font-black text-white/50">{count}x</span></div>
                                    <div className="h-1 w-full bg-black/40 rounded-full overflow-hidden"><div className="h-full bg-cyan-400/80 rounded-full" style={{ width: `${pct}%` }}></div></div>
                                  </div>
                                )
                              }) : <p className="text-xs font-bold text-white/30 italic text-center py-2">Aucune donnée</p>}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ZONE 7 : LE DUEL DES LANGUES */}
                    {totalLang > 0 && (
                      <div className="animate-in fade-in duration-500">
                        <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                          <h2 className="text-xs font-bold text-white uppercase tracking-widest">Préférence Linguistique</h2>
                        </div>
                        
                        <div 
                          onClick={() => setShowDetailedLang(!showDetailedLang)}
                          className="bg-white/5 p-5 rounded-3xl border border-white/5 shadow-lg cursor-pointer active:scale-[0.98] transition-all relative overflow-hidden group"
                        >
                          <div className="flex justify-between items-end mb-4 relative z-10">
                            <div>
                              <p className="font-syne text-2xl font-black text-[var(--color-primary)] leading-none">{voPct}%</p>
                              <p className="text-[9px] uppercase font-bold tracking-widest text-white/50 mt-1">Version Originale</p>
                            </div>
                            <div className="text-right">
                              <p className="font-syne text-2xl font-black text-white leading-none">{vfPct}%</p>
                              <p className="text-[9px] uppercase font-bold tracking-widest text-white/50 mt-1">Version Française</p>
                            </div>
                          </div>

                          <div className="h-4 w-full bg-white/10 rounded-full overflow-hidden flex relative z-10 shadow-inner">
                            <div className="h-full bg-[var(--color-primary)] transition-all duration-1000" style={{ width: `${voPct}%` }}></div>
                            <div className="h-full bg-white/40 transition-all duration-1000" style={{ width: `${vfPct}%` }}></div>
                          </div>

                          <div className={`transition-all duration-500 overflow-hidden ${showDetailedLang ? 'max-h-40 opacity-100 mt-5' : 'max-h-0 opacity-0 mt-0'}`}>
                            <div className="pt-4 border-t border-white/5">
                              <p className="text-[9px] uppercase font-bold tracking-widest text-[var(--color-primary)] mb-3">Détail des versions originales ({voCount})</p>
                              <div className="flex flex-wrap gap-2">
                                {topVoDetails.length > 0 ? topVoDetails.map(([lang, count]) => (
                                  <span key={lang} className="bg-black/40 border border-white/10 px-3 py-1.5 rounded-full text-[10px] font-black flex items-center gap-1.5 shadow-inner">
                                    <span className="text-white">{lang}</span>
                                    <span className="text-[var(--color-primary)]">{count}</span>
                                  </span>
                                )) : (
                                  <span className="text-[10px] font-bold text-white/30 italic">Aucune donnée spécifique</span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <svg className={`absolute top-5 right-5 w-4 h-4 text-white/20 transition-transform duration-500 ${showDetailedLang ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                        </div>
                      </div>
                    )}

                    {/* ZONE 3 : THE TAPE */}
                    {dashData.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                          <h2 className="text-xs font-bold text-white uppercase tracking-widest">Derniers Billets</h2>
                        </div>
                        <div className="-mx-6 px-6 flex overflow-x-auto gap-3 pb-2 scrollbar-hide snap-x scroll-px-6">
                          {dashData.slice(0, 8).map((film, idx) => (
                            <div key={idx} onClick={() => setSelectedFilm(film)} className="snap-start flex-shrink-0 w-[5.5rem] flex flex-col gap-1.5 cursor-pointer group">
                              <div className="w-[5.5rem] h-[8rem] rounded-2xl overflow-hidden bg-white/5 shadow-lg relative transition-transform duration-300 group-active:scale-95 border border-white/10">
                                <SmartPoster afficheInitiale={film.affiche} titre={film.titre} className="w-full h-full object-cover" />
                              </div>
                              <div className="px-1 text-center">
                                <p className="text-[10px] font-bold text-white line-clamp-1 leading-tight mb-0.5">{film.titre}</p>
                                
                                {film.note ? (
                                  <p className="text-[9px] font-black text-[var(--color-primary)] flex items-center justify-center gap-0.5">
                                    <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                                    {film.note}
                                  </p>
                                ) : (
                                  <p className="text-[8px] font-bold text-white/30 italic">--</p>
                                )}
                                
                              </div>
                            </div>
                          ))}
                          <div className="flex-shrink-0 w-2 h-1"></div>
                        </div>
                      </div>
                    )}

                    {/* ZONE 4 : GENRES ANIMÉS */}
                    <div>
                      <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                        <h2 className="text-xs font-bold text-white uppercase tracking-widest">Genres Dominants</h2>
                      </div>
                      <div className="space-y-4 bg-white/5 p-5 rounded-3xl border border-white/5 shadow-lg">
                        {topGenres.map(([genre, count], idx) => {
                          const pct = maxGenreCount > 0 ? (count / maxGenreCount) * 100 : 0;
                          return (
                            <div key={genre} className="space-y-1.5">
                              <div className="flex justify-between items-baseline"><span className="text-xs font-bold text-white truncate pr-2">{genre}</span><span className="text-[10px] font-black text-white/50">{count} films</span></div>
                              <div className="h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5"><div className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-1000 delay-300 shadow-[0_0_10px_var(--color-primary-muted)]" style={{ width: `${pct}%` }}></div></div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* ZONE 5 : GRAPHIQUE HISTORIQUE (Année) */}
                    {dashView === 'year' && chartData.length > 0 && (
                      <div className="animate-in fade-in duration-500">
                        <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                          <h2 className="text-xs font-bold text-white uppercase tracking-widest">Activité Mensuelle {dashValue}</h2>
                        </div>
                        <div className="bg-white/5 p-5 rounded-3xl border border-white/5 shadow-lg h-72">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)', fontWeight: 'bold' }} />
                              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)', fontWeight: 'bold' }} allowDecimals={false} />
                              <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px' }} itemStyle={{ color: 'white' }} cursor={{ stroke: 'rgba(255,255,255,0.2)' }} formatter={chartTooltipFormatter} />
                              <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px', color: 'rgba(255,255,255,0.6)' }} />
                              <Line type="monotone" dataKey="Films vus" stroke="#22d3ee" strokeWidth={3} dot={{ r: 4, strokeWidth: 3, fill: '#08090F' }} activeDot={{ r: 6, stroke: '#22d3ee', fill: 'white' }} animationDuration={1500} />
                              <Line type="monotone" dataKey="Cumulé" stroke="var(--color-primary)" strokeWidth={2} strokeDasharray="5 5" dot={false} animationDuration={1500} animationBegin={500} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                    {/* ZONE 6 : GRAPHIQUE GLOBAL (Toutes les années) */}
                    {dashView === 'all' && globalChartData.length > 0 && (
                      <div className="animate-in fade-in duration-500">
                        <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                          <h2 className="text-xs font-bold text-white uppercase tracking-widest">Bilan Annuel</h2>
                        </div>
                        <div className="bg-white/5 p-5 rounded-3xl border border-white/5 shadow-lg h-72">
                          <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={globalChartData} margin={{ top: 10, right: -45, left: -35, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)', fontWeight: 'bold' }} />
                              <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#22d3ee', fontWeight: 'bold' }} allowDecimals={false} />
                              <YAxis yAxisId="right" orientation="right" domain={[0, ratingScale]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--color-primary)', fontWeight: 'bold' }} />
                              <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px' }} itemStyle={{ color: 'white' }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} formatter={chartTooltipFormatter} />
                              <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px', color: 'rgba(255,255,255,0.6)' }} />
                              <Bar yAxisId="left" dataKey="Films vus" fill="#22d3ee" radius={[4, 4, 0, 0]} barSize={24} animationDuration={1500} />
                              <Line yAxisId="right" type="monotone" dataKey="Note moy." stroke="var(--color-primary)" strokeWidth={3} dot={{ r: 4, strokeWidth: 3, fill: '#08090F' }} activeDot={{ r: 6, stroke: 'var(--color-primary)', fill: 'white' }} animationDuration={1500} animationBegin={500} />
                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                    <div className="h-10"></div>
                  </main>
                </>
              );
            })()}
          </div>
        )}

        {/* ONGLET 2 : HISTORIQUE */}
        {activeTab === 'history' && (
          <div className="animate-in fade-in duration-300">
            <header className={`z-40 sticky top-0 w-full transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] bg-[var(--color-bg)]/80 backdrop-blur-2xl border-b ${isScrolled || isSearchOpen ? 'pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-3 border-white/10 shadow-lg' : 'pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-5 border-transparent shadow-none'}`}>
              <div className="px-6 flex justify-between items-center relative">
                
                <div className={`flex flex-col transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${isSearchOpen ? 'opacity-0 -translate-x-4 pointer-events-none absolute' : 'opacity-100 relative'}`}>
                  {/* Sur-titre harmonisé */}
                  <p className={`font-bold uppercase tracking-widest text-[var(--color-primary)] transition-all duration-500 origin-left ${isScrolled ? 'opacity-0 h-0 overflow-hidden mb-0 text-[0px]' : 'opacity-100 h-3 text-[10px] mb-1'}`}>
                    {filteredHistory.length} films
                  </p>
                  <h1 className={`font-syne font-black text-white leading-none transition-all duration-500 origin-left ${isScrolled ? 'text-2xl' : 'text-4xl'}`}>
                    Mes <br/>Films
                  </h1>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Bouton Scan Universel */}
                  {!isSearchOpen && (
                    <button onClick={() => handleScan(userToken)} className={`flex items-center justify-center rounded-full border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 text-[var(--color-primary)] active:scale-90 transition-all flex-shrink-0 shadow-lg ${isScrolled ? 'w-10 h-10' : 'w-12 h-12'}`}>
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242M12 12v9M8 17l4 4 4-4"></path></svg>
                    </button>
                  )}
                  
                  {isScrolled && !isSearchOpen && (
                    <button onClick={() => document.getElementById('main-scroll-container').scrollTo({ top: 0, behavior: 'smooth' })} className="animate-bubble flex items-center justify-center w-10 h-10 rounded-full bg-[var(--color-primary)] text-[var(--color-text-on-accent)] shadow-lg border border-white/20 active:scale-90 transition-transform flex-shrink-0">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="2" y1="14" x2="6" y2="14"/><line x1="10" y1="8" x2="14" y2="8"/><line x1="18" y1="16" x2="22" y2="16"/></svg>
                    </button>
                  )}
                  {!isSearchOpen && (
                    <button onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')} className={`w-10 h-10 flex items-center justify-center rounded-full border border-white/5 bg-white/5 active:scale-90 transition-all flex-shrink-0`}>
                      {sortOrder === 'newest' ? <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M19 12l-7 7-7-7"/></svg> : <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>}
                    </button>
                  )}
                  <div className={`flex items-center transition-all duration-500 ${isSearchOpen ? 'w-[calc(100vw-3rem)] h-10 px-4 rounded-full bg-white/10 border-white/20 absolute right-6 shadow-2xl' : 'w-10 h-10 flex-shrink-0'}`}>
                    <button onClick={() => { setIsSearchOpen(true); setTimeout(() => document.getElementById('searchInput')?.focus(), 50); }} className={`flex items-center justify-center flex-shrink-0 ${isSearchOpen ? 'w-5' : 'w-10 h-10 bg-white/5 rounded-full border border-white/5'}`}>
                      <svg className="w-5 h-5 text-white/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    </button>
                    <input id="searchInput" type="text" placeholder="Rechercher..." className={`bg-transparent text-sm w-full outline-none text-white font-bold ml-2 ${isSearchOpen ? 'opacity-100 visible' : 'opacity-0 invisible width-0'}`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    {isSearchOpen && <button onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }} className="p-1 text-white/50 flex-shrink-0"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>}
                  </div>
                </div>
              </div>

              {/* BARRE DE GÉLULES */}
              <div className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${isScrolled || isSearchOpen ? 'max-h-0 opacity-0 mt-0' : 'max-h-20 opacity-100 mt-4'}`}>
                <div className="flex overflow-x-auto gap-2 px-6 pb-2 scrollbar-hide snap-x scroll-px-6">
                  <button onClick={() => setActiveFilter('all')} className={`snap-start flex-shrink-0 px-4 py-1.5 rounded-full text-[11px] font-black uppercase ${activeFilter === 'all' ? 'bg-white text-black shadow-md' : 'bg-white/5 border border-white/10 text-white/60'}`}>Tous</button>
                  <button onClick={() => setActiveFilter(activeFilter === 'capucine' ? 'all' : 'capucine')} className={`snap-start flex-shrink-0 px-4 py-1.5 rounded-full text-[11px] font-black uppercase flex items-center gap-2 ${activeFilter === 'capucine' ? 'bg-[#FFD1DC] text-[#4A1040] shadow-md' : 'bg-white/5 border border-[#FFD1DC]/20 text-[#FFD1DC]/60'}`}>
                    <img src="https://i.imgur.com/lg1bkrO.png" alt="" className="w-3.5 h-3.5" />Capucines
                  </button>
                  <button onClick={() => setActiveFilter('coeur')} className={`snap-start flex-shrink-0 px-4 py-1.5 rounded-full text-[11px] font-black uppercase flex items-center gap-1.5 ${activeFilter === 'coeur' ? 'bg-red-500 text-white shadow-md' : 'bg-white/5 border border-white/10 text-white/60'}`}>
                    <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>Favoris
                  </button>
                  <button onClick={() => setActiveFilter('top')} className={`snap-start flex-shrink-0 px-4 py-1.5 rounded-full text-[11px] font-black uppercase flex items-center gap-1.5 ${activeFilter === 'top' ? 'bg-[var(--color-primary)] text-black' : 'bg-white/5 border border-white/10 text-white/60'}`}>
                    <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>Top
                  </button>
                  {anneesDisponibles.map(annee => (
                    <button key={annee} onClick={() => setActiveFilter(annee)} className={`snap-start flex-shrink-0 px-4 py-1.5 rounded-full text-[11px] font-black uppercase ${activeFilter === annee ? 'bg-[var(--color-primary)] text-black' : 'bg-white/5 border border-white/10 text-white/60'}`}>{annee}</button>
                  ))}
                  <div className="flex-shrink-0 w-6 h-1"></div>
                </div>
              </div>
            </header>

            <main className="px-6 pt-4 space-y-4">
              {isLoadingHistory ? [...Array(6)].map((_, i) => (
                <div key={i} className="flex bg-white/5 border border-white/10 rounded-2xl h-28 relative overflow-hidden">
                   <div className="absolute inset-0 animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
                   <div className="w-20 bg-white/5 h-full"></div>
                   <div className="flex-1 p-4 space-y-3"><div className="h-4 bg-white/10 rounded w-3/4"></div><div className="h-3 bg-white/10 rounded w-1/2"></div></div>
                </div>
              )) : (
                filteredHistory.slice(0, displayCount).map((film, index) => (
                  <div key={index} onClick={() => setSelectedFilm(film)} className="flex bg-white/5 border border-white/10 rounded-2xl overflow-hidden active:scale-[0.98] transition-all cursor-pointer relative min-h-[7.5rem]" style={{ borderColor: film.capucine ? 'rgba(255,209,220,0.15)' : 'rgba(255,255,255,0.1)' }}>
                    {film.numero && <div className="absolute top-0 right-0 bg-[var(--color-primary-muted)] text-[var(--color-primary)] text-[9px] font-black px-2 py-1 rounded-bl-lg z-10 border-b border-l border-white/10">#{film.numero}</div>}
                    <div className="w-24 self-stretch"><SmartPoster afficheInitiale={film.affiche} titre={film.titre} className="w-full h-full" /></div>
                    <div className="flex-1 flex flex-col justify-between py-4 px-4">
                      <div className="mb-2"><h4 className="font-syne font-bold text-lg leading-tight text-white mb-1 pr-6">{film.titre}</h4><p className="text-white/50 text-[10px] font-bold uppercase tracking-wider">{film.date}</p></div>
                      <div className="flex items-center gap-2 mt-auto pt-2">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${GENRE_COLORS[film.genre] || GENRE_COLORS.default}`}>{film.genre}</span>
                        {film.capucine && <div className="w-5 h-5 rounded-full flex items-center justify-center shadow-md bg-[#FFD1DC]"><img src="https://i.imgur.com/lg1bkrO.png" alt="Capucine" className="w-3 h-3 object-contain" /></div>}
                        {film.note && (
                          <span className="text-[var(--color-primary)] font-black text-[11px] bg-[var(--color-primary-muted)] px-2 py-0.5 rounded-full border border-[var(--color-primary-muted)] shadow-sm flex items-center gap-1">
                            <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                            {film.note}
                          </span>
                        )}
                        {film.coupDeCoeur && (
                          <span className="text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)] flex items-center justify-center">
                            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div className="h-6"></div>
            </main>
          </div>
        )}

        {/* ONGLET 3 : PROFIL */}
        {activeTab === 'profile' && (
          <div className="animate-in fade-in duration-300">
            <header className={`z-40 sticky top-0 w-full transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] bg-[var(--color-bg)]/80 backdrop-blur-2xl border-b ${isScrolled ? 'pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-3 border-white/10 shadow-lg' : 'pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-5 border-transparent shadow-none'}`}>
              <div className="px-6 flex justify-between items-center">
                <div className="flex flex-col">
                  {/* Sur-titre harmonisé */}
                  <p className={`font-bold uppercase tracking-widest text-[var(--color-primary)] transition-all duration-500 origin-left ${isScrolled ? 'opacity-0 h-0 overflow-hidden mb-0 text-[0px]' : 'opacity-100 h-3 text-[10px] mb-1'}`}>
                    Réglages
                  </p>
                  <h1 className={`font-syne font-black text-white leading-none transition-all duration-500 origin-left ${isScrolled ? 'text-2xl' : 'text-4xl'}`}>
                    Mon Profil
                  </h1>
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Bouton Scan Universel */}
                  <button onClick={() => handleScan(userToken)} className={`flex items-center justify-center rounded-full border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 text-[var(--color-primary)] active:scale-90 transition-all flex-shrink-0 shadow-lg ${isScrolled ? 'w-10 h-10' : 'w-12 h-12'}`}>
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242M12 12v9M8 17l4 4 4-4"></path></svg>
                  </button>
                </div>
              </div>
            </header>
            
            <main className="px-6 pt-6 pb-24 space-y-10">
              <div className="flex items-center gap-5 bg-white/5 p-5 rounded-3xl border border-white/10 shadow-lg">
                <div className="relative w-20 h-20 mt-2 flex-shrink-0">
                  <div className="absolute inset-0 rounded-full overflow-hidden z-0 bg-white/5"><img src={userAvatar} alt="" className="w-full h-full object-contain object-bottom origin-bottom scale-[1.15]" /></div>
                  <div className="absolute inset-0 rounded-full border-[3px] border-[var(--color-primary)] z-10 pointer-events-none" style={{ boxShadow: `0 0 20px ${theme.primary}40` }}></div>
                  <div className="absolute inset-0 z-20 pointer-events-none" style={{ clipPath: 'inset(-50% -50% 80% -50%)' }}>
                    <img src={userAvatar} alt="Avatar" className="w-full h-full object-contain object-bottom origin-bottom scale-[1.15]" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 group relative">
                    <input type="text" value={userName} onChange={(e) => { setUserName(e.target.value); localStorage.setItem('grandecran_username', e.target.value); }} onBlur={() => triggerCloudSave()} className="font-syne text-2xl font-bold bg-transparent border-b border-transparent hover:border-white/20 focus:border-[var(--color-primary)] outline-none w-full text-white truncate" />
                    <svg className="w-4 h-4 text-white/30 absolute right-0 pointer-events-none group-focus-within:opacity-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                  </div>
                  <p className="text-white/50 text-xs mt-1">Cinéphile passionné</p>
                  <span className="inline-block mt-2 bg-[var(--color-primary-muted)] text-[var(--color-primary)] text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md border border-[var(--color-primary-muted)] transition-colors duration-500">Membre VIP</span>
                </div>
              </div>

              {/* BLOC TARIFS DYNAMIQUE */}
              <div className="space-y-4">
                <div className="flex items-center justify-between ml-2 border-b border-white/10 pb-2">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/50">Abonnement & Tarifs</h3>
                  <select 
                    value={pricingYearEditor} 
                    onChange={(e) => setPricingYearEditor(e.target.value)} 
                    className="bg-black/40 border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg px-2 py-1 outline-none"
                  >
                    <option value="default">Par défaut</option>
                    {anneesDisponibles.map(y => <option key={y} value={y}>Année {y}</option>)}
                  </select>
                </div>
                
                <div className="bg-white/5 border border-white/10 rounded-3xl p-5 flex flex-col gap-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-4">
                    <div>
                      <label className="text-xs font-bold text-white">Coût de l'Abonnement</label>
                      <p className="text-[10px] text-white/40 mt-0.5 uppercase tracking-widest">Montant facturé par mois</p>
                    </div>
                    <div className="flex items-center gap-1 bg-black/40 rounded-xl px-3 py-2 border border-white/10">
                      {/* inputMode decimal + gestion de la virgule à la volée */}
                      <input 
                        type="text" 
                        inputMode="decimal"
                        value={pricing[pricingYearEditor]?.sub ?? pricing.default.sub} 
                        onChange={(e) => { 
                          let v = e.target.value.replace(',', '.');
                          if (/^\d*\.?\d*$/.test(v)) {
                            const newPricing = { ...pricing, [pricingYearEditor]: { ...pricing[pricingYearEditor], sub: v } };
                            setPricing(newPricing); 
                            localStorage.setItem('grandecran_pricing', JSON.stringify(newPricing)); 
                            triggerCloudSave({pricing: newPricing}); 
                          }
                        }} 
                        className="w-16 bg-transparent outline-none text-right font-bold text-sm text-white" 
                      />
                      <span className="text-white/40 font-bold text-sm">€</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <label className="text-xs font-bold text-white">Prix Plein Tarif</label>
                      <p className="text-[10px] text-white/40 mt-0.5 uppercase tracking-widest">Prix moyen d'un billet classique</p>
                    </div>
                    <div className="flex items-center gap-1 bg-black/40 rounded-xl px-3 py-2 border border-white/10">
                      <input 
                        type="text" 
                        inputMode="decimal"
                        value={pricing[pricingYearEditor]?.ticket ?? pricing.default.ticket} 
                        onChange={(e) => { 
                          let v = e.target.value.replace(',', '.');
                          if (/^\d*\.?\d*$/.test(v)) {
                            const newPricing = { ...pricing, [pricingYearEditor]: { ...pricing[pricingYearEditor], ticket: v } };
                            setPricing(newPricing); 
                            localStorage.setItem('grandecran_pricing', JSON.stringify(newPricing)); 
                            triggerCloudSave({pricing: newPricing}); 
                          }
                        }} 
                        className="w-16 bg-transparent outline-none text-right font-bold text-sm text-[var(--color-primary)]" 
                      />
                      <span className="text-[var(--color-primary)] font-bold text-sm">€</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-3 ml-2 border-b border-white/10 pb-2"><h3 className="text-[10px] font-bold uppercase tracking-widest text-white/50">Apparence</h3></div>
                <div>
                  <h4 className="text-[10px] font-bold uppercase text-white/30 mb-3 ml-2 italic">Choisir un portrait</h4>
                  <div className="bg-white/5 border border-white/10 rounded-3xl py-3 px-6 flex items-center gap-4 overflow-x-auto scrollbar-hide">
                    {AVATAR_PRESETS.map((url, idx) => (
                      <button key={idx} onClick={() => { setUserAvatar(url); localStorage.setItem('grandecran_avatar', url); triggerCloudSave({userAvatar: url}); }} className={`flex-shrink-0 w-14 h-14 rounded-full transition-all duration-300 overflow-hidden ${userAvatar === url ? 'ring-2 ring-[var(--color-primary)] scale-110 opacity-100' : 'opacity-40 grayscale-[0.5] bg-white/5'}`}><img src={url} alt="" className="w-full h-full object-contain object-bottom origin-bottom scale-100" /></button>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold uppercase text-white/30 mb-3 ml-2 italic">Thème de l'interface</h4>
                  <div className="bg-white/5 border border-white/10 rounded-3xl py-4 px-6 flex items-center gap-4 overflow-x-auto scrollbar-hide">
                    {Object.entries(THEME_COLORS).map(([key, t]) => (
                      <button key={key} onClick={() => { setCurrentThemeKey(key); localStorage.setItem('grandecran_theme', key); triggerCloudSave({themeKey: key}); }} className={`flex-shrink-0 w-10 h-10 rounded-full transition-all duration-300 ${currentThemeKey === key ? 'ring-2 ring-[var(--color-primary)] scale-110 opacity-100' : 'opacity-40 grayscale-[0.2]'}`} style={{ background: t.bgGradient, border: 'none' }} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 ml-2 border-b border-white/10 pb-2"><h3 className="text-[10px] font-bold uppercase tracking-widest text-white/50">Préférences</h3></div>
                <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
                  <div onClick={() => { const newScale = ratingScale === 5 ? 10 : 5; setRatingScale(newScale); localStorage.setItem('grandecran_rating_scale', newScale); triggerCloudSave({ratingScale: newScale}); }} className="flex items-center justify-between p-5 border-b border-white/5 cursor-pointer active:bg-white/5 transition-colors">
                    <div className="flex items-center gap-4"><div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shadow-inner text-[var(--color-primary)]"><svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg></div><div><p className="text-sm font-bold text-white">Système de notation</p><p className="text-[10px] text-[var(--color-primary)] font-black uppercase mt-0.5">Échelle sur {ratingScale}</p></div></div>
                    <div className="flex bg-black/40 rounded-full p-1 border border-white/10 shadow-inner">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black transition-all duration-300 ${ratingScale === 5 ? 'bg-[var(--color-primary)] text-black' : 'text-white/40'}`}>5</span>
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black transition-all duration-300 ${ratingScale === 10 ? 'bg-[var(--color-primary)] text-black' : 'text-white/40'}`}>10</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 ml-2 border-b border-white/10 pb-2"><h3 className="text-[10px] font-bold uppercase tracking-widest text-white/50">Base de données</h3></div>
                <div className="bg-white/5 border border-white/10 rounded-3xl p-5 flex flex-col gap-3">
                  <label className="text-[10px] font-bold uppercase text-white/40 ml-1">ID du Spreadsheet Google</label>
                  <div className="flex gap-2">
                    <input type="text" defaultValue={spreadsheetId} disabled className="bg-black/50 border border-white/10 p-3 rounded-xl outline-none text-[10px] font-mono text-white/40 w-full" />
                    <button onClick={() => { const newId = prompt("Entrez le nouvel ID :", spreadsheetId); if (newId && newId !== spreadsheetId) { setSpreadsheetId(newId); localStorage.setItem('grandecran_db_id', newId); window.location.reload(); }}} className="bg-white/10 px-3 rounded-xl text-[10px] font-bold uppercase">Éditer</button>
                  </div>
                </div>
                <button onClick={logout} className="w-full bg-red-500/10 border border-red-500/20 text-red-500 font-black py-4 rounded-3xl active:scale-95 transition-all uppercase text-xs flex items-center justify-center gap-2 shadow-lg"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1-2-2h4M16 17l5-5-5-5M21 12H9"/></svg>Se déconnecter</button>
              </div>
            </main>
          </div>
        )}

        {/* ONGLET 4 : STUDIO (Le composant est inséré ici) */}
        {activeTab === 'studio' && (
          <Studio 
            historyData={historyData} 
            ratingScale={ratingScale} 
            userName={userName} 
            isScrolled={isScrolled} 
          />
        )}
      </div>

        {/* NAVIGATION */}
      {films.length === 0 && (
        <nav className="fixed bottom-0 left-0 right-0 z-[80] bg-black/10 backdrop-blur-2xl border-t border-white/5">
          <div className="flex justify-around items-end h-[calc(40px+env(safe-area-inset-bottom))] pb-[calc(env(safe-area-inset-bottom)-12px)] pt-[10px]">
            <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center w-16 transition-all ${activeTab === 'home' ? 'text-[var(--color-primary)]' : 'text-white opacity-40'}`}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill={activeTab === 'home' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10"/></svg>
              <span className="text-[8px] font-black uppercase mt-1 tracking-tighter">Accueil</span>
            </button>
            <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center w-16 transition-all ${activeTab === 'history' ? 'text-[var(--color-primary)]' : 'text-white opacity-40'}`}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill={activeTab === 'history' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              <span className="text-[8px] font-black uppercase mt-1 tracking-tighter">Billets</span>
            </button>
            <button onClick={() => setActiveTab('studio')} className={`flex flex-col items-center w-16 transition-all ${activeTab === 'studio' ? 'text-[var(--color-primary)]' : 'text-white opacity-40'}`}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill={activeTab === 'studio' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              <span className="text-[8px] font-black uppercase mt-1 tracking-tighter">Studio</span>
            </button>
            <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center w-16 transition-all ${activeTab === 'profile' ? 'text-[var(--color-primary)]' : 'text-white opacity-40'}`}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill={activeTab === 'profile' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              <span className="text-[8px] font-black uppercase mt-1 tracking-tighter">Profil</span>
            </button>
          </div>
        </nav>
      )}

      {selectedFilm && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center animate-in fade-in duration-300">
          <div className="absolute inset-0 backdrop-blur-sm bg-black/70" onClick={() => setSelectedFilm(null)}></div>
          <div className="relative w-full rounded-t-[32px] p-6 pb-[calc(2rem+env(safe-area-inset-bottom))] border-t border-white/10 shadow-[0_-20px_60px_rgba(0,0,0,0.8)] max-h-[90vh] overflow-y-auto bg-[#111] animate-in slide-in-from-bottom duration-300 scrollbar-hide">
            <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mb-6 flex-shrink-0"></div>
            <div className="flex gap-5 mb-7 items-start">
              <div className="w-24 min-h-[9rem] rounded-xl overflow-hidden bg-white/5 flex-shrink-0 border border-white/10 shadow-lg"><SmartPoster afficheInitiale={selectedFilm.affiche} titre={selectedFilm.titre} className="w-full h-full object-cover" /></div>
              <div className="flex flex-col flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">{selectedFilm.numero && <span className="text-[var(--color-primary)] text-[10px] font-black uppercase tracking-widest bg-[var(--color-primary-muted)] px-3 py-0.5 rounded-full border border-[var(--color-primary)]/10">Séance #{selectedFilm.numero}</span>}{selectedFilm.capucine && <div className="w-5 h-5 rounded-full flex items-center justify-center bg-[#FFD1DC] shadow-lg animate-bubble flex-shrink-0"><img src="https://i.imgur.com/lg1bkrO.png" className="w-3.5 h-3.5" alt="Capucine" /></div>}</div>
                <h2 className="font-syne text-2xl font-black leading-tight mb-4 text-white drop-shadow-xl">{selectedFilm.titre}</h2>
                <div className="flex flex-wrap gap-2 items-center">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${GENRE_COLORS[selectedFilm.genre] || GENRE_COLORS.default}`}>{selectedFilm.genre}</span>
                  {selectedFilm.note && <span className="bg-[var(--color-primary-muted)] text-[var(--color-primary)] border border-[var(--color-primary)]/20 px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-1 shadow-sm"><svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>{selectedFilm.note}</span>}
                  <span className="bg-white/5 border border-white/10 text-white/70 px-3 py-1 rounded-full text-[10px] font-black uppercase">{selectedFilm.langue || "?"}</span>
                  {selectedFilm.coupDeCoeur && (
                    <span className="bg-red-500/10 text-red-500 border border-red-500/20 px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-1.5 shadow-sm">
                      <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                      Coup de Cœur
                    </span>
                  )}
                </div>
              </div>
            </div>
            {selectedFilm.commentaire && <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-5 shadow-inner"><p className="text-sm italic text-white/90 leading-relaxed font-medium">"{selectedFilm.commentaire}"</p></div>}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10 shadow-inner flex flex-col justify-center"><span className="block text-[9px] uppercase font-bold tracking-widest text-white/40 mb-1.5">Salle & Siège</span><div className="flex flex-col"><span className="font-syne font-bold text-lg text-white leading-tight">{selectedFilm.salle || "?"}</span><span className="font-bold text-sm text-white/40 leading-tight">Place {selectedFilm.siege || "?"}</span></div></div>
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10 shadow-inner flex flex-col justify-center"><span className="block text-[9px] uppercase font-bold tracking-widest text-white/40 mb-1.5">Dépense Séance</span><span className="font-sans font-black text-xl text-[var(--color-primary)] drop-shadow-md">{selectedFilm.depense ? `${selectedFilm.depense}` : '--'}</span></div>
            </div>
            <button onClick={() => setSelectedFilm(null)} className="w-full py-4 mt-2 bg-white/10 rounded-2xl border border-white/5 font-black text-xs uppercase tracking-widest text-white/80 active:scale-95 transition-all shadow-xl">Fermer le billet</button>
          </div>
        </div>
      )}

      {films.length > 0 && (
          <Notation 
            key={films[0].titre || films.length} 
            films={films} token={userToken} spreadsheetId={spreadsheetId} 
            isExiting={isExitingNotation} ratingScale={ratingScale}
            onSaved={() => { setFilms(prev => prev.slice(1)); setHistoryData([]); }} 
            onSkip={() => {
                setIsExitingNotation(true);
                setTimeout(() => { setFilms([]); setIsExitingNotation(false); }, 500); 
            }} 
          />
      )}
    </div>
  );
}

export default App;