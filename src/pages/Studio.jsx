import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { toPng, toBlob } from 'html-to-image';
import { ChevronLeft, ChevronRight, Layers, Film, Ticket, Sparkles, Star, Download } from 'lucide-react';
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

// ─────────────────────────────────────────────────────────────────────────────
// CANVAS UTILS
// ─────────────────────────────────────────────────────────────────────────────

function drawImageCover(ctx, img, x, y, w, h) {
  if (!img) return;
  const imgRatio    = img.naturalWidth  / img.naturalHeight;
  const targetRatio = w / h;
  let sx, sy, sw, sh;
  if (imgRatio > targetRatio) {
    sh = img.naturalHeight;
    sw = sh * targetRatio;
    sx = (img.naturalWidth - sw) / 2;
    sy = 0;
  } else {
    sw = img.naturalWidth;
    sh = sw / targetRatio;
    sx = 0;
    sy = (img.naturalHeight - sh) / 2;
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
  const GOLD_COLOR = '#E9B90A';
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
      // Left half (gold)
      ctx.save();
      ctx.beginPath();
      ctx.rect(-1, -1, 1, 2);
      ctx.clip();
      ctx.fillStyle = GOLD_COLOR;
      ctx.fill(starPath);
      ctx.restore();
      // Right half (empty)
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, -1, 1, 2);
      ctx.clip();
      ctx.fillStyle = EMPTY_COLOR;
      ctx.fill(starPath);
      ctx.restore();
    } else {
      ctx.fillStyle = filled ? GOLD_COLOR : EMPTY_COLOR;
      ctx.fill(starPath);
    }

    ctx.restore();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITAIRE : GÉNÉRATION DES ÉTOILES (SVG) — pour le rendu React DOM
// ─────────────────────────────────────────────────────────────────────────────
function renderStars(note, isDark = true, sizeClass = "w-[14px] h-[14px]") {
  const scale = 5;
  const stars = [];
  for (let i = 0; i < scale; i++) {
    const filled = i < Math.floor(note);
    const half = !filled && (i < note);
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

const RW_ARCHETYPES = {
  'Drame': { high:{name:'Le\nSensible', desc:'Tu cherches à être touché...'}, mid: {name:'Le\nLucide', desc:'Tu acceptes que l\'émotion...'}, low: {name:'Le\nSceptique', desc:'Beaucoup de drames...'} },
  'Thriller': { high:{name:'Le\nTendu', desc:'Tu aimes les films qui ne te lâchent pas...'}, mid: {name:'L\'Enquêteur', desc:'Tu analyses, tu décortiques...'}, low: {name:'Le\nDéçu', desc:'Beaucoup de promesses...'} },
  'Comédie': { high:{name:'Le\nJoyeux', desc:'Tu sors léger, tu rigoles fort...'}, mid: {name:'Le\nMitigé', desc:'Tu souris, parfois tu ris...'}, low: {name:'Le\nDifficile', desc:'Peu de choses te font rire...'} },
  'default': { high:{name:'L\'Éclectique', desc:'Aucun genre ne te définit...'}, mid: {name:'Le\nVoyageur', desc:'Tu explores sans carte...'}, low: {name:'Le\nChercheur', desc:'Tu tâtonnes...'} }
};

function getArchetype(genre, rating, scale = 5) {
  const ratio = scale > 0 ? rating / scale : 0;
  const bucket = ratio >= 0.72 ? 'high' : ratio >= 0.48 ? 'mid' : 'low';
  const map = RW_ARCHETYPES[genre] || RW_ARCHETYPES['default'];
  return map[bucket];
}

// ─────────────────────────────────────────────────────────────────────────────
// AGGREGATION DES DONNÉES MENSUELLES
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
        year = parts[2].length === 2 ? '20' + parts[2] : parts[2];
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

    let totalDuration = 0, totalNote = 0, totalVO = 0, filmsWithLang = 0, capucinesCount = 0;
    let highStarCount = 0;
    let seatCount = {};
    let roomCount = {};
    const genreDistribution = {};
    const languageDistribution = {};
    let bestMovie = null, worstMovie = null;

    films.forEach(film => {
      if (film.duree) {
        const m = String(film.duree).match(/(\d+)[h:](\d+)/);
        if (m) totalDuration += parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
      }

      const noteStr = String(film.note || '').replace(',', '.').trim();
      const note = parseFloat(noteStr) || 0;
      totalNote += note;
      if (note >= 4) highStarCount++;

      if (film.capucine || film.capucines) capucinesCount++;

      const seat = String(film.siege || '').trim();
      if (seat && seat !== '-' && seat.toLowerCase() !== 'n/a' && seat.toLowerCase() !== 'libre') {
        seatCount[seat] = (seatCount[seat] || 0) + 1;
      }

      const room = String(film.salle || '').trim();
      if (room && room !== '-' && room.toLowerCase() !== 'n/a') {
        roomCount[room] = (roomCount[room] || 0) + 1;
      }

      const lang = String(film.langue || '').toUpperCase().trim();
      if (lang && lang !== '?' && lang !== 'N/A' && lang !== '-') {
        filmsWithLang++;
        if (lang !== 'FRA' && lang !== 'VF' && lang !== 'VFQ') totalVO++;
        languageDistribution[lang] = (languageDistribution[lang] || 0) + 1;
      }

      if (film.genre) genreDistribution[film.genre] = (genreDistribution[film.genre] || 0) + 1;
      if (!bestMovie || note > (parseFloat(String(bestMovie.note).replace(',', '.')) || 0)) bestMovie = film;
      if (!worstMovie || note < (parseFloat(String(worstMovie.note).replace(',', '.')) || 0)) worstMovie = film;
    });

    let favSeat = null, favRoom = null;
    const seatEntries = Object.entries(seatCount).sort((a, b) => b[1] - a[1]);
    if (seatEntries.length > 0) {
      favSeat = { name: seatEntries[0][0], share: Math.round((seatEntries[0][1] / films.length) * 100) };
    }
    const roomEntries = Object.entries(roomCount).sort((a, b) => b[1] - a[1]);
    if (roomEntries.length > 0) {
      favRoom = { name: roomEntries[0][0], share: Math.round((roomEntries[0][1] / films.length) * 100) };
    }

    result[monthKey] = {
      films,
      totalFilms: films.length,
      averageRating: totalNote / films.length,
      highStarCount,
      totalDuration,
      averageDuration: Math.round(totalDuration / films.length),
      voPercentage: filmsWithLang > 0 ? Math.round((totalVO / filmsWithLang) * 100) : 0,
      capucinesCount,
      favSeat,
      favRoom,
      genreDistribution,
      languageDistribution,
      bestMovie,
      worstMovie
    };
  }
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// CANVAS RECAP RENDERERS
// Each function draws one slide onto a 1080×1920 canvas and returns it.
// All images are pre-loaded via loadImageForCanvas so no CORS issue at capture.
// ─────────────────────────────────────────────────────────────────────────────

const RECAP_W    = 1080;
const RECAP_H    = 1920;
const GOLD_COLOR = '#E8B200';
const DARK_BG    = '#0A0A0A';
const LIGHT_BG   = '#F5F2EC';
const FONT_SANS  = 'system-ui,-apple-system,sans-serif';
const FONT_SYNE  = 'system-ui,-apple-system,sans-serif'; // fallback; same as DOM

function makeCanvas() {
  const c = document.createElement('canvas');
  c.width  = RECAP_W;
  c.height = RECAP_H;
  return c;
}

// ---------- helper: draw date badge ----------
function drawDateBadge(ctx, monthLabel, x, y, dark = false) {
  const font = `bold 32px ${FONT_SANS}`;
  ctx.font = font;
  const textW  = ctx.measureText(monthLabel.toUpperCase()).width;
  const padX   = 36, padY = 22;
  const bw     = textW + padX * 2 + 30;
  const bh     = 60;
  const radius = bh / 2;

  ctx.save();
  ctx.globalAlpha = dark ? 0.55 : 0.8;
  ctx.fillStyle   = dark ? '#000' : '#fff';
  roundRect(ctx, x, y, bw, bh, radius); ctx.fill();
  ctx.strokeStyle = dark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)';
  ctx.lineWidth   = 1.5; ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle   = dark ? 'rgba(255,255,255,0.85)' : 'rgba(30,30,30,0.85)';
  ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  // calendar icon (mini)
  ctx.strokeStyle  = dark ? 'rgba(255,200,0,0.9)' : 'rgba(30,30,30,0.55)';
  ctx.lineWidth    = 2;
  const ic = 22, ix = x + padX - 2, iy = y + (bh - ic) / 2;
  ctx.beginPath();
  ctx.moveTo(ix + 3, iy); ctx.lineTo(ix + ic - 3, iy);
  ctx.arcTo(ix + ic, iy, ix + ic, iy + 3, 2);
  ctx.lineTo(ix + ic, iy + ic - 3);
  ctx.arcTo(ix + ic, iy + ic, ix + ic - 3, iy + ic, 2);
  ctx.lineTo(ix + 3, iy + ic);
  ctx.arcTo(ix, iy + ic, ix, iy + ic - 3, 2);
  ctx.lineTo(ix, iy + 3);
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

// ---------- helper: draw logo ----------
function drawLogo(ctx, logoImg, x, y, size = 80) {
  if (!logoImg) return;
  ctx.save();
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(logoImg, x, y, size, size);
  ctx.restore();
}

// ---------- SLIDE 1 : INTRO ----------
async function renderSlide1(monthLabel, currentData, s1DataType, logoImg) {
  const canvas = makeCanvas();
  const ctx    = canvas.getContext('2d');

  // Background
  ctx.fillStyle = DARK_BG;
  ctx.fillRect(0, 0, RECAP_W, RECAP_H);

  // Glows
  const g1 = ctx.createRadialGradient(RECAP_W * 0.75, RECAP_H * 0.2, 0, RECAP_W * 0.75, RECAP_H * 0.2, 600);
  g1.addColorStop(0, 'rgba(232,178,0,0.18)'); g1.addColorStop(1, 'transparent');
  ctx.fillStyle = g1; ctx.fillRect(0, 0, RECAP_W, RECAP_H);

  const g2 = ctx.createRadialGradient(RECAP_W * 0.2, RECAP_H * 0.8, 0, RECAP_W * 0.2, RECAP_H * 0.8, 500);
  g2.addColorStop(0, 'rgba(100,80,200,0.12)'); g2.addColorStop(1, 'transparent');
  ctx.fillStyle = g2; ctx.fillRect(0, 0, RECAP_W, RECAP_H);

  const LEFT = 80;

  // Top left title
  ctx.font = `800 52px ${FONT_SYNE}`;
  ctx.fillStyle = GOLD_COLOR;
  ctx.textBaseline = 'top'; ctx.textAlign = 'left';
  ctx.fillText('MON RÉCAP\'', LEFT, 90);
  ctx.font = `500 26px ${FONT_SANS}`;
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fillText('CINÉ DU MOIS', LEFT, 156);

  // Logo top right
  drawLogo(ctx, logoImg, RECAP_W - LEFT - 80, 90, 80);

  // Big number in center
  const centerY = RECAP_H * 0.45;
  ctx.textAlign = 'center';

  if (s1DataType === 'hours' || !s1DataType) {
    const hours = Math.round((currentData.totalDuration || 0) / 60);
    ctx.font = `900 320px ${FONT_SYNE}`;
    ctx.fillStyle = '#FFF';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(hours), RECAP_W / 2 - 40, centerY);
    ctx.font = `400 120px ${FONT_SYNE}`;
    ctx.fillStyle = GOLD_COLOR;
    ctx.fillText('h', RECAP_W / 2 + 200, centerY - 60);
    ctx.font = `500 34px ${FONT_SANS}`;
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText(`dans le noir en ${monthLabel}`, RECAP_W / 2, centerY + 190);
  } else if (s1DataType === 'films') {
    ctx.font = `900 320px ${FONT_SYNE}`;
    ctx.fillStyle = '#FFF';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(currentData.totalFilms || 0), RECAP_W / 2 - 60, centerY);
    ctx.font = `400 90px ${FONT_SYNE}`;
    ctx.fillStyle = GOLD_COLOR;
    ctx.fillText('films', RECAP_W / 2 + 220, centerY - 40);
    ctx.font = `500 34px ${FONT_SANS}`;
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText(`découverts en ${monthLabel}`, RECAP_W / 2, centerY + 190);
  } else {
    ctx.font = `900 320px ${FONT_SYNE}`;
    ctx.fillStyle = '#FFF';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(currentData.voPercentage || 0), RECAP_W / 2 - 40, centerY);
    ctx.font = `400 120px ${FONT_SYNE}`;
    ctx.fillStyle = GOLD_COLOR;
    ctx.fillText('%', RECAP_W / 2 + 220, centerY - 60);
    ctx.font = `500 34px ${FONT_SANS}`;
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText(`de séances en VO en ${monthLabel}`, RECAP_W / 2, centerY + 190);
  }

  // Bottom bar
  ctx.fillStyle = GOLD_COLOR;
  ctx.fillRect(RECAP_W / 2 - 60, RECAP_H - 220, 120, 4);
  ctx.font = `500 26px ${FONT_SANS}`;
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.textBaseline = 'top';
  ctx.fillText(monthLabel.toUpperCase(), RECAP_W / 2, RECAP_H - 200);
  ctx.font = `800 30px ${FONT_SANS}`;
  ctx.fillStyle = '#fff';
  ctx.fillText('GRANDÉCRAN_OFF', RECAP_W / 2, RECAP_H - 155);

  return canvas;
}

// ---------- SLIDE 2 : FILMS DU MOIS (MOSAÏQUE) ----------
async function renderSlide2(monthLabel, currentData, logoImg) {
  const canvas = makeCanvas();
  const ctx    = canvas.getContext('2d');

  ctx.fillStyle = LIGHT_BG;
  ctx.fillRect(0, 0, RECAP_W, RECAP_H);

  const films = (currentData.films || []).filter(f => f.affiche);

  // Load all poster images
  const proxyBase = import.meta.env.DEV ? '/tmdb-proxy' : '/api/proxy-image';
  const posterImgs = await Promise.all(
    films.map(f => loadImageForCanvas(`${proxyBase}?url=${encodeURIComponent(f.affiche)}`))
  );
  const filmPool = films.map((f, i) => ({ film: f, img: posterImgs[i] })).filter(x => x.img);

  // Build mosaic grid: 8 strips × 7 cells, rotated 12°
  const STRIPS = 8, CELLS = 7;
  const totalNeeded = STRIPS * CELLS;
  let pool = [];
  while (pool.length < totalNeeded) pool = pool.concat(filmPool);
  pool = pool.sort(() => 0.5 - Math.random()).slice(0, totalNeeded);

  ctx.save();
  ctx.translate(RECAP_W / 2, RECAP_H / 2);
  ctx.rotate((12 * Math.PI) / 180);
  ctx.translate(-RECAP_W * 0.63, -RECAP_H * 0.63);
  ctx.scale(1.3, 1.3);

  const CELL_W  = Math.floor(RECAP_W / STRIPS) - 4;
  const CELL_H  = Math.floor(CELL_W * 1.5);
  const GAP     = 4;

  for (let s = 0; s < STRIPS; s++) {
    const offsetY = (s % 2 === 0) ? 40 : 0;
    for (let c = 0; c < CELLS; c++) {
      const item  = pool[s * CELLS + c];
      const cx    = s * (CELL_W + GAP);
      const cy    = offsetY + c * (CELL_H + GAP);
      ctx.save();
      roundRect(ctx, cx, cy, CELL_W, CELL_H, 6);
      ctx.clip();
      if (item?.img) {
        ctx.globalAlpha = 0.8;
        drawImageCover(ctx, item.img, cx, cy, CELL_W, CELL_H);
      } else {
        ctx.fillStyle = '#ccc';
        ctx.fillRect(cx, cy, CELL_W, CELL_H);
      }
      ctx.restore();
    }
  }
  ctx.restore();

  // Gradient overlay
  const grad = ctx.createLinearGradient(0, 0, 0, RECAP_H);
  grad.addColorStop(0,    'rgba(245,242,236,0.08)');
  grad.addColorStop(0.45, 'rgba(245,242,236,0.18)');
  grad.addColorStop(0.65, 'rgba(245,242,236,0.82)');
  grad.addColorStop(0.85, 'rgba(245,242,236,0.98)');
  grad.addColorStop(1,    'rgba(245,242,236,1.00)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, RECAP_W, RECAP_H);

  // Date badge top left
  drawDateBadge(ctx, monthLabel, 80, 80, false);

  // Logo top right
  drawLogo(ctx, logoImg, RECAP_W - 80 - 80, 80, 80);

  // Bottom text
  const BL = 80, BB = RECAP_H - 80;

  ctx.font = `800 120px ${FONT_SYNE}`;
  ctx.fillStyle = '#1E1E1E';
  ctx.textBaseline = 'bottom'; ctx.textAlign = 'left';
  ctx.fillText(`${currentData.totalFilms || 0} films`, BL, BB - 180);

  ctx.fillStyle = '#c49a10';
  ctx.fillText('ce mois', BL, BB - 50);

  // Film title pills
  let pillX = BL, pillY = BB + 10;
  const pillH = 52, pillR = pillH / 2;
  ctx.font = `600 24px ${FONT_SANS}`;

  (currentData.films || []).forEach(film => {
    const label = film.titre || '';
    const tw    = ctx.measureText(label).width;
    const pw    = tw + 44;
    if (pillX + pw > RECAP_W - BL) { pillX = BL; pillY += pillH + 10; }
    if (pillY > RECAP_H - 60) return;

    ctx.save();
    roundRect(ctx, pillX, pillY, pw, pillH, pillR);
    ctx.fillStyle = film.coupDeCoeur ? '#b41e3c' : '#1e1e1e';
    ctx.globalAlpha = 0.92;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle   = '#fff';
    ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    ctx.fillText(label, pillX + 22, pillY + pillH / 2);
    ctx.restore();

    pillX += pw + 12;
  });

  return canvas;
}

// ---------- SLIDE 3 : STATS GLOBALES ----------
async function renderSlide3(monthLabel, currentData, logoImg) {
  const canvas = makeCanvas();
  const ctx    = canvas.getContext('2d');

  ctx.fillStyle = LIGHT_BG;
  ctx.fillRect(0, 0, RECAP_W, RECAP_H);

  const LEFT = 80, RIGHT = RECAP_W - 80;
  let y = 80;

  // Header
  drawDateBadge(ctx, monthLabel, LEFT, y, false);
  drawLogo(ctx, logoImg, RIGHT - 80, y, 80);
  y = 260;

  // Divider helper
  const divider = (yy) => {
    ctx.strokeStyle = 'rgba(30,30,30,0.12)';
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.moveTo(LEFT, yy); ctx.lineTo(RIGHT, yy);
    ctx.stroke();
  };

  const labelStyle  = () => { ctx.font = `700 28px ${FONT_SANS}`; ctx.fillStyle = 'rgba(30,30,30,0.4)'; ctx.textBaseline = 'top'; ctx.textAlign = 'left'; };
  const bigNumStyle = (size = 180) => { ctx.font = `900 ${size}px ${FONT_SYNE}`; ctx.fillStyle = '#1E1E1E'; ctx.textBaseline = 'top'; ctx.textAlign = 'left'; };

  // --- Note moyenne ---
  labelStyle();
  ctx.fillText('Note moyenne', LEFT, y);
  y += 46;
  bigNumStyle(200);
  ctx.fillText((currentData.averageRating || 0).toFixed(1), LEFT, y);
  ctx.font = `400 80px ${FONT_SYNE}`;
  ctx.fillStyle = GOLD_COLOR;
  ctx.fillText('/ 5', LEFT + 240, y + 60);
  // sub: notes sup
  ctx.font = `900 120px ${FONT_SYNE}`;
  ctx.fillStyle = 'rgba(30,30,30,0.12)';
  ctx.textAlign = 'right';
  ctx.fillText(String(currentData.highStarCount || 0), RIGHT, y);
  ctx.font = `600 26px ${FONT_SANS}`;
  ctx.fillStyle = 'rgba(30,30,30,0.4)';
  ctx.fillText('notes ≥ 4', RIGHT, y + 130);
  ctx.textAlign = 'left';
  y += 240;
  divider(y); y += 50;

  // --- Durée moyenne ---
  labelStyle();
  ctx.fillText('Durée moyenne', LEFT, y);
  y += 46;
  const h = Math.floor((currentData.averageDuration || 0) / 60);
  const m = String((currentData.averageDuration || 0) % 60).padStart(2, '0');
  bigNumStyle(200);
  ctx.fillText(`${h}`, LEFT, y);
  ctx.font = `400 80px ${FONT_SYNE}`; ctx.fillStyle = GOLD_COLOR;
  ctx.fillText('h', LEFT + (h > 0 ? ctx.measureText(String(h)).width + 20 : 120), y + 60);
  ctx.font = `900 200px ${FONT_SYNE}`; ctx.fillStyle = '#1E1E1E';
  ctx.fillText(m, LEFT + 280, y);
  y += 240;
  divider(y); y += 50;

  // --- Siège / Salle ---
  const colW = (RIGHT - LEFT - 40) / 2;
  labelStyle();
  ctx.fillText('Siège favori', LEFT, y);
  ctx.fillText('Salle favorite', LEFT + colW + 40, y);
  y += 46;
  bigNumStyle(100);
  ctx.fillText(currentData.favSeat?.name || '—', LEFT, y);
  ctx.fillText(currentData.favRoom ? currentData.favRoom.name.replace('Salle ', '') : '—', LEFT + colW + 40, y);
  ctx.font = `600 26px ${FONT_SANS}`; ctx.fillStyle = 'rgba(30,30,30,0.4)';
  ctx.fillText(`${currentData.favSeat?.share || 0}% des séances`, LEFT, y + 120);
  ctx.fillText(`${currentData.favRoom?.share || 0}% des séances`, LEFT + colW + 40, y + 120);

  // Vertical divider between cols
  ctx.strokeStyle = 'rgba(30,30,30,0.1)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(LEFT + colW + 20, y - 10); ctx.lineTo(LEFT + colW + 20, y + 150); ctx.stroke();
  y += 180;
  divider(y); y += 50;

  // --- Capucines ---
  if (currentData.capucinesCount > 0) {
    ctx.font = `700 36px ${FONT_SANS}`; ctx.fillStyle = '#8B1A3A'; ctx.textBaseline = 'middle';
    ctx.fillText(`${currentData.capucinesCount} film${currentData.capucinesCount > 1 ? 's' : ''} en compétition aux Capucines`, LEFT + 10, y + 40);
  }

  return canvas;
}

// ---------- SLIDE 4 : GENRES ET LANGUES ----------
async function renderSlide4(monthLabel, currentData, logoImg) {
  const canvas = makeCanvas();
  const ctx    = canvas.getContext('2d');

  // Dark top, light bottom strip
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, RECAP_W, RECAP_H);
  ctx.fillStyle = LIGHT_BG;
  ctx.fillRect(0, Math.round(RECAP_H * 0.82), RECAP_W, Math.round(RECAP_H * 0.18));

  const LEFT = 80;

  // Header
  drawDateBadge(ctx, monthLabel, LEFT, 80, true);
  drawLogo(ctx, logoImg, RECAP_W - 80 - 80, 80, 80);

  // Section title
  ctx.font = `700 28px ${FONT_SANS}`;
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.textBaseline = 'top'; ctx.textAlign = 'left';
  ctx.fillText('CE QUE J\'AI REGARDÉ', LEFT, 210);

  ctx.font = `900 100px ${FONT_SYNE}`;
  ctx.fillStyle = '#fff';
  ctx.fillText('Mes genres', LEFT, 260);
  ctx.fillStyle = GOLD_COLOR;
  ctx.fillText('du mois', LEFT, 370);

  // Genre bars
  const genresArray = Object.entries(currentData?.genreDistribution || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const maxCount = genresArray.length > 0 ? genresArray[0][1] : 1;
  const MEDALS   = ['🥇', '🥈', '🥉', '', ''];

  const BAR_X   = LEFT;
  const BAR_MAX = RECAP_W - LEFT * 2;
  let gy        = 520;
  const barGap  = 130;

  const barStyles = [
    { h: 38, grad: ['#c49a10', '#FFD341'] },
    { h: 30, grad: ['#383838', '#555']    },
    { h: 24, grad: ['#7E0000', '#b03010'] },
    { h: 20, grad: ['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.18)'] },
    { h: 16, grad: ['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.1)'] },
  ];

  genresArray.forEach(([genreName, count], i) => {
    const pct    = count / maxCount;
    const style  = barStyles[i] || barStyles[4];
    const tSize  = [44, 38, 32, 28, 24][i] || 24;
    const tAlpha = [1, 0.8, 0.7, 0.5, 0.35][i];

    // Medal + name
    ctx.font = `900 ${tSize}px ${FONT_SYNE}`;
    ctx.fillStyle = `rgba(255,255,255,${tAlpha})`;
    ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    const medal = MEDALS[i] ? `${MEDALS[i]} ` : '';
    ctx.fillText(`${medal}${genreName}`, BAR_X, gy);

    // Count
    ctx.font = `600 26px ${FONT_SANS}`; ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.textAlign = 'right';
    ctx.fillText(`${count} film${count > 1 ? 's' : ''}`, RECAP_W - LEFT, gy);
    ctx.textAlign = 'left';

    // Track
    const barY = gy + 30;
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    roundRect(ctx, BAR_X, barY, BAR_MAX, style.h, style.h / 2); ctx.fill();

    // Fill
    const gFill = ctx.createLinearGradient(BAR_X, 0, BAR_X + BAR_MAX, 0);
    gFill.addColorStop(0, style.grad[0]); gFill.addColorStop(1, style.grad[1]);
    ctx.fillStyle = gFill;
    roundRect(ctx, BAR_X, barY, BAR_MAX * pct, style.h, style.h / 2); ctx.fill();

    gy += barGap;
  });

  // Language strip (light zone)
  const langY    = Math.round(RECAP_H * 0.84);
  const langEntries = Object.entries(currentData?.languageDistribution || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  const totalLangsCount = langEntries.reduce((acc, [, v]) => acc + v, 0);

  ctx.font = `700 26px ${FONT_SANS}`; ctx.fillStyle = 'rgba(30,30,30,0.4)'; ctx.textBaseline = 'top';
  ctx.fillText('LANGUES', LEFT, langY + 10);

  let lx = LEFT + 180;
  langEntries.forEach(([lang, count], i) => {
    const pct = Math.round((count / totalLangsCount) * 100);
    if (i > 0) {
      ctx.strokeStyle = 'rgba(30,30,30,0.15)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(lx - 24, langY + 4); ctx.lineTo(lx - 24, langY + 90); ctx.stroke();
    }
    ctx.font = `900 72px ${FONT_SYNE}`;
    ctx.fillStyle = i === 0 ? '#c49a10' : '#1E1E1E';
    ctx.textBaseline = 'top'; ctx.textAlign = 'left';
    ctx.fillText(`${pct}%`, lx, langY - 4);
    ctx.font = `700 24px ${FONT_SANS}`; ctx.fillStyle = 'rgba(30,30,30,0.6)';
    ctx.fillText(lang, lx, langY + 72);
    lx += ctx.measureText(`${pct}%`).width + 80;
  });

  return canvas;
}

// ---------- SLIDE 5 : TOP / FLOP ----------
async function renderSlide5(monthLabel, currentData, logoImg) {
  const canvas = makeCanvas();
  const ctx    = canvas.getContext('2d');
  const MID    = RECAP_H / 2;
  const proxyBase = import.meta.env.DEV ? '/tmdb-proxy' : '/api/proxy-image';

  // Load best/worst poster images
  const [bestImg, worstImg] = await Promise.all([
    currentData.bestMovie?.affiche  ? loadImageForCanvas(`${proxyBase}?url=${encodeURIComponent(currentData.bestMovie.affiche)}`)  : Promise.resolve(null),
    currentData.worstMovie?.affiche ? loadImageForCanvas(`${proxyBase}?url=${encodeURIComponent(currentData.worstMovie.affiche)}`) : Promise.resolve(null),
  ]);

  // TOP half (dark)
  ctx.fillStyle = '#0A0A0A';
  ctx.fillRect(0, 0, RECAP_W, MID);
  if (bestImg) {
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, RECAP_W, MID); ctx.clip();
    ctx.globalAlpha = 0.55;
    drawImageCover(ctx, bestImg, 0, 0, RECAP_W, MID);
    ctx.restore();
    const gg = ctx.createLinearGradient(0, 0, 0, MID);
    gg.addColorStop(0, 'rgba(0,0,0,0.15)');
    gg.addColorStop(0.6, 'rgba(0,0,0,0.4)');
    gg.addColorStop(1,   'rgba(0,0,0,0.85)');
    ctx.fillStyle = gg; ctx.fillRect(0, 0, RECAP_W, MID);
  }

  // TOP text
  const LEFT = 80;
  ctx.font = `700 26px ${FONT_SANS}`; ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.textBaseline = 'bottom'; ctx.textAlign = 'left';
  ctx.fillText('── COUP DE CŒUR', LEFT, MID - 250);

  const bestTitle = currentData.bestMovie?.titre || '—';
  ctx.font = `900 72px ${FONT_SYNE}`; ctx.fillStyle = '#FFF';
  const bestLines = wrapText(ctx, bestTitle, RECAP_W - LEFT * 2);
  bestLines.slice(0, 2).forEach((l, i) => {
    ctx.fillText(l, LEFT, MID - 155 + i * 82);
  });

  const bestNote = parseFloat(String(currentData.bestMovie?.note || 0).replace(',', '.'));
  drawCanvasStars(ctx, bestNote, LEFT, MID - 90, 36, 6);

  // FLOP half (light)
  ctx.fillStyle = LIGHT_BG;
  ctx.fillRect(0, MID, RECAP_W, MID);
  if (worstImg) {
    ctx.save();
    ctx.beginPath(); ctx.rect(0, MID, RECAP_W, MID); ctx.clip();
    ctx.globalAlpha = 0.4;
    drawImageCover(ctx, worstImg, 0, MID, RECAP_W, MID);
    ctx.restore();
    const gw = ctx.createLinearGradient(0, MID, 0, RECAP_H);
    gw.addColorStop(0,    'rgba(245,242,236,0.3)');
    gw.addColorStop(0.35, 'rgba(245,242,236,0.7)');
    gw.addColorStop(0.7,  'rgba(245,242,236,0.92)');
    gw.addColorStop(1,    'rgba(245,242,236,1.00)');
    ctx.fillStyle = gw; ctx.fillRect(0, MID, RECAP_W, MID);
  }

  ctx.font = `700 26px ${FONT_SANS}`; ctx.fillStyle = 'rgba(30,30,30,0.45)';
  ctx.textBaseline = 'top'; ctx.textAlign = 'left';
  ctx.fillText('── À OUBLIER', LEFT, MID + 150);

  const worstTitle = currentData.worstMovie?.titre || '—';
  ctx.font = `900 72px ${FONT_SYNE}`; ctx.fillStyle = '#1E1E1E';
  const worstLines = wrapText(ctx, worstTitle, RECAP_W - LEFT * 2);
  worstLines.slice(0, 2).forEach((l, i) => {
    ctx.fillText(l, LEFT, MID + 230 + i * 82);
  });

  const worstNote = parseFloat(String(currentData.worstMovie?.note || 0).replace(',', '.'));
  // Draw dark stars on light bg
  const EMPTY_LIGHT = 'rgba(30,30,30,0.12)';
  for (let i = 0; i < 5; i++) {
    const filled = i < Math.floor(worstNote);
    const cx2 = LEFT + i * (36 + 6) + 18;
    const cy2 = MID + 420;
    ctx.save();
    ctx.translate(cx2, cy2);
    ctx.scale(18, 18);
    const sp = new Path2D('M 0 -1 L 0.29 -0.40 L 0.95 -0.31 L 0.48 0.15 L 0.59 0.81 L 0 0.50 L -0.59 0.81 L -0.48 0.15 L -0.95 -0.31 L -0.29 -0.40 Z');
    ctx.fillStyle = filled ? '#E9B90A' : EMPTY_LIGHT;
    ctx.fill(sp);
    ctx.restore();
  }

  // Divider line
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(0, MID); ctx.lineTo(RECAP_W, MID); ctx.stroke();

  // Header badges (over everything)
  drawDateBadge(ctx, monthLabel, LEFT, 70, true);
  drawLogo(ctx, logoImg, RECAP_W - LEFT - 80, 70, 80);

  return canvas;
}

// ---------- SLIDE 6 : PROFIL CINÉPHILE ----------
async function renderSlide6(monthLabel, monthLabel_short, currentData, logoImg) {
  const canvas = makeCanvas();
  const ctx    = canvas.getContext('2d');

  ctx.fillStyle = '#0A0A0A';
  ctx.fillRect(0, 0, RECAP_W, RECAP_H);

  // Glow
  const g1 = ctx.createRadialGradient(RECAP_W * 0.75, RECAP_H * 0.25, 0, RECAP_W * 0.75, RECAP_H * 0.25, 700);
  g1.addColorStop(0, 'rgba(232,178,0,0.14)'); g1.addColorStop(1, 'transparent');
  ctx.fillStyle = g1; ctx.fillRect(0, 0, RECAP_W, RECAP_H);

  const LEFT = 80;

  // Header
  drawDateBadge(ctx, monthLabel, LEFT, 80, true);
  drawLogo(ctx, logoImg, RECAP_W - LEFT - 80, 80, 80);

  // Card background
  const CARD_X = LEFT - 20, CARD_Y = 230, CARD_W = RECAP_W - (LEFT - 20) * 2, CARD_H = RECAP_H - 500;
  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = '#fff';
  roundRect(ctx, CARD_X, CARD_Y, CARD_W, CARD_H, 40); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.restore();

  const CX = CARD_X + 60;
  let cy = CARD_Y + 70;

  // Card header
  ctx.font = `700 26px ${FONT_SANS}`; ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.textBaseline = 'top'; ctx.textAlign = 'left';
  ctx.fillText('PROFIL CINÉ DU MOIS', CX, cy);
  ctx.textAlign = 'right';
  ctx.fillText(`— ${monthLabel_short}`, CARD_X + CARD_W - 60, cy);
  ctx.textAlign = 'left';
  cy += 70;

  // Archetype
  const genresArray  = Object.entries(currentData?.genreDistribution || {}).sort((a, b) => b[1] - a[1]);
  const topGenre     = genresArray.length > 0 ? genresArray[0][0] : 'Inconnu';
  const archetype    = getArchetype(topGenre, currentData?.averageRating || 0);
  const archParts    = archetype.name.split('\n');

  ctx.font = `700 26px ${FONT_SANS}`; ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fillText('ARCHÉTYPE DU MOIS', CX, cy);
  cy += 48;

  ctx.font = `900 120px ${FONT_SYNE}`; ctx.fillStyle = '#fff';
  ctx.fillText(archParts[0] || '', CX, cy); cy += 120;
  if (archParts[1]) {
    ctx.fillStyle = GOLD_COLOR;
    ctx.fillText(archParts[1], CX, cy); cy += 130;
  } else cy += 20;

  // Description
  ctx.font = `400 32px ${FONT_SANS}`; ctx.fillStyle = 'rgba(255,255,255,0.4)';
  const descLines = wrapText(ctx, archetype.desc, CARD_W - 120);
  descLines.forEach(l => { ctx.fillText(l, CX, cy); cy += 46; });
  cy += 30;

  // Divider
  ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(CX, cy); ctx.lineTo(CARD_X + CARD_W - 60, cy); ctx.stroke();
  cy += 50;

  // Genre dominant / Note moyenne
  const colW2 = (CARD_W - 120) / 2;
  ctx.font = `700 24px ${FONT_SANS}`; ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillText('GENRE DOMINANT', CX, cy);
  ctx.fillText('NOTE MOYENNE', CX + colW2, cy);
  cy += 40;

  ctx.font = `800 56px ${FONT_SYNE}`; ctx.fillStyle = '#fff';
  ctx.fillText(topGenre, CX, cy);

  ctx.fillText((currentData?.averageRating || 0).toFixed(1), CX + colW2, cy);
  ctx.font = `400 36px ${FONT_SYNE}`; ctx.fillStyle = GOLD_COLOR;
  ctx.fillText('/ 5', CX + colW2 + 90, cy + 18);
  cy += 80;

  drawCanvasStars(ctx, currentData?.averageRating || 0, CX + colW2, cy - 20, 28, 5);

  // CTA footer
  const [year, monthNum] = monthLabel_short.split(' / ');
  const nextDate   = new Date(parseInt(year, 10), parseInt(monthNum, 10), 1);
  const nextLabel  = `${MONTH_NAMES[nextDate.getMonth()]} ${nextDate.getFullYear()}`;

  ctx.font = `500 34px ${FONT_SANS}`; ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.textBaseline = 'bottom';
  ctx.fillText(`Rendez-vous début `, LEFT, RECAP_H - 80);
  ctx.font = `800 34px ${FONT_SANS}`; ctx.fillStyle = 'rgba(255,255,255,0.65)';
  const rdvW = ctx.measureText('Rendez-vous début ').width;
  ctx.fillText(nextLabel, LEFT + rdvW, RECAP_H - 80);

  return canvas;
}

// ─────────────────────────────────────────────────────────────────────────────
// MASTER RECAP CANVAS EXPORT
// Renders all 6 slides off-screen and returns an array of Blobs.
// ─────────────────────────────────────────────────────────────────────────────
async function renderAllRecapSlidesToBlobs(currentData, monthLabel, monthNum, year, s1DataType) {
  // Pre-load logo once
  const logoImg = await loadImageForCanvas(INSTA_LOGO_URL);

  // monthLabel_short = "MM / YYYY" used for footer calc in slide 6
  const monthLabel_short = `${year} / ${monthNum}`;

  const canvases = await Promise.all([
    renderSlide1(monthLabel, currentData, s1DataType, logoImg),
    renderSlide2(monthLabel, currentData, logoImg),
    renderSlide3(monthLabel, currentData, logoImg),
    renderSlide4(monthLabel, currentData, logoImg),
    renderSlide5(monthLabel, currentData, logoImg),
    renderSlide6(monthLabel, monthLabel_short, currentData, logoImg),
  ]);

  return Promise.all(
    canvases.map(
      canvas =>
        new Promise(resolve => canvas.toBlob(blob => resolve(blob), 'image/png'))
    )
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RECAP TOOL (Composant Principal)
// ─────────────────────────────────────────────────────────────────────────────
function RecapTool({ onBack, historyData }) {
  const [data, setData] = useState(null);
  const [months, setMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [s1DataType, setS1DataType] = useState('hours');

  const swipeRef = useRef({ x: 0, y: 0, isDragging: false });

  // 1. Fetch Data
  useEffect(() => {
    setIsLoading(true);
    try {
      if (historyData && historyData.length > 0) {
        const rewindData = computeMonthlyRewindData(historyData);
        setData(rewindData);
        const availableKeys = Object.keys(rewindData).sort((a, b) => b.localeCompare(a));
        if (availableKeys.length > 0) {
          setMonths(availableKeys);
          setSelectedMonth(availableKeys[0]);
        }
      }
    } catch (error) {
      console.error("Erreur calcul Recap :", error);
    } finally {
      setIsLoading(false);
    }
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

  const goToSlide = (index) => {
    if (index < 0) index = 0;
    if (index >= RW_TOTAL) index = RW_TOTAL - 1;
    setCurrentSlide(index);
  };
  const cycleSlide1Data = () => {
    const types = ['hours', 'films', 'vo'];
    setS1DataType(types[(types.indexOf(s1DataType) + 1) % types.length]);
  };

  const handleTouchStart = (e) => { swipeRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, isDragging: true }; };
  const handleTouchMove = (e) => {
    if (!swipeRef.current.isDragging) return;
    const dx = e.touches[0].clientX - swipeRef.current.x;
    const dy = e.touches[0].clientY - swipeRef.current.y;
    if (Math.abs(dy) > Math.abs(dx)) swipeRef.current.isDragging = false;
  };
  const handleTouchEnd = (e) => {
    if (!swipeRef.current.isDragging) return;
    const dx = e.changedTouches[0].clientX - swipeRef.current.x;
    if (dx < -50) goToSlide(currentSlide + 1);
    else if (dx > 50) goToSlide(currentSlide - 1);
    swipeRef.current.isDragging = false;
  };

  // ── NEW: Canvas-based single slide download ──────────────────────────────
  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      const [year, monthNum] = selectedMonth.split('-');
      const monthLabel = `${MONTH_NAMES[parseInt(monthNum, 10) - 1]} ${year}`;
      const logoImg    = await loadImageForCanvas(INSTA_LOGO_URL);
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
          const url  = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `Recap_${selectedMonth}_${SLIDE_NAMES[currentSlide]}.png`;
          link.href = url; link.click();
          setTimeout(() => URL.revokeObjectURL(url), 5000);
        }, 'image/png');
      }
    } catch (err) { console.error(err); }
    finally { setIsDownloading(false); }
  };

  // ── NEW: Canvas-based all-slides download ────────────────────────────────
  const handleDownloadAll = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      const [year, monthNum] = selectedMonth.split('-');
      const monthLabel = `${MONTH_NAMES[parseInt(monthNum, 10) - 1]} ${year}`;

      const blobs = await renderAllRecapSlidesToBlobs(currentData, monthLabel, monthNum, year, s1DataType);

      const files = blobs
        .map((blob, i) => blob
          ? new File([blob], `Recap_${selectedMonth}_0${i + 1}_${SLIDE_NAMES[i].replace(/[^a-zA-Z0-9]/g, '')}.png`, { type: 'image/png' })
          : null
        )
        .filter(Boolean);

      if (navigator.canShare && navigator.canShare({ files })) {
        await navigator.share({ files, title: `Récap ${selectedMonth}` });
      } else {
        for (const file of files) {
          const url  = URL.createObjectURL(file);
          const link = document.createElement('a');
          link.download = file.name; link.href = url; link.click();
          URL.revokeObjectURL(url);
          await new Promise(r => setTimeout(r, 400));
        }
      }
    } catch (err) { if (err.name !== 'AbortError') console.error(err); }
    finally { setIsDownloading(false); }
  };

  if (isLoading) {
    return (
      <div className="animate-in fade-in pb-24 flex flex-col min-h-screen bg-[#0C0C0E]">
        <header className="z-40 sticky top-0 w-full bg-[#0C0C0E]/90 backdrop-blur-xl border-b border-white/10 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 px-6 flex justify-between items-center text-white">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center"><ChevronLeft size={20} strokeWidth={2.5}/></button>
          <h2 className="font-syne font-black text-lg">Récap' Mensuel</h2><div className="w-10"/>
        </header>
        <div className="flex-1 flex items-center justify-center text-white/50">Chargement des données...</div>
      </div>
    );
  }

  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="animate-in fade-in pb-24 flex flex-col min-h-screen bg-[#0C0C0E]">
        <header className="z-40 sticky top-0 w-full bg-[#0C0C0E]/90 backdrop-blur-xl border-b border-white/10 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 px-6 flex justify-between items-center text-white">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center"><ChevronLeft size={20} strokeWidth={2.5}/></button>
          <h2 className="font-syne font-black text-lg">Récap' Mensuel</h2><div className="w-10"/>
        </header>
        <div className="flex-1 flex items-center justify-center text-white/50 text-center px-6">Aucune donnée trouvée.</div>
      </div>
    );
  }

  const currentData = data[selectedMonth];
  const [year, monthNum] = selectedMonth.split('-');
  const monthLabel = `${MONTH_NAMES[parseInt(monthNum, 10) - 1]} ${year}`;

  const genresArray = Object.entries(currentData?.genreDistribution || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const maxGenreCount = genresArray.length > 0 ? genresArray[0][1] : 1;
  const MEDALS = ['🥇', '🥈', '🥉', '', ''];
  const langEntries = Object.entries(currentData?.languageDistribution || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  const totalLangsCount = langEntries.reduce((acc, curr) => acc + curr[1], 0);

  const topGenre = genresArray.length > 0 ? genresArray[0][0] : 'Inconnu';
  const archetype = getArchetype(topGenre, currentData?.averageRating || 0);
  const archNameParts = archetype.name.split('\n');

  const currentMonthIndex = parseInt(monthNum, 10) - 1;
  const nextMonthDate = new Date(parseInt(year, 10), currentMonthIndex + 1, 1);
  const nextMonthLabel = `${MONTH_NAMES[nextMonthDate.getMonth()]} ${nextMonthDate.getFullYear()}`;

  return (
    <div className="animate-in fade-in pb-safe-24 flex flex-col min-h-screen bg-[#0C0C0E] overflow-x-hidden text-[#F0EEF5]">

      {/* APP HEADER */}
      <header className="z-40 sticky top-0 w-full bg-[#0C0C0E]/90 backdrop-blur-xl border-b border-white/10 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 px-6 flex justify-between items-center text-white">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
          <ChevronLeft size={20} strokeWidth={2.5}/>
        </button>
        <h2 className="font-syne font-black text-lg">Récap' Mensuel</h2>
        <div className="w-10"/>
      </header>

      {/* SÉLECTEUR DE MOIS */}
      <div className="pt-5">
        <div className="text-[9px] font-bold tracking-widest uppercase text-white/20 px-5 mb-2">Mois</div>
        <div className="flex gap-2 overflow-x-auto px-5 pb-2 scrollbar-hide">
          {months.map(mKey => {
            const [y, m] = mKey.split('-');
            const isActive = mKey === selectedMonth;
            return (
              <div key={mKey} onClick={() => { setSelectedMonth(mKey); setCurrentSlide(0); }}
                className={`flex-shrink-0 flex flex-col items-center justify-center w-[60px] h-[56px] rounded-[10px] border cursor-pointer transition-all select-none ${isActive ? 'border-[#E8B200] bg-[#E8B200]/10' : 'border-white/5 bg-[#1A1A1F]'}`}>
                <div className={`text-[11px] font-bold z-10 ${isActive ? 'text-[#E8B200]' : 'text-[#F0EEF5]'}`}>{MONTH_NAMES[parseInt(m, 10) - 1].substring(0, 3)}</div>
                <div className={`text-[8px] font-medium mt-1 z-10 ${isActive ? 'text-[#E8B200]/60' : 'text-white/20'}`}>{y}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* INFO BAR */}
      <div className="mx-5 mt-4 flex items-center justify-between bg-[#1A1A1F] border border-white/5 rounded-[10px] px-3.5 py-2.5">
        <div className="flex gap-2.5 items-center">
          <Layers size={16} className="text-[#E8B200]" />
          <div className="text-[10px] text-white/40"><strong className="text-white">{currentData?.totalFilms || 0} films</strong> • slide {currentSlide + 1}/6</div>
        </div>
      </div>

      {/* --- CAROUSEL STAGE --- */}
      <div className="studio-stage relative mt-4 mx-5 rounded-[18px] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.5),_0_1px_0_rgba(255,255,255,0.06)_inset] bg-[#0A0A0A]">

        {currentSlide > 0 && (
          <button data-capture-hide="true" onClick={() => goToSlide(currentSlide - 1)} className="rw-arrow absolute left-2 top-1/2 -translate-y-1/2 z-50 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/10 active:scale-90 transition-transform">
            <ChevronLeft size={20} strokeWidth={2.5}/>
          </button>
        )}
        {currentSlide < RW_TOTAL - 1 && (
          <button data-capture-hide="true" onClick={() => goToSlide(currentSlide + 1)} className="rw-arrow absolute right-2 top-1/2 -translate-y-1/2 z-50 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/10 active:scale-90 transition-transform">
            <ChevronRight size={20} strokeWidth={2.5}/>
          </button>
        )}

        <div className="rw-carousel-wrapper w-full h-full" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
          <div className="rw-slide-track flex w-[600%] h-full transition-transform duration-300 ease-out" style={{ transform: `translateX(-${currentSlide * (100 / RW_TOTAL)}%)` }}>

            {/* SLIDE 1 : INTRO */}
            <div className="rw-slide w-1/6 h-full relative p-6 flex flex-col font-sans bg-[#0A0A0A]" id="rw-slide-1">
              <div className="rw-glow-a"></div>
              <div className="rw-glow-b"></div>

              <div className="absolute top-6 left-6 z-30">
                <div className="flex flex-col">
                  <span className="font-syne font-extrabold text-[24px] uppercase tracking-tight text-[#E8B200] leading-none mb-1">Mon récap'</span>
                  <span className="font-sans font-medium text-[10px] uppercase tracking-[0.15em] text-white/30">Ciné du mois</span>
                </div>
              </div>
              <div className="absolute top-6 right-6 z-30">
                 <img src={INSTA_LOGO_URL} alt="Logo" className="w-10 h-10 rounded-full shadow-lg object-cover" />
              </div>

              <div className="flex-1 flex flex-col items-center justify-center text-center cursor-pointer z-20 mt-10" onClick={cycleSlide1Data} data-capture-hide="false">
                {s1DataType === 'hours' && (
                  <div className="animate-bubble flex flex-col items-center">
                    <div className="flex items-baseline -ml-1">
                      <span className="font-syne font-black text-[clamp(80px,22vw,140px)] leading-[0.88] tracking-[-3px] text-white">
                        {currentData ? Math.round((currentData.totalDuration || 0) / 60) : 0}
                      </span>
                      <span className="font-syne text-[#E8B200] text-[clamp(32px,8vw,44px)] font-normal tracking-[-1px] ml-1.5">h</span>
                    </div>
                    <div className="font-sans text-white/40 text-[12px] font-medium mt-1.5 tracking-[0.01em]">dans le noir en <strong className="text-white/70 font-semibold">{monthLabel}</strong></div>
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
                    <div className="font-sans text-white/40 text-[12px] font-medium mt-1.5 tracking-[0.01em]">découverts en <strong className="text-white/70 font-semibold">{monthLabel}</strong></div>
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
                    <div className="font-sans text-white/40 text-[12px] font-medium mt-1.5 tracking-[0.01em]">de séances en VO en <strong className="text-white/70 font-semibold">{monthLabel}</strong></div>
                  </div>
                )}
                <p data-capture-hide="true" className="absolute bottom-24 text-[10px] text-white/20 font-medium bg-white/5 border border-white/5 px-3 py-1.5 rounded-full">(Clique pour changer)</p>
              </div>

              <div className="absolute bottom-6 left-0 right-0 z-30 flex flex-col items-center gap-2">
                 <div className="w-16 h-px bg-[#E8B200] rounded-full"></div>
                 <span className="font-sans font-medium text-[9px] uppercase tracking-[0.15em] text-white/30">{monthLabel}</span>
                 <span className="font-sans font-extrabold text-[12px] uppercase tracking-[0.1em] text-white mt-1">GRANDÉCRAN_OFF</span>
              </div>
            </div>

            {/* SLIDE 2 : FILMS DU MOIS (MOSAÏQUE) */}
            <div className="rw-slide w-1/6 h-full relative bg-[#F5F2EC] overflow-hidden font-sans" id="rw-slide-2">
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
              <div className="absolute inset-x-0 bottom-0 z-10 h-full" style={{ background: 'linear-gradient(180deg, rgba(245,242,236,0.08) 0%, rgba(245,242,236,0.02) 25%, rgba(245,242,236,0.18) 45%, rgba(245,242,236,0.78) 62%, rgba(245,242,236,0.97) 78%, rgba(245,242,236,1.00) 88%)', bottom: '-2px' }}></div>
              <div className="absolute inset-0 z-20 flex flex-col justify-between p-6">
                <div className="flex justify-between items-start">
                  <div className="inline-flex items-center gap-2 bg-white/70 border border-black/10 rounded-full px-3.5 py-1.5 shadow-sm backdrop-blur-md">
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 stroke-[#1E1E1E] fill-none stroke-2 opacity-60"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    <span className="font-sans text-[10px] font-bold text-[#1E1E1E]/80 tracking-widest uppercase">{monthLabel}</span>
                  </div>
                  <img src={INSTA_LOGO_URL} alt="Logo" className="w-10 h-10 rounded-full shadow-md object-cover" />
                </div>
                <div className="flex flex-col pb-2">
                  <h2 className="font-syne font-extrabold text-[44px] leading-[0.92] tracking-[-2px] text-[#1E1E1E] mb-3">
                    {currentData?.totalFilms || 0} films<br/><span className="text-[#c49a10]">ce mois</span>
                  </h2>
                  <div className="flex flex-wrap gap-1.5">
                    {currentData?.films?.map((film, idx) => {
                      const isCDC = film.coupDeCoeur;
                      const isCapu = film.capucine || film.capucines;
                      return (
                        <div key={idx} className={`inline-flex items-center gap-1.5 border rounded-full px-2.5 py-1 max-w-[250px] overflow-hidden ${isCDC ? 'bg-[#b41e3c]/90 border-[#8b1a3a]/30' : 'bg-[#1e1e1e]/90 border-[#1e1e1e]/20'} ${isCapu && !isCDC ? 'border-[#8b1a3a]/35' : ''}`}>
                          {isCapu && <img src="https://i.imgur.com/lg1bkrO.png" className="w-2.5 h-2.5 rounded-full flex-shrink-0 object-cover" alt="Capu" />}
                          <span className="font-sans text-[9px] font-semibold text-white whitespace-nowrap overflow-hidden text-ellipsis">{film.titre}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* SLIDE 3 : STATS GLOBALES */}
            <div className="rw-slide w-1/6 h-full relative bg-[#F5F2EC] flex flex-col font-sans" id="rw-slide-3">
              <div className="absolute inset-0 z-0 opacity-5 mix-blend-multiply pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")' }}></div>
              <div className="absolute top-6 left-6 right-6 z-30 flex justify-between items-start">
                <div className="inline-flex items-center gap-2 bg-white/70 border border-black/10 rounded-full px-3.5 py-1.5 shadow-sm backdrop-blur-md">
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 stroke-[#1E1E1E] fill-none stroke-2 opacity-60"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  <span className="font-sans text-[10px] font-bold text-[#1E1E1E]/80 tracking-widest uppercase">{monthLabel}</span>
                </div>
                <img src={INSTA_LOGO_URL} alt="Logo" className="w-10 h-10 rounded-full border border-black/10 shadow-md object-cover" />
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
                      <div className="font-syne font-extrabold text-[56px] leading-[0.8] text-[#1E1E1E]/15 tracking-[-2px]">
                        {currentData?.highStarCount || 0}
                      </div>
                      <div className="font-sans text-[9px] font-semibold text-[#1E1E1E]/40 leading-[1.4] text-right max-w-[70px] mt-1">notes sup. à 4</div>
                    </div>
                  </div>
                  <div className="border-b border-[#1E1E1E]/10 pb-4">
                    <div className="font-sans text-[10px] font-bold text-[#1E1E1E]/40 tracking-[0.15em] uppercase mb-1">Durée moyenne</div>
                    <div className="font-syne font-extrabold text-[#1E1E1E] flex items-baseline text-[76px] leading-[0.88] tracking-[-3px]">
                      {currentData ? Math.floor((currentData.averageDuration || 0)/60) : 0}
                      <span className="font-normal text-[26px] text-[#E8B200] mx-1">h</span>
                      {currentData ? String((currentData.averageDuration || 0)%60).padStart(2,'0') : '00'}
                    </div>
                  </div>
                  <div className="flex items-start justify-between border-b border-[#1E1E1E]/10 pb-4">
                    <div className="flex-1 pr-4">
                      <div className="font-sans text-[10px] font-bold text-[#1E1E1E]/40 tracking-[0.15em] uppercase mb-1">Siège favori</div>
                      <div className="font-syne font-extrabold text-[32px] leading-none text-[#1E1E1E] tracking-[-1px] truncate">
                        {currentData?.favSeat?.name || '—'}
                      </div>
                      <div className="font-sans text-[10px] font-semibold text-[#1E1E1E]/40 mt-1">{currentData?.favSeat?.share || 0}% des séances</div>
                    </div>
                    <div className="flex-1 pl-4 border-l border-[#1E1E1E]/10">
                      <div className="font-sans text-[10px] font-bold text-[#1E1E1E]/40 tracking-[0.15em] uppercase mb-1">Salle favorite</div>
                      <div className="font-syne font-extrabold text-[32px] leading-none text-[#1E1E1E] tracking-[-1px] truncate">
                        {currentData?.favRoom ? currentData.favRoom.name.replace('Salle ', '') : '—'}
                      </div>
                      <div className="font-sans text-[10px] font-semibold text-[#1E1E1E]/40 mt-1">{currentData?.favRoom?.share || 0}% des séances</div>
                    </div>
                  </div>
                  <div className="h-[60px] flex items-center">
                    {currentData?.capucinesCount > 0 && (
                      <div className="inline-flex items-center gap-3 bg-[#8B1A3A]/5 border border-[#8B1A3A]/15 rounded-2xl px-4 py-2.5">
                        <img src="https://i.imgur.com/lg1bkrO.png" className="w-[28px] h-[28px] object-contain rounded-full shadow-sm" alt="Capucines" />
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

            {/* SLIDE 4 : GENRES ET LANGUES */}
            <div className="rw-slide w-1/6 h-full relative font-sans flex flex-col" id="rw-slide-4" style={{ background: 'linear-gradient(180deg, #0D0D0D 0%, #111 100%)' }}>
              <div className="absolute bottom-0 left-0 right-0 h-[18%] bg-[#F5F2EC] z-0"></div>
              <div className="absolute inset-0 z-10 flex flex-col pb-3 pt-6 px-6">
                <div className="flex justify-between items-start shrink-0">
                  <div className="inline-flex items-center gap-2 bg-black/40 border border-white/15 rounded-full px-3.5 py-1.5 backdrop-blur-md shadow-sm">
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 stroke-[#E8B200] fill-none stroke-2 opacity-80"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    <span className="font-sans text-[10px] font-bold text-white/80 tracking-widest uppercase">{monthLabel}</span>
                  </div>
                  <img src={INSTA_LOGO_URL} alt="Logo" className="w-10 h-10 rounded-full border border-white/10 shadow-md object-cover" />
                </div>
                <div className="shrink-0 mb-6 mt-4">
                  <div className="font-sans text-[9px] font-bold text-white/40 tracking-[0.15em] uppercase mb-1.5">Ce que j'ai regardé</div>
                  <div className="font-syne font-extrabold text-[34px] leading-[1.05] tracking-[-1px] text-white">
                    Mes genres<br/>
                    <span className="text-[#E8B200]">du mois</span>
                  </div>
                </div>
                <div className="flex-1 flex flex-col gap-4 justify-start min-h-0">
                  {genresArray.map((entry, i) => {
                    const [genreName, count] = entry;
                    const pct = Math.round((count / maxGenreCount) * 100);
                    const isFirst = i === 0; const isSecond = i === 1; const isThird = i === 2;
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
                          <div className="h-full rounded-[3px]" style={{ width: `${pct}%`, background: fillBg }}></div>
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

            {/* SLIDE 5 : TOP / FLOP */}
            <div className="rw-slide w-1/6 h-full relative overflow-hidden font-sans" id="rw-slide-5">
              <div className="absolute left-0 right-0 top-0 w-full h-1/2 overflow-hidden bg-[#0A0A0A]">
                {currentData?.bestMovie?.affiche && (
                  <img src={getPosterUrl(currentData.bestMovie.affiche)} crossOrigin="anonymous" className="absolute inset-0 w-full h-full object-cover object-top z-0 saturate-[0.8] brightness-[0.55]" alt="Affiche" />
                )}
                <div className="absolute inset-0 z-[1]" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.05) 30%, rgba(0,0,0,0.55) 70%, rgba(0,0,0,0.82) 100%)' }}></div>
                <div className="absolute inset-0 z-10 flex flex-col justify-end px-6 pb-6">
                  <div className="flex items-center gap-1.5 font-sans font-bold text-[9px] tracking-[0.16em] uppercase text-white/55 mb-1.5">
                    <span className="block w-[18px] h-[2px] bg-[#E8B200] rounded-[2px]"></span>
                    Coup de cœur
                  </div>
                  <div className="font-syne font-extrabold text-[24px] leading-[1.05] tracking-[-0.5px] text-white mb-2 line-clamp-2">
                    {currentData?.bestMovie?.titre || '—'}
                  </div>
                  {renderStars(parseFloat(String(currentData?.bestMovie?.note || 0).replace(',', '.')), true)}
                </div>
              </div>
              <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/15 z-20"></div>
              <div className="absolute left-0 right-0 bottom-0 w-full h-1/2 overflow-hidden bg-[#F5F2EC]">
                {currentData?.worstMovie?.affiche && (
                  <img src={getPosterUrl(currentData.worstMovie.affiche)} crossOrigin="anonymous" className="absolute inset-0 w-full h-full object-cover object-top z-0 saturate-[0.5] brightness-[0.75] sepia-[0.15]" alt="Affiche" />
                )}
                <div className="absolute inset-x-0 -bottom-[2px] top-0 z-[1]" style={{ background: 'linear-gradient(180deg, rgba(245,242,236,0.2) 0%, rgba(245,242,236,0.05) 25%, rgba(245,242,236,0.65) 65%, rgba(245,242,236,0.92) 100%)' }}></div>
                <div className="absolute inset-0 z-10 flex flex-col justify-end px-6 pb-6">
                  <div className="flex items-center gap-1.5 font-sans font-bold text-[9px] tracking-[0.16em] uppercase text-[#1E1E1E]/45 mb-1.5">
                    <span className="block w-[18px] h-[2px] bg-[#1E1E1E]/30 rounded-[2px]"></span>
                    À oublier
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
                <img src={INSTA_LOGO_URL} alt="Logo" className="w-10 h-10 rounded-full border border-white/10 shadow-md object-cover" />
              </div>
            </div>

            {/* SLIDE 6 : PROFIL CINÉPHILE */}
            <div className="rw-slide w-1/6 h-full relative bg-[#0A0A0A] font-sans overflow-hidden" id="rw-slide-6">
              <div className="rw-glow-a"></div>
              <div className="rw-glow-b"></div>
              <div className="absolute top-6 left-6 right-6 z-30 flex justify-between items-start">
                <div className="inline-flex items-center gap-2 bg-black/40 border border-white/15 rounded-full px-3.5 py-1.5 backdrop-blur-md shadow-sm">
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 stroke-[#E8B200] fill-none stroke-2 opacity-80"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  <span className="font-sans text-[10px] font-bold text-white/80 tracking-widest uppercase">{monthLabel}</span>
                </div>
                <img src={INSTA_LOGO_URL} alt="Logo" className="w-10 h-10 rounded-full border border-white/10 shadow-md object-cover" />
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
                <div className="w-full h-px bg-white/10 my-3"></div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="font-sans text-[7.5px] font-semibold text-white/25 tracking-[0.14em] uppercase mb-1">Genre dominant</div>
                    <div className="font-syne font-bold text-[18px] leading-none text-white tracking-[-0.6px]">
                      <span className="text-[13px] tracking-[-0.3px]">{topGenre}</span>
                    </div>
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
                <div className="font-syne font-semibold text-[10.5px] text-white/30 tracking-[-0.2px] leading-[1.5]">
                  Rendez-vous début <strong className="text-white/60 font-extrabold">{nextMonthLabel}</strong><br/>
                  pour découvrir mon prochain profil
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* STEPPER */}
      <div className="mx-5 mt-4">
        <div className="flex items-center gap-1.5">
          {SLIDE_NAMES.map((_, i) => (
            <div key={i} onClick={() => goToSlide(i)} className={`flex-1 h-1 rounded-full cursor-pointer transition-all ${i === currentSlide ? 'bg-[#E8B200]' : i < currentSlide ? 'bg-[#E8B200]/30' : 'bg-white/10 hover:bg-white/20'}`} />
          ))}
        </div>
      </div>

      {/* EXPORT ACTIONS */}
      <div className="mx-5 mt-6 mb-12 flex flex-col gap-3">
        <button onClick={handleDownloadAll} disabled={isDownloading} className={`w-full h-14 rounded-2xl flex items-center justify-center gap-2.5 font-sans font-extrabold text-sm transition-all ${isDownloading ? 'bg-[#E8B200]/50 text-black/50 cursor-wait' : 'bg-[#E8B200] text-[#0A0A0A] shadow-[0_4px_24px_rgba(232,178,0,0.3)] active:scale-95'}`}>
          {isDownloading ? <div className="w-5 h-5 border-2 border-black/30 border-t-black animate-spin rounded-full"></div> : <><Layers size={18} strokeWidth={2.5}/>Tout télécharger (6 slides)</>}
        </button>
        <button onClick={handleDownload} disabled={isDownloading} className="w-full h-12 rounded-2xl flex items-center justify-center gap-2 font-semibold text-xs text-white/70 bg-white/5 border border-white/10 active:scale-95 transition-all">
          <Download size={14} strokeWidth={2.5}/>Uniquement cette slide — {SLIDE_NAMES[currentSlide]}
        </button>
      </div>

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS (Story Seance)
// ─────────────────────────────────────────────────────────────────────────────
const STORY_W = 1080;
const STORY_H = 1920;
const GOLD    = '#E8B200';
const FONT    = 'system-ui,-apple-system,sans-serif';

const EXPECTATIONS = [
  { label: 'Sceptique',      barHex: 'rgba(255,255,255,0.45)' },
  { label: 'Curieux',        barHex: '#60A5FA' },
  { label: 'Intrigué',       barHex: '#C084FC' },
  { label: 'Très impatient', barHex: '#FB923C' },
  { label: 'Hype absolue',   barHex: GOLD },
];

// ─────────────────────────────────────────────────────────────────────────────
// RENDER ENGINE (Story Seance)
// ─────────────────────────────────────────────────────────────────────────────
async function renderStoryToCanvas(canvas, params) {
  const { title, date, time, lang, expectation, posterImg, screeningLabel } = params;
  const ctx = canvas.getContext('2d');
  canvas.width  = STORY_W;
  canvas.height = STORY_H;

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, STORY_W, STORY_H);

  if (posterImg) drawImageCover(ctx, posterImg, 0, 0, STORY_W, STORY_H);

  const grad = ctx.createLinearGradient(0, 0, 0, STORY_H);
  grad.addColorStop(0,    'rgba(0,0,0,0.55)');
  grad.addColorStop(0.35, 'rgba(0,0,0,0.05)');
  grad.addColorStop(0.6,  'rgba(0,0,0,0.40)');
  grad.addColorStop(1,    'rgba(0,0,0,0.97)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, STORY_W, STORY_H);

  ctx.save();
  ctx.translate(0, 100);

  const LEFT  = 64;
  const MAX_W = STORY_W - LEFT * 2;

  let fsize = 108;
  ctx.textBaseline = 'top';
  const textToMeasure = title || 'Titre du film';
  while (fsize > 60) {
    ctx.font = `900 ${fsize}px ${FONT}`;
    if (wrapText(ctx, textToMeasure, MAX_W).length <= 3) break;
    fsize -= 8;
  }
  const titleLines  = wrapText(ctx, textToMeasure, MAX_W);
  const lineH       = fsize;
  const BOTTOM_ANCHOR = STORY_H - 680;
  const titleY      = BOTTOM_ANCHOR - titleLines.length * lineH;

  ctx.font = `bold 30px ${FONT}`;
  const badgeText = screeningLabel.toUpperCase();
  const badgeW    = ctx.measureText(badgeText).width + 40;
  const badgeH    = 60;
  const bY        = titleY - badgeH - 30;

  ctx.save();
  ctx.globalAlpha = 0.7;
  ctx.fillStyle   = '#1C1C1E';
  roundRect(ctx, LEFT, bY, badgeW, badgeH, badgeH / 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.restore();
  ctx.fillStyle   = 'rgba(255,255,255,0.9)';
  ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  ctx.fillText(badgeText, LEFT + 20, bY + badgeH / 2);

  ctx.textBaseline = 'top';
  ctx.font = `900 ${fsize}px ${FONT}`;
  ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 6;
  ctx.fillStyle   = '#FFF';
  titleLines.forEach((l, i) => ctx.fillText(l, LEFT, titleY + i * lineH));
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

  const BFONT = `bold 42px ${FONT}`;
  const BH    = 88;
  const BY    = titleY + titleLines.length * lineH + 40;
  ctx.font = BFONT; ctx.textBaseline = 'middle';
  let bx = LEFT;

  const badgesInfo = [
    { text: date,                   type: 'calendar' },
    { text: time.replace(':', 'h'), type: 'clock'    },
    { text: lang,                   type: 'globe'     },
  ];

  for (const badge of badgesInfo) {
    const iconSize = 34, gap = 14, px = 32;
    const bw = px + iconSize + gap + ctx.measureText(badge.text).width + px;

    ctx.save();
    ctx.globalAlpha = 0.92; ctx.fillStyle = '#1C1C1E';
    roundRect(ctx, bx, BY, bw, BH, BH / 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 2.5;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const ix = bx + px, iy = BY + (BH - iconSize) / 2;
    ctx.translate(ix, iy);
    ctx.scale(iconSize / 24, iconSize / 24);
    ctx.beginPath();
    if (badge.type === 'calendar') {
      ctx.moveTo(5, 4); ctx.lineTo(19, 4); ctx.arcTo(21, 4, 21, 6, 2);
      ctx.lineTo(21, 20); ctx.arcTo(21, 22, 19, 22, 2);
      ctx.lineTo(5, 22); ctx.arcTo(3, 22, 3, 20, 2);
      ctx.lineTo(3, 6); ctx.arcTo(3, 4, 5, 4, 2);
      ctx.moveTo(16, 2); ctx.lineTo(16, 6);
      ctx.moveTo(8, 2); ctx.lineTo(8, 6);
      ctx.moveTo(3, 10); ctx.lineTo(21, 10);
    } else if (badge.type === 'clock') {
      ctx.arc(12, 12, 10, 0, Math.PI * 2);
      ctx.moveTo(12, 6); ctx.lineTo(12, 12); ctx.lineTo(16, 14);
    } else {
      ctx.arc(12, 12, 10, 0, Math.PI * 2);
      ctx.moveTo(2, 12); ctx.lineTo(22, 12);
      ctx.moveTo(12, 2); ctx.ellipse(12, 12, 4, 10, 0, -Math.PI / 2, Math.PI * 1.5);
    }
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#FFF'; ctx.font = BFONT; ctx.textAlign = 'left';
    ctx.fillText(badge.text, ix + iconSize + gap, BY + BH / 2);
    bx += bw + 18;
  }

  const CX = LEFT, CY = BY + BH + 50, CW = STORY_W - LEFT * 2, CH = 260, CR = 56;
  ctx.save();
  ctx.globalAlpha = 0.72; ctx.fillStyle = '#000';
  roundRect(ctx, CX, CY, CW, CH, CR); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 2; ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.restore();

  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = `bold 28px ${FONT}`; ctx.textBaseline = 'top'; ctx.textAlign = 'left';
  ctx.fillText('HYPE  METER', CX + 52, CY + 44);
  ctx.fillStyle = '#FFF';
  ctx.font = `900 italic 68px ${FONT}`;
  ctx.fillText(EXPECTATIONS[expectation].label, CX + 52, CY + 82);
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.font = `900 italic 88px ${FONT}`;
  ctx.textAlign = 'right';
  ctx.fillText(`${expectation + 1}/5`, CX + CW - 52, CY + 54);
  ctx.textAlign = 'left';

  const barW = (CW - 104 - 14 * 4) / 5, barY = CY + CH - 60;
  for (let i = 0; i < 5; i++) {
    roundRect(ctx, CX + 52 + i * (barW + 14), barY, barW, 22, 11);
    ctx.fillStyle   = i <= expectation ? EXPECTATIONS[i].barHex : 'rgba(255,255,255,0.1)';
    ctx.shadowColor = i <= expectation ? EXPECTATIONS[i].barHex : 'transparent';
    ctx.shadowBlur  = i <= expectation ? 12 : 0;
    ctx.fill();
  }
  ctx.shadowBlur = 0;
  ctx.restore();

  return canvas;
}

// ─────────────────────────────────────────────────────────────────────────────
// LOCK SCREEN
// ─────────────────────────────────────────────────────────────────────────────
function LockScreen({ onUnlock }) {
  const [password, setPassword] = useState('');
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 animate-in fade-in duration-500 pb-[env(safe-area-inset-bottom)]">
      <div className="w-20 h-20 bg-white/5 rounded-full border border-white/10 flex items-center justify-center mb-6 shadow-2xl">
        <svg className="w-8 h-8 text-[#E8B200]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
      </div>
      <h2 className="font-syne font-black text-3xl mb-2 text-white">Zone Sécurisée</h2>
      <form onSubmit={(e) => { e.preventDefault(); if (password.toUpperCase() === 'POPCORN') onUnlock(); else { alert('Mot de passe incorrect'); setPassword(''); }}} className="flex flex-col gap-4 w-full max-w-xs">
        <input type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-black/40 border border-white/10 rounded-2xl p-4 text-center font-sans font-bold tracking-widest outline-none focus:border-[#E8B200] transition-colors text-white"/>
        <button type="submit" className="bg-[#E8B200] text-black font-syne font-black uppercase tracking-widest py-4 rounded-2xl active:scale-95 transition-transform text-sm">Déverrouiller</button>
      </form>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STUDIO HUB
// ─────────────────────────────────────────────────────────────────────────────
function StudioHub({ isScrolled, onSelectTool, onLock, pendingFilm }) {
  const getPosterUrl = (url) => {
    if (!url) return '';
    const proxyBase = import.meta.env.DEV ? '/tmdb-proxy' : '/api/proxy-image';
    return `${proxyBase}?url=${encodeURIComponent(url)}`;
  };

  const bgImage = pendingFilm?.affiche ? getPosterUrl(pendingFilm.affiche) : null;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-safe-24 font-sans bg-[#0C0C0E] min-h-screen text-[#F0EEF5]">
      <header className={`z-40 sticky top-0 w-full transition-all duration-500 bg-[#0C0C0E]/90 backdrop-blur-2xl border-b ${isScrolled ? 'pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-3 border-white/10 shadow-lg' : 'pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-5 border-transparent'}`}>
        <div className="px-6 flex justify-between items-center">
          <h1 className={`font-syne font-black text-white leading-none transition-all duration-500 ${isScrolled ? 'text-2xl' : 'text-4xl'}`}>Studio</h1>
          <button onClick={onLock} className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20 active:scale-90 transition-all hover:bg-red-500/20 hover:border-red-500/40">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </button>
        </div>
      </header>

      <main className="pt-6 space-y-8 pb-12">
        <div className="px-6">
          <h2 className="font-syne font-extrabold text-white/30 text-[10px] tracking-[0.25em] uppercase mb-4">L'événement du mois</h2>
          <div className="relative cursor-pointer group" onClick={() => onSelectTool('recap')}>
            <div className="absolute inset-0 bg-white/5 border border-white/5 rounded-3xl transform rotate-3 scale-95 transition-transform group-hover:rotate-6 group-active:scale-90 origin-bottom-right"></div>
            <div className="absolute inset-0 bg-white/10 border border-white/10 rounded-3xl transform -rotate-2 scale-[0.98] transition-transform group-hover:-rotate-4 group-active:scale-95 origin-bottom-left"></div>
            <div className="relative bg-[#050505] border border-white/10 rounded-3xl p-6 overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.6)] transition-all duration-500 group-hover:border-[#E8B200]/40 group-active:scale-[0.98] aspect-[4/3] flex flex-col justify-between">
              <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")' }}></div>
              <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden rounded-3xl">
                <div className="absolute top-0 bottom-0 w-32 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-[30deg] animate-studio-shine"></div>
              </div>
              <div className="absolute -top-24 -right-24 w-80 h-80 bg-[#E8B200]/15 rounded-full blur-[80px] group-hover:bg-[#E8B200]/25 transition-colors duration-700"></div>
              <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-blue-950/10 rounded-full blur-[80px]"></div>
              <div className="relative z-20 flex justify-between items-start">
                <div className="bg-[#E8B200] border border-[#E8B200]/50 rounded-full px-3 py-1 flex items-center gap-2 shadow-[0_0_20px_rgba(232,178,0,0.25)]">
                  <Layers size={11} className="text-black" strokeWidth={3} />
                  <span className="font-black text-[9px] text-black uppercase tracking-[0.1em]">6 Slides</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-xl group-hover:border-[#E8B200]/50 transition-colors">
                   <Film size={18} className="text-white/70 group-hover:text-[#E8B200] group-hover:scale-110 transition-all" strokeWidth={1.5} />
                </div>
              </div>
              <div className="relative z-20">
                <div className="flex items-center gap-2.5 mb-2.5">
                    <div className="h-[1px] w-9 bg-[#E8B200]/60"></div>
                    <span className="font-sans font-bold text-[9px] text-[#E8B200] uppercase tracking-[0.35em] opacity-90">Rewind exclusif</span>
                </div>
                <h3 className="font-syne font-black text-4xl text-white leading-[0.95] tracking-tighter mb-3">
                  Récap'<br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E8B200] via-[#FFD341] to-[#E8B200] bg-[length:200%_auto] animate-gradient-x animate-title-glow">Mensuel</span>
                </h3>
                <p className="text-sm text-white/50 font-medium max-w-[88%] leading-relaxed">
                  Générez votre <span className="text-white">fresque narrative</span> et partagez vos moments forts du mois.
                </p>
              </div>
              <div className="absolute bottom-4 right-6 opacity-30 group-hover:opacity-100 transition-opacity">
                <ChevronRight className="text-white group-hover:translate-x-1.5 transition-transform" size={20} strokeWidth={2.5}/>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="px-6 font-syne font-extrabold text-white/30 text-[10px] tracking-[0.25em] uppercase mb-4">Créations Rapides</h2>
          <div className="flex gap-4 overflow-x-auto px-6 pb-4 scrollbar-hide snap-x">
            <div onClick={() => onSelectTool('seance')} className="snap-start shrink-0 relative w-[160px] aspect-[9/16] rounded-2xl overflow-hidden cursor-pointer group shadow-xl border border-white/10 bg-[#050505]">
              {bgImage ? (
                <>
                  <img src={bgImage} className="absolute inset-0 w-full h-full object-cover z-0 transition-transform duration-700 group-hover:scale-110 saturate-[0.8]" alt="" crossOrigin="anonymous" />
                  <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/95 via-black/50 to-black/20 group-hover:via-black/60 transition-colors"></div>
                </>
              ) : (
                <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#121212] to-[#050505] opacity-80">
                  <div className="absolute inset-0 mix-blend-overlay opacity-20" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")' }}></div>
                </div>
              )}
              <div className="absolute inset-0 z-20 flex flex-col justify-between p-4 group-active:scale-95 transition-transform">
                <div className="w-8 h-8 rounded-full bg-black/50 border border-white/15 backdrop-blur-md flex items-center justify-center self-end group-hover:border-[#E8B200]/40 transition-colors">
                  <Ticket size={16} className="text-white/70 group-hover:text-[#E8B200] transition-colors" strokeWidth={1.5}/>
                </div>
                <div>
                  <h3 className="font-syne font-extrabold text-lg text-white leading-tight mb-1">Story<br/>Séance</h3>
                  <p className="text-[10px] text-white/60 font-medium leading-snug line-clamp-2">
                    {pendingFilm ? `Annonce "${pendingFilm.titre}"` : "Annonce ton prochain film."}
                  </p>
                </div>
              </div>
            </div>

            <div className="snap-start shrink-0 relative w-[160px] aspect-[9/16] rounded-2xl overflow-hidden shadow-xl border border-white/5 bg-[#0C0C0E] flex flex-col">
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #ffffff 10px, #ffffff 11px)' }}></div>
              <div className="absolute inset-0 flex flex-col justify-between p-4 opacity-40">
                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center self-end">
                  <Star size={15} className="text-white/60" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="font-syne font-extrabold text-lg text-white leading-tight mb-1">Avis<br/>Express</h3>
                  <p className="text-[10px] text-white/50 font-medium leading-snug">Partage ta critique à chaud.</p>
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                <div className="bg-[#E8B200] text-black font-syne font-black text-[9px] uppercase tracking-[0.2em] px-3.5 py-1.5 rounded-full transform -rotate-12 shadow-[0_4px_12px_rgba(232,178,0,0.3)]">Bientôt</div>
              </div>
            </div>

            <div className="snap-start shrink-0 relative w-[160px] aspect-[9/16] rounded-2xl overflow-hidden shadow-xl border border-white/5 bg-[#0C0C0E] flex flex-col mr-6">
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #ffffff 10px, #ffffff 11px)' }}></div>
              <div className="absolute inset-0 flex flex-col justify-between p-4 opacity-40">
                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center self-end">
                  <Sparkles size={15} className="text-white/60" strokeWidth={1.5}/>
                </div>
                <div>
                  <h3 className="font-syne font-extrabold text-lg text-white leading-tight mb-1">Top 10<br/>Annuel</h3>
                  <p className="text-[10px] text-white/50 font-medium leading-snug">Le classement ultime.</p>
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                <div className="bg-[#E8B200] text-black font-syne font-black text-[9px] uppercase tracking-[0.2em] px-3.5 py-1.5 rounded-full transform -rotate-12 shadow-[0_4px_12px_rgba(232,178,0,0.3)]">Bientôt</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SEANCE STORY TOOL
// ─────────────────────────────────────────────────────────────────────────────
function SeanceStoryTool({ historyData = [], onBack, pendingFilm }) {
  const [title,         setTitle]         = useState(pendingFilm?.titre  || '');
  const [date,          setDate]          = useState(pendingFilm?.date   || new Date().toLocaleDateString('fr-FR'));
  const [time,          setTime]          = useState(pendingFilm?.heure  ? pendingFilm.heure.replace('h', ':') : '20:00');
  const [lang,          setLang]          = useState(pendingFilm?.langue || 'VOSTFR');
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

  const currentYear = date ? date.split('/')[2] : String(new Date().getFullYear());
  const yearlyScreeningNumber = (historyData || []).filter(f => f.date?.endsWith(currentYear)).length + 1;
  const screeningLabel = `${currentYear} — Séance #${yearlyScreeningNumber}`;

  useEffect(() => {
    if (!pendingFilm?.affiche) { setPosterImg(null); return; }
    setPosterLoading(true);
    loadImageForCanvas(pendingFilm.affiche).then((img) => {
      if (img?.src?.startsWith('blob:')) blobUrlsRef.current.push(img.src);
      setPosterImg(img);
      setPosterLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingFilm?.affiche]);

  useEffect(() => () => { blobUrlsRef.current.forEach(URL.revokeObjectURL); }, []);

  paramsRef.current = { title, date, time, lang, expectation, posterImg, screeningLabel };

  useEffect(() => {
    if (previewRef.current) renderStoryToCanvas(previewRef.current, paramsRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, date, time, lang, expectation, posterImg, screeningLabel]);

  const assignPreviewRef = useCallback((node) => {
    previewRef.current = node;
    if (node) requestAnimationFrame(() => renderStoryToCanvas(node, paramsRef.current));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const update = () => { if (wrapperRef.current) setPreviewScale(wrapperRef.current.offsetWidth / STORY_W); };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPosterLoading(true);
    const objectUrl = URL.createObjectURL(file);
    blobUrlsRef.current.push(objectUrl);
    try {
      const img = await loadImgElement(objectUrl);
      setPosterImg(img);
    } catch {
      alert("Impossible de charger cette image.");
    } finally {
      setPosterLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const downloadStory = useCallback(async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      const exportCanvas = document.createElement('canvas');
      await renderStoryToCanvas(exportCanvas, paramsRef.current);
      exportCanvas.toBlob(async (blob) => {
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
    } catch (err) {
      console.error(err);
      alert('Erreur inattendue. Réessaie.');
      setIsDownloading(false);
    }
  }, [isDownloading, yearlyScreeningNumber]);

  return (
    <div className="animate-in fade-in pb-24 flex flex-col min-h-screen bg-[#0C0C0E] overflow-x-hidden">
      <header className="z-40 sticky top-0 w-full bg-[#0C0C0E]/90 backdrop-blur-xl border-b border-white/10 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 px-6 flex justify-between items-center text-white">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h2 className="font-syne font-black text-lg">Story Séance</h2>
        <div className="w-10"/>
      </header>

      <div className="px-6 py-6 flex flex-col gap-6">
        <div ref={wrapperRef} className="w-full relative bg-black rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl" style={{ aspectRatio: '9/16' }}>
          {posterLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/60 rounded-[2rem]">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"/>
                <span className="text-white/60 text-xs font-medium">Chargement...</span>
              </div>
            </div>
          )}
          <canvas
            ref={assignPreviewRef}
            width={STORY_W} height={STORY_H}
            className="absolute top-0 left-0 origin-top-left"
            style={{ width: `${STORY_W}px`, height: `${STORY_H}px`, transform: `scale(${previewScale})` }}
          />
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col gap-12 text-white">
          <div>
            <label className="text-white/40 text-xs font-bold uppercase tracking-widest mb-3 block">
              Hype Meter — <span className="text-white/70">{EXPECTATIONS[expectation].label}</span>
            </label>
            <div className="flex gap-2">
              {EXPECTATIONS.map((exp, i) => (
                <button key={i} onClick={() => setExpectation(i)}
                  className="flex-1 h-3 rounded-full transition-all active:scale-95"
                  style={{ background: i <= expectation ? exp.barHex : 'rgba(255,255,255,0.1)', boxShadow: i === expectation ? `0 0 12px ${exp.barHex}` : 'none' }}/>
              ))}
            </div>
          </div>
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden"/>
          <button onClick={() => fileInputRef.current?.click()}
            className="w-full h-14 rounded-2xl bg-white/5 text-white/80 font-bold text-sm flex items-center justify-center gap-3 active:scale-95 transition-all border border-white/10 hover:bg-white/10">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            Changer l'affiche manuellement
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={downloadStory}
            disabled={isDownloading || !title.trim()}
            className={`w-full h-14 rounded-2xl flex items-center justify-center gap-2.5 font-sans font-extrabold text-sm transition-all
              ${isDownloading || !title.trim()
                ? 'bg-[#E8B200]/50 text-black/50 cursor-wait'
                : 'bg-[#E8B200] text-[#0A0A0A] shadow-[0_4px_24px_rgba(232,178,0,0.3)] active:scale-95 hover:shadow-[0_8px_32px_rgba(232,178,0,0.4)]'
              }`}
          >
            {isDownloading ? (
              <div className="w-5 h-5 border-2 border-black/30 border-t-black animate-spin rounded-full"></div>
            ) : (
              <>
                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                  <polyline points="16 6 12 2 8 6"/>
                  <line x1="12" y1="2" x2="12" y2="15"/>
                </svg>
                Partager la Story
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT EXPORT
// ─────────────────────────────────────────────────────────────────────────────
export function Studio({ historyData, pendingFilm, isScrolled }) {
  const [isUnlocked, setIsUnlocked] = useState(localStorage.getItem('grandecran_studio_unlocked') === 'true');
  const [activeTool, setActiveTool] = useState(null);

  if (!isUnlocked) return <LockScreen onUnlock={() => { setIsUnlocked(true); localStorage.setItem('grandecran_studio_unlocked', 'true'); }}/>;
  if (activeTool === 'recap')  return <RecapTool onBack={() => setActiveTool(null)} historyData={historyData} />;
  if (activeTool === 'seance') return <SeanceStoryTool historyData={historyData} pendingFilm={pendingFilm} onBack={() => setActiveTool(null)}/>;
  return <StudioHub isScrolled={isScrolled} onSelectTool={setActiveTool} onLock={() => { setIsUnlocked(false); localStorage.removeItem('grandecran_studio_unlocked'); }} pendingFilm={pendingFilm}/>;
}