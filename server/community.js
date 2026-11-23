import { neon } from '@neondatabase/serverless';
import { randomInt } from 'node:crypto';
import { ensureOAuthSchema, getAccountForSession, getSessionToken } from './oauth.js';

// ─── Connexion Neon (créée à la demande) ─────────────────────────────
let client;
export function db() {
  if (!client) {
    const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!url) throw new Error('Variable DATABASE_URL manquante.');
    client = neon(url);
  }
  return client;
}

// ─── Schéma ──────────────────────────────────────────────────────────
// Volontairement SANS clé étrangère vers oauth_accounts : /api/auth/logout
// supprime la ligne du compte, ce qui effacerait amis et activité en cascade.
let schemaReady;
export function ensureCommunitySchema() {
  if (!schemaReady) {
    const sql = db();
    schemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS community_profiles (
          google_sub   text PRIMARY KEY,
          friend_code  text NOT NULL UNIQUE,
          display_name text NOT NULL DEFAULT '',
          avatar_url   text,
          created_at   timestamptz NOT NULL DEFAULT now()
        )`;
      await sql`
        CREATE TABLE IF NOT EXISTS friendships (
          user_a     text NOT NULL,
          user_b     text NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now(),
          PRIMARY KEY (user_a, user_b),
          CHECK (user_a < user_b)
        )`;
      await sql`CREATE INDEX IF NOT EXISTS friendships_user_b_idx ON friendships (user_b)`;
      // Notes partagées avec les amis. session_key = « titre|date|heure » : une ligne par séance.
      await sql`
        CREATE TABLE IF NOT EXISTS community_activity (
          id            bigserial PRIMARY KEY,
          google_sub    text NOT NULL,
          session_key   text NOT NULL,
          movie_title   text NOT NULL,
          rating        numeric(4,1) NOT NULL,
          rating_scale  smallint NOT NULL,
          genre         text,
          poster_url    text,
          tmdb_id       text,
          coup_de_coeur boolean NOT NULL DEFAULT false,
          watched_on    date,
          created_at    timestamptz NOT NULL DEFAULT now(),
          UNIQUE (google_sub, session_key)
        )`;
    })().catch((err) => {
      schemaReady = undefined;
      throw err;
    });
  }
  return schemaReady;
}

// ─── Codes ami ───────────────────────────────────────────────────────
// 8 caractères sans ambiguïté (pas de 0/O, 1/I/L), affichés « K7M2-9QXA ».
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

const generateCode = () =>
  Array.from({ length: 8 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');

export const normalizeFriendCode = (input) =>
  String(input || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

export const formatFriendCode = (code = '') => `${code.slice(0, 4)}-${code.slice(4)}`;

// ─── Profil communautaire ────────────────────────────────────────────
export async function getOrCreateProfile(account) {
  const sql = db();
  const select = () => sql`
    SELECT friend_code, display_name, avatar_url
    FROM community_profiles WHERE google_sub = ${account.google_sub}`;

  const existing = await select();
  if (existing[0]) return existing[0];

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const rows = await sql`
      INSERT INTO community_profiles (google_sub, friend_code, display_name)
      VALUES (${account.google_sub}, ${generateCode()}, ${account.given_name || ''})
      ON CONFLICT DO NOTHING
      RETURNING friend_code, display_name, avatar_url`;
    if (rows[0]) return rows[0];
    // Conflit : profil créé entre-temps (course) ou code déjà pris → on relit
    const again = await select();
    if (again[0]) return again[0];
  }
  throw new Error('Impossible de générer un code ami.');
}

// ─── Garde d'authentification (cookie de session existant) ───────────
// Renvoie le compte ({ google_sub, given_name, ... }) ou répond 401 et renvoie null.
export async function requireUser(req, res) {
  const sessionToken = getSessionToken(req);
  if (!sessionToken) {
    res.status(401).json({ error: 'Session absente.' });
    return null;
  }
  await ensureOAuthSchema();
  const account = await getAccountForSession(sessionToken);
  if (!account) {
    res.status(401).json({ error: 'Session expirée.' });
    return null;
  }
  await ensureCommunitySchema();
  return account;
}