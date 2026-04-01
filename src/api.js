const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

// Décodage Base64
const decodeEmailBody = (data) => {
  if (!data) return "";
  try {
    let base64 = data.replace(/-/g, '+').replace(/_/g, '/');
    return decodeURIComponent(escape(atob(base64)));
  } catch (e) { return ""; }
};

// Utilitaire pour nettoyer les caractères HTML (&amp;, &#39; etc.)
const decodeHtmlEntities = (text) => {
  const textArea = document.createElement('textarea');
  textArea.innerHTML = text;
  return textArea.value;
};

// Recherche récursive des différentes parties de l'email
const findEmailPart = (parts, mimeType) => {
  if (!parts) return null;
  for (const p of parts) {
    if (p.mimeType === mimeType) return p.body?.data;
    if (p.parts) {
      const found = findEmailPart(p.parts, mimeType);
      if (found) return found;
    }
  }
  return null;
};

// ==========================================
// PARSING EMAIL PATHÉ (Logique Originale Restaurée)
// ==========================================
const parsePatheEmail = (htmlBody, plainBody) => {
  const html = htmlBody || "";
  const plain = plainBody || html.replace(/<[^>]*>?/gm, ' ') || "";
  const data = {};

  // ── Titre ──────────────────────────────────────────────────────────────
  let m = html.match(/<h1[^>]*>\s*<span[^>]*><\/span>\s*([^<]+)\s*<\/h1>/i);
  if (!m) m = html.match(/<h1[^>]*>\s*([^<]+)\s*<\/h1>/i);
  if (!m) m = plain.match(/Film\s*:?\s*([^\n\r]+)/i);
  if (!m) return null;

  let titre = m[1].replace(/\s+/g, ' ').trim();
  titre = titre.replace(/^La Soirée des Passionnés\s*:\s*/i, '').trim();
  data.titre = decodeHtmlEntities(titre);

  // ── Date & heure ────────────────────────────────────────────────────────
  m = html.match(/(?:Lundi|Mardi|Mercredi|Jeudi|Vendredi|Samedi|Dimanche)?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})[,\s]*(\d{1,2}[:h]\d{2})/i);
  if (m) {
    data.date = m[1].replace(/-/g, '/');
    data.heure = m[2].replace('h', ':');
  } else {
    m = html.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
    if (m) data.date = m[1].replace(/-/g, '/');
    m = html.match(/(\d{1,2}[:h]\d{2})/);
    if (m) data.heure = m[1].replace('h', ':');
  }

  // Ajout de l'année et formatage strict DD/MM/YYYY pour notre PWA
  if (data.date) {
    const parts = data.date.split('/');
    if (parts.length === 3) {
      data.annee = parts[2].length === 2 ? "20" + parts[2] : parts[2];
      // On s'assure que le jour et le mois ont toujours 2 chiffres (ex: "5/4/2023" devient "05/04/2023")
      data.date = `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${data.annee}`;
    }
  }

  // ── Durée — 4 stratégies ────────────────────────────────────────────────
  // Stratégie 1 : label explicite "Durée : Xh YY"
  m = html.match(/[Dd]ur[ée]{1,2}[^:]*:\s*(\d{1,2})\s*h\s*(\d{2})\s*(?:min)?/i)
   || plain.match(/[Dd]ur[ée]{1,2}[^:]*:\s*(\d{1,2})\s*h\s*(\d{2})\s*(?:min)?/i);
  if (m) {
    data.duree = `${parseInt(m[1])}h${m[2]}`;
  }

  // Stratégie 2 : "XhYY" standalone
  if (!data.duree) {
    const durPattern = /\b(\d{1,2})h(\d{2})\b/g;
    let candidate, match2;
    while ((match2 = durPattern.exec(html)) !== null) {
      const h     = parseInt(match2[1]);
      const min   = parseInt(match2[2]);
      const total = h * 60 + min;
      if (total >= 45 && total <= 270) {
        if (h < 7 || (h >= 1 && min > 0 && total <= 270)) {
          if (!candidate) candidate = match2;
        }
      }
    }
    if (candidate) data.duree = `${parseInt(candidate[1])}h${candidate[2]}`;
  }

  // Stratégie 3 : calcul depuis "Fin prévue à HH:MM"
  if (!data.duree && data.heure) {
    m = html.match(/Fin\s+pr[ée]vue\s+[àa]\s+(\d{1,2}:\d{2})/i)
     || plain.match(/Fin\s+pr[ée]vue\s+[àa]\s+(\d{1,2}:\d{2})/i);
    if (m) {
      const d1   = data.heure.split(':').map(Number);
      const d2   = m[1].split(':').map(Number);
      const min1 = d1[0] * 60 + d1[1];
      let min2   = d2[0] * 60 + d2[1];
      if (min2 < min1) min2 += 24 * 60;
      const dur  = Math.max(0, min2 - min1 - 15);
      if (dur >= 45) data.duree = `${Math.floor(dur/60)}h${String(dur%60).padStart(2,'0')}`;
    }
  }

  // Stratégie 4 : "XX minutes"
  if (!data.duree) {
    m = plain.match(/\b(\d{2,3})\s*min(?:utes?)?\b/i);
    if (m) {
      const total = parseInt(m[1]);
      if (total >= 45 && total <= 270) {
        data.duree = `${Math.floor(total/60)}h${String(total%60).padStart(2,'0')}`;
      }
    }
  }

  // ── Salle & siège (Version assouplie) ──────────────────────────────────
  // 1. Extraction de la Salle
  let salleMatch = html.match(/Salle\s+([A-Z0-9\s]+?)(?=\s*[-–<,]|\n|$)/i) || plain.match(/Salle\s+([A-Z0-9\s]+?)(?=\s*[-–<,]|\n|$)/i);
  if (salleMatch) {
    // AJOUT : On préfixe par "Salle "
    data.salle = "Salle " + salleMatch[1].trim(); 
  } else {
    // Fallback si la 1ère méthode échoue
    let oldRoomMatch = html.match(/Salle\s+([A-Z0-9][A-Z0-9 ]{0,18})/i) || plain.match(/Salle\s+([A-Z0-9][A-Z0-9 ]{0,18})/i);
    // AJOUT : On préfixe par "Salle "
    if (oldRoomMatch) data.salle = "Salle " + oldRoomMatch[1].trim();
  }

  // 2. Extraction du Siège (Prend en compte Rang, Fauteuil, Place, Siège...)
  let rangMatch = html.match(/Rang\s+([A-Z0-9]+)/i) || plain.match(/Rang\s+([A-Z0-9]+)/i);
  let placeMatch = html.match(/(?:Place|Si[èe]ge|Fauteuil)\s*(?:n°|N°)?\s*([A-Z0-9]+)/i) || plain.match(/(?:Place|Si[èe]ge|Fauteuil)\s*(?:n°|N°)?\s*([A-Z0-9]+)/i);
  
  if (rangMatch && placeMatch) {
    // S'il y a un rang ET un siège (ex: "K / 14")
    data.siege = `${rangMatch[1].trim()} / ${placeMatch[1].trim()}`;
  } else if (placeMatch) {
    // S'il n'y a que le siège
    data.siege = placeMatch[1].trim();
  }

  // ── Langue (Version assouplie & VF -> FRA) ──────────────────────────────
  let langMatch = html.match(/\b(VF|VOST|VOSTF|VOSTFR|VO|VFQ)\b/i) || plain.match(/\b(VF|VOST|VOSTF|VOSTFR|VO|VFQ)\b/i);
  if (langMatch) {
    let l = langMatch[1].toUpperCase().replace('VOSTFR', 'VOST').replace('VOSTF', 'VOST');
    // CONVERSION : VF ou VFQ devient FRA
    data.langue = (l === 'VF' || l === 'VFQ') ? 'FRA' : l;
  } else {
    let fallbackMatch = html.match(/(VF|VOST|VO|VFQ)/i) || plain.match(/(VF|VOST|VO|VFQ)/i);
    if (fallbackMatch) {
      let l = fallbackMatch[1].toUpperCase();
      data.langue = (l === 'VF' || l === 'VFQ') ? 'FRA' : l;
    } else {
      data.langue = "?";
    }
  }

  return data;
};

// Récupération TMDB
const getMovieDataFromTMDB = async (titre) => {
  if (!titre || !TMDB_API_KEY) return { affiche: null, genre: "Cinéma" };
  try {
    const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(titre)}&language=fr-FR`);
    const json = await res.json();
    if (json.results?.[0]) {
      const movie = json.results[0];
      const detailRes = await fetch(`https://api.themoviedb.org/3/movie/${movie.id}?api_key=${TMDB_API_KEY}&language=fr-FR`);
      const details = await detailRes.json();
      return {
        affiche: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
        genre: details.genres?.[0]?.name || "Cinéma",
        tmdbId: movie.id,
        dureeReelle: details.runtime ? Math.floor(details.runtime/60)+'h'+String(details.runtime%60).padStart(2,'0') : "—"
      };
    }
  } catch (e) { console.error("TMDB Error", e); }
  return { affiche: null, genre: "Cinéma" };
};

// LA FONCTION PRINCIPALE EXPORTÉE
export const getFilmsANoter = async (token) => {
  try {
    const query = encodeURIComponent('subject:"Confirmation de commande les cinémas Pathé" is:unread');
    const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${query}&maxResults=5`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!data.messages) return [];

    const films = [];
    for (const msg of data.messages) {
      const mRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const mData = await mRes.json();
      
      let htmlData = null;
      let plainData = null;
      
      if (mData.payload.parts) {
        htmlData = findEmailPart(mData.payload.parts, 'text/html');
        plainData = findEmailPart(mData.payload.parts, 'text/plain');
      } else if (mData.payload.body?.data) {
        if (mData.payload.mimeType === 'text/html') htmlData = mData.payload.body.data;
        if (mData.payload.mimeType === 'text/plain') plainData = mData.payload.body.data;
      }

      const html = decodeEmailBody(htmlData);
      const plain = decodeEmailBody(plainData);
      
      const parsed = parsePatheEmail(html, plain);
      
      if (parsed) {
        const tmdb = await getMovieDataFromTMDB(parsed.titre);
        if (!parsed.duree && tmdb.dureeReelle) parsed.duree = tmdb.dureeReelle;
        
        films.push({ ...parsed, ...tmdb, messageId: msg.id });
      }
    }

    // === NOUVEAU : TRI CHRONOLOGIQUE DES SÉANCES ===
    films.sort((a, b) => {
      try {
        const getTimestamp = (film) => {
          if (!film.date) return 0;
          
          // Sépare "24/10/2023" en jour=24, mois=10, annee=2023
          const partsDate = film.date.split('/'); 
          const dateObj = new Date(partsDate[2], partsDate[1] - 1, partsDate[0]);
          
          // Ajoute l'heure si elle existe (gère "20:15" et "20h15")
          if (film.heure) {
            const partsHeure = film.heure.replace('h', ':').split(':');
            dateObj.setHours(parseInt(partsHeure[0], 10) || 0, parseInt(partsHeure[1], 10) || 0);
          }
          
          return dateObj.getTime();
        };

        // Tri du plus ancien au plus récent
        return getTimestamp(a) - getTimestamp(b);
        
      } catch (erreur) {
        return 0; // En cas de problème de format, on garde l'ordre de base
      }
    });

    return films;
  } catch (e) { 
    console.error("Erreur Fetch API:", e); 
    return []; 
  }
};

// ==========================================
// SAUVEGARDE ET HISTORIQUE (Google Sheets)
// ==========================================

export const getHistory = async (token, spreadsheetId) => {
  if (!token || !spreadsheetId) return [];
  try {
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/DB!A:P`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.values) return [];
    
    // On retourne juste l'historique nécessaire
    return data.values.slice(1).map(row => ({ date: row[2] }));
  } catch (e) {
    console.error("Erreur Historique", e);
    return [];
  }
};

export const getProchainNumeroSeance = async (token, spreadsheetId, annee) => {
  if (!token || !spreadsheetId || !annee) return "...";
  try {
    const history = await getHistory(token, spreadsheetId);
    // On compte combien de films ont la même année dans la colonne Date
    const yearFilms = history.filter(f => f.date && f.date.includes(String(annee)));
    return yearFilms.length + 1;
  } catch (e) {
    return "?";
  }
};

export const saveFilmToSheet = async (token, spreadsheetId, data) => {
  try {
    const row = [
      data.numeroSeance, data.titre, data.date, data.heure, data.duree, data.langue, 
      data.salle, data.siege, data.note, data.coupDeCoeur, data.genre, 
      data.depense, data.capucine, data.commentaire, data.affiche, data.tmdbId
    ];

    // AJOUT : insertDataOption=INSERT_ROWS force l'insertion après la vraie dernière ligne de texte
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/DB!A:P:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [row] })
    });

    if (!res.ok) throw new Error("Erreur écriture Sheets");

    // AJOUT : Sécurité. On ne marque l'e-mail comme lu QUE s'il y a un messageId (scan d'e-mail)
    if (data.messageId) {
      await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${data.messageId}/modify`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ removeLabelIds: ['UNREAD'] })
      });
    }

    return true;
  } catch (e) { 
    console.error("Erreur de sauvegarde:", e); 
    return false; 
  }
};

export async function getStats(token, spreadsheetId) {
  try {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A:Z`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (data.error) {
      console.error("Erreur de l'API Google :", data.error.message);
      return { totalFilms: "--", coupsDeCoeur: "--" };
    }

    if (!data.values || data.values.length <= 1) {
      return { totalFilms: 0, coupsDeCoeur: 0 };
    }

    const enTetes = data.values[0];
    const lignes = data.values.slice(1); 

    const indexCoupDeCoeur = enTetes.findIndex(
      (titre) => titre && (titre.toLowerCase().includes("coeur") || titre.toLowerCase().includes("cœur"))
    );

    const totalFilms = lignes.length;
    let coupsDeCoeur = 0;

    if (indexCoupDeCoeur !== -1) {
      coupsDeCoeur = lignes.filter((ligne) => {
        const valeur = ligne[indexCoupDeCoeur];
        // CORRECTION : On vérifie si la valeur vaut 1 (en convertissant en texte au cas où)
        return valeur !== undefined && String(valeur).trim() === "1";
      }).length;
    } else {
      console.warn("🚨 Colonne 'Coup de coeur' introuvable dans :", enTetes);
    }

    return { totalFilms, coupsDeCoeur };
    
  } catch (error) {
    console.error("Erreur technique lors de la récupération des statistiques :", error);
    return { totalFilms: "--", coupsDeCoeur: "--" };
  }
}

// Récupère l'historique complet pour l'affichage de l'onglet "Billets"
export const getFullHistory = async (token, spreadsheetId) => {
  try {
    // On récupère les colonnes A à P
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A:P`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (!data.values || data.values.length <= 1) {
      return [];
    }

    const lignes = data.values.slice(1);

    // On transforme les lignes brutes du tableau en jolis objets Javascript
    const historique = lignes.map((row) => {
      return {
        numero: row[0] || "",
        titre: row[1] || "Film inconnu",
        date: row[2] || "",
        heure: row[3] || "",
        duree: row[4] || "",
        langue: row[5] || "",
        salle: row[6] || "",
        siege: row[7] || "",
        note: row[8] || "",
        coupDeCoeur: row[9] !== undefined && String(row[9]).trim() === "1",
        genre: row[10] || "Cinéma",
        depense: row[11] || "",
        capucine: row[12] !== undefined && String(row[12]).trim() === "1",
        commentaire: row[13] || "",
        affiche: row[14] || null
      };
    });

    // On retourne la liste inversée (du plus récent au plus ancien)
    return historique.reverse();

  } catch (error) {
    console.error("Erreur lors de la récupération de l'historique :", error);
    return [];
  }
};

// Fonction pour récupérer l'affiche d'un ancien film
export const getMissingPosterFromTMDB = async (titre) => {
  // Remplace par la façon dont tu récupères ta clé (ex: import.meta.env.VITE_TMDB_API_KEY)
  const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY; 
  if (!titre || !TMDB_KEY) return null;

  try {
    const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(titre)}&language=fr-FR`);
    const json = await res.json();
    
    if (json.results && json.results.length > 0) {
      // 1. Filtrer pour avoir le titre exact (insensible à la casse)
      const exactMatches = json.results.filter(
        m => m.title.toLowerCase() === titre.toLowerCase() || m.original_title.toLowerCase() === titre.toLowerCase()
      );

      // S'il y a des correspondances exactes, on les utilise. Sinon, par sécurité, on garde la liste globale.
      let candidates = exactMatches.length > 0 ? exactMatches : json.results;

      // 2. Trier du plus récent au plus ancien (selon la date de sortie)
      candidates.sort((a, b) => {
        const dateA = a.release_date ? new Date(a.release_date).getTime() : 0;
        const dateB = b.release_date ? new Date(b.release_date).getTime() : 0;
        return dateB - dateA; // Ordre décroissant
      });

      // 3. On prend le premier de la liste triée
      const bestMatch = candidates[0];
      
      if (bestMatch && bestMatch.poster_path) {
        return `https://image.tmdb.org/t/p/w500${bestMatch.poster_path}`;
      }
    }
  } catch (e) {
    console.error("Erreur récupération TMDB pour :", titre, e);
  }
  return null;
};

// ==========================================
// CONFIGURATION (Sauvegarde des Préférences)
// ==========================================

// ✅ Sauvegarder les préférences dans l'onglet "Config"
export const savePreferencesToSheet = async (token, spreadsheetId, prefs) => {
  try {
    // Conversion de l'objet de prix en chaîne de texte JSON (si existant)
    const pricingString = prefs.pricing ? JSON.stringify(prefs.pricing) : "";

    // On cible désormais les colonnes de A à E (A2:E2)
    const range = "Config!A2:E2"; 
    const values = [[
      prefs.userName || "", 
      prefs.userAvatar || "", 
      prefs.themeKey || "", 
      prefs.ratingScale || "", 
      pricingString // <-- La magie opère ici (Colonne E)
    ]];
    
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=RAW`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values })
    });
  } catch (error) {
    console.error("Erreur synchro cloud:", error);
  }
};

// ✅ Récupérer les préférences au démarrage
export const getPreferencesFromSheet = async (token, spreadsheetId) => {
  try {
    // On lit les colonnes A à E
    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Config!A2:E2`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json();

    if (data.values && data.values[0]) {
      const row = data.values[0];
      let pricingObj = null;

      // On tente de retransformer le texte de la colonne E (index 4) en objet
      if (row[4]) {
        try {
          pricingObj = JSON.parse(row[4]);
        } catch (e) {
          console.error("Erreur décodage de l'historique des prix", e);
        }
      }

      return {
        userName: row[0] || null,
        userAvatar: row[1] || null,
        themeKey: row[2] || null,
        ratingScale: row[3] ? parseInt(row[3], 10) : null,
        pricing: pricingObj // Objet récupéré et prêt à l'emploi
      };
    }
  } catch (e) { 
    console.error("Erreur lecture des préférences :", e);
    return null; 
  }
};

export const createAutoSpreadsheet = async (token) => {
  try {
    // 1. Création du fichier
    const createRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        properties: { title: "Mon Journal Grand Écran 🍿" }
      })
    });
    const sheet = await createRes.json();
    const spreadsheetId = sheet.spreadsheetId;

    // 2. Configuration des onglets (Films et Config)
    // On va renommer la "Feuille 1" en "Films" et créer "Config"
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          { updateSheetProperties: { properties: { sheetId: 0, title: "Films" }, fields: "title" } },
          { addSheet: { properties: { title: "Config" } } },
          // Initialisation des Headers pour Films
          {
            updateCells: {
              range: { sheetId: 0, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 12 },
              rows: [{
                values: [
                  { userEnteredValue: { stringValue: "Titre" } },
                  { userEnteredValue: { stringValue: "Note" } },
                  { userEnteredValue: { stringValue: "Date" } },
                  { userEnteredValue: { stringValue: "Genre" } },
                  { userEnteredValue: { stringValue: "Affiche" } },
                  { userEnteredValue: { stringValue: "Commentaire" } },
                  { userEnteredValue: { stringValue: "Coup de Coeur" } },
                  { userEnteredValue: { stringValue: "Capucine" } },
                  { userEnteredValue: { stringValue: "Depense" } },
                  { userEnteredValue: { stringValue: "Langue" } },
                  { userEnteredValue: { stringValue: "Annee" } },
                  { userEnteredValue: { stringValue: "Séance #" } }
                ]
              }],
              fields: "userEnteredValue"
            }
          },
          // Initialisation des Headers pour Config
          {
            updateCells: {
              range: { sheetId: 1, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 5 }, // <- Mis à jour à 5 colonnes
              rows: [{
                values: [
                  { userEnteredValue: { stringValue: "Pseudo" } },
                  { userEnteredValue: { stringValue: "Avatar URL" } },
                  { userEnteredValue: { stringValue: "Thème" } },
                  { userEnteredValue: { stringValue: "Échelle de Note" } },
                  { userEnteredValue: { stringValue: "Historique des Tarifs (JSON)" } }
                ]
              }],
              fields: "userEnteredValue"
            }
          }
        ]
      })
    });

    return spreadsheetId;
  } catch (error) {
    console.error("Erreur création Sheet:", error);
    return null;
  }
};

// ==========================================
// TMDB : CASTING & RÉALISATEUR (Avis Express)
// ==========================================
export const getMovieDetailsWithCast = async (tmdbId, titre) => {
  const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY;
  if (!TMDB_KEY) return null;
  try {
    // 1. On cherche d'abord avec l'ID exact
    if (tmdbId) {
      const detailRes = await fetch(`https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_KEY}&language=fr-FR&append_to_response=credits`);
      if (detailRes.ok) return await detailRes.json();
    }
    // 2. Fallback avec le titre
    if (titre) {
      const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(titre)}&language=fr-FR`);
      const json = await res.json();
      if (json.results?.[0]) {
        const movie = json.results[0];
        const detailRes = await fetch(`https://api.themoviedb.org/3/movie/${movie.id}?api_key=${TMDB_KEY}&language=fr-FR&append_to_response=credits`);
        return await detailRes.json();
      }
    }
  } catch (e) {
    console.error("Erreur TMDB Credits:", e);
  }
  return null;
};