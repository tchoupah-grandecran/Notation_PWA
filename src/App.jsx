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

function App() {
  const [currentThemeKey, setCurrentThemeKey] = useState(localStorage.getItem('grandecran_theme') || 'dark-grey');
  const [userAvatar, setUserAvatar] = useState(localStorage.getItem('grandecran_avatar') || AVATAR_PRESETS[0]);
  const [userName, setUserName] = useState(localStorage.getItem('grandecran_username') || 'Cinéphile');
  const [ratingScale, setRatingScale] = useState(Number(localStorage.getItem('grandecran_rating_scale')) || 5);
  const [dashView, setDashView] = useState('all'); // 'all', 'year', ou 'month'
  const [dashValue, setDashValue] = useState('');  // Ex: '2024' ou '2024-03'
  const theme = THEME_COLORS[currentThemeKey] || THEME_COLORS['dark-grey'];

  const [userToken, setUserToken] = useState(localStorage.getItem('google_token') || null);
  const [spreadsheetId, setSpreadsheetId] = useState(localStorage.getItem('grandecran_db_id') || "");
  const [films, setFilms] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isExitingNotation, setIsExitingNotation] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [stats, setStats] = useState({ totalFilms: "--", coupsDeCoeur: "--" });
  const [historyData, setHistoryData] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' ou 'oldest'
  const [selectedFilm, setSelectedFilm] = useState(null); 
  const [displayCount, setDisplayCount] = useState(15); 

  useEffect(() => {
    const syncCloudPrefs = async () => {
      if (userToken && spreadsheetId) {
        const cloud = await getPreferencesFromSheet(userToken, spreadsheetId);
        if (cloud) {
          setUserName(cloud.userName);
          setUserAvatar(cloud.userAvatar);
          setCurrentThemeKey(cloud.themeKey);
          setRatingScale(cloud.ratingScale);
          localStorage.setItem('grandecran_username', cloud.userName);
          localStorage.setItem('grandecran_avatar', cloud.userAvatar);
          localStorage.setItem('grandecran_theme', cloud.themeKey);
          localStorage.setItem('grandecran_rating_scale', cloud.ratingScale);
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
      ratingScale: overrides.ratingScale || ratingScale
    });
  };

  const login = useGoogleLogin({
    onSuccess: async (codeResponse) => {
      const token = codeResponse.access_token;
      setUserToken(token);
      localStorage.setItem('google_token', token);
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
      if (err.status === 401) login();
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

  if (!userToken) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: theme.bgGradient, color: theme.text }}>
        <h1 className="text-5xl font-black mb-8 tracking-tighter italic uppercase">Grand Écran</h1>
        <button onClick={() => login()} className="font-bold py-4 px-10 rounded-full active:scale-95 transition-all" style={{ background: theme.primary, color: theme.textOnAccent }}>
          CONNEXION GOOGLE
        </button>
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
        className="flex-1 overflow-y-auto pb-[calc(4rem+env(safe-area-inset-bottom))] scrollbar-hide"
        onScroll={(e) => {
          const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
          setIsScrolled(scrollTop > 20); // Appliqué partout maintenant
          if (scrollHeight - scrollTop <= clientHeight + 150) setDisplayCount(prev => prev + 15);
        }}
      >
        {/* ONGLET 1 : DASHBOARD (MISSION CONTROL - DATA RICH) */}
        {activeTab === 'home' && (
          <div className="animate-in fade-in duration-500 pb-24 min-h-screen">
            
            {(() => {
              // --- 1. EXTRACTION DES PÉRIODES (Tri Chronologique Ascendant pour la molette) ---
              const availableYears = [...new Set(historyData.map(f => f.date?.split('/')[2]).filter(Boolean))].sort((a, b) => a - b);
              const availableMonthsRaw = [...new Set(historyData.map(f => {
                const parts = f.date?.split('/');
                return parts?.length === 3 ? `${parts[2]}-${parts[1]}` : null;
              }).filter(Boolean))].sort((a, b) => a.localeCompare(b)); 

              const options = dashView === 'year' ? availableYears : availableMonthsRaw;

              // --- 2. FILTRAGE ---
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

              // --- 3. CALCULS SÉCURISÉS À LA VOLÉE ---
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

              const totalCDC = dashData.filter(f => f.coupDeCoeur).length;
              const totalCap = dashData.filter(f => f.capucine).length;
              const latestPoster = dashData.find(f => f.affiche)?.affiche || historyData.find(f => f.affiche)?.affiche;

              const genreCounts = {}; dashData.forEach(f => { if(f.genre) genreCounts[f.genre] = (genreCounts[f.genre] || 0) + 1; });
              const topGenres = Object.entries(genreCounts).sort((a,b) => b[1] - a[1]).slice(0, 4);
              const maxGenreCount = topGenres.length ? topGenres[0][1] : 1;

              // --- 4. LOGIQUE DU GRAPHIQUE HISTORIQUE (RECHARTS) ---
              // On ne calcule le graphique que si on est en vue "Annuelle"
              let chartData = [];
              if (dashView === 'year' && dashValue) {
                const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
                
                // Initialise les 12 mois
                const monthlyCounts = Array(12).fill(0);
                
                // Compte les films par mois
                dashData.forEach(film => {
                  const month = parseInt(film.date?.split('/')[1], 10);
                  if (month >= 1 && month <= 12) {
                    monthlyCounts[month - 1]++;
                  }
                });

                // Calcule le cumulé et formate pour Recharts
                let cumulativeSum = 0;
                chartData = monthlyCounts.map((count, index) => {
                  cumulativeSum += count;
                  return {
                    name: monthNames[index],
                    'Films vus': count,
                    'Cumulé': cumulativeSum
                  };
                });
              }

              const renderStars = (noteVal) => {
                const maxStars = ratingScale === 10 ? 10 : 5;
                const filled = Math.round(parseFloat(String(noteVal).replace(',', '.')) || 0);
                let stars = '';
                for(let i=1; i<=maxStars; i++) stars += i <= filled ? '★' : '☆';
                return stars;
              };

              const formatLabel = (val, view) => {
                if (!val) return '';
                if (view === 'year') return val;
                const [yy, mm] = val.split('-');
                const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
                return `${monthNames[parseInt(mm, 10)-1]} ${yy.slice(2)}`;
              };

              // Import dynamique des composants Recharts (pour éviter de lourds imports en haut de fichier)
              const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } = require('recharts');

              return (
                <>
                  {/* ZONE 1 : LE HERO ( Seamless Fade) */}
                  <div className={`sticky top-0 z-40 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] overflow-hidden bg-[var(--color-bg)] w-full ${isScrolled ? 'pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-4' : 'pt-[calc(env(safe-area-inset-top)+1rem)] pb-6'}`}>
                    
                    {latestPoster && (
                      <>
                        <div className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105" style={{backgroundImage: `url(${latestPoster})`}}></div>
                        <div 
                          className="absolute inset-0" 
                          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 60%, var(--color-bg) 95%, var(--color-bg) 100%)' }}
                        ></div>
                      </>
                    )}
                    
                    <header className={`relative z-10 flex justify-between items-start px-6 transition-all duration-500 ${isScrolled ? 'mb-4' : 'mb-6'}`}>
                      <div className="flex flex-col drop-shadow-lg">
                        <span className={`font-bold text-white/80 transition-all duration-500 ${isScrolled ? 'text-xs' : 'text-sm'}`}>Cinéphile</span>
                        <h1 className={`font-syne font-black text-white leading-none transition-all duration-500 ${isScrolled ? 'text-2xl mt-0.5' : 'text-4xl mt-1'}`}>{userName}</h1>
                      </div>
                      <button onClick={() => setActiveTab('profile')} className={`rounded-full border-2 border-[var(--color-primary)] overflow-hidden shadow-[0_0_20px_var(--color-primary-muted)] active:scale-95 transition-all duration-500 bg-black flex-shrink-0 ${isScrolled ? 'w-10 h-10 border' : 'w-14 h-14'}`}>
                        <img src={userAvatar} alt="Profil" className="w-full h-full object-contain object-bottom scale-[1.15]" />
                      </button>
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

                    {/* SÉLECTEURS ET MOLETTE NATIVE */}
                    <div className={`relative z-10 transition-all duration-500 overflow-hidden flex flex-col ${isScrolled ? 'max-h-0 opacity-0 mt-0' : 'max-h-40 opacity-100 mt-5'}`}>
                      
                      {/* Pill Menu */}
                      <div className="px-6 mb-1">
                        <div className="bg-white/10 backdrop-blur-md rounded-full p-1 flex items-center justify-between">
                          <button onClick={() => { setDashView('all'); setDashValue(''); }} className={`flex-1 py-1.5 rounded-full text-[11px] font-bold transition-all ${dashView === 'all' ? 'bg-white/20 text-white shadow' : 'text-white/50'}`}>Global</button>
                          <button onClick={() => { setDashView('year'); setDashValue(availableYears[availableYears.length - 1] || ''); }} className={`flex-1 py-1.5 rounded-full text-[11px] font-bold transition-all ${dashView === 'year' ? 'bg-white/20 text-white shadow' : 'text-white/50'}`}>Annuel</button>
                          <button onClick={() => { setDashView('month'); setDashValue(availableMonthsRaw[availableMonthsRaw.length - 1] || ''); }} className={`flex-1 py-1.5 rounded-full text-[11px] font-bold transition-all ${dashView === 'month' ? 'bg-white/20 text-white shadow' : 'text-white/50'}`}>Mensuel</button>
                        </div>
                      </div>

                      {/* Molette (Scroll Horizontal Cranté) */}
                      {dashView !== 'all' && options.length > 0 && (
                        <div className="relative w-full flex items-center justify-center py-2 animate-in fade-in duration-300">
                          {/* Viseur visuel central */}
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-8 bg-white/5 rounded-full pointer-events-none border border-white/10 shadow-inner"></div>

                          {/* Conteneur de Scroll */}
                          <div 
                            className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide items-center w-full px-[calc(50%-3rem)] relative z-10"
                            onScroll={(e) => {
                              const container = e.target;
                              const center = container.scrollLeft + container.clientWidth / 2;
                              let closest = null;
                              let minDiff = Infinity;
                              Array.from(container.children).forEach(child => {
                                const childCenter = child.offsetLeft + child.clientWidth / 2;
                                const diff = Math.abs(childCenter - center);
                                if (diff < minDiff) {
                                  minDiff = diff;
                                  closest = child.getAttribute('data-value');
                                }
                              });
                              if (closest && closest !== dashValue) {
                                setDashValue(closest);
                              }
                            }}
                            ref={(el) => {
                              if (el && !el.dataset.initialized) {
                                const activeChild = el.querySelector(`[data-value="${dashValue}"]`);
                                if (activeChild) {
                                  el.scrollLeft = activeChild.offsetLeft - el.clientWidth / 2 + activeChild.clientWidth / 2;
                                }
                                el.dataset.initialized = 'true';
                              }
                            }}
                          >
                            {options.map(opt => (
                              <div 
                                key={opt}
                                data-value={opt}
                                onClick={(e) => {
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

                  {/* RESTE DU DASHBOARD (Scrollable) */}
                  <main className="px-6 pt-8 space-y-10">
                    
                    {/* ZONE 2 : TEMPS PASSÉ */}
                    <div>
                      <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
                        <h2 className="text-xs font-bold text-white uppercase tracking-widest">Temps Passé</h2>
                        <svg className="w-5 h-5 text-[var(--color-primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 20 10 20 22 4 22 4 10 12 2"/><polyline points="12 22 12 12 16 12"/></svg>
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

                    {/* ZONE 3 : THE TAPE */}
                    {dashData.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
                          <h2 className="text-xs font-bold text-white uppercase tracking-widest">Derniers Billets</h2>
                          <svg className="w-4 h-4 text-[var(--color-primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                        </div>
                        <div className="-mx-6 px-6 flex overflow-x-auto gap-4 pb-2 scrollbar-hide snap-x scroll-px-6">
                          {dashData.slice(0, 8).map((film, idx) => (
                            <div key={idx} onClick={() => setSelectedFilm(film)} className="snap-start flex-shrink-0 w-24 flex flex-col gap-1.5 cursor-pointer group">
                              <div className="w-24 h-[140px] rounded-2xl overflow-hidden bg-white/5 shadow-lg relative transition-transform duration-300 group-active:scale-95 border border-white/10">
                                <SmartPoster afficheInitiale={film.affiche} titre={film.titre} className="w-full h-full object-cover" />
                              </div>
                              <div className="px-1 text-center">
                                <p className="text-[11px] font-bold text-white line-clamp-1 leading-tight mb-0.5">{film.titre}</p>
                                <p className="text-[9px] text-[var(--color-primary)] tracking-widest">{renderStars(film.note)}</p>
                              </div>
                            </div>
                          ))}
                          <div className="flex-shrink-0 w-2 h-1"></div>
                        </div>
                      </div>
                    )}

                    {/* ZONE 4 : GENRES ANIMÉS */}
                    <div>
                      <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
                        <h2 className="text-xs font-bold text-white uppercase tracking-widest">Genres Dominants</h2>
                        <svg className="w-4 h-4 text-[var(--color-primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                      </div>
                      
                      <div className="space-y-4 bg-white/5 p-5 rounded-3xl border border-white/5 shadow-lg">
                        {topGenres.map(([genre, count], idx) => {
                          const pct = maxGenreCount > 0 ? (count / maxGenreCount) * 100 : 0;
                          return (
                            <div key={genre} className="space-y-1.5">
                              <div className="flex justify-between items-baseline">
                                <span className="text-xs font-bold text-white truncate pr-2">{genre}</span>
                                <span className="text-[10px] font-black text-white/50">{count} films</span>
                              </div>
                              <div className="h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                                <div className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-1000 delay-300 shadow-[0_0_10px_var(--color-primary-muted)]" style={{ width: `${pct}%` }}></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* NOUVELLE ZONE 5 : GRAPHIQUE HISTORIQUE (Uniquement en vue Annuelle) */}
                    {dashView === 'year' && chartData.length > 0 && (
                      <div className="animate-in fade-in duration-500">
                        <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
                          <h2 className="text-xs font-bold text-white uppercase tracking-widest">Activité Mensuelle {dashValue}</h2>
                          <svg className="w-5 h-5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
                        </div>
                        
                        <div className="bg-white/5 p-5 rounded-3xl border border-white/5 shadow-lg h-72">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                              <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)', fontWeight: 'bold' }} 
                              />
                              <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)', fontWeight: 'bold' }}
                                allowDecimals={false}
                              />
                              <Tooltip 
                                contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px' }}
                                itemStyle={{ color: 'white' }}
                                cursor={{ stroke: 'rgba(255,255,255,0.2)' }}
                              />
                              <Legend 
                                iconType="circle" 
                                wrapperStyle={{ fontSize: '10px', paddingTop: '10px', color: 'rgba(255,255,255,0.6)' }}
                              />
                              {/* Ligne 1 : Nombre par mois ( Cyan) */}
                              <Line 
                                type="monotone" 
                                dataKey="Films vus" 
                                stroke="#22d3ee" // cyan-400
                                strokeWidth={3}
                                dot={{ r: 4, strokeWidth: 3, fill: '#08090F' }}
                                activeDot={{ r: 6, stroke: '#22d3ee', fill: 'white' }}
                                animationDuration={1500}
                              />
                              {/* Ligne 2 : Cumulé ( Couleur Primaire) */}
                              <Line 
                                type="monotone" 
                                dataKey="Cumulé" 
                                stroke="var(--color-primary)" 
                                strokeWidth={2}
                                strokeDasharray="5 5" // Ligne pointillée pour le cumulé
                                dot={false} // Pas de points pour alléger
                                animationDuration={1500}
                                animationBegin={500}
                              />
                            </LineChart>
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
            <header className="pt-[calc(env(safe-area-inset-top)+1rem)] z-40 sticky top-0 bg-black/5 backdrop-blur-2xl transition-all duration-500">
              <div className="px-6 pb-4 flex justify-between items-center relative h-14">
                
                {/* Titre dynamique */}
                <div className={`flex flex-col transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${isSearchOpen ? 'opacity-0 -translate-x-4 pointer-events-none' : 'opacity-100'}`}>
                  <p className="text-[10px] font-bold uppercase text-white/30 mb-0.5">{filteredHistory.length} films</p>
                  <h1 className={`font-syne font-bold leading-none tracking-tight transition-all duration-500 ${isScrolled ? 'text-lg opacity-60' : 'text-2xl'}`}>Mes Billets</h1>
                </div>

                {/* Actions : Filtre + Sort + Recherche */}
<div className="flex items-center gap-2 flex-shrink-0">
  
  {/* BOUTON FILTRE ORGANIQUE (sliders) */}
  {isScrolled && !isSearchOpen && (
    <button 
      onClick={() => document.getElementById('main-scroll-container').scrollTo({ top: 0, behavior: 'smooth' })}
      className="animate-bubble flex items-center justify-center w-10 h-10 rounded-full bg-[var(--color-primary)] text-[var(--color-text-on-accent)] shadow-lg border border-white/20 active:scale-90 transition-transform flex-shrink-0"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="2" y1="14" x2="6" y2="14"/><line x1="10" y1="8" x2="14" y2="8"/><line x1="18" y1="16" x2="22" y2="16"/>
      </svg>
    </button>
  )}

  {/* BOUTON TRI (Date Asc/Desc) - CORRIGÉ : flex-shrink-0 pour ne plus bouger */}
  {!isSearchOpen && (
    <button 
      onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')} 
      className={`w-10 h-10 flex items-center justify-center rounded-full border border-white/5 bg-white/5 active:scale-90 transition-all flex-shrink-0 ${isScrolled ? 'scale-90' : 'scale-100'}`}
    >
      {sortOrder === 'newest' ? 
        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M19 12l-7 7-7-7"/></svg> : 
        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
      }
    </button>
  )}

  {/* RECHERCHE - CORRIGÉ : flex-shrink-0 sur le conteneur et le bouton */}
  <div className={`flex items-center transition-all duration-500 ${isSearchOpen ? 'w-[calc(100vw-3rem)] h-10 px-4 rounded-full bg-white/10 border-white/20 absolute right-6 shadow-2xl' : 'w-10 h-10 flex-shrink-0'}`}>
    <button 
      onClick={() => { setIsSearchOpen(true); setTimeout(() => document.getElementById('searchInput')?.focus(), 50); }} 
      className={`flex items-center justify-center flex-shrink-0 ${isSearchOpen ? 'w-5' : 'w-10 h-10 bg-white/5 rounded-full border border-white/5'}`}
    >
      <svg className="w-5 h-5 text-white/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
    </button>
    <input id="searchInput" type="text" placeholder="Rechercher..." className={`bg-transparent text-sm w-full outline-none text-white font-bold ml-2 ${isSearchOpen ? 'opacity-100 visible' : 'opacity-0 invisible width-0'}`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
    {isSearchOpen && <button onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }} className="p-1 text-white/50 flex-shrink-0"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>}
  </div>
</div>
              </div>

              {/* BARRE DE GÉLULES (Filtres visibles) - Replacée dans le header */}
              <div className={`overflow-hidden transition-all duration-500 ${isScrolled || isSearchOpen ? 'max-h-0 opacity-0 -translate-y-4' : 'max-h-20 opacity-100 mb-2'}`}>
                <div className="flex overflow-x-auto gap-2 px-6 pb-4 scrollbar-hide snap-x scroll-px-6">
                  <button onClick={() => setActiveFilter('all')} className={`snap-start flex-shrink-0 px-4 py-1.5 rounded-full text-[11px] font-black uppercase ${activeFilter === 'all' ? 'bg-white text-black shadow-md' : 'bg-white/5 border border-white/10 text-white/60'}`}>Tous</button>
                  <button onClick={() => setActiveFilter(activeFilter === 'capucine' ? 'all' : 'capucine')} className={`snap-start flex-shrink-0 px-4 py-1.5 rounded-full text-[11px] font-black uppercase flex items-center gap-2 ${activeFilter === 'capucine' ? 'bg-[#FFD1DC] text-[#4A1040] shadow-md' : 'bg-white/5 border border-[#FFD1DC]/20 text-[#FFD1DC]/60'}`}>
                    <img src="https://i.imgur.com/lg1bkrO.png" alt="" className="w-3.5 h-3.5" />Capucines
                  </button>
                  <button onClick={() => setActiveFilter('coeur')} className={`snap-start flex-shrink-0 px-4 py-1.5 rounded-full text-[11px] font-black uppercase ${activeFilter === 'coeur' ? 'bg-red-500 text-white shadow-md' : 'bg-white/5 border border-white/10 text-white/60'}`}>❤️ Favoris</button>
                  <button onClick={() => setActiveFilter('top')} className={`snap-start flex-shrink-0 px-4 py-1.5 rounded-full text-[11px] font-black uppercase ${activeFilter === 'top' ? 'bg-[var(--color-primary)] text-black' : 'bg-white/5 border border-white/10 text-white/60'}`}>⭐️ Top</button>
                  {anneesDisponibles.map(annee => (
                    <button key={annee} onClick={() => setActiveFilter(annee)} className={`snap-start flex-shrink-0 px-4 py-1.5 rounded-full text-[11px] font-black uppercase ${activeFilter === annee ? 'bg-[var(--color-primary)] text-black' : 'bg-white/5 border border-white/10 text-white/60'}`}>{annee}</button>
                  ))}
                  <div className="flex-shrink-0 w-6 h-1"></div>
                </div>
              </div>
            </header>

            {/* LISTE DES CARTES FILMS */}
            <main className="px-6 pt-4 space-y-4">
              {/* ... ton code de mapping habituel ... */}
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
                        {film.note && <span className="text-[var(--color-primary)] font-black text-[11px] bg-[var(--color-primary-muted)] px-2 py-0.5 rounded-full border border-[var(--color-primary-muted)] shadow-sm">⭐{film.note}</span>}
                        {film.coupDeCoeur && <span className="text-sm">❤️</span>}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div className="h-6"></div>
            </main>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="animate-in fade-in duration-300">
            <header className="pt-[calc(env(safe-area-inset-top)+1rem)] px-6 pb-4 flex justify-between items-center z-40 sticky top-0 bg-black/5 backdrop-blur-2xl">
              <div><p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">Réglages</p><h1 className="font-syne text-2xl font-bold leading-none tracking-tight">Mon Profil</h1></div>
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
                    <div className="flex items-center gap-4"><div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-lg shadow-inner">⭐️</div><div><p className="text-sm font-bold text-white">Système de notation</p><p className="text-[10px] text-[var(--color-primary)] font-black uppercase mt-0.5">Échelle sur {ratingScale}</p></div></div>
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
                <button onClick={logout} className="w-full bg-red-500/10 border border-red-500/20 text-red-500 font-black py-4 rounded-3xl active:scale-95 transition-all uppercase text-xs flex items-center justify-center gap-2 shadow-lg"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>Se déconnecter</button>
              </div>
            </main>
          </div>
        )}
      </div>

      {films.length === 0 && (
        <>
          <button onClick={() => handleScan(userToken)} className="fixed right-3 w-14 h-14 rounded-full flex items-center justify-center active:scale-90 transition-all z-[80] shadow-2xl" style={{ background: theme.primary, color: theme.textOnAccent, bottom: 'calc(env(safe-area-inset-bottom) + 3rem)' }}>
            <svg className="w-6 h-6 ml-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242M12 12v9M8 17l4 4 4-4"></path></svg>
          </button>
          {/* TAB BAR - Unifiée et Descendue */}
      <nav className="fixed bottom-0 left-0 right-0 z-[80] bg-black/10 backdrop-blur-2xl border-t border-white/5">
        <div 
          className="flex justify-around items-end h-[calc(40px+env(safe-area-inset-bottom))] pb-[calc(env(safe-area-inset-bottom)-12px)] pt-[10px]"
        >
          {/* ACCUEIL */}
          <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center w-20 transition-all ${activeTab === 'home' ? 'text-[var(--color-primary)]' : 'text-white opacity-40'}`}>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill={activeTab === 'home' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10"/></svg>
            <span className="text-[8px] font-black uppercase mt-1 tracking-tighter">Accueil</span>
          </button>

          {/* BILLETS */}
          <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center w-20 transition-all ${activeTab === 'history' ? 'text-[var(--color-primary)]' : 'text-white opacity-40'}`}>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill={activeTab === 'history' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            <span className="text-[8px] font-black uppercase mt-1 tracking-tighter">Billets</span>
          </button>

          {/* PROFIL */}
          <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center w-20 transition-all ${activeTab === 'profile' ? 'text-[var(--color-primary)]' : 'text-white opacity-40'}`}>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill={activeTab === 'profile' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span className="text-[8px] font-black uppercase mt-1 tracking-tighter">Profil</span>
          </button>
        </div>
      </nav>
        </>
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