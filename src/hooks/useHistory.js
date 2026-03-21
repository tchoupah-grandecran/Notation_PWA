import { useState } from 'react';
import { getFullHistory, getStats } from '../api';

/**
 * Gère le chargement de l'historique complet et des stats
 * depuis Google Sheets. Expose un refresh manuel.
 */
export function useHistory(userToken, spreadsheetId) {
  const [historyData, setHistoryData] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [stats, setStats] = useState({ totalFilms: '--', coupsDeCoeur: '--' });

  const loadHistory = async () => {
    if (!userToken || !spreadsheetId || isLoadingHistory) return;
    setIsLoadingHistory(true);
    try {
      const data = await getFullHistory(userToken, spreadsheetId);
      setHistoryData(data);
    } catch (err) {
      console.error('Erreur chargement historique', err);
    }
    setIsLoadingHistory(false);
  };

  const loadStats = async () => {
    if (!userToken || !spreadsheetId) return;
    const s = await getStats(userToken, spreadsheetId);
    setStats(s);
  };

  const invalidate = () => {
    setHistoryData([]);
  };

  return {
    historyData, setHistoryData,
    isLoadingHistory,
    stats,
    loadHistory,
    loadStats,
    invalidate,
  };
}