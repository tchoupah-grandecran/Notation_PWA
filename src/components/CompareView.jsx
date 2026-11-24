import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Heart, Sparkles, Users } from 'lucide-react';
import { compareWithFriend, syncActivity } from '../communityApi';
import { buildComparison, computeStats, formatScore } from '../communityStats';
import { EmptyState, FriendAvatar, Skeleton } from './communityUi';

const COMMON_PREVIEW = 8;
const CARD = 'rounded-[20px] border border-[var(--theme-border)] bg-[var(--theme-surface)]';
const MUTED_BAR = 'color-mix(in srgb, var(--theme-text) 28%, transparent)';

const SectionLabel = ({ children }) => (
  <h3 className="mb-2 ml-5 font-outfit text-[10px] font-black uppercase tracking-[0.2em] opacity-30">{children}</h3>
);

/* ─── Anneau d'affinité ───────────────────────────────────────────── */
function MatchRing({ score }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(score));
    return () => cancelAnimationFrame(frame);
  }, [score]);

  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="relative h-32 w-32" role="img" aria-label={`Affinité de ${Math.round(score * 100)} pour cent`}>
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle
          cx="50" cy="50" r={radius} fill="none" strokeWidth="7"
          style={{ stroke: 'color-mix(in srgb, var(--theme-text) 10%, transparent)' }}
        />
        <circle
          cx="50" cy="50" r={radius} fill="none" strokeWidth="7" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - shown)}
          style={{ stroke: 'var(--theme-accent)', transition: 'stroke-dashoffset 900ms cubic-bezier(0.22, 1, 0.36, 1)' }}
        />
      </svg>
      <span
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center font-galinoy text-[34px] italic text-[var(--theme-text)]"
      >
        {Math.round(score * 100)}%
      </span>
    </div>
  );
}

/* ─── Ligne « face à face » : valeur · barres opposées · valeur ───── */
function VersusRow({ row }) {
  const max = row.max ?? Math.max(row.a, row.b, 1);
  const widthA = Math.min(100, (row.a / max) * 100);
  const widthB = Math.min(100, (row.b / max) * 100);
  const aWins = row.a >= row.b;
  const bWins = row.b >= row.a;

  return (
    <li className="px-4 py-3">
      <p className="mb-1.5 text-center font-outfit text-[11px] text-[var(--theme-text-secondary)]">{row.label}</p>
      <div className="flex items-center gap-3">
        <span
          className="w-14 text-right font-outfit text-[13px] font-bold tabular-nums"
          style={{ color: aWins ? 'var(--theme-accent)' : 'var(--theme-text)' }}
        >
          {row.fmtA}
        </span>
        <div
          className="flex h-1.5 flex-1 overflow-hidden rounded-full"
          style={{ background: 'color-mix(in srgb, var(--theme-text) 8%, transparent)' }}
          aria-hidden="true"
        >
          <div className="flex w-1/2 justify-end">
            <div
              className="h-full rounded-l-full transition-all duration-700"
              style={{ width: `${widthA}%`, background: aWins ? 'var(--theme-accent)' : MUTED_BAR }}
            />
          </div>
          <div className="flex w-1/2 justify-start">
            <div
              className="h-full rounded-r-full transition-all duration-700"
              style={{ width: `${widthB}%`, background: bWins ? 'var(--theme-accent)' : MUTED_BAR }}
            />
          </div>
        </div>
        <span
          className="w-14 text-left font-outfit text-[13px] font-bold tabular-nums"
          style={{ color: bWins ? 'var(--theme-accent)' : 'var(--theme-text)' }}
        >
          {row.fmtB}
        </span>
      </div>
    </li>
  );
}

function CompareSkeleton() {
  return (
    <div role="status" aria-live="polite" className="space-y-5">
      <span className="sr-only">Chargement de la comparaison…</span>
      <div aria-hidden="true" className={`${CARD} flex flex-col items-center gap-3 p-6`}>
        <Skeleton className="h-32 w-32 rounded-full" />
        <Skeleton className="h-5 w-44 rounded-full" />
        <Skeleton className="h-3 w-56 rounded-full" />
      </div>
      <div aria-hidden="true" className={`${CARD} space-y-4 p-4`}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="mx-auto h-3 w-24 rounded-full" />
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Vue principale ──────────────────────────────────────────────── */
export function CompareView({ friends, userName, userAvatar, historyData, ratingScale, onOpenShare }) {
  const [selected, setSelected] = useState(null);
  const [results, setResults] = useState({}); // { [friendCode]: { status, data?, error? } }
  const [showAllCommon, setShowAllCommon] = useState(false);
  const requestedRef = useRef(new Set());

  // Toujours avoir un ami sélectionné valide
  useEffect(() => {
    if (friends.length === 0) {
      setSelected(null);
    } else if (!friends.some((friend) => friend.friendCode === selected)) {
      setSelected(friends[0].friendCode);
    }
  }, [friends, selected]);

  const load = useCallback(async (friendCode) => {
    setResults((current) => ({ ...current, [friendCode]: { status: 'loading' } }));
    try {
      // S'assure que mon instantané est à jour côté serveur avant de comparer (sans effet si rien n'a changé)
      try {
        await syncActivity(historyData, ratingScale);
      } catch {
        /* la comparaison reste possible avec l'ancien instantané */
      }
      const data = await compareWithFriend(friendCode);
      setResults((current) => ({ ...current, [friendCode]: { status: 'ready', data } }));
    } catch (err) {
      console.error('Erreur comparaison :', err);
      setResults((current) => ({
        ...current,
        [friendCode]: { status: 'error', error: err.message || 'Impossible de charger la comparaison.' },
      }));
    }
  }, [historyData, ratingScale]);

  useEffect(() => {
    if (selected && !requestedRef.current.has(selected)) {
      requestedRef.current.add(selected);
      void load(selected);
    }
  }, [selected, load]);

  useEffect(() => {
    setShowAllCommon(false);
  }, [selected]);

  const friend = friends.find((f) => f.friendCode === selected) || null;
  const friendName = friend?.displayName || 'Ton ami';
  const result = selected ? results[selected] : null;
  const mine = useMemo(() => computeStats(historyData, ratingScale).stats, [historyData, ratingScale]);

  const comparison = useMemo(() => {
    if (result?.status !== 'ready' || !result.data.stats || mine.totalFilms === 0) return null;
    return buildComparison({
      mine,
      theirs: result.data.stats,
      common: result.data.common || [],
      ratingScale,
      friendName,
    });
  }, [result, mine, ratingScale, friendName]);

  /* Aucun ami */
  if (friends.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Personne à comparer"
        text="Ajoute un ami pour comparer vos goûts, vos notes et vos films en commun."
        action={
          <button
            type="button"
            onClick={onOpenShare}
            className="mt-6 min-h-12 rounded-full border-2 border-transparent px-6 font-outfit text-[10px] font-black uppercase tracking-widest active:scale-95 transition-transform"
            style={{
              background: 'linear-gradient(var(--theme-action-bg), var(--theme-action-bg)) padding-box, var(--theme-accent-gradient) border-box',
              color: 'var(--theme-action-ink)',
            }}
          >
            Ajouter un ami
          </button>
        }
      />
    );
  }

  const renderBody = () => {
    if (!result || result.status === 'loading') return <CompareSkeleton />;

    if (result.status === 'error') {
      return (
        <div className={`${CARD} p-5 text-center`} role="alert">
          <p className="mb-4 font-outfit text-[13px] text-red-500">{result.error}</p>
          <button
            type="button"
            onClick={() => void load(selected)}
            className="min-h-11 rounded-full border-2 border-transparent px-5 font-outfit text-[10px] font-black uppercase tracking-widest active:scale-95 transition-transform"
            style={{
              background: 'linear-gradient(var(--theme-action-bg), var(--theme-action-bg)) padding-box, var(--theme-accent-gradient) border-box',
              color: 'var(--theme-action-ink)',
            }}
          >
            Réessayer
          </button>
        </div>
      );
    }

    if (mine.totalFilms === 0) {
      return (
        <EmptyState
          icon={Sparkles}
          title="Ton journal est vide"
          text="Note quelques séances, puis reviens comparer tes stats."
        />
      );
    }

    if (!result.data.stats) {
      return (
        <EmptyState
          icon={Sparkles}
          title="Stats pas encore partagées"
          text={`${friendName} n’a pas encore synchronisé ses statistiques. Elles apparaîtront dès qu’il ou elle ouvrira l’onglet Amis dans la dernière version.`}
        />
      );
    }

    if (!comparison) return <CompareSkeleton />;

    const commonShown = showAllCommon ? comparison.commonSorted : comparison.commonSorted.slice(0, COMMON_PREVIEW);

    return (
      <div className="space-y-7">
        {/* Affinité */}
        {comparison.score !== null && (
          <div className={`${CARD} flex flex-col items-center px-6 py-6 text-center`}>
            <MatchRing score={comparison.score} />
            <p className="mt-3 font-galinoy text-[22px] italic text-[var(--theme-text)]">{comparison.label}</p>
            <p className="mt-1 max-w-[30ch] font-outfit text-[11px] leading-relaxed text-[var(--theme-text-secondary)]">
              Affinité avec {friendName}, d’après vos genres préférés et vos notes sur les films en commun.
            </p>
          </div>
        )}

        {/* En bref */}
        {comparison.insights.length > 0 && (
          <div>
            <SectionLabel>En bref</SectionLabel>
            <ul className={`${CARD} space-y-3 p-4`}>
              {comparison.insights.map((sentence) => (
                <li key={sentence} className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: 'var(--theme-accent)' }}
                  />
                  <p className="font-outfit text-[13px] leading-relaxed text-[var(--theme-text)]">{sentence}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Face à face */}
        {comparison.rows.length > 0 && (
          <div>
            <SectionLabel>Face à face</SectionLabel>
            <div className={`${CARD} overflow-hidden`}>
              <div className="flex items-center justify-between border-b border-[var(--theme-border)] px-4 py-3">
                <div className="flex min-w-0 items-center gap-2">
                  <FriendAvatar name={userName} url={userAvatar} size={26} />
                  <span className="font-outfit text-[12px] font-bold text-[var(--theme-text)]">Toi</span>
                </div>
                <div className="flex min-w-0 items-center gap-2">
                  <span className="truncate font-outfit text-[12px] font-bold text-[var(--theme-text)]">{friendName}</span>
                  <FriendAvatar name={friend?.displayName} url={friend?.avatarUrl} size={26} />
                </div>
              </div>
              <ul className="divide-y divide-[var(--theme-border)]">
                {comparison.rows.map((row) => <VersusRow key={row.id} row={row} />)}
              </ul>
            </div>
          </div>
        )}

        {/* Genres */}
        {comparison.genreRows.length > 0 && (
          <div>
            <SectionLabel>Genres</SectionLabel>
            <ul className={`${CARD} divide-y divide-[var(--theme-border)] overflow-hidden`}>
              {comparison.genreRows.map((row) => <VersusRow key={row.id} row={row} />)}
            </ul>
          </div>
        )}

        {/* Films en commun */}
        {comparison.commonSorted.length > 0 && (
          <div>
            <SectionLabel>Films en commun ({comparison.commonSorted.length})</SectionLabel>
            <ul className={`${CARD} divide-y divide-[var(--theme-border)] overflow-hidden`}>
              {commonShown.map((film, index) => {
                const same = Math.abs(film.mine - film.theirs) < 0.1;
                return (
                  <li key={`${film.title}|${index}`} className="px-4 py-3">
                    <p className="break-words font-outfit text-[14px] font-semibold leading-snug text-[var(--theme-text)]">
                      {film.title}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1.5 font-outfit text-[11px] text-[var(--theme-text-secondary)]">
                      <span
                        className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-black"
                        style={{ borderColor: 'var(--theme-accent)', color: 'var(--theme-accent)' }}
                      >
                        Toi {formatScore(film.mine, ratingScale)}/{ratingScale}
                        {film.mineHeart && <Heart size={10} fill="currentColor" aria-label="Coup de cœur" />}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-[var(--theme-border)] px-2 py-0.5 text-[10px] font-black text-[var(--theme-text)]">
                        {friendName} {formatScore(film.theirs, ratingScale)}/{ratingScale}
                        {film.theirsHeart && <Heart size={10} fill="currentColor" aria-label="Coup de cœur" />}
                      </span>
                      {same && <span>· même avis</span>}
                    </div>
                  </li>
                );
              })}
            </ul>
            {comparison.commonSorted.length > COMMON_PREVIEW && (
              <button
                type="button"
                onClick={() => setShowAllCommon((value) => !value)}
                className="mx-auto mt-3 flex min-h-11 items-center rounded-full px-5 font-outfit text-[10px] font-black uppercase tracking-widest text-[var(--theme-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
              >
                {showAllCommon ? 'Réduire' : `Voir les ${comparison.commonSorted.length} films`}
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Choix de l'ami (défilement horizontal : exclu du balayage entre vues) */}
      <div
        data-no-swipe
        role="radiogroup"
        aria-label="Comparer avec"
        className="scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4 pb-1"
      >
        {friends.map((f) => {
          const isActive = f.friendCode === selected;
          return (
            <button
              key={f.friendCode}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => setSelected(f.friendCode)}
              className="flex min-h-11 shrink-0 items-center gap-2 rounded-full border py-1 pl-1.5 pr-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
              style={{
                borderColor: isActive ? 'var(--theme-accent)' : 'var(--theme-border)',
                background: isActive
                  ? 'color-mix(in srgb, var(--theme-accent) 10%, var(--theme-surface))'
                  : 'var(--theme-surface)',
              }}
            >
              <FriendAvatar name={f.displayName} url={f.avatarUrl} size={30} />
              <span
                className="font-outfit text-[12px] font-bold text-[var(--theme-text)]"
                style={{ opacity: isActive ? 1 : 0.6 }}
              >
                {f.displayName || 'Cinéphile'}
              </span>
            </button>
          );
        })}
      </div>

      {renderBody()}
    </div>
  );
}