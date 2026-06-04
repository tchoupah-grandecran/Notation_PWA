import { useState, useEffect, useRef } from 'react';
import { THEME_COLORS, THEME_TOKENS } from './constants';
import { useAuth } from './hooks/useAuth';
import { usePreferences } from './hooks/usePreferences';
import { useHistory } from './hooks/useHistory';

import * as api from './api';

import PendingRatingToast from './components/PendingRatingToast';
import { NavBar } from './components/NavBar';
import { FilmDetailModal } from './components/FilmDetailModal';
import { Dashboard } from './pages/Dashboard';
import { History } from './pages/History';
import { Profile } from './pages/Profile';
import { Studio } from './pages/Studio';
import Notation from './pages/Notation';

/* ─── Grain ───────────────────────────────────────────────────────── */
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
    <div className="fixed inset-0 flex flex-col overflow-hidden" style={{ background: DARK.bg, color: DARK.text, ...tokens }}>
      <PaperGrain />
      <div className="absolute inset-0 flex gap-8 px-6 overflow-hidden pointer-events-none select-none" style={{ zIndex: 0 }} aria-hidden="true">
        <div className="flex flex-col gap-5 pt-24" style={{ opacity: 0.055 }}>
          {titles.slice(0, 8).map((t, i) => (
            <span key={i} className="text-xs uppercase tracking-[0.2em] whitespace-nowrap" style={{ color: DARK.text, fontFamily: "'Outfit', sans-serif" }}>{t}</span>
          ))}
        </div>
        <div className="flex flex-col gap-5 pt-48 ml-auto" style={{ opacity: 0.04 }}>
          {titles.slice(8).map((t, i) => (
            <span key={i} className="text-xs uppercase tracking-[0.2em] whitespace-nowrap" style={{ color: DARK.text, fontFamily: "'Outfit', sans-serif" }}>{t}</span>
          ))}
        </div>
      </div>
      <div className="relative flex flex-col flex-1 z-10 overflow-y-auto" style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="px-8 pt-14 pb-0">
          <p className="text-xs tracking-[0.35em] uppercase" style={{ color: DARK.accent, opacity: 0.6 }}>Journal cinématographique</p>
        </div>
        <div className="flex-1 flex flex-col justify-center px-8">
          <h1 className="font-galinoy italic leading-none" style={{ fontSize: 'clamp(4rem, 18vw, 6.5rem)', color: DARK.text, letterSpacing: '-0.02em', marginBottom: '1.5rem' }}>
            Grand<br />Écran
          </h1>
          <div style={{ width: '2.5rem', height: '2px', background: DARK.accent, marginBottom: '1.75rem' }} />
          {isReturning ? (
            <p className="leading-relaxed" style={{ color: DARK.text, opacity: 0.4, fontSize: '0.95rem', fontStyle: 'italic', maxWidth: '22ch' }}>
              Heureux de vous retrouver{savedName ? <>, <span style={{ fontStyle: 'normal', fontWeight: 600, opacity: 1 }}>{savedName}</span></> : null}.
            </p>
          ) : (
            <p className="leading-relaxed" style={{ color: DARK.text, opacity: 0.4, fontSize: '0.95rem', maxWidth: '26ch' }}>
              Consignez, évaluez et racontez votre histoire avec le cinéma.
            </p>
          )}
        </div>
        <div className="px-8 pb-12 flex flex-col gap-10">
          <button onClick={() => login()} className="flex items-center gap-4 w-full active:opacity-70 transition-opacity duration-150"
            style={{ background: 'transparent', border: `1px solid ${DARK.accent}`, color: DARK.text, padding: '1.1rem 1.75rem', letterSpacing: '0.2em', fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 700, borderRadius: 0 }}>
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

/* ─── App ─────────────────────────────────────────────────────────── */
function App() {
  const [spreadsheetId, setSpreadsheetId] = useState(localStorage.getItem('grandecran_db_id') || '');
  const [activeTab, setActiveTab]         = useState('home');
  const [isScrolled, setIsScrolled]       = useState(false);
  const [scrollY, setScrollY]             = useState(0);
  const [selectedFilm, setSelectedFilm]   = useState(null);
  const [displayCount, setDisplayCount]   = useState(15);
  const [films, setFilms]                 = useState([]);
  const [nextFilm, setNextFilm]           = useState(null);
  const [pendingCount, setPendingCount]   = useState(0);
  const [isSearching, setIsSearching]     = useState(false);
  const [showNotation, setShowNotation]   = useState(false);

  /* État pour gérer la visibilité de la morphing bar au scroll (Scroll-to-hide) */
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const lastScrollY = useRef(0);

  /* ── Slots remontés par les pages enfants ── */
  const [headerTitle,  setHeaderTitle]  = useState('Grand Écran');
  const [headerRight,  setHeaderRight]  = useState(null);
  const [headerIsHome, setHeaderIsHome] = useState(true);

  const { userToken, login, logout: authLogout } = useAuth((token) => {
    if (spreadsheetId) handleScan(token);
  });

  const prefs    = usePreferences(userToken, spreadsheetId);
  const themeKey = prefs.isDark ? 'dark' : 'light';
  const theme    = THEME_COLORS[themeKey];
  const tokens   = THEME_TOKENS(themeKey);

  const { historyData, isLoadingHistory, loadHistory, loadStats, invalidate } = useHistory(userToken, spreadsheetId);

  useEffect(() => { prefs.syncFromCloud(); }, [userToken, spreadsheetId]);
  useEffect(() => { if (userToken && spreadsheetId && historyData.length === 0) loadHistory(); }, [userToken, spreadsheetId]);
  useEffect(() => { if (userToken && spreadsheetId && activeTab === 'home') loadStats(); }, [userToken, spreadsheetId, activeTab]);

  /* Réinitialise le scroll à chaque changement d'onglet et réaffiche la navbar */
  useEffect(() => {
    const el = document.getElementById('main-scroll-container');
    if (el) el.scrollTop = 0;
    setScrollY(0);
    setIsScrolled(false);
    setIsNavbarVisible(true);
    lastScrollY.current = 0;
  }, [activeTab]);

  /* Titre par défaut selon l'onglet (les pages peuvent override) */
  useEffect(() => {
    const map = { home: 'Grand Écran', history: 'Journal', studio: 'Studio', profile: 'Réglages' };
    setHeaderTitle(map[activeTab] || '');
    setHeaderIsHome(activeTab === 'home');
    setHeaderRight(null);
  }, [activeTab]);

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

  if (isSearching) return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: theme.bg, ...tokens }}>
      <PaperGrain />
      <p className="font-galinoy animate-pulse">Scan en cours...</p>
    </div>
  );

  /* Utilise la nouvelle variable CSS calculée qui inclut la safe-area top réelle + 44px de confort */
  const headerHeight = 'var(--header-total-height)';

  return (
    <div
      className="fixed inset-0 font-outfit flex flex-col overflow-hidden transition-colors duration-700"
      style={{
        background: theme.bg,
        color: theme.text,
        overscrollBehavior: 'none',
        /* Expose la hauteur du header aux pages enfants */
        '--header-height': headerHeight,
        ...tokens,
      }}
    >
      <PaperGrain />

      {/* ── SCROLL CONTAINER ────────────────────────────────────── */}
<div
  id="main-scroll-container"
  className="flex-1 overflow-y-auto scrollbar-hide relative z-10"
  style={{
    paddingTop: showNotation ? 0 : headerHeight,
    /* * 🟢 CORRECTION BORDS PERDUS : 
     * On retire le paddingBottom global pour que le contenu aille jusqu'en bas.
     * On ajoute un léger padding de confort (ex: 20px) juste pour que le dernier élément 
     * d'une liste puisse être scrollé légèrement plus haut que la navbar.
     */
    paddingBottom: 'calc(40px + var(--navbar-total-height))',
  }}
  onScroll={(e) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    setScrollY(scrollTop);
    setIsScrolled(scrollTop > 4);
    
    // Logique contextuelle de la Morphing Bar (Scroll-to-hide)
    const currentScrollY = scrollTop;
    const delta = currentScrollY - lastScrollY.current;

    if (currentScrollY < lastScrollY.current || currentScrollY < 24) {
      setIsNavbarVisible(true);
    } else if (currentScrollY > lastScrollY.current && currentScrollY > 60 && delta > 5) {
      setIsNavbarVisible(false);
    }
    lastScrollY.current = currentScrollY;

    if (activeTab === 'history' && scrollHeight - scrollTop <= clientHeight + 150) {
      setDisplayCount(prev => prev + 15);
    }
  }}
>
        {/* ── DASHBOARD ─────────────────────────────────────────── */}
        {activeTab === 'home' && !showNotation && (
          <Dashboard
            historyData={historyData}
            isScrolled={isScrolled}
            handleScan={handleScan}
            setActiveTab={setActiveTab}
            setSelectedFilm={setSelectedFilm}
            scrollY={scrollY}
            ratingScale={prefs.ratingScale}
            pricing={prefs.pricing}
            userAvatar={prefs.userAvatar}
            userName={prefs.userName}
            isDark={prefs.isDark}
            onHeaderRight={setHeaderRight}
          />
        )}

        {/* ── HISTORY ───────────────────────────────────────────── */}
        {activeTab === 'history' && (
          <History
            historyData={historyData}
            isLoadingHistory={isLoadingHistory}
            isScrolled={isScrolled}
            handleScan={handleScan}
            setSelectedFilm={setSelectedFilm}
            displayCount={displayCount}
            setDisplayCount={setDisplayCount}
            scrollY={scrollY}
            ratingScale={prefs.ratingScale}
            isDark={prefs.isDark}
            onHeaderTitle={setHeaderTitle}
            onHeaderRight={setHeaderRight}
          />
        )}

        {/* ── PROFILE ───────────────────────────────────────────── */}
        {activeTab === 'profile' && (
          <Profile
            isScrolled={isScrolled}
            scrollY={scrollY}
            handleScan={handleScan}
            userName={prefs.userName}
            userAvatar={prefs.userAvatar}
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
            onHeaderRight={setHeaderRight}
          />
        )}

        {/* ── STUDIO ────────────────────────────────────────────── */}
        {activeTab === 'studio' && (
          <Studio
            historyData={historyData}
            ratingScale={prefs.ratingScale}
            userName={prefs.userName}
            userAvatar={prefs.userAvatar}
            isScrolled={isScrolled}
            pendingFilm={nextFilm}
          />
        )}
      </div>

      {/* ── OVERLAYS ────────────────────────────────────────────── */}
      {nextFilm && !showNotation && (
        <PendingRatingToast film={nextFilm} count={pendingCount} onOpen={() => setShowNotation(true)} />
      )}

      {!showNotation && (
        <NavBar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          isDark={prefs.isDark} 
          isVisible={isNavbarVisible} 
        />
      )}

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
          ratingScale={prefs.ratingScale}
          isDark={prefs.isDark}
          onSaved={async () => { invalidate(); loadHistory(); await handleScan(userToken); }}
          onSkip={() => setShowNotation(false)}
        />
      )}
    </div>
  );
}

export default App;