import { computeStats, parseNote, toIsoDate } from './communityStats';

const HEADERS = {
  'Content-Type': 'application/json',
  'X-Requested-With': 'XmlHttpRequest',
};

// Le partage de notes n'est actif qu'après une première visite de l'onglet Amis (consentement implicite).
const ENABLED_KEY = 'grandecran_community_on';
const SIGNATURE_KEY = 'grandecran_activity_sig';
const STATS_SIGNATURE_KEY = 'grandecran_stats_sig';
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

/** Dernières séances de mes amis (+ réactions). → { items: [...], myReactions: [...] } */
export const getFeed = () => call('feed');

/** Pose (active = true) ou retire (false) ma réaction « like » | « dislike » | « watch » sur une séance d'ami. */
export const reactToActivity = (activityId, kind, active) => call('react', { activityId, kind, active });

/** Stats d'un ami + films en commun. → { friend, stats | null, updatedAt, common: [...] } */
export const compareWithFriend = (friendCode) => call('compare', { friendCode });

// ─── Affiche d'un film à partir de son TMDB ID (repli quand aucun lien direct ne fonctionne) ───
const posterCache = new Map(); // tmdbId → Promise<string | null>

export function fetchTmdbPoster(tmdbId) {
  const id = String(tmdbId || '').trim();
  const apiKey = import.meta.env.VITE_TMDB_API_KEY;
  if (!/^\d+$/.test(id) || !apiKey) return Promise.resolve(null);

  if (!posterCache.has(id)) {
    const request = fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}&language=fr-FR`)
      .then((response) => (response.ok ? response.json() : null))
      .then((json) => (json?.poster_path ? `https://image.tmdb.org/t/p/w500${json.poster_path}` : null))
      .catch(() => null)
      .then((url) => {
        if (!url) posterCache.delete(id); // on pourra réessayer plus tard
        return url;
      });
    posterCache.set(id, request);
  }
  return posterCache.get(id);
}

// ─── Synchronisation de mes séances ──────────────────────────────────
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
    comment: String(film.commentaire || '').trim() || null,
  };
};

// Petite empreinte (djb2) pour détecter un changement sans stocker tout l'instantané
const hashString = (value) => {
  let hash = 5381;
  for (let i = 0; i < value.length; i += 1) hash = ((hash << 5) + hash + value.charCodeAt(i)) | 0;
  return String(hash >>> 0);
};

const readStorage = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeStorage = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* stockage indisponible */
  }
};

async function pushActivity(historyData, ratingScale) {
  const items = (Array.isArray(historyData) ? historyData : [])
    .map((film) => toActivityItem(film, ratingScale))
    .filter(Boolean)
    .sort((a, b) => b.watchedOn.localeCompare(a.watchedOn))
    .slice(0, SYNC_LIMIT);
  if (items.length === 0) return { skipped: true };

  // Remédiation à la source : un film avec TMDB ID mais sans affiche en reçoit une avant l'envoi,
  // pour que mes amis la voient aussi.
  await Promise.all(
    items
      .filter((item) => !item.poster && item.tmdbId)
      .map(async (item) => {
        item.poster = (await fetchTmdbPoster(item.tmdbId)) || null;
      })
  );

  const signature = JSON.stringify(items);
  if (readStorage(SIGNATURE_KEY) === signature) return { unchanged: true };

  const result = await call('activity', { items });
  if (!result.skipped) writeStorage(SIGNATURE_KEY, signature);
  return result;
}

async function pushStats(historyData, ratingScale) {
  const { stats, films } = computeStats(historyData, ratingScale);
  if (stats.totalFilms === 0) return { skipped: true };

  const signature = hashString(JSON.stringify({ stats, films, ratingScale }));
  if (readStorage(STATS_SIGNATURE_KEY) === signature) return { unchanged: true };

  const result = await call('stats', { stats, films });
  if (!result.skipped) writeStorage(STATS_SIGNATURE_KEY, signature);
  return result;
}

/**
 * Envoie mes 10 dernières séances notées ET mon instantané de statistiques (idempotent côté serveur).
 * Des empreintes locales évitent tout appel réseau tant que rien n'a changé.
 * (Le nom est conservé pour ne pas toucher aux appels existants dans App.jsx et Community.jsx.)
 */
export async function syncActivity(historyData, ratingScale) {
  if (!readStorage(ENABLED_KEY)) return { skipped: true };

  const [activity, stats] = await Promise.allSettled([
    pushActivity(historyData, ratingScale),
    pushStats(historyData, ratingScale),
  ]);
  if (stats.status === 'rejected') console.warn('Synchronisation des stats impossible :', stats.reason);
  if (activity.status === 'rejected') throw activity.reason;
  return activity.value;
}