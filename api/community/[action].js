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

const ACTIONS = { me, add, list, remove };

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