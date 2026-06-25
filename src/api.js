const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const FILMS_RANGE = "DB!A:P";
const FILMS_APPEND_RANGE = "DB!A:P";

const GMAIL_SCAN_QUERIES = [
  'subject:"Confirmation de commande les cinémas Pathé" is:unread newer_than:180d',
  '(from:ticketcine.fr OR subject:"Vos places pour") is:unread newer_than:180d',
  '(from:cineville.fr OR subject:"Confirmation de votre commande Cinéville") is:unread newer_than:180d',
];

const MONTHS_FR = {
  janvier: 1,
  fevrier: 2,
  février: 2,
  mars: 3,
  avril: 4,
  mai: 5,
  juin: 6,
  juillet: 7,
  aout: 8,
  août: 8,
  septembre: 9,
  octobre: 10,
  novembre: 11,
  decembre: 12,
  décembre: 12,
};

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

const stripHtml = (html = "") => {
  const normalized = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<\/li>/gi, "\n");
  return decodeHtmlEntities(normalized.replace(/<[^>]*>/g, " "))
    .replace(/\u200B|\u200C|\u200D|\uFEFF/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

const normalizeWhitespace = (text = "") =>
  decodeHtmlEntities(String(text))
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const cleanTitle = (title = "") =>
  normalizeWhitespace(title)
    .replace(/^Film\s*:?\s*/i, "")
    .replace(/^Titre du film\s*:?\s*/i, "")
    .replace(/^La Soirée des Passionnés\s*:\s*/i, "")
    .trim();

const normalizeTime = (time = "") => {
  const m = String(time).match(/(\d{1,2})\s*[:h]\s*(\d{2})/i);
  if (!m) return "";
  return `${m[1].padStart(2, "0")}:${m[2]}`;
};

const normalizeDateParts = (day, month, year) => {
  const y = String(year).length === 2 ? `20${year}` : String(year);
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${y}`;
};

const normalizeNumericDate = (date = "") => {
  const compact = String(date).match(/^(\d{4})(\d{2})(\d{2})$/);
  if (compact) return normalizeDateParts(compact[3], compact[2], compact[1]);

  const m = String(date).match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
  if (!m) return "";
  return normalizeDateParts(m[1], m[2], m[3]);
};

const parseFrenchDateTime = (text = "") => {
  const compact = text.match(/\b(\d{4})(\d{2})(\d{2})\b/);
  if (compact) return { date: normalizeNumericDate(compact[0]) };

  const numeric = text.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})(?:\s*(?:à|a|-|,)?\s*(\d{1,2}[:h]\d{2}))?/i);
  if (numeric) {
    return {
      date: normalizeDateParts(numeric[1], numeric[2], numeric[3]),
      heure: normalizeTime(numeric[4] || ""),
    };
  }

  const french = text.match(
    /(?:lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)?\s*(\d{1,2})\s+(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)\s+(\d{4})(?:\s*(?:à|a)\s*(\d{1,2}[:h]\d{2}))?/i
  );
  if (!french) return {};
  return {
    date: normalizeDateParts(french[1], MONTHS_FR[french[2].toLowerCase()], french[3]),
    heure: normalizeTime(french[4] || ""),
  };
};

const durationFromMinutes = (minutes) => {
  if (!minutes || minutes < 45) return "";
  return `${Math.floor(minutes / 60)}h${String(minutes % 60).padStart(2, "0")}`;
};

const computeDurationFromTimes = (start, end, trailerMinutes = 0) => {
  const s = normalizeTime(start);
  const e = normalizeTime(end);
  if (!s || !e) return "";
  const [sh, sm] = s.split(":").map(Number);
  const [eh, em] = e.split(":").map(Number);
  const startMin = sh * 60 + sm;
  let endMin = eh * 60 + em;
  if (endMin < startMin) endMin += 1440;
  return durationFromMinutes(endMin - startMin - trailerMinutes);
};

const extractHeader = (payload, name) =>
  payload?.headers?.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || "";

const getMessageFingerprint = (film) =>
  [film?.titre, film?.date, film?.heure]
    .map((v) => normalizeWhitespace(v || "").toLowerCase())
    .join("|");

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

const findAllEmailParts = (payload, mimeType, acc = []) => {
  if (!payload) return acc;
  if (payload.mimeType === mimeType && payload.body?.data) acc.push(payload.body.data);
  if (payload.parts) payload.parts.forEach((part) => findAllEmailParts(part, mimeType, acc));
  return acc;
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

// ── Durée — Stratégie de secours via Email ──────────────────────────────
  // On ne garde ici que le calcul basé sur l'email. 
  // La durée officielle TMDB sera injectée plus tard dans getFilmsANoter.
  
  if (data.heure) {
    // On cherche l'heure de fin dans le HTML ou le Plain Text
    const finMatch = html.match(/Fin\s+pr[ée]vue\s+[àa]\s+(\d{1,2}[:h]\d{2})/i)
                  || plain.match(/Fin\s+pr[ée]vue\s+[àa]\s+(\d{1,2}[:h]\d{2})/i);
    
    if (finMatch) {
      // Normalisation des formats (20h15 -> 20:15)
      const startParts = data.heure.replace('h', ':').split(':').map(Number);
      const endParts   = finMatch[1].replace('h', ':').split(':').map(Number);
      
      const startMin = startParts[0] * 60 + startParts[1];
      let endMin     = endParts[0] * 60 + endParts[1];
      
      // Gestion du passage à minuit (si fin < début)
      if (endMin < startMin) endMin += 1440; 
      
      // Calcul : Durée totale - 15 minutes (publicités/bandes-annonces)
      const diff = endMin - startMin - 15;
      
      if (diff >= 45) {
        data.duree = `${Math.floor(diff / 60)}h${String(diff % 60).padStart(2, '0')}`;
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

const parseTicketcineEmail = (htmlBody, plainBody, meta = {}) => {
  const html = htmlBody || "";
  const text = stripHtml(`${plainBody || ""}\n${html}`);
  const sourceText = `${meta.from || ""} ${meta.subject || ""} ${text}`;
  if (!/ticketcine|400\s*coups|cotecine|Vos places pour/i.test(sourceText)) return null;

  const data = {
    source: "ticketcine",
    cinema: "",
    langue: "?",
    parseConfidence: 0,
  };

  const cinemaMatch = text.match(/Cin[ée]ma\s+[^,\n]+(?:Les\s+400\s+Coups|400\s+Coups)/i)
    || html.match(/Logo du cin[ée]ma:\s*([^"]+)/i);
  if (cinemaMatch) data.cinema = normalizeWhitespace(cinemaMatch[0] || cinemaMatch[1]);

  const subjectTitle = meta.subject?.match(/Vos places pour\s+(.+?)\s+le\s+/i);
  const titleMatch = text.match(/Film\s*:\s*([^\n\r]+)/i)
    || text.match(/\n\s*([^\n\r]{2,80})\s*\n\s*IMPRIMER/i)
    || subjectTitle;
  if (titleMatch) data.titre = cleanTitle(titleMatch[1]);

  const sessionLine = text.match(/S[ée]ance du\s+([^\n\r]+?)(?:\n|Film\s*:)/i)
    || text.match(/((?:lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\s+\d{1,2}\s+\w+\s+\d{4}\s+(?:à|a)\s+\d{1,2}[:h]\d{2})/i);
  const dt = parseFrenchDateTime(sessionLine?.[1] || meta.subject || text);
  if (dt.date) data.date = dt.date;
  if (dt.heure) data.heure = dt.heure;

  const endMatch = text.match(/fin pr[ée]vue pour\s+(\d{1,2}[:h]\d{2})/i);
  const explicitDuration = text.match(/Dur[ée]e\s*:\s*(\d{1,2})h(\d{2})/i);
  if (explicitDuration) {
    data.duree = `${Number(explicitDuration[1])}h${explicitDuration[2]}`;
  } else if (data.heure && endMatch) {
    data.duree = computeDurationFromTimes(data.heure, endMatch[1], 0);
  }

  const roomMatch = text.match(/\bSALLE\s+([A-Z0-9]+)/i);
  if (roomMatch) data.salle = `Salle ${roomMatch[1].trim()}`;

  const priceMatch = text.match(/Montant TTC\s*:\s*([\d,.]+)\s*euros/i)
    || text.match(/soit\s+([\d,.]+)\s*euros/i);
  if (priceMatch) data.depense = priceMatch[1].replace(",", ".");

  const reservationMatch = text.match(/N[°o]\s*de r[ée]servation\s*:\s*([A-Z0-9-]+)/i)
    || html.match(/QR code de la r[ée]servation:\s*([A-Z0-9-]+)/i);
  if (reservationMatch) data.bookingRef = reservationMatch[1];

  data.parseConfidence = ["titre", "date", "heure"].filter((key) => data[key]).length / 3;
  return data.titre && data.date && data.heure ? data : null;
};

const parseCinevilleEmail = (htmlBody, plainBody, meta = {}) => {
  const text = stripHtml(`${plainBody || ""}\n${htmlBody || ""}`);
  const sourceText = `${meta.from || ""} ${meta.subject || ""} ${text}`;
  if (!/cineville|cinéville|ws2\.cineville/i.test(sourceText)) return null;

  const data = {
    source: "cineville",
    cinema: "Cinéville",
    langue: "?",
    parseConfidence: 0,
  };

  const titleMatch = text.match(/Titre du film\s*:\s*([^\n\r]+)/i);
  if (titleMatch) data.titre = cleanTitle(titleMatch[1]);

  const dateMatch = text.match(/Date de la s[ée]ance\s*:\s*(\d{8}|\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})/i);
  if (dateMatch) {
    const normalized = normalizeNumericDate(dateMatch[1]);
    if (normalized) data.date = normalized;
  }

  const timeMatch = text.match(/Heure de la s[ée]ance\s*:\s*(\d{1,2}[:h]\d{2})(?::\d{2})?/i);
  if (timeMatch) data.heure = normalizeTime(timeMatch[1]);

  const bookingMatch = text.match(/Code Barre Billet\s*:\s*([A-Z0-9-]+)/i);
  if (bookingMatch) data.bookingRef = bookingMatch[1];

  data.parseConfidence = ["titre", "date", "heure"].filter((key) => data[key]).length / 3;
  return data.titre && data.date && data.heure ? data : null;
};

const EMAIL_PARSERS = [
  { id: "ticketcine", parse: parseTicketcineEmail },
  { id: "cineville", parse: parseCinevilleEmail },
  { id: "pathe", parse: (html, plain) => {
    const parsed = parsePatheEmail(html, plain);
    return parsed ? { ...parsed, source: "pathe", cinema: "Pathé", parseConfidence: 1 } : null;
  }},
];

const parseCinemaEmail = (html, plain, meta) => {
  for (const parser of EMAIL_PARSERS) {
    const parsed = parser.parse(html, plain, meta);
    if (parsed) return { parserId: parser.id, ...parsed };
  }
  return null;
};

// Récupération TMDB
const getMovieDataFromTMDB = async (titre, annee) => {
  const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
  if (!titre || !TMDB_API_KEY) return { affiche: null, genre: "Cinéma", tmdbDuree: null };

  try {
    const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(titre)}&language=fr-FR`);
    const json = await res.json();
    
    if (json.results && json.results.length > 0) {
      // On cherche en priorité le film dont la date de sortie (release_date) commence par notre année de séance (ex: "2026")
      let movie = json.results.find(m => m.release_date && m.release_date.startsWith(String(annee)));
      
      // Sécurité : Si aucun film ne correspond à l'année exacte, on prend le premier résultat par défaut
      if (!movie) {
        movie = json.results[0];
      }

      const detailRes = await fetch(`https://api.themoviedb.org/3/movie/${movie.id}?api_key=${TMDB_API_KEY}&language=fr-FR`);
      const details = await detailRes.json();
      
      return {
        affiche: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
        genre: details.genres?.[0]?.name || "Cinéma",
        tmdbId: movie.id,
        tmdbDuree: details.runtime 
          ? `${Math.floor(details.runtime / 60)}h${String(details.runtime % 60).padStart(2, '0')}` 
          : null
      };
    }
  } catch (e) { 
    console.error("TMDB Error", e); 
  }
  return { affiche: null, genre: "Cinéma", tmdbDuree: null };
};

// LA FONCTION PRINCIPALE EXPORTÉE
export const getFilmsANoter = async (token, spreadsheetId = "") => {
  try {
    const existingFingerprints = spreadsheetId
      ? await getExistingFilmFingerprints(token, spreadsheetId)
      : new Set();
    const messageMap = new Map();
    await Promise.all(GMAIL_SCAN_QUERIES.map(async (rawQuery) => {
      const query = encodeURIComponent(rawQuery);
      const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${query}&maxResults=10`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      (data.messages || []).forEach((msg) => messageMap.set(msg.id, msg));
    }));
    const messages = [...messageMap.values()];
    if (!messages.length) return [];

    // On prépare la liste des promesses pour traiter les messages en parallèle
    const filmsPromises = messages.map(async (msg) => {
      try {
        const mRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const mData = await mRes.json();
        const meta = {
          from: extractHeader(mData.payload, "From"),
          subject: extractHeader(mData.payload, "Subject"),
          date: extractHeader(mData.payload, "Date"),
        };
        
        const htmlParts = findAllEmailParts(mData.payload, 'text/html');
        const plainParts = findAllEmailParts(mData.payload, 'text/plain');
        const htmlData = htmlParts[0] || findEmailPart(mData.payload.parts, 'text/html');
        const plainData = plainParts[0] || findEmailPart(mData.payload.parts, 'text/plain');

        const html = decodeEmailBody(htmlData);
        const plain = decodeEmailBody(plainData);
        
        // 1. Parsing de base depuis l'email
        const parsed = parseCinemaEmail(html, plain, meta);
        if (!parsed) return null;

        // 2. Récupération simultanée des infos TMDB
        const tmdb = await getMovieDataFromTMDB(parsed.titre?.trim(), parsed.annee);
        
        // 3. Gestion de la Durée (TMDB > Calcul Email > Défaut)
        let finalDuree = "--h--";
        
        if (tmdb && tmdb.tmdbDuree) {
          finalDuree = tmdb.tmdbDuree;
        } else if (parsed.heure) {
          const finMatch = html.match(/Fin\s+pr[ée]vue\s+[àa]\s+(\d{1,2}[:h]\d{2})/i)
                        || plain.match(/Fin\s+pr[ée]vue\s+[àa]\s+(\d{1,2}[:h]\d{2})/i);
          
          if (finMatch) {
            const startParts = parsed.heure.replace('h', ':').split(':').map(Number);
            const endParts   = finMatch[1].replace('h', ':').split(':').map(Number);
            const startMin   = startParts[0] * 60 + startParts[1];
            let endMin       = endParts[0] * 60 + endParts[1];
            
            if (endMin < startMin) endMin += 1440;
            const diff = endMin - startMin - 15;
            if (diff >= 45) {
              finalDuree = `${Math.floor(diff / 60)}h${String(diff % 60).padStart(2, '0')}`;
            }
          }
        }

        return { 
          ...parsed, 
          ...tmdb, 
          duree: finalDuree, 
          messageId: msg.id,
          emailSubject: meta.subject,
          emailFrom: meta.from,
          fingerprint: getMessageFingerprint(parsed),
        };
      } catch (err) {
        console.error(`Erreur sur le message ${msg.id}:`, err);
        return null;
      }
    });

    // On attend que tous les mails soient traités
    const results = await Promise.all(filmsPromises);
    const seen = new Set();
    const films = results.filter((f) => {
      if (!f) return false;
      const fingerprint = f.fingerprint || getMessageFingerprint(f);
      if (existingFingerprints.has(fingerprint)) return false;
      if (seen.has(fingerprint)) return false;
      seen.add(fingerprint);
      return true;
    });

    // === TRI CHRONOLOGIQUE ===
    films.sort((a, b) => {
      const getTimestamp = (f) => {
        if (!f.date) return 0;
        const p = f.date.split('/');
        const d = new Date(p[2], p[1] - 1, p[0]);
        if (f.heure) {
          const h = f.heure.replace('h', ':').split(':');
          d.setHours(parseInt(h[0]) || 0, parseInt(h[1]) || 0);
        }
        return d.getTime();
      };
      return getTimestamp(a) - getTimestamp(b);
    });

    return films;
  } catch (e) { 
    console.error("Erreur globale Fetch API:", e); 
    return []; 
  }
};

// ==========================================
// SAUVEGARDE ET HISTORIQUE (Google Sheets)
// ==========================================

export const getHistory = async (token, spreadsheetId) => {
  if (!token || !spreadsheetId) return [];
  try {
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${FILMS_RANGE}`, {
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

const getExistingFilmFingerprints = async (token, spreadsheetId) => {
  if (!token || !spreadsheetId) return new Set();
  try {
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${FILMS_RANGE}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return new Set();
    const data = await res.json();
    return new Set((data.values || []).slice(1).map((row) => getMessageFingerprint({
      titre: row[1],
      date: row[2],
      heure: row[3],
    })));
  } catch (e) {
    console.error("Erreur lecture anti-doublons", e);
    return new Set();
  }
};

const markMessageAsProcessed = async (token, messageId) => {
  if (!token || !messageId) return;
  try {
    await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ removeLabelIds: ['UNREAD'] })
    });
  } catch (e) {
    console.warn("Sauvegarde OK, mais impossible de marquer l'e-mail comme traité", e);
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
    const existing = await getExistingFilmFingerprints(token, spreadsheetId);
    const incomingFingerprint = getMessageFingerprint(data);
    if (incomingFingerprint && existing.has(incomingFingerprint)) {
      await markMessageAsProcessed(token, data.messageId);
      return true;
    }

    const row = [
      data.numeroSeance, data.titre, data.date, data.heure, data.duree, data.langue, 
      data.salle, data.siege, data.note, data.coupDeCoeur, data.genre, 
      data.depense, data.capucine, data.commentaire, data.affiche, data.tmdbId
    ];

    // AJOUT : insertDataOption=INSERT_ROWS force l'insertion après la vraie dernière ligne de texte
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${FILMS_APPEND_RANGE}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [row] })
    });

    if (!res.ok) throw new Error("Erreur écriture Sheets");

    // AJOUT : Sécurité. On ne marque l'e-mail comme lu QUE s'il y a un messageId (scan d'e-mail)
    await markMessageAsProcessed(token, data.messageId);

    return true;
  } catch (e) { 
    console.error("Erreur de sauvegarde:", e); 
    return false; 
  }
};

export async function getStats(token, spreadsheetId) {
  try {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${FILMS_RANGE}`,
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
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${FILMS_RANGE}`,
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
        affiche: row[14] || null,
        tmdbId: row[15] || null
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

    // 2. Configuration des onglets (DB et Config)
    // On renomme la feuille par défaut en DB pour rester aligné avec les lectures/écritures.
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          { updateSheetProperties: { properties: { sheetId: 0, title: "DB" }, fields: "title" } },
          { addSheet: { properties: { title: "Config" } } },
          // Initialisation des Headers pour DB
          {
            updateCells: {
              range: { sheetId: 0, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 16 },
              rows: [{
                values: [
                  { userEnteredValue: { stringValue: "Séance #" } },
                  { userEnteredValue: { stringValue: "Titre" } },
                  { userEnteredValue: { stringValue: "Date" } },
                  { userEnteredValue: { stringValue: "Heure" } },
                  { userEnteredValue: { stringValue: "Durée" } },
                  { userEnteredValue: { stringValue: "Langue" } },
                  { userEnteredValue: { stringValue: "Salle" } },
                  { userEnteredValue: { stringValue: "Siège" } },
                  { userEnteredValue: { stringValue: "Note" } },
                  { userEnteredValue: { stringValue: "Coup de Coeur" } },
                  { userEnteredValue: { stringValue: "Genre" } },
                  { userEnteredValue: { stringValue: "Dépense" } },
                  { userEnteredValue: { stringValue: "Capucine" } },
                  { userEnteredValue: { stringValue: "Commentaire" } },
                  { userEnteredValue: { stringValue: "Affiche" } },
                  { userEnteredValue: { stringValue: "TMDB ID" } }
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
