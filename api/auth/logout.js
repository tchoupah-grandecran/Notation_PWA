import {
  addNoStoreHeaders,
  clearSessionCookie,
  deleteSession,
  ensureOAuthSchema,
  getSessionToken,
  isTrustedPopupPost,
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
  try {
    if (sessionToken) {
      await ensureOAuthSchema();
      // Une déconnexion ferme uniquement cette session locale. Le compte et
      // son spreadsheet_id doivent rester disponibles à la prochaine connexion.
      await deleteSession(sessionToken);
    }
    clearSessionCookie(res, req);
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Erreur de fermeture de session OAuth :', error.message);
    clearSessionCookie(res, req);
    return res.status(200).json({ ok: true });
  }
}
