import { useState, useEffect } from 'react';
import { THEME_COLORS, THEME_TOKENS, AVATAR_PRESETS } from './constants';
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
    /*
     * WelcomeScreen : même stratégie que l'App principale —
     * position:fixed + inset:0 pour éviter tout scroll parasite sur iOS.
     */
    <div
      className="fixed inset-0 flex flex-col overflow-hidden"
      style={{ background: DARK.bg, color: DARK.text, ...tokens }}
    >
      <PaperGrain />

      {/* Filigrane colonnes */}
      <div
        className="absolute inset-0 flex gap-8 px-6 overflow-hidden pointer-events-none select-none"
        style={{ zIndex: 0 }}
        aria-hidden="true"
      >
        <div className="flex flex-col gap-5 pt-24" style={{ opacity: 0.055 }}>
          {titles.slice(0, 8).map((t, i) => (
            <span key={i} className="text-xs uppercase tracking-[0.2em] whitespace-nowrap" style={{ color: DARK.text, fontFamily: "'Outfit', sans-serif" }}>
              {t}
            </span>
          ))}
        </div>
        <div className="flex flex-col gap-5 pt-48 ml-auto" style={{ opacity: 0.04 }}>
          {titles.slice(8).map((t, i) => (
            <span key={i} className="text-xs uppercase tracking-[0.2em] whitespace-nowrap" style={{ color: DARK.text, fontFamily: "'Outfit', sans-serif" }}>
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Contenu principal — scrollable si l'écran est très petit */}
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
              Heureux de vous retrouver
              {savedName ? (
                <>, <span style={{ fontStyle: 'normal', fontWeight: 600, opacity: 1 }}>{savedName}</span></>
              ) : null}.
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
            <span style={{ flex: 1 }}>
              {isReturning ? 'Reprendre là où vous en étiez' : 'Connexion Google'}
            </span>
          </button>
          <p className="text-xs italic leading-relaxed" style={{ color: DARK.text, opacity: 0.18, maxWidth: '30ch' }}>
            "Le cinéma, c'est vingt-quatre fois la vérité par seconde."
          </p>
        </div>
      </div>
    </div>
  );
}

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
    /*
     * Écran de chargement : même stratégie position:fixed inset:0
     */
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ background: theme.bg, ...tokens }}
    >
      <PaperGrain />
      <p className="font-galinoy animate-pulse">Scan en cours...</p>
    </div>
  );

  return (
    /*
     * CONTENEUR RACINE — position:fixed + inset:0
     * ─────────────────────────────────────────────
     * C'est la correction principale pour iOS.
     *
     * Pourquoi position:fixed plutôt que h-[100dvh] ?
     *   • Sur iOS, 100dvh représente la hauteur du viewport CSS.
     *     Quand la barre d'adresse Safari apparaît ou disparaît,
     *     ce viewport se recalcule, ce qui provoque un saut visuel.
     *   • Un élément position:fixed + inset:0 s'ancre aux bords de
     *     la fenêtre d'affichage native (la "layout viewport") et
     *     ne bouge pas, même si le viewport CSS change.
     *   • En mode standalone (PWA / display:standalone), Safari ne
     *     montre plus de barre d'adresse, donc 100dvh serait stable,
     *     mais la technique position:fixed est universellement safe.
     *
     * overscroll-behavior:none bloque le rebond élastique iOS au
     * niveau du conteneur racine. Le scroll élastique utile se
     * produit toujours à l'intérieur de #main-scroll-container.
     */
    <div
      className="fixed inset-0 font-outfit flex flex-col overflow-hidden transition-colors duration-700 relative"
      style={{
        background: theme.bg,
        color: theme.text,
        overscrollBehavior: 'none',
        ...tokens,
      }}
    >
      <PaperGrain />

      {/* ZONE DE CONTENU PRINCIPAL */}
      <div
        id="main-scroll-container"
        className="flex-1 overflow-y-auto scrollbar-hide relative z-10"
        /*
         * paddingBottom : on recalcule ici en CSS pur pour éviter
         * toute désynchronisation avec la hauteur réelle de la NavBar.
         * --navbar-tab-height = 3.5rem, safe-area-inset-bottom géré
         * nativement par env().
         */
        style={{ paddingBottom: 'var(--navbar-total-height)' }}
        onScroll={(e) => {
          const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
          setScrollY(scrollTop);
          setIsScrolled(scrollTop > 2);
          if (activeTab === 'history' && scrollHeight - scrollTop <= clientHeight + 150)
            setDisplayCount(prev => prev + 15);
        }}
      >
        {activeTab === 'home' && !showNotation && (
          <Dashboard
            {...{ historyData, isScrolled, handleScan, setActiveTab, setSelectedFilm }}
            scrollY={scrollY}
            ratingScale={prefs.ratingScale}
            pricing={prefs.pricing}
            userAvatar={prefs.userAvatar}
            userName={prefs.userName}
            isDark={prefs.isDark}
          />
        )}

        {activeTab === 'history' && (
          <History
            {...{ historyData, isLoadingHistory, isScrolled, handleScan, setSelectedFilm, displayCount, setDisplayCount }}
            scrollY={scrollY}
            ratingScale={prefs.ratingScale}
            isDark={prefs.isDark}
          />
        )}

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
          />
        )}

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

      {/* OVERLAYS & NAVIGATION */}

      {nextFilm && !showNotation && (
        <PendingRatingToast
          film={nextFilm}
          count={pendingCount}
          onOpen={() => setShowNotation(true)}
        />
      )}

      {!showNotation && (
        <NavBar activeTab={activeTab} setActiveTab={setActiveTab} isDark={prefs.isDark} />
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
          onSaved={async () => {
            invalidate();
            loadHistory();
            await handleScan(userToken);
          }}
          onSkip={() => setShowNotation(false)}
        />
      )}
    </div>
  );
}

export default App;