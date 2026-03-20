import { useGoogleLogin } from '@react-oauth/google';
import { useState, useEffect } from 'react';
import { getFilmsANoter } from './api';
import Notation from './pages/Notation';
import { saveFilmToSheet, getProchainNumeroSeance, getStats, getFullHistory, getMissingPosterFromTMDB } from './api';

// --- DICTIONNAIRE DES THÈMES (Allégé pour le design immersif) ---
const THEME_COLORS = {
  'dark-grey': {
    bg:               '#08090F',
    bgGradient:       'linear-gradient(160deg, #08090F 0%, #0D0E18 100%)',
    surfaceOverlay:   'rgba(0,0,0,0.65)',
    text:             '#FFFFFF',
    textOnAccent:     '#08090F',
    primary:          '#D4AF37',
    primaryHover:     '#F5CC2A',
    primaryMuted:     'rgba(212,175,55,0.12)',
    shadowStrong:     '0 8px 40px rgba(0,0,0,0.75)',
  },
  'velvet-red': {
    bg:               '#7A0A0A',
    bgGradient:       'linear-gradient(135deg, #7A0A0A 0%, #520606 100%)',
    surfaceOverlay:   'rgba(0,0,0,0.70)',
    text:             '#FFFFFF',
    textOnAccent:     '#1A0000',
    primary:          '#FFD700',
    primaryHover:     '#FFE44D',
    primaryMuted:     'rgba(255,215,0,0.15)',
    shadowStrong:     '0 8px 40px rgba(0,0,0,0.80)',
  },
  'pine-green': {
    bg:               '#0A4D3C',
    bgGradient:       'linear-gradient(135deg, #0A4D3C 0%, #063227 100%)',
    surfaceOverlay:   'rgba(0,0,0,0.65)',
    text:             '#FFFFFF',
    textOnAccent:     '#021A13',
    primary:          '#A8E063',
    primaryHover:     '#BFEE80',
    primaryMuted:     'rgba(168,224,99,0.15)',
    shadowStrong:     '0 8px 40px rgba(0,0,0,0.75)',
  },
  'coffee-cream': {
    bg:               '#382618',
    bgGradient:       'linear-gradient(135deg, #382618 0%, #4E3218 100%)',
    surfaceOverlay:   'rgba(20,10,5,0.70)',
    text:             '#FAEDCD',
    textOnAccent:     '#2C1A0E',
    primary:          '#CF9060',
    primaryHover:     '#E0A878',
    primaryMuted:     'rgba(207,144,96,0.18)',
    shadowStrong:     '0 8px 40px rgba(0,0,0,0.75)',
  },
  'pearl-white': {
    bg:               '#FAF8F3',
    bgGradient:       'linear-gradient(135deg, #FFFFFF 0%, #EDE8DC 100%)',
    surfaceOverlay:   'rgba(0,0,0,0.50)',
    text:             '#1C1C1E',
    textOnAccent:     '#FFFFFF',
    primary:          '#A07800',
    primaryHover:     '#8A6600',
    primaryMuted:     'rgba(160,120,0,0.12)',
    shadowStrong:     '0 8px 40px rgba(0,0,0,0.18)',
  },
  'ocean-blue': {
    bg:               '#0A2463',
    bgGradient:       'linear-gradient(135deg, #0A2463 0%, #0D3B7A 50%, #1E5B8E 100%)',
    surfaceOverlay:   'rgba(0,10,40,0.70)',
    text:             '#FFFFFF',
    textOnAccent:     '#000D2E',
    primary:          '#4FC3F7',
    primaryHover:     '#81D4FA',
    primaryMuted:     'rgba(79,195,247,0.15)',
    shadowStrong:     '0 8px 40px rgba(0,0,0,0.75)',
  },
  'rose-quartz': {
    bg:               '#4A1040',
    bgGradient:       'linear-gradient(135deg, #4A1040 0%, #7B2560 100%)',
    surfaceOverlay:   'rgba(0,0,0,0.65)',
    text:             '#FFFFFF',
    textOnAccent:     '#2A0018',
    primary:          '#F9A8D4',
    primaryHover:     '#FBC8E4',
    primaryMuted:     'rgba(249,168,212,0.15)',
    shadowStrong:     '0 8px 40px rgba(0,0,0,0.75)',
  },
  'golden-age': {
    bg:               '#FCFAF5',
    bgGradient:       'linear-gradient(135deg, #FFF8E7 0%, #F0E4CC 100%)',
    surfaceOverlay:   'rgba(252,250,245,0.85)',
    text:             '#4A3B22',
    textOnAccent:     '#2C1A00',
    primary:          '#B8830A',
    primaryHover:     '#9A6E08',
    primaryMuted:     'rgba(184,131,10,0.14)',
    shadowStrong:     '0 8px 40px rgba(74,59,34,0.15)',
  },
  'pride': {
    bg:               '#1A1A2E',
    bgGradient:       'linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)',
    surfaceOverlay:   'rgba(0,0,0,0.68)',
    text:             '#FFFFFF',
    textOnAccent:     '#1A1A2E',
    primary:          '#B794F4',
    primaryHover:     '#C9A8FF',
    primaryMuted:     'rgba(183,148,244,0.15)',
    headerBg:         'linear-gradient(90deg, #E40303 0%, #FF8C00 20%, #FFED00 40%, #008026 60%, #004DFF 80%, #750787 100%)',
    navbarBg:         'rgba(10,10,22,0.94)',
    shadowStrong:     '0 8px 40px rgba(0,0,0,0.80)',
  },
};

const SmartPoster = ({ afficheInitiale, titre, className = "w-20 h-full" }) => {
  const [posterUrl, setPosterUrl] = useState(null);

  useEffect(() => {
    const hasValidUrl = typeof afficheInitiale === 'string' && afficheInitiale.startsWith('http');
    if (hasValidUrl) {
      setPosterUrl(afficheInitiale);
    } else if (titre) {
      getMissingPosterFromTMDB(titre).then((url) => {
        if (url) setPosterUrl(url);
      });
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
  
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState('newest'); 
  const [selectedFilm, setSelectedFilm] = useState(null); 
  const [displayCount, setDisplayCount] = useState(15); 

  useEffect(() => {
    setDisplayCount(15);
  }, [activeFilter, searchQuery, sortOrder]);

  useEffect(() => {
    if (userToken && spreadsheetId && activeTab === 'home') {
      getStats(userToken, spreadsheetId).then((data) => setStats(data));
    }
  }, [userToken, spreadsheetId, activeTab]);

  useEffect(() => {
    if (userToken && spreadsheetId && activeTab === 'history' && historyData.length === 0) {
      setIsLoadingHistory(true);
      getFullHistory(userToken, spreadsheetId).then((data) => {
        setHistoryData(data);
        setIsLoadingHistory(false);
      });
    }
  }, [userToken, spreadsheetId, activeTab, historyData.length]);

  const login = useGoogleLogin({
    onSuccess: (codeResponse) => {
      const token = codeResponse.access_token;
      setUserToken(token);
      localStorage.setItem('google_token', token);
      if (spreadsheetId) handleScan(token);
    },
    scope: "https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/userinfo.profile",
  });

  const handleScan = async (token) => {
    setIsSearching(true);
    const found = await getFilmsANoter(token);
    setFilms(found);
    setIsSearching(false);
  };

  useEffect(() => {
    if (userToken && spreadsheetId && films.length === 0 && !isSearching) {
      handleScan(userToken);
    }
  }, [userToken, spreadsheetId]);

  const logout = () => {
    localStorage.clear();
    setUserToken(null);
    setSpreadsheetId("");
    setFilms([]);
  };

  const anneesDisponibles = [...new Set(historyData.map(f => {
    if (!f.date) return null;
    const parts = f.date.split('/');
    return parts.length === 3 ? parts[2] : null;
  }).filter(Boolean))].sort((a, b) => b - a);

  let filteredHistory = historyData.filter(film => {
    let categoryMatch = true;
    if (activeFilter === 'coeur') categoryMatch = film.coupDeCoeur;
    else if (activeFilter === 'capucine') categoryMatch = film.capucine;
    else if (activeFilter === 'top') categoryMatch = Number(film.note) >= 4;
    else if (anneesDisponibles.includes(activeFilter)) categoryMatch = film.date?.endsWith(activeFilter);
    let searchMatch = true;
    if (searchQuery) searchMatch = film.titre.toLowerCase().includes(searchQuery.toLowerCase());
    return categoryMatch && searchMatch;
  });

  filteredHistory.sort((a, b) => {
    if (sortOrder === 'top') return (Number(b.note) || 0) - (Number(a.note) || 0);
    const getTime = (dateStr) => {
      if (!dateStr) return 0;
      const p = dateStr.split('/');
      return p.length === 3 ? new Date(p[2], p[1] - 1, p[0]).getTime() : 0;
    };
    if (sortOrder === 'oldest') return getTime(a.date) - getTime(b.date);
    return getTime(b.date) - getTime(a.date);
  });

  if (!userToken) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 transition-colors duration-500" style={{ background: theme.bgGradient, color: theme.text }}>
        <h1 className="text-5xl font-black mb-8 tracking-tighter italic uppercase">Grand Écran</h1>
        <button onClick={() => login()} className="font-bold py-4 px-10 rounded-full active:scale-95 transition-all" style={{ background: theme.primary, color: theme.textOnAccent }}>
          CONNEXION GOOGLE
        </button>
      </div>
    );
  }

  if (!spreadsheetId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center transition-colors duration-500" style={{ background: theme.bgGradient, color: theme.text }}>
        <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-4">Configuration</h2>
        <form onSubmit={(e) => { e.preventDefault(); const id = e.target.sheetId.value; setSpreadsheetId(id); localStorage.setItem('grandecran_db_id', id); if (userToken) handleScan(userToken); }} className="w-full max-w-sm flex flex-col gap-4">
          <input name="sheetId" type="text" placeholder="ID du Spreadsheet" required className="bg-white/10 border border-white/20 p-4 rounded-2xl outline-none text-center" />
          <button type="submit" className="font-black py-4 rounded-2xl uppercase tracking-widest" style={{ background: theme.primary, color: theme.textOnAccent }}>Enregistrer l'ID</button>
        </form>
      </div>
    );
  }

  // Écran de chargement Shimmer affiché en plein écran
  if (isSearching) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 transition-colors duration-500 overflow-hidden relative" style={{ background: theme.bgGradient, color: theme.text }}>
        <div className="relative mb-8">
          <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ background: theme.primary }}></div>
          <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center relative z-10" style={{ color: theme.primary, boxShadow: `0 0 30px ${theme.primary}40` }}>
            <svg className="w-8 h-8 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path>
              <path d="M12 12v9"></path>
              <path d="M8 17l4 4 4-4"></path>
            </svg>
          </div>
        </div>

        <p className="font-syne text-xl font-bold mb-2">Recherche de billets</p>
        <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-10">Analyse de la boîte mail...</p>

        <div className="w-full max-w-sm space-y-4 opacity-60">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex bg-white/5 border border-white/10 rounded-2xl relative overflow-hidden h-24 w-full">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent z-10" style={{ animationDelay: `${i * 0.2}s` }}></div>
              <div className="w-16 h-full bg-white/5 flex-shrink-0"></div>
              <div className="flex-1 flex flex-col justify-center py-3 px-4 gap-3">
                <div className="h-3 bg-white/10 rounded-md w-3/4"></div>
                <div className="h-2 bg-white/10 rounded-md w-1/3 mb-1"></div>
                <div className="flex gap-2 mt-auto">
                  <div className="h-3 bg-white/10 rounded-full w-10"></div>
                  <div className="h-3 bg-white/10 rounded-full w-8"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- LAYOUT PRINCIPAL AVEC THÈME DYNAMIQUE ---
  return (
    <div 
      className="h-[100dvh] w-full font-sans flex flex-col overflow-hidden transition-colors duration-500 relative"
      style={{ 
        background: theme.bgGradient, 
        color: theme.text,
        '--color-primary': theme.primary,
        '--color-primary-muted': theme.primaryMuted,
        '--color-text-on-accent': theme.textOnAccent,
        '--color-bg': theme.bg
      }}
    >
      <div 
        className="flex-1 overflow-y-auto pb-[calc(3.5rem+env(safe-area-inset-bottom))] scrollbar-hide"
        onScroll={(e) => {
          const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
          if (scrollHeight - scrollTop <= clientHeight + 150) setDisplayCount(prev => prev + 15);
        }}
      >
        
        {/* ONGLET 1 : DASHBOARD */}
        {activeTab === 'home' && (
          <div className="animate-in fade-in duration-300">
            <header className="pt-[calc(env(safe-area-inset-top)+1rem)] px-6 pb-4 flex justify-between items-center z-40 sticky top-0 bg-black/5 backdrop-blur-2xl transition-all duration-500">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">Mon compte</p>
                <h1 className="font-syne text-2xl font-bold leading-none tracking-tight">Cinéphile</h1>
              </div>
            </header>

            <main className="px-6 pt-6 space-y-8">
              <div>
                <h2 className="font-syne text-3xl font-bold mb-8 mt-2">Content de te revoir ! 🍿</h2>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-5 ml-2">
                  <svg className="w-4 h-4 text-white/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20v-6M6 20V10M18 20V4"></path></svg>
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/50">Mes Statistiques</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col justify-between aspect-square">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Films vus</span>
                    <p className="font-syne text-5xl font-bold text-[var(--color-primary)]">{stats.totalFilms}</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col justify-between aspect-square">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Coups de ❤️</span>
                    <p className="font-syne text-5xl font-bold text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]">{stats.coupsDeCoeur}</p>
                  </div>
                </div>
              </div>
              <div className="h-4"></div>
            </main>
          </div>
        )}

        {/* ONGLET 2 : HISTORIQUE */}
        {activeTab === 'history' && (
          <div className="animate-in fade-in duration-300">
            <header className="pt-[calc(env(safe-area-inset-top)+1rem)] z-40 sticky top-0 bg-black/5 backdrop-blur-2xl transition-all duration-500">
              <div className="px-6 pb-4 flex justify-between items-center relative">
                <div className={`flex w-full justify-between items-center transition-all duration-300 ease-out ${isSearchOpen ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100 pointer-events-auto'}`}>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">{filteredHistory.length} film{filteredHistory.length > 1 ? 's' : ''} trouvé{filteredHistory.length > 1 ? 's' : ''}</p>
                    <h1 className="font-syne text-2xl font-bold leading-none tracking-tight">Mes Billets</h1>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : prev === 'oldest' ? 'top' : 'newest')} className="w-10 h-10 flex items-center justify-center rounded-full text-white/70 active:bg-white/10 transition-colors">
                      {sortOrder === 'newest' ? <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M19 12l-7 7-7-7"/></svg> : sortOrder === 'oldest' ? <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg> : <span className="text-lg">⭐</span>}
                    </button>
                    <div className="w-10 h-10 flex-shrink-0"></div>
                  </div>
                </div>

                <div className={`absolute right-6 flex items-center border transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden ${isSearchOpen ? 'w-[calc(100%-3rem)] h-10 px-4 rounded-full bg-white/10 border-white/20 shadow-lg' : 'w-10 h-10 px-0 rounded-full bg-transparent border-transparent'}`}>
                  <button onClick={() => { setIsSearchOpen(true); setTimeout(() => document.getElementById('searchInput')?.focus(), 50); }} className={`flex items-center justify-center flex-shrink-0 transition-colors ${isSearchOpen ? 'text-[var(--color-primary)] w-5 h-full cursor-default pointer-events-none' : 'w-10 h-10 text-white/70 active:bg-white/10 rounded-full cursor-pointer'}`}>
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                  </button>
                  <input id="searchInput" type="text" placeholder="Titre du film..." className={`bg-transparent text-sm w-full outline-none text-white placeholder-white/40 font-bold ml-2 transition-all duration-300 ${isSearchOpen ? 'opacity-100 delay-100' : 'opacity-0 pointer-events-none'}`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                  <button onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }} className={`flex-shrink-0 p-1 text-white/50 hover:text-white transition-all duration-300 ${isSearchOpen ? 'opacity-100 delay-100 scale-100' : 'opacity-0 scale-50 pointer-events-none'}`}>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </div>
              </div>

              <div className="flex overflow-x-auto gap-2 px-6 pb-4 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <button onClick={() => setActiveFilter('all')} className={`snap-start whitespace-nowrap px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${activeFilter === 'all' ? 'bg-white/90 text-black' : 'bg-white/10 text-white/70 active:bg-white/20'}`}>Tous</button>
                <button onClick={() => setActiveFilter(activeFilter === 'coeur' ? 'all' : 'coeur')} className={`snap-start whitespace-nowrap px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${activeFilter === 'coeur' ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'bg-white/10 text-white/70 active:bg-white/20'}`}>❤️ Coups de cœur</button>
                <button onClick={() => setActiveFilter(activeFilter === 'top' ? 'all' : 'top')} className={`snap-start whitespace-nowrap px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${activeFilter === 'top' ? 'bg-[var(--color-primary)] text-[var(--color-text-on-accent)]' : 'bg-white/10 text-white/70 active:bg-white/20'}`} style={{ boxShadow: activeFilter === 'top' ? `0 0 15px ${theme.primary}80` : 'none' }}>⭐️ Top 4+</button>
                {anneesDisponibles.map(annee => (
                  <button key={annee} onClick={() => setActiveFilter(activeFilter === annee ? 'all' : annee)} className={`snap-start whitespace-nowrap px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${activeFilter === annee ? 'bg-[var(--color-primary)] text-[var(--color-text-on-accent)]' : 'bg-white/10 text-white/70 active:bg-white/20'}`}>{annee}</button>
                ))}
              </div>
            </header>

            <main className="px-6 pt-4 pb-4 space-y-4">
              {isLoadingHistory ? (
                <>
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex bg-white/5 border border-white/10 rounded-2xl relative overflow-hidden h-28">
                      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent z-10"></div>
                      <div className="w-20 h-full bg-white/10 flex-shrink-0"></div>
                      <div className="flex-1 flex flex-col justify-center py-3 px-4 gap-3">
                        <div className="h-4 bg-white/10 rounded-md w-3/4"></div><div className="h-3 bg-white/10 rounded-md w-1/3 mb-2"></div>
                        <div className="flex gap-2 mt-auto"><div className="h-4 bg-white/10 rounded-full w-12"></div><div className="h-4 bg-white/10 rounded-full w-10"></div></div>
                      </div>
                    </div>
                  ))}
                </>
              ) : filteredHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-white/40 text-center animate-in fade-in zoom-in-95 duration-300"><span className="text-6xl mb-4 block opacity-50">🎟️</span><p className="font-syne text-xl font-bold">Aucun billet trouvé</p></div>
              ) : (
                filteredHistory.slice(0, displayCount).map((film, index) => (
                  <div key={index} onClick={() => setSelectedFilm(film)} className="flex bg-white/5 border border-white/10 rounded-2xl relative overflow-hidden active:scale-[0.98] transition-transform h-28 cursor-pointer">
                    {film.numero && <div className="absolute top-0 right-0 bg-[var(--color-primary-muted)] text-[var(--color-primary)] border-b border-l border-[var(--color-primary-muted)] text-[9px] font-black px-2 py-1 rounded-bl-lg z-10">#{film.numero}</div>}
                    <SmartPoster afficheInitiale={film.affiche} titre={film.titre} />
                    <div className="flex-1 flex flex-col justify-center py-3 px-4">
                      <h4 className="font-syne font-bold text-lg leading-tight mb-1 pr-6 line-clamp-2">{film.titre}</h4>
                      <div className="flex items-center gap-2 mb-2"><p className="text-white/50 text-[11px] font-bold uppercase tracking-wider">{film.date}</p></div>
                      <div className="flex items-center gap-2 mt-auto">
                        <span className="bg-white/10 border border-white/10 text-white/70 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest">{film.genre}</span>
                        {film.note && <span className="text-[var(--color-primary)] font-black text-xs flex items-center gap-1 bg-[var(--color-primary-muted)] px-2 py-0.5 rounded-full border border-[var(--color-primary-muted)] shadow-sm"><svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>{film.note}</span>}
                        {film.coupDeCoeur && <span className="text-red-500 text-sm drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]">❤️</span>}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div className="h-6"></div>
            </main>

            {selectedFilm && (
              <div className="fixed inset-0 z-[60] flex items-end justify-center overflow-hidden">
                <div className="absolute inset-0 backdrop-blur-sm animate-fade-in" style={{ background: theme.surfaceOverlay }} onClick={() => setSelectedFilm(null)}></div>
                <div className="relative w-full rounded-t-[32px] p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] animate-slide-in-bottom border-t border-white/10 shadow-[0_-20px_60px_rgba(0,0,0,0.9)] max-h-[85vh] overflow-y-auto bg-[#111]">
                  <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6"></div>
                  <div className="flex gap-5 mb-6">
                    <div className="w-24 h-36 rounded-xl overflow-hidden bg-white/5 flex-shrink-0 border border-white/10">
                       <SmartPoster afficheInitiale={selectedFilm.affiche} titre={selectedFilm.titre} className="w-full h-full" />
                    </div>
                    <div className="flex flex-col justify-center flex-1">
                      {selectedFilm.numero && <span className="text-[var(--color-primary)] text-[10px] font-black uppercase tracking-widest mb-1">Séance #{selectedFilm.numero}</span>}
                      <h2 className="font-syne text-2xl font-bold leading-tight mb-3">{selectedFilm.titre}</h2>
                      <div className="flex flex-wrap gap-2">
                        {selectedFilm.note && <span className="bg-[var(--color-primary-muted)] text-[var(--color-primary)] border border-[var(--color-primary-muted)] px-2 py-1 rounded-md text-[10px] font-black tracking-widest flex items-center gap-1">⭐ {selectedFilm.note}/5</span>}
                        {selectedFilm.langue && <span className="bg-white/10 text-white/70 px-2 py-1 rounded-md text-[10px] font-black tracking-widest uppercase">{selectedFilm.langue}</span>}
                        {selectedFilm.duree && <span className="bg-white/10 text-white/70 px-2 py-1 rounded-md text-[10px] font-black tracking-widest uppercase">{selectedFilm.duree}</span>}
                      </div>
                    </div>
                  </div>
                  {selectedFilm.commentaire && (
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-5 relative">
                      <span className="absolute -top-3 left-4 text-3xl opacity-20 text-[var(--color-primary)]">"</span>
                      <p className="text-sm italic text-white/90 leading-relaxed relative z-10">{selectedFilm.commentaire}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                      <span className="block text-[9px] uppercase tracking-widest text-white/40 mb-1">Salle & Siège</span>
                      <span className="font-bold text-base block">{selectedFilm.salle || "?"}</span>
                      <span className="font-bold text-sm text-white/60">Place {selectedFilm.siege || "?"}</span>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/10 flex flex-col justify-center">
                      <span className="block text-[9px] uppercase tracking-widest text-white/40 mb-1">Dépense</span>
                      <span className="font-bold text-2xl text-[var(--color-primary)]">{selectedFilm.depense ? `${selectedFilm.depense}€` : '--'}</span>
                    </div>
                  </div>
                  <button onClick={() => setSelectedFilm(null)} className="w-full py-4 mt-2 bg-white/10 rounded-2xl font-black text-xs uppercase tracking-widest active:bg-white/20 transition-all">Fermer</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ONGLET 3 : PROFIL */}
        {activeTab === 'profile' && (
          <div className="animate-in fade-in duration-300">
            <header className="pt-[calc(env(safe-area-inset-top)+1rem)] px-6 pb-4 flex justify-between items-center z-40 sticky top-0 bg-black/5 backdrop-blur-2xl transition-all duration-500">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">Réglages</p>
                <h1 className="font-syne text-2xl font-bold leading-none tracking-tight">Mon Profil</h1>
              </div>
            </header>

            <main className="px-6 pt-6 pb-4 space-y-8">
              <div className="flex items-center gap-5 bg-white/5 p-5 rounded-3xl border border-white/10">
                <div className="w-20 h-20 rounded-full bg-[var(--color-primary-muted)] flex items-center justify-center text-4xl border border-[var(--color-primary-muted)] transition-colors duration-500" style={{ boxShadow: `0 0 20px ${theme.primaryMuted}` }}>👤</div>
                <div>
                  <h2 className="font-syne text-2xl font-bold">Cinéphile</h2>
                  <p className="text-white/50 text-xs mt-1">Connecté via Google</p>
                  <span className="inline-block mt-2 bg-[var(--color-primary-muted)] text-[var(--color-primary)] text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md border border-[var(--color-primary-muted)] transition-colors duration-500">Membre VIP</span>
                </div>
              </div>

              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-3 ml-2">Thème de l'application</h3>
                <div className="bg-white/5 border border-white/10 rounded-3xl p-5 flex gap-4 overflow-x-auto snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {Object.entries(THEME_COLORS).map(([key, t]) => (
                    <button
                      key={key}
                      onClick={() => { setCurrentThemeKey(key); localStorage.setItem('grandecran_theme', key); }}
                      className={`snap-start flex-shrink-0 w-10 h-10 rounded-full cursor-pointer transition-all duration-300 ${currentThemeKey === key ? 'ring-2 ring-white/50 ring-offset-2 scale-110' : 'opacity-50 hover:opacity-100 active:scale-95'}`}
                      style={{ background: t.bgGradient, border: `2px solid ${t.primary}`, boxShadow: currentThemeKey === key ? `0 0 15px ${t.primary}80` : 'none', '--tw-ring-offset-color': theme.bg }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-3 ml-2">Base de données (Google Sheet)</h3>
                <form onSubmit={(e) => { e.preventDefault(); const id = e.target.newSheetId.value; setSpreadsheetId(id); localStorage.setItem('grandecran_db_id', id); setHistoryData([]); alert('ID mis à jour !'); }} className="bg-white/5 border border-white/10 rounded-3xl p-5 flex flex-col gap-3">
                  <label className="text-xs text-white/70">ID du Spreadsheet :</label>
                  <input name="newSheetId" type="text" defaultValue={spreadsheetId} className="bg-black/50 border border-white/20 p-3 rounded-xl outline-none text-sm font-mono text-white/80 transition-colors w-full focus:border-[var(--color-primary)]" />
                  <button type="submit" className="bg-white/10 text-white text-xs font-bold py-3 rounded-xl uppercase tracking-widest mt-2 active:bg-white/20 transition-all">Mettre à jour</button>
                </form>
              </div>

              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-red-500/50 mb-3 ml-2">Zone Danger</h3>
                <button onClick={logout} className="w-full bg-red-500/10 border border-red-500/20 text-red-500 font-black py-4 rounded-3xl active:scale-95 transition-all uppercase tracking-widest text-sm flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                  Se déconnecter
                </button>
              </div>
              <div className="h-6"></div>
            </main>
          </div>
        )}
      </div>

      {/* BOUTON FLOTTANT (FAB) GLOBALE POUR LE SCAN */}
      <button 
        onClick={() => handleScan(userToken)}
        className="fixed right-6 w-14 h-14 rounded-full flex items-center justify-center active:scale-90 transition-all z-50"
        style={{ 
          background: theme.primary, 
          color: theme.textOnAccent,
          boxShadow: `0 8px 30px ${theme.primary}60`,
          bottom: 'calc(env(safe-area-inset-bottom) + 4.5rem)' 
        }}
      >
        <svg className="w-6 h-6 ml-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path>
          <path d="M12 12v9"></path>
          <path d="M8 17l4 4 4-4"></path>
        </svg>
      </button>

      {/* LA TAB BAR : Discrète et sans bordure */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/10 backdrop-blur-2xl transition-all duration-500 pb-[max(env(safe-area-inset-bottom)-8px,0px)] pt-1.5">
        <div className="flex justify-around items-center h-12 px-4">
          <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center justify-center w-16 transition-all duration-200 ${activeTab === 'home' ? 'text-[var(--color-primary)] opacity-100' : 'text-white opacity-40 hover:opacity-70'}`}>
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill={activeTab === 'home' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            <span className="text-[9px] font-bold tracking-widest uppercase mt-0.5">Accueil</span>
          </button>
          <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center justify-center w-16 transition-all duration-200 ${activeTab === 'history' ? 'text-[var(--color-primary)] opacity-100' : 'text-white opacity-40 hover:opacity-70'}`}>
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill={activeTab === 'history' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            <span className="text-[9px] font-bold tracking-widest uppercase mt-0.5">Billets</span>
          </button>
          <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center justify-center w-16 transition-all duration-200 ${activeTab === 'profile' ? 'text-[var(--color-primary)] opacity-100' : 'text-white opacity-40 hover:opacity-70'}`}>
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill={activeTab === 'profile' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            <span className="text-[9px] font-bold tracking-widest uppercase mt-0.5">Profil</span>
          </button>
        </div>
      </nav>

      {/* ✅ OVERLAY DE NOTATION : Placé APRÈS le reste du layout pour couvrir toute l'app */}
      {films.length > 0 && (
          <Notation 
            key={films[0].titre || films.length} 
            films={films} 
            token={userToken} 
            spreadsheetId={spreadsheetId} 
            isExiting={isExitingNotation} 
            onSaved={() => { 
                setFilms(prev => prev.slice(1)); 
                setHistoryData([]); 
            }} 
            onSkip={() => {
                setIsExitingNotation(true);
                setTimeout(() => {
                    setFilms([]); 
                    setIsExitingNotation(false); 
                }, 500); 
            }} 
          />
      )}
    </div>
  );
}

export default App;