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
  const requests = [
    { updateSheetProperties: { properties: { sheetId: 0, title: 'DB' }, fields: 'title' } },
    { addSheet: { properties: { title: 'Config' } } },
    {
      updateCells: {
        range: { sheetId: 0, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: DB_HEADERS.length },
        rows: [{ values: headerCells(DB_HEADERS) }],
        fields: 'userEnteredValue',
      },
    },
    {
      updateCells: {
        range: { sheetId: 1, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: CONFIG_HEADERS.length },
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
