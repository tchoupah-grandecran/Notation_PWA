import { useState, useEffect, useCallback, useRef } from 'react';
import { THEME_COLORS, THEME_TOKENS, getThemeAccent } from './constants';
import { useAuth } from './hooks/useAuth';
import { usePreferences } from './hooks/usePreferences';
import { useHistory } from './hooks/useHistory';
import PendingRatingToast from './components/PendingRatingToast';
import { Community } from './pages/Community';
import { syncActivity } from './communityApi';
import { OWNER_EMAIL } from './config';
import * as api from './api';
import { WelcomeScreen } from './components/WelcomeScreen';
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

/* ─── Default titles per tab ─────────────────────────────────────── */
const DEFAULT_TITLES = {
  home:    'Ton cinéma',
  history: 'Journal',
  studio:  'Atelier',
  community: '',
  profile: 'Profil',
};

/* ─── App ─────────────────────────────────────────────────────────── */
function App() {
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [spreadsheetIdInput, setSpreadsheetIdInput] = useState('');
  const [spreadsheetLinkError, setSpreadsheetLinkError] = useState('');
  const [activeTab,     setActiveTab]     = useState('home');
  const [scrollY,       setScrollY]       = useState(0);
  const [selectedFilm,  setSelectedFilm]  = useState(null);
  const [displayCount,  setDisplayCount]  = useState(15);
  const [films,         setFilms]         = useState([]);
  const [nextFilm,      setNextFilm]      = useState(null);
  const [pendingCount,  setPendingCount]  = useState(0);
  const [showNotation,  setShowNotation]  = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [headerTitle, setHeaderTitle] = useState(DEFAULT_TITLES['home']);
  const [headerRight, setHeaderRight] = useState(null);

  const {
    userToken,
    accountSpreadsheetId,
    login,
    logout: authLogout,
    refreshSession,
    isLoading: isAuthLoading,
    isAuthenticating,
    error: authError,
  } = useAuth();
  const didScanSessionRef = useRef(false);

  useEffect(() => {
    setSpreadsheetId(accountSpreadsheetId || '');
    if (accountSpreadsheetId) localStorage.setItem('grandecran_db_id', accountSpreadsheetId);
    else localStorage.removeItem('grandecran_db_id');
  }, [accountSpreadsheetId]);

  const handleScan = useCallback(async (token = userToken) => {
    if (!token) return false;
    let activeToken = token;
    setIsScanning(true);
    setScanError('');

    try {
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const found = await api.getFilmsANoter(activeToken, spreadsheetId);
          setFilms(found || []);
          setNextFilm(found?.[0] || null);
          setPendingCount(found?.length || 0);
          setShowNotation(Boolean(found?.length));
          return true;
        } catch (err) {
          console.error('Erreur scan:', err);
          if (err.status !== 401) {
            setScanError(err.status === 403
              ? 'Google a refusé l’accès aux séances. Vérifie les autorisations Gmail et Sheets.'
              : 'La recherche des séances a échoué. Vérifie ta connexion puis réessaie.');
            return false;
          }

          if (attempt === 0) {
            const renewedToken = await refreshSession({ force: true });
            if (renewedToken) {
              activeToken = renewedToken;
              continue;
            }
          }

          authLogout();
          return false;
        }
      }
      return false;
    } finally {
      setIsScanning(false);
    }
  }, [userToken, spreadsheetId, authLogout, refreshSession]);

  useEffect(() => {
    if (!userToken) {
      didScanSessionRef.current = false;
      return;
    }
    if (spreadsheetId && !didScanSessionRef.current) {
      didScanSessionRef.current = true;
      void handleScan(userToken);
    }
  }, [userToken, spreadsheetId, handleScan]);

  const prefs    = usePreferences(userToken, spreadsheetId);
  const themeKey = prefs.isDark ? 'dark' : 'light';
  const theme    = THEME_COLORS[themeKey];
  const tokens   = THEME_TOKENS(themeKey, prefs.accentPalette, prefs.prideAccentEnabled);
  const appBackground = tokens['--theme-bg'];

  const {
    historyData,
    historyStatus,
    historyError,
    isLoadingHistory,
    loadHistory,
    loadStats,
    invalidate,
  } = useHistory(userToken, spreadsheetId);

  useEffect(() => {
    document.documentElement.style.setProperty('--theme-bg', appBackground);
  }, [appBackground]);

  useEffect(() => { prefs.syncFromCloud(); },                                                     [userToken, spreadsheetId]);
  useEffect(() => { if (userToken && spreadsheetId && historyData.length === 0) loadHistory(); }, [userToken, spreadsheetId]);
  useEffect(() => { if (userToken && spreadsheetId && activeTab === 'home') loadStats(); },        [userToken, spreadsheetId, activeTab]);

  useEffect(() => {
  if (!userToken || historyData.length === 0) return;
  void syncActivity(historyData, prefs.ratingScale).catch(() => {});
}, [userToken, historyData, prefs.ratingScale]);

  /* ─── Reset on tab change ─────────────────────────────────────────── */
  useEffect(() => {
    const activeEl = document.activeElement;
    const isInputFocused = activeEl && (
      activeEl.tagName === 'INPUT' ||
      activeEl.tagName === 'TEXTAREA' ||
      activeEl.isContentEditable
    );
    if (!isInputFocused) {
      window.scrollTo(0, 0);
    }
    setScrollY(0);
    setHeaderTitle(DEFAULT_TITLES[activeTab] || '');
  }, [activeTab]);

  /* ─── Scroll handler ─────────────────────────────────────────────── */
  useEffect(() => {
    let lastDocHeight = document.documentElement.scrollHeight;

    const handleScroll = () => {
      const currentDocHeight = document.documentElement.scrollHeight;
      if (currentDocHeight !== lastDocHeight) {
        lastDocHeight = currentDocHeight;
        return;
      }
      const y = window.scrollY;
      setScrollY(y);
      if (
        activeTab === 'history' &&
        window.innerHeight + y >= document.documentElement.scrollHeight - 150
      ) {
        setDisplayCount(prev => prev + 15);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeTab]);

  /* Stable callbacks */
  const handleSetHeaderRight = useCallback((el) => setHeaderRight(el), []);
  const handleSetHeaderTitle = useCallback((t)  => setHeaderTitle(t),  []);
  
  const handleTabChange = useCallback((id) => {
    setActiveTab(id);
    setHeaderRight(null); 
  }, []);

  const handleLogout = () => {
    authLogout(); setFilms([]); setNextFilm(null); setPendingCount(0); invalidate();
  };

  const handleEditSpreadsheet = (newId) => {
    if (newId && newId !== spreadsheetId) {
      fetch('/api/auth/spreadsheet', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XmlHttpRequest' },
        body: JSON.stringify({ spreadsheetId: newId }),
      }).then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || 'Impossible de synchroniser cet ID.');
        setSpreadsheetId(payload.spreadsheet_id);
        localStorage.setItem('grandecran_db_id', payload.spreadsheet_id);
        window.location.reload();
      }).catch((error) => window.alert(error.message));
    }
  };

  const handleAttachSpreadsheet = async (event) => {
    event.preventDefault();
    setSpreadsheetLinkError('');
    try {
      const response = await fetch('/api/auth/spreadsheet', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XmlHttpRequest' },
        body: JSON.stringify({ spreadsheetId: spreadsheetIdInput }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Impossible de synchroniser cet ID.');
      localStorage.setItem('grandecran_db_id', payload.spreadsheet_id);
      setSpreadsheetId(payload.spreadsheet_id);
    } catch (error) {
      setSpreadsheetLinkError(error.message || 'Impossible de synchroniser cet ID.');
    }
  };
useEffect(() => {
  if (!userToken) { setUserEmail(''); return; }
  fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
    headers: { Authorization: `Bearer ${userToken}` },
  })
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => setUserEmail((d?.emailAddress || '').toLowerCase()))
    .catch(() => {});
}, [userToken]);

const isOwner = userEmail !== '' && userEmail === OWNER_EMAIL.toLowerCase();
const safeTab = activeTab === 'studio' && !isOwner ? 'home' : activeTab;

  if (isAuthLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center" style={{ background: THEME_COLORS.dark.bg, color: THEME_COLORS.dark.text }}>
        <p className="text-xs uppercase tracking-[0.24em] opacity-50">Restauration de la séance</p>
      </div>
    );
  }

  if (!userToken) return <WelcomeScreen login={login} isAuthenticating={isAuthenticating} error={authError} />;
  if (!spreadsheetId) return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-4 px-6 text-center" style={{ background: THEME_COLORS.dark.bg, color: THEME_COLORS.dark.text }}>
      <p className="text-xs uppercase tracking-[0.24em] opacity-60">Aucun journal n’est associé à ce compte</p>
      <p className="max-w-sm text-sm opacity-70">Colle l’ID de ton Google Sheets existant pour le rattacher à ton profil et le retrouver sur tes appareils.</p>
      <form onSubmit={handleAttachSpreadsheet} className="flex w-full max-w-sm flex-col gap-3">
        <input
          value={spreadsheetIdInput}
          onChange={(event) => setSpreadsheetIdInput(event.target.value)}
          placeholder="ID du Google Sheets"
          aria-label="ID du Google Sheets"
          className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm outline-none"
        />
        {spreadsheetLinkError && <p role="alert" className="text-sm text-red-300">{spreadsheetLinkError}</p>}
        <button type="submit" disabled={!spreadsheetIdInput.trim()} className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-black disabled:opacity-50">Associer mon journal existant</button>
      </form>
      <button type="button" onClick={handleLogout} className="mt-2 text-sm opacity-60">Se déconnecter</button>
    </div>
  );

  return (
    <div
      className="min-h-dvh font-outfit transition-colors duration-700"
      style={{ background: 'var(--theme-bg)', color: theme.text, ...tokens }}
    >
      <PaperGrain />

      <div
        id="main-scroll-container"
        className="min-h-dvh overflow-x-hidden scrollbar-hide"
        style={{ zIndex: 10 }}
      >
        <div style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}></div>
        {activeTab === 'home' && !showNotation && (
          <Dashboard
            historyData={historyData}
            pricing={prefs.pricing}
            historyStatus={historyStatus}
            historyError={historyError}
            isLoadingHistory={isLoadingHistory}
            onRetryHistory={loadHistory}
            isScanning={isScanning}
            scanError={scanError}
            onRetryScan={() => handleScan()}
            setSelectedFilm={setSelectedFilm}
            scrollY={scrollY}
            onHeaderRight={handleSetHeaderRight}
          />
        )}
        {activeTab === 'history' && (
          <History
            historyData={historyData}
            historyStatus={historyStatus}
            historyError={historyError}
            isLoadingHistory={isLoadingHistory}
            onRetryHistory={loadHistory}
            isScanning={isScanning}
            scanError={scanError}
            onRetryScan={() => handleScan()}
            setSelectedFilm={setSelectedFilm}
            displayCount={displayCount}
            scrollY={scrollY}
            onHeaderTitle={handleSetHeaderTitle}
            onHeaderRight={handleSetHeaderRight}
          />
        )}
        {activeTab === 'profile' && (
          <Profile
            userEmail={userEmail}
            userToken={userToken}
            spreadsheetId={spreadsheetId}
            handleScan={handleScan}
            scrollY={scrollY}
            onHeaderRight={handleSetHeaderRight}
            onLogout={handleLogout}
            onEditSpreadsheet={handleEditSpreadsheet}
            userName={prefs.userName}
            updateUserName={prefs.updateUserName}
            userAvatar={prefs.userAvatar}
            updateAvatar={prefs.updateAvatar}
            themeMode={prefs.themeMode}
            toggleDarkMode={prefs.toggleDarkMode}
            accentPalette={prefs.accentPalette}
            updateAccentPalette={prefs.updateAccentPalette}
            prideAccentEnabled={prefs.prideAccentEnabled}
            updatePrideAccentEnabled={prefs.updatePrideAccentEnabled}
            ratingScale={prefs.ratingScale}
            updateRatingScale={prefs.updateRatingScale}
            pricing={prefs.pricing}
            updatePricing={prefs.updatePricing}
            triggerCloudSave={prefs.triggerCloudSave}
          />
        )}
        {activeTab === 'community' && (
  <Community
    userName={prefs.userName}
    userAvatar={prefs.userAvatar}
    historyData={historyData}
    ratingScale={prefs.ratingScale}
  />
)}
        {safeTab === 'studio' && (
          <Studio
            historyData={historyData}
            pendingFilm={nextFilm}
            onHeaderRight={handleSetHeaderRight}
            onHeaderTitle={handleSetHeaderTitle}
          />
        )}
      </div>

      {!showNotation && (
        <div className="relative z-40">
          <AppHeader
            activeTab={safeTab}
            isOwner={isOwner}
            setActiveTab={handleTabChange}
            scrollY={scrollY}
            headerTitle={headerTitle}
            headerRight={headerRight}
            hideTopBar={activeTab === 'community'}
            isDark={prefs.isDark}
            accentColor={getThemeAccent(themeKey, prefs.accentPalette)}
          />
        </div>
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
          onSaved={async (savedFilm) => {
            invalidate();
            void loadHistory();
            const remaining = films.filter((candidate) => {
              if (savedFilm?.messageId && candidate.messageId) return candidate.messageId !== savedFilm.messageId;
              if (savedFilm?.fingerprint && candidate.fingerprint) return candidate.fingerprint !== savedFilm.fingerprint;
              return !(candidate.titre === savedFilm?.titre && candidate.date === savedFilm?.date && candidate.heure === savedFilm?.heure);
            });
            setFilms(remaining);
            setNextFilm(remaining[0] || null);
            setPendingCount(remaining.length);
            if (remaining.length === 0) {
              setShowNotation(false);
              await handleScan(userToken);
            }
          }}
          onSkip={() => setShowNotation(false)}
        />
      )}

      {!showNotation && pendingCount > 0 && nextFilm && (
        <PendingRatingToast
          film={nextFilm}
          count={pendingCount}
          onOpen={() => setShowNotation(true)}
        />
      )}
    </div>
  );
}

export default App;
