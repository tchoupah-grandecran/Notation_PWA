import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Layers, Film, Ticket, Sparkles, Star, Download } from 'lucide-react';
import ShareReview from '../components/ShareReview';
import '../Studio.css';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTES DU RECAP MENSUEL
// ─────────────────────────────────────────────────────────────────────────────
const RW_TOTAL = 6;
const MONTH_NAMES = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const SLIDE_NAMES = ['Intro', 'Films', 'Stats', 'Genres', 'Top / Flop', 'Profil'];

// URL IMGUR DU LOGO INSTAGRAM
const INSTA_LOGO_URL = 'https://i.imgur.com/aJWAYr7.png';

// ─────────────────────────────────────────────────────────────────────────────
// IMAGE LOADING
// ─────────────────────────────────────────────────────────────────────────────
function loadImgElement(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload  = () => resolve(img);
    img.onerror = () => resolve(null);
    img.crossOrigin = 'anonymous';
    img.src = src;
  });
}

async function loadImageForCanvas(originalUrl) {
  if (!originalUrl) return null;
  if (originalUrl.startsWith('data:') || originalUrl.startsWith('blob:') || originalUrl.startsWith('/'))
    return loadImgElement(originalUrl);

  try {
    const resp = await fetch(originalUrl, { mode: 'cors', cache: 'force-cache' });
    if (resp.ok) return loadImgElement(URL.createObjectURL(await resp.blob()));
  } catch (_) {}

  const proxyBase = import.meta.env.DEV ? '/tmdb-proxy' : '/api/proxy-image';
  try {
    const resp = await fetch(`${proxyBase}?url=${encodeURIComponent(originalUrl)}`, { cache: 'force-cache' });
    if (resp.ok) return loadImgElement(URL.createObjectURL(await resp.blob()));
  } catch (_) {}

  return null;
}

async function ensureFontsLoaded() {
  await document.fonts.ready;
  const fontsToLoad = [
    '800 10px "Syne"', '900 10px "Syne"',
    '400 10px "DM Sans"', '500 10px "DM Sans"', '600 10px "DM Sans"', '700 10px "DM Sans"', '800 10px "DM Sans"',
  ];
  for (const font of fontsToLoad) {
    try { await document.fonts.load(font); }
    catch (e) { console.warn(`Erreur preload police: ${font}`); }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CANVAS UTILS
// ─────────────────────────────────────────────────────────────────────────────
function drawImageCover(ctx, img, x, y, w, h) {
  if (!img) return;
  const imgRatio    = img.naturalWidth / img.naturalHeight;
  const targetRatio = w / h;
  let sx, sy, sw, sh;
  if (imgRatio > targetRatio) {
    sh = img.naturalHeight; sw = sh * targetRatio;
    sx = (img.naturalWidth - sw) / 2; sy = 0;
  } else {
    sw = img.naturalWidth; sh = sw / targetRatio;
    sx = 0; sy = (img.naturalHeight - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r); ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r); ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r); ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r); ctx.closePath();
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && cur) { lines.push(cur); cur = w; }
    else cur = test;
  }
  if (cur) lines.push(cur);
  return lines;
}

// ─────────────────────────────────────────────────────────────────────────────
// CANVAS STAR DRAWING HELPER
// ─────────────────────────────────────────────────────────────────────────────
function drawCanvasStars(ctx, note, x, y, starSize = 18, gap = 4) {
  const scale = 5;
  const GOLD_COLOR  = '#E9B90A';
  const EMPTY_COLOR = 'rgba(255,255,255,0.15)';

  for (let i = 0; i < scale; i++) {
    const cx = x + i * (starSize + gap) + starSize / 2;
    const cy = y + starSize / 2;
    const filled = i < Math.floor(note);
    const half   = !filled && i < note;

    ctx.save();
    ctx.translate(cx, cy);
    const starPath = new Path2D('M 0 -1 L 0.29 -0.40 L 0.95 -0.31 L 0.48 0.15 L 0.59 0.81 L 0 0.50 L -0.59 0.81 L -0.48 0.15 L -0.95 -0.31 L -0.29 -0.40 Z');
    ctx.scale(starSize / 2, starSize / 2);

    if (half) {
      ctx.save(); ctx.beginPath(); ctx.rect(-1, -1, 1, 2); ctx.clip();
      ctx.fillStyle = GOLD_COLOR; ctx.fill(starPath); ctx.restore();
      ctx.save(); ctx.beginPath(); ctx.rect(0, -1, 1, 2); ctx.clip();
      ctx.fillStyle = EMPTY_COLOR; ctx.fill(starPath); ctx.restore();
    } else {
      ctx.fillStyle = filled ? GOLD_COLOR : EMPTY_COLOR;
      ctx.fill(starPath);
    }
    ctx.restore();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SVG STARS (React DOM — for slide previews)
// ─────────────────────────────────────────────────────────────────────────────
function renderStars(note, isDark = true, sizeClass = "w-[14px] h-[14px]") {
  const scale = 5;
  const stars = [];
  for (let i = 0; i < scale; i++) {
    const filled = i < Math.floor(note);
    const half   = !filled && (i < note);
    const fillStyle = filled ? '#E9B90A' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(30,30,30,0.1)');
    if (half) {
      stars.push(
        <svg key={i} viewBox="0 0 24 24" className={`${sizeClass} flex-shrink-0`}>
          <defs>
            <linearGradient id={`grad-half-${isDark}-${i}`}>
              <stop offset="50%" stopColor="#E9B90A" />
              <stop offset="50%" stopColor={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(30,30,30,0.1)'} />
            </linearGradient>
          </defs>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill={`url(#grad-half-${isDark}-${i})`} />
        </svg>
      );
    } else {
      stars.push(
        <svg key={i} viewBox="0 0 24 24" className={`${sizeClass} flex-shrink-0`}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill={fillStyle} />
        </svg>
      );
    }
  }
  return <div className="flex items-center gap-[3px]">{stars}</div>;
}

// ─────────────────────────────────────────────────────────────────────────────
// ARCHETYPES
// ─────────────────────────────────────────────────────────────────────────────
const RW_ARCHETYPES = {
  'Drame':    { high: {name:'Le\nSensible',   desc:'Tu cherches à être touché...'},      mid: {name:'Le\nLucide',     desc:"Tu acceptes que l'émotion..."},    low: {name:'Le\nSceptique',  desc:'Beaucoup de drames...'} },
  'Thriller': { high: {name:'Le\nTendu',      desc:'Tu aimes les films qui ne te lâchent pas...'}, mid: {name:"L'Enquêteur", desc:'Tu analyses, tu décortiques...'},  low: {name:'Le\nDéçu',      desc:'Beaucoup de promesses...'} },
  'Comédie':  { high: {name:'Le\nJoyeux',     desc:'Tu sors léger, tu rigoles fort...'},  mid: {name:'Le\nMitigé',    desc:'Tu souris, parfois tu ris...'},    low: {name:'Le\nDifficile',  desc:'Peu de choses te font rire...'} },
  'default':  { high: {name:"L'Éclectique",  desc:'Aucun genre ne te définit...'},       mid: {name:'Le\nVoyageur',  desc:'Tu explores sans carte...'},       low: {name:'Le\nChercheur',  desc:'Tu tâtonnes...'} },
};

function getArchetype(genre, rating, scale = 5) {
  const ratio  = scale > 0 ? rating / scale : 0;
  const bucket = ratio >= 0.72 ? 'high' : ratio >= 0.48 ? 'mid' : 'low';
  const map    = RW_ARCHETYPES[genre] || RW_ARCHETYPES['default'];
  return map[bucket];
}

// ─────────────────────────────────────────────────────────────────────────────
// MONTHLY DATA AGGREGATION
// ─────────────────────────────────────────────────────────────────────────────
function computeMonthlyRewindData(history) {
  if (!history || !Array.isArray(history)) return {};
  const monthlyData = {};

  history.forEach(film => {
    if (!film.date) return;
    let year, month;
    if (film.date.includes('/')) {
      const parts = film.date.split('/');
      if (parts.length === 3) {
        year  = parts[2].length === 2 ? '20' + parts[2] : parts[2];
        month = parts[1].padStart(2, '0');
      }
    }
    if (!year || !month) return;
    const key = `${year}-${month}`;
    if (!monthlyData[key]) monthlyData[key] = [];
    monthlyData[key].push(film);
  });

  const result = {};
  for (const monthKey in monthlyData) {
    const films = monthlyData[monthKey];
    if (!films.length) continue;

    let totalDuration = 0, totalNote = 0, totalVO = 0, filmsWithLang = 0, capucinesCount = 0, highStarCount = 0;
    let seatCount = {}, roomCount = {};
    const genreDistribution = {}, languageDistribution = {};
    let bestMovie = null, worstMovie = null;

    films.forEach(film => {
      if (film.duree) {
        const m = String(film.duree).match(/(\d+)[h:](\d+)/);
        if (m) totalDuration += parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
      }
      const noteStr = String(film.note || '').replace(',', '.').trim();
      const note    = parseFloat(noteStr) || 0;
      totalNote += note;
      if (note >= 4) highStarCount++;
      if (film.capucine || film.capucines) capucinesCount++;

      const seat = String(film.siege || '').trim();
      if (seat && seat !== '-' && seat.toLowerCase() !== 'n/a' && seat.toLowerCase() !== 'libre')
        seatCount[seat] = (seatCount[seat] || 0) + 1;

      const room = String(film.salle || '').trim();
      if (room && room !== '-' && room.toLowerCase() !== 'n/a')
        roomCount[room] = (roomCount[room] || 0) + 1;

      const lang = String(film.langue || '').toUpperCase().trim();
      if (lang && lang !== '?' && lang !== 'N/A' && lang !== '-') {
        filmsWithLang++;
        if (lang !== 'FRA' && lang !== 'VF' && lang !== 'VFQ') totalVO++;
        languageDistribution[lang] = (languageDistribution[lang] || 0) + 1;
      }
      if (film.genre) genreDistribution[film.genre] = (genreDistribution[film.genre] || 0) + 1;
      if (!bestMovie  || note > (parseFloat(String(bestMovie.note).replace(',', '.'))  || 0)) bestMovie  = film;
      if (!worstMovie || note < (parseFloat(String(worstMovie.note).replace(',', '.')) || 0)) worstMovie = film;
    });

    const seatEntries = Object.entries(seatCount).sort((a, b) => b[1] - a[1]);
    const roomEntries = Object.entries(roomCount).sort((a, b) => b[1] - a[1]);
    const favSeat = seatEntries.length > 0 ? { name: seatEntries[0][0], share: Math.round((seatEntries[0][1] / films.length) * 100) } : null;
    const favRoom = roomEntries.length > 0 ? { name: roomEntries[0][0], share: Math.round((roomEntries[0][1] / films.length) * 100) } : null;

    result[monthKey] = {
      films,
      totalFilms:      films.length,
      averageRating:   totalNote / films.length,
      highStarCount,
      totalDuration,
      averageDuration: Math.round(totalDuration / films.length),
      voPercentage:    filmsWithLang > 0 ? Math.round((totalVO / filmsWithLang) * 100) : 0,
      capucinesCount,
      favSeat,
      favRoom,
      genreDistribution,
      languageDistribution,
      bestMovie,
      worstMovie,
    };
  }
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// CANVAS CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const RECAP_W    = 1080;
const RECAP_H    = 1440;
const GOLD_COLOR = '#E8B200';
const DARK_BG    = '#0A0A0A';
const LIGHT_BG   = '#F5F2EC';
const FONT_SANS  = '"DM Sans", sans-serif';
const FONT_SYNE  = '"Syne", sans-serif';

function makeCanvas() {
  const c = document.createElement('canvas');
  c.width = RECAP_W; c.height = RECAP_H;
  return c;
}

// ─────────────────────────────────────────────────────────────────────────────
// CANVAS HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function drawDateBadge(ctx, monthLabel, x, y, dark = false) {
  const font = `bold 32px ${FONT_SANS}`;
  ctx.font = font;
  const textW = ctx.measureText(monthLabel.toUpperCase()).width;
  const padX = 36, padY = 22, bw = textW + padX * 2 + 30, bh = 60, radius = bh / 2;

  ctx.save();
  ctx.globalAlpha  = dark ? 0.55 : 0.8;
  ctx.fillStyle    = dark ? '#000' : '#fff';
  roundRect(ctx, x, y, bw, bh, radius); ctx.fill();
  ctx.strokeStyle  = dark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)';
  ctx.lineWidth    = 1.5; ctx.stroke();
  ctx.globalAlpha  = 1;
  ctx.fillStyle    = dark ? 'rgba(255,255,255,0.85)' : 'rgba(30,30,30,0.85)';
  ctx.textBaseline = 'middle'; ctx.textAlign = 'left';

  ctx.strokeStyle = dark ? 'rgba(255,200,0,0.9)' : 'rgba(30,30,30,0.55)';
  ctx.lineWidth   = 2;
  const ic = 22, ix = x + padX - 2, iy = y + (bh - ic) / 2;
  ctx.beginPath();
  ctx.moveTo(ix + 3, iy); ctx.lineTo(ix + ic - 3, iy);
  ctx.arcTo(ix + ic, iy, ix + ic, iy + 3, 2); ctx.lineTo(ix + ic, iy + ic - 3);
  ctx.arcTo(ix + ic, iy + ic, ix + ic - 3, iy + ic, 2); ctx.lineTo(ix + 3, iy + ic);
  ctx.arcTo(ix, iy + ic, ix, iy + ic - 3, 2); ctx.lineTo(ix, iy + 3);
  ctx.arcTo(ix, iy, ix + 3, iy, 2);
  ctx.moveTo(ix, iy + 7); ctx.lineTo(ix + ic, iy + 7);
  ctx.moveTo(ix + ic - 6, iy - 2); ctx.lineTo(ix + ic - 6, iy + 3);
  ctx.moveTo(ix + 6, iy - 2); ctx.lineTo(ix + 6, iy + 3);
  ctx.stroke();
  ctx.font = font;
  ctx.fillText(monthLabel.toUpperCase(), ix + ic + 10, y + bh / 2);
  ctx.restore();
  return bw;
}

function drawLogo(ctx, logoImg, x, y, size = 80) {
  if (!logoImg) return;
  ctx.save();
  ctx.beginPath(); ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2); ctx.clip();
  ctx.drawImage(logoImg, x, y, size, size);
  ctx.restore();
}

// ─────────────────────────────────────────────────────────────────────────────
// CANVAS SLIDE RENDERERS (unchanged logic, Syne/DM Sans enforced via FONT_SYNE/FONT_SANS)
// ─────────────────────────────────────────────────────────────────────────────
async function renderSlide1(monthLabel, currentData, s1DataType, logoImg) {
  const canvas = makeCanvas();
  const ctx    = canvas.getContext('2d');
  ctx.fillStyle = DARK_BG; ctx.fillRect(0, 0, RECAP_W, RECAP_H);
  const LEFT = 80;

  ctx.font = `800 52px ${FONT_SYNE}`; ctx.fillStyle = GOLD_COLOR;
  ctx.textBaseline = 'top'; ctx.textAlign = 'left';
  ctx.fillText('MON RÉCAP\'', LEFT, 90);
  ctx.font = `normal 26px ${FONT_SANS}`; ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fillText('CINÉ DU MOIS', LEFT, 156);
  drawLogo(ctx, logoImg, RECAP_W - LEFT - 80, 90, 80);

  const centerY = RECAP_H * 0.45;
  const drawTagline = (prefixText, boldText, yPos) => {
    ctx.font = `normal 34px ${FONT_SANS}`;
    const w1 = ctx.measureText(prefixText).width;
    ctx.font = `bold 34px ${FONT_SANS}`;
    const w2 = ctx.measureText(boldText).width;
    const startX = (RECAP_W - (w1 + w2)) / 2;
    ctx.textAlign = 'left';
    ctx.font = `normal 34px ${FONT_SANS}`; ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText(prefixText, startX, yPos);
    ctx.font = `bold 34px ${FONT_SANS}`; ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText(boldText, startX + w1, yPos);
  };

  if (s1DataType === 'hours' || !s1DataType) {
    const hoursStr = String(Math.round((currentData.totalDuration || 0) / 60));
    ctx.font = `800 320px ${FONT_SYNE}`;
    const numW = ctx.measureText(hoursStr).width;
    ctx.font = `normal 80px ${FONT_SYNE}`;
    const hW   = ctx.measureText('h').width;
    const totalW = numW + hW + 15;
    const startX = (RECAP_W - totalW) / 2;
    ctx.font = `800 320px ${FONT_SYNE}`; ctx.fillStyle = '#FFF';
    ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    ctx.fillText(hoursStr, startX, centerY);
    ctx.font = `normal 80px ${FONT_SYNE}`; ctx.fillStyle = GOLD_COLOR;
    ctx.fillText('h', startX + numW + 15, centerY + 80);
    drawTagline('dans le noir en ', monthLabel, centerY + 190);
  } else if (s1DataType === 'films') {
    const filmsStr = String(currentData.totalFilms || 0);
    ctx.font = `800 320px ${FONT_SYNE}`;
    const numW = ctx.measureText(filmsStr).width;
    ctx.font = `normal 60px ${FONT_SYNE}`;
    const tW = ctx.measureText('films').width;
    const totalW = numW + tW + 20;
    const startX = (RECAP_W - totalW) / 2;
    ctx.font = `800 320px ${FONT_SYNE}`; ctx.fillStyle = '#FFF';
    ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    ctx.fillText(filmsStr, startX, centerY);
    ctx.font = `normal 60px ${FONT_SYNE}`; ctx.fillStyle = GOLD_COLOR;
    ctx.fillText('films', startX + numW + 20, centerY + 80);
    drawTagline('découverts en ', monthLabel, centerY + 190);
  } else {
    const voStr = String(currentData.voPercentage || 0);
    ctx.font = `800 320px ${FONT_SYNE}`;
    const numW = ctx.measureText(voStr).width;
    ctx.font = `normal 100px ${FONT_SYNE}`;
    const pW = ctx.measureText('%').width;
    const totalW = numW + pW + 10;
    const startX = (RECAP_W - totalW) / 2;
    ctx.font = `800 320px ${FONT_SYNE}`; ctx.fillStyle = '#FFF';
    ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    ctx.fillText(voStr, startX, centerY);
    ctx.font = `normal 100px ${FONT_SYNE}`; ctx.fillStyle = GOLD_COLOR;
    ctx.fillText('%', startX + numW + 10, centerY + 80);
    drawTagline('de séances en VO en ', monthLabel, centerY + 190);
  }

  ctx.fillStyle = GOLD_COLOR; ctx.fillRect(RECAP_W / 2 - 60, RECAP_H - 220, 120, 4);
  ctx.font = `normal 26px ${FONT_SANS}`; ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.textBaseline = 'top'; ctx.textAlign = 'center';
  ctx.fillText(monthLabel.toUpperCase(), RECAP_W / 2, RECAP_H - 200);
  ctx.font = `800 30px ${FONT_SANS}`; ctx.fillStyle = '#fff';
  ctx.fillText('GRANDÉCRAN_OFF', RECAP_W / 2, RECAP_H - 155);
  return canvas;
}

async function renderSlide2(monthLabel, currentData, logoImg) {
  const canvas = makeCanvas();
  const ctx    = canvas.getContext('2d');
  ctx.fillStyle = LIGHT_BG; ctx.fillRect(0, 0, RECAP_W, RECAP_H);

  const films      = (currentData.films || []).filter(f => f.affiche);
  const proxyBase  = import.meta.env.DEV ? '/tmdb-proxy' : '/api/proxy-image';
  const posterImgs = await Promise.all(films.map(f => loadImageForCanvas(`${proxyBase}?url=${encodeURIComponent(f.affiche)}`)));
  const filmPool   = films.map((f, i) => ({ film: f, img: posterImgs[i] })).filter(x => x.img);
  const STRIPS = 8, CELLS = 7, totalNeeded = STRIPS * CELLS;
  let pool = [];
  while (pool.length < totalNeeded) pool = pool.concat(filmPool);
  pool = pool.sort(() => 0.5 - Math.random()).slice(0, totalNeeded);

  ctx.save();
  ctx.translate(RECAP_W / 2, RECAP_H / 2); ctx.rotate((12 * Math.PI) / 180);
  ctx.translate(-RECAP_W * 0.63, -RECAP_H * 0.63); ctx.scale(1.3, 1.3);
  const CELL_W = Math.floor(RECAP_W / STRIPS) - 4, CELL_H = Math.floor(CELL_W * 1.5), GAP = 4;
  for (let s = 0; s < STRIPS; s++) {
    const offsetY = (s % 2 === 0) ? 40 : 0;
    for (let c = 0; c < CELLS; c++) {
      const item = pool[s * CELLS + c];
      const cx = s * (CELL_W + GAP), cy = offsetY + c * (CELL_H + GAP);
      ctx.save(); roundRect(ctx, cx, cy, CELL_W, CELL_H, 6); ctx.clip();
      if (item?.img) { ctx.globalAlpha = 0.8; drawImageCover(ctx, item.img, cx, cy, CELL_W, CELL_H); }
      else { ctx.fillStyle = '#ccc'; ctx.fillRect(cx, cy, CELL_W, CELL_H); }
      ctx.restore();
    }
  }
  ctx.restore();

  const grad = ctx.createLinearGradient(0, 0, 0, RECAP_H);
  grad.addColorStop(0, 'rgba(245,242,236,0.01)'); grad.addColorStop(0.90, 'rgba(245,242,236,1)');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, RECAP_W, RECAP_H);

  drawDateBadge(ctx, monthLabel, 80, 80, false);
  drawLogo(ctx, logoImg, RECAP_W - 80 - 80, 80, 80);

  const BL = 80, BB = RECAP_H - 360;
  ctx.font = `800 120px ${FONT_SYNE}`; ctx.fillStyle = '#1E1E1E';
  ctx.textBaseline = 'bottom'; ctx.textAlign = 'left';
  ctx.fillText(`${currentData.totalFilms || 0} films`, BL, BB - 150);
  ctx.fillStyle = '#c49a10'; ctx.fillText('ce mois', BL, BB - 40);

  let pillX = BL, pillY = BB + 30;
  const pillH = 52, pillR = pillH / 2;
  const MAX_LINE_W = RECAP_W - BL * 2;
  ctx.font = `bold 24px ${FONT_SANS}`;

  let unplacedPills = (currentData.films || []).map(film => {
    const label = film.titre || '';
    const tw = ctx.measureText(label).width;
    const pw = Math.min(tw + 44, MAX_LINE_W);
    return { film, label, pw };
  });

  while (unplacedPills.length > 0) {
    if (pillY > RECAP_H - 60) break;
    const remainingSpace = RECAP_W - BL - pillX;
    let foundIndex = -1;
    for (let i = 0; i < unplacedPills.length; i++) {
      if (unplacedPills[i].pw <= remainingSpace || pillX === BL) { foundIndex = i; break; }
    }
    if (foundIndex !== -1) {
      const item = unplacedPills.splice(foundIndex, 1)[0];
      ctx.save(); roundRect(ctx, pillX, pillY, item.pw, pillH, pillR);
      ctx.fillStyle = item.film.coupDeCoeur ? '#b41e3c' : '#1e1e1e';
      ctx.globalAlpha = 0.92; ctx.fill(); ctx.clip();
      ctx.globalAlpha = 1; ctx.fillStyle = '#fff';
      ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
      ctx.fillText(item.label, pillX + 22, pillY + pillH / 2);
      ctx.restore(); pillX += item.pw + 12;
    } else { pillX = BL; pillY += pillH + 10; }
  }
  return canvas;
}

async function renderSlide3(monthLabel, currentData, logoImg) {
  const canvas = makeCanvas(); const ctx = canvas.getContext('2d');
  ctx.fillStyle = LIGHT_BG; ctx.fillRect(0, 0, RECAP_W, RECAP_H);
  const LEFT = 80, RIGHT = RECAP_W - 80;
  drawDateBadge(ctx, monthLabel, LEFT, 80, false);
  drawLogo(ctx, logoImg, RIGHT - 80, 80, 80);

  const sec1_LabelY = 220, sec1_NumBaseY = 470, sec1_DivY = 510;
  const sec2_LabelY = 550, sec2_NumBaseY = 800, sec2_DivY = 840;
  const sec3_LabelY = 880, sec3_NumBaseY = 1020, sec3_SubLabelY = 1050, sec3_DivY = 1110;
  const sec4_Y = 1150;

  const divider = (yy) => {
    ctx.strokeStyle = 'rgba(30,30,30,0.12)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(LEFT, yy); ctx.lineTo(RIGHT, yy); ctx.stroke();
  };
  const labelStyle  = () => { ctx.font = `bold 28px ${FONT_SANS}`; ctx.fillStyle = 'rgba(30,30,30,0.4)'; ctx.textBaseline = 'top'; ctx.textAlign = 'left'; };
  const bigNumStyle = (size = 180) => { ctx.font = `800 ${size}px ${FONT_SYNE}`; ctx.fillStyle = '#1E1E1E'; ctx.textBaseline = 'bottom'; ctx.textAlign = 'left'; };
  const unitOffsetY = 32;

  labelStyle(); ctx.fillText('Note moyenne', LEFT, sec1_LabelY);
  const noteStr = (currentData.averageRating || 0).toFixed(1);
  bigNumStyle(200); ctx.fillText(noteStr, LEFT, sec1_NumBaseY);
  const noteWidth = ctx.measureText(noteStr).width;
  ctx.font = `normal 80px ${FONT_SYNE}`; ctx.fillStyle = GOLD_COLOR; ctx.textBaseline = 'bottom';
  ctx.fillText('/ 5', LEFT + noteWidth + 20, sec1_NumBaseY - unitOffsetY);
  ctx.font = `800 120px ${FONT_SYNE}`; ctx.fillStyle = 'rgba(30,30,30,0.12)';
  ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
  ctx.fillText(String(currentData.highStarCount || 0), RIGHT, sec1_NumBaseY - 35);
  ctx.font = `bold 26px ${FONT_SANS}`; ctx.fillStyle = 'rgba(30,30,30,0.4)'; ctx.textBaseline = 'top';
  ctx.fillText('notes ≥ 4', RIGHT, sec1_NumBaseY - 25); ctx.textAlign = 'left';
  divider(sec1_DivY);

  labelStyle(); ctx.fillText('Durée moyenne', LEFT, sec2_LabelY);
  const h = Math.floor((currentData.averageDuration || 0) / 60);
  const m = String((currentData.averageDuration || 0) % 60).padStart(2, '0');
  const hStr = String(h);
  bigNumStyle(200); ctx.fillText(hStr, LEFT, sec2_NumBaseY);
  const hWidth = ctx.measureText(hStr).width;
  const gap1 = h > 0 ? 15 : 0;
  ctx.font = `normal 80px ${FONT_SYNE}`; ctx.fillStyle = GOLD_COLOR; ctx.textBaseline = 'bottom';
  ctx.fillText('h', LEFT + hWidth + gap1, sec2_NumBaseY - unitOffsetY);
  const letterHWidth = ctx.measureText('h').width;
  ctx.font = `800 200px ${FONT_SYNE}`; ctx.fillStyle = '#1E1E1E'; ctx.textBaseline = 'bottom';
  ctx.fillText(m, LEFT + hWidth + gap1 + letterHWidth + 15, sec2_NumBaseY);
  divider(sec2_DivY);

  const colW = (RIGHT - LEFT - 40) / 2;
  labelStyle();
  ctx.fillText('Siège favori', LEFT, sec3_LabelY);
  ctx.fillText('Salle favorite', LEFT + colW + 40, sec3_LabelY);
  bigNumStyle(100);
  ctx.fillText(currentData.favSeat?.name || '—', LEFT, sec3_NumBaseY);
  ctx.fillText(currentData.favRoom ? currentData.favRoom.name.replace('Salle ', '') : '—', LEFT + colW + 40, sec3_NumBaseY);
  ctx.font = `bold 26px ${FONT_SANS}`; ctx.fillStyle = 'rgba(30,30,30,0.4)'; ctx.textBaseline = 'top';
  ctx.fillText(`${currentData.favSeat?.share || 0}% des séances`, LEFT, sec3_SubLabelY);
  ctx.fillText(`${currentData.favRoom?.share || 0}% des séances`, LEFT + colW + 40, sec3_SubLabelY);
  ctx.strokeStyle = 'rgba(30,30,30,0.1)'; ctx.lineWidth = 1.5; ctx.beginPath();
  ctx.moveTo(LEFT + colW + 20, sec3_LabelY); ctx.lineTo(LEFT + colW + 20, sec3_DivY - 20); ctx.stroke();
  divider(sec3_DivY);

  if (currentData.capucinesCount > 0) {
    ctx.font = `bold 36px ${FONT_SANS}`; ctx.fillStyle = '#8B1A3A'; ctx.textBaseline = 'top';
    ctx.fillText(`${currentData.capucinesCount} film${currentData.capucinesCount > 1 ? 's' : ''} en compétition aux Capucines`, LEFT + 10, sec4_Y);
  }
  return canvas;
}

async function renderSlide4(monthLabel, currentData, logoImg) {
  const canvas = makeCanvas(); const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#111'; ctx.fillRect(0, 0, RECAP_W, RECAP_H);
  ctx.fillStyle = LIGHT_BG; ctx.fillRect(0, Math.round(RECAP_H * 0.82), RECAP_W, Math.round(RECAP_H * 0.18));
  const LEFT = 80;
  drawDateBadge(ctx, monthLabel, LEFT, 80, true);
  drawLogo(ctx, logoImg, RECAP_W - 80 - 80, 80, 80);

  ctx.font = `bold 28px ${FONT_SANS}`; ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.textBaseline = 'top'; ctx.textAlign = 'left';
  ctx.fillText('CE QUE J\'AI REGARDÉ', LEFT, 200);
  ctx.font = `800 100px ${FONT_SYNE}`; ctx.fillStyle = '#fff';
  ctx.fillText('Mes genres', LEFT, 250);
  ctx.fillStyle = GOLD_COLOR; ctx.fillText('du mois', LEFT, 360);

  const genresArray = Object.entries(currentData?.genreDistribution || {}).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxCount    = genresArray.length > 0 ? genresArray[0][1] : 1;
  const MEDALS      = ['🥇', '🥈', '🥉', '', ''];
  const BAR_X = LEFT, BAR_MAX = RECAP_W - LEFT * 2;
  let gy = 530;
  const barGap = 125;
  const barStyles = [
    { h: 38, grad: ['#c49a10', '#FFD341'] },
    { h: 30, grad: ['#383838', '#555'] },
    { h: 24, grad: ['#7E0000', '#b03010'] },
    { h: 20, grad: ['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.18)'] },
    { h: 16, grad: ['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.1)'] },
  ];

  genresArray.forEach(([genreName, count], i) => {
    const pct = count / maxCount;
    const style = barStyles[i] || barStyles[4];
    const tSize = [44, 38, 32, 28, 24][i] || 24;
    const tAlpha = [1, 0.8, 0.7, 0.5, 0.35][i];
    ctx.font = `800 ${tSize}px ${FONT_SYNE}`; ctx.fillStyle = `rgba(255,255,255,${tAlpha})`;
    ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    const medal = MEDALS[i] ? `${MEDALS[i]} ` : '';
    ctx.fillText(`${medal}${genreName}`, BAR_X, gy);
    ctx.font = `bold 26px ${FONT_SANS}`; ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.textAlign = 'right';
    ctx.fillText(`${count} film${count > 1 ? 's' : ''}`, RECAP_W - LEFT, gy);
    ctx.textAlign = 'left';
    const barY = gy + 30;
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    roundRect(ctx, BAR_X, barY, BAR_MAX, style.h, style.h / 2); ctx.fill();
    const gFill = ctx.createLinearGradient(BAR_X, 0, BAR_X + BAR_MAX, 0);
    gFill.addColorStop(0, style.grad[0]); gFill.addColorStop(1, style.grad[1]);
    ctx.fillStyle = gFill;
    roundRect(ctx, BAR_X, barY, BAR_MAX * pct, style.h, style.h / 2); ctx.fill();
    gy += barGap;
  });

  const langY = Math.round(RECAP_H * 0.84);
  const langEntries = Object.entries(currentData?.languageDistribution || {}).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const totalLangsCount = langEntries.reduce((acc, [, v]) => acc + v, 0);
  ctx.font = `bold 26px ${FONT_SANS}`; ctx.fillStyle = 'rgba(30,30,30,0.4)'; ctx.textBaseline = 'top';
  ctx.fillText('LANGUES', LEFT, langY + 10);
  let lx = LEFT + 180;
  langEntries.forEach(([lang, count], i) => {
    const pct = Math.round((count / totalLangsCount) * 100);
    const pctText = `${pct}%`;
    if (i > 0) {
      ctx.strokeStyle = 'rgba(30,30,30,0.15)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(lx - 24, langY + 4); ctx.lineTo(lx - 24, langY + 90); ctx.stroke();
    }
    ctx.font = `800 72px ${FONT_SYNE}`; ctx.fillStyle = i === 0 ? '#c49a10' : '#1E1E1E';
    ctx.textBaseline = 'top'; ctx.textAlign = 'left';
    ctx.fillText(pctText, lx, langY - 4);
    const pctWidth = ctx.measureText(pctText).width;
    ctx.font = `bold 24px ${FONT_SANS}`; ctx.fillStyle = 'rgba(30,30,30,0.6)';
    ctx.fillText(lang, lx, langY + 72);
    lx += pctWidth + 60;
  });
  return canvas;
}

async function renderSlide5(monthLabel, currentData, logoImg) {
  const canvas = makeCanvas(); const ctx = canvas.getContext('2d');
  const MID = RECAP_H / 2;
  const proxyBase = import.meta.env.DEV ? '/tmdb-proxy' : '/api/proxy-image';
  const [bestImg, worstImg] = await Promise.all([
    currentData.bestMovie?.affiche  ? loadImageForCanvas(`${proxyBase}?url=${encodeURIComponent(currentData.bestMovie.affiche)}`)  : Promise.resolve(null),
    currentData.worstMovie?.affiche ? loadImageForCanvas(`${proxyBase}?url=${encodeURIComponent(currentData.worstMovie.affiche)}`) : Promise.resolve(null),
  ]);
  const LEFT = 80, titleLineHeight = 80;

  ctx.fillStyle = '#0A0A0A'; ctx.fillRect(0, 0, RECAP_W, MID);
  if (bestImg) {
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, RECAP_W, MID); ctx.clip();
    ctx.globalAlpha = 0.55; drawImageCover(ctx, bestImg, 0, 0, RECAP_W, MID); ctx.restore();
    const gg = ctx.createLinearGradient(0, 0, 0, MID);
    gg.addColorStop(0, 'rgba(0,0,0,0.0)'); gg.addColorStop(0.5, 'rgba(0,0,0,0.0)');
    gg.addColorStop(0.75, 'rgba(0,0,0,0.7)'); gg.addColorStop(1, 'rgba(0,0,0,0.95)');
    ctx.fillStyle = gg; ctx.fillRect(0, 0, RECAP_W, MID);
  }

  const bestTitle = currentData.bestMovie?.titre || '—';
  ctx.font = `800 72px ${FONT_SYNE}`;
  const bestLines = wrapText(ctx, bestTitle, RECAP_W - LEFT * 2).slice(0, 2);
  const bestStarsY = MID - 60;
  const bestTitleStartY = bestStarsY - 20 - (bestLines.length * titleLineHeight);
  const bestLabelY = bestTitleStartY - 40;
  ctx.textBaseline = 'top'; ctx.textAlign = 'left';
  ctx.font = `bold 26px ${FONT_SANS}`; ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fillText('── COUP DE CŒUR', LEFT, bestLabelY);
  ctx.font = `800 72px ${FONT_SYNE}`; ctx.fillStyle = '#FFF';
  bestLines.forEach((l, i) => ctx.fillText(l, LEFT, bestTitleStartY + i * titleLineHeight));
  const bestNote = parseFloat(String(currentData.bestMovie?.note || 0).replace(',', '.'));
  drawCanvasStars(ctx, bestNote, LEFT, bestStarsY, 36, 6);

  ctx.fillStyle = LIGHT_BG; ctx.fillRect(0, MID, RECAP_W, MID);
  if (worstImg) {
    ctx.save(); ctx.beginPath(); ctx.rect(0, MID, RECAP_W, MID); ctx.clip();
    ctx.globalAlpha = 0.4; drawImageCover(ctx, worstImg, 0, MID, RECAP_W, MID); ctx.restore();
    const gw = ctx.createLinearGradient(0, MID, 0, RECAP_H);
    gw.addColorStop(0, 'rgba(245,242,236,0.0)'); gw.addColorStop(0.5, 'rgba(245,242,236,0.0)');
    gw.addColorStop(0.75, 'rgba(245,242,236,0.75)'); gw.addColorStop(1, 'rgba(245,242,236,0.98)');
    ctx.fillStyle = gw; ctx.fillRect(0, MID, RECAP_W, MID);
  }

  const worstTitle = currentData.worstMovie?.titre || '—';
  ctx.font = `800 72px ${FONT_SYNE}`;
  const worstLines = wrapText(ctx, worstTitle, RECAP_W - LEFT * 2).slice(0, 2);
  const worstStarsY = RECAP_H - 80;
  const worstTitleStartY = worstStarsY - 20 - (worstLines.length * titleLineHeight);
  const worstLabelY = worstTitleStartY - 40;
  ctx.font = `bold 26px ${FONT_SANS}`; ctx.fillStyle = 'rgba(30,30,30,0.45)';
  ctx.fillText('── À OUBLIER', LEFT, worstLabelY);
  ctx.font = `800 72px ${FONT_SYNE}`; ctx.fillStyle = '#1E1E1E';
  worstLines.forEach((l, i) => ctx.fillText(l, LEFT, worstTitleStartY + i * titleLineHeight));
  const worstNote = parseFloat(String(currentData.worstMovie?.note || 0).replace(',', '.'));
  const EMPTY_LIGHT = 'rgba(30,30,30,0.12)';
  for (let i = 0; i < 5; i++) {
    const filled = i < Math.floor(worstNote);
    const cx2 = LEFT + i * (36 + 6) + 18, cy2 = worstStarsY + 18;
    ctx.save(); ctx.translate(cx2, cy2); ctx.scale(18, 18);
    const sp = new Path2D('M 0 -1 L 0.29 -0.40 L 0.95 -0.31 L 0.48 0.15 L 0.59 0.81 L 0 0.50 L -0.59 0.81 L -0.48 0.15 L -0.95 -0.31 L -0.29 -0.40 Z');
    ctx.fillStyle = filled ? '#E9B90A' : EMPTY_LIGHT; ctx.fill(sp); ctx.restore();
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(0, MID); ctx.lineTo(RECAP_W, MID); ctx.stroke();
  drawDateBadge(ctx, monthLabel, LEFT, 70, true);
  drawLogo(ctx, logoImg, RECAP_W - LEFT - 80, 70, 80);
  return canvas;
}

async function renderSlide6(monthLabel, monthLabel_short, currentData, logoImg) {
  const canvas = makeCanvas(); const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#0A0A0A'; ctx.fillRect(0, 0, RECAP_W, RECAP_H);
  const LEFT = 80;
  drawDateBadge(ctx, monthLabel, LEFT, 80, true);
  drawLogo(ctx, logoImg, RECAP_W - LEFT - 80, 80, 80);

  const CARD_X = LEFT - 20, CARD_Y = 220, CARD_W = RECAP_W - (LEFT - 20) * 2, CARD_H = RECAP_H - 420;
  ctx.save(); ctx.globalAlpha = 0.08; ctx.fillStyle = '#fff';
  roundRect(ctx, CARD_X, CARD_Y, CARD_W, CARD_H, 40); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.globalAlpha = 1; ctx.restore();

  const CX = CARD_X + 60; let cy = CARD_Y + 60;
  ctx.font = `bold 26px ${FONT_SANS}`; ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.textBaseline = 'top'; ctx.textAlign = 'left';
  ctx.fillText('PROFIL CINÉ DU MOIS', CX, cy);
  ctx.textAlign = 'right'; ctx.fillText(`— ${monthLabel_short}`, CARD_X + CARD_W - 60, cy);
  ctx.textAlign = 'left'; cy += 60;

  const genresArray = Object.entries(currentData?.genreDistribution || {}).sort((a, b) => b[1] - a[1]);
  const topGenre    = genresArray.length > 0 ? genresArray[0][0] : 'Inconnu';
  const archetype   = getArchetype(topGenre, currentData?.averageRating || 0);
  const archParts   = archetype.name.split('\n');

  ctx.font = `bold 26px ${FONT_SANS}`; ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fillText('ARCHÉTYPE DU MOIS', CX, cy); cy += 40;
  ctx.font = `800 120px ${FONT_SYNE}`; ctx.fillStyle = '#fff';
  ctx.fillText(archParts[0] || '', CX, cy); cy += 115;
  if (archParts[1]) {
    ctx.fillStyle = GOLD_COLOR; ctx.fillText(archParts[1], CX, cy); cy += 115;
  } else { cy += 30; }

  ctx.font = `normal 32px ${FONT_SANS}`; ctx.fillStyle = 'rgba(255,255,255,0.4)';
  const descLines = wrapText(ctx, archetype.desc, CARD_W - 120);
  descLines.forEach(l => { ctx.fillText(l, CX, cy); cy += 42; }); cy += 20;

  ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(CX, cy); ctx.lineTo(CARD_X + CARD_W - 60, cy); ctx.stroke(); cy += 40;

  const col2X = CX + 440;
  ctx.font = `bold 24px ${FONT_SANS}`; ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillText('GENRE DOMINANT', CX, cy); ctx.fillText('NOTE MOYENNE', col2X, cy); cy += 40;

  ctx.textBaseline = 'bottom';
  const valBaseY = cy + 60;
  let genreFontSize = 56;
  ctx.font = `800 ${genreFontSize}px ${FONT_SYNE}`;
  while (ctx.measureText(topGenre).width > 400 && genreFontSize > 30) {
    genreFontSize -= 2; ctx.font = `800 ${genreFontSize}px ${FONT_SYNE}`;
  }
  ctx.fillStyle = '#fff'; ctx.fillText(topGenre, CX, valBaseY);

  const noteStr = (currentData?.averageRating || 0).toFixed(1);
  ctx.font = `800 56px ${FONT_SYNE}`; ctx.fillStyle = '#fff';
  ctx.fillText(noteStr, col2X, valBaseY);
  const noteW = ctx.measureText(noteStr).width;
  ctx.font = `normal 36px ${FONT_SYNE}`; ctx.fillStyle = GOLD_COLOR;
  ctx.fillText('/ 5', col2X + noteW + 10, valBaseY - 4);
  drawCanvasStars(ctx, currentData?.averageRating || 0, col2X, valBaseY + 15, 28, 5);

  const [yearStr, monthNumStr] = monthLabel_short.split(' / ');
  const currentMonthIndex = parseInt(monthNumStr, 10) - 1;
  const nextDate  = new Date(parseInt(yearStr, 10), currentMonthIndex + 2, 1);
  const nextLabel = `${MONTH_NAMES[nextDate.getMonth()]} ${nextDate.getFullYear()}`;

  ctx.textBaseline = 'bottom'; ctx.textAlign = 'left';
  ctx.font = `normal 34px ${FONT_SANS}`; ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fillText('Rendez-vous début ', LEFT, RECAP_H - 60);
  const rdvW = ctx.measureText('Rendez-vous début ').width;
  ctx.font = `bold 34px ${FONT_SANS}`; ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillText(nextLabel, LEFT + rdvW, RECAP_H - 60);
  return canvas;
}

async function renderAllRecapSlidesToBlobs(currentData, monthLabel, monthNum, year, s1DataType) {
  const logoImg = await loadImageForCanvas(INSTA_LOGO_URL);
  const monthLabel_short = `${year} / ${monthNum}`;
  const canvases = await Promise.all([
    renderSlide1(monthLabel, currentData, s1DataType, logoImg),
    renderSlide2(monthLabel, currentData, logoImg),
    renderSlide3(monthLabel, currentData, logoImg),
    renderSlide4(monthLabel, currentData, logoImg),
    renderSlide5(monthLabel, currentData, logoImg),
    renderSlide6(monthLabel, monthLabel_short, currentData, logoImg),
  ]);
  return Promise.all(canvases.map(canvas => new Promise(resolve => canvas.toBlob(blob => resolve(blob), 'image/png'))));
}

// ─────────────────────────────────────────────────────────────────────────────
// RECAP TOOL
// ─────────────────────────────────────────────────────────────────────────────
function RecapTool({ onBack, historyData }) {
  const [data,          setData]          = useState(null);
  const [months,        setMonths]        = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [currentSlide,  setCurrentSlide]  = useState(0);
  const [isLoading,     setIsLoading]     = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [s1DataType,    setS1DataType]    = useState('hours');

  const swipeRef = useRef({ x: 0, y: 0, isDragging: false });

  useEffect(() => {
    setIsLoading(true);
    try {
      if (historyData && historyData.length > 0) {
        const rewindData = computeMonthlyRewindData(historyData);
        setData(rewindData);
        const availableKeys = Object.keys(rewindData).sort((a, b) => b.localeCompare(a));
        if (availableKeys.length > 0) { setMonths(availableKeys); setSelectedMonth(availableKeys[0]); }
      }
    } catch (error) { console.error("Erreur calcul Recap :", error); }
    finally { setIsLoading(false); }
  }, [historyData]);

  const getPosterUrl = (url) => {
    if (!url) return '';
    const proxyBase = import.meta.env.DEV ? '/tmdb-proxy' : '/api/proxy-image';
    return `${proxyBase}?url=${encodeURIComponent(url)}`;
  };

  const slide2Posters = useMemo(() => {
    if (!data || !selectedMonth || !data[selectedMonth]?.films) return [];
    const films = data[selectedMonth].films.filter(f => f.affiche);
    if (films.length === 0) return [];
    const totalNeeded = 8 * 7;
    let pool = [];
    while (pool.length < totalNeeded) pool = pool.concat(films);
    return [...pool].sort(() => 0.5 - Math.random()).slice(0, totalNeeded);
  }, [data, selectedMonth]);

  const goToSlide   = (index) => { if (index < 0) index = 0; if (index >= RW_TOTAL) index = RW_TOTAL - 1; setCurrentSlide(index); };
  const cycleSlide1 = () => { const types = ['hours', 'films', 'vo']; setS1DataType(types[(types.indexOf(s1DataType) + 1) % types.length]); };

  const handleTouchStart = (e) => { swipeRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, isDragging: true }; };
  const handleTouchMove  = (e) => { if (!swipeRef.current.isDragging) return; const dx = e.touches[0].clientX - swipeRef.current.x; const dy = e.touches[0].clientY - swipeRef.current.y; if (Math.abs(dy) > Math.abs(dx)) swipeRef.current.isDragging = false; };
  const handleTouchEnd   = (e) => { if (!swipeRef.current.isDragging) return; const dx = e.changedTouches[0].clientX - swipeRef.current.x; if (dx < -50) goToSlide(currentSlide + 1); else if (dx > 50) goToSlide(currentSlide - 1); swipeRef.current.isDragging = false; };

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      await ensureFontsLoaded();
      const [year, monthNum] = selectedMonth.split('-');
      const monthLabel       = `${MONTH_NAMES[parseInt(monthNum, 10) - 1]} ${year}`;
      const logoImg          = await loadImageForCanvas(INSTA_LOGO_URL);
      const monthLabel_short = `${year} / ${monthNum}`;
      let canvas;
      switch (currentSlide) {
        case 0: canvas = await renderSlide1(monthLabel, currentData, s1DataType, logoImg); break;
        case 1: canvas = await renderSlide2(monthLabel, currentData, logoImg); break;
        case 2: canvas = await renderSlide3(monthLabel, currentData, logoImg); break;
        case 3: canvas = await renderSlide4(monthLabel, currentData, logoImg); break;
        case 4: canvas = await renderSlide5(monthLabel, currentData, logoImg); break;
        case 5: canvas = await renderSlide6(monthLabel, monthLabel_short, currentData, logoImg); break;
        default: break;
      }
      if (canvas) {
        canvas.toBlob(blob => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `Recap_${selectedMonth}_${SLIDE_NAMES[currentSlide]}.png`;
          link.href = url; link.click();
          setTimeout(() => URL.revokeObjectURL(url), 5000);
        }, 'image/png');
      }
    } catch (err) { console.error(err); }
    finally { setIsDownloading(false); }
  };

  const handleDownloadAll = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      await ensureFontsLoaded();
      const [year, monthNum] = selectedMonth.split('-');
      const monthLabel = `${MONTH_NAMES[parseInt(monthNum, 10) - 1]} ${year}`;
      const blobs = await renderAllRecapSlidesToBlobs(currentData, monthLabel, monthNum, year, s1DataType);
      const files = blobs.map((blob, i) => blob ? new File([blob], `Recap_${selectedMonth}_0${i + 1}_${SLIDE_NAMES[i].replace(/[^a-zA-Z0-9]/g, '')}.png`, { type: 'image/png' }) : null).filter(Boolean);
      if (navigator.canShare && navigator.canShare({ files })) {
        await navigator.share({ files, title: `Récap ${selectedMonth}` });
      } else {
        for (const file of files) {
          const url = URL.createObjectURL(file);
          const link = document.createElement('a');
          link.download = file.name; link.href = url; link.click();
          URL.revokeObjectURL(url);
          await new Promise(r => setTimeout(r, 400));
        }
      }
    } catch (err) { if (err.name !== 'AbortError') console.error(err); }
    finally { setIsDownloading(false); }
  };

  // ── Loading / empty states ──
  const emptyHeader = (title) => (
    <header className="z-40 sticky top-0 w-full bg-[#0C0C0E]/90 backdrop-blur-xl border-b border-white/10 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 px-6 flex justify-between items-center text-white">
      <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center"><ChevronLeft size={20} strokeWidth={2.5}/></button>
      <h2 className="font-galinoy italic text-xl">{title}</h2>
      <div className="w-10"/>
    </header>
  );

  if (isLoading) return (
    <div className="animate-in fade-in pb-24 flex flex-col min-h-screen bg-[#0C0C0E]">
      {emptyHeader("Récap' Mensuel")}
      <div className="flex-1 flex items-center justify-center text-white/50 font-outfit">Chargement des données…</div>
    </div>
  );
  if (!data || Object.keys(data).length === 0) return (
    <div className="animate-in fade-in pb-24 flex flex-col min-h-screen bg-[#0C0C0E]">
      {emptyHeader("Récap' Mensuel")}
      <div className="flex-1 flex items-center justify-center text-white/50 text-center px-6 font-outfit">Aucune donnée trouvée.</div>
    </div>
  );

  const currentData = data[selectedMonth];
  const [year, monthNum] = selectedMonth.split('-');
  const monthLabel = `${MONTH_NAMES[parseInt(monthNum, 10) - 1]} ${year}`;

  const genresArray    = Object.entries(currentData?.genreDistribution || {}).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxGenreCount  = genresArray.length > 0 ? genresArray[0][1] : 1;
  const MEDALS         = ['🥇', '🥈', '🥉', '', ''];
  const langEntries    = Object.entries(currentData?.languageDistribution || {}).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const totalLangsCount = langEntries.reduce((acc, curr) => acc + curr[1], 0);
  const topGenre       = genresArray.length > 0 ? genresArray[0][0] : 'Inconnu';
  const archetype      = getArchetype(topGenre, currentData?.averageRating || 0);
  const archNameParts  = archetype.name.split('\n');
  const currentMonthIndex = parseInt(monthNum, 10) - 1;
  const nextMonthDate  = new Date(parseInt(year, 10), currentMonthIndex + 2, 1);
  const nextMonthLabel = `${MONTH_NAMES[nextMonthDate.getMonth()]} ${nextMonthDate.getFullYear()}`;

  return (
    <div className="animate-in fade-in pb-safe-24 flex flex-col min-h-screen bg-[#0C0C0E] overflow-x-hidden text-[#F0EEF5]">

      {/* ── HEADER — chrome uses Galinoy italic ── */}
      <header className="z-40 sticky top-0 w-full bg-[#0C0C0E]/90 backdrop-blur-xl border-b border-white/10 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 px-6 flex justify-between items-center text-white">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
          <ChevronLeft size={20} strokeWidth={2.5}/>
        </button>
        <h2 className="font-galinoy italic text-xl tracking-tight">Récap' Mensuel</h2>
        <div className="w-10"/>
      </header>

      {/* ── MONTH SELECTOR ── */}
      <div className="pt-5">
        <div className="text-[9px] font-bold tracking-widest uppercase text-white/20 font-outfit px-5 mb-2">Mois</div>
        <div className="flex gap-2 overflow-x-auto px-5 pb-2 scrollbar-hide">
          {months.map(mKey => {
            const [y, m] = mKey.split('-');
            const isActive = mKey === selectedMonth;
            return (
              <div key={mKey} onClick={() => { setSelectedMonth(mKey); setCurrentSlide(0); }}
                className={`flex-shrink-0 flex flex-col items-center justify-center w-[60px] h-[56px] rounded-[10px] border cursor-pointer transition-all select-none ${isActive ? 'border-[#E8B200] bg-[#E8B200]/10' : 'border-white/5 bg-[#1A1A1F]'}`}>
                <div className={`font-outfit text-[11px] font-bold ${isActive ? 'text-[#E8B200]' : 'text-[#F0EEF5]'}`}>{MONTH_NAMES[parseInt(m, 10) - 1].substring(0, 3)}</div>
                <div className={`font-outfit text-[8px] font-medium mt-1 ${isActive ? 'text-[#E8B200]/60' : 'text-white/20'}`}>{y}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── INFO BAR ── */}
      <div className="mx-5 mt-4 flex items-center justify-between bg-[#1A1A1F] border border-white/5 rounded-[10px] px-3.5 py-2.5">
        <div className="flex gap-2.5 items-center">
          <Layers size={16} className="text-[#E8B200]" />
          <div className="font-outfit text-[10px] text-white/40">
            <strong className="text-white">{currentData?.totalFilms || 0} films</strong> · slide {currentSlide + 1}/6
          </div>
        </div>
      </div>

      {/* ── CAROUSEL STAGE ── */}
      <div className="studio-stage relative mt-4 mx-5 rounded-[18px] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.5),_0_1px_0_rgba(255,255,255,0.06)_inset] bg-[#0A0A0A]">

        {currentSlide > 0 && (
          <button data-capture-hide="true" onClick={() => goToSlide(currentSlide - 1)}
            className="rw-arrow absolute left-2 top-1/2 -translate-y-1/2 z-50 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/10 active:scale-90 transition-transform">
            <ChevronLeft size={20} strokeWidth={2.5}/>
          </button>
        )}
        {currentSlide < RW_TOTAL - 1 && (
          <button data-capture-hide="true" onClick={() => goToSlide(currentSlide + 1)}
            className="rw-arrow absolute right-2 top-1/2 -translate-y-1/2 z-50 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/10 active:scale-90 transition-transform">
            <ChevronRight size={20} strokeWidth={2.5}/>
          </button>
        )}

        <div className="rw-carousel-wrapper w-full h-full"
          onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
          <div className="rw-slide-track flex w-[600%] h-full transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${currentSlide * (100 / RW_TOTAL)}%)` }}>

            {/* ══════════════════════════════════════════════════════════
                SLIDE 1 — INTRO
                Fonts: font-syne (display), font-sans → DM Sans (body)
                scoped via .rw-slide CSS rule
            ══════════════════════════════════════════════════════════ */}
            <div className="rw-slide w-1/6 h-full relative p-6 flex flex-col bg-[#0A0A0A]" id="rw-slide-1">
              <div className="rw-glow-a"/><div className="rw-glow-b"/>

              <div className="absolute top-6 left-6 z-30 flex flex-col">
                <span className="font-syne font-extrabold text-[24px] uppercase tracking-tight text-[#E8B200] leading-none mb-1">Mon récap'</span>
                <span className="font-sans font-medium text-[10px] uppercase tracking-[0.15em] text-white/30">Ciné du mois</span>
              </div>
              <div className="absolute top-6 right-6 z-30">
                <img src={INSTA_LOGO_URL} alt="Logo" className="w-10 h-10 rounded-full shadow-lg object-cover"/>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center text-center cursor-pointer z-20 mt-10 relative"
                onClick={cycleSlide1}>
                {s1DataType === 'hours' && (
                  <div className="animate-bubble flex flex-col items-center">
                    <div className="flex items-baseline -ml-1">
                      <span className="font-syne font-black text-[clamp(80px,22vw,140px)] leading-[0.88] tracking-[-3px] text-white">
                        {currentData ? Math.round((currentData.totalDuration || 0) / 60) : 0}
                      </span>
                      <span className="font-syne text-[#E8B200] text-[clamp(32px,8vw,44px)] font-normal tracking-[-1px] ml-1.5">h</span>
                    </div>
                    <div className="font-sans text-white/40 text-[12px] font-medium mt-1.5">
                      dans le noir en <strong className="text-white/70 font-semibold">{monthLabel}</strong>
                    </div>
                  </div>
                )}
                {s1DataType === 'films' && (
                  <div className="animate-bubble flex flex-col items-center">
                    <div className="flex items-baseline -ml-1">
                      <span className="font-syne font-black text-[clamp(80px,22vw,140px)] leading-[0.88] tracking-[-3px] text-white">
                        {currentData?.totalFilms || 0}
                      </span>
                      <span className="font-syne text-[#E8B200] text-[clamp(28px,7vw,36px)] font-normal tracking-[-0.5px] ml-2.5">films</span>
                    </div>
                    <div className="font-sans text-white/40 text-[12px] font-medium mt-1.5">
                      découverts en <strong className="text-white/70 font-semibold">{monthLabel}</strong>
                    </div>
                  </div>
                )}
                {s1DataType === 'vo' && (
                  <div className="animate-bubble flex flex-col items-center">
                    <div className="flex items-baseline -ml-1">
                      <span className="font-syne font-black text-[clamp(80px,22vw,140px)] leading-[0.88] tracking-[-3px] text-white">
                        {currentData?.voPercentage || 0}
                      </span>
                      <span className="font-syne text-[#E8B200] text-[clamp(36px,9vw,44px)] font-normal tracking-[-1px] ml-1.5">%</span>
                    </div>
                    <div className="font-sans text-white/40 text-[12px] font-medium mt-1.5">
                      de séances en VO en <strong className="text-white/70 font-semibold">{monthLabel}</strong>
                    </div>
                  </div>
                )}
                <p data-capture-hide="true"
                  className="absolute bottom-24 text-[10px] text-white/20 font-medium bg-white/5 border border-white/5 px-3 py-1.5 rounded-full font-sans">
                  (Clique pour changer)
                </p>
              </div>

              <div className="absolute bottom-6 left-0 right-0 z-30 flex flex-col items-center gap-2">
                <div className="w-16 h-px bg-[#E8B200] rounded-full"/>
                <span className="font-sans font-medium text-[9px] uppercase tracking-[0.15em] text-white/30">{monthLabel}</span>
                <span className="font-sans font-extrabold text-[12px] uppercase tracking-[0.1em] text-white mt-1">GRANDÉCRAN_OFF</span>
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════════
                SLIDE 2 — FILMS DU MOIS
            ══════════════════════════════════════════════════════════ */}
            <div className="rw-slide w-1/6 h-full relative bg-[#F5F2EC] overflow-hidden" id="rw-slide-2">
              <div className="absolute inset-0 flex gap-1 z-0 overflow-hidden transform rotate-12 scale-[1.3] -top-12 -left-12 w-[125%] h-[125%] opacity-90">
                {Array.from({ length: 8 }).map((_, stripIdx) => (
                  <div key={stripIdx} className={`flex-1 flex flex-col gap-1 min-w-0 ${stripIdx % 2 === 0 ? 'pt-6' : 'pt-0'} ${stripIdx % 3 === 0 ? 'pt-3' : ''}`}>
                    {Array.from({ length: 7 }).map((_, cellIdx) => {
                      const film = slide2Posters[stripIdx * 7 + cellIdx];
                      return (
                        <div key={cellIdx} className="w-full aspect-[2/3] bg-gray-300 relative rounded-md overflow-hidden flex-shrink-0">
                          {film?.affiche && <img src={getPosterUrl(film.affiche)} crossOrigin="anonymous" className="w-full h-full object-cover saturate-[0.65] brightness-90" alt=""/>}
                          {film?.capucines && <img src="https://i.imgur.com/lg1bkrO.png" crossOrigin="anonymous" className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-white p-[1.5px] shadow" alt=""/>}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
              <div className="absolute inset-x-0 bottom-0 z-10 h-full" style={{ background: 'linear-gradient(180deg, rgba(245,242,236,0.08) 0%, rgba(245,242,236,0.02) 25%, rgba(245,242,236,0.18) 45%, rgba(245,242,236,0.78) 62%, rgba(245,242,236,0.97) 78%, rgba(245,242,236,1.00) 88%)', bottom: '-2px' }}/>
              <div className="absolute inset-0 z-20 flex flex-col justify-between p-6">
                <div className="flex justify-between items-start">
                  <div className="inline-flex items-center gap-2 bg-white/70 border border-black/10 rounded-full px-3.5 py-1.5 shadow-sm backdrop-blur-md">
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 stroke-[#1E1E1E] fill-none stroke-2 opacity-60"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    <span className="font-sans text-[10px] font-bold text-[#1E1E1E]/80 tracking-widest uppercase">{monthLabel}</span>
                  </div>
                  <img src={INSTA_LOGO_URL} alt="Logo" className="w-10 h-10 rounded-full shadow-md object-cover"/>
                </div>
                <div className="flex flex-col pb-2">
                  <h2 className="font-syne font-extrabold text-[44px] leading-[0.92] tracking-[-2px] text-[#1E1E1E] mb-3">
                    {currentData?.totalFilms || 0} films<br/><span className="text-[#c49a10]">ce mois</span>
                  </h2>
                  <div className="flex flex-wrap gap-1.5">
                    {currentData?.films?.map((film, idx) => {
                      const isCDC = film.coupDeCoeur, isCapu = film.capucine || film.capucines;
                      return (
                        <div key={idx} className={`inline-flex items-center gap-1.5 border rounded-full px-2.5 py-1 max-w-[250px] overflow-hidden ${isCDC ? 'bg-[#b41e3c]/90 border-[#8b1a3a]/30' : 'bg-[#1e1e1e]/90 border-[#1e1e1e]/20'} ${isCapu && !isCDC ? 'border-[#8b1a3a]/35' : ''}`}>
                          {isCapu && <img src="https://i.imgur.com/lg1bkrO.png" className="w-2.5 h-2.5 rounded-full flex-shrink-0 object-cover" alt="Capu"/>}
                          <span className="font-sans text-[9px] font-semibold text-white whitespace-nowrap overflow-hidden text-ellipsis">{film.titre}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════════
                SLIDE 3 — STATS GLOBALES
            ══════════════════════════════════════════════════════════ */}
            <div className="rw-slide w-1/6 h-full relative bg-[#F5F2EC] flex flex-col" id="rw-slide-3">
              <div className="absolute top-6 left-6 right-6 z-30 flex justify-between items-start">
                <div className="inline-flex items-center gap-2 bg-white/70 border border-black/10 rounded-full px-3.5 py-1.5 shadow-sm backdrop-blur-md">
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 stroke-[#1E1E1E] fill-none stroke-2 opacity-60"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  <span className="font-sans text-[10px] font-bold text-[#1E1E1E]/80 tracking-widest uppercase">{monthLabel}</span>
                </div>
                <img src={INSTA_LOGO_URL} alt="Logo" className="w-10 h-10 rounded-full border border-black/10 shadow-md object-cover"/>
              </div>
              <div className="flex-1 flex flex-col pt-24 pb-8 px-6 z-10">
                <div className="flex-1 flex flex-col justify-around">
                  <div className="flex items-start justify-between border-b border-[#1E1E1E]/10 pb-4">
                    <div>
                      <div className="font-sans text-[10px] font-bold text-[#1E1E1E]/40 tracking-[0.15em] uppercase mb-1">Note moyenne</div>
                      <div className="font-syne font-extrabold text-[#1E1E1E] flex items-baseline text-[70px] leading-[0.88] tracking-[-4px]">
                        {currentData?.averageRating?.toFixed(1) || 0}
                        <span className="font-normal text-[32px] tracking-[-0.5px] text-[#E8B200] ml-2">/ 5</span>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end justify-end mt-2">
                      <div className="font-syne font-extrabold text-[56px] leading-[0.8] text-[#1E1E1E]/15 tracking-[-2px]">{currentData?.highStarCount || 0}</div>
                      <div className="font-sans text-[9px] font-semibold text-[#1E1E1E]/40 leading-[1.4] text-right max-w-[70px] mt-1">notes sup. à 4</div>
                    </div>
                  </div>
                  <div className="border-b border-[#1E1E1E]/10 pb-4">
                    <div className="font-sans text-[10px] font-bold text-[#1E1E1E]/40 tracking-[0.15em] uppercase mb-1">Durée moyenne</div>
                    <div className="font-syne font-extrabold text-[#1E1E1E] flex items-baseline text-[76px] leading-[0.88] tracking-[-3px]">
                      {currentData ? Math.floor((currentData.averageDuration || 0) / 60) : 0}
                      <span className="font-normal text-[26px] text-[#E8B200] mx-1">h</span>
                      {currentData ? String((currentData.averageDuration || 0) % 60).padStart(2, '0') : '00'}
                    </div>
                  </div>
                  <div className="flex items-start justify-between border-b border-[#1E1E1E]/10 pb-4">
                    <div className="flex-1 pr-4">
                      <div className="font-sans text-[10px] font-bold text-[#1E1E1E]/40 tracking-[0.15em] uppercase mb-1">Siège favori</div>
                      <div className="font-syne font-extrabold text-[32px] leading-none text-[#1E1E1E] tracking-[-1px] truncate">{currentData?.favSeat?.name || '—'}</div>
                      <div className="font-sans text-[10px] font-semibold text-[#1E1E1E]/40 mt-1">{currentData?.favSeat?.share || 0}% des séances</div>
                    </div>
                    <div className="flex-1 pl-4 border-l border-[#1E1E1E]/10">
                      <div className="font-sans text-[10px] font-bold text-[#1E1E1E]/40 tracking-[0.15em] uppercase mb-1">Salle favorite</div>
                      <div className="font-syne font-extrabold text-[32px] leading-none text-[#1E1E1E] tracking-[-1px] truncate">{currentData?.favRoom ? currentData.favRoom.name.replace('Salle ', '') : '—'}</div>
                      <div className="font-sans text-[10px] font-semibold text-[#1E1E1E]/40 mt-1">{currentData?.favRoom?.share || 0}% des séances</div>
                    </div>
                  </div>
                  <div className="h-[60px] flex items-center">
                    {currentData?.capucinesCount > 0 && (
                      <div className="inline-flex items-center gap-3 bg-[#8B1A3A]/5 border border-[#8B1A3A]/15 rounded-2xl px-4 py-2.5">
                        <img src="https://i.imgur.com/lg1bkrO.png" className="w-[28px] h-[28px] object-contain rounded-full shadow-sm" alt="Capucines"/>
                        <div>
                          <div className="font-syne font-extrabold text-[20px] leading-none text-[#8B1A3A] tracking-[-0.5px]">{currentData.capucinesCount}</div>
                          <div className="font-sans text-[9px] font-semibold text-[#8B1A3A]/70 leading-[1.3] mt-0.5">films en compétition</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════════
                SLIDE 4 — GENRES & LANGUES
            ══════════════════════════════════════════════════════════ */}
            <div className="rw-slide w-1/6 h-full relative flex flex-col" id="rw-slide-4" style={{ background: 'linear-gradient(180deg, #0D0D0D 0%, #111 100%)' }}>
              <div className="absolute bottom-0 left-0 right-0 h-[18%] bg-[#F5F2EC] z-0"/>
              <div className="absolute inset-0 z-10 flex flex-col pb-3 pt-6 px-6">
                <div className="flex justify-between items-start shrink-0">
                  <div className="inline-flex items-center gap-2 bg-black/40 border border-white/15 rounded-full px-3.5 py-1.5 backdrop-blur-md shadow-sm">
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 stroke-[#E8B200] fill-none stroke-2 opacity-80"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    <span className="font-sans text-[10px] font-bold text-white/80 tracking-widest uppercase">{monthLabel}</span>
                  </div>
                  <img src={INSTA_LOGO_URL} alt="Logo" className="w-10 h-10 rounded-full border border-white/10 shadow-md object-cover"/>
                </div>
                <div className="shrink-0 mb-6 mt-4">
                  <div className="font-sans text-[9px] font-bold text-white/40 tracking-[0.15em] uppercase mb-1.5">Ce que j'ai regardé</div>
                  <div className="font-syne font-extrabold text-[34px] leading-[1.05] tracking-[-1px] text-white">
                    Mes genres<br/><span className="text-[#E8B200]">du mois</span>
                  </div>
                </div>
                <div className="flex-1 flex flex-col gap-4 justify-start min-h-0">
                  {genresArray.map((entry, i) => {
                    const [genreName, count] = entry;
                    const pct = Math.round((count / maxGenreCount) * 100);
                    const isFirst = i === 0, isSecond = i === 1, isThird = i === 2;
                    const textSize = isFirst ? 'text-[15px] text-white' : isSecond ? 'text-[13px] text-white/80' : isThird ? 'text-[12px] text-white/70' : i === 3 ? 'text-[11px] text-white/50' : 'text-[10px] text-white/35';
                    const trackHeight = isFirst ? 'h-[16px]' : isSecond ? 'h-[13px]' : isThird ? 'h-[11px]' : i === 3 ? 'h-[9px]' : 'h-[7px]';
                    const fillBg = isFirst ? 'linear-gradient(90deg, #c49a10, #FFD341)' : isSecond ? 'linear-gradient(90deg, #383838, #555)' : isThird ? 'linear-gradient(90deg, #7E0000, #b03010)' : i === 3 ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.1)';
                    return (
                      <div key={i} className="flex flex-col gap-1.5">
                        <div className="flex items-baseline justify-between">
                          <div className="flex items-center gap-1.5">
                            {MEDALS[i] && <span className="text-[12px] leading-none mb-0.5">{MEDALS[i]}</span>}
                            <span className={`font-syne font-bold tracking-[-0.3px] ${textSize}`}>{genreName}</span>
                          </div>
                          <span className="font-sans text-[9px] font-semibold tracking-[0.04em] text-white/40">{count} film{count > 1 ? 's' : ''}</span>
                        </div>
                        <div className={`w-full rounded-[3px] overflow-hidden bg-white/5 ${trackHeight}`}>
                          <div className="h-full rounded-[3px]" style={{ width: `${pct}%`, background: fillBg }}/>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="h-[18%] shrink-0 flex items-center gap-0 overflow-hidden relative z-10 -mx-6 px-6 pt-3">
                  <div className="font-sans text-[8.5px] font-bold text-[#1E1E1E]/40 tracking-[0.15em] uppercase mr-3 shrink-0">Langues</div>
                  <div className="flex items-center flex-1 min-w-0 overflow-hidden gap-3">
                    {langEntries.map((entry, i) => {
                      const [langName, count] = entry;
                      const pct = Math.round((count / totalLangsCount) * 100);
                      return (
                        <div key={i} className={`flex items-baseline gap-1 ${i !== 0 ? 'pl-3 border-l border-[#1E1E1E]/15' : ''}`}>
                          <span className={`font-syne font-extrabold text-[20px] leading-none tracking-[-0.5px] ${i === 0 ? 'text-[#c49a10]' : 'text-[#1E1E1E]'}`}>{pct}%</span>
                          <span className="font-sans text-[9px] font-bold text-[#1E1E1E]/60 tracking-[0.1em] uppercase">{langName}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════════
                SLIDE 5 — TOP / FLOP
            ══════════════════════════════════════════════════════════ */}
            <div className="rw-slide w-1/6 h-full relative overflow-hidden" id="rw-slide-5">
              <div className="absolute left-0 right-0 top-0 w-full h-1/2 overflow-hidden bg-[#0A0A0A]">
                {currentData?.bestMovie?.affiche && (
                  <img src={getPosterUrl(currentData.bestMovie.affiche)} crossOrigin="anonymous" className="absolute inset-0 w-full h-full object-cover object-top z-0 saturate-[0.8] brightness-[0.55]" alt=""/>
                )}
                <div className="absolute inset-0 z-[1]" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.05) 30%, rgba(0,0,0,0.55) 70%, rgba(0,0,0,0.82) 100%)' }}/>
                <div className="absolute inset-0 z-10 flex flex-col justify-end px-6 pb-6">
                  <div className="flex items-center gap-1.5 font-sans font-bold text-[9px] tracking-[0.16em] uppercase text-white/55 mb-1.5">
                    <span className="block w-[18px] h-[2px] bg-[#E8B200] rounded-[2px]"/>Coup de cœur
                  </div>
                  <div className="font-syne font-extrabold text-[24px] leading-[1.05] tracking-[-0.5px] text-white mb-2 line-clamp-2">
                    {currentData?.bestMovie?.titre || '—'}
                  </div>
                  {renderStars(parseFloat(String(currentData?.bestMovie?.note || 0).replace(',', '.')), true)}
                </div>
              </div>
              <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/15 z-20"/>
              <div className="absolute left-0 right-0 bottom-0 w-full h-1/2 overflow-hidden bg-[#F5F2EC]">
                {currentData?.worstMovie?.affiche && (
                  <img src={getPosterUrl(currentData.worstMovie.affiche)} crossOrigin="anonymous" className="absolute inset-0 w-full h-full object-cover object-top z-0 saturate-[0.5] brightness-[0.75] sepia-[0.15]" alt=""/>
                )}
                <div className="absolute inset-x-0 -bottom-[2px] top-0 z-[1]" style={{ background: 'linear-gradient(180deg, rgba(245,242,236,0.2) 0%, rgba(245,242,236,0.05) 25%, rgba(245,242,236,0.65) 65%, rgba(245,242,236,0.92) 100%)' }}/>
                <div className="absolute inset-0 z-10 flex flex-col justify-end px-6 pb-6">
                  <div className="flex items-center gap-1.5 font-sans font-bold text-[9px] tracking-[0.16em] uppercase text-[#1E1E1E]/45 mb-1.5">
                    <span className="block w-[18px] h-[2px] bg-[#1E1E1E]/30 rounded-[2px]"/>À oublier
                  </div>
                  <div className="font-syne font-extrabold text-[24px] leading-[1.05] tracking-[-0.5px] text-[#1E1E1E] mb-2 line-clamp-2">
                    {currentData?.worstMovie?.titre || '—'}
                  </div>
                  {renderStars(parseFloat(String(currentData?.worstMovie?.note || 0).replace(',', '.')), false)}
                </div>
              </div>
              <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-30">
                <div className="inline-flex items-center gap-2 bg-black/40 border border-white/15 rounded-full px-3.5 py-1.5 backdrop-blur-md shadow-sm">
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 stroke-[#E8B200] fill-none stroke-2 opacity-80"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  <span className="font-sans text-[10px] font-bold text-white/80 tracking-widest uppercase">{monthLabel}</span>
                </div>
                <img src={INSTA_LOGO_URL} alt="Logo" className="w-10 h-10 rounded-full border border-white/10 shadow-md object-cover"/>
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════════
                SLIDE 6 — PROFIL CINÉPHILE
            ══════════════════════════════════════════════════════════ */}
            <div className="rw-slide w-1/6 h-full relative bg-[#0A0A0A] overflow-hidden" id="rw-slide-6">
              <div className="rw-glow-a"/><div className="rw-glow-b"/>
              <div className="absolute top-6 left-6 right-6 z-30 flex justify-between items-start">
                <div className="inline-flex items-center gap-2 bg-black/40 border border-white/15 rounded-full px-3.5 py-1.5 backdrop-blur-md shadow-sm">
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 stroke-[#E8B200] fill-none stroke-2 opacity-80"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  <span className="font-sans text-[10px] font-bold text-white/80 tracking-widest uppercase">{monthLabel}</span>
                </div>
                <img src={INSTA_LOGO_URL} alt="Logo" className="w-10 h-10 rounded-full border border-white/10 shadow-md object-cover"/>
              </div>
              <div className="absolute top-[85px] left-4 right-4 z-20 flex flex-col border border-white/10 rounded-[14px] p-4 bg-white/5 backdrop-blur-md shadow-xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-sans text-[8px] font-bold text-white/20 tracking-[0.18em] uppercase">Profil ciné du mois</span>
                  <span className="font-sans text-[8px] font-medium text-white/20 tracking-[0.1em]">— {monthNum} / {year}</span>
                </div>
                <div className="font-sans text-[8px] font-semibold text-white/30 tracking-[0.14em] uppercase mb-1">Archétype du mois</div>
                <div className="font-syne font-extrabold text-[clamp(32px,10vw,48px)] leading-[0.92] text-white tracking-[-2px] mb-2 break-words">
                  {archNameParts[0]}<br/>
                  {archNameParts[1] && <span className="text-[#E8B200]">{archNameParts[1]}</span>}
                </div>
                <div className="font-sans text-[9.5px] font-light text-white/40 leading-[1.5]">{archetype.desc}</div>
                <div className="w-full h-px bg-white/10 my-3"/>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="font-sans text-[7.5px] font-semibold text-white/25 tracking-[0.14em] uppercase mb-1">Genre dominant</div>
                    <div className="font-syne font-bold text-[13px] leading-none text-white tracking-[-0.3px]">{topGenre}</div>
                  </div>
                  <div>
                    <div className="font-sans text-[7.5px] font-semibold text-white/25 tracking-[0.14em] uppercase mb-1">Note moyenne</div>
                    <div className="font-syne font-bold text-[18px] leading-none text-white tracking-[-0.6px] flex items-baseline">
                      {currentData?.averageRating?.toFixed(1) || 0}
                      <span className="font-normal text-[11px] text-[#E8B200] ml-1 tracking-normal">/ 5</span>
                    </div>
                    <div className="mt-1.5">{renderStars(currentData?.averageRating || 0, true, "w-[10px] h-[10px]")}</div>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-6 p-4 pb-5 border-t border-white/10 z-20">
                <div className="font-sans font-semibold text-[10.5px] text-white/30 tracking-[-0.2px] leading-[1.5]">
                  Rendez-vous début <strong className="text-white/60 font-extrabold">{nextMonthLabel}</strong>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── STEPPER ── */}
      <div className="px-5 mt-4 mb-4">
        <div className="flex items-center gap-1.5 mb-2">
          {SLIDE_NAMES.map((_, i) => (
            <div key={i} onClick={() => goToSlide(i)}
              className={`flex-1 h-1.5 cursor-pointer rounded-full transition-all ${i === currentSlide ? 'bg-[#E8B200]' : i < currentSlide ? 'bg-[#E8B200]/30' : 'bg-white/10 hover:bg-white/20'}`}/>
          ))}
        </div>
        <div className="flex justify-between px-1">
          {SLIDE_NAMES.map((name, i) => (
            <span key={i} onClick={() => goToSlide(i)}
              className={`font-outfit text-[9px] uppercase font-bold tracking-widest cursor-pointer ${i === currentSlide ? 'text-[#E8B200]' : 'text-white/30 hover:text-white/50'}`}>
              {name}
            </span>
          ))}
        </div>
      </div>

      {/* ── EXPORT ACTIONS ── */}
      <div className="mx-5 mt-6 mb-12 flex flex-col gap-3">
        <button onClick={handleDownloadAll} disabled={isDownloading}
          className={`w-full h-14 rounded-2xl flex items-center justify-center gap-2.5 font-outfit font-extrabold text-sm transition-all ${isDownloading ? 'bg-[#E8B200]/50 text-black/50 cursor-wait' : 'bg-[#E8B200] text-[#0A0A0A] shadow-[0_4px_24px_rgba(232,178,0,0.3)] active:scale-95'}`}>
          {isDownloading ? <div className="w-5 h-5 border-2 border-black/30 border-t-black animate-spin rounded-full"/> : <><Layers size={18} strokeWidth={2.5}/>Tout télécharger (6 slides)</>}
        </button>
        <button onClick={handleDownload} disabled={isDownloading}
          className="w-full h-12 rounded-2xl flex items-center justify-center gap-2 font-outfit font-semibold text-xs text-white/70 bg-white/5 border border-white/10 active:scale-95 transition-all">
          <Download size={14} strokeWidth={2.5}/>Uniquement cette slide — {SLIDE_NAMES[currentSlide]}
        </button>
      </div>

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STORY SÉANCE — CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const STORY_W = 1080;
const STORY_H = 1920;
const GOLD    = '#E8B200';
const FONT    = 'system-ui,-apple-system,sans-serif';

const EXPECTATIONS = [
  { label: 'Traîné',   sub: 'On m\'a forcé',           barHex: 'rgba(255,255,255,0.35)' },
  { label: 'Intrigué', sub: 'Le trailer m\'a accroché',  barHex: '#93C5FD' },
  { label: 'Chaud',    sub: 'Belle envie',               barHex: '#C084FC' },
  { label: 'Impatient', sub: 'Je ne pense qu\'à ça',         barHex: '#FB923C' },
  { label: 'Hanté',    sub: 'OMG mais enfin', barHex: GOLD },
];

// ─────────────────────────────────────────────────────────────────────────────
// STORY SÉANCE — CANVAS RENDERER
// ─────────────────────────────────────────────────────────────────────────────
async function renderStoryToCanvas(canvas, params) {
  const { title, date, time, lang, duration, expectation, posterImg, screeningLabel } = params;
  const ctx = canvas.getContext('2d');
  canvas.width = STORY_W; canvas.height = STORY_H;

  ctx.fillStyle = '#060606';
  ctx.fillRect(0, 0, STORY_W, STORY_H);

  const POSTER_H = Math.round(STORY_H * 0.68);
  if (posterImg) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, STORY_W, POSTER_H);
    ctx.clip();
    ctx.globalAlpha = 1;
    drawImageCover(ctx, posterImg, 0, 0, STORY_W, POSTER_H);
    ctx.restore();
    const gTop = ctx.createLinearGradient(0, 0, 0, 340);
    gTop.addColorStop(0, 'rgba(6,6,6,0.55)');
    gTop.addColorStop(1, 'rgba(6,6,6,0)');
    ctx.fillStyle = gTop;
    ctx.fillRect(0, 0, STORY_W, 340);
  }

  const gFade = ctx.createLinearGradient(0, POSTER_H - 280, 0, POSTER_H + 20);
  gFade.addColorStop(0, 'rgba(6,6,6,0)');
  gFade.addColorStop(1, 'rgba(245,242,236,1)');
  ctx.fillStyle = gFade;
  ctx.fillRect(0, POSTER_H - 280, STORY_W, 300);

  const badgeFont = `500 34px ${FONT_SANS}`;
  ctx.font = badgeFont;
  const badgeText = screeningLabel.toUpperCase();
  const bW = ctx.measureText(badgeText).width + 60, bH = 64, bR = bH / 2;
  ctx.save();
  ctx.globalAlpha = 0.65;
  ctx.fillStyle = '#000';
  roundRect(ctx, 64, 140, bW, bH, bR); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  ctx.fillText(badgeText, 64 + 30, 140 + bH / 2);
  ctx.restore();

  const TICKET_Y = POSTER_H;
  const TICKET_H = STORY_H - TICKET_Y;
  ctx.fillStyle = '#F5F2EC';
  ctx.fillRect(0, TICKET_Y, STORY_W, TICKET_H);

  ctx.save();
  ctx.fillStyle = '#F5F2EC';
  ctx.beginPath();
  const tearY = TICKET_Y - 28;
  const steps = 54;
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * STORY_W;
    const y = tearY + (i % 2 === 0 ? 0 : 28 + Math.sin(i * 1.7) * 8);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.lineTo(STORY_W, STORY_H);
  ctx.lineTo(0, STORY_H);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  const LEFT = 80;
  let cy = TICKET_Y + 60;

  ctx.font = `800 88px ${FONT_SYNE}`;
  ctx.fillStyle = '#1a1a1a';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  const titleLines = wrapText(ctx, title || 'Titre du film', STORY_W - LEFT * 2).slice(0, 2);
  titleLines.forEach(line => { ctx.fillText(line, LEFT, cy); cy += 96; });
  cy += 16;

  const pillItems = [
    { text: date },
    { text: time.replace(':', 'h') },
    { text: duration || '' },
    { text: lang },
  ].filter(p => p.text);

  const pH = 56, pR = pH / 2;
  ctx.font = `600 28px ${FONT_SANS}`;
  let px = LEFT;
  for (const item of pillItems) {
    const tw = ctx.measureText(item.text).width;
    const pw = tw + 44;
    ctx.save();
    ctx.fillStyle = 'rgba(30,30,30,0.08)';
    roundRect(ctx, px, cy, pw, pH, pR); ctx.fill();
    ctx.fillStyle = 'rgba(30,30,30,0.6)';
    ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    ctx.fillText(item.text, px + 22, cy + pH / 2);
    ctx.restore();
    px += pw + 14;
    if (px > STORY_W - LEFT - 200) { px = LEFT; cy += pH + 14; }
  }
  cy += pH + 36;

  ctx.strokeStyle = 'rgba(30,30,30,0.1)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(LEFT, cy); ctx.lineTo(STORY_W - LEFT, cy);
  ctx.stroke();
  ctx.setLineDash([]);
  cy += 44;

  const R_OUT = 148, R_IN = 108;
  const GAP = 40;
  const TEXT_W = 280;
  const GAUGE_DIAM = R_OUT * 2;
  const GROUP_W = GAUGE_DIAM + GAP + TEXT_W;
  const GROUP_X = (STORY_W - GROUP_W) / 2;   // décalage gauche pour centrer le groupe

  const GCX = GROUP_X + R_OUT;               // centre de l'arc
  const GCY = cy + R_OUT;                    // centre de l'arc (base = cy)

  // Arc fond
  ctx.save();
  ctx.strokeStyle = 'rgba(30,30,30,0.08)';
  ctx.lineWidth = R_OUT - R_IN;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(GCX, GCY, (R_OUT + R_IN) / 2, Math.PI, 0, false);
  ctx.stroke();

  // Arc rempli
  const progress = expectation / 4;
  const arcAngle = Math.PI * progress;
  const fillColor = EXPECTATIONS[expectation].barHex;
  ctx.strokeStyle = fillColor;
  ctx.lineWidth = R_OUT - R_IN;
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.arc(GCX, GCY, (R_OUT + R_IN) / 2, Math.PI, Math.PI + arcAngle, false);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Marques des 5 positions
  for (let i = 0; i <= 4; i++) {
    const angle = Math.PI + (Math.PI * i / 4);
    const mx1 = GCX + (R_IN - 10) * Math.cos(angle);
    const my1 = GCY + (R_IN - 10) * Math.sin(angle);
    const mx2 = GCX + (R_OUT + 10) * Math.cos(angle);
    const my2 = GCY + (R_OUT + 10) * Math.sin(angle);
    ctx.strokeStyle = '#F5F2EC';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(mx1, my1); ctx.lineTo(mx2, my2);
    ctx.stroke();
  }

// Aiguille — Projecteur cinéma
  const needleAngle = Math.PI + (Math.PI * expectation / 4);
  const needleLen = R_IN - 12;
  const nx = GCX + needleLen * Math.cos(needleAngle);
  const ny = GCY + needleLen * Math.sin(needleAngle);

  ctx.save();

// ── FAISCEAU — faisceau correct orienté dans la direction de l'aiguille

ctx.save();

const beamLen = (R_IN - 12) + 60;     // un peu plus long que l'aiguille
const beamHalfAngle = 0.28;           // demi-angle d'ouverture (~16°)
const haloHalfAngle = 0.48;

// Angles des bords gauche/droit
const leftAngle  = needleAngle - beamHalfAngle;
const rightAngle = needleAngle + beamHalfAngle;
const haloLeft   = needleAngle - haloHalfAngle;
const haloRight  = needleAngle + haloHalfAngle;

// Points d'extrémité sur les bords du cône
const beamL = { x: GCX + beamLen * Math.cos(leftAngle),  y: GCY + beamLen * Math.sin(leftAngle)  };
const beamR = { x: GCX + beamLen * Math.cos(rightAngle), y: GCY + beamLen * Math.sin(rightAngle) };
const haloL = { x: GCX + beamLen * Math.cos(haloLeft),   y: GCY + beamLen * Math.sin(haloLeft)   };
const haloR = { x: GCX + beamLen * Math.cos(haloRight),  y: GCY + beamLen * Math.sin(haloRight)  };

// Centre de l'arc terminal = point sur l'axe central à distance beamLen
const arcCX = GCX + beamLen * Math.cos(needleAngle);
const arcCY = GCY + beamLen * Math.sin(needleAngle);
// Rayon de l'arc terminal = distance entre arcC et beamL/beamR
const beamArcR = Math.sqrt((beamR.x - arcCX) ** 2 + (beamR.y - arcCY) ** 2);
const haloArcR = Math.sqrt((haloR.x - arcCX) ** 2 + (haloR.y - arcCY) ** 2);

// Angles de l'arc terminal vus depuis arcC
const arcStartAngle = Math.atan2(beamL.y - arcCY, beamL.x - arcCX);
const arcEndAngle   = Math.atan2(beamR.y - arcCY, beamR.x - arcCX);
const haloArcStart  = Math.atan2(haloL.y - arcCY, haloL.x - arcCX);
const haloArcEnd    = Math.atan2(haloR.y - arcCY, haloR.x - arcCX);

// ── HALO
ctx.beginPath();
ctx.moveTo(GCX, GCY);
ctx.lineTo(haloL.x, haloL.y);
ctx.arc(arcCX, arcCY, haloArcR, haloArcStart, haloArcEnd, false);
ctx.lineTo(GCX, GCY);
ctx.closePath();
const haloGrad = ctx.createRadialGradient(GCX, GCY, 10, GCX, GCY, beamLen + 60);
haloGrad.addColorStop(0,   'rgba(255, 220, 80, 0.18)');
haloGrad.addColorStop(0.6, 'rgba(255, 210, 60, 0.07)');
haloGrad.addColorStop(1,   'rgba(255, 200, 40, 0)');
ctx.fillStyle = haloGrad;
ctx.fill();

// ── CÔNE PRINCIPAL
ctx.beginPath();
ctx.moveTo(GCX, GCY);
ctx.lineTo(beamL.x, beamL.y);
ctx.arc(arcCX, arcCY, beamArcR, arcStartAngle, arcEndAngle, false);
ctx.lineTo(GCX, GCY);
ctx.closePath();
const beamGrad = ctx.createRadialGradient(GCX, GCY, 12, GCX, GCY, beamLen);
beamGrad.addColorStop(0,   'rgba(255, 220, 80, 0.58)');
beamGrad.addColorStop(0.5, 'rgba(255, 210, 60, 0.30)');
beamGrad.addColorStop(1,   'rgba(255, 200, 40, 0)');
ctx.fillStyle = beamGrad;
ctx.fill();

ctx.restore();

  // ── PIED DU PROJECTEUR (fixe, coordonnées canvas absolues)
  const footX = GCX;
  const footY = GCY;

  ctx.fillStyle = '#1c1c1c';
  // Bras vertical
  ctx.beginPath();
  ctx.roundRect(footX - 5, footY, 10, 32, 3);
  ctx.fill();
  // Base horizontale
  ctx.beginPath();
  ctx.roundRect(footX - 18, footY + 28, 36, 8, 4);
  ctx.fill();

  // ── CORPS DU PROJECTEUR (pivote avec l'aiguille)
  ctx.translate(GCX, GCY);
  ctx.rotate(needleAngle);

  // Corps principal
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.roundRect(-10, -13, 36, 26, 5);
  ctx.fill();

  // Ailette arrière
  ctx.fillStyle = '#252525';
  ctx.beginPath();
  ctx.moveTo(26,  -13);
  ctx.lineTo(40,  -20);
  ctx.lineTo(40,   20);
  ctx.lineTo(26,   13);
  ctx.closePath();
  ctx.fill();

  // Lentille frontale
  ctx.fillStyle = '#0a0a0a';
  ctx.beginPath();
  ctx.arc(-10, 0, 13, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#2e2e2e';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(-10, 0, 13, 0, Math.PI * 2);
  ctx.stroke();

  // Lueur lentille (jaune fixe, couleur lumière)
  ctx.fillStyle = 'rgba(255, 220, 80, 0.85)';
  ctx.beginPath();
  ctx.arc(-10, 0, 7, 0, Math.PI * 2);
  ctx.fill();

  // Reflet spéculaire
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.beginPath();
  ctx.arc(-14, -4, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // Labels extrêmes sous l'arc
  ctx.font = `500 22px ${FONT_SANS}`;
  ctx.fillStyle = 'rgba(30,30,30,0.28)';
  ctx.textBaseline = 'top'; ctx.textAlign = 'left';
  ctx.fillText('Draîné', GCX - R_OUT, GCY + 18);
  ctx.textAlign = 'right';
  ctx.fillText('Hanté', GCX + R_OUT, GCY + 18);

  // ── BLOC TEXTE : centré verticalement sur la hauteur de l'arc (GCY - R_OUT → GCY)
  const TEXT_X = GCX + R_OUT + GAP;
  // hauteur totale du bloc texte : label(24) + gap(8) + label_val(52+) + gap(12) + sub(26)
  // on centre ce bloc sur GCY - R_OUT/2 (milieu vertical de l'arc)
  const arcMidY = GCY - R_OUT / 2;

  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';

  // "HYPE LEVEL" — petit label
  ctx.font = `600 24px ${FONT_SANS}`;
  ctx.fillStyle = 'rgba(30,30,30,0.32)';
  const hypeLineH = 24;
  const labelLineH = 58;
  const subLineH   = 30;
  const blockH = hypeLineH + 10 + labelLineH + 10 + subLineH;
  const blockStartY = arcMidY - blockH / 2;

  ctx.textBaseline = 'top';
  ctx.fillText('HYPE LEVEL', TEXT_X, blockStartY);

  // Mot clé principal
  ctx.font = `800 52px ${FONT_SYNE}`;
  ctx.fillStyle = '#1a1a1a';
  const labelLines = wrapText(ctx, EXPECTATIONS[expectation].label, TEXT_W);
  labelLines.forEach((line, i) => {
    ctx.fillText(line, TEXT_X, blockStartY + hypeLineH + 10 + i * labelLineH);
  });

  // Sous-texte
  ctx.font = `400 26px ${FONT_SANS}`;
  ctx.fillStyle = 'rgba(30,30,30,0.42)';
  const subLines = wrapText(ctx, EXPECTATIONS[expectation].sub, TEXT_W);
  subLines.forEach((line, i) => {
    ctx.fillText(line, TEXT_X, blockStartY + hypeLineH + 10 + labelLines.length * labelLineH + 10 + i * subLineH);
  });

  return canvas;
}

// ─────────────────────────────────────────────────────────────────────────────
// STORY SÉANCE TOOL
// ─────────────────────────────────────────────────────────────────────────────
function SeanceStoryTool({ historyData = [], onBack, pendingFilm }) {
  const [title,         setTitle]         = useState(pendingFilm?.titre  || '');
  const [date,          setDate]          = useState(pendingFilm?.date   || new Date().toLocaleDateString('fr-FR'));
  const [time,          setTime]          = useState(pendingFilm?.heure  ? pendingFilm.heure.replace('h', ':') : '20:00');
  const [lang,          setLang]          = useState(pendingFilm?.langue || 'VOSTFR');
  const [duration,      setDuration]      = useState(pendingFilm?.duree  || '');
  const [expectation,   setExpectation]   = useState(2);
  const [isDownloading, setIsDownloading] = useState(false);
  const [posterImg,     setPosterImg]     = useState(null);
  const [posterLoading, setPosterLoading] = useState(false);
  const [previewScale,  setPreviewScale]  = useState(0.3);

  const previewRef   = useRef(null);
  const wrapperRef   = useRef(null);
  const fileInputRef = useRef(null);
  const paramsRef    = useRef({});
  const blobUrlsRef  = useRef([]);

  const currentYear  = date ? date.split('/')[2] : String(new Date().getFullYear());
  const yearlyScreeningNumber = (historyData || []).filter(f => f.date?.endsWith(currentYear)).length + 1;
  const screeningLabel = `${currentYear} — Séance #${String(yearlyScreeningNumber).padStart(3, '0')}`;

  useEffect(() => {
    if (!pendingFilm?.affiche) { setPosterImg(null); return; }
    setPosterLoading(true);
    loadImageForCanvas(pendingFilm.affiche).then(img => {
      if (img?.src?.startsWith('blob:')) blobUrlsRef.current.push(img.src);
      setPosterImg(img); setPosterLoading(false);
    });
  }, [pendingFilm?.affiche]);

  useEffect(() => () => { blobUrlsRef.current.forEach(URL.revokeObjectURL); }, []);
  paramsRef.current = { title, date, time, lang, duration, expectation, posterImg, screeningLabel };

  useEffect(() => {
    if (previewRef.current) renderStoryToCanvas(previewRef.current, paramsRef.current);
  }, [title, date, time, lang, duration, expectation, posterImg, screeningLabel]);

  const assignPreviewRef = useCallback(node => {
    previewRef.current = node;
    if (node) requestAnimationFrame(() => renderStoryToCanvas(node, paramsRef.current));
  }, []);

  useEffect(() => {
    const update = () => { if (wrapperRef.current) setPreviewScale(wrapperRef.current.offsetWidth / STORY_W); };
    update(); window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const handleImageUpload = async e => {
    const file = e.target.files?.[0]; if (!file) return;
    setPosterLoading(true);
    const objectUrl = URL.createObjectURL(file);
    blobUrlsRef.current.push(objectUrl);
    try { const img = await loadImgElement(objectUrl); setPosterImg(img); }
    catch { alert('Impossible de charger cette image.'); }
    finally { setPosterLoading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  const downloadStory = useCallback(async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      const exportCanvas = document.createElement('canvas');
      await renderStoryToCanvas(exportCanvas, paramsRef.current);
      exportCanvas.toBlob(async blob => {
        if (!blob) { alert('Erreur de génération.'); setIsDownloading(false); return; }
        const file = new File([blob], `seance_${yearlyScreeningNumber}.png`, { type: 'image/png' });
        if (navigator.canShare?.({ files: [file] })) {
          try { await navigator.share({ files: [file], title: `Séance #${yearlyScreeningNumber} — ${paramsRef.current.title}` }); }
          catch (e) { if (e.name !== 'AbortError') console.error(e); }
        } else {
          const url = URL.createObjectURL(blob);
          Object.assign(document.createElement('a'), { href: url, download: `story_seance_${yearlyScreeningNumber}.png` }).click();
          setTimeout(() => URL.revokeObjectURL(url), 5000);
        }
        setIsDownloading(false);
      }, 'image/png');
    } catch (err) { console.error(err); alert('Erreur inattendue. Réessaie.'); setIsDownloading(false); }
  }, [isDownloading, yearlyScreeningNumber]);

  const HYPE_COLORS = ['rgba(255,255,255,0.4)', '#93C5FD', '#C084FC', '#FB923C', '#E8B200'];

  return (
    <div className="animate-in fade-in pb-24 flex flex-col min-h-screen bg-[#0C0C0E] overflow-x-hidden">
      <header className="z-40 sticky top-0 w-full bg-[#0C0C0E]/90 backdrop-blur-xl border-b border-white/10 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 px-6 flex justify-between items-center text-white">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
          <ChevronLeft size={20} strokeWidth={2.5}/>
        </button>
        <h2 className="font-galinoy italic text-xl tracking-tight">Story Séance</h2>
        <div className="w-10"/>
      </header>

      <div className="px-5 py-6 flex flex-col gap-5">

        {/* PREVIEW */}
        <div ref={wrapperRef} className="w-full relative bg-black rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl" style={{ aspectRatio: '9/16' }}>
          {posterLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/60 rounded-[2rem]">
              <div className="w-8 h-8 border-2 border-[#E8B200] border-t-transparent rounded-full animate-spin"/>
            </div>
          )}
          <canvas ref={assignPreviewRef} width={STORY_W} height={STORY_H}
            className="absolute top-0 left-0 origin-top-left"
            style={{ width: `${STORY_W}px`, height: `${STORY_H}px`, transform: `scale(${previewScale})` }}/>
        </div>

        {/* HYPE SELECTOR */}
        <div className="bg-[#141418] border border-white/8 rounded-2xl p-5">
          <div className="font-outfit text-[10px] font-bold tracking-widest uppercase text-white/30 mb-3">
            Hype level
          </div>
          {/* Jauge visuelle interactive */}
          <div className="flex gap-2 mb-3">
            {EXPECTATIONS.map((exp, i) => (
              <button key={i} onClick={() => setExpectation(i)}
                className="flex-1 flex flex-col items-center gap-1.5 group transition-all active:scale-95">
                <div className="w-full h-1.5 rounded-full transition-all"
                  style={{ background: i <= expectation ? exp.barHex : 'rgba(255,255,255,0.08)' }}/>
                <span className="font-outfit text-[8px] font-semibold transition-all"
                  style={{ color: i === expectation ? exp.barHex : 'rgba(255,255,255,0.2)' }}>
                  {exp.label}
                </span>
              </button>
            ))}
          </div>
          {/* Label sélectionné */}
          <div className="flex items-center gap-2 mt-1">
            <span className="font-syne font-black text-base tracking-tight"
              style={{ color: EXPECTATIONS[expectation].barHex }}>
              {EXPECTATIONS[expectation].label}
            </span>
            <span className="font-outfit text-xs text-white/30">·</span>
            <span className="font-outfit text-xs text-white/40 italic">
              {EXPECTATIONS[expectation].sub}
            </span>
          </div>
        </div>

        {/* INFOS FILM */}
        <div className="bg-[#141418] border border-white/8 rounded-2xl p-5 flex flex-col gap-4">
          <div className="font-outfit text-[10px] font-bold tracking-widest uppercase text-white/30">Infos séance</div>

          {/* Titre */}
          <div>
            <label className="font-outfit text-[9px] font-semibold text-white/30 uppercase tracking-widest block mb-1.5">Titre</label>
            <input
              type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Titre du film…"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-outfit text-sm text-white placeholder:text-white/20 outline-none focus:border-[#E8B200]/50 transition-colors"
            />
          </div>

          {/* Date + Heure */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-outfit text-[9px] font-semibold text-white/30 uppercase tracking-widest block mb-1.5">Date</label>
              <input type="text" value={date} onChange={e => setDate(e.target.value)}
                placeholder="JJ/MM/AAAA"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-outfit text-sm text-white placeholder:text-white/20 outline-none focus:border-[#E8B200]/50 transition-colors"/>
            </div>
            <div>
              <label className="font-outfit text-[9px] font-semibold text-white/30 uppercase tracking-widest block mb-1.5">Heure</label>
              <input type="text" value={time} onChange={e => setTime(e.target.value)}
                placeholder="20:00"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-outfit text-sm text-white placeholder:text-white/20 outline-none focus:border-[#E8B200]/50 transition-colors"/>
            </div>
          </div>

          {/* Durée + Langue */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-outfit text-[9px] font-semibold text-white/30 uppercase tracking-widest block mb-1.5">Durée</label>
              <input type="text" value={duration} onChange={e => setDuration(e.target.value)}
                placeholder="2h08"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-outfit text-sm text-white placeholder:text-white/20 outline-none focus:border-[#E8B200]/50 transition-colors"/>
            </div>
            <div>
              <label className="font-outfit text-[9px] font-semibold text-white/30 uppercase tracking-widest block mb-1.5">Langue</label>
              <input type="text" value={lang} onChange={e => setLang(e.target.value)}
                placeholder="VOSTFR"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-outfit text-sm text-white placeholder:text-white/20 outline-none focus:border-[#E8B200]/50 transition-colors"/>
            </div>
          </div>
        </div>

        {/* AFFICHE MANUELLE */}
        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden"/>
        <button onClick={() => fileInputRef.current?.click()}
          className="w-full h-12 rounded-2xl bg-white/5 text-white/60 font-outfit font-semibold text-xs flex items-center justify-center gap-2.5 active:scale-95 transition-all border border-white/8 hover:bg-white/8">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          Changer l'affiche manuellement
        </button>

        {/* PARTAGER */}
        <button onClick={downloadStory} disabled={isDownloading || !title.trim()}
          className={`w-full h-14 rounded-2xl flex items-center justify-center gap-2.5 font-outfit font-extrabold text-sm transition-all
            ${isDownloading || !title.trim()
              ? 'bg-[#E8B200]/40 text-black/40 cursor-wait'
              : 'bg-[#E8B200] text-[#0A0A0A] shadow-[0_4px_24px_rgba(232,178,0,0.28)] active:scale-95'}`}>
          {isDownloading
            ? <div className="w-5 h-5 border-2 border-black/30 border-t-black animate-spin rounded-full"/>
            : <>
                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                  <polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
                </svg>
                Partager la Story
              </>}
        </button>

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STUDIO HUB
// ─────────────────────────────────────────────────────────────────────────────
function StudioHub({ isScrolled, onSelectTool, onLock, pendingFilm, historyData, onHeaderRight, onHeaderTitle }) {

  useEffect(() => {
    onHeaderRight?.(
      <button
        onClick={onLock}
        className="w-9 h-9 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20 active:scale-90 transition-all"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      </button>
    );
    return () => onHeaderRight?.(null);
  }, [onLock, onHeaderRight]);

  const getPosterUrl = (url) => {
    if (!url) return '';
    const proxyBase = import.meta.env.DEV ? '/tmdb-proxy' : '/api/proxy-image';
    return `${proxyBase}?url=${encodeURIComponent(url)}`;
  };

  const bgImage         = pendingFilm?.affiche ? getPosterUrl(pendingFilm.affiche) : null;
  const latestRatedFilm = historyData && historyData.length > 0 ? historyData[0] : null;
  const avisBgImage     = latestRatedFilm?.affiche ? getPosterUrl(latestRatedFilm.affiche) : null;
  const recentPosters   = (historyData || []).filter(f => f.affiche).map(f => getPosterUrl(f.affiche)).slice(0, 16);

  return (
    <div className="studio-hub animate-in fade-in slide-in-from-bottom-4 duration-500 pb-safe-24 font-outfit bg-[var(--theme-bg)] min-h-screen text-[#F0EEF5]">
      <main
        className="space-y-8 pb-12"
        style={{ paddingTop: 'calc(var(--header-total-height, 96px) + 1.5rem)' }}
      >

        {/* ── RECAP CARD ── */}
        <div className="px-6">
          <h2 className="font-outfit font-extrabold text-[var(--theme-text)] text-[10px] tracking-[0.25em] uppercase mb-4">
            L'événement du mois
          </h2>
          <div className="relative cursor-pointer group" onClick={() => onSelectTool('recap')}>
            <div className="absolute inset-0 bg-white/5 border border-white/5 rounded-3xl transform rotate-3 scale-95 transition-transform group-hover:rotate-6 group-active:scale-90 origin-bottom-right"/>
            <div className="absolute inset-0 bg-white/10 border border-white/10 rounded-3xl transform -rotate-2 scale-[0.98] transition-transform group-hover:-rotate-4 group-active:scale-95 origin-bottom-left"/>

            <div className="relative bg-[#050505] border border-white/10 rounded-3xl p-6 overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.6)] transition-all duration-500 group-hover:border-[#E8B200]/40 group-active:scale-[0.98] aspect-[4/3] flex flex-col justify-between">

              {/* Poster mosaic bg */}
              <div className="absolute inset-0 z-0 overflow-hidden opacity-30 group-hover:opacity-50 transition-opacity duration-700">
                <div className="absolute inset-0 flex gap-2 w-[150%] h-[150%] -top-[25%] -left-[25%] transform -rotate-12 scale-110">
                  {Array.from({ length: 4 }).map((_, colIdx) => (
                    <div key={colIdx} className={`flex-1 flex flex-col gap-2 ${colIdx % 2 !== 0 ? 'pt-12' : ''}`}>
                      {Array.from({ length: 4 }).map((_, rowIdx) => {
                        const poster = recentPosters[(colIdx * 4 + rowIdx) % (recentPosters.length || 1)];
                        return poster ? (
                          <div key={rowIdx} className="w-full aspect-[2/3] rounded-lg overflow-hidden flex-shrink-0 bg-white/5 shadow-lg">
                            <img src={poster} className="w-full h-full object-cover saturate-[0.8]" crossOrigin="anonymous" alt=""/>
                          </div>
                        ) : (
                          <div key={rowIdx} className="w-full aspect-[2/3] rounded-lg bg-white/5 flex-shrink-0"/>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative z-30 flex justify-between items-start">
                <div className="bg-[#E8B200] border border-[#E8B200]/50 rounded-full px-3 py-1 flex items-center gap-2 shadow-[0_0_20px_rgba(232,178,0,0.25)]">
                  <Layers size={11} className="text-black" strokeWidth={3}/>
                  <span className="font-outfit font-black text-[9px] text-black uppercase tracking-[0.1em]">6 Slides</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-xl group-hover:border-[#E8B200]/50 transition-colors">
                  <Film size={18} className="text-white/70 group-hover:text-[#E8B200] group-hover:scale-110 transition-all" strokeWidth={1.5}/>
                </div>
              </div>

              <div className="relative z-30">
                <div className="flex items-center gap-2.5 mb-2.5">
                  <div className="h-[1px] w-9 bg-[#E8B200]/60"/>
                  <span className="font-outfit font-bold text-[9px] text-[#E8B200] uppercase tracking-[0.35em]">Rewind exclusif</span>
                </div>
                <h3 className="font-galinoy italic text-4xl text-white leading-[0.95] tracking-tight mb-3 drop-shadow-lg">
                  Récap'<br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E8B200] via-[#FFD341] to-[#E8B200] animate-gradient-x animate-title-glow">
                    Mensuel
                  </span>
                </h3>
                <p className="font-outfit text-sm text-white/70 font-medium max-w-[88%] leading-relaxed drop-shadow-md">
                  Générez votre <span className="text-white">fresque narrative</span> et partagez vos moments forts du mois.
                </p>
              </div>

              <div className="absolute bottom-4 right-6 opacity-30 group-hover:opacity-100 transition-opacity z-30">
                <ChevronRight className="text-white group-hover:translate-x-1.5 transition-transform" size={20} strokeWidth={2.5}/>
              </div>
            </div>
          </div>
        </div>

        {/* ── QUICK CREATE CARDS ── */}
        <div>
          <h2 className="px-6 font-outfit font-extrabold text-[var(--theme-text)] text-[10px] tracking-[0.25em] uppercase mb-4">
            Créations Rapides
          </h2>
          <div className="flex gap-4 overflow-x-auto px-6 pb-4 scrollbar-hide">

            {/* Story Séance */}
            <div
              onClick={() => onSelectTool('seance')}
              className="snap-start shrink-0 relative w-[160px] aspect-[9/16] rounded-2xl overflow-hidden cursor-pointer group shadow-xl border border-white/10 bg-[#050505]"
            >
              {bgImage ? (
                <>
                  <img src={bgImage} className="absolute inset-0 w-full h-full object-cover z-0 transition-transform duration-700 group-hover:scale-110 saturate-[0.8]" alt="" crossOrigin="anonymous"/>
                  <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/95 via-black/50 to-black/20 group-hover:via-black/60 transition-colors"/>
                </>
              ) : (
                <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#121212] to-[#050505] opacity-80">
                  <div className="absolute inset-0 mix-blend-overlay opacity-20" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")' }}/>
                </div>
              )}
              <div className="absolute inset-0 z-20 flex flex-col justify-between p-4 group-active:scale-95 transition-transform">
                <div className="w-8 h-8 rounded-full bg-black/50 border border-white/15 backdrop-blur-md flex items-center justify-center self-end group-hover:border-[#E8B200]/40 transition-colors">
                  <Ticket size={16} className="text-white/70 group-hover:text-[#E8B200] transition-colors" strokeWidth={1.5}/>
                </div>
                <div>
                  <h3 className="font-galinoy italic text-xl text-white leading-tight mb-1">Story<br/>Séance</h3>
                  <p className="font-outfit text-[10px] text-white/60 font-medium leading-snug line-clamp-2">
                    {pendingFilm ? `Annonce "${pendingFilm.titre}"` : "Annonce ton prochain film."}
                  </p>
                </div>
              </div>
            </div>

            {/* Avis Express */}
            <div
              onClick={() => onSelectTool('share')}
              className="snap-start shrink-0 relative w-[160px] aspect-[9/16] rounded-2xl overflow-hidden cursor-pointer group shadow-xl border border-white/10 bg-[#050505]"
            >
              {avisBgImage ? (
                <>
                  <img src={avisBgImage} className="absolute inset-0 w-full h-full object-cover z-0 transition-transform duration-700 group-hover:scale-110 saturate-[0.8]" alt="" crossOrigin="anonymous"/>
                  <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/95 via-black/50 to-black/20 group-hover:via-black/60 transition-colors"/>
                </>
              ) : (
                <>
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #ffffff 10px, #ffffff 11px)' }}/>
                  <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/90 to-transparent"/>
                </>
              )}
              <div className="absolute inset-0 z-20 flex flex-col justify-between p-4 group-active:scale-95 transition-transform">
                <div className="w-8 h-8 rounded-full bg-black/50 border border-white/15 backdrop-blur-md flex items-center justify-center self-end group-hover:border-[#E8B200]/40 transition-colors">
                  <Star size={16} className="text-white/70 group-hover:text-[#E8B200] transition-colors" strokeWidth={1.5}/>
                </div>
                <div>
                  <h3 className="font-galinoy italic text-xl text-white leading-tight mb-1">Avis<br/>Express</h3>
                  <p className="font-outfit text-[10px] text-white/60 font-medium leading-snug line-clamp-2">
                    {latestRatedFilm ? `Sur "${latestRatedFilm.titre}"` : "Partage ta critique à chaud."}
                  </p>
                </div>
              </div>
            </div>

            {/* Top 10 Annuel — coming soon */}
            <div className="snap-start shrink-0 relative w-[160px] aspect-[9/16] rounded-2xl overflow-hidden shadow-xl border border-white/5 bg-[#0C0C0E] flex flex-col mr-6">
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #ffffff 10px, #ffffff 11px)' }}/>
              <div className="absolute inset-0 flex flex-col justify-between p-4 opacity-40">
                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center self-end">
                  <Sparkles size={15} className="text-white/60" strokeWidth={1.5}/>
                </div>
                <div>
                  <h3 className="font-galinoy italic text-xl text-white leading-tight mb-1">Top 10<br/>Annuel</h3>
                  <p className="font-outfit text-[10px] text-white/50 font-medium leading-snug">Le classement ultime.</p>
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                <div className="bg-[#E8B200] text-black font-outfit font-black text-[9px] uppercase tracking-[0.2em] px-3.5 py-1.5 rounded-full transform -rotate-12 shadow-[0_4px_12px_rgba(232,178,0,0.3)]">
                  Bientôt
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT EXPORT
// ─────────────────────────────────────────────────────────────────────────────
export function Studio({ historyData, pendingFilm, isScrolled, onHeaderRight, onHeaderTitle }) {
  const [isUnlocked, setIsUnlocked] = useState(localStorage.getItem('grandecran_studio_unlocked') === 'true');
  const [activeTool, setActiveTool] = useState(null);

  // Nettoyer le headerRight quand on entre dans un sous-outil (recap, seance, share)
  // Ces pages ont leur propre header sticky, donc on vide le slot
  useEffect(() => {
    if (activeTool !== null) {
      onHeaderRight?.(null);
      onHeaderTitle?.('');
    }
  }, [activeTool, onHeaderRight, onHeaderTitle]);

  function LockScreen({ onUnlock }) {
    const [password, setPassword] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
      // Nettoyer headerRight sur l'écran de lock (pas de bouton lock sur la lockscreen elle-même)
      onHeaderRight?.(null);
      // Focus différé pour iOS
      const t = setTimeout(() => inputRef.current?.focus(), 300);
      return () => clearTimeout(t);
    }, []);

    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 animate-in fade-in duration-500 pb-[env(safe-area-inset-bottom)]">
        <div className="w-20 h-20 bg-white/5 rounded-full border border-white/10 flex items-center justify-center mb-6 shadow-2xl">
          <svg className="w-8 h-8 text-[#E8B200]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <h2 className="font-galinoy italic text-4xl mb-1 text-white tracking-tight">Zone Sécurisée</h2>
        <p className="font-outfit text-white/30 text-sm mb-8">Accès réservé</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (password.toUpperCase() === 'POPCORN') onUnlock();
            else { alert('Mot de passe incorrect'); setPassword(''); }
          }}
          className="flex flex-col gap-4 w-full max-w-xs"
        >
          <input
            ref={inputRef}
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            enterKeyHint="done"
            className="font-outfit bg-black/40 border border-white/10 rounded-2xl p-4 text-center font-bold tracking-widest outline-none focus:border-[#E8B200] transition-colors text-white placeholder:text-white/20"
          />
          <button
            type="submit"
            className="font-outfit bg-[#E8B200] text-black font-black uppercase tracking-widest py-4 rounded-2xl active:scale-95 transition-transform text-sm"
          >
            Déverrouiller
          </button>
        </form>
      </div>
    );
  }

  if (!isUnlocked) return <LockScreen onUnlock={() => { setIsUnlocked(true); localStorage.setItem('grandecran_studio_unlocked', 'true'); }}/>;
  if (activeTool === 'recap')  return <RecapTool onBack={() => setActiveTool(null)} historyData={historyData}/>;
  if (activeTool === 'seance') return <SeanceStoryTool historyData={historyData} pendingFilm={pendingFilm} onBack={() => setActiveTool(null)}/>;
  if (activeTool === 'share')  return <ShareReview historyData={historyData} pendingFilm={pendingFilm} onBack={() => setActiveTool(null)}/>;

  return (
    <StudioHub
      isScrolled={isScrolled}
      onSelectTool={setActiveTool}
      onLock={() => { setIsUnlocked(false); localStorage.removeItem('grandecran_studio_unlocked'); }}
      pendingFilm={pendingFilm}
      historyData={historyData}
      onHeaderRight={onHeaderRight}    // ← passer en cascade
      onHeaderTitle={onHeaderTitle}    // ← passer en cascade
    />
  );
}