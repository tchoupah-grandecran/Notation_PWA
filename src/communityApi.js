const HEADERS = {
  'Content-Type': 'application/json',
  'X-Requested-With': 'XmlHttpRequest',
};

// Le partage de notes n'est actif qu'après une première visite de l'onglet Amis (consentement implicite).
const ENABLED_KEY = 'grandecran_community_on';
const SIGNATURE_KEY = 'grandecran_activity_sig';
const SYNC_LIMIT = 10;

async function call(action, body = {}) {
  const response = await fetch(`/api/community/${action}`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: HEADERS,
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error || 'Erreur du service communautaire.');
    error.status = response.status;
    throw error;
  }
  return payload;
}

/** Mon profil + code ami (créé au premier appel). Synchronise pseudo/avatar si fournis. */
export const getMyCommunityProfile = async (profile = {}) => {
  const result = await call('me', profile);
  try {
    localStorage.setItem(ENABLED_KEY, '1');
  } catch {
    /* stockage indisponible */
  }
  return result;
};

/** Ajoute un ami via son code. → { friend, alreadyFriends } */
export const addFriendByCode = (code) => call('add', { code });

/** Liste mes amis. → { friends: [{ friendCode, displayName, avatarUrl, since }] } */
export const listFriends = () => call('list');

/** Retire un ami. */
export const removeFriend = (friendCode) => call('remove', { friendCode });

/** Dernières séances de mes amis. → { items: [...] } */
export const getFeed = () => call('feed');

// ─── Synchronisation de mes séances ──────────────────────────────────
const parseNote = (value) => {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  const n = Number(raw.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

// Le journal stocke « JJ/MM/AAAA » ; le serveur attend « AAAA-MM-JJ ».
const toIsoDate = (value) => {
  const m = String(value || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : null;
};

const toActivityItem = (film, ratingScale) => {
  const rating = parseNote(film?.note);
  const watchedOn = toIsoDate(film?.date);
  if (!film?.titre || rating === null || rating > ratingScale || !watchedOn) return null;
  return {
    sessionKey: `${film.titre}|${film.date}|${film.heure || ''}`,
    title: film.titre,
    rating,
    ratingScale,
    genre: film.genre || null,
    poster: film.affiche || null,
    tmdbId: film.tmdbId ? String(film.tmdbId) : null,
    coupDeCoeur: Boolean(film.coupDeCoeur),
    watchedOn,
  };
};

/**
 * Envoie mes 10 dernières séances notées (idempotent côté serveur).
 * Un « signature » local évite tout appel réseau tant que rien n'a changé.
 */
export async function syncActivity(historyData, ratingScale) {
  try {
    if (!localStorage.getItem(ENABLED_KEY)) return { skipped: true };
  } catch {
    return { skipped: true };
  }

  const items = (Array.isArray(historyData) ? historyData : [])
    .map((film) => toActivityItem(film, ratingScale))
    .filter(Boolean)
    .sort((a, b) => b.watchedOn.localeCompare(a.watchedOn))
    .slice(0, SYNC_LIMIT);
  if (items.length === 0) return { skipped: true };

  const signature = JSON.stringify(items);
  try {
    if (localStorage.getItem(SIGNATURE_KEY) === signature) return { unchanged: true };
  } catch {
    /* on envoie quand même */
  }

  const result = await call('activity', { items });
  if (!result.skipped) {
    try {
      localStorage.setItem(SIGNATURE_KEY, signature);
    } catch {
      /* stockage indisponible */
    }
  }
  return result;
}