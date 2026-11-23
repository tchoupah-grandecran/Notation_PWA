import { useCallback, useEffect, useState } from 'react';
import { Check, Copy, Heart, Share2, UserPlus, X } from 'lucide-react';
import { Avatar3D } from '../components/Avatar3D';
import {
  addFriendByCode,
  getFeed,
  getMyCommunityProfile,
  listFriends,
  removeFriend,
  syncActivity,
} from '../communityApi';

const ACTION_STYLE = {
  background: 'linear-gradient(var(--theme-action-bg), var(--theme-action-bg)) padding-box, var(--theme-accent-gradient) border-box',
  color: 'var(--theme-action-ink)',
};

const SectionLabel = ({ children }) => (
  <h3 className="font-outfit text-[10px] font-black uppercase tracking-[0.2em] opacity-30 ml-5 mb-2">
    {children}
  </h3>
);

const formatRating = (rating, scale) => `${String(rating).replace('.', ',')}/${scale}`;

const formatWatched = (iso) => {
  if (!iso) return '';
  const date = new Date(`${iso}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((today - date) / 86_400_000);
  if (days <= 0) return 'Aujourd’hui';
  if (days === 1) return 'Hier';
  if (days < 7) return `Il y a ${days} jours`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

function FriendAvatar({ name, url, size = 40 }) {
  if (url) {
    return (
      <div className="shrink-0">
        <Avatar3D src={url} size={size} primary="transparent" borderWidth={0} />
      </div>
    );
  }
  return (
    <span
      aria-hidden="true"
      className="flex shrink-0 items-center justify-center rounded-full font-galinoy text-lg italic"
      style={{
        width: size,
        height: size,
        background: 'color-mix(in srgb, var(--theme-accent) 18%, transparent)',
        color: 'var(--theme-accent)',
      }}
    >
      {(name || '?').trim().charAt(0).toUpperCase()}
    </span>
  );
}

function FeedItem({ item }) {
  const name = item.friend.displayName || 'Un ami';
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      {item.poster ? (
        <img
          src={item.poster}
          alt=""
          loading="lazy"
          className="h-[72px] w-12 shrink-0 rounded-md object-cover"
        />
      ) : (
        <div
          aria-hidden="true"
          className="h-[72px] w-12 shrink-0 rounded-md"
          style={{ background: 'color-mix(in srgb, var(--theme-text) 8%, transparent)' }}
        />
      )}
      <div className="min-w-0 flex-1 text-left">
        <p className="truncate font-outfit text-[12px] text-[var(--theme-text-secondary)]">
          <span className="font-bold text-[var(--theme-text)]">{name}</span> a vu
        </p>
        <p className="truncate font-galinoy text-[19px] italic leading-tight text-[var(--theme-text)]">
          {item.title}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 font-outfit text-[11px] text-[var(--theme-text-secondary)]">
          <span
            className="rounded-full border px-2 py-0.5 text-[10px] font-black"
            style={{ borderColor: 'var(--theme-accent)', color: 'var(--theme-accent)' }}
          >
            {formatRating(item.rating, item.ratingScale)}
          </span>
          {item.coupDeCoeur && (
            <Heart
              size={13}
              fill="currentColor"
              aria-label="Coup de cœur"
              style={{ color: 'var(--theme-accent)' }}
            />
          )}
          {item.genre && <span>{item.genre}</span>}
          {item.watchedOn && <span>· {formatWatched(item.watchedOn)}</span>}
        </div>
      </div>
    </li>
  );
}

export function Community({ userName, userAvatar, historyData, ratingScale }) {
  const [me, setMe] = useState(null);
  const [friends, setFriends] = useState([]);
  const [feed, setFeed] = useState(null); // null = chargement
  const [feedError, setFeedError] = useState(false);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [loadError, setLoadError] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [adding, setAdding] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'ok' | 'error', text }
  const [copied, setCopied] = useState(false);

  const loadFeed = useCallback(async () => {
    setFeedError(false);
    try {
      const { items } = await getFeed();
      setFeed(items);
    } catch (err) {
      console.error('Erreur fil d’actualité :', err);
      setFeed([]);
      setFeedError(true);
    }
  }, []);

  const load = useCallback(async () => {
    setStatus((current) => (current === 'ready' ? current : 'loading'));
    setLoadError('');
    try {
      const [{ profile }, { friends: list }] = await Promise.all([
        // Synchronise le pseudo et l'avatar choisis dans Profil vers le profil partagé
        getMyCommunityProfile({
          displayName: userName || undefined,
          avatarUrl: userAvatar || undefined,
        }),
        listFriends(),
      ]);
      setMe(profile);
      setFriends(list);
      setStatus('ready');
    } catch (err) {
      console.error('Erreur communauté :', err);
      setLoadError(err.message || 'Impossible de charger la communauté.');
      setStatus('error');
    }
  }, [userName, userAvatar]);

  useEffect(() => {
    void load();
  }, [load]);

  // Une fois le profil prêt : j'envoie mes dernières séances, puis je charge le fil
  useEffect(() => {
    if (status !== 'ready') return;
    let cancelled = false;
    (async () => {
      try {
        await syncActivity(historyData, ratingScale);
      } catch (err) {
        console.warn('Synchronisation des séances impossible :', err);
      }
      if (!cancelled) await loadFeed();
    })();
    return () => {
      cancelled = true;
    };
  }, [status, historyData, ratingScale, loadFeed]);

  const copyCode = async () => {
    if (!me) return;
    try {
      await navigator.clipboard.writeText(me.friendCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* presse-papiers indisponible */
    }
  };

  const shareCode = async () => {
    if (!me) return;
    try {
      await navigator.share({ text: `Rejoins-moi sur Grand Écran ! Mon code ami : ${me.friendCode}` });
    } catch {
      /* partage annulé */
    }
  };

  const handleAdd = async (event) => {
    event.preventDefault();
    if (!codeInput.trim() || adding) return;
    setAdding(true);
    setFeedback(null);
    try {
      const { friend, alreadyFriends } = await addFriendByCode(codeInput);
      const name = friend.displayName || 'Cet ami';
      setFeedback({
        type: 'ok',
        text: alreadyFriends ? `${name} est déjà dans ta liste.` : `${name} a été ajouté !`,
      });
      setCodeInput('');
      const { friends: list } = await listFriends();
      setFriends(list);
      void loadFeed();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Impossible d’ajouter cet ami.' });
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (friend) => {
    if (!window.confirm(`Retirer ${friend.displayName || 'cet ami'} de ta liste ?`)) return;
    try {
      await removeFriend(friend.friendCode);
      setFriends((current) => current.filter((f) => f.friendCode !== friend.friendCode));
      void loadFeed();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Impossible de retirer cet ami.' });
    }
  };

  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] font-outfit pb-12 relative">
      <main
        className="space-y-7 px-4"
        style={{
          paddingTop: 'calc(var(--header-total-height, 96px) + 0.75rem)',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 3rem)',
        }}
      >
        {status === 'loading' && (
          <p className="py-16 text-center font-outfit text-[10px] font-black uppercase tracking-[0.24em] opacity-40">
            Chargement…
          </p>
        )}

        {status === 'error' && (
          <div className="rounded-[20px] border border-[var(--theme-border)] bg-[var(--theme-surface)] p-5 text-center" role="alert">
            <p className="mb-4 font-outfit text-[13px] text-red-500">{loadError}</p>
            <button
              type="button"
              onClick={() => void load()}
              className="min-h-11 rounded-full border-2 border-transparent px-5 font-outfit text-[10px] font-black uppercase tracking-widest active:scale-95 transition-transform"
              style={ACTION_STYLE}
            >
              Réessayer
            </button>
          </div>
        )}

        {status === 'ready' && me && (
          <>
            {/* FIL D'ACTUALITÉ (seulement si j'ai des amis) */}
            {friends.length > 0 && (
              <div>
                <SectionLabel>Fil d’actualité</SectionLabel>
                {feed === null ? (
                  <p className="py-6 text-center font-outfit text-[10px] font-black uppercase tracking-[0.24em] opacity-40">
                    Chargement…
                  </p>
                ) : feed.length === 0 ? (
                  <p
                    role={feedError ? 'alert' : undefined}
                    className={`rounded-[20px] border border-[var(--theme-border)] bg-[var(--theme-surface)] p-5 text-center font-outfit text-[13px] ${
                      feedError ? 'text-red-500' : 'text-[var(--theme-text-secondary)]'
                    }`}
                  >
                    {feedError
                      ? 'Impossible de charger le fil d’actualité.'
                      : 'Pas encore d’activité. Les séances notées par tes amis apparaîtront ici.'}
                  </p>
                ) : (
                  <ul className="divide-y divide-[var(--theme-border)] overflow-hidden rounded-[20px] border border-[var(--theme-border)] bg-[var(--theme-surface)]">
                    {feed.map((item) => (
                      <FeedItem key={`${item.friend.friendCode}|${item.title}|${item.watchedOn}`} item={item} />
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* MON CODE */}
            <div>
              <SectionLabel>Mon code ami</SectionLabel>
              <div className="rounded-[20px] border border-[var(--theme-border)] bg-[var(--theme-surface)] p-5">
                <p
                  className="select-all text-center font-galinoy text-[32px] italic tracking-[0.12em]"
                  style={{ color: 'var(--theme-accent)' }}
                >
                  {me.friendCode}
                </p>
                <p className="mt-1 text-center font-outfit text-[11px] text-[var(--theme-text-secondary)]">
                  Donne ce code à tes amis pour qu’ils t’ajoutent.
                </p>
                <div className="mt-4 flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={copyCode}
                    className="flex min-h-11 items-center gap-2 rounded-full border border-[var(--theme-border)] bg-[var(--theme-bg)] px-4 font-outfit text-[10px] font-black uppercase tracking-widest active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                  >
                    {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                    {copied ? 'Copié' : 'Copier'}
                  </button>
                  {canShare && (
                    <button
                      type="button"
                      onClick={shareCode}
                      className="flex min-h-11 items-center gap-2 rounded-full border border-[var(--theme-border)] bg-[var(--theme-bg)] px-4 font-outfit text-[10px] font-black uppercase tracking-widest active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                    >
                      <Share2 size={14} aria-hidden="true" />
                      Partager
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* AJOUTER UN AMI */}
            <div>
              <SectionLabel>Ajouter un ami</SectionLabel>
              <form onSubmit={handleAdd} className="flex gap-2">
                <input
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                  placeholder="XXXX-XXXX"
                  maxLength={9}
                  autoCapitalize="characters"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  aria-label="Code ami"
                  className="min-h-12 min-w-0 flex-1 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg)] px-5 text-center font-mono text-sm font-semibold tracking-[0.2em] text-[var(--theme-text)] outline-none focus:border-[var(--theme-accent)] focus:ring-2 focus:ring-[var(--theme-accent)]/30"
                />
                <button
                  type="submit"
                  disabled={adding || !codeInput.trim()}
                  className="flex min-h-12 items-center gap-2 rounded-2xl border-2 border-transparent px-5 font-outfit text-[10px] font-black uppercase tracking-widest active:scale-95 transition-transform disabled:opacity-40"
                  style={ACTION_STYLE}
                >
                  <UserPlus size={14} aria-hidden="true" />
                  {adding ? '…' : 'Ajouter'}
                </button>
              </form>
              {feedback && (
                <p
                  role={feedback.type === 'error' ? 'alert' : 'status'}
                  className={`mt-3 rounded-2xl px-4 py-3 text-center font-outfit text-[12px] ${
                    feedback.type === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-600'
                  }`}
                >
                  {feedback.text}
                </p>
              )}
            </div>

            {/* MES AMIS */}
            <div>
              <SectionLabel>Mes amis ({friends.length})</SectionLabel>
              {friends.length === 0 ? (
                <p className="rounded-[20px] border border-[var(--theme-border)] bg-[var(--theme-surface)] p-5 text-center font-outfit text-[13px] text-[var(--theme-text-secondary)]">
                  Aucun ami pour l’instant. Partage ton code ou saisis celui d’un ami.
                </p>
              ) : (
                <ul className="divide-y divide-[var(--theme-border)] overflow-hidden rounded-[20px] border border-[var(--theme-border)] bg-[var(--theme-surface)]">
                  {friends.map((friend) => (
                    <li key={friend.friendCode} className="flex min-h-[64px] items-center gap-3 px-4 py-3">
                      <FriendAvatar name={friend.displayName} url={friend.avatarUrl} />
                      <div className="min-w-0 flex-1 text-left">
                        <p className="truncate font-outfit text-[14px] font-bold text-[var(--theme-text)]">
                          {friend.displayName || 'Cinéphile'}
                        </p>
                        <p className="font-outfit text-[11px] leading-tight text-[var(--theme-text-secondary)]">
                          Ami depuis le{' '}
                          {new Date(friend.since).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemove(friend)}
                        aria-label={`Retirer ${friend.displayName || 'cet ami'}`}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full opacity-30 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                      >
                        <X size={18} aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}