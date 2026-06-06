import { useState, useEffect, useCallback } from 'react';
import { THEME_COLORS, THEME_TOKENS } from './constants';
import { useAuth } from './hooks/useAuth';
import { usePreferences } from './hooks/usePreferences';
import { useHistory } from './hooks/useHistory';

import * as api from './api';

import { AppHeader } from './components/AppHeader';
import { FilmDetailModal } from './components/FilmDetailModal';
import { Dashboard } from './pages/Dashboard';
import { History } from './pages/History';
import { Profile } from './pages/Profile';
import { Studio } from './pages/Studio';
import Notation from './pages/Notation';

/* ─── Grain overlay ───────────────────────────────────────────────── */
const PaperGrain = () => (
  <div
    className="fixed inset-0 pointer-events-none z-[9999] h-full w-full"
    style={{
      backgroundImage: 'var(--theme-grain-url)',
      opacity: 'var(--theme-grain-opacity)',
      mixBlendMode: 'multiply',
    }}
  />
);

/* ─── WelcomeScreen ───────────────────────────────────────────────── */
function WelcomeScreen({ login }) {
  const isReturning = !!localStorage.getItem('grandecran_username');
  const savedName   = localStorage.getItem('grandecran_username') || '';
  const DARK   = THEME_COLORS.dark;
  const tokens = THEME_TOKENS('dark');

  const titles = [
    'Mulholland Drive', 'Tokyo Story', 'La Dolce Vita', 'Vertigo',
    'Stalker', 'In the Mood for Love', 'Mirror', 'Au hasard Balthazar',
    'Persona', "L'Avventura", 'Breathless', 'Hiroshima Mon Amour',
    'Andrei Rublev', '8½', 'The Conformist', 'Ordet',
  ];

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden"
      style={{ background: DARK.bg, color: DARK.text, ...tokens }}
    >
      <PaperGrain />
      <div
        className="absolute inset-0 flex gap-8 px-6 overflow-hidden pointer-events-none select-none"
        aria-hidden="true"
      >
        <div className="flex flex-col gap-5 pt-24" style={{ opacity: 0.055 }}>
          {titles.slice(0, 8).map((t, i) => (
            <span key={i} className="text-xs uppercase tracking-[0.2em] whitespace-nowrap"
              style={{ color: DARK.text, fontFamily: "'Outfit', sans-serif" }}>{t}</span>
          ))}
        </div>
        <div className="flex flex-col gap-5 pt-48 ml-auto" style={{ opacity: 0.04 }}>
          {titles.slice(8).map((t, i) => (
            <span key={i} className="text-xs uppercase tracking-[0.2em] whitespace-nowrap"
              style={{ color: DARK.text, fontFamily: "'Outfit', sans-serif" }}>{t}</span>
          ))}
        </div>
      </div>
      <div
        className="relative flex flex-col flex-1 z-10 overflow-y-auto"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div className="px-8 pt-14 pb-0">
          <p className="text-xs tracking-[0.35em] uppercase" style={{ color: DARK.accent, opacity: 0.6 }}>
            Journal cinématographique
          </p>
        </div>
        <div className="flex-1 flex flex-col justify-center px-8">
          <h1
            className="font-galinoy italic leading-none"
            style={{ fontSize: 'clamp(4rem, 18vw, 6.5rem)', color: DARK.text, letterSpacing: '-0.02em', marginBottom: '1.5rem' }}
          >
            Grand<br />Écran
          </h1>
          <div style={{ width: '2.5rem', height: '2px', background: DARK.accent, marginBottom: '1.75rem' }} />
          {isReturning ? (
            <p className="leading-relaxed" style={{ color: DARK.text, opacity: 0.4, fontSize: '0.95rem', fontStyle: 'italic', maxWidth: '22ch' }}>
              Heureux de vous retrouver{savedName
                ? <>, <span style={{ fontStyle: 'normal', fontWeight: 600, opacity: 1 }}>{savedName}</span></>
                : null}.
            </p>
          ) : (
            <p className="leading-relaxed" style={{ color: DARK.text, opacity: 0.4, fontSize: '0.95rem', maxWidth: '26ch' }}>
              Consignez, évaluez et racontez votre histoire avec le cinéma.
            </p>
          )}
        </div>
        <div className="px-8 pb-12 flex flex-col gap-10">
          <button
            onClick={() => login()}
            className="flex items-center gap-4 w-full active:opacity-70 transition-opacity duration-150"
            style={{
              background: 'transparent',
              border: `1px solid ${DARK.accent}`,
              color: DARK.text,
              padding: '1.1rem 1.75rem',
              letterSpacing: '0.2em',
              fontSize: '0.65rem',
              textTransform: 'uppercase',
              fontWeight: 700,
              borderRadius: 0,
            }}
          >
            <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: DARK.accent, flexShrink: 0 }} />
            <span style={{ flex: 1 }}>{isReturning ? 'Reprendre là où vous en étiez' : 'Connexion Google'}</span>
          </button>
          <p className="text-xs italic leading-relaxed" style={{ color: DARK.text, opacity: 0.18, maxWidth: '30ch' }}>
            "Le cinéma, c'est vingt-quatre fois la vérité par seconde."
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Default titles per tab ─────────────────────────────────────── */
const DEFAULT_TITLES = {
  home:    'Ton cinéma',
  history: 'Journal',
  studio:  'Atelier',
  profile: 'Profil',
};

/* ─── App ─────────────────────────────────────────────────────────── */
function App() {
  const [spreadsheetId, setSpreadsheetId] = useState(localStorage.getItem('grandecran_db_id') || '');
  const [activeTab,     setActiveTab]     = useState('home');
  const [scrollY,       setScrollY]       = useState(0);
  const [selectedFilm,  setSelectedFilm]  = useState(null);
  const [displayCount,  setDisplayCount]  = useState(15);
  const [films,         setFilms]         = useState([]);
  const [nextFilm,      setNextFilm]      = useState(null);
  const [pendingCount,  setPendingCount]  = useState(0);
  const [isSearching,   setIsSearching]   = useState(false);
  const [showNotation,  setShowNotation]  = useState(false);

  const [headerTitle, setHeaderTitle] = useState(DEFAULT_TITLES['home']);
  const [headerRight, setHeaderRight] = useState(null);

  const { userToken, login, logout: authLogout } = useAuth((token) => {
    if (spreadsheetId) handleScan(token);
  });

  const prefs    = usePreferences(userToken, spreadsheetId);
  const themeKey = prefs.isDark ? 'dark' : 'light';
  const theme    = THEME_COLORS[themeKey];
  const tokens   = THEME_TOKENS(themeKey);

  const { historyData, loadHistory, loadStats, invalidate } = useHistory(userToken, spreadsheetId);

  useEffect(() => { prefs.syncFromCloud(); },                                                     [userToken, spreadsheetId]);
  useEffect(() => { if (userToken && spreadsheetId && historyData.length === 0) loadHistory(); }, [userToken, spreadsheetId]);
  useEffect(() => { if (userToken && spreadsheetId && activeTab === 'home') loadStats(); },        [userToken, spreadsheetId, activeTab]);

  /* Reset on tab change */
  useEffect(() => {
    const el = document.getElementById('main-scroll-container');
    if (el) el.scrollTop = 0;
    setScrollY(0);
    setHeaderTitle(DEFAULT_TITLES[activeTab] || '');
    setHeaderRight(null);
  }, [activeTab]);

  /* Stable callbacks */
  const handleSetHeaderRight = useCallback((el) => setHeaderRight(el), []);
  const handleSetHeaderTitle = useCallback((t)  => setHeaderTitle(t),  []);
  const handleTabChange      = useCallback((id) => setActiveTab(id),   []);

  const handleScan = async (token = userToken) => {
    if (!token) return;
    setIsSearching(true);
    try {
      const found = await api.getFilmsANoter(token);
      setFilms(found || []);
      setNextFilm(found?.[0] || null);
      setPendingCount(found?.length || 0);
      if (found && found.length > 0) setShowNotation(true);
    } catch (err) {
      console.error('Erreur scan:', err);
      if (err.status === 401) authLogout();
    } finally {
      setIsSearching(false);
    }
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

  return (
  <div
    className="fixed inset-0 font-outfit overflow-hidden transition-colors duration-700"
    style={{ background: theme.bg, color: theme.text, ...tokens }} 
    // 💡 IMPORTANT : Aucun padding-bottom ici pour que le fond touche le vrai bas de l'écran
  >
    <PaperGrain />

    {!showNotation && (
      <AppHeader
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        scrollY={scrollY}
        headerTitle={headerTitle}
        headerRight={headerRight}
        isDark={prefs.isDark}
        accentColor={theme.accent}
      />
    )}

    <div
      id="main-scroll-container"
      className="absolute inset-0 overflow-y-auto overflow-x-hidden overscroll-none scrollbar-hide"
      style={{ zIndex: 10 }} 
      // 💡 IMPORTANT : Aucun padding-bottom ici non plus pour que la zone de scroll soit totale
      onScroll={(e) => {
        setScrollY(e.currentTarget.scrollTop);
        if (
          activeTab === 'history' &&
          e.currentTarget.scrollHeight - e.currentTarget.scrollTop
            <= e.currentTarget.clientHeight + 150
        ) {
          setDisplayCount(prev => prev + 15);
        }
      }}
    >
      {activeTab === 'home' && !showNotation && (
        <Dashboard
          historyData={historyData}
          setSelectedFilm={setSelectedFilm}
          scrollY={scrollY}
          onHeaderRight={handleSetHeaderRight}
        />
      )}
      {activeTab === 'history' && (
        <History
          historyData={historyData}
          setSelectedFilm={setSelectedFilm}
          displayCount={displayCount}
          scrollY={scrollY}
          onHeaderTitle={handleSetHeaderTitle}
          onHeaderRight={handleSetHeaderRight}
        />
      )}
      {activeTab === 'profile' && (
  <Profile
    // Données d'authentification et système
    userToken={userToken}
    spreadsheetId={spreadsheetId}
    handleScan={handleScan}
    scrollY={scrollY}
    onHeaderRight={handleSetHeaderRight}
    onLogout={handleLogout}
    onEditSpreadsheet={handleEditSpreadsheet}

    // États et modificateurs issus de usePreferences (prefs)
    userName={prefs.userName}
    updateUserName={prefs.updateUserName}
    userAvatar={prefs.userAvatar}
    updateAvatar={prefs.updateAvatar}
    themeMode={prefs.themeMode}
    toggleDarkMode={prefs.toggleDarkMode}
    ratingScale={prefs.ratingScale}
    updateRatingScale={prefs.updateRatingScale}
    pricing={prefs.pricing}
    updatePricing={prefs.updatePricing}
    triggerCloudSave={prefs.triggerCloudSave}
  />
)}
      {activeTab === 'studio' && (
        <Studio
          historyData={historyData}
          scrollY={scrollY}
        />
      )}
    </div>

      {selectedFilm && (
        <FilmDetailModal
          film={selectedFilm}
          onClose={() => setSelectedFilm(null)}
          ratingScale={prefs.ratingScale}
          isDark={prefs.isDark}
        />
      )}

      {showNotation && films.length > 0 && (
        <Notation
          films={films}
          token={userToken}
          spreadsheetId={spreadsheetId}
          onSaved={async () => { invalidate(); loadHistory(); await handleScan(userToken); }}
          onSkip={() => setShowNotation(false)}
        />
      )}
    </div>
  );
}

export default App;