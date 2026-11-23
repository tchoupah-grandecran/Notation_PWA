const HEADERS = {
  'Content-Type': 'application/json',
  'X-Requested-With': 'XmlHttpRequest',
};

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
export const getMyCommunityProfile = (profile = {}) => call('me', profile);

/** Ajoute un ami via son code. → { friend, alreadyFriends } */
export const addFriendByCode = (code) => call('add', { code });

/** Liste mes amis. → { friends: [{ friendCode, displayName, avatarUrl, since }] } */
export const listFriends = () => call('list');

/** Retire un ami. */
export const removeFriend = (friendCode) => call('remove', { friendCode });