import { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';

/**
 * Gère l'authentification Google avec expiration automatique à 55 minutes.
 * Retourne le token actif ou null si expiré/absent.
 */
export function useAuth(onLoginSuccess) {
  const [userToken, setUserToken] = useState(() => {
    const token = localStorage.getItem('google_token');
    const expiry = localStorage.getItem('google_token_expiry');
    if (token && expiry && Date.now() < parseInt(expiry, 10)) {
      return token;
    }
    return null;
  });

  const login = useGoogleLogin({
    onSuccess: async (codeResponse) => {
      const token = codeResponse.access_token;
      setUserToken(token);
      localStorage.setItem('google_token', token);
      // Expiration à 55 minutes (3300s)
      localStorage.setItem('google_token_expiry', (Date.now() + 3300 * 1000).toString());

      try {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.given_name && !localStorage.getItem('grandecran_username')) {
          localStorage.setItem('grandecran_username', data.given_name);
        }
      } catch (err) {
        console.error('Userinfo fetch error', err);
      }

      if (onLoginSuccess) onLoginSuccess(token);
    },
    scope:
      'https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/userinfo.profile',
  });

  const logout = () => {
    localStorage.removeItem('google_token');
    localStorage.removeItem('google_token_expiry');
    setUserToken(null);
  };

  return { userToken, setUserToken, login, logout };
}