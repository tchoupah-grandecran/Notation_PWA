import { useState, useEffect } from 'react';
import { THEME_COLORS, THEME_TOKENS, AVATAR_PRESETS } from './constants';
import { useAuth } from './hooks/useAuth';
import { usePreferences } from './hooks/usePreferences';
import { useHistory } from './hooks/useHistory';

// Import de l'API
import * as api from './api';

import PendingRatingToast from './components/PendingRatingToast';
import { NavBar } from './components/NavBar';
import { FilmDetailModal } from './components/FilmDetailModal';
import { Dashboard } from './pages/Dashboard';
import { History } from './pages/History';
import { Profile } from './pages/Profile';
import { Studio } from './pages/Studio';
import Notation from './pages/Notation';

// Grain Component
const PaperGrain = () => (
  <div 
    className="fixed inset-0 pointer-events-none z-[9999] h-full w-full"
    style={{ 
      backgroundImage: 'var(--theme-grain-url)', 
      opacity: 'var(--theme-grain-opacity)',
      mixBlendMode: 'multiply' 
    }} 
  />
);

// Screens (Welcome, Scanning, Onboarding) restent identiques en logique mais utilisent les tokens
function WelcomeScreen({ login }) {
  const isReturning = !!localStorage.getItem('grandecran_username');
  const savedName   = localStorage.getItem('grandecran_username') || 'Cinéphile';
  const DARK = THEME_COLORS.dark;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center relative overflow-hidden" style={{ background: DARK.bg, color: DARK.text, ...THEME_TOKENS('dark') }}>
      <PaperGrain />
      <div className="relative z-10">
        <div className="w-24 h-24 mb-6 rounded-full flex items-center justify-center mx-auto" style={{ background: DARK.surface, border: `2px solid ${DARK.accent}` }}>
          <span className="text-4xl">🍿</span>
        </div>
        <h1 className="font-galinoy text-5xl mb-2 italic">Grand Écran</h1>
        <p className="mb-10 opacity-60">{isReturning ? `Heureux de te revoir, ${savedName}` : "Ton journal cinématographique"}</p>
        <button onClick={() => login()} className="font-black py-4 px-10 rounded-full transition-all active:scale-95" style={{ background: DARK.accent, color: DARK.bg }}>
          {isReturning ? 'RECONNEXION' : 'CONNEXION GOOGLE'}
        </button>
      </div>
    </div>
  );
}

function App() {
  const [spreadsheetId, setSpreadsheetId] = useState(localStorage.getItem('grandecran_db_id') || '');
  const [activeTab, setActiveTab]       = useState('home');
  const [isScrolled, setIsScrolled]     = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [selectedFilm, setSelectedFilm] = useState(null);
  const [displayCount, setDisplayCount] = useState(15);
  const [films, setFilms]             = useState([]);
  const [nextFilm, setNextFilm]       = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSearching, setIsSearching]           = useState(false);
  const [isExitingNotation, setIsExitingNotation] = useState(false);

  const { userToken, login, logout: authLogout } = useAuth((token) => {
    if (spreadsheetId) handleScan(token);
  });

  // 1. On récupère TOUTES les prefs (isDark ET themeMode)
  const prefs = usePreferences(userToken, spreadsheetId);
  
  // 2. Définition du thème dynamique
  const themeKey = prefs.isDark ? 'dark' : 'light';
  const theme    = THEME_COLORS[themeKey];
  const tokens   = THEME_TOKENS(themeKey);

  const { historyData, isLoadingHistory, loadHistory, loadStats, invalidate } = useHistory(userToken, spreadsheetId);

  useEffect(() => { prefs.syncFromCloud(); }, [userToken, spreadsheetId]);
  useEffect(() => { if (userToken && spreadsheetId && historyData.length === 0) loadHistory(); }, [userToken, spreadsheetId]);
  useEffect(() => { if (userToken && spreadsheetId && activeTab === 'home') loadStats(); }, [userToken, spreadsheetId, activeTab]);

  const handleScan = async (token = userToken) => {
    if (!token) return;
    setIsSearching(true);
    try {
      const found = await api.getFilmsANoter(token);
      setFilms(found);
      setNextFilm(found?.[0] || null);
      setPendingCount(found?.length || 0);
    } catch (err) { authLogout(); }
    setIsSearching(false);
  };

  const handleLogout = () => {
    authLogout(); setFilms([]); setNextFilm(null); setPendingCount(0); invalidate();
  };

  const handleEditSpreadsheet = (newId) => {
    if (newId && newId !== spreadsheetId) {
      setSpreadsheetId(newId);
      localStorage.setItem('grandecran_db_id', newId);
      window.location.reload();
    }
  };

  if (!userToken) return <WelcomeScreen login={login} />;
  if (isSearching) return <div style={{ background: theme.bg, ...tokens }} className="min-h-screen flex items-center justify-center"><PaperGrain /><p className="font-galinoy animate-pulse">Scan en cours...</p></div>;

  return (
    <div
      className="h-[100dvh] w-full font-outfit flex flex-col overflow-hidden transition-colors duration-700 relative"
      style={{ background: theme.bg, color: theme.text, ...tokens }}
    >
      <PaperGrain />

      <div
        id="main-scroll-container"
        className="flex-1 overflow-y-auto scrollbar-hide relative z-10"
        style={{ paddingBottom: 'var(--navbar-total-height)' }}
        onScroll={(e) => {
  const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
  setScrollY(scrollTop);                        // ← new
  if (activeTab === 'history' && scrollHeight - scrollTop <= clientHeight + 150)
    setDisplayCount(prev => prev + 15);
}}
      >
        {activeTab === 'home' && films.length === 0 && (
          <Dashboard {...{historyData, isScrolled, handleScan, setActiveTab, setSelectedFilm}} 
            ratingScale={prefs.ratingScale} pricing={prefs.pricing} userAvatar={prefs.userAvatar} userName={prefs.userName} isDark={prefs.isDark} 
          />
        )}

        {activeTab === 'history' && (
          <History {...{historyData, isLoadingHistory, isScrolled, handleScan, setSelectedFilm, displayCount, setDisplayCount}} 
            ratingScale={prefs.ratingScale} isDark={prefs.isDark} 
          />
        )}

        {activeTab === 'profile' && (
          <Profile
            isScrolled={isScrolled}
            handleScan={handleScan}
            userName={prefs.userName}
            userAvatar={prefs.userAvatar}
            // CRUCIAL : On passe les DEUX variables de thème
            isDark={prefs.isDark}
            themeMode={prefs.themeMode} 
            toggleDarkMode={prefs.toggleDarkMode}
            ratingScale={prefs.ratingScale}
            pricing={prefs.pricing}
            spreadsheetId={spreadsheetId}
            historyData={historyData}
            updateUserName={prefs.updateUserName}
            updateAvatar={prefs.updateAvatar}
            updateRatingScale={prefs.updateRatingScale}
            updatePricing={prefs.updatePricing}
            triggerCloudSave={prefs.triggerCloudSave}
            onEditSpreadsheet={handleEditSpreadsheet}
            onLogout={handleLogout}
          />
        )}

        {activeTab === 'studio' && <Studio historyData={historyData} ratingScale={prefs.ratingScale} userName={prefs.userName} userAvatar={prefs.userAvatar} isScrolled={isScrolled} pendingFilm={nextFilm} />}
      </div>

      {nextFilm && films.length === 0 && <PendingRatingToast film={nextFilm} count={pendingCount} onOpen={() => setFilms([nextFilm])} />}
      
      {films.length === 0 && <NavBar activeTab={activeTab} setActiveTab={setActiveTab} isDark={prefs.isDark} />}

      {selectedFilm && <FilmDetailModal film={selectedFilm} onClose={() => setSelectedFilm(null)} ratingScale={prefs.ratingScale} isDark={prefs.isDark} />}

      {films.length > 0 && (
        <Notation 
          films={films} token={userToken} spreadsheetId={spreadsheetId} ratingScale={prefs.ratingScale} isDark={prefs.isDark}
          onSaved={() => { setFilms(prev => prev.slice(1)); invalidate(); loadHistory(); }}
          onSkip={() => setFilms([])}
        />
      )}
    </div>
  );
}

export default App;