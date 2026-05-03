import { useState } from 'react';
import { AVATAR_PRESETS } from '../constants';
import { Avatar3D } from '../components/Avatar3D';
import { 
  RefreshCw, ChevronRight, LogOut, Save, Check, 
  Database, Edit2, Sun, Moon, Sparkles, CreditCard, Ticket, X
} from 'lucide-react';

export function Profile({
  isScrolled, handleScan, userName, userAvatar, isDark, themeMode, toggleDarkMode,
  ratingScale, pricing, spreadsheetId, updateUserName, updateAvatar,
  updateRatingScale, updatePricing, triggerCloudSave, onEditSpreadsheet, onLogout,
}) {
  const [saveStatus, setSaveStatus] = useState('idle');
  const [isDirty, setIsDirty] = useState(false);
  const [showSheetModal, setShowSheetModal] = useState(false);
  const [tempSheetId, setTempSheetId] = useState(spreadsheetId);

  const handleChange = (updateFn, ...args) => {
    updateFn(...args);
    setIsDirty(true);
  };

  const handlePriceChange = (key, value) => {
    const displayValue = value.replace('.', ',');
    const dataValue = value.replace(',', '.');
    if (/^\d*[.,]?\d{0,2}$/.test(displayValue) || displayValue === '') {
      handleChange(updatePricing, { ...pricing, [key]: dataValue });
    }
  };

  return (
    <div className="min-h-screen font-outfit pb-40 transition-colors duration-1000 bg-[var(--theme-bg)]">
      
      {/* MODAL GOOGLE SHEET */}
      {showSheetModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowSheetModal(false)} />
          <div className="relative w-full max-w-sm bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-[2.5rem] p-8 shadow-2xl">
            <div className="flex justify-between items-start mb-6 text-left">
              <div>
                <h3 className="text-xl font-bold text-[var(--theme-text)]">Base de données</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-accent)] mt-1">Google Sheets ID</p>
              </div>
              <button onClick={() => setShowSheetModal(false)} className="p-2 rounded-full bg-[var(--theme-bg)] text-[var(--theme-text)] opacity-40">
                <X size={18} />
              </button>
            </div>
            <input 
              type="text"
              value={tempSheetId}
              onChange={(e) => setTempSheetId(e.target.value)}
              className="w-full bg-[var(--theme-bg)] border border-[var(--theme-border)] rounded-2xl px-5 py-4 font-mono text-xs text-[var(--theme-text)] outline-none"
            />
            <button 
              onClick={() => { onEditSpreadsheet(tempSheetId); setShowSheetModal(false); setIsDirty(true); }}
              className="w-full mt-6 bg-[var(--theme-text)] text-[var(--theme-bg)] h-14 rounded-2xl font-black text-xs uppercase tracking-widest"
            >
              Confirmer
            </button>
          </div>
        </div>
      )}

      {/* HEADER STICKY - PADDING HARMONISÉ */}
      <header className={`z-[90] sticky top-0 w-full transition-all duration-500 ${
        isScrolled ? 'bg-[var(--theme-bg)]/90 backdrop-blur-xl border-b border-[var(--theme-border)]' : 'bg-transparent'
      }`}>
        <div className="px-8 pt-safe pb-safe flex justify-between items-center h-20">
          <h1 className={`font-galinoy text-[var(--theme-text)] transition-all duration-500 ${isScrolled ? 'text-2xl' : 'text-4xl'}`}>
            Mon compte
          </h1>

          <button
            onClick={async () => {
              setSaveStatus('saving');
              await triggerCloudSave();
              setSaveStatus('success');
              setTimeout(() => { setSaveStatus('idle'); setIsDirty(false); }, 1500);
            }}
            className={`h-11 px-6 rounded-full flex items-center gap-2 font-black text-[10px] uppercase tracking-widest transition-all duration-500 shadow-2xl ${
              isDirty ? 'bg-[var(--theme-text)] text-[var(--theme-bg)] scale-100 opacity-100' : 'opacity-0 scale-95 pointer-events-none'
            }`}
          >
            {saveStatus === 'saving' ? <RefreshCw size={12} className="animate-spin" /> : 
             saveStatus === 'success' ? <Check size={14} /> : <Save size={12} />}
            {saveStatus === 'success' ? 'Enregistré' : 'Sauvegarder'}
          </button>
        </div>
      </header>

      <main className="px-6 mt-8 space-y-12 !overflow-visible">
        
        {/* IDENTITY */}
        <section className="flex flex-col items-center !overflow-visible">
          <div className="relative rounded-full ring-4 ring-inset ring-[var(--theme-accent)] p-1 !overflow-visible">
            <Avatar3D src={userAvatar} size={140} primary="transparent" borderWidth={0} />
          </div>
          <div className="mt-6 flex items-center gap-3 group">
            <input
              type="text"
              value={userName}
              onChange={(e) => handleChange(updateUserName, e.target.value)}
              style={{ width: `${Math.max(userName.length, 1)}ch`, minWidth: '100px' }}
              className="font-galinoy text-4xl bg-transparent outline-none text-[var(--theme-text)] text-center focus:text-[var(--theme-accent)] transition-colors"
            />
            <Edit2 size={18} className="text-[var(--theme-text)] opacity-20 group-focus-within:text-[var(--theme-accent)] group-focus-within:opacity-100 transition-all" />
          </div>
        </section>

        {/* PRÉFÉRENCES */}
        <div className="space-y-6 !overflow-visible">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--theme-text)] opacity-30 ml-4 text-left">Préférences</h3>
          
          <div className="bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-[2.5rem] p-5 space-y-8 backdrop-blur-md !overflow-visible">
            
            {/* THÈME */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col ml-2 text-left">
                <span className="text-lg font-bold text-[var(--theme-text)]">Apparence</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-accent)] mt-1">
                  {themeMode === 'system' ? 'Automatique' : themeMode === 'dark' ? 'Sombre' : 'Clair'}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-[var(--theme-bg)] p-1.5 rounded-full border border-[var(--theme-border)]">
                <div className="relative flex items-center bg-[var(--theme-surface)] rounded-full p-1">
                  <div 
                    className="absolute h-7 w-7 bg-[var(--theme-text)] rounded-full transition-all duration-500"
                    style={{ transform: `translateX(${isDark ? '100%' : '0%'})`, left: '4px', opacity: themeMode === 'system' ? 0.2 : 1 }}
                  />
                  <button onClick={() => handleChange(toggleDarkMode, 'light')} className={`relative z-10 w-7 h-7 flex items-center justify-center transition-colors ${themeMode === 'light' ? 'text-[var(--theme-bg)]' : 'text-[var(--theme-text)] opacity-40'}`}>
                    <Sun size={12} strokeWidth={2.5} />
                  </button>
                  <button onClick={() => handleChange(toggleDarkMode, 'dark')} className={`relative z-10 w-7 h-7 flex items-center justify-center transition-colors ${themeMode === 'dark' ? 'text-black' : 'text-[var(--theme-text)] opacity-40'}`}>
                    <Moon size={12} strokeWidth={2.5} />
                  </button>
                </div>
                <div className="w-[1px] h-3 bg-[var(--theme-border)] opacity-50" />
                <button onClick={() => handleChange(toggleDarkMode, 'system')} className={`h-9 px-4 rounded-full flex items-center gap-2 transition-all font-black text-[9px] uppercase tracking-widest ${themeMode === 'system' ? 'bg-[var(--theme-text)] text-[var(--theme-bg)]' : 'text-[var(--theme-text)] opacity-30'}`}>
                  <Sparkles size={10} /> Auto
                </button>
              </div>
            </div>

            {/* NOTATION /10 (FIXÉ) */}
            <div className="flex items-center justify-between border-t border-[var(--theme-border)] pt-6">
              <div className="flex flex-col ml-2 text-left">
                <span className="text-lg font-bold text-[var(--theme-text)]">Notation</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-text)] opacity-30 mt-1">Échelle</span>
              </div>
              
              <div 
                onClick={() => handleChange(updateRatingScale, ratingScale === 5 ? 10 : 5)}
                className="relative w-40 h-14 bg-[var(--theme-bg)] rounded-full border border-[var(--theme-border)] cursor-pointer flex items-center"
              >
                <div 
                  className="absolute h-11 w-20 bg-[var(--theme-text)] rounded-full transition-all duration-500 flex items-center justify-center shadow-xl"
                  style={{ left: ratingScale === 5 ? '6px' : 'calc(100% - 80px - 6px)' }}
                >
                  <span className="font-black text-[var(--theme-bg)] text-[12px]">/{ratingScale}</span>
                </div>
                <div className="flex w-full items-center justify-around text-[var(--theme-text)] opacity-20 text-[10px] font-black uppercase pointer-events-none">
                  <span className={ratingScale === 5 ? 'invisible' : ''}>Sur 5</span>
                  <span className={ratingScale === 10 ? 'invisible' : ''}>Sur 10</span>
                </div>
              </div>
            </div>

            {/* AVATAR CAROUSEL - ANTI-CLIPPING FINAL */}
            <div className="border-t border-[var(--theme-border)] pt-8 !overflow-visible">
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-text)] opacity-30 block ml-2 text-left mb-2">Avatar</span>
              <div className="relative w-full !overflow-visible">
                {/* On force l'overflow visible vertical via padding compensatoire */}
                <div className="flex gap-6 overflow-x-auto scrollbar-hide py-10 -my-10 px-4 !overflow-y-visible">
                  {AVATAR_PRESETS.map((url, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => handleChange(updateAvatar, url)} 
                      className={`flex-shrink-0 transition-all duration-500 rounded-full p-0.5 border-2 ${
                        userAvatar === url 
                        ? 'border-[var(--theme-accent)] scale-[1.35] shadow-2xl z-20 translate-y-[-2px]' 
                        : 'border-transparent opacity-20 grayscale scale-90 z-10 hover:opacity-40'
                      }`}
                    >
                      <Avatar3D src={url} size={54} primary="transparent" borderWidth={0} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CONFIGURATION */}
<div className="space-y-6">
  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--theme-text)] opacity-30 ml-4 text-left">Configuration</h3>
  <div className="bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-[2.5rem] overflow-hidden backdrop-blur-md">
    <div className="p-6 space-y-6">
      {[
        { label: 'Cinepass mensuel', key: 'monthlySub', icon: CreditCard, sub: 'Abonnement' },
        { label: 'Ticket unitaire', key: 'ticketPrice', icon: Ticket, sub: 'Hors-forfait' }
      ].map((item) => (
        <div key={item.key} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-[var(--theme-bg)] flex items-center justify-center text-[var(--theme-text)] border border-[var(--theme-border)]">
              <item.icon size={18} />
            </div>
            <div className="text-left min-w-0">
              <p className="text-[9px] font-black uppercase tracking-widest opacity-40 truncate">{item.sub}</p>
              <p className="text-sm font-bold truncate">{item.label}</p>
            </div>
          </div>
          
          {/* Input ajusté : flex-shrink-0 et largeur fixe suffisante */}
          <div className="flex-shrink-0 flex items-center gap-2 bg-[var(--theme-bg)] px-4 h-12 rounded-2xl border border-[var(--theme-border)] w-32">
            <input 
              type="text" 
              inputMode="decimal"
              value={pricing?.[item.key]?.toString().replace('.', ',') || ''}
              onChange={(e) => handlePriceChange(item.key, e.target.value)}
              className="bg-transparent flex-1 text-right font-black text-sm outline-none w-full text-[var(--theme-text)]"
              placeholder="0"
            />
            <span className="text-[10px] opacity-40 font-black text-[var(--theme-text)]">€</span>
          </div>
        </div>
      ))}
    </div>
    
    <div className="border-t border-[var(--theme-border)]">
      <button onClick={() => { setTempSheetId(spreadsheetId); setShowSheetModal(true); }} className="w-full flex items-center justify-between p-6 hover:bg-[var(--theme-text)]/5 transition-colors border-b border-[var(--theme-border)]">
        <div className="flex items-center gap-4 min-w-0">
          <Database size={18} className="opacity-40 flex-shrink-0" />
          <div className="text-left min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Base de données</p>
            <p className="text-[10px] font-mono opacity-60 truncate">{spreadsheetId}</p>
          </div>
        </div>
        <ChevronRight size={14} className="opacity-20 flex-shrink-0" />
      </button>
      <button onClick={handleScan} className="w-full flex items-center justify-between p-6 hover:bg-[var(--theme-text)]/5 transition-colors">
        <div className="flex items-center gap-4 text-[var(--theme-text)]">
          <RefreshCw size={18} className="opacity-40 flex-shrink-0" />
          <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Synchronisation forcée</p>
        </div>
        <ChevronRight size={14} className="opacity-20 flex-shrink-0" />
      </button>
    </div>
  </div>
</div>

        {/* LOGOUT */}
        <button onClick={onLogout} className="w-full flex items-center justify-center gap-3 py-6 rounded-[2.5rem] bg-[var(--theme-surface)] border border-[var(--theme-border)] text-[var(--theme-text)] opacity-40 hover:opacity-100 transition-all duration-300">
          <LogOut size={16} />
          <span className="text-[10px] font-black uppercase tracking-[0.4em]">Fermer la session</span>
        </button>
      </main>
    </div>
  );
}