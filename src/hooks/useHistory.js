import { useCallback, useRef, useState } from 'react';
import { getFullHistory, getStats } from '../api';

/** Gère le chargement de l'historique complet et des stats depuis Google Sheets. */
export function useHistory(userToken, spreadsheetId) {
  const [historyData, setHistoryData] = useState([]);
  const [historyStatus, setHistoryStatus] = useState('idle');
  const [historyError, setHistoryError] = useState('');
  const [stats, setStats] = useState({ totalFilms: '--', coupsDeCoeur: '--' });
  const historyRequestRef = useRef(null);

  const loadHistory = useCallback(() => {
    if (!userToken || !spreadsheetId) return Promise.resolve(false);
    if (historyRequestRef.current) return historyRequestRef.current;

    setHistoryStatus('loading');
    setHistoryError('');
    const request = getFullHistory(userToken, spreadsheetId)
      .then((data) => {
        setHistoryData(data);
        setHistoryStatus('success');
        return true;
      })
      .catch((err) => {
        console.error('Erreur chargement historique', err);
        setHistoryError(err?.message || 'Impossible de charger le journal des séances.');
        setHistoryStatus('error');
        return false;
      })
      .finally(() => {
        historyRequestRef.current = null;
      });

    historyRequestRef.current = request;
    return request;
  }, [userToken, spreadsheetId]);

  const loadStats = useCallback(async () => {
    if (!userToken || !spreadsheetId) return;
    const result = await getStats(userToken, spreadsheetId);
    setStats(result);
  }, [userToken, spreadsheetId]);

  const invalidate = useCallback(() => {
    setHistoryData([]);
    setHistoryError('');
    setHistoryStatus('idle');
  }, []);

  return {
    historyData,
    setHistoryData,
    historyStatus,
    historyError,
    isLoadingHistory: historyStatus === 'loading',
    stats,
    loadHistory,
    loadStats,
    invalidate,
  };
}
