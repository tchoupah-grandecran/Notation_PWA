import {
  addNoStoreHeaders,
  createSessionToken,
  ensureOAuthSchema,
  exchangeAuthorizationCode,
  fetchGoogleProfile,
  getAccountByGoogleSub,
  getRequestOrigin,
  isTrustedPopupPost,
  setSessionCookie,
  storeOAuthSession,
} from '../../server/oauth.js';
import { createDefaultSpreadsheet } from '../../server/sheets.js';

export default async function handler(req, res) {
  addNoStoreHeaders(res);
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Méthode non autorisée.' });
  }
  if (!isTrustedPopupPost(req)) {
    return res.status(403).json({ error: 'Origine de connexion non autorisée.' });
  }

  const code = typeof req.body?.code === 'string' ? req.body.code : '';
  const intent = req.body?.intent === 'signup' ? 'signup' : 'signin';
  if (!code || code.length > 4096) {
    return res.status(400).json({ error: 'Code de connexion manquant ou invalide.' });
  }

  try {
    await ensureOAuthSchema();
    const origin = getRequestOrigin(req);
    const tokens = await exchangeAuthorizationCode(code, origin);
    if (!tokens.access_token) throw new Error('Google n’a pas fourni de jeton d’accès.');

    const profile = await fetchGoogleProfile(tokens.access_token);
    if (!profile.sub) throw new Error('Google n’a pas fourni d’identifiant de compte.');

    const existingAccount = await getAccountByGoogleSub(profile.sub);
    if (intent === 'signin' && !existingAccount) {
      return res.status(404).json({ error: 'Aucun compte Grand Écran associé à ce compte Google. Choisis « Créer un compte ».' });
    }

    let newSpreadsheetId = null;
    if (intent === 'signup' && !existingAccount) {
      newSpreadsheetId = await createDefaultSpreadsheet(tokens.access_token);
    }

    const sessionToken = createSessionToken();
    await storeOAuthSession({
      sessionToken,
      googleSub: profile.sub,
      email: profile.email,
      givenName: profile.given_name,
      refreshToken: tokens.refresh_token,
      spreadsheetId: newSpreadsheetId,
    });
    const account = await getAccountByGoogleSub(profile.sub);
    const spreadsheetId = account?.spreadsheet_id || '';
    setSessionCookie(res, sessionToken, req);

    return res.status(200).json({
      access_token: tokens.access_token,
      expires_in: tokens.expires_in || 3600,
      spreadsheet_id: spreadsheetId,
      user: { given_name: profile.given_name || '' },
    });
  } catch (error) {
    console.error('Échec de connexion OAuth :', error.message);
    return res.status(401).json({ error: error.message || 'La connexion Google a échoué.' });
  }
}
