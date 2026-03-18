import { useGoogleLogin } from '@react-oauth/google';
import { useState, useEffect } from 'react';
import { getFilmsANoter } from './api';
import Notation from './pages/Notation';

function App() {
  const [userToken, setUserToken] = useState(localStorage.getItem('google_token') || null);
  const [spreadsheetId, setSpreadsheetId] = useState(localStorage.getItem('grandecran_db_id') || "");
  const [films, setFilms] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-black text-white">
      <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-4">Dashboard vide</h2>
      <button onClick={logout} className="text-red-500 font-bold uppercase text-xs tracking-widest border border-red-500/30 px-6 py-2 rounded-full">
        Déconnexion
      </button>
    </div>
  );
}

export default App;