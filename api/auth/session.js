import {
  addNoStoreHeaders,
  clearSessionCookie,
  decryptRefreshToken,
  deleteSession,
  ensureOAuthSchema,
  getAccountForSession,
  getSessionToken,
  isTrustedPopupPost,
  refreshGoogleAccessToken,
  setSessionCookie,
  touchSession,
} from '../../server/oauth.js';

export default async function handler(req, res) {
  addNoStoreHeaders(res);
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Méthode non autorisée.' });
  }
  if (!isTrustedPopupPost(req)) {
    return res.status(403).json({ error: 'Origine de session non autorisée.' });
  }

  const sessionToken = getSessionToken(req);
  if (!sessionToken) return res.status(401).json({ error: 'Session absente.' });

  try {
    await ensureOAuthSchema();
    const account = await getAccountForSession(sessionToken);
    if (!account) {
      await deleteSession(sessionToken);
      clearSessionCookie(res, req);
      return res.status(401).json({ error: 'Session expirée.' });
    }

    const refreshToken = decryptRefreshToken(account.refresh_token_cipher);
    const tokens = await refreshGoogleAccessToken(refreshToken);
    await touchSession(sessionToken);
    setSessionCookie(res, sessionToken, req);

    return res.status(200).json({
      access_token: tokens.access_token,
      expires_in: tokens.expires_in || 3600,
      user: { given_name: account.given_name || '' },
    });
  } catch (error) {
    console.error('Renouvellement OAuth impossible :', error.message, error.oauthError || '');
    if (error.oauthError === 'invalid_grant') {
      await deleteSession(sessionToken).catch(() => {});
      clearSessionCookie(res, req);
      return res.status(401).json({ error: 'La session Google a expiré. Reconnecte-toi pour continuer.' });
    }
    return res.status(500).json({ error: 'Impossible de restaurer la session Google.' });
  }
}
