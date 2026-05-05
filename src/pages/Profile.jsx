import React, { useState, useEffect } from 'react';
import { AVATAR_PRESETS } from '../constants';
import { Avatar3D } from '../components/Avatar3D';
import * as api from '../api';
import { 
  RefreshCw, ChevronRight, LogOut, Save, Check, 
  Database, Edit2, Sun, Moon, Sparkles, CreditCard, Ticket, X 
} from 'lucide-react';

export function Profile({
  isScrolled, handleScan, userName, userAvatar, isDark, themeMode, toggleDarkMode,
  ratingScale, pricing, spreadsheetId, updateUserName, updateAvatar,
  updateRatingScale, updatePricing, triggerCloudSave, onEditSpreadsheet, onLogout,
  userToken,
}) {
  const [saveStatus, setSaveStatus] = useState('idle');
  const [isDirty, setIsDirty] = useState(false);
  const [showSheetModal, setShowSheetModal] = useState(false);
  const [tempSheetId, setTempSheetId] = useState(spreadsheetId);
  const [isSyncing, setIsSyncing] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  // Synchronisation du scroll local pour l'animation du titre
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrolled = scrollY > 20;

  const handleChange = (updateFn, ...args) => {
    updateFn(...args);
    setIsDirty(true);
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    await triggerCloudSave();
    if (userToken && spreadsheetId && pricing) {
      try {
        await api.saveConfigPricing(userToken, spreadsheetId, pricing);
      } catch (err) {
        console.error('[Profile] Failed to save pricing to sheet:', err);
      }
    }
    setSaveStatus('success');
    setTimeout(() => { 
      setSaveStatus('idle'); 
      setIsDirty(false); 
    }, 1500);
  };

  const handlePriceChange = (key, value) => {
    const dataValue = value.replace(',', '.');
    if (/^\d*[.,]?\d{0,2}$/.test(value.replace('.', ',')) || value === '') {
      handleChange(updatePricing, { ...pricing, [key]: dataValue });
    }
  };

  const handleForceSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      await handleScan();
    } catch (err) {
      console.error('Erreur lors de la synchro forcée:', err);
    } finally {
      setTimeout(() => setIsSyncing(false), 800);
    }
  };

  const SectionLabel = ({ children }) => (
    <h3 className="font-outfit text-[10px] font-black uppercase tracking-[0.2em] opacity-30 ml-5 mb-2">
      {children}
    </h3>
  );

  const Row = ({ icon: Icon, label, sublabel, children, onClick }) => (
    <div 
      onClick={onClick}
      className={`flex items-center justify-between min-h-[56px] px-5 py-3 transition-colors ${onClick ? 'active:bg-[var(--theme-text)]/5 cursor-pointer' : ''}`}
    >
      <div className="flex items-center gap-4 min-w-0">
        {Icon && <Icon size={20} className="opacity-40 flex-shrink-0" />}
        <div className="flex flex-col text-left truncate">
          <span className="font-outfit text-[14px] font-bold text-[var(--theme-text)]">{label}</span>
          {sublabel && <span className="font-outfit text-[11px] opacity-40 leading-tight truncate">{sublabel}</span>}
        </div>
      </div>
      <div className="flex-shrink-0 ml-4">{children}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] font-outfit pb-8 relative">
      
      {/* HEADER STICKY CORRIGÉ */}
      <header
        className="sticky top-0 z-50 flex justify-between items-center px-8 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-2 transition-all duration-300"
        style={{
          // On mixe le background du thème avec de la transparence en fonction du scroll
          backgroundColor: `color-mix(in srgb, var(--theme-bg) ${scrolled ? 80 : 0}%, transparent)`,
          // L'effet "Frosted" (Givré)
          backdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'blur(20px) saturate(180%)',
          // Optionnel : une bordure très fine en bas pour marquer la séparation au scroll
          borderBottom: scrolled ? '1px solid var(--theme-border)' : '1px solid transparent',
        }}
      >
        <div className="flex flex-col justify-center">
          <h1 
            className="font-galinoy italic text-[var(--theme-text)] text-4xl tracking-tight leading-none transition-transform duration-300"
            style={{
              opacity: Math.max(0.2, 1 - scrollY / 60),
              transform: `translateY(${-scrollY * 0.1}px)`,
            }}
          >
            Réglages
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            className={`flex items-center gap-2 h-10 px-5 rounded-full font-outfit text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
              isDirty 
                ? 'bg-[var(--theme-text)] text-[var(--theme-bg)] scale-100 opacity-100 shadow-lg' 
                : 'scale-90 opacity-0 pointer-events-none'
            }`}
          >
            {saveStatus === 'saving' ? <RefreshCw size={12} className="animate-spin" /> : 
             saveStatus === 'success' ? <Check size={14} /> : <Save size={12} />}
            <span>{saveStatus === 'success' ? 'OK' : 'Appliquer'}</span>
          </button>
        </div>
      </header>

      {/* MODAL GOOGLE SHEET */}
      {showSheetModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowSheetModal(false)} />
          <div className="relative w-full max-w-sm bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-[2.5rem] p-8 shadow-2xl">
            <div className="flex justify-between items-start mb-6">
              <div className="text-left">
                <h3 className="font-outfit text-xl font-bold">Base de données</h3>
                <p className="font-outfit text-[10px] font-black uppercase tracking-widest text-[var(--theme-accent)] mt-1">Google Sheets ID</p>
              </div>
              <button onClick={() => setShowSheetModal(false)} className="p-2 rounded-full opacity-40"><X size={18} /></button>
            </div>
            <input 
              type="text"
              value={tempSheetId}
              onChange={(e) => setTempSheetId(e.target.value)}
              className="w-full bg-[var(--theme-bg)] border border-[var(--theme-border)] rounded-2xl px-5 py-4 font-mono text-xs outline-none focus:border-[var(--theme-accent)]"
            />
            <button 
              onClick={() => { onEditSpreadsheet(tempSheetId); setShowSheetModal(false); setIsDirty(true); }}
              className="w-full mt-6 bg-[var(--theme-text)] text-[var(--theme-bg)] h-14 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-transform"
            >
              Confirmer
            </button>
          </div>
        </div>
      )}

      <main className="px-4 mt-8 space-y-7">
        
        {/* SECTION 1: IDENTITY */}
        <section className="flex flex-col items-center">
          <div className="relative rounded-full ring-4 ring-[var(--theme-accent)] p-1 mb-6 shadow-xl">
            <Avatar3D src={userAvatar} size={100} primary="transparent" borderWidth={0} />
          </div>
          
          <div className="w-full overflow-x-auto scrollbar-hide py-2">
            <div className="flex gap-4 px-4 justify-start sm:justify-center">
              {AVATAR_PRESETS.map((url, idx) => (
                <button 
                  key={idx} 
                  onClick={() => handleChange(updateAvatar, url)}
                  className={`flex-shrink-0 w-12 h-12 rounded-full border-2 transition-all ${
                    userAvatar === url ? 'border-[var(--theme-accent)] scale-110 shadow-lg' : 'border-transparent opacity-30 grayscale'
                  }`}
                >
                  <Avatar3D src={url} size={44} primary="transparent" borderWidth={0} />
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 w-full max-w-xs relative flex items-center justify-center">
            <input
              type="text"
              value={userName}
              onChange={(e) => handleChange(updateUserName, e.target.value)}
              className="font-galinoy italic text-[32px] bg-transparent outline-none text-[var(--theme-text)] text-center w-full focus:text-[var(--theme-accent)] transition-colors"
            />
            <Edit2 size={14} className="absolute right-0 opacity-20" />
          </div>
        </section>

        {/* SECTION 2: APPARENCE */}
        <div>
          <SectionLabel>Apparence</SectionLabel>
          <div className="bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-[20px] overflow-hidden">
            <Row label="Thème" sublabel={themeMode === 'system' ? 'Automatique' : themeMode === 'dark' ? 'Sombre' : 'Clair'}>
              <div className="flex items-center gap-1 bg-[var(--theme-bg)] p-1 rounded-full border border-[var(--theme-border)]">
                <button onClick={() => handleChange(toggleDarkMode, 'light')} className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ${themeMode === 'light' ? 'bg-[var(--theme-text)] text-[var(--theme-bg)]' : 'opacity-40'}`}>
                  <Sun size={14} />
                </button>
                <button onClick={() => handleChange(toggleDarkMode, 'dark')} className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ${themeMode === 'dark' ? 'bg-[var(--theme-text)] text-[var(--theme-bg)]' : 'opacity-40'}`}>
                  <Moon size={14} />
                </button>
                <button onClick={() => handleChange(toggleDarkMode, 'system')} className={`px-3 h-8 flex items-center gap-1.5 rounded-full font-black text-[9px] uppercase tracking-widest transition-all ${themeMode === 'system' ? 'bg-[var(--theme-text)] text-[var(--theme-bg)]' : 'opacity-40'}`}>
                  <Sparkles size={10} /> Auto
                </button>
              </div>
            </Row>
          </div>
        </div>

        {/* SECTION 3: NOTATION */}
        <div>
          <SectionLabel>Notation</SectionLabel>
          <div className="bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-[20px] overflow-hidden">
            <Row label="Échelle de score" sublabel={ratingScale === 5 ? "Notation Cinéphile (1-5)" : "Notation Standard (1-10)"}>
              <button 
                onClick={() => handleChange(updateRatingScale, ratingScale === 5 ? 10 : 5)}
                className="relative w-28 h-9 bg-[var(--theme-bg)] rounded-full border border-[var(--theme-border)] flex items-center px-1"
              >
                <div 
                  className="absolute h-7 w-12 bg-[var(--theme-text)] rounded-full transition-all duration-300 flex items-center justify-center shadow-md"
                  style={{ left: ratingScale === 5 ? '4px' : 'calc(100% - 48px - 4px)' }}
                >
                  <span className="font-outfit font-black text-[var(--theme-bg)] text-[10px]">/{ratingScale}</span>
                </div>
                <div className="flex w-full justify-around text-[9px] font-black uppercase opacity-20 pointer-events-none">
                  <span>/5</span>
                  <span>/10</span>
                </div>
              </button>
            </Row>
          </div>
        </div>

        {/* SECTION 4: TARIFS */}
        <div>
          <SectionLabel>Tarifs & Forfaits</SectionLabel>
          <div className="bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-[20px] overflow-hidden divide-y divide-[var(--theme-border)]">
            <Row icon={CreditCard} label="Cinepass" sublabel="Mensualité abonnement">
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  inputMode="decimal"
                  value={pricing?.monthlySub?.toString().replace('.', ',') || ''}
                  onChange={(e) => handlePriceChange('monthlySub', e.target.value)}
                  className="bg-transparent outline-none text-right font-bold text-sm text-[var(--theme-text)] w-[72px]"
                />
                <span className="text-[11px] font-black opacity-30">€</span>
              </div>
            </Row>
            <Row icon={Ticket} label="Ticket" sublabel="Prix moyen hors-forfait">
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  inputMode="decimal"
                  value={pricing?.ticketPrice?.toString().replace('.', ',') || ''}
                  onChange={(e) => handlePriceChange('ticketPrice', e.target.value)}
                  className="bg-transparent outline-none text-right font-bold text-sm text-[var(--theme-text)] w-[72px]"
                />
                <span className="text-[11px] font-black opacity-30">€</span>
              </div>
            </Row>
          </div>
        </div>

        {/* SECTION 5: DATABASE & SYNC */}
        <div>
          <SectionLabel>Données & Sync</SectionLabel>
          <div className="bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-[20px] overflow-hidden divide-y divide-[var(--theme-border)]">
            <Row 
              icon={Database} 
              label="Google Sheet" 
              sublabel={spreadsheetId}
              onClick={() => { setTempSheetId(spreadsheetId); setShowSheetModal(true); }}
            >
              <ChevronRight size={16} className="opacity-20" />
            </Row>
            
            <Row 
              icon={RefreshCw} 
              label="Synchronisation" 
              sublabel={isSyncing ? "Mise à jour..." : "Forcer la mise à jour"}
              onClick={handleForceSync}
            >
              <div className={`${isSyncing ? 'animate-spin text-[var(--theme-accent)]' : 'opacity-20'}`}>
                <RefreshCw size={16} />
              </div>
            </Row>
          </div>
        </div>

        {/* LOGOUT */}
        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-5 rounded-[20px] border border-[var(--theme-border)] text-red-500 active:bg-red-500/10 transition-colors"
        >
          <LogOut size={16} />
          <span className="font-outfit text-[12px] font-black uppercase tracking-[0.2em]">Fermer la session</span>
        </button>

      </main>
    </div>
  );
}