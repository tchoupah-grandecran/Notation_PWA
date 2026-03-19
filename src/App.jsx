import { useGoogleLogin } from '@react-oauth/google';
import { useState, useEffect } from 'react';
import { getFilmsANoter } from './api';
import Notation from './pages/Notation';
import { saveFilmToSheet, getProchainNumeroSeance, getStats, getFullHistory, getMissingPosterFromTMDB } from './api';

// Mini-composant pour gérer les affiches (avec recherche automatique si manquante)
const SmartPoster = ({ afficheInitiale, titre }) => {
  const [posterUrl, setPosterUrl] = useState(null);

  useEffect(() => {
    // On vérifie si on a un VRAI lien d'image (commence par http)
    const hasValidUrl = typeof afficheInitiale === 'string' && afficheInitiale.startsWith('http');

    if (hasValidUrl) {
      // Si on a déjà l'URL, on l'affiche directement
      setPosterUrl(afficheInitiale);
    } else if (titre) {
      // Sinon (case vide, espace, tiret, null...), on lance la recherche TMDB
      getMissingPosterFromTMDB(titre).then((url) => {
        if (url) setPosterUrl(url);
      });
    }
  }, [afficheInitiale, titre]);

  return (
    <div className="w-20 h-full bg-white/10 flex-shrink-0 relative overflow-hidden">
      {posterUrl ? (
        <img 
          src={posterUrl} 
          alt={titre} 
          className="w-full h-full object-cover animate-in fade-in duration-500" 
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-2xl opacity-50">🎬</div>
      )}
    </div>
  );
};

// Nouvel état pour le filtre actif
  const [activeFilter, setActiveFilter] = useState('all');

  // 1. On extrait les années uniques de l'historique (ex: ["2024", "2023"])
  const anneesDisponibles = [...new Set(historyData.map(f => {
    if (!f.date) return null;
    const parts = f.date.split('/');
    return parts.length === 3 ? parts[2] : null;
  }).filter(Boolean))].sort((a, b) => b - a); // Tri décroissant

  // 2. On crée la liste filtrée à afficher
  const filteredHistory = historyData.filter(film => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'coeur') return film.coupDeCoeur;
    if (activeFilter === 'capucine') return film.capucine;
    if (activeFilter === 'top') return Number(film.note) >= 4; // Affiche les notes de 4 et 5
    if (anneesDisponibles.includes(activeFilter)) return film.date?.endsWith(activeFilter);
    return true;
  });

function App() {
  const [userToken, setUserToken] = useState(localStorage.getItem('google_token') || null);
  const [spreadsheetId, setSpreadsheetId] = useState(localStorage.getItem('grandecran_db_id') || "");
  const [films, setFilms] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [stats, setStats] = useState({ totalFilms: "--", coupsDeCoeur: "--" });
  const [historyData, setHistoryData] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    // Si on a les accès et qu'on est sur l'accueil, on charge les stats
    if (userToken && spreadsheetId && activeTab === 'home') {
      getStats(userToken, spreadsheetId).then((data) => {
        setStats(data);
      });
    }
  }, [userToken, spreadsheetId, activeTab]);

  // Charge l'historique complet quand on va sur l'onglet Billets
  useEffect(() => {
    if (userToken && spreadsheetId && activeTab === 'history') {
      setIsLoadingHistory(true);
      getFullHistory(userToken, spreadsheetId).then((data) => {
        setHistoryData(data);
        setIsLoadingHistory(false);
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

        {/* ONGLET 2 : HISTORIQUE (Billets) */}
        {activeTab === 'history' && (
          <div className="animate-in fade-in duration-300">
            
            {/* Header simple pour l'historique */}
            <header className="pt-[calc(env(safe-area-inset-top)+1rem)] bg-black/80 backdrop-blur-xl z-40 sticky top-0 border-b border-white/5">
              <div className="px-6 pb-2">
                <h1 className="font-syne text-2xl font-bold leading-none tracking-tight">Mes Billets</h1>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mt-1">
                  {filteredHistory.length} film{filteredHistory.length > 1 ? 's' : ''} trouvé{filteredHistory.length > 1 ? 's' : ''}
                </p>
              </div>

              {/* BARRE DE FILTRES HORIZONTALE */}
              <div className="flex overflow-x-auto gap-2 px-6 pb-4 pt-2 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                
                {/* Bouton "Tous" */}
                <button 
                  onClick={() => setActiveFilter('all')}
                  className={`snap-start whitespace-nowrap px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${activeFilter === 'all' ? 'bg-white text-black' : 'bg-white/10 text-white/70 active:bg-white/20'}`}
                >
                  Tous
                </button>

                {/* Bouton "Coups de coeur" */}
                <button 
                  onClick={() => setActiveFilter('coeur')}
                  className={`snap-start whitespace-nowrap px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${activeFilter === 'coeur' ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'bg-white/10 text-white/70 active:bg-white/20'}`}
                >
                  ❤️ Coups de cœur
                </button>

                {/* Bouton "Capucines" */}
                <button 
                  onClick={() => setActiveFilter('capucine')}
                  className={`snap-start whitespace-nowrap px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${activeFilter === 'capucine' ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-white/10 text-white/70 active:bg-white/20'}`}
                >
                  🌻 Capucines
                </button>

                {/* Bouton "Top Notes" */}
                <button 
                  onClick={() => setActiveFilter('top')}
                  className={`snap-start whitespace-nowrap px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${activeFilter === 'top' ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.4)]' : 'bg-white/10 text-white/70 active:bg-white/20'}`}
                >
                  ⭐️ Top 4+
                </button>

                {/* Boutons dynamiques pour chaque année */}
                {anneesDisponibles.map(annee => (
                  <button 
                    key={annee}
                    onClick={() => setActiveFilter(annee)}
                    className={`snap-start whitespace-nowrap px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${activeFilter === annee ? 'bg-white text-black' : 'bg-white/10 text-white/70 active:bg-white/20'}`}
                  >
                    {annee}
                  </button>
                ))}
              </div>
            </header>

            <main className="px-6 pt-4 pb-4 space-y-4">
              {/* IMPORTANT : Change ici historyData.length par filteredHistory.length */}
              {isLoadingHistory ? (
                // Loader...
                <div className="flex flex-col items-center justify-center py-20 text-white/40">
                  <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-xs uppercase tracking-widest font-bold">Chargement des bobines...</p>
                </div>
              ) : filteredHistory.length === 0 ? (
                // Message si vide
                <div className="flex flex-col items-center justify-center py-20 text-white/40 text-center animate-in fade-in zoom-in-95 duration-300">
                  <span className="text-6xl mb-4 block opacity-50">🎟️</span>
                  <p className="font-syne text-xl font-bold">Aucun billet trouvé</p>
                  <p className="text-sm mt-2">Modifie tes filtres pour voir d'autres films.</p>
                </div>
              ) : (
                // LISTE DES FILMS : IMPORTANT, remplace historyData.map par filteredHistory.map 👇
                filteredHistory.map((film, index) => (
                  <div key={index} className="flex bg-white/5 border border-white/10 rounded-2xl relative overflow-hidden active:scale-[0.98] transition-transform h-28">
                    
                    {/* Badge Numéro (Flottant en haut à droite) */}
                    {film.numero && (
                      <div className="absolute top-0 right-0 bg-yellow-500/20 text-yellow-500 border-b border-l border-yellow-500/30 text-[9px] font-black px-2 py-1 rounded-bl-lg z-10">
                        #{film.numero}
                      </div>
                    )}

                    {/* Affiche Intelligente (Recherche TMDB si manquante) */}
                    <SmartPoster afficheInitiale={film.affiche} titre={film.titre} />

                    {/* Informations (Avec le padding réintégré ici) */}
                    <div className="flex-1 flex flex-col justify-center py-3 px-4">
                      {/* Titre avec pr-6 pour ne pas passer sous le badge numéro */}
                      <h4 className="font-syne font-bold text-lg leading-tight mb-1 pr-6 line-clamp-2">{film.titre}</h4>
                      
                      {/* Date sans l'heure */}
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-white/50 text-[11px] font-bold uppercase tracking-wider">{film.date}</p>
                      </div>
                      
                      {/* Badges : Genre, Note, Coup de coeur */}
                      <div className="flex items-center gap-2 mt-auto">
                        <span className="bg-white/10 border border-white/10 text-white/70 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest">
                          {film.genre}
                        </span>
                        
                        {/* Affichage de la Note si elle existe */}
                        {film.note && (
                          <span className="text-yellow-500 font-black text-xs flex items-center gap-1 bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20 shadow-sm">
                            <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg> 
                            {film.note}
                          </span>
                        )}

                        {/* Coeur si coup de coeur */}
                        {film.coupDeCoeur && (
                          <span className="text-red-500 text-sm drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]">❤️</span>
                        )}
                      </div>
                    </div>

                  </div>
                ))
              )}
              {/* Spacer de sécurité pour la bottom bar */}
              <div className="h-6"></div>
            </main>
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