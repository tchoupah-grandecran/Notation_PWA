import { THEME_COLORS, AVATAR_PRESETS } from '../constants';
import { Avatar3D } from '../components/Avatar3D';

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
  const anneesDisponibles = [
    ...new Set(historyData.map((f) => f.date?.split('/')[2]).filter(Boolean)),
  ].sort((a, b) => a - b);

  const [pricingYearEditor, setPricingYearEditor] = useState('default');

  const handlePricingChange = (type, value) => {
    let v = value.replace(',', '.');
    if (!/^\d*\.?\d*$/.test(v)) return;
    const newPricing = {
      ...pricing,
      [pricingYearEditor]: { ...pricing[pricingYearEditor], [type]: v },
    };
    updatePricing(newPricing);
  };

  return (
    <div className="animate-in fade-in duration-300">
      <header className={`z-40 sticky top-0 w-full transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] bg-[var(--color-bg)]/80 backdrop-blur-2xl border-b ${isScrolled ? 'pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-3 border-white/10 shadow-lg' : 'pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-5 border-transparent shadow-none'}`}>
        <div className="px-6 flex justify-between items-center">
          <div className="flex flex-col">
            <p className={`font-bold uppercase tracking-widest text-[var(--color-primary)] transition-all duration-500 origin-left ${isScrolled ? 'opacity-0 h-0 overflow-hidden mb-0 text-[0px]' : 'opacity-100 h-3 text-[10px] mb-1'}`}>
              Réglages
            </p>
            <h1 className={`font-syne font-black text-white leading-none transition-all duration-500 origin-left ${isScrolled ? 'text-2xl' : 'text-4xl'}`}>
              Mon Profil
            </h1>
          </div>
        </div>
      </header>

      <main className="px-6 pt-6 pb-24 space-y-10">
        {/* Avatar + nom */}
        <div className="flex items-center gap-5 bg-white/5 p-5 rounded-3xl border border-white/10 shadow-lg">
          {/* mt-3 pour laisser de l'espace à la tête qui dépasse */}
          <div className="mt-3 flex-shrink-0">
            <Avatar3D
              src={userAvatar}
              size={80}
              primary="var(--color-primary)"
              glow="var(--color-primary-muted)"
              borderWidth={3}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 group relative">
              <input
                type="text"
                value={userName}
                onChange={(e) => updateUserName(e.target.value)}
                onBlur={() => triggerCloudSave()}
                className="font-syne text-2xl font-bold bg-transparent border-b border-transparent hover:border-white/20 focus:border-[var(--color-primary)] outline-none w-full text-white truncate"
              />
              <svg className="w-4 h-4 text-white/30 absolute right-0 pointer-events-none group-focus-within:opacity-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
              </svg>
            </div>
            <p className="text-white/50 text-xs mt-1">Cinéphile passionné</p>
            <span className="inline-block mt-2 bg-[var(--color-primary-muted)] text-[var(--color-primary)] text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md border border-[var(--color-primary-muted)]">
              Membre VIP
            </span>
          </div>
        </div>

        {/* Tarifs */}
        <div className="space-y-4">
          <div className="flex items-center justify-between ml-2 border-b border-white/10 pb-2">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/50">Abonnement & Tarifs</h3>
            <select
              value={pricingYearEditor}
              onChange={(e) => setPricingYearEditor(e.target.value)}
              className="bg-black/40 border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg px-2 py-1 outline-none"
            >
              <option value="default">Par défaut</option>
              {anneesDisponibles.map((y) => <option key={y} value={y}>Année {y}</option>)}
            </select>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-3xl p-5 flex flex-col gap-4">
            {[
              { key: 'sub', label: "Coût de l'Abonnement", sub: 'Montant facturé par mois' },
              { key: 'ticket', label: 'Prix Plein Tarif', sub: "Prix moyen d'un billet classique" },
            ].map(({ key, label, sub }) => (
              <div key={key} className={`flex justify-between items-center ${key === 'sub' ? 'border-b border-white/5 pb-4' : ''}`}>
                <div>
                  <label className="text-xs font-bold text-white">{label}</label>
                  <p className="text-[10px] text-white/40 mt-0.5 uppercase tracking-widest">{sub}</p>
                </div>
                <div className="flex items-center gap-1 bg-black/40 rounded-xl px-3 py-2 border border-white/10">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={pricing[pricingYearEditor]?.[key] ?? pricing.default?.[key] ?? ''}
                    onChange={(e) => handlePricingChange(key, e.target.value)}
                    className="w-16 bg-transparent outline-none text-right font-bold text-sm text-white"
                  />
                  <span className={`font-bold text-sm ${key === 'ticket' ? 'text-[var(--color-primary)]' : 'text-[var(--color-primary)]'}`}>€</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Apparence */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 ml-2 border-b border-white/10 pb-2">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/50">Apparence</h3>
          </div>
          <div>
            <h4 className="text-[10px] font-bold uppercase text-white/30 mb-3 ml-2 italic">Choisir un portrait</h4>
            {/* pt-3 sur le conteneur pour que la tête de chaque avatar puisse dépasser */}
            <div className="bg-white/5 border border-white/10 rounded-3xl pt-4 pb-3 px-6 flex items-end gap-4 overflow-x-auto scrollbar-hide">
              {AVATAR_PRESETS.map((url, idx) => (
                <button
                  key={idx}
                  onClick={() => updateAvatar(url)}
                  className="flex-shrink-0 active:scale-90 transition-transform"
                  style={{ outline: 'none', background: 'none', border: 'none', padding: 0 }}
                >
                  <Avatar3D
                    src={url}
                    size={56}
                    primary={userAvatar === url ? 'var(--color-primary)' : 'rgba(255,255,255,0.15)'}
                    glow={userAvatar === url ? 'var(--color-primary-muted)' : 'transparent'}
                    opacity={userAvatar === url ? 1 : 0.45}
                    borderWidth={2}
                  />
                </button>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-[10px] font-bold uppercase text-white/30 mb-3 ml-2 italic">Thème de l'interface</h4>
            <div className="bg-white/5 border border-white/10 rounded-3xl py-4 px-6 flex items-center gap-4 overflow-x-auto scrollbar-hide">
              {Object.entries(THEME_COLORS).map(([key, t]) => (
                <button
                  key={key}
                  onClick={() => updateTheme(key)}
                  className={`flex-shrink-0 w-10 h-10 rounded-full transition-all duration-300 ${currentThemeKey === key ? 'ring-2 ring-[var(--color-primary)] scale-110 opacity-100' : 'opacity-40 grayscale-[0.2]'}`}
                  style={{ background: t.bgGradient, border: 'none' }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Préférences */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 ml-2 border-b border-white/10 pb-2">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/50">Préférences</h3>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
            <div
              onClick={() => updateRatingScale(ratingScale === 5 ? 10 : 5)}
              className="flex items-center justify-between p-5 cursor-pointer active:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shadow-inner text-[var(--color-primary)]">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Système de notation</p>
                  <p className="text-[10px] text-[var(--color-primary)] font-black uppercase mt-0.5">Échelle sur {ratingScale}</p>
                </div>
              </div>
              <div className="flex bg-black/40 rounded-full p-1 border border-white/10 shadow-inner">
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black transition-all duration-300 ${ratingScale === 5 ? 'bg-[var(--color-primary)] text-black' : 'text-white/40'}`}>5</span>
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black transition-all duration-300 ${ratingScale === 10 ? 'bg-[var(--color-primary)] text-black' : 'text-white/40'}`}>10</span>
              </div>
            </div>
          </div>
        </div>

        {/* Base de données */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 ml-2 border-b border-white/10 pb-2">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/50">Base de données</h3>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-3xl p-5 flex flex-col gap-3">
            <label className="text-[10px] font-bold uppercase text-white/40 ml-1">ID du Spreadsheet Google</label>
            <div className="flex gap-2">
              <input
                type="text"
                defaultValue={spreadsheetId}
                disabled
                className="bg-black/50 border border-white/10 p-3 rounded-xl outline-none text-[10px] font-mono text-white/40 w-full"
              />
              <button onClick={onEditSpreadsheet} className="bg-white/10 px-3 rounded-xl text-[10px] font-bold uppercase">Éditer</button>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full bg-red-500/10 border border-red-500/20 text-red-500 font-black py-4 rounded-3xl active:scale-95 transition-all uppercase text-xs flex items-center justify-center gap-2 shadow-lg"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            Se déconnecter
          </button>
        </div>
      </main>
    </div>
  );
}

// useState doit être importé car on l'utilise dans ce fichier
import { useState } from 'react';