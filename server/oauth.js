import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { neon } from '@neondatabase/serverless';

const SESSION_COOKIE = 'cine_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
let sqlClient;
let schemaReady;

function getSql() {
  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!connectionString) throw new Error('POSTGRES_URL n’est pas configurée sur le serveur.');
  if (!sqlClient) sqlClient = neon(connectionString);
  return sqlClient;
}

export async function ensureOAuthSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      const sql = getSql();
      await sql`
        CREATE TABLE IF NOT EXISTS oauth_accounts (
          google_sub TEXT PRIMARY KEY,
          email TEXT,
          given_name TEXT,
          refresh_token_cipher TEXT,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS oauth_sessions (
          session_hash TEXT PRIMARY KEY,
          google_sub TEXT NOT NULL REFERENCES oauth_accounts(google_sub) ON DELETE CASCADE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          expires_at TIMESTAMPTZ NOT NULL
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS oauth_sessions_expires_at_idx ON oauth_sessions(expires_at)`;
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  await schemaReady;
}

function getEncryptionKey() {
  const value = process.env.OAUTH_TOKEN_ENCRYPTION_KEY || '';
  if (!/^[a-f\d]{64}$/i.test(value)) {
    throw new Error('OAUTH_TOKEN_ENCRYPTION_KEY doit contenir 64 caractères hexadécimaux.');
  }
  return Buffer.from(value, 'hex');
}

export function encryptRefreshToken(token) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, encrypted].map((part) => part.toString('base64url')).join('.');
}

export function decryptRefreshToken(payload) {
  const [ivValue, tagValue, encryptedValue] = String(payload || '').split('.');
  if (!ivValue || !tagValue || !encryptedValue) throw new Error('Jeton chiffré invalide.');
  const decipher = createDecipheriv(
    'aes-256-gcm',
    getEncryptionKey(),
    Buffer.from(ivValue, 'base64url'),
  );
  decipher.setAuthTag(Buffer.from(tagValue, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}

export const hashSessionToken = (token) =>
  createHash('sha256').update(token).digest('hex');

export function getSessionToken(req) {
  const cookies = String(req.headers.cookie || '').split(';');
  const cookie = cookies.map((entry) => entry.trim()).find((entry) => entry.startsWith(`${SESSION_COOKIE}=`));
  return cookie ? decodeURIComponent(cookie.slice(SESSION_COOKIE.length + 1)) : '';
}

function isSecureRequest(req) {
  return process.env.VERCEL === '1'
    || String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim() === 'https';
}

export function setSessionCookie(res, token, req) {
  const secure = isSecureRequest(req);
  const securePart = secure ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}${securePart}`);
}

export function clearSessionCookie(res, req) {
  const securePart = isSecureRequest(req) ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${securePart}`);
}

export function getRequestOrigin(req) {
  const origin = req.headers.origin;
  const forwardedHost = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
  if (!origin || !forwardedHost) return null;
  try {
    const parsed = new URL(origin);
    if (parsed.host.toLowerCase() !== forwardedHost.toLowerCase()) return null;
    if (parsed.protocol !== 'https:' && parsed.hostname !== 'localhost' && parsed.hostname !== '127.0.0.1') return null;
    return parsed.origin;
  } catch {
    return null;
  }
}

export function isTrustedPopupPost(req) {
  return req.headers['x-requested-with'] === 'XmlHttpRequest' && Boolean(getRequestOrigin(req));
}

export function addNoStoreHeaders(res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Vary', 'Cookie');
}

export function getOAuthClientId() {
  return process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
}

export function getOAuthClientSecret() {
  return process.env.GOOGLE_CLIENT_SECRET;
}

export async function exchangeAuthorizationCode(code, origin) {
  const clientId = getOAuthClientId();
  const clientSecret = getOAuthClientSecret();
  if (!clientId || !clientSecret) throw new Error('La configuration du client OAuth serveur est incomplète.');

  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: origin,
    grant_type: 'authorization_code',
  });
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error('Échange de code OAuth Google refusé :', payload.error || response.status);
    throw new Error('Google n’a pas accepté la connexion. Réessaie depuis le bouton de connexion.');
  }
  return payload;
}

export async function fetchGoogleProfile(accessToken) {
  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error('Impossible de récupérer le profil Google.');
  return response.json();
}

export async function refreshGoogleAccessToken(refreshToken) {
  const clientId = getOAuthClientId();
  const clientSecret = getOAuthClientSecret();
  if (!clientId || !clientSecret) throw new Error('La configuration du client OAuth serveur est incomplète.');

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error('La session Google doit être réautorisée.');
    error.oauthError = payload.error;
    throw error;
  }
  return payload;
}

export async function storeOAuthSession({ sessionToken, googleSub, email, givenName, refreshToken }) {
  const sql = getSql();
  const refreshTokenCipher = refreshToken ? encryptRefreshToken(refreshToken) : null;

  await sql`
    INSERT INTO oauth_accounts (google_sub, email, given_name, refresh_token_cipher, updated_at)
    VALUES (${googleSub}, ${email || null}, ${givenName || null}, ${refreshTokenCipher}, NOW())
    ON CONFLICT (google_sub) DO UPDATE SET
      email = EXCLUDED.email,
      given_name = EXCLUDED.given_name,
      refresh_token_cipher = COALESCE(EXCLUDED.refresh_token_cipher, oauth_accounts.refresh_token_cipher),
      updated_at = NOW()
  `;

  const [account] = await sql`
    SELECT refresh_token_cipher FROM oauth_accounts WHERE google_sub = ${googleSub} LIMIT 1
  `;
  if (!account?.refresh_token_cipher) {
    throw new Error('Google n’a pas fourni de jeton de renouvellement. Révoque une fois l’accès Notation Ciné dans ton compte Google, puis reconnecte-toi.');
  }

  await sql`
    INSERT INTO oauth_sessions (session_hash, google_sub, expires_at)
    VALUES (${hashSessionToken(sessionToken)}, ${googleSub}, NOW() + (${SESSION_TTL_SECONDS} * INTERVAL '1 second'))
    ON CONFLICT (session_hash) DO UPDATE SET
      google_sub = EXCLUDED.google_sub,
      last_used_at = NOW(),
      expires_at = EXCLUDED.expires_at
  `;
}

export async function getAccountForSession(sessionToken) {
  const sql = getSql();
  const [row] = await sql`
    SELECT a.google_sub, a.email, a.given_name, a.refresh_token_cipher
    FROM oauth_sessions s
    JOIN oauth_accounts a ON a.google_sub = s.google_sub
    WHERE s.session_hash = ${hashSessionToken(sessionToken)} AND s.expires_at > NOW()
    LIMIT 1
  `;
  return row || null;
}

export async function touchSession(sessionToken) {
  const sql = getSql();
  await sql`
    UPDATE oauth_sessions
    SET last_used_at = NOW(), expires_at = NOW() + (${SESSION_TTL_SECONDS} * INTERVAL '1 second')
    WHERE session_hash = ${hashSessionToken(sessionToken)}
  `;
}

export async function deleteSession(sessionToken) {
  if (!sessionToken) return;
  const sql = getSql();
  await sql`DELETE FROM oauth_sessions WHERE session_hash = ${hashSessionToken(sessionToken)}`;
}

export async function deleteAccountAndSessions(googleSub) {
  if (!googleSub) return;
  const sql = getSql();
  await sql`DELETE FROM oauth_accounts WHERE google_sub = ${googleSub}`;
}

export function createSessionToken() {
  return randomBytes(32).toString('base64url');
}

export async function revokeGoogleToken(token) {
  if (!token) return;
  try {
    await fetch('https://oauth2.googleapis.com/revoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ token }),
    });
  } catch (error) {
    console.error('Révocation Google non confirmée :', error);
  }
}

export { SESSION_COOKIE, SESSION_TTL_SECONDS };
