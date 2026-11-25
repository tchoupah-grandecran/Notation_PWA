import {
  addNoStoreHeaders,
  ensureOAuthSchema,
  getAccountForSession,
  getSessionToken,
  isTrustedPopupPost,
  saveAccountSpreadsheet,
} from '../../server/oauth.js';

export default async function handler(req, res) {
  addNoStoreHeaders(res);
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Méthode non autorisée.' });
  }
  if (!isTrustedPopupPost(req)) return res.status(403).json({ error: 'Origine de session non autorisée.' });

  const spreadsheetId = typeof req.body?.spreadsheetId === 'string' ? req.body.spreadsheetId.trim() : '';
  if (!/^[a-zA-Z0-9_-]{20,200}$/.test(spreadsheetId)) {
    return res.status(400).json({ error: 'Identifiant Google Sheets invalide.' });
  }

  try {
    await ensureOAuthSchema();
    const account = await getAccountForSession(getSessionToken(req));
    if (!account) return res.status(401).json({ error: 'Session expirée. Reconnecte-toi.' });
    await saveAccountSpreadsheet(account.google_sub, spreadsheetId);
    return res.status(200).json({ spreadsheet_id: spreadsheetId });
  } catch (error) {
    console.error('Synchronisation du journal Google Sheets impossible :', error.message);
    return res.status(500).json({ error: 'Impossible de synchroniser l’identifiant Google Sheets.' });
  }
}
