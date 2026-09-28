import { useEffect, useRef, useState, useCallback } from 'react';
import RecapTool from '../studio/monthly/MonthlyRecapTool';
import SeanceStoryTool from '../studio/seance/SeanceStoryTool';
import ReviewsHub from '../studio/reviews/ReviewsHub';
import StudioHub from '../studio/hub/StudioHub';
import '../Studio.css';

export function Studio({ historyData, pendingFilm, onHeaderRight, onHeaderTitle }) {
  const [isUnlocked, setIsUnlocked] = useState(localStorage.getItem('grandecran_studio_unlocked') === 'true');
  const [activeTool, setActiveTool] = useState(null);
  const handleLock = useCallback(() => {
    setIsUnlocked(false);
    localStorage.removeItem('grandecran_studio_unlocked');
  }, []);

  useEffect(() => {
    if (activeTool !== null) {
      onHeaderRight?.(null);
      onHeaderTitle?.('');
    }
  }, [activeTool, onHeaderRight, onHeaderTitle]);

  function LockScreen({ onUnlock }) {
    const [password, setPassword] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
      onHeaderRight?.(null);
      const t = setTimeout(() => inputRef.current?.focus(), 300);
      return () => clearTimeout(t);
    }, []);

    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 animate-in fade-in duration-500 pb-[env(safe-area-inset-bottom)]">
        <div className="w-20 h-20 bg-white/5 rounded-full border border-white/10 flex items-center justify-center mb-6 shadow-2xl">
          <svg className="w-8 h-8 text-[var(--theme-accent)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <h2 className="font-galinoy italic text-4xl mb-1 text-white tracking-tight">Zone Securisee</h2>
        <p className="font-outfit text-white/30 text-sm mb-8">Acces reserve</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (password.toUpperCase() === 'POPCORN') onUnlock();
            else { alert('Mot de passe incorrect'); setPassword(''); }
          }}
          className="flex flex-col gap-4 w-full max-w-xs"
        >
          <input
            ref={inputRef}
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            enterKeyHint="done"
            className="font-outfit bg-black/40 border border-white/10 rounded-2xl p-4 text-center font-bold tracking-widest outline-none focus:border-[var(--theme-accent)] transition-colors text-white placeholder:text-white/20"
          />
          <button
            type="submit"
            className="w-full border-2 border-transparent font-outfit font-black uppercase tracking-widest py-4 rounded-2xl text-[var(--theme-action-ink)] active:scale-95 transition-transform text-sm"
            style={{ background: 'linear-gradient(var(--theme-action-bg), var(--theme-action-bg)) padding-box, var(--theme-accent-gradient) border-box' }}
          >
            Deverrouiller
          </button>
        </form>
      </div>
    );
  }

  if (!isUnlocked) return <LockScreen onUnlock={() => { setIsUnlocked(true); localStorage.setItem('grandecran_studio_unlocked', 'true'); }}/>;
  if (activeTool === 'recap') return <RecapTool onBack={() => setActiveTool(null)} historyData={historyData}/>;
  if (activeTool === 'seance') return <SeanceStoryTool historyData={historyData} pendingFilm={pendingFilm} onBack={() => setActiveTool(null)}/>;
  if (activeTool === 'share') return <ReviewsHub historyData={historyData} pendingFilm={pendingFilm} onBack={() => setActiveTool(null)}/>;

  return (
    <StudioHub
      onSelectTool={setActiveTool}
      onLock={handleLock}
      pendingFilm={pendingFilm}
      historyData={historyData}
      onHeaderRight={onHeaderRight}
    />
  );
}
