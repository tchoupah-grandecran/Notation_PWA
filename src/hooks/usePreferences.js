import { useState, useEffect, useCallback, useRef } from 'react';
import { savePreferencesToSheet, getPreferencesFromSheet } from '../api';
import { ACCENT_PALETTES, normalizeAccentPalette } from '../constants';

export function usePreferences(userToken, spreadsheetId) {
  const [themeMode, setThemeMode] = useState(() => {
    const saved = localStorage.getItem('grandecran_theme_mode');
    if (saved) return saved;
    const legacyDark = localStorage.getItem('grandecran_dark_mode');
    if (legacyDark !== null) return legacyDark === 'true' ? 'dark' : 'light';
    return 'system';
  });
  const [accentPalette, setAccentPalette] = useState(() => {
    const saved = localStorage.getItem('grandecran_accent_palette');
    return normalizeAccentPalette(saved);
  });
  const [prideAccentEnabled, setPrideAccentEnabled] = useState(() => {
    const saved = localStorage.getItem('grandecran_pride_accent');
    if (saved !== null) return saved === 'true';
    return localStorage.getItem('grandecran_accent_palette') === 'pride';
  });
  const [userAvatar,  setUserAvatar]  = useState(localStorage.getItem('grandecran_avatar')       || 'https://i.imgur.com/54i18a4.png');
  const [userName,    setUserName]    = useState(localStorage.getItem('grandecran_username')      || 'Cinéphile');
  const [ratingScale, setRatingScale] = useState(Number(localStorage.getItem('grandecran_rating_scale')) || 5);
  const [pricing,     setPricing]     = useState(() => {
    const saved = localStorage.getItem('grandecran_pricing');
    return saved ? JSON.parse(saved) : { monthlySub: 21.90, ticketPrice: 13.00 };
  });
  const [isDark, setIsDark] = useState(true);

  // Refs pour que triggerCloudSave capture toujours les valeurs à jour
  // sans avoir besoin d'être recréé (évite les boucles useEffect dans App)
  const tokenRef        = useRef(userToken);
  const sheetRef        = useRef(spreadsheetId);
  const themeModeRef    = useRef(themeMode);
  const accentPaletteRef = useRef(accentPalette);
  const prideAccentRef = useRef(prideAccentEnabled);
  const userAvatarRef   = useRef(userAvatar);
  const userNameRef     = useRef(userName);
  const ratingScaleRef  = useRef(ratingScale);
  const pricingRef      = useRef(pricing);

  useEffect(() => { tokenRef.current       = userToken;    }, [userToken]);
  useEffect(() => { sheetRef.current       = spreadsheetId; }, [spreadsheetId]);
  useEffect(() => { themeModeRef.current   = themeMode;    }, [themeMode]);
  useEffect(() => { accentPaletteRef.current = accentPalette; }, [accentPalette]);
  useEffect(() => { prideAccentRef.current = prideAccentEnabled; }, [prideAccentEnabled]);
  useEffect(() => { userAvatarRef.current  = userAvatar;   }, [userAvatar]);
  useEffect(() => { userNameRef.current    = userName;     }, [userName]);
  useEffect(() => { ratingScaleRef.current = ratingScale;  }, [ratingScale]);
  useEffect(() => { pricingRef.current     = pricing;      }, [pricing]);

  // Sync isDark ↔ themeMode
  useEffect(() => {
    const update = () => {
      if (themeMode === 'system') {
        setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
      } else {
        setIsDark(themeMode === 'dark');
      }
    };
    update();
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => { if (themeMode === 'system') update(); };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [themeMode]);

  // triggerCloudSave stable (useCallback + refs) — ne change jamais de référence
  const triggerCloudSave = useCallback((overrides = {}) => {
    const token = tokenRef.current;
    const sheet = sheetRef.current;
    if (!token || !sheet) return Promise.resolve(false);
    const payload = {
      userName:    overrides.userName    ?? userNameRef.current,
      userAvatar:  overrides.userAvatar  ?? userAvatarRef.current,
      themeKey:    overrides.themeMode   ?? themeModeRef.current,
      accentPalette: overrides.accentPalette ?? accentPaletteRef.current,
      prideAccentEnabled: overrides.prideAccentEnabled ?? prideAccentRef.current,
      ratingScale: overrides.ratingScale ?? ratingScaleRef.current,
      pricing:     overrides.pricing     ?? pricingRef.current,
    };
    return savePreferencesToSheet(token, sheet, payload);
  }, []); // dépendances vides : les refs assurent la fraîcheur

  // syncFromCloud stable
  const syncFromCloud = useCallback(async () => {
    const token = tokenRef.current;
    const sheet = sheetRef.current;
    if (!token || !sheet) return;
    const cloud = await getPreferencesFromSheet(token, sheet);
    if (!cloud) return;
    if (cloud.userName)    { setUserName(cloud.userName);    localStorage.setItem('grandecran_username', cloud.userName); }
    if (cloud.userAvatar)  { setUserAvatar(cloud.userAvatar); localStorage.setItem('grandecran_avatar', cloud.userAvatar); }
    if (cloud.themeKey) {
      const mode = ['light', 'dark', 'system'].includes(cloud.themeKey) ? cloud.themeKey : 'system';
      setThemeMode(mode);
      localStorage.setItem('grandecran_theme_mode', mode);
    }
    if (cloud.accentPalette && (ACCENT_PALETTES[cloud.accentPalette] || ['gilded', 'pride'].includes(cloud.accentPalette))) {
      const palette = normalizeAccentPalette(cloud.accentPalette);
      setAccentPalette(palette);
      localStorage.setItem('grandecran_accent_palette', palette);
    }
    if (cloud.prideAccentEnabled !== null && cloud.prideAccentEnabled !== undefined) {
      const enabled = cloud.prideAccentEnabled === true || cloud.prideAccentEnabled === 'true';
      setPrideAccentEnabled(enabled);
      localStorage.setItem('grandecran_pride_accent', String(enabled));
    } else if (cloud.accentPalette === 'pride') {
      setPrideAccentEnabled(true);
      localStorage.setItem('grandecran_pride_accent', 'true');
    }
    if (cloud.ratingScale) { setRatingScale(cloud.ratingScale); localStorage.setItem('grandecran_rating_scale', String(cloud.ratingScale)); }
    if (cloud.pricing)     { setPricing(cloud.pricing);          localStorage.setItem('grandecran_pricing', JSON.stringify(cloud.pricing)); }
  }, []); // dépendances vides : les refs assurent la fraîcheur

  // Updaters — tous avec localStorage pour survivre à un refresh
  const updateThemeMode = useCallback((mode) => {
    setThemeMode(mode);
    localStorage.setItem('grandecran_theme_mode', mode);
  }, []);

  const updateAccentPalette = useCallback((palette) => {
    if (!ACCENT_PALETTES[palette]) return;
    setAccentPalette(palette);
    localStorage.setItem('grandecran_accent_palette', palette);
  }, []);

  const updatePrideAccentEnabled = useCallback((enabled) => {
    const nextValue = Boolean(enabled);
    setPrideAccentEnabled(nextValue);
    localStorage.setItem('grandecran_pride_accent', String(nextValue));
  }, []);

  const updateAvatar = useCallback((url) => {
    setUserAvatar(url);
    localStorage.setItem('grandecran_avatar', url);
  }, []);

  const updateUserName = useCallback((name) => {
    setUserName(name);
    localStorage.setItem('grandecran_username', name);
    // Pas de cloud save immédiat (l'user tape encore) — déclenché via handleSave dans Profile
  }, []);

  const updateRatingScale = useCallback((s) => {
    setRatingScale(s);
    localStorage.setItem('grandecran_rating_scale', String(s));
  }, []);

  const updatePricing = useCallback((p, change = null) => {
    const previous = pricingRef.current || {};
    const history = (Array.isArray(p?.priceHistory) ? p.priceHistory : []).flatMap((entry) => {
      if (entry.type && entry.effectiveFrom) return [entry];
      if (!/^\d{4}-\d{2}$/.test(String(entry.period || ''))) return [];
      const effectiveFrom = `${entry.period}-01`;
      return [
        ...(Number(entry.ticketPrice) > 0 ? [{ type: 'ticket', amount: Number(entry.ticketPrice), effectiveFrom, precision: 'month' }] : []),
        ...(Number(entry.monthlySub) > 0 ? [{ type: 'subscription', amount: Number(entry.monthlySub), effectiveFrom, precision: 'month' }] : []),
      ];
    });

    const changedKeys = ['monthlySub', 'ticketPrice'].filter((key) =>
      String(previous[key] ?? '') !== String(p?.[key] ?? '')
    );
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const changeEntries = change ? [change] : changedKeys.map((key) => ({
      type: key === 'ticketPrice' ? 'ticket' : 'subscription',
      amount: p[key],
      effectiveFrom: today,
    }));

    changeEntries.forEach((item) => {
      if (!['ticket', 'subscription'].includes(item.type) || !/^\d{4}-\d{2}-\d{2}$/.test(item.effectiveFrom || '')) return;
      const flatKey = item.type === 'ticket' ? 'ticketPrice' : 'monthlySub';
      const amount = Number(String(item.amount ?? '').replace(',', '.'));
      if (!Number.isFinite(amount) || amount <= 0) {
        const previousAmount = Number(String(previous[flatKey] ?? '').replace(',', '.'));
        if (!history.some((entry) => entry.type === item.type) && Number.isFinite(previousAmount) && previousAmount > 0) {
          history.push({ type: item.type, amount: previousAmount, effectiveFrom: '0000-01-01', precision: 'baseline', baseline: true });
        }
        return;
      }
      const replaceDate = item.previousEffectiveFrom || item.effectiveFrom;
      const retained = history.filter((entry) => !(entry.type === item.type && entry.effectiveFrom === replaceDate));
      const withoutSameDate = retained.filter((entry) => !(entry.type === item.type && entry.effectiveFrom === item.effectiveFrom));
      const previousAmount = Number(String(previous[flatKey] ?? '').replace(',', '.'));
      const hasRateHistory = withoutSameDate.some((entry) => entry.type === item.type);
      if (!hasRateHistory && Number.isFinite(previousAmount) && previousAmount > 0 && previousAmount !== amount) {
        withoutSameDate.push({ type: item.type, amount: previousAmount, effectiveFrom: '0000-01-01', precision: 'baseline', baseline: true });
      }
      const priorRate = withoutSameDate
        .filter((entry) => entry.type === item.type && entry.effectiveFrom < item.effectiveFrom)
        .sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom))
        .at(-1);
      if (!priorRate || Number(priorRate.amount) !== amount) {
        withoutSameDate.push({ type: item.type, amount, effectiveFrom: item.effectiveFrom, precision: 'day' });
      }
      history.splice(0, history.length, ...withoutSameDate);
    });

    const nextPricing = {
      ...p,
      priceHistory: history.sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom)),
    };

    pricingRef.current = nextPricing;
    setPricing(nextPricing);
    localStorage.setItem('grandecran_pricing', JSON.stringify(nextPricing));
  }, []);

  return {
    isDark,
    themeMode,
    accentPalette,
    prideAccentEnabled,
    userAvatar,
    userName,
    ratingScale,
    pricing,
    syncFromCloud,
    triggerCloudSave,
    toggleDarkMode:    updateThemeMode,
    updateAccentPalette,
    updatePrideAccentEnabled,
    updateAvatar,
    updateUserName,
    updateRatingScale,
    updatePricing,
  };
}
