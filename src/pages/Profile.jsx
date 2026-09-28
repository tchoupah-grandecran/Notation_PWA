import { useState, useEffect, useCallback, useRef } from 'react';
import { ACCENT_PALETTES, AVATAR_PRESETS } from '../constants';
import { Avatar3D } from '../components/Avatar3D';
import { 
  RefreshCw, ChevronRight, LogOut, Save, Check, 
  Database, Edit2, Sun, Moon, Sparkles, CreditCard, Ticket, X 
} from 'lucide-react';

const getCurrentTariffStartDate = (pricing, type) => {
  const amountKey = type === 'ticket' ? 'ticketPrice' : 'monthlySub';
  const currentAmount = Number(String(pricing?.[amountKey] ?? '').replace(',', '.'));
  if (!Number.isFinite(currentAmount) || currentAmount <= 0) return '';
  const events = [];

  (Array.isArray(pricing?.priceHistory) ? pricing.priceHistory : []).forEach((entry) => {
    if (entry.type === type && entry.effectiveFrom) {
      const amount = Number(String(entry.amount ?? '').replace(',', '.'));
      if (Number.isFinite(amount)) events.push({ date: entry.effectiveFrom, amount });
      return;
    }
    if (/^\d{4}-\d{2}$/.test(String(entry.period || ''))) {
      const raw = type === 'ticket' ? entry.ticketPrice : entry.monthlySub;
      const amount = Number(String(raw ?? '').replace(',', '.'));
      if (Number.isFinite(amount)) events.push({ date: `${entry.period}-01`, amount });
    }
  });

  Object.entries(pricing || {}).forEach(([year, values]) => {
    if (!/^\d{4}$/.test(year) || !values || typeof values !== 'object') return;
    const raw = type === 'ticket'
      ? (values.ticketPrice ?? values.ticket)
      : (values.monthlySub ?? values.sub);
    const amount = Number(String(raw ?? '').replace(',', '.'));
    if (Number.isFinite(amount)) events.push({ date: `${year}-01-01`, amount });
  });

  const matchingEvents = events
    .filter((event) => Math.abs(event.amount - currentAmount) < 0.001)
    .sort((a, b) => a.date.localeCompare(b.date));
  return matchingEvents.at(-1)?.date || '';
};

export function Profile({
  handleScan, userName, userAvatar, themeMode, toggleDarkMode,
  accentPalette, updateAccentPalette, prideAccentEnabled, updatePrideAccentEnabled,
  ratingScale, pricing, spreadsheetId, updateUserName, updateAvatar,
  updateRatingScale, updatePricing, triggerCloudSave, onEditSpreadsheet, onLogout,
  onHeaderRight, // Récupéré depuis App.jsx
}) {
  const [saveStatus, setSaveStatus] = useState('idle');
  const [isDirty, setIsDirty] = useState(false);
  const [showSheetModal, setShowSheetModal] = useState(false);
  const [tempSheetId, setTempSheetId] = useState(spreadsheetId);
  const [syncStatus, setSyncStatus] = useState('idle');
  const [priceEffectiveDates, setPriceEffectiveDates] = useState(() => {
    return {
      ticket: getCurrentTariffStartDate(pricing, 'ticket'),
      subscription: getCurrentTariffStartDate(pricing, 'subscription'),
    };
  });
  const priceDateTouchedRef = useRef({ ticket: false, subscription: false });
  const saveStatusTimer = useRef(null);
  const sheetDialogRef = useRef(null);
  const sheetInputRef = useRef(null);
  const sheetTriggerRef = useRef(null);

  useEffect(() => {
    setPriceEffectiveDates((current) => ({
      ticket: priceDateTouchedRef.current.ticket ? current.ticket : getCurrentTariffStartDate(pricing, 'ticket'),
      subscription: priceDateTouchedRef.current.subscription ? current.subscription : getCurrentTariffStartDate(pricing, 'subscription'),
    }));
  }, [pricing]);

  const handleChange = (updateFn, ...args) => {
    updateFn(...args);
    setIsDirty(true);
  };

  const handleSave = useCallback(async () => {
    if (saveStatus === 'saving') return;
    clearTimeout(saveStatusTimer.current);
    setSaveStatus('saving');
    try {
      const saved = await triggerCloudSave();
      if (saved === false) throw new Error('La sauvegarde n’a pas pu démarrer.');
      setSaveStatus('success');
      setIsDirty(false);
      saveStatusTimer.current = setTimeout(() => setSaveStatus('idle'), 1800);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des préférences :', error);
      setSaveStatus('error');
      saveStatusTimer.current = setTimeout(() => setSaveStatus('idle'), 4000);
    }
  }, [saveStatus, triggerCloudSave]);

  const handlePriceChange = (key, value) => {
    const dataValue = value.replace(',', '.');
    if (/^\d*[.,]?\d{0,2}$/.test(value.replace('.', ',')) || value === '') {
      const type = key === 'ticketPrice' ? 'ticket' : 'subscription';
      priceDateTouchedRef.current[type] = true;
      handleChange(
        updatePricing,
        { ...pricing, [key]: dataValue },
        { type, amount: dataValue, effectiveFrom: priceEffectiveDates[type] }
      );
    }
  };

  const handlePriceEffectiveDateChange = (type, value) => {
    const previousEffectiveFrom = priceEffectiveDates[type];
    priceDateTouchedRef.current[type] = true;
    setPriceEffectiveDates((dates) => ({ ...dates, [type]: value }));
    const key = type === 'ticket' ? 'ticketPrice' : 'monthlySub';
    if (pricing?.[key] !== '' && pricing?.[key] !== undefined) {
      handleChange(updatePricing, { ...pricing }, {
        type,
        amount: pricing[key],
        effectiveFrom: value,
        previousEffectiveFrom,
      });
    }
  };

  const handleForceSync = async () => {
    if (syncStatus === 'syncing') return;
    setSyncStatus('syncing');
    try {
      const synced = await handleScan();
      setSyncStatus(synced === false ? 'error' : 'success');
    } catch (err) {
      console.error('Erreur lors de la synchro forcée:', err);
      setSyncStatus('error');
    }
  };

  useEffect(() => () => clearTimeout(saveStatusTimer.current), []);

  useEffect(() => {
    if (!showSheetModal) return undefined;
    sheetTriggerRef.current = document.activeElement;
    const focusFrame = requestAnimationFrame(() => sheetInputRef.current?.focus());
    const handleDialogKeys = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setShowSheetModal(false);
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = sheetDialogRef.current?.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleDialogKeys);
    return () => {
      cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', handleDialogKeys);
      sheetTriggerRef.current?.focus?.();
    };
  }, [showSheetModal]);

  /* ─── TÉLÉPORTATION DU BOUTON DANS LE HEADER GÉNÉRAL ──────────────── */
  useEffect(() => {
    if (!onHeaderRight) return;

    // Si l'user a modifié quelque chose OU qu'une sauvegarde est en cours/succès
    if (isDirty || saveStatus !== 'idle') {
      onHeaderRight(
        <button
          type="button"
          onClick={handleSave}
          disabled={saveStatus === 'saving'}
          aria-busy={saveStatus === 'saving'}
          className="flex min-h-11 items-center gap-2 rounded-full border-2 border-transparent px-4 font-outfit text-[10px] font-black uppercase tracking-widest transition-all duration-300 shadow-md active:scale-95 disabled:opacity-70"
          style={{
            background: 'linear-gradient(var(--theme-action-bg), var(--theme-action-bg)) padding-box, var(--theme-accent-gradient) border-box',
            color: 'var(--theme-action-ink)',
          }}
        >
          {saveStatus === 'saving' ? <RefreshCw size={12} className="animate-spin" /> : 
           saveStatus === 'success' ? <Check size={14} /> :
           saveStatus === 'error' ? <X size={14} /> : <Save size={12} />}
          <span>{saveStatus === 'success' ? 'Enregistré' : saveStatus === 'error' ? 'Réessayer' : 'Appliquer'}</span>
        </button>
      );
    } else {
      // On vide le slot si tout est propre
      onHeaderRight(null);
    }

    // Nettoyage lorsque l'utilisateur quitte l'onglet Profil
    return () => onHeaderRight(null);
  }, [handleSave, isDirty, saveStatus, onHeaderRight]);

  const SectionLabel = ({ children }) => (
    <h3 className="font-outfit text-[10px] font-black uppercase tracking-[0.2em] opacity-30 ml-5 mb-2">
      {children}
    </h3>
  );

  const Row = ({ icon: Icon, label, sublabel, children, onClick, ariaLabel, disabled = false, compact = false }) => {
    const content = (
      <>
        <div className={`flex min-w-0 items-center ${compact ? 'gap-3' : 'gap-4'}`}>
          {Icon && <Icon size={compact ? 18 : 20} className="flex-shrink-0 opacity-40" />}
          <div className="flex min-w-0 flex-col text-left">
            <span className={`font-outfit font-bold text-[var(--theme-text)] ${compact ? 'text-[13px]' : 'text-[14px]'}`}>{label}</span>
            {sublabel && <span className={`truncate font-outfit leading-tight opacity-40 ${compact ? 'text-[10px]' : 'text-[11px]'}`}>{sublabel}</span>}
          </div>
        </div>
        <div className={`${compact ? 'ml-2' : 'ml-4'} flex-shrink-0`}>{children}</div>
      </>
    );
    const className = `flex w-full items-center justify-between text-left transition-colors ${compact ? 'min-h-[82px] px-4 py-2' : 'min-h-[56px] px-5 py-3'} ${onClick ? 'active:bg-[var(--theme-text)]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--theme-accent)] disabled:opacity-50' : ''}`;
    return onClick ? (
      <button type="button" onClick={onClick} disabled={disabled} aria-label={ariaLabel} className={className}>
        {content}
      </button>
    ) : (
      <div className={className}>{content}</div>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] font-outfit pb-12 relative">
      
      {/* MODAL GOOGLE SHEET */}
      {showSheetModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6 py-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" aria-hidden="true" onClick={() => setShowSheetModal(false)} />
          <div
            ref={sheetDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="sheet-dialog-title"
            className="relative max-h-[90dvh] w-full max-w-sm overflow-y-auto rounded-[2.5rem] border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 shadow-2xl sm:p-8"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="text-left">
                <h3 id="sheet-dialog-title" className="font-outfit text-xl font-bold">Base de données</h3>
                <p className="font-outfit text-[10px] font-black uppercase tracking-widest text-[var(--theme-accent)] mt-1">Google Sheets ID</p>
              </div>
              <button type="button" onClick={() => setShowSheetModal(false)} aria-label="Fermer la fenêtre" className="flex h-11 w-11 items-center justify-center rounded-full opacity-50 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]">
                <X size={18} />
              </button>
            </div>
            <input 
              ref={sheetInputRef}
              id="spreadsheet-id"
              type="text"
              aria-label="Identifiant Google Sheets"
              autoComplete="off"
              value={tempSheetId}
              onChange={(e) => setTempSheetId(e.target.value)}
              className="min-h-12 w-full rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg)] px-5 py-4 font-mono text-xs outline-none focus:border-[var(--theme-accent)] focus:ring-2 focus:ring-[var(--theme-accent)]/30"
            />
            <button 
              type="button"
              onClick={() => { onEditSpreadsheet(tempSheetId); setShowSheetModal(false); }}
              className="mt-6 min-h-14 w-full rounded-2xl border-2 border-transparent font-black text-xs uppercase tracking-widest active:scale-95 transition-transform"
              style={{
                background: 'linear-gradient(var(--theme-action-bg), var(--theme-action-bg)) padding-box, var(--theme-accent-gradient) border-box',
                color: 'var(--theme-action-ink)',
              }}
            >
              Confirmer
            </button>
          </div>
        </div>
      )}

      {/* 
        Remplacement du header par un Spacer intelligent (pt) 
        qui pousse le contenu sous le AppHeader général flottant 
      */}
      <main
        className="space-y-7 px-4"
        style={{
          paddingTop: 'calc(var(--header-total-height, 96px) + 0.75rem)',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 3rem)',
        }}
      >
        {(saveStatus === 'success' || saveStatus === 'error') && (
          <p
            role={saveStatus === 'error' ? 'alert' : 'status'}
            aria-live={saveStatus === 'error' ? 'assertive' : 'polite'}
            className={`rounded-2xl px-4 py-3 text-center font-outfit text-[12px] ${saveStatus === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-600'}`}
          >
            {saveStatus === 'success' ? 'Tes préférences sont enregistrées.' : 'La sauvegarde a échoué. Vérifie ta connexion puis réessaie.'}
          </p>
        )}
        
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
                  type="button"
                  onClick={() => handleChange(updateAvatar, url)}
                  aria-label={`Choisir l’avatar ${idx + 1}`}
                  aria-pressed={userAvatar === url}
                  className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] ${
                    userAvatar === url ? 'border-[var(--theme-accent)] scale-110 shadow-lg' : 'border-transparent opacity-30 grayscale'
                  }`}
                >
                  <Avatar3D src={url} size={44} primary="transparent" borderWidth={0} />
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 w-full max-w-xs relative flex items-center justify-center">
            <label htmlFor="profile-display-name" className="sr-only">Nom affiché dans l’application</label>
            <input
              id="profile-display-name"
              type="text"
              autoComplete="nickname"
              maxLength={40}
              value={userName}
              onChange={(e) => handleChange(updateUserName, e.target.value)}
              className="w-full bg-transparent text-center font-galinoy text-[32px] italic text-[var(--theme-text)] outline-none transition-colors focus:text-[var(--theme-accent)] focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]/50"
            />
            <Edit2 size={14} aria-hidden="true" className="pointer-events-none absolute right-0 opacity-20" />
          </div>
        </section>

        {/* SECTION 2: APPARENCE */}
        <div>
          <SectionLabel>Apparence</SectionLabel>
          <div className="bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-[20px] overflow-hidden">
            <Row label="Thème" sublabel={themeMode === 'system' ? 'Automatique' : themeMode === 'dark' ? 'Sombre' : 'Clair'}>
              <div role="group" aria-label="Choisir le thème" className="flex items-center gap-1 rounded-full border border-[var(--theme-border)] bg-[var(--theme-bg)] p-1">
                <button type="button" aria-label="Thème clair" aria-pressed={themeMode === 'light'} onClick={() => handleChange(toggleDarkMode, 'light')} className={`flex h-11 w-11 items-center justify-center rounded-full border-2 border-transparent transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] ${themeMode === 'light' ? 'text-[var(--theme-action-ink)]' : 'opacity-50'}`} style={themeMode === 'light' ? { background: 'linear-gradient(var(--theme-action-bg), var(--theme-action-bg)) padding-box, var(--theme-accent-gradient) border-box' } : undefined}>
                  <Sun size={14} />
                </button>
                <button type="button" aria-label="Thème sombre" aria-pressed={themeMode === 'dark'} onClick={() => handleChange(toggleDarkMode, 'dark')} className={`flex h-11 w-11 items-center justify-center rounded-full border-2 border-transparent transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] ${themeMode === 'dark' ? 'text-[var(--theme-action-ink)]' : 'opacity-50'}`} style={themeMode === 'dark' ? { background: 'linear-gradient(var(--theme-action-bg), var(--theme-action-bg)) padding-box, var(--theme-accent-gradient) border-box' } : undefined}>
                  <Moon size={14} />
                </button>
                <button type="button" aria-label="Thème automatique" aria-pressed={themeMode === 'system'} onClick={() => handleChange(toggleDarkMode, 'system')} className={`flex min-h-11 items-center gap-1.5 rounded-full border-2 border-transparent px-3 font-black text-[9px] uppercase tracking-widest transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] ${themeMode === 'system' ? 'text-[var(--theme-action-ink)]' : 'opacity-50'}`} style={themeMode === 'system' ? { background: 'linear-gradient(var(--theme-action-bg), var(--theme-action-bg)) padding-box, var(--theme-accent-gradient) border-box' } : undefined}>
                  <Sparkles size={10} /> Auto
                </button>
              </div>
            </Row>
            <div className="border-t border-[var(--theme-border)] px-5 py-4">
              <div className="mb-3">
                <p className="font-outfit text-[13px] font-bold text-[var(--theme-text)]">Thème de couleur</p>
                <p className="mt-1 font-outfit text-[11px] leading-relaxed text-[var(--theme-text-secondary)]">
                  Quatre accents au choix, indépendants du mode clair ou sombre.
                </p>
              </div>
              <div role="group" aria-label="Thèmes de couleur" className="grid grid-cols-2 gap-2">
                {Object.values(ACCENT_PALETTES).map((palette) => {
                  const isSelected = accentPalette === palette.key;
                  return (
                    <button
                      key={palette.key}
                      type="button"
                      aria-pressed={isSelected}
                      aria-label={`Thème ${palette.name}`}
                      onClick={() => handleChange(updateAccentPalette, palette.key)}
                      className="relative min-h-[72px] rounded-2xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                      style={{
                        borderColor: isSelected ? 'var(--theme-accent)' : 'var(--theme-border)',
                        backgroundColor: isSelected
                          ? 'color-mix(in srgb, var(--theme-accent) 8%, var(--theme-surface))'
                          : 'var(--theme-bg)',
                      }}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="font-outfit text-[12px] font-bold text-[var(--theme-text)]">{palette.name}</span>
                        {isSelected && (
                          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-[var(--theme-bg)]" style={{ backgroundColor: 'var(--theme-accent)' }}>
                            <Check size={12} strokeWidth={3} aria-hidden="true" />
                          </span>
                        )}
                      </span>
                      <span className="mt-1.5 block font-outfit text-[10px] leading-snug text-[var(--theme-text-secondary)]">{palette.description}</span>
                      <span className="mt-2 flex items-center gap-1" aria-hidden="true">
                        {palette.swatches.map((color, index) => (
                          <span
                            key={`${palette.key}-${index}`}
                            className="h-2.5 w-2.5 rounded-full ring-1 ring-black/10"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 flex items-center justify-between gap-4 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg)] px-4 py-3">
                <div className="min-w-0">
                  <p className="font-outfit text-[12px] font-bold text-[var(--theme-text)]">Accent Fiertés</p>
                  <p className="mt-1 font-outfit text-[10px] leading-relaxed text-[var(--theme-text-secondary)]">
                    Liserés arc-en-ciel sur le thème choisi.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-label="Activer l’accent Fiertés"
                  aria-checked={prideAccentEnabled}
                  onClick={() => handleChange(updatePrideAccentEnabled, !prideAccentEnabled)}
                  className="relative h-8 w-[54px] shrink-0 rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                  style={{
                    background: prideAccentEnabled
                      ? 'linear-gradient(var(--theme-action-bg), var(--theme-action-bg)) padding-box, var(--theme-accent-gradient) border-box'
                      : 'color-mix(in srgb, var(--theme-text) 12%, var(--theme-bg))',
                  }}
                >
                  <span
                    aria-hidden="true"
                    className="absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full shadow-sm transition-all"
                    style={{
                      left: prideAccentEnabled ? 'calc(100% - 24px)' : '3px',
                      backgroundColor: prideAccentEnabled ? 'var(--theme-action-ink)' : 'var(--theme-text-secondary)',
                    }}
                  />
                </button>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg)] px-3 py-2.5">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="h-2 w-14 shrink-0 rounded-full" style={{ background: 'var(--theme-accent-gradient)' }} />
                  <span className="truncate font-outfit text-[10px] text-[var(--theme-text-secondary)]">Aperçu de la palette choisie</span>
                </div>
                <span className="shrink-0 rounded-full border-2 border-transparent px-3 py-1 font-outfit text-[9px] font-bold" style={{ background: 'linear-gradient(var(--theme-action-bg), var(--theme-action-bg)) padding-box, var(--theme-accent-gradient) border-box', color: 'var(--theme-action-ink)' }}>
                  Action
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: NOTATION */}
        <div>
          <SectionLabel>Notation</SectionLabel>
          <div className="bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-[20px] overflow-hidden">
            <Row label="Échelle de score" sublabel={ratingScale === 5 ? "Notation Cinéphile (1-5)" : "Notation Standard (1-10)"}>
              <button
                type="button"
                aria-label={`Échelle actuelle sur ${ratingScale}. Passer à ${ratingScale === 5 ? 10 : 5}.`}
                onClick={() => handleChange(updateRatingScale, ratingScale === 5 ? 10 : 5)}
                className="relative flex h-11 w-28 items-center rounded-full border border-[var(--theme-border)] bg-[var(--theme-bg)] px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
              >
                <div 
                  className="absolute h-7 w-12 rounded-full border-2 border-transparent text-[var(--theme-action-ink)] transition-all duration-300 flex items-center justify-center shadow-md"
                  style={{
                    left: ratingScale === 5 ? '4px' : 'calc(100% - 48px - 4px)',
                    background: 'linear-gradient(var(--theme-action-bg), var(--theme-action-bg)) padding-box, var(--theme-accent-gradient) border-box',
                  }}
                >
                  <span className="font-outfit font-black text-[10px]">/{ratingScale}</span>
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
          <div className="bg-[color-mix(in_srgb,var(--theme-surface)_72%,transparent)] border border-[color-mix(in_srgb,var(--theme-border)_70%,transparent)] rounded-[18px] overflow-hidden divide-y divide-[color-mix(in_srgb,var(--theme-border)_55%,transparent)]">
            <Row compact icon={CreditCard} label="Cinepass" sublabel="Abonnement mensuel">
              <div className="flex w-[132px] flex-col items-end gap-0.5">
                <div className="flex h-8 items-center gap-1">
                  <label htmlFor="cinepass-price" className="sr-only">Mensualité Cinepass en euros</label>
                  <input id="cinepass-price" type="text" inputMode="decimal" value={pricing?.monthlySub?.toString().replace('.', ',') || ''} onChange={(e) => handlePriceChange('monthlySub', e.target.value)} className="h-8 w-[72px] rounded-md bg-transparent text-right font-bold text-sm text-[var(--theme-text)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]" />
                  <span aria-hidden="true" className="text-[11px] font-black opacity-30">€</span>
                </div>
                <div className="flex h-7 w-full items-center justify-end gap-1.5">
                  <label htmlFor="subscription-effective-date" className="whitespace-nowrap font-outfit text-[8px] opacity-40">Depuis</label>
                  <input id="subscription-effective-date" type="date" value={priceEffectiveDates.subscription} onChange={(e) => handlePriceEffectiveDateChange('subscription', e.target.value)} aria-label="Date du premier prélèvement au nouveau tarif d’abonnement" className="h-7 min-w-0 w-[104px] rounded-md bg-transparent px-0 font-outfit text-[9px] text-[var(--theme-text)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]" />
                </div>
              </div>
            </Row>
            <Row compact icon={Ticket} label="Ticket" sublabel="Prix moyen hors-forfait">
              <div className="flex w-[132px] flex-col items-end gap-0.5">
                <div className="flex h-8 items-center gap-1">
                  <label htmlFor="ticket-price" className="sr-only">Prix moyen d’un ticket en euros</label>
                  <input id="ticket-price" type="text" inputMode="decimal" value={pricing?.ticketPrice?.toString().replace('.', ',') || ''} onChange={(e) => handlePriceChange('ticketPrice', e.target.value)} className="h-8 w-[72px] rounded-md bg-transparent text-right font-bold text-sm text-[var(--theme-text)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]" />
                  <span aria-hidden="true" className="text-[11px] font-black opacity-30">€</span>
                </div>
                <div className="flex h-7 w-full items-center justify-end gap-1.5">
                  <label htmlFor="ticket-effective-date" className="whitespace-nowrap font-outfit text-[8px] opacity-40">Depuis</label>
                  <input id="ticket-effective-date" type="date" value={priceEffectiveDates.ticket} onChange={(e) => handlePriceEffectiveDateChange('ticket', e.target.value)} aria-label="Date d’effet du prix du ticket" className="h-7 min-w-0 w-[104px] rounded-md bg-transparent px-0 font-outfit text-[9px] text-[var(--theme-text)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]" />
                </div>
              </div>
            </Row>
          </div>
          <p className="px-5 pt-2 font-outfit text-[9px] leading-relaxed opacity-40">La date choisie est conservée avec chaque changement de tarif.</p>
        </div>

        {/* SECTION 5: DATABASE & SYNC */}
        <div>
          <SectionLabel>Données & Sync</SectionLabel>
          <div className="bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-[20px] overflow-hidden divide-y divide-[var(--theme-border)]">
            <Row 
              icon={Database} 
              label="Google Sheet" 
              sublabel={spreadsheetId}
              ariaLabel="Modifier l’identifiant Google Sheets"
              onClick={() => { setTempSheetId(spreadsheetId); setShowSheetModal(true); }}
            >
              <ChevronRight size={16} className="opacity-20" />
            </Row>
            
            <Row 
              icon={RefreshCw} 
              label="Synchronisation" 
              sublabel={syncStatus === 'syncing' ? 'Mise à jour en cours…' : syncStatus === 'success' ? 'Données synchronisées' : syncStatus === 'error' ? 'Échec — réessayer' : 'Forcer la mise à jour'}
              ariaLabel="Synchroniser les films à noter"
              disabled={syncStatus === 'syncing'}
              onClick={handleForceSync}
            >
              <div className={`${syncStatus === 'syncing' ? 'animate-spin text-[var(--theme-accent)]' : syncStatus === 'success' ? 'text-emerald-500' : syncStatus === 'error' ? 'text-red-500' : 'opacity-30'}`}>
                {syncStatus === 'success' ? <Check size={16} /> : syncStatus === 'error' ? <X size={16} /> : <RefreshCw size={16} />}
              </div>
            </Row>
          </div>
        </div>

        {/* LOGOUT */}
        <button 
          type="button"
          onClick={onLogout}
          className="flex min-h-14 w-full items-center justify-center gap-2 rounded-[20px] border border-[var(--theme-border)] py-5 text-red-500 transition-colors active:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        >
          <LogOut size={16} />
          <span className="font-outfit text-[12px] font-black uppercase tracking-[0.2em]">Fermer la session</span>
        </button>

      </main>
    </div>
  );
}
