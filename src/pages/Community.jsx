import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Clock3, Copy, Film, Heart, Share2, Sparkles, Trophy, UserPlus, Users, X } from 'lucide-react';
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

const PAGE_CSS = `
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
  @keyframes ge-slide-from-right {
    from { opacity: 0; transform: translateX(32px); }
    to   { opacity: 1; transform: none; }
  }
  @keyframes ge-slide-from-left {
    from { opacity: 0; transform: translateX(-32px); }
    to   { opacity: 1; transform: none; }
  }
  .ge-slide-from-right { animation: ge-slide-from-right 300ms cubic-bezier(0.22, 1, 0.36, 1) both; }
  .ge-slide-from-left  { animation: ge-slide-from-left 300ms cubic-bezier(0.22, 1, 0.36, 1) both; }
  @media (prefers-reduced-motion: reduce) {
    .ge-skeleton, .ge-slide-from-right, .ge-slide-from-left { animation: none; }
  }
`;

const SUB_TABS = [
  { id: 'activity', label: 'Activité' },
  { id: 'compare', label: 'Comparer' },
];
const SWIPE_MIN_DISTANCE = 60;

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
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return `Il y a ${weeks} semaine${weeks > 1 ? 's' : ''}`;
  }
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  });
};

/* ─── Skeletons ───────────────────────────────────────────────────── */
const Skeleton = ({ className = '' }) => <div aria-hidden="true" className={`ge-skeleton ${className}`} />;

function FeedSkeleton({ rows = 3 }) {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Chargement du fil d’actualité…</span>
      <ul className="divide-y divide-[var(--theme-border)] overflow-hidden rounded-[20px] border border-[var(--theme-border)] bg-[var(--theme-surface)]">
        {Array.from({ length: rows }, (_, i) => (
          <li key={i} className="px-4 py-4" aria-hidden="true">
            <div className="flex items-center gap-2">
              <Skeleton className="h-7 w-7 shrink-0 rounded-full" />
              <Skeleton className="h-3 w-40 rounded-full" />
            </div>
            <div className="mt-3 flex gap-3">
              <Skeleton className="h-[84px] w-14 shrink-0 rounded-md" />
              <div className="flex-1 space-y-2 pt-1">
                <Skeleton className="h-4 w-3/4 rounded-full" />
                <Skeleton className="h-4 w-1/2 rounded-full" />
                <Skeleton className="h-4 w-24 rounded-full" />
              </div>
            </div>
            {i % 2 === 0 && (
              <div className="mt-3 space-y-2">
                <Skeleton className="h-3 w-28 rounded-full" />
                <Skeleton className="h-3 w-full rounded-full" />
                <Skeleton className="h-3 w-2/3 rounded-full" />
              </div>
            )}
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
  const when = formatWatched(item.watchedOn);
  return (
    <li className="px-4 py-4">
      {/* Qui a vu, et quand */}
      <div className="flex items-center gap-2.5">
        <FriendAvatar name={item.friend.displayName} url={item.friend.avatarUrl} size={30} />
        <p className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 font-outfit text-[12px] leading-tight text-[var(--theme-text-secondary)]">
          <span>
            <span className="font-bold text-[var(--theme-text)]">{name}</span> a vu
          </span>
          {when && (
            <>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1">
                <Clock3 size={12} aria-hidden="true" />
                {when}
              </span>
            </>
          )}
        </p>
      </div>

      {/* Film */}
      <div className="mt-3 flex gap-3">
        {item.poster ? (
          <img src={item.poster} alt="" loading="lazy" className="h-[84px] w-14 shrink-0 rounded-md object-cover" />
        ) : (
          <div
            aria-hidden="true"
            className="h-[84px] w-14 shrink-0 rounded-md"
            style={{ background: 'color-mix(in srgb, var(--theme-text) 8%, transparent)' }}
          />
        )}
        <div className="min-w-0 flex-1 text-left">
          <p className="break-words font-outfit text-[14px] font-semibold leading-snug text-[var(--theme-text)]">
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
          </div>
        </div>
      </div>

      {/* Avis */}
      {item.comment && (
        <div className="mt-3">
          <p className="font-outfit text-[11px] italic text-[var(--theme-text-secondary)]">et en a pensé ça :</p>
          <blockquote
            className="mt-1.5 whitespace-pre-line break-words border-l-2 pl-3 font-outfit text-[13px] leading-relaxed text-[var(--theme-text)]"
            style={{ borderColor: 'var(--theme-accent)' }}
          >
            {item.comment}
          </blockquote>
        </div>
      )}
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
  const [slideDir, setSlideDir] = useState(null); // null | 'left' | 'right'
  const swipeRef = useRef(null);
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

  /* ─── Navigation entre vues : onglets, clavier et balayage ─── */
  const selectSubTab = (id, { focus = false } = {}) => {
    if (id === activeSubTab) return;
    const from = SUB_TABS.findIndex((tab) => tab.id === activeSubTab);
    const to = SUB_TABS.findIndex((tab) => tab.id === id);
    setSlideDir(to > from ? 'right' : 'left');
    setActiveSubTab(id);
    if (focus) requestAnimationFrame(() => document.getElementById(`community-tab-${id}`)?.focus());
  };

  const shiftSubTab = (step, options) => {
    const index = SUB_TABS.findIndex((tab) => tab.id === activeSubTab);
    const next = SUB_TABS[index + step];
    if (next) selectSubTab(next.id, options);
  };

  const handleTabKeys = (event) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      shiftSubTab(1, { focus: true });
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      shiftSubTab(-1, { focus: true });
    }
  };

  const handleTouchStart = (event) => {
    if (event.touches.length !== 1) {
      swipeRef.current = null;
      return;
    }
    const touch = event.touches[0];
    swipeRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event) => {
    const start = swipeRef.current;
    swipeRef.current = null;
    if (!start) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    // Geste franchement horizontal uniquement, pour ne pas gêner le défilement vertical
    if (Math.abs(dx) < SWIPE_MIN_DISTANCE || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    shiftSubTab(dx < 0 ? 1 : -1);
  };

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] font-outfit pb-12 relative">
      <style>{PAGE_CSS}</style>

      <main
        className="space-y-4 px-4"
        style={{
          paddingTop: 'calc(var(--header-total-height, 96px) + 0.75rem)',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 3rem)',
          minHeight: '70dvh',
          touchAction: 'pan-y',
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={() => { swipeRef.current = null; }}
      >
        {/* Repli : si App.jsx ne fournit pas onHeaderRight, le bouton s'affiche ici */}
        {!onHeaderRight && (
          <div className="flex justify-end">
            <ProfileButton name={userName} url={userAvatar} onClick={openShare} />
          </div>
        )}

        {/* Onglets façon TikTok : texte seul, soulignement sur l'onglet actif */}
        <div
          role="tablist"
          aria-label="Sections de la communauté"
          onKeyDown={handleTabKeys}
          className="flex items-center justify-center gap-8"
        >
          {SUB_TABS.map(({ id, label }) => {
            const isActive = activeSubTab === id;
            return (
              <button
                key={id}
                id={`community-tab-${id}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`community-panel-${id}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => selectSubTab(id)}
                className="relative min-h-11 px-1 pb-2 font-outfit text-[15px] font-bold tracking-wide text-[var(--theme-text)] transition-opacity duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] rounded-md"
                style={{ opacity: isActive ? 1 : 0.4 }}
              >
                {label}
                <span
                  aria-hidden="true"
                  className="absolute bottom-0.5 left-1/2 h-[2px] -translate-x-1/2 rounded-full transition-all duration-300"
                  style={{
                    width: isActive ? '100%' : '0%',
                    background: 'var(--theme-accent-gradient, var(--theme-accent))',
                  }}
                />
              </button>
            );
          })}
        </div>

        <div
          key={activeSubTab}
          role="tabpanel"
          id={`community-panel-${activeSubTab}`}
          aria-labelledby={`community-tab-${activeSubTab}`}
          className={slideDir === 'right' ? 'ge-slide-from-right' : slideDir === 'left' ? 'ge-slide-from-left' : ''}
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