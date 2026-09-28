import { useCallback, useEffect, useRef, useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';

const AUTH_HEADERS = {
  'Content-Type': 'application/json',
  'X-Requested-With': 'XmlHttpRequest',
};

async function readJsonResponse(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error || 'La connexion Google a échoué.');
    error.status = response.status;
    throw error;
  }
  return payload;
}

/**
 * Maintient une session Google via un cookie HTTP-only. Seul le jeton d'accès
 * à courte durée de vie reste en mémoire, pour les appels Gmail et Sheets.
 */
export function useAuth() {
  const [userToken, setUserToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState('');
  const [accessExpiresAt, setAccessExpiresAt] = useState(0);
  const refreshPromiseRef = useRef(null);
  const lastRefreshAtRef = useRef(0);

  const applySession = useCallback((session) => {
    setUserToken(session.access_token);
    setAccessExpiresAt(Date.now() + Math.max(60, session.expires_in || 3600) * 1000);
    lastRefreshAtRef.current = Date.now();

    if (session.user?.given_name && !localStorage.getItem('grandecran_username')) {
      localStorage.setItem('grandecran_username', session.user.given_name);
    }
  }, []);

  const refreshSession = useCallback(async ({ force = false } = {}) => {
    if (refreshPromiseRef.current) return refreshPromiseRef.current;
    if (!force && Date.now() - lastRefreshAtRef.current < 30_000) return userToken;

    const pending = fetch('/api/auth/session', {
      method: 'POST',
      credentials: 'same-origin',
      headers: AUTH_HEADERS,
    })
      .then(readJsonResponse)
      .then((session) => {
        applySession(session);
        setError('');
        return session.access_token;
      })
      .catch((err) => {
        if (err.status === 401) {
          if (userToken) setError(err.message || 'La session Google a expiré.');
          setUserToken(null);
          setAccessExpiresAt(0);
        } else {
          console.error('Erreur de renouvellement de session :', err);
          setError(err.message || 'Impossible de restaurer la session Google.');
        }
        return null;
      })
      .finally(() => {
        refreshPromiseRef.current = null;
        setIsLoading(false);
      });

    refreshPromiseRef.current = pending;
    return pending;
  }, [applySession, userToken]);

  useEffect(() => {
    // Supprime le jeton d'accès laissé par l'ancien mode de connexion.
    localStorage.removeItem('google_token');
    localStorage.removeItem('google_token_expiry');
    void refreshSession({ force: true });
    // La restauration ne doit être déclenchée qu'une seule fois au démarrage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!userToken || !accessExpiresAt) return undefined;

    const delay = Math.max(5_000, accessExpiresAt - Date.now() - 5 * 60 * 1000);
    const timer = window.setTimeout(() => {
      void refreshSession({ force: true });
    }, delay);

    return () => window.clearTimeout(timer);
  }, [userToken, accessExpiresAt, refreshSession]);

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (document.visibilityState !== 'visible' || !userToken) return;
      if (accessExpiresAt - Date.now() < 5 * 60 * 1000) {
        void refreshSession({ force: true });
      }
    };

    document.addEventListener('visibilitychange', refreshWhenVisible);
    window.addEventListener('focus', refreshWhenVisible);
    return () => {
      document.removeEventListener('visibilitychange', refreshWhenVisible);
      window.removeEventListener('focus', refreshWhenVisible);
    };
  }, [userToken, accessExpiresAt, refreshSession]);

  const login = useGoogleLogin({
    flow: 'auth-code',
    scope:
      'https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/userinfo.profile',
    onSuccess: async ({ code }) => {
      setIsAuthenticating(true);
      setError('');
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          credentials: 'same-origin',
          headers: AUTH_HEADERS,
          body: JSON.stringify({ code }),
        });
        const session = await readJsonResponse(response);
        applySession(session);
      } catch (err) {
        console.error('Erreur de connexion Google :', err);
        setError(err.message || 'Impossible de terminer la connexion Google.');
      } finally {
        setIsAuthenticating(false);
        setIsLoading(false);
      }
    },
    onError: (authError) => {
      setError(authError.error_description || 'La fenêtre de connexion Google n’a pas abouti.');
      setIsAuthenticating(false);
    },
    onNonOAuthError: () => {
      setError('La fenêtre Google a été fermée avant la fin de la connexion.');
      setIsAuthenticating(false);
    },
  });

  const logout = useCallback(() => {
    setUserToken(null);
    setAccessExpiresAt(0);
    setError('');

    void fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'same-origin',
      headers: AUTH_HEADERS,
    }).catch((err) => console.error('Erreur de fermeture de session :', err));
  }, []);

  return { userToken, login, logout, refreshSession, isLoading, isAuthenticating, error };
}
