const DB_HEADERS = [
  'Séance #', 'Titre', 'Date', 'Heure', 'Durée', 'Langue', 'Salle', 'Siège',
  'Note', 'Coup de Coeur', 'Genre', 'Dépense', 'Capucine', 'Commentaire', 'Affiche', 'TMDB ID',
];
const CONFIG_HEADERS = [
  'Pseudo', 'Avatar URL', 'Thème', 'Échelle de Note', 'Historique des Tarifs (JSON)',
  'Thème de couleur', 'Accent Fiertés',
];

function headerCells(headers) {
  return headers.map((header) => ({ userEnteredValue: { stringValue: header } }));
}

export async function createDefaultSpreadsheet(accessToken) {
  const headers = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };
  const createResponse = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers,
    body: JSON.stringify({ properties: { title: 'Mon Journal Grand Écran 🍿' } }),
  });
  const created = await createResponse.json().catch(() => ({}));
  if (!createResponse.ok || !created.spreadsheetId) {
    throw new Error(created.error?.message || 'Google Sheets n’a pas pu créer le journal.');
  }

  const spreadsheetId = created.spreadsheetId;
  let dbSheetId = created.sheets?.[0]?.properties?.sheetId;
  if (dbSheetId === undefined) {
    const detailsResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets(properties(sheetId,title))`, { headers });
    const details = await detailsResponse.json().catch(() => ({}));
    if (!detailsResponse.ok) throw new Error(details.error?.message || 'Impossible de lire les onglets du nouveau journal.');
    dbSheetId = details.sheets?.[0]?.properties?.sheetId;
  }
  if (dbSheetId === undefined) throw new Error('Google Sheets n’a pas renvoyé l’onglet principal du journal.');

  // Google valide toutes les références d’une batch avant d’appliquer les
  // requêtes. On crée Config d’abord pour récupérer son vrai sheetId ensuite.
  const structureResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      requests: [
        { updateSheetProperties: { properties: { sheetId: dbSheetId, title: 'DB' }, fields: 'title' } },
        { addSheet: { properties: { title: 'Config' } } },
      ],
    }),
  });
  const structure = await structureResponse.json().catch(() => ({}));
  if (!structureResponse.ok) {
    throw new Error(structure.error?.message || 'Google Sheets n’a pas pu créer les onglets du journal.');
  }
  const configSheetId = structure.replies?.[1]?.addSheet?.properties?.sheetId;
  if (configSheetId === undefined) throw new Error('Google Sheets n’a pas renvoyé l’onglet Config.');

  const requests = [
    {
      updateCells: {
        range: { sheetId: dbSheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: DB_HEADERS.length },
        rows: [{ values: headerCells(DB_HEADERS) }],
        fields: 'userEnteredValue',
      },
    },
    {
      updateCells: {
        range: { sheetId: configSheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: CONFIG_HEADERS.length },
        rows: [{ values: headerCells(CONFIG_HEADERS) }],
        fields: 'userEnteredValue',
      },
    },
  ];
  const configureResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ requests }),
  });
  const configured = await configureResponse.json().catch(() => ({}));
  if (!configureResponse.ok) {
    throw new Error(configured.error?.message || 'Google Sheets n’a pas pu préparer le journal.');
  }
  return spreadsheetId;
}
