import { useState, useEffect } from 'react';
import { THEME_COLORS, AVATAR_PRESETS } from './constants';
import { useAuth } from './hooks/useAuth';
import { usePreferences } from './hooks/usePreferences';
import { useHistory } from './hooks/useHistory';

// Import de l'API
import * as api from './api'; 

import PendingRatingToast from './components/PendingRatingToast';
import { NavBar } from './components/NavBar';
import { FilmDetailModal } from './components/FilmDetailModal';
import { Avatar3D } from './components/Avatar3D';
import { Dashboard } from './pages/Dashboard';
import { History } from './pages/History';
import { Profile } from './pages/Profile';
import { Studio } from './pages/Studio';
import Notation from './pages/Notation';

// ── Écrans de démarrage ──────────────────────────────────────────────────────

function WelcomeScreen({ theme, login }) {
  const isReturning = !!localStorage.getItem('grandecran_username');
  const savedName = localStorage.getItem('grandecran_username') || 'Cinéphile';

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 text-center relative overflow-hidden"
      style={{ background: theme.bgGradient, color: theme.text }}
    >
      <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-center">
        <svg className="w-[150%] h-[150%] text-white animate-[spin_120s_linear_infinite]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5">
          <circle cx="12" cy="12" r="10" /><path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07L19.07 4.93" />
        </svg>
      </div>
      <div className="relative z-10 flex flex-col items-center">
        <div className="w-24 h-24 mb-6 rounded-full bg-white/5 border-2 flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.1)]" style={{ borderColor: theme.primary }}>
          <span className="text-4xl">🍿</span>
        </div>
        <h1 className="text-5xl font-black mb-2 tracking-tighter italic uppercase">Grand Écran</h1>
        {isReturning ? (
          <>
            <p className="text-white/60 mb-10 font-bold leading-relaxed">
              Heureux de te revoir, <span className="text-white">{savedName}</span> !<br />
              <span className="text-[10px] uppercase tracking-widest" style={{ color: theme.primary }}>
                Session expirée par sécurité (1h)
              </span>
            </p>
            <button
              onClick={() => login()}
              className="font-black py-4 px-8 rounded-full active:scale-95 transition-all flex items-center gap-3"
              style={{ background: theme.primary, color: theme.textOnAccent }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
              </svg>
              RECONNEXION RAPIDE
            </button>
          </>
        ) : (
          <>
            <p className="text-white/60 mb-10 font-bold">Ton journal de bord cinématographique personnel.</p>
            <button
              onClick={() => login()}
              className="font-black py-4 px-10 rounded-full active:scale-95 transition-all"
              style={{ background: theme.primary, color: theme.textOnAccent }}
            >
              CONNEXION GOOGLE
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// CORRECTION : Suppression du composant "SpreadsheetSetupScreen" qui était du code mort.

function ScanningScreen({ theme }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: theme.bgGradient, color: theme.text }}>
      <div className="relative mb-8">
        <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ background: theme.primary }} />
        <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center relative z-10" style={{ color: theme.primary }}>
          <svg className="w-8 h-8 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242M12 12v9M8 17l4 4 4-4" />
          </svg>
        </div>
      </div>
      <p className="font-syne text-xl font-bold mb-2">Recherche de billets</p>
      <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Analyse de la boîte mail...</p>
    </div>
  );
}

function OnboardingScreen({ theme, userToken, onThemePreview, onComplete }) {
  const [step, setStep] = useState(1);
  const [sheetId, setSheetId] = useState('');
  const [avatar, setAvatar] = useState(AVATAR_PRESETS[0]);
  const [themeKey, setThemeKey] = useState('dark-grey');

  const handleNext = () => setStep(s => s + 1);

  if (step === 1) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center animate-fade-in" style={{ background: theme.bgGradient, color: theme.text }}>
      <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-4">La Base de Données</h2>
      <p className="text-white/60 mb-8 max-w-xs text-sm">Grand Écran utilise Google Sheets comme base de données. Colle l'ID de ton fichier ci-dessous.</p>
      <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="w-full max-w-sm flex flex-col gap-4">
        <input 
          type="text" 
          placeholder="ID du Spreadsheet" 
          value={sheetId}
          onChange={(e) => setSheetId(e.target.value)}
          required 
          className="bg-white/10 border border-white/20 p-4 rounded-2xl outline-none text-center font-mono text-sm focus:border-[var(--color-primary)] transition-colors" 
        />
        <button type="submit" className="font-black py-4 rounded-2xl uppercase tracking-widest active:scale-95 transition-transform" style={{ background: theme.primary, color: theme.textOnAccent }}>
          Continuer
        </button>
      </form>
    </div>
  );

  if (step === 2) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center animate-fade-in" style={{ background: theme.bgGradient, color: theme.text }}>
      <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-4">Ton Avatar</h2>
      <div className="flex flex-wrap justify-center gap-4 mb-10 max-w-xs">
        {AVATAR_PRESETS.map((preset) => (
          <img 
            key={preset} 
            src={preset} 
            alt="Avatar" 
            className={`w-16 h-16 rounded-full object-cover cursor-pointer transition-all ${avatar === preset ? 'ring-4 ring-offset-2 ring-offset-[#0C0C0E] scale-110' : 'opacity-50 hover:opacity-100'}`}
            style={{ '--tw-ring-color': theme.primary }}
            onClick={() => setAvatar(preset)}
          />
        ))}
      </div>
      <button onClick={handleNext} className="w-full max-w-sm font-black py-4 rounded-2xl uppercase tracking-widest active:scale-95 transition-transform" style={{ background: theme.primary, color: theme.textOnAccent }}>
        Continuer
      </button>
    </div>
  );

  if (step === 3) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center animate-fade-in" style={{ background: theme.bgGradient, color: theme.text }}>
      <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-4">Le Thème</h2>
      <div className="grid grid-cols-2 gap-4 mb-10 w-full max-w-sm">
        {Object.entries(THEME_COLORS).map(([key, t]) => (
          <button
            key={key}
            onClick={() => { setThemeKey(key); onThemePreview(key); }}
            className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${themeKey === key ? 'border-white scale-105 shadow-xl' : 'border-white/10 opacity-60 hover:opacity-100'}`}
            style={{ background: t.bgGradient }}
          >
            <div className="w-6 h-6 rounded-full shadow-inner" style={{ background: t.primary }}></div>
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: t.text }}>{t.name}</span>
          </button>
        ))}
      </div>
      <button onClick={() => onComplete({ spreadsheetId: sheetId, avatar, themeKey })} className="w-full max-w-sm font-black py-4 rounded-2xl uppercase tracking-widest active:scale-95 transition-transform" style={{ background: theme.primary, color: theme.textOnAccent }}>
        Terminer la configuration
      </button>
    </div>
  );

  return null;
}

// ── App ──────────────────────────────────────────────────────────────────────

function App() {
  const [spreadsheetId, setSpreadsheetId] = useState(
    localStorage.getItem('grandecran_db_id') || ''
  );
  
  // États de l'interface
  const [activeTab, setActiveTab] = useState('home');
  const [isScrolled, setIsScrolled] = useState(false);
  const [selectedFilm, setSelectedFilm] = useState(null);
  const [displayCount, setDisplayCount] = useState(15);
  
  // États des films en attente (Notation et Toast)
  const [films, setFilms] = useState([]); // Déclenche la modale si > 0
  const [nextFilm, setNextFilm] = useState(null); // Utilisé par le Toast et le Studio
  const [pendingCount, setPendingCount] = useState(0); // Nombre de films sur le badge
  
  const [isSearching, setIsSearching] = useState(false);
  const [isExitingNotation, setIsExitingNotation] = useState(false);

  // Hooks métier
  const { userToken, setUserToken, login, logout: authLogout } = useAuth((token) => {
    if (spreadsheetId) handleScan(token); 
  });

  const prefs = usePreferences(userToken, spreadsheetId);
  const theme = THEME_COLORS[prefs.currentThemeKey] || THEME_COLORS['dark-grey'];

  const { historyData, setHistoryData, isLoadingHistory, loadHistory, loadStats, invalidate } =
    useHistory(userToken, spreadsheetId);

  // Synchronisation cloud au montage
  useEffect(() => {
    prefs.syncFromCloud();
  }, [userToken, spreadsheetId]);

  // Chargement initial de l'historique
  useEffect(() => {
    if (userToken && spreadsheetId && historyData.length === 0 && !isLoadingHistory) {
      loadHistory();
    }
  }, [userToken, spreadsheetId]);

  // Rechargement stats à chaque retour sur l'accueil
  useEffect(() => {
    if (userToken && spreadsheetId && activeTab === 'home') {
      loadStats();
    }
  }, [userToken, spreadsheetId, activeTab]);

  // ── CHECK SILENCIEUX EN ARRIÈRE-PLAN ─────────────────────────────
  useEffect(() => {
    if (!userToken || !spreadsheetId) return;

    const silentCheck = async () => {
      // Si la modale est déjà ouverte ou qu'un film est déjà en attente, on ignore
      if (films.length > 0 || nextFilm) return;

      try {
        const found = await api.getFilmsANoter(userToken);
        if (found && found.length > 0) {
          setNextFilm(found[0]);
          setPendingCount(found.length);
        }
      } catch (error) {
        console.error("Erreur lors du check silencieux:", error);
      }
    };

    // 1. Polling régulier (5 minutes)
    const intervalId = setInterval(silentCheck, 5 * 60 * 1000);

    // 2. Check au focus de l'onglet
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        silentCheck();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [userToken, spreadsheetId, films.length, nextFilm]);

  // ── SCAN MANUEL / INITIAL ─────────────────────────────
  const handleScan = async (token = userToken) => {
    if (!token) return;
    setIsSearching(true);
    try {
      const found = await api.getFilmsANoter(token);
      setFilms(found); // Ouvre la modale immédiatement si des films sont trouvés au démarrage
      
      if (found && found.length > 0) {
        setNextFilm(found[0]);
        setPendingCount(found.length);
      } else {
        setNextFilm(null);
        setPendingCount(0);
      }
    } catch (err) {
      console.error('Erreur scan:', err);
      authLogout();
    }
    setIsSearching(false);
  };

  const handleLogout = () => {
    authLogout();
    setFilms([]);
    setNextFilm(null);
    setPendingCount(0);
    invalidate();
  };

  // CORRECTION : On conserve cette fonction pour pouvoir modifier le sheetId depuis le profil
  const handleEditSpreadsheet = () => {
    const newId = prompt('Entrez le nouvel ID :', spreadsheetId);
    if (newId && newId !== spreadsheetId) {
      setSpreadsheetId(newId);
      localStorage.setItem('grandecran_db_id', newId);
      window.location.reload();
    }
  };

  // ── CSS vars du thème injectées globalement ──────────────────────────────
  const cssVars = {
    '--color-primary': theme.primary,
    '--color-primary-muted': theme.primaryMuted,
    '--color-text-on-accent': theme.textOnAccent,
    '--color-bg': theme.bg,
  };

  // ── Écrans de démarrage ──────────────────────────────────────────────────
  if (!userToken) return <WelcomeScreen theme={theme} login={login} />;

  if (!spreadsheetId) return (
    <OnboardingScreen
      theme={theme}
      userToken={userToken}
      onThemePreview={(key) => prefs.updateTheme(key)}
      onComplete={({ spreadsheetId: id, avatar, themeKey }) => {
        prefs.updateAvatar(avatar);
        prefs.updateTheme(themeKey);
        setSpreadsheetId(id);
        // CORRECTION : Sauvegarde vitale pour ne pas tout perdre au F5
        localStorage.setItem('grandecran_db_id', id); 
        handleScan(userToken);
      }}
    />
  );

  if (isSearching) return <ScanningScreen theme={theme} />;

 // ── Application principale ───────────────────────────────────────────────
  return (
    <div
      className="h-[100dvh] w-full font-sans flex flex-col overflow-hidden transition-colors duration-500 relative"
      style={{ background: theme.bgGradient, color: theme.text, ...cssVars }}
    >
      <div
    id="main-scroll-container"
    className="flex-1 overflow-y-auto scrollbar-hide"
    style={{ paddingBottom: 'var(--navbar-total-height)' }}   // ← changed
    onScroll={(e) => {
          const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
          setIsScrolled(scrollTop > 20);
          
          // CORRECTION : Limitation pour éviter l'explosion de rendus lors du scroll tout en bas.
          // On ne déclenche l'incrément que si on n'a pas encore chargé toute la liste.
          if (
            activeTab === 'history' && 
            scrollHeight - scrollTop <= clientHeight + 150 &&
            displayCount < historyData.length
          ) {
            setDisplayCount((prev) => prev + 15);
          }
        }}
      >
        {activeTab === 'home' && films.length === 0 && (
          <Dashboard
            historyData={historyData}
            ratingScale={prefs.ratingScale}
            pricing={prefs.pricing}
            isScrolled={isScrolled}
            userAvatar={prefs.userAvatar}
            userName={prefs.userName}
            handleScan={handleScan}
            setActiveTab={setActiveTab}
            setSelectedFilm={setSelectedFilm}
          />
        )}

        {activeTab === 'history' && (
  <History
    historyData={historyData}
    isLoadingHistory={isLoadingHistory}
    ratingScale={prefs.ratingScale}
    isScrolled={isScrolled}
    handleScan={handleScan}
    setSelectedFilm={setSelectedFilm}
    displayCount={displayCount}
    setDisplayCount={setDisplayCount}
    currentThemeKey={prefs.currentThemeKey} // <-- AJOUTE CETTE LIGNE
  />
)}

        {activeTab === 'profile' && (
          <Profile
            isScrolled={isScrolled}
            handleScan={handleScan}
            userName={prefs.userName}
            userAvatar={prefs.userAvatar}
            currentThemeKey={prefs.currentThemeKey}
            ratingScale={prefs.ratingScale}
            pricing={prefs.pricing}
            spreadsheetId={spreadsheetId}
            historyData={historyData}
            updateUserName={prefs.updateUserName}
            updateAvatar={prefs.updateAvatar}
            updateTheme={prefs.updateTheme}
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

      {/* --- LE SMART TOAST (Rétractable) --- */}
      {nextFilm && films.length === 0 && (
        <PendingRatingToast 
          film={nextFilm} 
          count={pendingCount}
          onOpen={() => setFilms([nextFilm])} 
        />
      )}

      {/* Barre de navigation */}
      {films.length === 0 && (
        <NavBar activeTab={activeTab} setActiveTab={setActiveTab} />
      )}

      {/* Modale de détail film */}
{selectedFilm && (
  <FilmDetailModal 
    film={selectedFilm} 
    onClose={() => setSelectedFilm(null)} 
    ratingScale={prefs.ratingScale} // <--- AJOUTE CETTE LIGNE
  />
)}

      {/* Écran de notation (BLOQUANT) */}
      {films.length > 0 && (
        <Notation
          key={films[0].titre || films.length}
          films={films}
          token={userToken}
          spreadsheetId={spreadsheetId}
          isExiting={isExitingNotation}
          ratingScale={prefs.ratingScale}
          onSaved={() => {
            setFilms((prev) => {
              const remaining = prev.slice(1);
              setNextFilm(remaining.length > 0 ? remaining[0] : null);
              setPendingCount(remaining.length);
              return remaining;
            });
            invalidate();
            loadHistory();
          }}
          onSkip={() => {
            setIsExitingNotation(true);
            setTimeout(() => { 
              setFilms([]); 
              setIsExitingNotation(false); 
              // En cliquant sur skip, nextFilm et pendingCount restent remplis, 
              // donc le Toast apparaîtra sur le Dashboard.
            }, 500);
          }}
        />
      )}
    </div>
  );
}

export default App;
