import { useEffect, useState } from 'react';
import { Film, Heart, PopcornIcon, ThumbsDown, ThumbsUp } from 'lucide-react';
import { fetchTmdbPoster } from '../communityApi';
import { formatScore } from '../communityStats';
import { FriendAvatar, Skeleton } from './communityUi';

/*
 * Contrat attendu (réactions PAR POST) :
 *   group.reactions = { like: [...], dislike: [...], watch: [...] }   // reactors : { mine, friendCode, displayName, avatarUrl }
 *   onReact(group, kind, active)                                      // active = true pour ajouter, false pour retirer
 */

/* ─── Constantes & formats ────────────────────────────────────────── */
const POST = 'border-b-4 border-[var(--theme-bg)] bg-[var(--theme-surface)] px-4 pt-3 pb-1';
const POSTER_SIZE = 'h-[72px] w-12 shrink-0 rounded-md';
const BUBBLE = 'color-mix(in srgb, var(--theme-text) 7%, var(--theme-surface))';
const MINE_BUBBLE = 'color-mix(in srgb, var(--theme-accent) 14%, var(--theme-surface))';
const MAX_NAMES = 3;
const MAX_AVATARS = 3;

const REACTIONS = [
  { kind: 'like', Icon: ThumbsUp, fillable: true, label: 'J’aime', short: '' },
  { kind: 'dislike', Icon: ThumbsDown, fillable: true, label: 'Je n’aime pas', short: '' },
  { kind: 'watch', Icon: PopcornIcon, fillable: false, label: 'À voir', short: 'À voir' },
];

// Conjugaisons : un ami · plusieurs amis · moi seul · moi + d'autres
const VERBS = {
  like: { one: 'a aimé', many: 'ont aimé', you: 'as aimé', youAnd: 'avez aimé' },
  dislike: { one: 'n’a pas aimé', many: 'n’ont pas aimé', you: 'n’as pas aimé', youAnd: 'n’avez pas aimé' },
  watch: { one: 'veut voir', many: 'veulent voir', you: 'veux voir', youAnd: 'voulez voir' },
};

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

const joinNames = (names) =>
  names.length > 1 ? `${names.slice(0, -1).join(', ')} et ${names[names.length - 1]}` : names[0];

/* « Léa, Tom et 2 autres ont aimé ce film » */
function reactionSentence(kind, list) {
  const verbs = VERBS[kind];
  const mine = list.some((reactor) => reactor.mine);
  const others = list.filter((reactor) => !reactor.mine).map((reactor) => reactor.displayName || 'Un ami');
  const total = list.length;

  if (mine && others.length === 0) return `Tu ${verbs.you} ce film`;

  const names = total <= MAX_NAMES
    ? [...others, ...(mine ? ['toi'] : [])]
    : [...others.slice(0, 2), `${total - 2} autres`];
  const verb = total > MAX_NAMES ? verbs.many : mine ? verbs.youAnd : total > 1 ? verbs.many : verbs.one;
  return `${joinNames(names)} ${verb} ce film`;
}

/* ─── Skeleton ────────────────────────────────────────────────────── */
export function FeedSkeleton({ rows = 3 }) {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Chargement du fil d’actualité…</span>
      <ul className="-mx-4">
        {Array.from({ length: rows }, (_, i) => (
          <li key={i} aria-hidden="true" className={POST}>
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-24 rounded-full" />
                <Skeleton className="h-3 w-36 rounded-full" />
              </div>
            </div>
            <div className="mt-2.5 flex gap-3">
              <Skeleton className={POSTER_SIZE} />
              <div className="flex-1 space-y-2 pt-2">
                <Skeleton className="h-4 w-3/4 rounded-full" />
                <Skeleton className="h-3 w-1/3 rounded-full" />
              </div>
            </div>
            <div className="mt-2 flex gap-2">
              <Skeleton className="h-7 w-7 shrink-0 rounded-full" />
              <Skeleton className="h-12 w-2/3 rounded-2xl" />
            </div>
            <Skeleton className="mt-3 h-10 w-full rounded-full" />
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

/* Pile d'avatars qui se chevauchent */
function AvatarStack({ people, size }) {
  return (
    <div className="flex shrink-0">
      {people.slice(0, MAX_AVATARS).map((person, index) => (
        <span key={person.key} className={index > 0 ? (size >= 32 ? '-ml-3' : '-ml-1.5') : ''}>
          <span className="block rounded-full ring-2 ring-[var(--theme-surface)]">
            <FriendAvatar name={person.name} url={person.url} size={size} />
          </span>
        </span>
      ))}
    </div>
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

/* Film : affiche + titre + genre (+ contenu libre), sans cadre */
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

/* Commentaire façon Facebook : avatar + bulle (nom, note, texte) + date */
function Comment({ entry, userName, userAvatar, showWhen = true }) {
  const isMe = entry.who === 'me';
  const when = showWhen ? formatWatched(entry.watchedOn) : '';
  return (
    <li className="mt-2 flex gap-2 first:mt-0">
      <FriendAvatar
        name={isMe ? userName : entry.name}
        url={isMe ? userAvatar : entry.avatarUrl}
        size={28}
      />
      <div className="min-w-0 text-left">
        <div
          className="rounded-2xl px-3 py-2"
          style={{ background: isMe ? MINE_BUBBLE : BUBBLE }}
        >
          <div className="flex items-center gap-2">
            <span className="min-w-0 truncate font-outfit text-[13px] font-bold text-[var(--theme-text)]">
              {isMe ? 'Toi' : entry.name}
            </span>
            <RatingBadge entry={entry} />
          </div>
          {entry.comment && (
            <p className="mt-0.5 whitespace-pre-line break-words font-outfit text-[13px] leading-snug text-[var(--theme-text)]">
              {entry.comment}
            </p>
          )}
        </div>
        {when && (
          <p className="pl-3 pt-0.5 font-outfit text-[11px] text-[var(--theme-text-secondary)]">{when}</p>
        )}
      </div>
    </li>
  );
}

/* Réactions du post : détail (qui ?) puis boutons. Toujours tout en bas. */
function ReactionSection({ group, userName, userAvatar, onReact, canReact }) {
  const items = REACTIONS.map((reaction) => ({ ...reaction, list: group.reactions?.[reaction.kind] || [] }));
  const lines = items.filter((item) => item.list.length > 0);

  return (
    <div className="mt-3">
      {lines.length > 0 && (
        <ul aria-label="Réactions" className="space-y-1.5 pb-2.5">
          {lines.map(({ kind, list }) => (
            <li key={kind} className="flex items-center gap-2">
              <AvatarStack
                size={20}
                people={list.map((reactor, index) => ({
                  key: reactor.mine ? 'me' : reactor.friendCode || index,
                  name: reactor.mine ? userName : reactor.displayName,
                  url: reactor.mine ? userAvatar : reactor.avatarUrl,
                }))}
              />
              <p className="min-w-0 text-left font-outfit text-[12px] leading-snug text-[var(--theme-text-secondary)]">
                {reactionSentence(kind, list)}
              </p>
            </li>
          ))}
        </ul>
      )}

      {canReact ? (
        <div className="border-t border-[var(--theme-border)] pt-0.5">
          <div role="group" aria-label="Réagir" className="-ml-3 flex">
            {items.map(({ kind, Icon, fillable, label, short, list }) => {
              const mine = list.some((reactor) => reactor.mine);
              const names = list.map(reactorName).join(', ');
              return (
                <button
                  key={kind}
                  type="button"
                  aria-pressed={mine}
                  aria-label={names ? `${label} (${names})` : label}
                  title={names || label}
                  onClick={() => onReact(group, kind, !mine)}
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
        </div>
      ) : (
        lines.length === 0 && <div className="h-2" />
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
      <div className="flex items-center gap-3">
        <FriendAvatar
          name={isMe ? userName : entry.name}
          url={isMe ? userAvatar : entry.avatarUrl}
          size={36}
        />
        <div className="min-w-0 flex-1 text-left">
          <p className="truncate font-outfit text-[14px] font-bold leading-snug text-[var(--theme-text)]">
            {isMe ? 'Toi' : entry.name}
          </p>
          <p className="font-outfit text-[12px] text-[var(--theme-text-secondary)]">
            {isMe ? '' : 'a vu un film'}
            {when && ` · ${when}`}
          </p>
        </div>
      </div>

      <FilmRow film={group.film} posters={group.posters} className="mt-2.5">
        {!isMe && (
          <p className="font-outfit text-[11px] text-[var(--theme-text-secondary)]">Tu ne l'as pas encore vu</p>
        )}
      </FilmRow>

      <ul className="mt-2.5">
        <Comment entry={entry} userName={userName} userAvatar={userAvatar} showWhen={false} />
      </ul>

      <ReactionSection
        group={group}
        userName={userName}
        userAvatar={userAvatar}
        onReact={onReact}
        canReact={!isMe}
      />
    </li>
  );
}

/* ─── Post : film vu par plusieurs personnes ──────────────────────── */
function SharedPost({ group, userName, userAvatar, ratingScale, onReact }) {
  const { entries } = group;
  const hasMe = entries.some((entry) => entry.who === 'me');
  const when = formatWatched(group.latest);

  // « Léa, Tom et toi » · « ont vu ce film »
  const friends = entries.filter((entry) => entry.who !== 'me').map((entry) => entry.name);
  const shown = friends.slice(0, 2);
  const rest = friends.length - shown.length;
  const parts = [...shown];
  if (rest > 0) parts.push(`${rest} autre${rest > 1 ? 's' : ''}`);
  if (hasMe) parts.push('toi');
  const label = joinNames(parts);

  // Moyenne du groupe, ramenée à l'échelle de l'utilisateur
  const rated = entries.filter((entry) => entry.rating !== null && entry.rating !== undefined && entry.scale > 0);
  const average = rated.length >= 2
    ? rated.reduce((sum, entry) => sum + entry.rating / entry.scale, 0) / rated.length
    : null;

  return (
    <li className={POST}>
      <div className="flex items-center gap-3">
        <AvatarStack
          size={36}
          people={entries.map((entry) => ({
            key: entry.id,
            name: entry.who === 'me' ? userName : entry.name,
            url: entry.who === 'me' ? userAvatar : entry.avatarUrl,
          }))}
        />
        <div className="min-w-0 flex-1 text-left">
          <p className="truncate font-outfit text-[14px] font-bold leading-snug text-[var(--theme-text)]">
            {label}
          </p>
          <p className="font-outfit text-[12px] text-[var(--theme-text-secondary)]">
            {hasMe ? 'avez vu ce film' : 'ont vu ce film'}
            {when && ` · ${when}`}
          </p>
        </div>
      </div>

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

      <ul className="mt-2.5">
        {entries.map((entry) => (
          <Comment key={entry.id} entry={entry} userName={userName} userAvatar={userAvatar} />
        ))}
      </ul>

      <ReactionSection
        group={group}
        userName={userName}
        userAvatar={userAvatar}
        onReact={onReact}
        canReact
      />
    </li>
  );
}

export function FeedGroup({ group, userName, userAvatar, ratingScale, onReact }) {
  return group.kind === 'shared'
    ? <SharedPost group={group} userName={userName} userAvatar={userAvatar} ratingScale={ratingScale} onReact={onReact} />
    : <SinglePost group={group} userName={userName} userAvatar={userAvatar} onReact={onReact} />;
}