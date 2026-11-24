// Calculs purs pour l'onglet « Comparer » : instantané de statistiques et comparaison entre deux profils.

const GENERIC_GENRE = 'Cinéma'; // genre par défaut quand TMDB n'a rien renvoyé : ignoré dans les stats
const MAX_GENRES = 40;
const MAX_FILMS = 3000;

/* ─── Utilitaires ─────────────────────────────────────────────────── */
export const parseNote = (value) => {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  const n = Number(raw.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

// Le journal stocke « JJ/MM/AAAA » ; le serveur attend « AAAA-MM-JJ ».
export const toIsoDate = (value) => {
  const m = String(value || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : null;
};

export const normalizeTitle = (title) =>
  String(title || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .slice(0, 120);

// « 2h15 » → 135 ; « --h-- » → 0
const parseMinutes = (value) => {
  const m = String(value || '').match(/(\d{1,2})\s*h\s*(\d{2})?/i);
  return m ? Number(m[1]) * 60 + Number(m[2] || 0) : 0;
};

/* ─── Instantané de MES statistiques ──────────────────────────────── */
export function computeStats(historyData, ratingScale) {
  const rows = Array.isArray(historyData) ? historyData : [];
  const genres = {};
  const byYear = {};
  const unique = new Map();
  let ratedFilms = 0;
  let ratioSum = 0;
  let coupsDeCoeur = 0;
  let totalMinutes = 0;

  for (const film of rows) {
    const iso = toIsoDate(film?.date);
    if (iso) {
      const year = iso.slice(0, 4);
      byYear[year] = (byYear[year] || 0) + 1;
    }

    const genre = String(film?.genre || '').trim();
    if (genre && genre !== GENERIC_GENRE) genres[genre] = (genres[genre] || 0) + 1;

    if (film?.coupDeCoeur) coupsDeCoeur += 1;
    totalMinutes += parseMinutes(film?.duree);

    const rating = parseNote(film?.note);
    if (rating === null || rating < 0 || rating > ratingScale) continue;
    const ratio = rating / ratingScale;
    ratedFilms += 1;
    ratioSum += ratio;

    // Liste compacte pour « films en commun » : un film vu deux fois ne compte qu'une fois (le plus récent)
    const normalized = normalizeTitle(film?.titre);
    if (!normalized) continue;
    const previous = unique.get(normalized);
    if (!previous || (iso || '') >= previous.iso) {
      unique.set(normalized, {
        iso: iso || '',
        k: film.tmdbId ? `t${film.tmdbId}` : null,
        n: normalized,
        t: String(film.titre).slice(0, 200),
        r: Math.round(ratio * 1000) / 1000,
        h: Boolean(film.coupDeCoeur),
      });
    }
  }

  const topGenres = Object.fromEntries(
    Object.entries(genres).sort((a, b) => b[1] - a[1]).slice(0, MAX_GENRES)
  );

  return {
    stats: {
      totalFilms: rows.length,
      ratedFilms,
      avgRatio: ratedFilms ? Math.round((ratioSum / ratedFilms) * 10000) / 10000 : null,
      coupsDeCoeur,
      totalMinutes,
      genres: topGenres,
      byYear,
    },
    films: [...unique.values()]
      .slice(0, MAX_FILMS)
      .map(({ k, n, t, r, h }) => ({ k, n, t, r, h })),
  };
}

/* ─── Comparaison ─────────────────────────────────────────────────── */
const shares = (genres) => {
  const entries = Object.entries(genres || {});
  const total = entries.reduce((sum, [, count]) => sum + count, 0);
  const out = {};
  if (!total) return out;
  entries.forEach(([genre, count]) => {
    out[genre] = count / total;
  });
  return out;
};

const pct = (value) => Math.round(value * 100);

export const formatScore = (ratio, scale) => String(Math.round(ratio * scale * 10) / 10).replace('.', ',');

// « de comédie », « d’action »
const deGenre = (genre) => {
  const lower = genre.toLowerCase();
  return /^[aeiouyàâäéèêëîïôöùûüh]/.test(lower) ? `d’${lower}` : `de ${lower}`;
};

const plural = (n, word) => `${n} ${word}${n > 1 ? 's' : ''}`;

const MATCH_LABELS = [
  [0.75, 'Âmes sœurs de cinéma'],
  [0.55, 'Belle entente'],
  [0.35, 'Goûts complémentaires'],
  [0, 'Pôles opposés'],
];

/**
 * @param mine, theirs  objets « stats » (voir computeStats)
 * @param common        [{ title, mine, theirs, mineHeart, theirsHeart }] (notes en ratio 0..1)
 */
export function buildComparison({ mine, theirs, common = [], ratingScale, friendName }) {
  const name = friendName || 'ton ami';
  const year = String(new Date().getFullYear());

  /* Affinité : recouvrement des genres, affiné par l'accord sur les films en commun */
  const mineShares = shares(mine.genres);
  const theirShares = shares(theirs.genres);
  const genreNames = [...new Set([...Object.keys(mineShares), ...Object.keys(theirShares)])];
  const hasGenres = Object.keys(mineShares).length > 0 && Object.keys(theirShares).length > 0;
  const overlap = genreNames.reduce(
    (sum, genre) => sum + Math.min(mineShares[genre] || 0, theirShares[genre] || 0),
    0
  );
  const agreement = common.length >= 3
    ? common.reduce((sum, film) => sum + (1 - Math.abs(film.mine - film.theirs)), 0) / common.length
    : null;

  let score = null;
  if (hasGenres) score = agreement === null ? overlap : 0.6 * overlap + 0.4 * agreement;
  else if (agreement !== null) score = agreement;
  const label = score === null ? '' : MATCH_LABELS.find(([min]) => score >= min)[1];

  /* Face à face */
  const rows = [
    { id: 'films', label: 'Films vus', a: mine.totalFilms, b: theirs.totalFilms, fmt: String },
    { id: 'year', label: `En ${year}`, a: mine.byYear?.[year] || 0, b: theirs.byYear?.[year] || 0, fmt: String },
    mine.avgRatio !== null && theirs.avgRatio !== null && {
      id: 'avg',
      label: `Note moyenne (sur ${ratingScale})`,
      a: mine.avgRatio,
      b: theirs.avgRatio,
      max: 1,
      fmt: (v) => formatScore(v, ratingScale),
    },
    { id: 'hearts', label: 'Coups de cœur', a: mine.coupsDeCoeur, b: theirs.coupsDeCoeur, fmt: String },
    {
      id: 'hours',
      label: 'Temps en salle',
      a: Math.round(mine.totalMinutes / 60),
      b: Math.round(theirs.totalMinutes / 60),
      fmt: (v) => `${v} h`,
    },
  ]
    .filter(Boolean)
    .filter((row) => row.a > 0 || row.b > 0)
    .map((row) => ({ ...row, fmtA: row.fmt(row.a), fmtB: row.fmt(row.b) }));

  /* Genres : les 6 plus présents chez l'un ou l'autre */
  const genreRows = [...genreNames]
    .sort((x, y) => (mineShares[y] || 0) + (theirShares[y] || 0) - ((mineShares[x] || 0) + (theirShares[x] || 0)))
    .slice(0, 6)
    .map((genre) => ({
      id: genre,
      label: genre,
      a: mineShares[genre] || 0,
      b: theirShares[genre] || 0,
      max: Math.max(mineShares[genre] || 0, theirShares[genre] || 0),
      fmtA: `${pct(mineShares[genre] || 0)} %`,
      fmtB: `${pct(theirShares[genre] || 0)} %`,
    }));

  /* En bref : phrases */
  const insights = [];

  [...genreNames]
    .map((genre) => ({ genre, diff: (mineShares[genre] || 0) - (theirShares[genre] || 0) }))
    .filter(({ diff }) => Math.abs(diff) >= 0.08)
    .sort((x, y) => Math.abs(y.diff) - Math.abs(x.diff))
    .slice(0, 2)
    .forEach(({ genre, diff }) => {
      const a = pct(mineShares[genre] || 0);
      const b = pct(theirShares[genre] || 0);
      insights.push(
        diff > 0
          ? `Tu regardes plus ${deGenre(genre)} que ${name} (${a} % contre ${b} %).`
          : `${name} regarde plus ${deGenre(genre)} que toi (${b} % contre ${a} %).`
      );
    });

  if (mine.ratedFilms >= 5 && theirs.ratedFilms >= 5 && mine.avgRatio !== null && theirs.avgRatio !== null) {
    const diff = mine.avgRatio - theirs.avgRatio;
    if (Math.abs(diff) >= 0.04) {
      insights.push(
        `Tu notes plus ${diff > 0 ? 'généreusement' : 'sévèrement'} que ${name} (${formatScore(mine.avgRatio, ratingScale)} contre ${formatScore(theirs.avgRatio, ratingScale)} de moyenne, sur ${ratingScale}).`
      );
    } else {
      insights.push(`Vous notez à peu près de la même façon, ${name} et toi.`);
    }
  }

  const mineYear = mine.byYear?.[year] || 0;
  const theirYear = theirs.byYear?.[year] || 0;
  if (mineYear || theirYear) {
    insights.push(`Tu as vu ${plural(mineYear, 'film')} en ${year}, contre ${theirYear} pour ${name}.`);
  }

  const commonSorted = [...common].sort(
    (x, y) => Math.abs(y.mine - y.theirs) - Math.abs(x.mine - x.theirs)
  );
  if (commonSorted.length > 0) {
    insights.push(`Vous avez ${plural(commonSorted.length, 'film')} en commun.`);
    const top = commonSorted[0];
    if (Math.abs(top.mine - top.theirs) >= 0.3) {
      insights.push(
        `Plus gros désaccord : « ${top.title} » (toi ${formatScore(top.mine, ratingScale)}, ${name} ${formatScore(top.theirs, ratingScale)}).`
      );
    }
  }

  return { score, label, rows, genreRows, insights, commonSorted };
}