import { useEffect, useState } from 'react';
import { Film, Heart, PopcornIcon, ThumbsDown, ThumbsUp } from 'lucide-react';
import { fetchTmdbPoster } from '../communityApi';
import { formatScore } from '../communityStats';
import { FriendAvatar, Skeleton } from './communityUi';

/* ─── Constantes & formats ────────────────────────────────────────── */
const MINE_TINT = 'color-mix(in srgb, var(--theme-accent) 11%, var(--theme-surface))';
const POST = 'border-b-4 border-[var(--theme-bg)] bg-[var(--theme-surface)] px-4 pt-3 pb-2';
const POSTER_SIZE = 'h-[72px] w-12 shrink-0 rounded-md';
const MAX_NAMES = 3;

const REACTIONS = [
  { kind: 'like', Icon: ThumbsUp, fillable: true, label: 'J’aime', short: '' },
  { kind: 'dislike', Icon: ThumbsDown, fillable: true, label: 'Je n’aime pas', short: '' },
  { kind: 'watch', Icon: PopcornIcon, fillable: false, label: 'À voir', short: 'À voir' },
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

const reactorName = (reactor) => (reactor.mine ? 'Toi' : reactor.displayName || 'Un ami');

/* ─── Skeleton ────────────────────────────────────────────────────── */
export function FeedSkeleton({ rows = 3 }) {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Chargement du fil d’actualité…</span>
      <ul className="-mx-4">
        {Array.from({ length: rows }, (_, i) => (
          <li key={i} aria-hidden="true" className={POST}>
            <div className="flex gap-3">
              <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-3.5 w-40 rounded-full" />
                <Skeleton className="mt-2.5 h-3.5 w-11/12 rounded-full" />
                <div className="mt-3 flex gap-3">
                  <Skeleton className={POSTER_SIZE} />
                  <div className="flex-1 space-y-2 pt-1">
                    <Skeleton className="h-4 w-3/4 rounded-full" />
                    <Skeleton className="h-3 w-1/3 rounded-full" />
                  </div>
                </div>
                <Skeleton className="mt-3 h-8 w-2/3 rounded-full" />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ─── Briques ─────────────────────────────────────────────────────── */
function RatingBadge({ entry }) {
  if (entry.rating === null || entry.rating === undefined) {
    return (
      <span className="whitespace-nowrap font-outfit text-[11px] italic text-[var(--theme-text-secondary)]">
        vu, sans note
      </span>
    );
  }
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 font-outfit text-[10px] font-black"
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
        className={`${POSTER_SIZE} object-cover`}
      />
    );
  }
  return (
    <div
      aria-hidden="true"
      className={`${POSTER_SIZE} flex items-center justify-center`}
      style={{ background: 'color-mix(in srgb, var(--theme-text) 8%, transparent)' }}
    >
      <Film size={18} className="opacity-25" />
    </div>
  );
}

/* Film : simple rangée (affiche + titre + genre + infos), sans cadre */
function FilmRow({ film, posters, className = '', children }) {
  return (
    <div className={`flex gap-3 ${className}`}>
      <Poster key={posters.join('|')} posters={posters} tmdbId={film.tmdbId} />
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 text-left">
        <div>
          <p className="break-words font-outfit text-[15px] font-bold leading-snug text-[var(--theme-text)]">
            {film.title}
          </p>
          {film.genre && (
            <p className="font-outfit text-[12px] text-[var(--theme-text-secondary)]">{film.genre}</p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

function PostText({ comment, className = '' }) {
  if (!comment) return null;
  return (
    <p
      className={`whitespace-pre-line break-words text-left font-outfit text-[14px] leading-relaxed text-[var(--theme-text)] ${className}`}
    >
      {comment}
    </p>
  );
}

/* Pied de chaque entrée : qui a réagi + boutons de réaction. Toujours en dernier. */
function ReactionFooter({ entry, onReact, canReact }) {
  const lines = REACTIONS
    .map((reaction) => ({ ...reaction, list: entry.reactions?.[reaction.kind] || [] }))
    .filter((line) => line.list.length > 0);
  const showBar = canReact && Boolean(entry.activityId);

  if (lines.length === 0 && !showBar) return null;

  return (
    <div className="mt-2">
      {lines.length > 0 && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-left font-outfit text-[12px] text-[var(--theme-text-secondary)]">
          {lines.map(({ kind, Icon, label, list }) => {
            const all = list.map(reactorName);
            const shown = all.length > MAX_NAMES ? [...all.slice(0, 2), `${all.length - 2} autres`] : all;
            return (
              <span key={kind} className="inline-flex items-center gap-1" aria-label={`${label} : ${all.join(', ')}`}>
                <Icon size={13} aria-hidden="true" />
                <span>{shown.join(', ')}</span>
              </span>
            );
          })}
        </div>
      )}

      {showBar && (
        <div role="group" aria-label="Réagir" className="-ml-3 mt-0.5 flex items-center">
          {REACTIONS.map(({ kind, Icon, fillable, label, short }) => {
            const list = entry.reactions?.[kind] || [];
            const mine = list.some((reactor) => reactor.mine);
            const names = list.map(reactorName).join(', ');
            return (
              <button
                key={kind}
                type="button"
                aria-pressed={mine}
                aria-label={names ? `${label} (${names})` : label}
                title={names || label}
                onClick={() => onReact(entry.activityId, kind, !mine)}
                className="flex min-h-10 items-center justify-center gap-1.5 rounded-full px-3 font-outfit text-[13px] font-semibold transition-transform active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
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
      )}
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
      <div className="flex gap-3">
        <FriendAvatar
          name={isMe ? userName : entry.name}
          url={isMe ? userAvatar : entry.avatarUrl}
          size={36}
        />

        <div className="min-w-0 flex-1 text-left">
          <p className="flex items-baseline gap-1 font-outfit text-[13px] text-[var(--theme-text-secondary)]">
            <span className="min-w-0 truncate font-bold text-[var(--theme-text)]">
              {isMe ? 'Toi' : entry.name}
            </span>
            <span className="shrink-0">
              {isMe ? 'as vu' : 'a vu'}
              {when && ` · ${when}`}
            </span>
          </p>

          <PostText comment={entry.comment} className="mt-1" />

          <FilmRow film={group.film} posters={group.posters} className="mt-2.5">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <RatingBadge entry={entry} />
              {!isMe && (
                <span className="font-outfit text-[11px] text-[var(--theme-text-secondary)]">
                  Pas encore vu par toi
                </span>
              )}
            </div>
          </FilmRow>

          <ReactionFooter entry={entry} onReact={onReact} canReact={!isMe} />
        </div>
      </div>
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
      <p className="text-left font-outfit text-[13px] leading-snug text-[var(--theme-text-secondary)]">
        <span className="font-bold text-[var(--theme-text)]">{label}</span>{' '}
        {hasMe ? 'avez vu ce film' : 'ont vu ce film'}
      </p>

      <FilmRow film={group.film} posters={group.posters} className="mt-2.5">
        {average !== null && (
          <div className="flex items-baseline gap-2">
            <span
              className="font-galinoy text-[28px] italic leading-none"
              style={{ color: 'var(--theme-accent)' }}
            >
              {formatScore(average, ratingScale)}
            </span>
            <span className="font-outfit text-[11px] text-[var(--theme-text-secondary)]">
              /{ratingScale} · moyenne du groupe
            </span>
          </div>
        )}
      </FilmRow>

      {/* Entrées à plat : pas de carte, juste un fond pleine largeur pour la mienne */}
      <ul className="-mx-4 mt-2">
        {entries.map((entry) => {
          const isMe = entry.who === 'me';
          const when = formatWatched(entry.watchedOn);
          return (
            <li
              key={entry.id}
              className="flex gap-2.5 px-4 py-2"
              style={isMe ? { background: MINE_TINT } : undefined}
            >
              <FriendAvatar
                name={isMe ? userName : entry.name}
                url={isMe ? userAvatar : entry.avatarUrl}
                size={28}
              />
              <div className="min-w-0 flex-1 text-left">
                <div className="flex items-center gap-2">
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
                <PostText comment={entry.comment} className="mt-1 !text-[13px]" />
                <ReactionFooter entry={entry} onReact={onReact} canReact={!isMe} />
              </div>
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