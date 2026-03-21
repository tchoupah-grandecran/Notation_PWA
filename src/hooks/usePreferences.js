import { useState } from 'react';
import { savePreferencesToSheet, getPreferencesFromSheet } from '../api';

/**
 * Gère les préférences utilisateur (thème, avatar, pseudo, etc.)
 * avec synchronisation cloud via Google Sheets.
 */
export function usePreferences(userToken, spreadsheetId) {
  const [currentThemeKey, setCurrentThemeKey] = useState(
    localStorage.getItem('grandecran_theme') || 'dark-grey'
  );
  const [userAvatar, setUserAvatar] = useState(
    localStorage.getItem('grandecran_avatar') || 'https://i.imgur.com/54i18a4.png'
  );
  const [userName, setUserName] = useState(
    localStorage.getItem('grandecran_username') || 'Cinéphile'
  );
  const [ratingScale, setRatingScale] = useState(
    Number(localStorage.getItem('grandecran_rating_scale')) || 5
  );
  const [pricing, setPricing] = useState(() => {
    const saved = localStorage.getItem('grandecran_pricing');
    return saved ? JSON.parse(saved) : { default: { sub: 21.90, ticket: 13.00 } };
  });

  // Sauvegarde cloud + localStorage en une seule opération
  const triggerCloudSave = (overrides = {}) => {
    const payload = {
      userName: overrides.userName ?? userName,
      userAvatar: overrides.userAvatar ?? userAvatar,
      themeKey: overrides.themeKey ?? currentThemeKey,
      ratingScale: overrides.ratingScale ?? ratingScale,
      pricing: overrides.pricing ?? pricing,
    };
    if (userToken && spreadsheetId) {
      savePreferencesToSheet(userToken, spreadsheetId, payload);
    }
  };

  const syncFromCloud = async () => {
    if (!userToken || !spreadsheetId) return;
    const cloud = await getPreferencesFromSheet(userToken, spreadsheetId);
    if (!cloud) return;

    if (cloud.userName)    { setUserName(cloud.userName);           localStorage.setItem('grandecran_username', cloud.userName); }
    if (cloud.userAvatar)  { setUserAvatar(cloud.userAvatar);       localStorage.setItem('grandecran_avatar', cloud.userAvatar); }
    if (cloud.themeKey)    { setCurrentThemeKey(cloud.themeKey);    localStorage.setItem('grandecran_theme', cloud.themeKey); }
    if (cloud.ratingScale) { setRatingScale(cloud.ratingScale);     localStorage.setItem('grandecran_rating_scale', cloud.ratingScale); }
    if (cloud.pricing)     { setPricing(cloud.pricing);             localStorage.setItem('grandecran_pricing', JSON.stringify(cloud.pricing)); }
  };

  const updateTheme = (key) => {
    setCurrentThemeKey(key);
    localStorage.setItem('grandecran_theme', key);
    triggerCloudSave({ themeKey: key });
  };

  const updateAvatar = (url) => {
    setUserAvatar(url);
    localStorage.setItem('grandecran_avatar', url);
    triggerCloudSave({ userAvatar: url });
  };

  const updateUserName = (name) => {
    setUserName(name);
    localStorage.setItem('grandecran_username', name);
  };

  const updateRatingScale = (scale) => {
    setRatingScale(scale);
    localStorage.setItem('grandecran_rating_scale', scale);
    triggerCloudSave({ ratingScale: scale });
  };

  const updatePricing = (newPricing) => {
    setPricing(newPricing);
    localStorage.setItem('grandecran_pricing', JSON.stringify(newPricing));
    triggerCloudSave({ pricing: newPricing });
  };

  return {
    currentThemeKey, userAvatar, userName, ratingScale, pricing,
    syncFromCloud, triggerCloudSave,
    updateTheme, updateAvatar, updateUserName, updateRatingScale, updatePricing,
  };
}