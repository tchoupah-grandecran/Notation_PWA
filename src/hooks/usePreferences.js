import { useState, useEffect } from 'react';
import { savePreferencesToSheet, getPreferencesFromSheet } from '../api';

export function usePreferences(userToken, spreadsheetId) {
  const [themeMode, setThemeMode] = useState(() => {
    const saved = localStorage.getItem('grandecran_theme_mode');
    if (saved) return saved;
    const legacyDark = localStorage.getItem('grandecran_dark_mode');
    if (legacyDark !== null) return legacyDark === 'true' ? 'dark' : 'light';
    return 'system';
  });

  const [userAvatar, setUserAvatar] = useState(localStorage.getItem('grandecran_avatar') || 'https://i.imgur.com/54i18a4.png');
  const [userName, setUserName] = useState(localStorage.getItem('grandecran_username') || 'Cinéphile');
  const [ratingScale, setRatingScale] = useState(Number(localStorage.getItem('grandecran_rating_scale')) || 5);
  const [pricing, setPricing] = useState(() => {
    const saved = localStorage.getItem('grandecran_pricing');
    return saved ? JSON.parse(saved) : { default: { sub: 21.90, ticket: 13.00 } };
  });

  const [isDark, setIsDark] = useState(true);

  // Sync isDark with themeMode
  useEffect(() => {
    const updateTheme = () => {
      if (themeMode === 'system') {
        setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
      } else {
        setIsDark(themeMode === 'dark');
      }
    };
    updateTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => { if (themeMode === 'system') updateTheme(); };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themeMode]);

  const triggerCloudSave = (overrides = {}) => {
    const payload = {
      userName: overrides.userName ?? userName,
      userAvatar: overrides.userAvatar ?? userAvatar,
      themeKey: overrides.themeMode ?? themeMode,
      ratingScale: overrides.ratingScale ?? ratingScale,
      pricing: overrides.pricing ?? pricing,
    };
    if (userToken && spreadsheetId) savePreferencesToSheet(userToken, spreadsheetId, payload);
  };

  const syncFromCloud = async () => {
    if (!userToken || !spreadsheetId) return;
    const cloud = await getPreferencesFromSheet(userToken, spreadsheetId);
    if (!cloud) return;

    if (cloud.userName) setUserName(cloud.userName);
    if (cloud.userAvatar) setUserAvatar(cloud.userAvatar);
    if (cloud.themeKey) {
      const mode = ['light', 'dark', 'system'].includes(cloud.themeKey) ? cloud.themeKey : 'system';
      setThemeMode(mode);
    }
    if (cloud.ratingScale) setRatingScale(cloud.ratingScale);
    if (cloud.pricing) setPricing(cloud.pricing);
  };

  const updateThemeMode = (mode) => {
    setThemeMode(mode);
    localStorage.setItem('grandecran_theme_mode', mode);
    triggerCloudSave({ themeMode: mode });
  };

  return {
    isDark,
    themeMode,
    userAvatar,
    userName,
    ratingScale,
    pricing,
    syncFromCloud,
    triggerCloudSave,
    toggleDarkMode: updateThemeMode,
    updateAvatar: (url) => { setUserAvatar(url); triggerCloudSave({ userAvatar: url }); },
    updateUserName: (name) => { setUserName(name); },
    updateRatingScale: (s) => { setRatingScale(s); triggerCloudSave({ ratingScale: s }); },
    updatePricing: (p) => { setPricing(p); triggerCloudSave({ pricing: p }); },
  };
}