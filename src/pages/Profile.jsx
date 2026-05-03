import { useState, useMemo } from 'react';
import { THEME_COLORS, AVATAR_PRESETS } from '../constants';
import { Avatar3D } from '../components/Avatar3D';
import { RefreshCw, ChevronRight, LogOut, Save, Check, Database, Edit2, X } from 'lucide-react';

export function Profile({
  isScrolled,
  handleScan,
  userName,
  userAvatar,
  currentThemeKey,
  ratingScale,
  pricing,
  spreadsheetId,
  historyData,
  updateUserName,
  updateAvatar,
  updateTheme,
  updateRatingScale,
  updatePricing,
  triggerCloudSave,
  onEditSpreadsheet,
  onLogout,
}) {
  const activeTheme = useMemo(() => THEME_COLORS[currentThemeKey] || THEME_COLORS.default, [currentThemeKey]);
  const anneesDisponibles = useMemo(() => [
    ...new Set(historyData.map((f) => f.date?.split('/')[2]).filter(Boolean)),
  ].sort((a, b) => b - a), [historyData]);

  const [pricingYearEditor, setPricingYearEditor] = useState('default');
  const [saveStatus, setSaveStatus] = useState('idle');
  const [isDirty, setIsDirty] = useState(false);
  const [isSheetModalOpen, setIsSheetModalOpen] = useState(false);
  const [tempSheetId, setTempSheetId] = useState(spreadsheetId);

  const handleChange = (updateFn, ...args) => {
    updateFn(...args);
    setIsDirty(true);
  };

  const handleManualSave = async () => {
    setSaveStatus('saving');
    try {
      await triggerCloudSave();
      setSaveStatus('success');
      setTimeout(() => { setSaveStatus('idle'); setIsDirty(false); }, 1500);
    } catch (e) { setSaveStatus('idle'); }
  };

  return (
    <div 
      className="min-h-screen font-outfit pb-40 transition-all duration-1000"
      style={{ 
        background: activeTheme.bgGradient || '#000',
        '--color-primary': activeTheme.primary 
      }}
    >
      <header className={`z-40 sticky top-0 w-full transition-all duration-700 ${
        isScrolled ? 'bg-black/20 backdrop-blur-2xl border-b border-white/5' : 'bg-transparent'
      }`}>
        <div className="px-6 pt-safe pb-4 flex justify-between items-end">
          <div>
            {!isScrolled && <span className="text-[var(--color-primary)] font-black text-[10px] uppercase tracking-[0.3em] ml-1">Configuration</span>}
            <h1 className={`font-galinoy text-white transition-all ${isScrolled ? 'text-3xl' : 'text-6xl'}`}>Profil</h1>
          </div>
          
          <div className={`transition-all duration-500 ${isDirty ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}`}>
            <button
              onClick={handleManualSave}
              className="h-9 px-4 rounded-full flex items-center gap-2 font-black text-[9px] uppercase tracking-widest bg-white text-black shadow-2xl active:scale-95 transition-all"
            >
              {saveStatus === 'saving' ? <RefreshCw size={12} className="animate-spin" /> : 
               saveStatus === 'success' ? <Check size={14} className="text-green-600" /> : <Save size={12} />}
              {saveStatus === 'idle' && "Appliquer"}
            </button>
          </div>
        </div>
      </header>

      <main className="px-6 mt-12 space-y-16">
        <section className="flex flex-col items-center">
          <Avatar3D src={userAvatar} size={130} primary="var(--color-primary)" glow="rgba(255,255,255,0.1)" borderWidth={0} />
          <div className="mt-8 flex flex-col items-center">
            <div className="relative inline-flex items-center group">
              <input
                type="text"
                value={userName}
                onChange={(e) => handleChange(updateUserName, e.target.value)}
                style={{ width: `${Math.max(userName.length, 1)}ch`, minWidth: '160px' }}
                className="font-galinoy text-4xl bg-transparent outline-none text-white text-center focus:text-white transition-colors pr-2"
              />
              <Edit2 size={16} className="text-white/20 group-focus-within:text-white transition-colors shrink-0" />
            </div>
            <p className="text-white/30 text-[9px] font-black uppercase tracking-[0.4em] mt-3 italic">Premium Cinephile</p>
          </div>
        </section>

        <section className="space-y-4">
           <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">Système</h3>
           <div className="bg-black/20 rounded-[2.5rem] border border-white/10 overflow-hidden backdrop-blur-md">
              <button onClick={() => setIsSheetModalOpen(true)} className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors border-b border-white/5">
                <div className="flex items-center gap-4 text-left">
                  <Database size={18} className="text-white/70" />
                  <div>
                    <p className="text-[10px] font-black text-white uppercase">Google Sheet ID</p>
                    <p className="text-[9px] text-white/40 truncate max-w-[140px] font-mono mt-1 italic">{spreadsheetId}</p>
                  </div>
                </div>
                <span className="text-[8px] font-black text-white/40 uppercase tracking-widest border border-white/20 px-2 py-1 rounded">Changer</span>
              </button>
              <button onClick={handleScan} className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-4 text-left">
                  <RefreshCw size={18} className="text-white/40" />
                  <p className="text-[10px] font-black text-white uppercase">Forcer Sync Cloud</p>
                </div>
                <ChevronRight size={14} className="text-white/10" />
              </button>
           </div>
        </section>

        <section className="space-y-6">
          <div className="flex justify-between items-end px-1">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Finance</h3>
            <select
              value={pricingYearEditor}
              onChange={(e) => setPricingYearEditor(e.target.value)}
              className="bg-white/10 text-white text-[9px] font-black uppercase tracking-widest outline-none rounded-full px-3 py-1"
            >
              <option value="default">Global</option>
              {anneesDisponibles.map((y) => <option key={y} value={y} className="text-black">{y}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[{ k: 'sub', l: 'Mensuel' }, { k: 'ticket', l: 'Ticket' }].map((item) => (
              <div key={item.k} className="bg-black/20 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/10">
                <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-2">{item.l}</p>
                <div className="flex items-baseline gap-1">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={pricing[pricingYearEditor]?.[item.k] ?? pricing.default?.[item.k] ?? ''}
                    onChange={(e) => {
                      let v = e.target.value.replace(',', '.');
                      const newPricing = { ...pricing, [pricingYearEditor]: { ...pricing[pricingYearEditor], [item.k]: v } };
                      handleChange(updatePricing, newPricing);
                    }}
                    className="w-full bg-transparent outline-none font-galinoy text-4xl text-white focus:text-[var(--color-primary)] transition-colors"
                  />
                  <span className="text-white/50 font-black text-xs">€</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">Apparence</h3>
          <div className="flex gap-5 overflow-x-auto scrollbar-hide py-2 px-1">
            {AVATAR_PRESETS.map((url, idx) => (
              <button
                key={idx}
                onClick={() => handleChange(updateAvatar, url)}
                className={`flex-shrink-0 transition-all duration-500 ${userAvatar === url ? 'scale-110' : 'opacity-20 grayscale hover:opacity-100 hover:grayscale-0'}`}
              >
                <Avatar3D src={url} size={64} primary={userAvatar === url ? 'white' : 'transparent'} borderWidth={userAvatar === url ? 2 : 0} />
              </button>
            ))}
          </div>
          <div className="flex gap-4 overflow-x-auto scrollbar-hide py-2 px-1">
            {Object.entries(THEME_COLORS).map(([key, t]) => (
              <button
                key={key}
                onClick={() => handleChange(updateTheme, key)}
                className={`flex-shrink-0 w-11 h-11 rounded-full transition-all ${currentThemeKey === key ? 'ring-2 ring-white ring-offset-4 ring-offset-transparent scale-90' : 'opacity-40 hover:opacity-100'}`}
                style={{ background: t.bgGradient }}
              />
            ))}
          </div>
        </section>

        <section className="bg-black/20 border border-white/10 rounded-[2.5rem] p-4 flex items-center justify-between backdrop-blur-md">
            <span className="ml-4 font-galinoy text-2xl text-white italic opacity-80">Notation</span>
            <div 
              onClick={() => handleChange(updateRatingScale, ratingScale === 5 ? 10 : 5)}
              className="relative w-32 h-12 bg-black/40 rounded-full border border-white/10 cursor-pointer p-1"
            >
              <div className={`absolute inset-1 w-1/2 rounded-full bg-white transition-all duration-500 flex items-center justify-center shadow-lg ${ratingScale === 10 ? 'translate-x-full' : 'translate-x-0'}`}>
                <span className="font-black text-black text-[10px]">/{ratingScale}</span>
              </div>
              <div className="flex w-full h-full items-center justify-around text-white/20 text-[9px] font-black">
                <span>5</span>
                <span>10</span>
              </div>
            </div>
        </section>

        <button onClick={onLogout} className="w-full flex items-center justify-center gap-3 py-6 rounded-[2.5rem] bg-white/5 border border-white/10 text-white/30 hover:text-red-400 transition-all mt-10">
          <LogOut size={16} />
          <span className="text-[9px] font-black uppercase tracking-[0.4em]">Déconnexion</span>
        </button>
      </main>

      {isSheetModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setIsSheetModalOpen(false)} />
          <div className="relative w-full max-w-sm bg-zinc-900 border border-white/10 rounded-[3rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300 text-center">
            <button onClick={() => setIsSheetModalOpen(false)} className="absolute top-6 right-6 text-white/20 hover:text-white"><X size={20} /></button>
            <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mb-6 border border-white/10 mx-auto">
              <Database size={28} className="text-white" />
            </div>
            <h2 className="font-galinoy text-3xl text-white mb-2">Base de données</h2>
            <p className="text-white/40 text-[10px] uppercase font-black mb-8">ID Google Sheet</p>
            <input
              type="text"
              value={tempSheetId}
              onChange={(e) => setTempSheetId(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-center font-mono text-xs text-white outline-none focus:border-white mb-4"
            />
            <button
              onClick={() => { onEditSpreadsheet(tempSheetId); setIsSheetModalOpen(false); }}
              className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase text-[10px] active:scale-95 transition-all"
            >
              Mettre à jour
            </button>
          </div>
        </div>
      )}
    </div>
  );
}