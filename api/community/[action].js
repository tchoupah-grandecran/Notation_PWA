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
        poster_url    = COALESCE(EXCLUDED.poster_url, community_activity.poster_url),
        tmdb_id       = COALESCE(EXCLUDED.tmdb_id, community_activity.tmdb_id),
        coup_de_coeur = EXCLUDED.coup_de_coeur,
        watched_on    = EXCLUDED.watched_on,
        comment       = EXCLUDED.comment`)
  );

  return res.status(200).json({ saved: items.length });
}

const emptyReactions = () => ({ like: [], dislike: [], watch: [] });

const reactorFrom = (row, mine = false) => ({
  friendCode: formatFriendCode(row.friend_code),
  displayName: row.display_name || '',
  avatarUrl: row.avatar_url || null,
  mine,
});

/* POST /api/community/feed
   Dernières séances de mes amis, avec les réactions visibles (les miennes + celles de mes amis),
   et les réactions reçues sur MES séances (`myReactions`, rattachées par session_key). */
async function feed(account, _body, res) {
  const sql = db();
  const me = account.google_sub;

  const rows = await sql`
    SELECT a.id, a.movie_title, a.rating, a.rating_scale, a.genre, a.poster_url, a.tmdb_id, a.coup_de_coeur, a.comment,
           to_char(a.watched_on, 'YYYY-MM-DD') AS watched_on,
           p.friend_code, p.display_name, p.avatar_url
    FROM community_activity a
    JOIN community_profiles p ON p.google_sub = a.google_sub
    JOIN friendships f
      ON (f.user_a = ${me} AND f.user_b = a.google_sub)
      OR (f.user_b = ${me} AND f.user_a = a.google_sub)
    ORDER BY COALESCE(a.watched_on, a.created_at::date) DESC, a.created_at DESC
    LIMIT 30`;

  // Réactions : secondaires, une erreur ici ne doit pas casser le fil
  const reactionsById = new Map();
  let myRows = [];
  try {
    if (rows.length > 0) {
      const ids = JSON.stringify(rows.map((row) => String(row.id)));
      const reactionRows = await sql`
        SELECT r.activity_id, r.kind, (r.reactor_sub = ${me}) AS is_me,
               p.friend_code, p.display_name, p.avatar_url
        FROM community_reactions r
        JOIN community_profiles p ON p.google_sub = r.reactor_sub
        WHERE r.activity_id IN (SELECT value::bigint FROM jsonb_array_elements_text(${ids}::jsonb))
          AND (r.reactor_sub = ${me} OR EXISTS (
            SELECT 1 FROM friendships f
            WHERE (f.user_a = ${me} AND f.user_b = r.reactor_sub)
               OR (f.user_b = ${me} AND f.user_a = r.reactor_sub)))
        ORDER BY r.created_at`;
      for (const row of reactionRows) {
        const key = String(row.activity_id);
        if (!reactionsById.has(key)) reactionsById.set(key, emptyReactions());
        reactionsById.get(key)[row.kind]?.push(reactorFrom(row, row.is_me));
      }
    }

    myRows = await sql`
      SELECT a.session_key, r.kind, p.friend_code, p.display_name, p.avatar_url
      FROM community_activity a
      JOIN community_reactions r ON r.activity_id = a.id
      JOIN community_profiles p ON p.google_sub = r.reactor_sub
      WHERE a.google_sub = ${me}
        AND EXISTS (
          SELECT 1 FROM friendships f
          WHERE (f.user_a = ${me} AND f.user_b = r.reactor_sub)
             OR (f.user_b = ${me} AND f.user_a = r.reactor_sub))
      ORDER BY r.created_at DESC
      LIMIT 300`;
  } catch (error) {
    console.error('Réactions indisponibles (table manquante ?) :', error.message);
  }

  return res.status(200).json({
    items: rows.map((row) => ({
      id: String(row.id),
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
      reactions: reactionsById.get(String(row.id)) || emptyReactions(),
    })),
    myReactions: myRows.map((row) => ({
      sessionKey: row.session_key,
      kind: row.kind,
      reactor: reactorFrom(row),
    })),
  });
}

const REACTION_KINDS = ['like', 'dislike', 'watch'];
const OPPOSITE = { like: 'dislike', dislike: 'like' };
const MAX_REACT_TARGETS = 20;

/* POST /api/community/react   Body : { activityIds: [...], kind, active }   (ou { activityId } pour une seule séance)
   Pose ou retire ma réaction sur une ou plusieurs séances d'amis (= un post). 👍 et 👎 s'excluent ; 🍿 est indépendant. */
async function react(account, body, res) {
  const sql = db();
  const me = account.google_sub;
  const kind = body.kind;
  const ids = [...new Set((Array.isArray(body.activityIds) ? body.activityIds : [body.activityId]).map((id) => String(id ?? '')))];

  if (
    ids.length === 0 ||
    ids.length > MAX_REACT_TARGETS ||
    !ids.every((id) => /^\d{1,18}$/.test(id)) ||
    !REACTION_KINDS.includes(kind)
  ) {
    return res.status(400).json({ error: 'Réaction invalide.' });
  }

  // On ne peut réagir qu'aux séances de ses amis ; les autres identifiants sont ignorés
  const targets = await sql`
    SELECT a.id
    FROM community_activity a
    JOIN friendships f
      ON (f.user_a = ${me} AND f.user_b = a.google_sub)
      OR (f.user_b = ${me} AND f.user_a = a.google_sub)
    WHERE a.id IN (SELECT value::bigint FROM jsonb_array_elements_text(${JSON.stringify(ids)}::jsonb))`;
  if (targets.length === 0) return res.status(404).json({ error: 'Publication introuvable.' });
  const allowed = targets.map((row) => String(row.id));
  const allowedJson = JSON.stringify(allowed);

  if (body.active === false) {
    await sql`
      DELETE FROM community_reactions
      WHERE reactor_sub = ${me} AND kind = ${kind}
        AND activity_id IN (SELECT value::bigint FROM jsonb_array_elements_text(${allowedJson}::jsonb))`;
  } else {
    const queries = [];
    if (OPPOSITE[kind]) {
      queries.push(sql`
        DELETE FROM community_reactions
        WHERE reactor_sub = ${me} AND kind = ${OPPOSITE[kind]}
          AND activity_id IN (SELECT value::bigint FROM jsonb_array_elements_text(${allowedJson}::jsonb))`);
    }
    for (const id of allowed) {
      queries.push(sql`
        INSERT INTO community_reactions (activity_id, reactor_sub, kind)
        VALUES (${id}::bigint, ${me}, ${kind})
        ON CONFLICT DO NOTHING`);
    }
    await sql.transaction(queries);
  }

  return res.status(200).json({ ok: true });
}

const MAX_FILMS = 3000;

const toInt = (value, max) => {
  const n = Math.trunc(Number(value));
  return Number.isFinite(n) && n >= 0 ? Math.min(n, max) : 0;
};

const toRatio = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 && n <= 1 ? Math.round(n * 1000) / 1000 : null;
};

function cleanCounts(raw, maxEntries, keyOk) {
  const out = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [key, value] of Object.entries(raw).slice(0, maxEntries)) {
    if (key === '__proto__' || !keyOk(key)) continue;
    out[key] = toInt(value, 100000);
  }
  return out;
}

/* POST /api/community/stats   Body : { stats, films }
   Enregistre mon instantané de statistiques. Ignoré tant que je n'ai pas de profil communautaire. */
async function stats(account, body, res) {
  const sql = db();
  const profile = await sql`SELECT 1 FROM community_profiles WHERE google_sub = ${account.google_sub}`;
  if (!profile[0]) return res.status(200).json({ skipped: true });

  const raw = body.stats && typeof body.stats === 'object' ? body.stats : {};
  const cleanStats = {
    totalFilms: toInt(raw.totalFilms, 100000),
    ratedFilms: toInt(raw.ratedFilms, 100000),
    avgRatio: toRatio(raw.avgRatio),
    coupsDeCoeur: toInt(raw.coupsDeCoeur, 100000),
    totalMinutes: toInt(raw.totalMinutes, 10_000_000),
    genres: cleanCounts(raw.genres, 40, (key) => key.length <= 60),
    byYear: cleanCounts(raw.byYear, 60, (key) => /^\d{4}$/.test(key)),
  };

  const films = (Array.isArray(body.films) ? body.films : [])
    .slice(0, MAX_FILMS)
    .map((film) => {
      const title = text(film?.t, 200);
      const normalized = text(film?.n, 120);
      const ratio = toRatio(film?.r);
      if (!title || !normalized || ratio === null) return null;
      return { k: text(film.k, 40) || null, n: normalized, t: title, r: ratio, h: film.h === true };
    })
    .filter(Boolean);

  await sql`
    INSERT INTO community_stats (google_sub, stats, films, updated_at)
    VALUES (${account.google_sub}, ${JSON.stringify(cleanStats)}::jsonb, ${JSON.stringify(films)}::jsonb, now())
    ON CONFLICT (google_sub) DO UPDATE SET
      stats = EXCLUDED.stats,
      films = EXCLUDED.films,
      updated_at = now()`;

  return res.status(200).json({ saved: true });
}

/* POST /api/community/compare   Body : { friendCode }
   Statistiques d'un ami + films vus par nous deux (avec les deux notes). */
async function compare(account, body, res) {
  const sql = db();
  const code = normalizeFriendCode(body.friendCode);
  if (code.length !== 8) return res.status(400).json({ error: 'Code ami invalide.' });

  const friends = await sql`
    SELECT p.google_sub, p.friend_code, p.display_name, p.avatar_url
    FROM community_profiles p
    JOIN friendships f
      ON (f.user_a = ${account.google_sub} AND f.user_b = p.google_sub)
      OR (f.user_b = ${account.google_sub} AND f.user_a = p.google_sub)
    WHERE p.friend_code = ${code}`;
  const friend = friends[0];
  if (!friend) return res.status(404).json({ error: 'Cet ami est introuvable dans ta liste.' });

  const rows = await sql`
    SELECT google_sub, stats, films, updated_at
    FROM community_stats
    WHERE google_sub = ${account.google_sub} OR google_sub = ${friend.google_sub}`;
  const mine = rows.find((row) => row.google_sub === account.google_sub);
  const theirs = rows.find((row) => row.google_sub === friend.google_sub);

  // Intersection : on associe par identifiant TMDB, à défaut par titre normalisé
  const theirByKey = new Map();
  const theirByName = new Map();
  for (const film of theirs?.films || []) {
    if (film.k) theirByKey.set(film.k, film);
    theirByName.set(film.n, film);
  }
  const common = [];
  for (const film of mine?.films || []) {
    const match = (film.k && theirByKey.get(film.k)) || theirByName.get(film.n);
    if (match) {
      common.push({
        title: film.t,
        mine: film.r,
        theirs: match.r,
        mineHeart: film.h === true,
        theirsHeart: match.h === true,
      });
    }
  }

  return res.status(200).json({
    friend: toPublic(friend),
    stats: theirs?.stats || null,
    updatedAt: theirs?.updated_at || null,
    common: common.slice(0, 200),
  });
}

const ACTIONS = { me, add, list, remove, activity, feed, stats, compare, react };

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