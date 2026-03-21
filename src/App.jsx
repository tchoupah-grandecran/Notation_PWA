import { useState, useEffect } from 'react';
import { THEME_COLORS, AVATAR_PRESETS } from './constants';
import { useAuth } from './hooks/useAuth';
import { usePreferences } from './hooks/usePreferences';
import { useHistory } from './hooks/useHistory';
import { getFilmsANoter, createAutoSpreadsheet } from './api';

import { NavBar } from './components/NavBar';
import { FilmDetailModal } from './components/FilmDetailModal';
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

// ── Onboarding 3 étapes (nouvelle première connexion) ─────────────────────────

function OnboardingScreen({ theme, userToken, onComplete, onThemePreview }) {
  const [step, setStep] = useState(0); // 0=avatar, 1=thème, 2=spreadsheet
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PRESETS[0]);
  const [selectedThemeKey, setSelectedThemeKey] = useState('dark-grey');
  const [isCreating, setIsCreating] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualId, setManualId] = useState('');
  const [error, setError] = useState('');

  // Prévisualise le thème en live dès la sélection
  const handleThemeSelect = (key) => {
    setSelectedThemeKey(key);
    onThemePreview(key);
  };

  const handleCreateSpreadsheet = async () => {
    setIsCreating(true);
    setError('');
    try {
      const id = await createAutoSpreadsheet(userToken);
      if (id) {
        // Sauvegarde avatar + thème avant de terminer
        localStorage.setItem('grandecran_avatar', selectedAvatar);
        localStorage.setItem('grandecran_theme', selectedThemeKey);
        localStorage.setItem('grandecran_db_id', id);
        onComplete({ spreadsheetId: id, avatar: selectedAvatar, themeKey: selectedThemeKey });
      } else {
        setError("Impossible de créer le fichier. Vérifie les permissions Google Drive.");
      }
    } catch (e) {
      setError("Une erreur est survenue. Réessaie ou renseigne ton ID manuellement.");
      console.error(e);
    }
    setIsCreating(false);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    const id = manualId.trim();
    if (!id) return;
    localStorage.setItem('grandecran_avatar', selectedAvatar);
    localStorage.setItem('grandecran_theme', selectedThemeKey);
    localStorage.setItem('grandecran_db_id', id);
    onComplete({ spreadsheetId: id, avatar: selectedAvatar, themeKey: selectedThemeKey });
  };

  const activeTheme = THEME_COLORS[selectedThemeKey] || THEME_COLORS['dark-grey'];

  const STEPS = [
    { label: 'Avatar',        icon: '👤' },
    { label: 'Thème',         icon: '🎨' },
    { label: 'Mon espace',    icon: '📂' },
  ];

  return (
    <div
      className="min-h-screen flex flex-col transition-colors duration-500"
      style={{ background: activeTheme.bgGradient, color: activeTheme.text }}
    >
      {/* Safe area top */}
      <div style={{ paddingTop: 'env(safe-area-inset-top)' }} />

      {/* Stepper */}
      <div className="px-8 pt-6 pb-2">
        <div className="flex items-center gap-0">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black transition-all duration-300 ${
                    i < step  ? 'text-black scale-90 opacity-80' :
                    i === step ? 'scale-110 shadow-[0_0_16px_var(--glow)]' :
                    'bg-white/10 text-white/40 scale-90'
                  }`}
                  style={{
                    background: i <= step ? activeTheme.primary : undefined,
                    color:      i <= step ? activeTheme.textOnAccent : undefined,
                    '--glow':   activeTheme.primaryMuted,
                  }}
                >
                  {i < step ? '✓' : i + 1}
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-widest transition-all ${i === step ? 'opacity-100' : 'opacity-30'}`}
                  style={{ color: i === step ? activeTheme.primary : undefined }}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="flex-1 h-px mx-2 mb-4 rounded-full transition-all duration-500"
                  style={{ background: i < step ? activeTheme.primary : 'rgba(255,255,255,0.12)' }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contenu par étape */}
      <div className="flex-1 flex flex-col px-6 pt-4 pb-[calc(env(safe-area-inset-bottom)+2rem)]">

        {/* ── ÉTAPE 0 : AVATAR ── */}
        {step === 0 && (
          <div className="flex flex-col flex-1 animate-in fade-in slide-in-from-bottom-4 duration-400">
            <div className="mb-8">
              <h2 className="font-syne font-black text-3xl leading-tight mb-2">
                Choisis ton<br/><span style={{ color: activeTheme.primary }}>portrait</span>
              </h2>
              <p className="text-sm font-medium opacity-60">Il t'identifiera dans l'application.</p>
            </div>

            {/* Avatar sélectionné — grand */}
            <div className="flex justify-center mb-8">
              <div
                className="w-28 h-28 rounded-full overflow-hidden border-4 shadow-[0_0_30px_rgba(0,0,0,0.4)] transition-all duration-300"
                style={{ borderColor: activeTheme.primary, boxShadow: `0 0 24px ${activeTheme.primaryMuted}` }}
              >
                <img src={selectedAvatar} alt="Avatar" className="w-full h-full object-contain object-bottom scale-110" />
              </div>
            </div>

            {/* Grille de sélection */}
            <div className="grid grid-cols-4 gap-3 mb-auto">
              {AVATAR_PRESETS.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedAvatar(url)}
                  className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all duration-200 active:scale-90 ${
                    selectedAvatar === url ? 'scale-105' : 'opacity-50 border-white/10'
                  }`}
                  style={{ borderColor: selectedAvatar === url ? activeTheme.primary : undefined }}
                >
                  <img src={url} alt="" className="w-full h-full object-contain object-bottom bg-white/5" />
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep(1)}
              className="mt-8 w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest active:scale-95 transition-all"
              style={{ background: activeTheme.primary, color: activeTheme.textOnAccent }}
            >
              Continuer →
            </button>
          </div>
        )}

        {/* ── ÉTAPE 1 : THÈME ── */}
        {step === 1 && (
          <div className="flex flex-col flex-1 animate-in fade-in slide-in-from-bottom-4 duration-400">
            <div className="mb-8">
              <h2 className="font-syne font-black text-3xl leading-tight mb-2">
                Choisis ton<br/><span style={{ color: activeTheme.primary }}>ambiance</span>
              </h2>
              <p className="text-sm font-medium opacity-60">Le thème s'applique en temps réel.</p>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-auto">
              {Object.entries(THEME_COLORS).map(([key, t]) => (
                <button
                  key={key}
                  onClick={() => handleThemeSelect(key)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all duration-200 active:scale-95 ${
                    selectedThemeKey === key
                      ? 'border-opacity-100 scale-105'
                      : 'border-white/10 opacity-60'
                  }`}
                  style={{
                    borderColor: selectedThemeKey === key ? activeTheme.primary : undefined,
                    background:  selectedThemeKey === key ? activeTheme.primaryMuted : 'rgba(255,255,255,0.04)',
                  }}
                >
                  {/* Preview cercle */}
                  <div
                    className="w-12 h-12 rounded-full shadow-md flex-shrink-0"
                    style={{ background: t.bgGradient }}
                  >
                    {/* Accent dot */}
                    <div className="w-full h-full rounded-full flex items-end justify-end p-1.5">
                      <div className="w-3 h-3 rounded-full" style={{ background: t.primary }} />
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest leading-tight text-center"
                    style={{ color: selectedThemeKey === key ? activeTheme.primary : undefined }}>
                    {key.replace('-', ' ').replace('-', ' ')}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setStep(0)}
                className="flex-1 py-4 rounded-2xl font-black text-sm uppercase tracking-widest border border-white/10 bg-white/5 active:scale-95 transition-all"
              >
                ← Retour
              </button>
              <button
                onClick={() => setStep(2)}
                className="flex-[2] py-4 rounded-2xl font-black text-sm uppercase tracking-widest active:scale-95 transition-all"
                style={{ background: activeTheme.primary, color: activeTheme.textOnAccent }}
              >
                Continuer →
              </button>
            </div>
          </div>
        )}

        {/* ── ÉTAPE 2 : SPREADSHEET ── */}
        {step === 2 && (
          <div className="flex flex-col flex-1 animate-in fade-in slide-in-from-bottom-4 duration-400">
            <div className="mb-8">
              <h2 className="font-syne font-black text-3xl leading-tight mb-2">
                Ton espace<br/><span style={{ color: activeTheme.primary }}>personnel</span>
              </h2>
              <p className="text-sm font-medium opacity-60">
                Toutes tes séances sont stockées dans un Google Sheets qui t'appartient.
              </p>
            </div>

            {/* Illustration */}
            <div
              className="rounded-3xl p-6 mb-6 border flex items-center gap-4"
              style={{ background: activeTheme.primaryMuted, borderColor: `${activeTheme.primary}30` }}
            >
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0 text-2xl">
                📊
              </div>
              <div>
                <p className="font-syne font-bold text-base mb-0.5">Google Sheets</p>
                <p className="text-xs opacity-60 leading-relaxed">
                  Un fichier créé dans ton Drive, que tu peux consulter et partager librement.
                </p>
              </div>
            </div>

            {/* CTA principal */}
            <button
              onClick={handleCreateSpreadsheet}
              disabled={isCreating}
              className="w-full py-5 rounded-2xl font-black text-base uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-3 mb-3 shadow-lg disabled:opacity-60"
              style={{ background: activeTheme.primary, color: activeTheme.textOnAccent }}
            >
              {isCreating ? (
                <>
                  <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                    <path d="M12 2v4" />
                  </svg>
                  Création en cours…
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Créer mon espace
                </>
              )}
            </button>

            {/* Erreur */}
            {error && (
              <p className="text-red-400 text-xs font-bold text-center mb-3 bg-red-400/10 rounded-xl px-4 py-3 border border-red-400/20">
                {error}
              </p>
            )}

            {/* Lien discret "j'ai déjà un spreadsheet" */}
            {!showManualInput ? (
              <button
                onClick={() => setShowManualInput(true)}
                className="w-full py-3 text-xs font-bold uppercase tracking-widest opacity-40 hover:opacity-70 transition-opacity active:scale-95"
              >
                J'ai déjà un spreadsheet →
              </button>
            ) : (
              <form
                onSubmit={handleManualSubmit}
                className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                <div className="relative">
                  <input
                    type="text"
                    placeholder="ID du Google Sheets…"
                    value={manualId}
                    onChange={(e) => setManualId(e.target.value)}
                    autoFocus
                    className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3.5 text-sm font-bold outline-none pr-12 transition-colors"
                    style={{ borderColor: manualId ? activeTheme.primary : undefined }}
                  />
                  {manualId && (
                    <button
                      type="button"
                      onClick={() => setManualId('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setShowManualInput(false); setManualId(''); }}
                    className="flex-1 py-3 rounded-2xl text-xs font-black uppercase border border-white/10 bg-white/5 active:scale-95 transition-all"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={!manualId.trim()}
                    className="flex-[2] py-3 rounded-2xl text-xs font-black uppercase active:scale-95 transition-all disabled:opacity-40"
                    style={{ background: activeTheme.primary, color: activeTheme.textOnAccent }}
                  >
                    Utiliser cet ID
                  </button>
                </div>
              </form>
            )}

            <button
              onClick={() => setStep(1)}
              className="w-full py-3 text-xs font-bold uppercase tracking-widest opacity-30 hover:opacity-60 transition-opacity mt-2 active:scale-95"
            >
              ← Retour
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

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

// ── App ──────────────────────────────────────────────────────────────────────

function App() {
  const [spreadsheetId, setSpreadsheetId] = useState(
    localStorage.getItem('grandecran_db_id') || ''
  );
  const [films, setFilms] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isExitingNotation, setIsExitingNotation] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [isScrolled, setIsScrolled] = useState(false);
  const [selectedFilm, setSelectedFilm] = useState(null);
  const [displayCount, setDisplayCount] = useState(15);

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

  const handleScan = async (token = userToken) => {
    if (!token) return;
    setIsSearching(true);
    try {
      const found = await getFilmsANoter(token);
      setFilms(found);
    } catch (err) {
      console.error('Erreur scan:', err);
      // Token expiré → déconnexion propre
      authLogout();
    }
    setIsSearching(false);
  };

  const handleLogout = () => {
    authLogout();
    setFilms([]);
    invalidate();
  };

  const handleSetupSpreadsheet = (id) => {
    setSpreadsheetId(id);
    localStorage.setItem('grandecran_db_id', id);
    handleScan(userToken);
  };

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
        // Applique les préférences choisies pendant l'onboarding
        prefs.updateAvatar(avatar);
        prefs.updateTheme(themeKey);
        setSpreadsheetId(id);
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
      {/* Zone scrollable principale
          — padding-bottom en style inline pour que env() soit réévalué
            par le browser à chaque rendu, pas seulement au build Tailwind  */}
      <div
        id="main-scroll-container"
        className="flex-1 overflow-y-auto scrollbar-hide"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 3.5rem)' }}
        onScroll={(e) => {
          const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
          setIsScrolled(scrollTop > 20);
          // Pagination infinie
          if (scrollHeight - scrollTop <= clientHeight + 150) {
            setDisplayCount((prev) => prev + 15);
          }
        }}
      >
        {activeTab === 'home' && (
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
          />
        )}
      </div>

      {/* Barre de navigation (cachée si notation en cours) */}
      {films.length === 0 && (
        <NavBar activeTab={activeTab} setActiveTab={setActiveTab} />
      )}

      {/* Modale de détail film */}
      {selectedFilm && (
        <FilmDetailModal film={selectedFilm} onClose={() => setSelectedFilm(null)} />
      )}

      {/* Écran de notation */}
      {films.length > 0 && (
        <Notation
          key={films[0].titre || films.length}
          films={films}
          token={userToken}
          spreadsheetId={spreadsheetId}
          isExiting={isExitingNotation}
          ratingScale={prefs.ratingScale}
          onSaved={() => {
            setFilms((prev) => prev.slice(1));
            invalidate();
            loadHistory();
          }}
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