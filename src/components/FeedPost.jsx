import { useEffect, useState } from 'react';
import { Film, Heart, Popcorn, ThumbsDown, ThumbsUp } from 'lucide-react';
import { fetchTmdbPoster } from '../communityApi';
import { formatScore } from '../communityStats';
import { FriendAvatar, Skeleton } from './communityUi';

/* ─── Constantes & formats ────────────────────────────────────────── */
const MINE_TINT = 'color-mix(in srgb, var(--theme-accent) 11%, var(--theme-surface))';
const POST = 'border-b-8 border-[var(--theme-bg)] bg-[var(--theme-surface)] px-4 pt-4 pb-2';
const MAX_NAMES = 3;

const REACTIONS = [
  { kind: 'like', Icon: ThumbsUp, fillable: true, label: 'J’aime', short: '' },
  { kind: 'dislike', Icon: ThumbsDown, fillable: true, label: 'Je n’aime pas', short: '' },
  { kind: 'watch', Icon: Popcorn, fillable: false, label: 'À voir', short: 'À voir' },
];

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

/* ─── Skeleton ────────────────────────────────────────────────────── */
export function FeedSkeleton({ rows = 3 }) {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Chargement du fil d’actualité…</span>
      <ul className="-mx-4">
        {Array.from({ length: rows }, (_, i) => (
          <li key={i} aria-hidden="true" className={POST}>
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-28 rounded-full" />
                <Skeleton className="h-3 w-40 rounded-full" />
              </div>
            </div>
            <Skeleton className="mt-4 h-3.5 w-11/12 rounded-full" />
            <Skeleton className="mt-2 h-3.5 w-2/3 rounded-full" />
            <div className="mt-3 flex gap-3 rounded-2xl border border-[var(--theme-border)] p-2.5">
              <Skeleton className="h-[84px] w-14 shrink-0 rounded-md" />
              <div className="flex-1 space-y-2 pt-1">
                <Skeleton className="h-4 w-3/4 rounded-full" />
                <Skeleton className="h-3 w-1/3 rounded-full" />
              </div>
            </div>
            <Skeleton className="mt-4 h-11 w-full rounded-full" />
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ─── Briques ─────────────────────────────────────────────────────── */
function RatingBadge({ entry }) {
  if (entry.rating === null || entry.rating === undefined) {
    return <span className="font-outfit text-[11px] italic text-[var(--theme-text-secondary)]">vu, sans note</span>;
  }
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-outfit text-[10px] font-black"
      style={{ borderColor: 'var(--theme-accent)', color: 'var(--theme-accent)' }}
    >
      {formatRating(entry.rating, entry.scale)}
      {entry.heart && <Heart size={11} fill="currentColor" aria-label="Coup de cœur" />}
    </span>
  );
}

/* Affiche : essaie chaque lien connu (moi + amis), puis TMDB via l'identifiant, puis un cadre neutre. */
function Poster({ posters, tmdbId }) {
  const [attempt, setAttempt] = useState(0);
  const [fetched, setFetched] = useState(null); // null = pas encore essayé · '' = rien trouvé

  useEffect(() => {
    if (attempt < posters.length || fetched !== null || !tmdbId) return undefined;
    let cancelled = false;
    fetchTmdbPoster(tmdbId).then((url) => {
      if (!cancelled) setFetched(url || '');
    });
    return () => {
      cancelled = true;
    };
  }, [attempt, posters, fetched, tmdbId]);

  const candidates = fetched && !posters.includes(fetched) ? [...posters, fetched] : posters;
  const src = candidates[attempt];

  if (src) {
    return (
      <img
        src={src}
        alt=""
        loading="lazy"
        onError={() => setAttempt((current) => current + 1)}
        className="h-[84px] w-14 shrink-0 rounded-md object-cover"
      />
    );
  }
  return (
    <div
      aria-hidden="true"
      className="flex h-[84px] w-14 shrink-0 items-center justify-center rounded-md"
      style={{ background: 'color-mix(in srgb, var(--theme-text) 8%, transparent)' }}
    >
      <Film size={18} className="opacity-25" />
    </div>
  );
}

/* Carte du film intégrée au post (affiche, titre, genre + contenu libre en bas) */
function FilmCard({ film, posters, children }) {
  return (
    <div className="mt-3 flex gap-3 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg)] p-2.5">
      <Poster key={posters.join('|')} posters={posters} tmdbId={film.tmdbId} />
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-2 text-left">
        <div>
          <p className="break-words font-outfit text-[15px] font-bold leading-snug text-[var(--theme-text)]">
            {film.title}
          </p>
          {film.genre && (
            <p className="mt-0.5 font-outfit text-[12px] text-[var(--theme-text-secondary)]">{film.genre}</p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

function PostText({ comment }) {
  if (!comment) return null;
  return (
    <p className="mt-3 whitespace-pre-line break-words text-left font-outfit text-[14px] leading-relaxed text-[var(--theme-text)]">
      {comment}
    </p>
  );
}

/* Qui a réagi, et comment (visible sur tous les posts) */
function ReactionSummary({ entry }) {
  const lines = REACTIONS
    .map((reaction) => ({ ...reaction, list: entry.reactions?.[reaction.kind] || [] }))
    .filter((line) => line.list.length > 0);
  if (lines.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-left font-outfit text-[12px] text-[var(--theme-text-secondary)]">
      {lines.map(({ kind, Icon, label, list }) => {
        const all = list.map((reactor) => (reactor.mine ? 'Toi' : reactor.displayName || 'Un ami'));
        const shown = all.length > MAX_NAMES ? [...all.slice(0, 2), `${all.length - 2} autres`] : all;
        return (
          <span key={kind} className="inline-flex items-center gap-1" aria-label={`${label} : ${all.join(', ')}`}>
            <Icon size={13} aria-hidden="true" />
            <span>{shown.join(', ')}</span>
          </span>
        );
      })}
    </div>
  );
}

/* Barre d'actions : réagir à la séance d'un ami */
function ReactionBar({ entry, onReact, flush = false }) {
  if (!entry.activityId) return null;
  return (
    <div
      role="group"
      aria-label="Réagir"
      className={flush ? 'mt-1 flex' : '-mx-4 mt-3 flex border-t border-[var(--theme-border)] px-2'}
    >
      {REACTIONS.map(({ kind, Icon, label, short }) => {
        const list = entry.reactions?.[kind] || [];
        const mine = list.some((reactor) => reactor.mine);
        const names = list.map((reactor) => (reactor.mine ? 'Toi' : reactor.displayName || 'Un ami')).join(', ');
        return (
          <button
            key={kind}
            type="button"
            aria-pressed={mine}
            aria-label={names ? `${label} (${names})` : label}
            title={names || label}
            onClick={() => onReact(entry.activityId, kind, !mine)}
            className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl font-outfit text-[13px] font-semibold transition-transform active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
            style={{ color: mine ? 'var(--theme-accent)' : 'var(--theme-text-secondary)' }}
          >
            <Icon
  size={18}
  strokeWidth={mine ? 2.5 : 2}
  fill={mine && fillable ? 'currentColor' : 'none'}
  aria-hidden="true"
/>
            {list.length > 0 && <span>{list.length}</span>}
            {short && <span>{short}</span>}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Post : un seul spectateur ───────────────────────────────────── */
function SinglePost({ group, userName, userAvatar, onReact }) {
  const entry = group.entries[0];
  const isMe = entry.who === 'me';
  const when = formatWatched(entry.watchedOn);

  return (
    <li className={POST}>
      <div className="flex items-center gap-3">
        <FriendAvatar
          name={isMe ? userName : entry.name}
          url={isMe ? userAvatar : entry.avatarUrl}
          size={40}
        />
        <div className="min-w-0 flex-1 text-left">
          <p className="truncate font-outfit text-[14px] font-bold text-[var(--theme-text)]">
            {isMe ? 'Toi' : entry.name}
          </p>
          <p className="font-outfit text-[12px] text-[var(--theme-text-secondary)]">
            {isMe ? 'as vu un film' : 'a vu un film'}
            {when && ` · ${when}`}
          </p>
        </div>
      </div>

      <PostText comment={entry.comment} />

      <FilmCard film={group.film} posters={group.posters}>
        <div className="flex items-center justify-between gap-2">
          <RatingBadge entry={entry} />
          {!isMe && (
            <span className="font-outfit text-[11px] text-[var(--theme-text-secondary)]">
              Pas encore vu par toi
            </span>
          )}
        </div>
      </FilmCard>

      <ReactionSummary entry={entry} />
      {!isMe && <ReactionBar entry={entry} onReact={onReact} />}
      {isMe && <div className="h-2" />}
    </li>
  );
}

/* ─── Post : film vu par plusieurs personnes ──────────────────────── */
function SharedPost({ group, userName, userAvatar, ratingScale, onReact }) {
  const { entries } = group;
  const hasMe = entries.some((entry) => entry.who === 'me');

  // « Léa, Tom et toi avez vu ce film »
  const friends = entries.filter((entry) => entry.who !== 'me').map((entry) => entry.name);
  const shown = friends.slice(0, 2);
  const rest = friends.length - shown.length;
  const parts = [...shown];
  if (rest > 0) parts.push(`${rest} autre${rest > 1 ? 's' : ''}`);
  if (hasMe) parts.push('toi');
  const label = parts.length > 1 ? `${parts.slice(0, -1).join(', ')} et ${parts[parts.length - 1]}` : parts[0];

  // Moyenne du groupe, ramenée à l'échelle de l'utilisateur
  const rated = entries.filter((entry) => entry.rating !== null && entry.rating !== undefined && entry.scale > 0);
  const average = rated.length >= 2
    ? rated.reduce((sum, entry) => sum + entry.rating / entry.scale, 0) / rated.length
    : null;

  return (
    <li className={POST}>
      <div className="flex items-center gap-3">
        <div className="flex shrink-0">
          {entries.slice(0, 3).map((entry, index) => {
            const isMe = entry.who === 'me';
            return (
              <span key={entry.id} className={index > 0 ? '-ml-2.5' : ''}>
                <span className="block rounded-full ring-2 ring-[var(--theme-surface)]">
                  <FriendAvatar
                    name={isMe ? userName : entry.name}
                    url={isMe ? userAvatar : entry.avatarUrl}
                    size={32}
                  />
                </span>
              </span>
            );
          })}
        </div>
        <p className="min-w-0 flex-1 text-left font-outfit text-[13px] leading-snug text-[var(--theme-text-secondary)]">
          <span className="font-bold text-[var(--theme-text)]">{label}</span>{' '}
          {hasMe ? 'avez vu ce film' : 'ont vu ce film'}
        </p>
      </div>

      <FilmCard film={group.film} posters={group.posters}>
        {average !== null && (
          <div className="flex items-baseline gap-2">
            <span
              className="font-galinoy text-[30px] italic leading-none"
              style={{ color: 'var(--theme-accent)' }}
            >
              {formatScore(average, ratingScale)}
            </span>
            <span className="font-outfit text-[11px] text-[var(--theme-text-secondary)]">
              /{ratingScale} · moyenne du groupe
            </span>
          </div>
        )}
      </FilmCard>

      <ul className="mt-3 space-y-1">
        {entries.map((entry) => {
          const isMe = entry.who === 'me';
          const when = formatWatched(entry.watchedOn);
          return (
            <li
              key={entry.id}
              className="rounded-2xl px-3 py-2.5"
              style={isMe ? { background: MINE_TINT } : undefined}
            >
              <div className="flex items-center gap-2.5">
                <FriendAvatar
                  name={isMe ? userName : entry.name}
                  url={isMe ? userAvatar : entry.avatarUrl}
                  size={28}
                />
                <span className="min-w-0 truncate font-outfit text-[13px] font-bold text-[var(--theme-text)]">
                  {isMe ? 'Toi' : entry.name}
                </span>
                <RatingBadge entry={entry} />
                {when && (
                  <span className="ml-auto shrink-0 font-outfit text-[11px] text-[var(--theme-text-secondary)]">
                    {when}
                  </span>
                )}
              </div>
              {entry.comment && (
                <p className="mt-2 whitespace-pre-line break-words text-left font-outfit text-[13px] leading-relaxed text-[var(--theme-text)]">
                  {entry.comment}
                </p>
              )}
              <ReactionSummary entry={entry} />
              {!isMe && <ReactionBar entry={entry} onReact={onReact} flush />}
            </li>
          );
        })}
      </ul>
    </li>
  );
}

export function FeedGroup({ group, userName, userAvatar, ratingScale, onReact }) {
  return group.kind === 'shared'
    ? <SharedPost group={group} userName={userName} userAvatar={userAvatar} ratingScale={ratingScale} onReact={onReact} />
    : <SinglePost group={group} userName={userName} userAvatar={userAvatar} onReact={onReact} />;
}