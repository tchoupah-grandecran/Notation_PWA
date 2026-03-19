import { useGoogleLogin } from '@react-oauth/google';
import { useState, useEffect } from 'react';
import { getFilmsANoter } from './api';
import Notation from './pages/Notation';
import { saveFilmToSheet, getProchainNumeroSeance, getStats } from './api';

function App() {
  const [userToken, setUserToken] = useState(localStorage.getItem('google_token') || null);
  const [spreadsheetId, setSpreadsheetId] = useState(localStorage.getItem('grandecran_db_id') || "");
  const [films, setFilms] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [stats, setStats] = useState({ totalFilms: "--", coupsDeCoeur: "--" });

  useEffect(() => {
    // Si on a les accès et qu'on est sur l'accueil, on charge les stats
    if (userToken && spreadsheetId && activeTab === 'home') {
      getStats(userToken, spreadsheetId).then((data) => {
        setStats(data);
      });
    }
  }, [userToken, spreadsheetId, activeTab]);

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

  const saveSheetId = (e) => {
    e.preventDefault();
    const id = e.target.sheetId.value;
    setSpreadsheetId(id);
    localStorage.setItem('grandecran_db_id', id);
    if (userToken) handleScan(userToken);
  };

  // --- RENDU ---

  if (!userToken) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-black text-white">
        <h1 className="text-5xl font-black mb-8 tracking-tighter italic uppercase text-white">Grand Écran</h1>
        <button onClick={() => login()} className="bg-white text-black font-bold py-4 px-10 rounded-full active:scale-95 transition-all">
          CONNEXION GOOGLE
        </button>
      </div>
    );
  }

  if (!spreadsheetId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-black text-white text-center">
        <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-4">Configuration</h2>
        <form onSubmit={saveSheetId} className="w-full max-w-sm flex flex-col gap-4">
          <input name="sheetId" type="text" placeholder="ID du Spreadsheet" required className="bg-white/10 border border-white/20 p-4 rounded-2xl outline-none text-center" />
          <button type="submit" className="bg-yellow-500 text-black font-black py-4 rounded-2xl uppercase tracking-widest">Enregistrer l'ID</button>
        </form>
      </div>
    );
  }

  // ÉCRAN DE NOTATION (Isolé pour l'immersion iOS)
if (films.length > 0) {
  return (
    <Notation 
      films={films} 
      token={userToken} 
      spreadsheetId={spreadsheetId} 
      onSaved={() => setFilms([])} 
      onSkip={() => setFilms([])}
    />
  );
}

  if (isSearching) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-black text-white animate-pulse">
        <p className="font-black uppercase tracking-[0.2em] text-sm text-yellow-500">Recherche...</p>
      </div>
    );
  }

  // --- LAYOUT PRINCIPAL AVEC TAB BAR ---
  return (
    <div className="h-[100dvh] w-full bg-black text-white font-sans flex flex-col overflow-hidden">
      
      {/* ZONE DE CONTENU SCROLLABLE */}
      {/* Le pb a été réduit pour s'adapter à la nouvelle taille de la Tab Bar */}
      <div className="flex-1 overflow-y-auto pb-[calc(3.5rem+env(safe-area-inset-bottom))] scrollbar-hide">
        
        {/* ONGLET 1 : DASHBOARD (Accueil) */}
        {activeTab === 'home' && (
          <div className="animate-in fade-in duration-300">
            
            {/* HEADER : Espace en haut et en bas réduit */}
            <header className="pt-[calc(env(safe-area-inset-top)+0.5rem)/2] px-6 pb-2 flex justify-between items-center bg-black/80 backdrop-blur-xl z-40 sticky top-0 border-b border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border border-white/20 shadow-lg">
                  <span className="text-xl">👤</span> 
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-0.5">Mon profil</p>
                  <h1 className="font-syne text-xl font-bold leading-none tracking-tight">Cinéphile</h1>
                </div>
              </div>

              <button 
                onClick={logout} 
                className="w-11 h-11 rounded-full bg-white/5 flex items-center justify-center border border-white/10 active:scale-95 transition-all text-white/40 hover:text-red-500 hover:border-red-500/30 hover:bg-red-500/10"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </button>
            </header>

            {/* CONTENU DASHBOARD */}
            <main className="px-6 pt-6 space-y-8">
              {/* SECTION 1 : Action principale (Scanner) */}
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-[32px] p-8 flex flex-col items-center text-center relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-yellow-500/20 blur-[50px] rounded-full pointer-events-none"></div>
                <div className="w-14 h-14 bg-yellow-500/20 rounded-full flex items-center justify-center mb-5 text-yellow-500 border border-yellow-500/30 relative z-10">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path>
                    <path d="M12 12v9"></path>
                    <path d="M8 17l4 4 4-4"></path>
                  </svg>
                </div>
                <h2 className="font-syne text-3xl font-bold mb-3 relative z-10">Nouvelle Séance ?</h2>
                <p className="text-sm text-white/60 mb-8 leading-relaxed relative z-10">
                  Recherche tes derniers billets dans ta boîte mail pour les noter et les ajouter à ta collection.
                </p>
                <button 
                  onClick={() => handleScan(userToken)}
                  className="w-full bg-yellow-500 text-black font-black py-5 rounded-2xl active:scale-95 transition-all uppercase tracking-widest text-sm shadow-[0_10px_40px_-10px_rgba(234,179,8,0.5)] relative z-10"
                >
                  Scanner mes mails
                </button>
              </div>

              {/* SECTION 2 : Statistiques */}
              <div>
                <div className="flex items-center gap-3 mb-5 ml-2">
                  <svg className="w-4 h-4 text-white/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20v-6M6 20V10M18 20V4"></path></svg>
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/50">Mes Statistiques</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col justify-between aspect-square">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Films vus</span>
                    {/* LA VRAIE DATA ICI 👇 */}
                    <p className="font-syne text-5xl font-bold">{stats.totalFilms}</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col justify-between aspect-square">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Coups de ❤️</span>
                    {/* LA VRAIE DATA ICI 👇 */}
                    <p className="font-syne text-5xl font-bold text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]">{stats.coupsDeCoeur}</p>
                  </div>
                </div>
              </div>
              
              {/* Spacer de sécurité invisible pour forcer le scroll sur les petits écrans lors des tests */}
              <div className="h-4"></div>
            </main>
          </div>
        )}

        {/* ONGLET 2 : HISTORIQUE */}
        {activeTab === 'history' && (
          <div className="flex items-center justify-center h-full animate-in fade-in duration-300">
            <div className="text-center text-white/40">
              <span className="text-6xl mb-4 block">🍿</span>
              <p className="font-syne text-xl font-bold">Historique à venir</p>
            </div>
          </div>
        )}

        {/* ONGLET 3 : PROFIL */}
        {activeTab === 'profile' && (
          <div className="flex items-center justify-center h-full animate-in fade-in duration-300">
            <div className="text-center text-white/40">
              <span className="text-6xl mb-4 block">⚙️</span>
              <p className="font-syne text-xl font-bold">Réglages du profil</p>
            </div>
          </div>
        )}

      </div>

      {/* LA TAB BAR : Hauteur réduite (h-16 au lieu de h-20) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-2xl border-t border-white/10 pb-[env(safe-area-inset-bottom)/2] z-50">
        <div className="flex justify-around items-center h-16 px-4">
          
          {/* Bouton Home : CORRECTION OPACITÉ globale sur le bouton (opacity-40 au lieu de text-white/40) */}
          <button 
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center justify-center w-16 gap-1 transition-all duration-200 ${activeTab === 'home' ? 'text-yellow-500 opacity-100' : 'text-white opacity-40 hover:opacity-70'}`}
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill={activeTab === 'home' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <span className="text-[9px] font-bold tracking-widest uppercase mt-0.5">Accueil</span>
          </button>

          {/* Bouton History */}
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center justify-center w-16 gap-1 transition-all duration-200 ${activeTab === 'history' ? 'text-yellow-500 opacity-100' : 'text-white opacity-40 hover:opacity-70'}`}
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill={activeTab === 'history' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span className="text-[9px] font-bold tracking-widest uppercase mt-0.5">Billets</span>
          </button>

          {/* Bouton Profile */}
          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center justify-center w-16 gap-1 transition-all duration-200 ${activeTab === 'profile' ? 'text-yellow-500 opacity-100' : 'text-white opacity-40 hover:opacity-70'}`}
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill={activeTab === 'profile' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span className="text-[9px] font-bold tracking-widest uppercase mt-0.5">Profil</span>
          </button>

        </div>
      </nav>

    </div>
  );
}

export default App;