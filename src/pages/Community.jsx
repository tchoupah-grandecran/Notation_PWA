import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Copy, Film, Heart, Share2, Sparkles, Trophy, UserPlus, Users, X } from 'lucide-react';
import { Avatar3D } from '../components/Avatar3D';
import {
  addFriendByCode,
  getFeed,
  getMyCommunityProfile,
  listFriends,
  removeFriend,
  syncActivity,
} from '../communityApi';

/* ─── Styles partagés ─────────────────────────────────────────────── */
const ACTION_STYLE = {
  background: 'linear-gradient(var(--theme-action-bg), var(--theme-action-bg)) padding-box, var(--theme-accent-gradient) border-box',
  color: 'var(--theme-action-ink)',
};

const SKELETON_CSS = `
  @keyframes ge-shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  .ge-skeleton {
    background: linear-gradient(
      90deg,
      color-mix(in srgb, var(--theme-text) 7%, transparent) 25%,
      color-mix(in srgb, var(--theme-text) 15%, transparent) 50%,
      color-mix(in srgb, var(--theme-text) 7%, transparent) 75%
    );
    background-size: 200% 100%;
    animation: ge-shimmer 1.5s ease-in-out infinite;
  }
  @media (prefers-reduced-motion: reduce) {
    .ge-skeleton { animation: none; }
  }
`;

const SectionLabel = ({ children, className = 'ml-5' }) => (
  <h3 className={`font-outfit text-[10px] font-black uppercase tracking-[0.2em] opacity-30 mb-2 ${className}`}>
    {children}
  </h3>
);

/* ─── Formats ─────────────────────────────────────────────────────── */
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

/* ─── Skeletons ───────────────────────────────────────────────────── */
const Skeleton = ({ className = '' }) => <div aria-hidden="true" className={`ge-skeleton ${className}`} />;

function FeedSkeleton({ rows = 4 }) {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Chargement du fil d’actualité…</span>
      <ul className="divide-y divide-[var(--theme-border)] overflow-hidden rounded-[20px] border border-[var(--theme-border)] bg-[var(--theme-surface)]">
        {Array.from({ length: rows }, (_, i) => (
          <li key={i} className="flex items-center gap-3 px-4 py-3" aria-hidden="true">
            <Skeleton className="h-[72px] w-12 shrink-0 rounded-md" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-3 w-1/3 rounded-full" />
              <Skeleton className="h-4 w-3/4 rounded-full" />
              <div className="flex gap-2 pt-0.5">
                <Skeleton className="h-4 w-10 rounded-full" />
                <Skeleton className="h-4 w-20 rounded-full" />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ShareSkeleton() {
  return (
    <div role="status" aria-live="polite" className="space-y-6">
      <span className="sr-only">Chargement…</span>
      <div aria-hidden="true" className="space-y-3 rounded-[20px] border border-[var(--theme-border)] bg-[var(--theme-bg)] p-5">
        <Skeleton className="mx-auto h-9 w-48 rounded-xl" />
        <Skeleton className="mx-auto h-3 w-40 rounded-full" />
        <div className="flex justify-center gap-2 pt-2">
          <Skeleton className="h-11 w-24 rounded-full" />
          <Skeleton className="h-11 w-28 rounded-full" />
        </div>
      </div>
      <div aria-hidden="true" className="flex gap-2">
        <Skeleton className="h-12 flex-1 rounded-2xl" />
        <Skeleton className="h-12 w-28 rounded-2xl" />
      </div>
      <div aria-hidden="true" className="space-y-3">
        {[0, 1].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-1/2 rounded-full" />
              <Skeleton className="h-3 w-2/3 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Éléments d'interface ────────────────────────────────────────── */
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
      className="flex shrink-0 items-center justify-center rounded-full font-galinoy italic"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.5),
        background: 'color-mix(in srgb, var(--theme-accent) 18%, transparent)',
        color: 'var(--theme-accent)',
      }}
    >
      {(name || '?').trim().charAt(0).toUpperCase()}
    </span>
  );
}

function ProfileButton({ name, url, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Mes amis et mon code de partage"
      aria-haspopup="dialog"
      className="relative flex h-11 w-11 items-center justify-center rounded-full active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
    >
      <span className="rounded-full ring-2 ring-[var(--theme-accent)]">
        <FriendAvatar name={name} url={url} size={34} />
      </span>
      <span
        aria-hidden="true"
        className="absolute -bottom-0.5 -right-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full"
        style={{ background: 'var(--theme-accent)', color: 'var(--theme-bg)' }}
      >
        <UserPlus size={10} strokeWidth={2.5} />
      </span>
    </button>
  );
}

function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="flex flex-col items-center rounded-[20px] border border-[var(--theme-border)] bg-[var(--theme-surface)] px-6 py-10 text-center">
      <span
        className="mb-4 flex h-14 w-14 items-center justify-center rounded-full"
        style={{
          background: 'color-mix(in srgb, var(--theme-accent) 14%, transparent)',
          color: 'var(--theme-accent)',
        }}
      >
        <Icon size={24} aria-hidden="true" />
      </span>
      <p className="font-galinoy text-[22px] italic text-[var(--theme-text)]">{title}</p>
      <p className="mt-2 max-w-[28ch] font-outfit text-[13px] leading-relaxed text-[var(--theme-text-secondary)]">{text}</p>
      {action}
    </div>
  );
}

function FeedItem({ item }) {
  const name = item.friend.displayName || 'Un ami';
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      {item.poster ? (
        <img src={item.poster} alt="" loading="lazy" className="h-[72px] w-12 shrink-0 rounded-md object-cover" />
      ) : (
        <div
          aria-hidden="true"
          className="h-[72px] w-12 shrink-0 rounded-md"
          style={{ background: 'color-mix(in srgb, var(--theme-text) 8%, transparent)' }}
        />
      )}
      <div className="min-w-0 flex-1 text-left">
        <div className="flex min-w-0 items-center gap-2">
          <FriendAvatar name={item.friend.displayName} url={item.friend.avatarUrl} size={22} />
          <p className="truncate font-outfit text-[12px] text-[var(--theme-text-secondary)]">
            <span className="font-bold text-[var(--theme-text)]">{name}</span> a vu
          </p>
        </div>
        <p className="mt-1 truncate font-outfit text-[14px] font-semibold leading-tight text-[var(--theme-text)]">
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
            <Heart size={13} fill="currentColor" aria-label="Coup de cœur" style={{ color: 'var(--theme-accent)' }} />
          )}
          {item.genre && <span>{item.genre}</span>}
          {item.watchedOn && <span>· {formatWatched(item.watchedOn)}</span>}
        </div>
      </div>
    </li>
  );
}

function ComingSoon() {
  const teasers = [
    { icon: Users, label: 'Comparer vos goûts avec ceux de vos amis' },
    { icon: Trophy, label: 'Défis et classements entre cinéphiles' },
    { icon: Sparkles, label: 'Statistiques croisées et badges' },
  ];
  return (
    <div className="rounded-[20px] border border-[var(--theme-border)] bg-[var(--theme-surface)] px-6 py-10 text-center">
      <span
        className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
        style={{
          background: 'color-mix(in srgb, var(--theme-accent) 14%, transparent)',
          color: 'var(--theme-accent)',
        }}
      >
        <Trophy size={24} aria-hidden="true" />
      </span>
      <p className="font-galinoy text-[26px] italic text-[var(--theme-text)]">Bientôt disponible</p>
      <p className="mx-auto mt-2 max-w-[30ch] font-outfit text-[13px] leading-relaxed text-[var(--theme-text-secondary)]">
        On prépare de quoi vous mesurer entre amis.
      </p>
      <ul className="mx-auto mt-6 flex max-w-xs flex-col gap-2 text-left">
        {teasers.map(({ icon: Icon, label }) => (
          <li
            key={label}
            className="flex items-center gap-3 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg)] px-4 py-3 opacity-70"
          >
            <Icon size={16} aria-hidden="true" className="shrink-0 opacity-60" />
            <span className="font-outfit text-[12px] font-bold text-[var(--theme-text)]">{label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ─── Pop-up de partage : mon code, ajout, liste d'amis ───────────── */
function ShareModal({
  onClose, status, loadError, onRetry, me, friends,
  codeInput, setCodeInput, adding, onAdd, feedback, onRemove,
}) {
  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  const triggerRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  useEffect(() => {
    triggerRef.current = document.activeElement;
    const focusFrame = requestAnimationFrame(() => closeRef.current?.focus());
    const handleKeys = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = dialogRef.current?.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeys);
    return () => {
      cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', handleKeys);
      triggerRef.current?.focus?.();
    };
  }, [onClose]);

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

  const outlineButton =
    'flex min-h-11 items-center gap-2 rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface)] px-4 font-outfit text-[10px] font-black uppercase tracking-widest active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-5 py-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" aria-hidden="true" onClick={onClose} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-dialog-title"
        className="relative max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-[2.5rem] border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 shadow-2xl sm:p-8"
      >
        <div className="mb-6 flex items-start justify-between">
          <div className="text-left">
            <h3 id="share-dialog-title" className="font-outfit text-xl font-bold text-[var(--theme-text)]">Mes amis</h3>
            <p className="mt-1 font-outfit text-[10px] font-black uppercase tracking-widest text-[var(--theme-accent)]">
              Code & invitations
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Fermer la fenêtre"
            className="flex h-11 w-11 items-center justify-center rounded-full opacity-50 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
          >
            <X size={18} />
          </button>
        </div>

        {status === 'loading' && <ShareSkeleton />}

        {status === 'error' && (
          <div className="text-center" role="alert">
            <p className="mb-4 font-outfit text-[13px] text-red-500">{loadError}</p>
            <button
              type="button"
              onClick={onRetry}
              className="min-h-11 rounded-full border-2 border-transparent px-5 font-outfit text-[10px] font-black uppercase tracking-widest active:scale-95 transition-transform"
              style={ACTION_STYLE}
            >
              Réessayer
            </button>
          </div>
        )}

        {status === 'ready' && me && (
          <div className="space-y-6">
            {/* MON CODE */}
            <div>
              <SectionLabel className="ml-1">Mon code ami</SectionLabel>
              <div className="rounded-[20px] border border-[var(--theme-border)] bg-[var(--theme-bg)] p-5">
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
                  <button type="button" onClick={copyCode} className={outlineButton}>
                    {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                    {copied ? 'Copié' : 'Copier'}
                  </button>
                  {canShare && (
                    <button type="button" onClick={shareCode} className={outlineButton}>
                      <Share2 size={14} aria-hidden="true" />
                      Partager
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* AJOUTER UN AMI */}
            <div>
              <SectionLabel className="ml-1">Ajouter un ami</SectionLabel>
              <form onSubmit={onAdd} className="flex gap-2">
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
                  className="min-h-12 min-w-0 flex-1 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg)] px-4 text-center font-mono text-sm font-semibold tracking-[0.2em] text-[var(--theme-text)] outline-none focus:border-[var(--theme-accent)] focus:ring-2 focus:ring-[var(--theme-accent)]/30"
                />
                <button
                  type="submit"
                  disabled={adding || !codeInput.trim()}
                  className="flex min-h-12 items-center gap-2 rounded-2xl border-2 border-transparent px-4 font-outfit text-[10px] font-black uppercase tracking-widest active:scale-95 transition-transform disabled:opacity-40"
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

            {/* LISTE D'AMIS */}
            <div>
              <SectionLabel className="ml-1">Amis ({friends.length})</SectionLabel>
              {friends.length === 0 ? (
                <p className="rounded-[20px] border border-[var(--theme-border)] bg-[var(--theme-bg)] p-5 text-center font-outfit text-[13px] text-[var(--theme-text-secondary)]">
                  Aucun ami pour l’instant.
                </p>
              ) : (
                <ul className="divide-y divide-[var(--theme-border)] overflow-hidden rounded-[20px] border border-[var(--theme-border)] bg-[var(--theme-bg)]">
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
                        onClick={() => onRemove(friend)}
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
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────── */
export function Community({ userName, userAvatar, historyData, ratingScale, onHeaderRight }) {
  const [activeSubTab, setActiveSubTab] = useState('activity'); // activity | compare
  const [showShare, setShowShare] = useState(false);
  const [me, setMe] = useState(null);
  const [friends, setFriends] = useState([]);
  const [feed, setFeed] = useState(null); // null = chargement
  const [feedError, setFeedError] = useState(false);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [loadError, setLoadError] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [adding, setAdding] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'ok' | 'error', text }

  const closeShare = useCallback(() => setShowShare(false), []);

  const openShare = useCallback(() => {
    setFeedback(null);
    setShowShare(true);
  }, []);

  /* Bouton de profil dans l'en-tête, en haut à droite */
  useEffect(() => {
    if (!onHeaderRight) return undefined;
    onHeaderRight(<ProfileButton name={userName} url={userAvatar} onClick={openShare} />);
    return () => onHeaderRight(null);
  }, [onHeaderRight, userName, userAvatar, openShare]);

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

  /* Profil prêt : j'envoie mes dernières séances, puis je charge le fil */
  useEffect(() => {
    if (status !== 'ready') return undefined;
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

  /* ─── Contenu de l'onglet « Activité » ─── */
  const renderActivity = () => {
    if (status === 'loading') return <FeedSkeleton />;

    if (status === 'error') {
      return (
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
      );
    }

    if (friends.length === 0) {
      return (
        <EmptyState
          icon={Users}
          title="Pas encore d’amis"
          text="Ajoute tes amis avec leur code pour suivre ce qu’ils regardent."
          action={
            <button
              type="button"
              onClick={openShare}
              className="mt-6 flex min-h-12 items-center gap-2 rounded-full border-2 border-transparent px-6 font-outfit text-[10px] font-black uppercase tracking-widest active:scale-95 transition-transform"
              style={ACTION_STYLE}
            >
              <UserPlus size={14} aria-hidden="true" />
              Ajouter un ami
            </button>
          }
        />
      );
    }

    if (feed === null) return <FeedSkeleton />;

    if (feed.length === 0) {
      return feedError ? (
        <p
          role="alert"
          className="rounded-[20px] border border-[var(--theme-border)] bg-[var(--theme-surface)] p-5 text-center font-outfit text-[13px] text-red-500"
        >
          Impossible de charger le fil d’actualité.
        </p>
      ) : (
        <EmptyState
          icon={Film}
          title="Rien pour l’instant"
          text="Les séances notées par tes amis apparaîtront ici."
        />
      );
    }

    return (
      <ul className="divide-y divide-[var(--theme-border)] overflow-hidden rounded-[20px] border border-[var(--theme-border)] bg-[var(--theme-surface)]">
        {feed.map((item, index) => (
          <FeedItem key={`${item.friend.friendCode}|${item.title}|${item.watchedOn}|${index}`} item={item} />
        ))}
      </ul>
    );
  };

  const subTabs = [
    { id: 'activity', label: 'Activité' },
    { id: 'compare', label: 'Comparer' },
  ];

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] font-outfit pb-12 relative">
      <style>{SKELETON_CSS}</style>

      <main
        className="space-y-5 px-4"
        style={{
          paddingTop: 'calc(var(--header-total-height, 96px) + 0.75rem)',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 3rem)',
        }}
      >
        {/* Repli : si App.jsx ne fournit pas onHeaderRight, le bouton s'affiche ici */}
        {!onHeaderRight && (
          <div className="flex justify-end">
            <ProfileButton name={userName} url={userAvatar} onClick={openShare} />
          </div>
        )}

        {/* Onglets internes */}
        <div
          role="tablist"
          aria-label="Sections de la communauté"
          className="mx-auto flex w-full max-w-xs items-center gap-1 rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface)] p-1"
        >
          {subTabs.map(({ id, label }) => {
            const isActive = activeSubTab === id;
            return (
              <button
                key={id}
                id={`community-tab-${id}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`community-panel-${id}`}
                onClick={() => setActiveSubTab(id)}
                className={`flex min-h-11 flex-1 items-center justify-center rounded-full border-2 border-transparent font-outfit text-[10px] font-black uppercase tracking-widest transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] ${
                  isActive ? '' : 'opacity-50'
                }`}
                style={isActive ? ACTION_STYLE : undefined}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div
          role="tabpanel"
          id={`community-panel-${activeSubTab}`}
          aria-labelledby={`community-tab-${activeSubTab}`}
        >
          {activeSubTab === 'activity' ? renderActivity() : <ComingSoon />}
        </div>
      </main>

      {showShare && (
        <ShareModal
          onClose={closeShare}
          status={status}
          loadError={loadError}
          onRetry={() => void load()}
          me={me}
          friends={friends}
          codeInput={codeInput}
          setCodeInput={setCodeInput}
          adding={adding}
          onAdd={handleAdd}
          feedback={feedback}
          onRemove={handleRemove}
        />
      )}
    </div>
  );
}