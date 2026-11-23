import { addNoStoreHeaders, isTrustedPopupPost } from '../../server/oauth.js';
import {
  db,
  formatFriendCode,
  getOrCreateProfile,
  normalizeFriendCode,
  requireUser,
} from '../../server/community.js';

const MAX_NAME_LENGTH = 40;

// Jamais de google_sub ni d'e-mail côté client : le code ami sert d'identifiant public.
const toPublic = (row) => ({
  friendCode: formatFriendCode(row.friend_code),
  displayName: row.display_name || '',
  avatarUrl: row.avatar_url || null,
});

const cleanAvatarUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && value.length <= 500 ? url.toString() : null;
  } catch {
    return null;
  }
};

/* POST /api/community/me
   Renvoie (et crée si besoin) mon profil + mon code ami.
   Body optionnel : { displayName, avatarUrl } pour synchroniser depuis les préférences. */
async function me(account, body, res) {
  const sql = db();
  let profile = await getOrCreateProfile(account);

  const name = typeof body.displayName === 'string'
    ? body.displayName.trim().slice(0, MAX_NAME_LENGTH)
    : '';
  const avatarProvided = typeof body.avatarUrl === 'string';
  const avatar = avatarProvided && body.avatarUrl.trim() ? cleanAvatarUrl(body.avatarUrl.trim()) : null;
  const touchAvatar = avatarProvided && (body.avatarUrl.trim() === '' || avatar !== null);

  if (name || touchAvatar) {
    const rows = await sql`
      UPDATE community_profiles
      SET display_name = COALESCE(${name || null}::text, display_name),
          avatar_url   = CASE WHEN ${touchAvatar}::boolean THEN ${avatar}::text ELSE avatar_url END
      WHERE google_sub = ${account.google_sub}
      RETURNING friend_code, display_name, avatar_url`;
    if (rows[0]) profile = rows[0];
  }

  return res.status(200).json({ profile: toPublic(profile) });
}

/* POST /api/community/add   Body : { code } */
async function add(account, body, res) {
  const sql = db();
  const code = normalizeFriendCode(body.code);
  if (code.length !== 8) return res.status(400).json({ error: 'Code ami invalide.' });

  const rows = await sql`
    SELECT google_sub, friend_code, display_name, avatar_url
    FROM community_profiles WHERE friend_code = ${code}`;
  const friend = rows[0];
  if (!friend) return res.status(404).json({ error: 'Aucun profil ne correspond à ce code.' });
  if (friend.google_sub === account.google_sub) {
    return res.status(400).json({ error: 'Ceci est ton propre code.' });
  }

  // LEAST/GREATEST : l'ordre est décidé par Postgres, cohérent avec CHECK (user_a < user_b)
  const inserted = await sql`
    INSERT INTO friendships (user_a, user_b)
    VALUES (LEAST(${account.google_sub}::text, ${friend.google_sub}::text),
            GREATEST(${account.google_sub}::text, ${friend.google_sub}::text))
    ON CONFLICT DO NOTHING
    RETURNING user_a`;

  return res.status(200).json({
    friend: toPublic(friend),
    alreadyFriends: inserted.length === 0,
  });
}

/* POST /api/community/list */
async function list(account, _body, res) {
  const sql = db();
  const rows = await sql`
    SELECT p.friend_code, p.display_name, p.avatar_url, f.created_at
    FROM friendships f
    JOIN community_profiles p
      ON p.google_sub = CASE WHEN f.user_a = ${account.google_sub} THEN f.user_b ELSE f.user_a END
    WHERE f.user_a = ${account.google_sub} OR f.user_b = ${account.google_sub}
    ORDER BY f.created_at DESC`;

  return res.status(200).json({
    friends: rows.map((row) => ({ ...toPublic(row), since: row.created_at })),
  });
}

/* POST /api/community/remove   Body : { friendCode } */
async function remove(account, body, res) {
  const sql = db();
  const code = normalizeFriendCode(body.friendCode);
  if (code.length !== 8) return res.status(400).json({ error: 'Code ami invalide.' });

  await sql`
    DELETE FROM friendships
    WHERE (user_a = ${account.google_sub}
           AND user_b = (SELECT google_sub FROM community_profiles WHERE friend_code = ${code}))
       OR (user_b = ${account.google_sub}
           AND user_a = (SELECT google_sub FROM community_profiles WHERE friend_code = ${code}))`;

  return res.status(200).json({ ok: true });
}

const MAX_ACTIVITY_ITEMS = 20;
const FEED_LIMIT = 30;

const text = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

// Partagés : titre, note, échelle, genre, affiche, TMDB ID, coup de cœur, date et commentaire.
// Dépense, siège, « Capucines » restent privés.
function cleanActivityItem(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const title = text(raw.title, 200);
  const sessionKey = text(raw.sessionKey, 300);
  const rating = Number(raw.rating);
  const ratingScale = Number(raw.ratingScale);
  if (!title || !sessionKey || ![5, 10].includes(ratingScale)) return null;
  if (!Number.isFinite(rating) || rating < 0 || rating > ratingScale) return null;

  const watchedOn = /^\d{4}-\d{2}-\d{2}$/.test(raw.watchedOn || '') ? raw.watchedOn : null;
  return {
    title,
    sessionKey,
    rating,
    ratingScale,
    genre: text(raw.genre, 60) || null,
    poster: typeof raw.poster === 'string' && raw.poster ? cleanAvatarUrl(raw.poster) : null,
    tmdbId: text(String(raw.tmdbId ?? ''), 20) || null,
    coupDeCoeur: raw.coupDeCoeur === true,
    watchedOn,
    comment: text(raw.comment, 1000) || null,
  };
}

/* POST /api/community/activity   Body : { items: [...] }
   Enregistre (ou met à jour) mes dernières séances. Ignoré tant que je n'ai pas de profil communautaire. */
async function activity(account, body, res) {
  const sql = db();
  const profile = await sql`SELECT 1 FROM community_profiles WHERE google_sub = ${account.google_sub}`;
  if (!profile[0]) return res.status(200).json({ skipped: true });

  const items = (Array.isArray(body.items) ? body.items : [])
    .slice(0, MAX_ACTIVITY_ITEMS)
    .map(cleanActivityItem)
    .filter(Boolean);
  if (items.length === 0) return res.status(200).json({ saved: 0 });

  await sql.transaction(
    items.map((it) => sql`
      INSERT INTO community_activity
        (google_sub, session_key, movie_title, rating, rating_scale, genre, poster_url, tmdb_id, coup_de_coeur, watched_on, comment)
      VALUES
        (${account.google_sub}, ${it.sessionKey}, ${it.title}, ${it.rating}::numeric, ${it.ratingScale}::smallint,
         ${it.genre}::text, ${it.poster}::text, ${it.tmdbId}::text, ${it.coupDeCoeur}::boolean, ${it.watchedOn}::date,
         ${it.comment}::text)
      ON CONFLICT (google_sub, session_key) DO UPDATE SET
        movie_title   = EXCLUDED.movie_title,
        rating        = EXCLUDED.rating,
        rating_scale  = EXCLUDED.rating_scale,
        genre         = EXCLUDED.genre,
        poster_url    = EXCLUDED.poster_url,
        tmdb_id       = EXCLUDED.tmdb_id,
        coup_de_coeur = EXCLUDED.coup_de_coeur,
        watched_on    = EXCLUDED.watched_on,
        comment       = EXCLUDED.comment`)
  );

  return res.status(200).json({ saved: items.length });
}

/* POST /api/community/feed
   Dernières séances de mes amis (jamais les miennes). */
async function feed(account, _body, res) {
  const sql = db();
  const rows = await sql`
    SELECT a.movie_title, a.rating, a.rating_scale, a.genre, a.poster_url, a.tmdb_id, a.coup_de_coeur, a.comment,
           to_char(a.watched_on, 'YYYY-MM-DD') AS watched_on,
           p.friend_code, p.display_name, p.avatar_url
    FROM community_activity a
    JOIN community_profiles p ON p.google_sub = a.google_sub
    JOIN friendships f
      ON (f.user_a = ${account.google_sub} AND f.user_b = a.google_sub)
      OR (f.user_b = ${account.google_sub} AND f.user_a = a.google_sub)
    ORDER BY COALESCE(a.watched_on, a.created_at::date) DESC, a.created_at DESC
    LIMIT ${FEED_LIMIT}`;

  return res.status(200).json({
    items: rows.map((row) => ({
      friend: toPublic(row),
      title: row.movie_title,
      rating: Number(row.rating),
      ratingScale: Number(row.rating_scale),
      genre: row.genre || null,
      poster: row.poster_url || null,
      tmdbId: row.tmdb_id || null,
      coupDeCoeur: row.coup_de_coeur,
      watchedOn: row.watched_on || null,
      comment: row.comment || null,
    })),
  });
}

const ACTIONS = { me, add, list, remove, activity, feed };

export default async function handler(req, res) {
  addNoStoreHeaders(res);
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Méthode non autorisée.' });
  }
  if (!isTrustedPopupPost(req)) {
    return res.status(403).json({ error: 'Origine non autorisée.' });
  }

  const action = String(req.query?.action || '');
  if (!Object.hasOwn(ACTIONS, action)) {
    return res.status(404).json({ error: 'Action inconnue.' });
  }

  try {
    const account = await requireUser(req, res);
    if (!account) return;
    return await ACTIONS[action](account, req.body || {}, res);
  } catch (error) {
    console.error(`Erreur communauté (${action}) :`, error.message);
    return res.status(500).json({ error: 'Erreur du serveur communautaire.' });
  }
}