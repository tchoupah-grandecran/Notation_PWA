import { useState, useEffect, useCallback, useRef } from 'react';
import { savePreferencesToSheet, getPreferencesFromSheet } from '../api';

export function usePreferences(userToken, spreadsheetId) {
  const [themeMode, setThemeMode] = useState(() => {
    const saved = localStorage.getItem('grandecran_theme_mode');
    if (saved) return saved;
    const legacyDark = localStorage.getItem('grandecran_dark_mode');
    if (legacyDark !== null) return legacyDark === 'true' ? 'dark' : 'light';
    return 'system';
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
  const userAvatarRef   = useRef(userAvatar);
  const userNameRef     = useRef(userName);
  const ratingScaleRef  = useRef(ratingScale);
  const pricingRef      = useRef(pricing);

  useEffect(() => { tokenRef.current       = userToken;    }, [userToken]);
  useEffect(() => { sheetRef.current       = spreadsheetId; }, [spreadsheetId]);
  useEffect(() => { themeModeRef.current   = themeMode;    }, [themeMode]);
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
    if (!token || !sheet) return;
    const payload = {
      userName:    overrides.userName    ?? userNameRef.current,
      userAvatar:  overrides.userAvatar  ?? userAvatarRef.current,
      themeKey:    overrides.themeMode   ?? themeModeRef.current,
      ratingScale: overrides.ratingScale ?? ratingScaleRef.current,
      pricing:     overrides.pricing     ?? pricingRef.current,
    };
    savePreferencesToSheet(token, sheet, payload);
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
    if (cloud.ratingScale) { setRatingScale(cloud.ratingScale); localStorage.setItem('grandecran_rating_scale', String(cloud.ratingScale)); }
    if (cloud.pricing)     { setPricing(cloud.pricing);          localStorage.setItem('grandecran_pricing', JSON.stringify(cloud.pricing)); }
  }, []); // dépendances vides : les refs assurent la fraîcheur

  // Updaters — tous avec localStorage pour survivre à un refresh
  const updateThemeMode = useCallback((mode) => {
    setThemeMode(mode);
    localStorage.setItem('grandecran_theme_mode', mode);
    triggerCloudSave({ themeMode: mode });
  }, [triggerCloudSave]);

  const updateAvatar = useCallback((url) => {
    setUserAvatar(url);
    localStorage.setItem('grandecran_avatar', url);
    triggerCloudSave({ userAvatar: url });
  }, [triggerCloudSave]);

  const updateUserName = useCallback((name) => {
    setUserName(name);
    localStorage.setItem('grandecran_username', name);
    // Pas de cloud save immédiat (l'user tape encore) — déclenché via handleSave dans Profile
  }, []);

  const updateRatingScale = useCallback((s) => {
    setRatingScale(s);
    localStorage.setItem('grandecran_rating_scale', String(s));
    triggerCloudSave({ ratingScale: s });
  }, [triggerCloudSave]);

  const updatePricing = useCallback((p) => {
    setPricing(p);
    localStorage.setItem('grandecran_pricing', JSON.stringify(p));
    //triggerCloudSave({ pricing: p });
  }, [triggerCloudSave]);

  return {
    isDark,
    themeMode,
    userAvatar,
    userName,
    ratingScale,
    pricing,
    syncFromCloud,
    triggerCloudSave,
    toggleDarkMode:    updateThemeMode,
    updateAvatar,
    updateUserName,
    updateRatingScale,
    updatePricing,
  };
}