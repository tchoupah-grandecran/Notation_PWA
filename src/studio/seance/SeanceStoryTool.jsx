import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft } from 'lucide-react';
import '../../Studio.css';

// ─────────────────────────────────────────────────────────────────────────────
// IMAGE LOADING
// ─────────────────────────────────────────────────────────────────────────────

function loadImgElement(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.crossOrigin = 'anonymous';
    img.src = src;
  });
}

async function loadImageForCanvas(originalUrl) {
  if (!originalUrl) return null;

  if (
    originalUrl.startsWith('data:') ||
    originalUrl.startsWith('blob:') ||
    originalUrl.startsWith('/')
  ) {
    return loadImgElement(originalUrl);
  }

  try {
    const resp = await fetch(originalUrl, { mode: 'cors', cache: 'force-cache' });
    if (resp.ok) {
      const blob = await resp.blob();
      return loadImgElement(URL.createObjectURL(blob));
    }
  } catch (_) {}

  const proxyBase = import.meta.env.DEV ? '/tmdb-proxy' : '/api/proxy-image';

  try {
    const resp = await fetch(`${proxyBase}?url=${encodeURIComponent(originalUrl)}`, {
      cache: 'force-cache',
    });
    if (resp.ok) {
      const blob = await resp.blob();
      return loadImgElement(URL.createObjectURL(blob));
    }
  } catch (_) {}

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// FONTS
// ─────────────────────────────────────────────────────────────────────────────

async function ensureFontsLoaded() {
  await document.fonts.ready;

  const fontsToLoad = [
    '400 10px "DM Sans"',
    '500 10px "DM Sans"',
    '600 10px "DM Sans"',
    '700 10px "DM Sans"',
    '800 10px "DM Sans"',
    '400 10px "Instrument Serif"',
    '400 10px "Limelight"',
  ];

  for (const font of fontsToLoad) {
    try {
      await document.fonts.load(font);
    } catch (_) {}
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CANVAS UTILS
// ─────────────────────────────────────────────────────────────────────────────

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.arcTo(x + w, y, x + w, y + rr, rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr);
  ctx.lineTo(x + rr, y + h);
  ctx.arcTo(x, y + h, x, y + h - rr, rr);
  ctx.lineTo(x, y + rr);
  ctx.arcTo(x, y, x + rr, y, rr);
  ctx.closePath();
}

function wrapText(ctx, text, maxWidth) {
  if (!text) return [];

  const words = String(text).split(/\s+/);
  const lines = [];
  let current = '';

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }

  if (current) lines.push(current);
  return lines;
}

/** Réduit la taille de police jusqu'à ce que le texte tienne dans maxWidth. */
function fitFontSize(ctx, text, makeFont, startSize, maxWidth, minSize = 24, spacing = '0px') {
  ctx.save();
  ctx.letterSpacing = spacing;
  let size = startSize;
  while (size > minSize) {
    ctx.font = makeFont(size);
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 2;
  }
  ctx.restore();
  return size;
}

/** Contient l'image dans une zone sans jamais la recadrer. */
function getContainRect(img, x, y, w, h) {
  if (!img?.naturalWidth || !img?.naturalHeight) return { x, y, w, h };

  const imageRatio = img.naturalWidth / img.naturalHeight;
  const boxRatio = w / h;

  let drawW;
  let drawH;

  if (imageRatio > boxRatio) {
    drawW = w;
    drawH = drawW / imageRatio;
  } else {
    drawH = h;
    drawW = drawH * imageRatio;
  }

  return {
    x: x + (w - drawW) / 2,
    y: y + (h - drawH) / 2,
    w: drawW,
    h: drawH,
  };
}

function drawImageContain(ctx, img, x, y, w, h) {
  if (!img) return null;
  const rect = getContainRect(img, x, y, w, h);
  ctx.drawImage(img, rect.x, rect.y, rect.w, rect.h);
  return rect;
}

function drawCropMarks(ctx, r, mark, gap) {
  const { x, y, w, h } = r;
  ctx.beginPath();
  // haut gauche
  ctx.moveTo(x - mark, y);
  ctx.lineTo(x - gap, y);
  ctx.moveTo(x, y - mark);
  ctx.lineTo(x, y - gap);
  // haut droit
  ctx.moveTo(x + w + gap, y);
  ctx.lineTo(x + w + mark, y);
  ctx.moveTo(x + w, y - mark);
  ctx.lineTo(x + w, y - gap);
  // bas gauche
  ctx.moveTo(x - mark, y + h);
  ctx.lineTo(x - gap, y + h);
  ctx.moveTo(x, y + h + gap);
  ctx.lineTo(x, y + h + mark);
  // bas droit
  ctx.moveTo(x + w + gap, y + h);
  ctx.lineTo(x + w + mark, y + h);
  ctx.moveTo(x + w, y + h + gap);
  ctx.lineTo(x + w, y + h + mark);
  ctx.stroke();
}

// ─────────────────────────────────────────────────────────────────────────────
// ACCENT COLOR
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_ACCENT = { r: 232, g: 178, b: 0 };

function getPosterAccent(img) {
  if (!img?.naturalWidth || !img?.naturalHeight) return DEFAULT_ACCENT;

  try {
    const sampleCanvas = document.createElement('canvas');
    const size = 40;
    sampleCanvas.width = size;
    sampleCanvas.height = size;

    const sampleCtx = sampleCanvas.getContext('2d');
    sampleCtx.drawImage(img, 0, 0, size, size);

    const data = sampleCtx.getImageData(0, 0, size, size).data;

    let r = 0;
    let g = 0;
    let b = 0;
    let count = 0;

    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      if (brightness > 245) continue;
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      count++;
    }

    if (!count) return DEFAULT_ACCENT;

    return {
      r: Math.round(r / count),
      g: Math.round(g / count),
      b: Math.round(b / count),
    };
  } catch (_) {
    return DEFAULT_ACCENT;
  }
}

/** Éclaircit une couleur (utile pour garder du contraste sur fond noir). */
function mixWithWhite({ r, g, b }, amount) {
  return {
    r: Math.round(r + (255 - r) * amount),
    g: Math.round(g + (255 - g) * amount),
    b: Math.round(b + (255 - b) * amount),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CINEMA TEXTURE
// ─────────────────────────────────────────────────────────────────────────────

function drawFilmGrain(ctx, x, y, w, h, intensity = 0.055) {
  const amount = Math.floor(w * h * 0.00013);

  ctx.save();
  for (let i = 0; i < amount; i++) {
    const px = x + Math.random() * w;
    const py = y + Math.random() * h;
    const alpha = Math.random() * intensity;

    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.fillRect(px, py, Math.random() > 0.92 ? 2 : 1, Math.random() > 0.92 ? 2 : 1);
  }
  ctx.restore();
}

function drawDust(ctx, x, y, w, h) {
  ctx.save();
  for (let i = 0; i < 70; i++) {
    const px = x + Math.random() * w;
    const py = y + Math.random() * h;
    const radius = Math.random() * 1.8 + 0.4;
    const opacity = Math.random() * 0.12;

    ctx.fillStyle = `rgba(255,255,255,${opacity})`;
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ─────────────────────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────────────────────

const EXPECTATIONS = [
  { label: 'RÉSERVÉ', sub: 'J’attends de voir.', barHex: '#A3A3A3' },
  { label: 'CURIEUX', sub: 'Ça m’intrigue.', barHex: '#93C5FD' },
  { label: 'ATTENTIF', sub: 'J’ai envie de le découvrir.', barHex: '#C084FC' },
  { label: 'TRÈS ATTENDU', sub: 'J’ai vraiment hâte.', barHex: '#FB923C' },
  { label: 'ÉVÉNEMENT', sub: 'Impossible de passer à côté.', barHex: '#E8B200' },
];

const WHY_OPTIONS = [
  'Très attendu',
  'Réalisateur que j’aime',
  'Avant-première',
  'Tout le monde en parle',
  'Adaptation',
  'Découverte',
  'Vous me l’avez conseillé',
  'Sortie cinéma',
];

const PERSONAL_MAX = 90;
const MAX_TAGS = 4;

const FONT_SANS = '"DM Sans", sans-serif';
const FONT_SERIF = '"Instrument Serif", Georgia, serif';
const FONT_LIGHTBOX = '"Limelight", serif';

// ─────────────────────────────────────────────────────────────────────────────
// LAYOUT
// ─────────────────────────────────────────────────────────────────────────────
// Principe : le bloc d'infos (séance + attente + pourquoi) est mesuré d'abord,
// puis l'affiche prend TOUT l'espace restant. Moins il y a d'infos, plus
// l'affiche est grande.

const W = 1080;
const H = 1920;
const CX = W / 2;

const CONTENT_MAX_W = 960;
const POSTER_TOP = 56;
const POSTER_GAP = 44; // espace affiche → bloc d'infos
const CONTENT_BOTTOM = 1730; // fin du contenu utile (marge basse = zone d'ombre Instagram)
const EDITORIAL_GAP = 36; // espace sous une affiche courte (éditorial)
const POSTER_MAX_H = 1335;
const POSTER_MIN_H = 760;

const L = {
  // chips séance
  chipH: 54,
  chipFont: 32,
  chipGap: 12,
  afterMeta: 18,
  // attente
  eyebrowFont: 28,
  afterEyebrow: 4,
  labelFont: 108,
  labelLine: 100,
  afterLabel: 12,
  gaugeH: 22,
  gaugeGap: 14,
  afterGauge: 0,
  // pourquoi
  beforeWhy: 48,
  pillH: 60,
  pillFont: 34,
  pillPadX: 36,
  pillGap: 12,
  pillRowGap: 14,
  afterPill: 22,
  personalFont: 50,
  personalLine: 56,
};

function fitChips(ctx, items, maxWidth) {
  let size = L.chipFont;
  let widths = [];
  let total = 0;

  while (size >= 26) {
    ctx.font = `600 ${size}px ${FONT_SANS}`;
    const padX = Math.round(size * 0.68);
    widths = items.map((item) => ctx.measureText(item).width + padX * 2);
    total = widths.reduce((a, b) => a + b, 0) + L.chipGap * (items.length - 1);
    if (total <= maxWidth) break;
    size -= 2;
  }

  return { size, widths, total, padX: Math.round(size * 0.68) };
}

function layoutTags(ctx, tags) {
  if (!tags.length) return { rows: [], height: 0 };

  ctx.font = `600 ${L.pillFont}px ${FONT_SANS}`;

  const items = tags.map((text) => ({
    text,
    w: Math.min(ctx.measureText(text).width + L.pillPadX * 2, CONTENT_MAX_W),
  }));

  const rows = [];
  let row = { items: [], total: 0 };

  for (const item of items) {
    const next = row.total + (row.items.length ? L.pillGap : 0) + item.w;

    if (row.items.length && next > CONTENT_MAX_W) {
      rows.push(row);
      row = { items: [item], total: item.w };
    } else {
      row.items.push(item);
      row.total = next;
    }
  }

  rows.push(row);

  return {
    rows,
    height: rows.length * L.pillH + (rows.length - 1) * L.pillRowGap,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// POSTER — CINEMA (encadrée, texturée)
// ─────────────────────────────────────────────────────────────────────────────

function drawCinemaPoster(ctx, posterImg, posterH, accentRgb, lightRgb) {
  const boxX = 42;
  const boxW = W - boxX * 2;
  const boxY = POSTER_TOP;
  const boxH = posterH;

  // lumière ambiante
  if (posterImg) {
    const cyGlow = boxY + boxH / 2;
    const glow = ctx.createRadialGradient(CX, cyGlow, 50, CX, cyGlow, 850);
    glow.addColorStop(0, `rgba(${accentRgb},0.18)`);
    glow.addColorStop(0.45, `rgba(${accentRgb},0.06)`);
    glow.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.fillStyle = glow;
    ctx.fillRect(0, boxY - 100, W, boxH + 200);
  }

  let rect;

  if (posterImg) {
    ctx.save();
    ctx.shadowColor = `rgba(${accentRgb},0.35)`;
    ctx.shadowBlur = 70;
    rect = drawImageContain(ctx, posterImg, boxX, boxY, boxW, boxH);
    ctx.restore();
  } else {
    rect = getContainRect({ naturalWidth: 2, naturalHeight: 3 }, boxX, boxY, boxW, boxH);

    ctx.save();
    ctx.fillStyle = '#111';
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.font = `400 48px ${FONT_SERIF}`;
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Votre affiche', CX, rect.y + rect.h / 2);
    ctx.restore();
  }

  // cadre
  ctx.save();
  ctx.strokeStyle = `rgba(${lightRgb},0.7)`;
  ctx.lineWidth = 3;
  ctx.shadowColor = `rgba(${accentRgb},0.45)`;
  ctx.shadowBlur = 18;
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();

  // second filet
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = 1;
  ctx.strokeRect(rect.x - 7, rect.y - 7, rect.w + 14, rect.h + 14);
  ctx.restore();

  // grain + poussière
  drawFilmGrain(ctx, rect.x, rect.y, rect.w, rect.h, 0.065);
  drawDust(ctx, rect.x, rect.y, rect.w, rect.h);

  // repères de coupe
  ctx.save();
  ctx.strokeStyle = `rgba(${lightRgb},0.7)`;
  ctx.lineWidth = 2;
  drawCropMarks(ctx, rect, 24, 6);
  ctx.restore();

  return boxY + boxH + POSTER_GAP;
}

// ─────────────────────────────────────────────────────────────────────────────
// POSTER — EDITORIAL (pleine largeur, collée en haut, jonction franche)
// ─────────────────────────────────────────────────────────────────────────────

function drawEditorialPoster(ctx, posterImg, contentTop) {
  const areaH = contentTop;

  if (posterImg?.naturalWidth) {
    const drawH = (posterImg.naturalHeight / posterImg.naturalWidth) * W;

    // affiche plus courte que la zone : aucun recadrage
    if (drawH < areaH) {
      ctx.drawImage(posterImg, 0, 0, W, drawH);
      return drawH + EDITORIAL_GAP;
    }

    // affiche plus haute : elle est coupée net en bas
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, areaH);
    ctx.clip();
    ctx.drawImage(posterImg, 0, 0, W, drawH);
    ctx.restore();
  } else {
    ctx.save();
    ctx.fillStyle = '#E5E0D8';
    ctx.fillRect(0, 0, W, areaH);
    ctx.font = `400 48px ${FONT_SERIF}`;
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Votre affiche', CX, areaH / 2);
    ctx.restore();
  }

  return areaH;
}

// ─────────────────────────────────────────────────────────────────────────────
// STORY RENDERER
// ─────────────────────────────────────────────────────────────────────────────

async function renderStoryToCanvas(canvas, params) {
  await ensureFontsLoaded();

  const {
    date,
    time,
    lang,
    duration,
    expectation,
    posterImg,
    screeningLabel,
    styleMode,
    whyTags,
    personalText,
  } = params;

  const ctx = canvas.getContext('2d');
  canvas.width = W;
  canvas.height = H;

  const isCinema = styleMode === 'cinema';

  const accent = getPosterAccent(posterImg);
  const accentRgb = `${accent.r}, ${accent.g}, ${accent.b}`;
  const light = mixWithWhite(accent, 0.5);
  const lightRgb = `${light.r}, ${light.g}, ${light.b}`;

  const level = clamp(expectation, 0, 4);
  const ex = EXPECTATIONS[level];
  const exColor = ex.barHex;

  const C = isCinema
    ? {
        bg: '#070707',
        chipBg: 'rgba(255,255,255,0.11)',
        chipText: 'rgba(255,255,255,0.94)',
        eyebrow: 'rgba(255,255,255,0.62)',
        label: exColor,
        gaugeOff: 'rgba(255,255,255,0.14)',
        sub: 'rgba(255,255,255,0.86)',
        pillBg: `rgba(${lightRgb},0.18)`,
        pillStroke: `rgba(${lightRgb},0.75)`,
        pillText: '#FFFFFF',
        personal: 'rgba(255,255,255,0.92)',
        footer: 'rgba(255,255,255,0.5)',
      }
    : {
        bg: '#F3EFE8',
        chipBg: 'rgba(25,25,25,0.08)',
        chipText: 'rgba(25,25,25,0.88)',
        eyebrow: 'rgba(25,25,25,0.58)',
        label: '#181818',
        gaugeOff: 'rgba(25,25,25,0.12)',
        sub: 'rgba(25,25,25,0.78)',
        pillBg: '#181818',
        pillStroke: null,
        pillText: '#F3EFE8',
        personal: 'rgba(25,25,25,0.88)',
        footer: 'rgba(25,25,25,0.5)',
      };

  // ───────────────────────────────────────
  // PRÉ-MESURE DU BLOC D'INFOS
  // ───────────────────────────────────────

  const metaItems = [date, time ? time.replace(':', 'h') : '', duration, lang].filter(Boolean);
  const chips = metaItems.length ? fitChips(ctx, metaItems, CONTENT_MAX_W) : null;

  let personalLines = [];
  const personal = (personalText || '').trim();

  if (personal) {
    ctx.font = `400 ${L.personalFont}px ${FONT_SERIF}`;
    personalLines = wrapText(ctx, personal, 860);

    if (personalLines.length > 2) {
      personalLines = personalLines.slice(0, 2);
      personalLines[1] = personalLines[1].replace(/[\s.,;:!?]*$/, '') + '…';
    }

    personalLines[0] = `«\u00A0${personalLines[0]}`;
    personalLines[personalLines.length - 1] += '\u00A0»';
  }

  const tagLayout = layoutTags(ctx, (whyTags || []).slice(0, MAX_TAGS));
  const hasWhy = tagLayout.rows.length > 0;
  const hasPersonal = personalLines.length > 0;

  const metaBlock = chips ? L.chipH + L.afterMeta : 0;

  const attenteBlock =
    L.eyebrowFont +
    L.afterEyebrow +
    L.labelLine +
    L.afterLabel +
    L.gaugeH +
    L.afterGauge;

  const whyBlock =
    hasWhy || hasPersonal
      ? L.beforeWhy +
        tagLayout.height +
        (hasWhy && hasPersonal ? L.afterPill : 0) +
        personalLines.length * L.personalLine
      : 0;

  const stack = metaBlock + attenteBlock + whyBlock;

  // ───────────────────────────────────────
  // BACKGROUND + POSTER
  // ───────────────────────────────────────

  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);

  let cy;

  if (isCinema) {
    const posterH = clamp(
      CONTENT_BOTTOM - POSTER_GAP - POSTER_TOP - stack,
      POSTER_MIN_H,
      POSTER_MAX_H
    );
    cy = drawCinemaPoster(ctx, posterImg, posterH, accentRgb, lightRgb);
  } else {
    cy = drawEditorialPoster(ctx, posterImg, CONTENT_BOTTOM - stack);
  }

  // si l'affiche est plafonnée / plus courte, on centre le bloc dans l'espace restant
  cy += Math.max(50, CONTENT_BOTTOM - (cy + stack)) / 2;

  // ───────────────────────────────────────
  // SÉANCE (date · heure · durée · langue)
  // ───────────────────────────────────────

  if (chips) {
    ctx.save();
    ctx.font = `600 ${chips.size}px ${FONT_SANS}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    let mx = (W - chips.total) / 2;

    metaItems.forEach((item, i) => {
      ctx.fillStyle = C.chipBg;
      roundRect(ctx, mx, cy, chips.widths[i], L.chipH, L.chipH / 2);
      ctx.fill();

      ctx.fillStyle = C.chipText;
      ctx.fillText(item, mx + chips.padX, cy + L.chipH / 2 + 1);

      mx += chips.widths[i] + L.chipGap;
    });

    ctx.restore();
    cy += L.chipH + L.afterMeta;
  }

  // ───────────────────────────────────────
  // ATTENTE
  // ───────────────────────────────────────

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  ctx.font = `700 ${L.eyebrowFont}px ${FONT_SANS}`;
  ctx.letterSpacing = '6px';
  ctx.fillStyle = C.eyebrow;
  ctx.fillText('MON ATTENTE', CX + 3, cy);
  ctx.letterSpacing = '0px';
  cy += L.eyebrowFont + L.afterEyebrow;

  const labelSize = fitFontSize(
    ctx,
    ex.label,
    (s) => `400 ${s}px ${FONT_LIGHTBOX}`,
    L.labelFont,
    CONTENT_MAX_W,
    56
  );

  ctx.font = `400 ${labelSize}px ${FONT_LIGHTBOX}`;
  ctx.fillStyle = C.label;

  if (isCinema) {
    ctx.shadowColor = `${exColor}66`;
    ctx.shadowBlur = 36;
  }

  ctx.fillText(ex.label, CX, cy + (L.labelFont - labelSize) / 2);

  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';
  cy += L.labelLine + L.afterLabel;

  // jauge en 5 segments
  const segW = (CONTENT_MAX_W - L.gaugeGap * 4) / 5;
  const gaugeX = (W - CONTENT_MAX_W) / 2;

  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i <= level ? exColor : C.gaugeOff;
    roundRect(ctx, gaugeX + i * (segW + L.gaugeGap), cy, segW, L.gaugeH, L.gaugeH / 2);
    ctx.fill();
  }

  cy += L.gaugeH + L.afterGauge;
  ctx.restore();

  // ───────────────────────────────────────
  // TAGS + PHRASE PERSO
  // ───────────────────────────────────────

  if (hasWhy || hasPersonal) {
    cy += L.beforeWhy;

    ctx.save();

    if (hasWhy) {
      ctx.font = `600 ${L.pillFont}px ${FONT_SANS}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';

      tagLayout.rows.forEach((row, r) => {
        let px = (W - row.total) / 2;
        const py = cy + r * (L.pillH + L.pillRowGap);

        row.items.forEach((item) => {
          ctx.fillStyle = C.pillBg;
          roundRect(ctx, px, py, item.w, L.pillH, L.pillH / 2);
          ctx.fill();

          if (C.pillStroke) {
            ctx.strokeStyle = C.pillStroke;
            ctx.lineWidth = 2;
            roundRect(ctx, px, py, item.w, L.pillH, L.pillH / 2);
            ctx.stroke();
          }

          ctx.fillStyle = C.pillText;
          ctx.fillText(item.text, px + L.pillPadX, py + L.pillH / 2 + 1);

          px += item.w + L.pillGap;
        });
      });

      cy += tagLayout.height + (hasPersonal ? L.afterPill : 0);
    }

    if (hasPersonal) {
      ctx.font = `400 ${L.personalFont}px ${FONT_SERIF}`;
      ctx.fillStyle = C.personal;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      personalLines.forEach((line, i) => {
        ctx.fillText(line, CX, cy + i * L.personalLine);
      });

      cy += personalLines.length * L.personalLine;
    }

    ctx.restore();
  }

  // ───────────────────────────────────────
  // FOOTER
  // ───────────────────────────────────────

  ctx.save();
  ctx.font = `600 26px ${FONT_SANS}`;
  ctx.letterSpacing = '4px';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = C.footer;
  ctx.fillText(`AVANT-SÉANCE  ·  ${String(screeningLabel).toUpperCase()}`, CX + 2, 1868);
  ctx.restore();

  if (isCinema) {
    const lineY = 1834;
    const line = ctx.createLinearGradient(300, lineY, 780, lineY);
    line.addColorStop(0, 'rgba(255,255,255,0)');
    line.addColorStop(0.5, `rgba(${lightRgb},0.75)`);
    line.addColorStop(1, 'rgba(255,255,255,0)');

    ctx.fillStyle = line;
    ctx.fillRect(300, lineY, 480, 1);
  }

  return canvas;
}


// ─────────────────────────────────────────────────────────────────────────────
// UI HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const INPUT_CLASS =
  'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-outfit text-sm text-white placeholder:text-white/20 outline-none focus:border-[#E8B200]/50 transition-colors';

const LABEL_CLASS =
  'font-outfit text-[9px] font-semibold text-white/30 uppercase tracking-widest block mb-1.5';

const CARD_CLASS = 'bg-[#141418] border border-white/8 rounded-2xl p-5';

const CARD_TITLE_CLASS =
  'font-outfit text-[10px] font-bold tracking-widest uppercase text-white/30';

function Field({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className={LABEL_CLASS}>{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={INPUT_CLASS}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function SeanceStoryTool({ historyData = [], onBack, pendingFilm }) {
  const [title, setTitle] = useState(pendingFilm?.titre || '');
  const [date, setDate] = useState(pendingFilm?.date || new Date().toLocaleDateString('fr-FR'));
  const [time, setTime] = useState(pendingFilm?.heure ? pendingFilm.heure.replace('h', ':') : '20:00');
  const [lang, setLang] = useState(pendingFilm?.langue || 'VOSTFR');
  const [duration, setDuration] = useState(pendingFilm?.duree || '');
  const [expectation, setExpectation] = useState(2);
  const [styleMode, setStyleMode] = useState('cinema');
  const [whyTags, setWhyTags] = useState([]);
  const [personalText, setPersonalText] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [posterImg, setPosterImg] = useState(null);
  const [posterLoading, setPosterLoading] = useState(false);
  const [previewScale, setPreviewScale] = useState(0.3);

  const previewRef = useRef(null);
  const wrapperRef = useRef(null);
  const fileInputRef = useRef(null);
  const paramsRef = useRef({});
  const blobUrlsRef = useRef([]);

  // ───────────────────────────────────────
  // SCREENING NUMBER
  // ───────────────────────────────────────

  const extractYear = (value) => {
    if (!value) return String(new Date().getFullYear());
    const match = String(value).match(/(20\d{2})/);
    return match ? match[1] : String(new Date().getFullYear());
  };

  const currentYear = extractYear(date);

  const yearlyScreeningNumber =
    (historyData || []).filter((film) => extractYear(film?.date) === currentYear).length + 1;

  const screeningLabel = `${currentYear} — Séance #${String(yearlyScreeningNumber).padStart(3, '0')}`;

  // ───────────────────────────────────────
  // LOAD POSTER
  // ───────────────────────────────────────

  useEffect(() => {
    if (!pendingFilm?.affiche) {
      setPosterImg(null);
      return;
    }

    let cancelled = false;
    setPosterLoading(true);

    loadImageForCanvas(pendingFilm.affiche).then((img) => {
      if (cancelled) return;

      if (img?.src?.startsWith('blob:')) {
        blobUrlsRef.current.push(img.src);
      }

      setPosterImg(img);
      setPosterLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [pendingFilm?.affiche]);

  // ───────────────────────────────────────
  // CLEAN BLOB URLS
  // ───────────────────────────────────────

  useEffect(() => {
    return () => {
      blobUrlsRef.current.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch (_) {}
      });
    };
  }, []);

  // ───────────────────────────────────────
  // CURRENT PARAMS
  // ───────────────────────────────────────

  paramsRef.current = {
    title,
    date,
    time,
    lang,
    duration,
    expectation,
    posterImg,
    screeningLabel,
    styleMode,
    whyTags,
    personalText,
  };

  // ───────────────────────────────────────
  // PREVIEW RENDER
  // ───────────────────────────────────────

  useEffect(() => {
    if (!previewRef.current) return;
    renderStoryToCanvas(previewRef.current, paramsRef.current);
  }, [
    title,
    date,
    time,
    lang,
    duration,
    expectation,
    posterImg,
    screeningLabel,
    styleMode,
    whyTags,
    personalText,
  ]);

  const assignPreviewRef = useCallback((node) => {
    previewRef.current = node;
    if (node) {
      requestAnimationFrame(() => {
        renderStoryToCanvas(node, paramsRef.current);
      });
    }
  }, []);

  // ───────────────────────────────────────
  // PREVIEW SCALE
  // ───────────────────────────────────────

  useEffect(() => {
    const update = () => {
      if (!wrapperRef.current) return;
      setPreviewScale(wrapperRef.current.offsetWidth / 1080);
    };

    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // ───────────────────────────────────────
  // MANUAL IMAGE UPLOAD
  // ───────────────────────────────────────

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setPosterLoading(true);

    const objectUrl = URL.createObjectURL(file);
    blobUrlsRef.current.push(objectUrl);

    try {
      const img = await loadImgElement(objectUrl);
      setPosterImg(img);
    } catch (_) {
      alert('Impossible de charger cette image.');
    } finally {
      setPosterLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ───────────────────────────────────────
  // DOWNLOAD / SHARE
  // ───────────────────────────────────────

  const downloadStory = useCallback(async () => {
    if (isDownloading) return;

    setIsDownloading(true);

    try {
      const exportCanvas = document.createElement('canvas');
      await renderStoryToCanvas(exportCanvas, paramsRef.current);

      exportCanvas.toBlob(async (blob) => {
        if (!blob) {
          alert('Erreur de génération.');
          setIsDownloading(false);
          return;
        }

        const file = new File([blob], `seance_${yearlyScreeningNumber}.png`, {
          type: 'image/png',
        });

        if (navigator.canShare?.({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: `Séance #${yearlyScreeningNumber} — ${paramsRef.current.title}`,
            });
          } catch (error) {
            if (error.name !== 'AbortError') console.error(error);
          }
        } else {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `story_seance_${yearlyScreeningNumber}.png`;
          link.click();
          setTimeout(() => URL.revokeObjectURL(url), 5000);
        }

        setIsDownloading(false);
      }, 'image/png');
    } catch (error) {
      console.error(error);
      alert('Erreur inattendue. Réessaie.');
      setIsDownloading(false);
    }
  }, [isDownloading, yearlyScreeningNumber]);

  // ───────────────────────────────────────
  // UI
  // ───────────────────────────────────────

  const toggleTag = (option) => {
    setWhyTags((prev) => {
      if (prev.includes(option)) return prev.filter((t) => t !== option);
      if (prev.length >= MAX_TAGS) return prev;
      return [...prev, option];
    });
  };

  const shareDisabled = isDownloading || !title.trim();

  return (
    <div className="animate-in fade-in pb-24 flex flex-col min-h-screen bg-[#0C0C0E] overflow-x-hidden">
      {/* HEADER */}
      <header className="z-40 sticky top-0 w-full bg-[#0C0C0E]/90 backdrop-blur-xl border-b border-white/10 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 px-6 flex justify-between items-center text-white">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center active:scale-95 transition-transform"
        >
          <ChevronLeft size={20} strokeWidth={2.5} />
        </button>

        <h2 className="font-galinoy italic text-xl tracking-tight">Story Séance</h2>

        <div className="w-10" />
      </header>

      <div className="px-5 py-6 flex flex-col gap-5">
        {/* PREVIEW */}
        <div
          ref={wrapperRef}
          className="w-full relative bg-black rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl"
          style={{ aspectRatio: '9 / 16' }}
        >
          {posterLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/60 rounded-[2rem]">
              <div className="w-8 h-8 border-2 border-[#E8B200] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          <canvas
            ref={assignPreviewRef}
            width={1080}
            height={1920}
            className="absolute top-0 left-0 origin-top-left"
            style={{
              width: '1080px',
              height: '1920px',
              transform: `scale(${previewScale})`,
            }}
          />
        </div>

        {/* STYLE */}
        <div className={CARD_CLASS}>
          <div className={`${CARD_TITLE_CLASS} mb-3`}>Direction artistique</div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setStyleMode('editorial')}
              className={`rounded-xl px-3 py-3 text-left transition-all border ${
                styleMode === 'editorial'
                  ? 'bg-white/10 border-white/20 text-white'
                  : 'bg-white/[0.03] border-white/5 text-white/35'
              }`}
            >
              <div className="font-outfit text-[11px] font-bold">Éditorial</div>
              <div className="font-outfit text-[9px] mt-1 text-white/30">Magazine cinéma</div>
            </button>

            <button
              type="button"
              onClick={() => setStyleMode('cinema')}
              className={`rounded-xl px-3 py-3 text-left transition-all border ${
                styleMode === 'cinema'
                  ? 'bg-white/10 border-[#E8B200]/40 text-white'
                  : 'bg-white/[0.03] border-white/5 text-white/35'
              }`}
            >
              <div className="font-outfit text-[11px] font-bold">Cinéma</div>
              <div className="font-outfit text-[9px] mt-1 text-white/30">Immersif & texturé</div>
            </button>
          </div>
        </div>

        {/* HYPE */}
        <div className={CARD_CLASS}>
          <div className={`${CARD_TITLE_CLASS} mb-4`}>Mon niveau d'attente</div>

          <div className="flex gap-2 mb-4">
            {EXPECTATIONS.map((exp, index) => (
              <button
                key={exp.label}
                type="button"
                onClick={() => setExpectation(index)}
                className="flex-1 flex flex-col items-center gap-2 group transition-all active:scale-95"
              >
                <div
                  className="w-full h-1.5 rounded-full transition-all"
                  style={{
                    background: index <= expectation ? exp.barHex : 'rgba(255,255,255,0.08)',
                  }}
                />
                <span
                  className="font-outfit text-[8px] font-semibold transition-all"
                  style={{
                    color: index === expectation ? exp.barHex : 'rgba(255,255,255,0.2)',
                  }}
                >
                  {exp.label}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span
              className="font-outfit font-bold text-sm"
              style={{ color: EXPECTATIONS[expectation].barHex }}
            >
              {EXPECTATIONS[expectation].label}
            </span>
            <span className="text-white/20">·</span>
            <span className="font-outfit text-xs text-white/35 italic">
              {EXPECTATIONS[expectation].sub}
            </span>
          </div>
        </div>

        {/* WHY FILM */}
        <div className={CARD_CLASS}>
          <div className={`${CARD_TITLE_CLASS} mb-4 flex justify-between`}>
            <span>Pourquoi ce film ?</span>
            <span className="text-white/20">
              {whyTags.length}/{MAX_TAGS}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {WHY_OPTIONS.map((option) => {
              const selected = whyTags.includes(option);
              const locked = !selected && whyTags.length >= MAX_TAGS;

              return (
                <button
                  key={option}
                  type="button"
                  disabled={locked}
                  onClick={() => toggleTag(option)}
                  className={`rounded-full px-3 py-2 font-outfit text-[10px] font-semibold border transition-all active:scale-95 ${
                    selected
                      ? 'bg-[#E8B200] border-[#E8B200] text-[#111]'
                      : 'bg-white/5 border-white/10 text-white/45'
                  } ${locked ? 'opacity-30' : ''}`}
                >
                  {option}
                </button>
              );
            })}
          </div>

          <div className="relative mt-4">
            <textarea
              value={personalText}
              onChange={(e) => setPersonalText(e.target.value)}
              maxLength={PERSONAL_MAX}
              rows={2}
              placeholder="Une petite phrase personnelle…"
              className="w-full resize-none bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-outfit text-sm text-white placeholder:text-white/20 outline-none focus:border-[#E8B200]/50 transition-colors"
            />
            <span className="absolute bottom-2 right-3 font-outfit text-[9px] text-white/25">
              {personalText.length}/{PERSONAL_MAX}
            </span>
          </div>
        </div>

        {/* SESSION INFOS */}
        <div className={`${CARD_CLASS} flex flex-col gap-4`}>
          <div className={CARD_TITLE_CLASS}>Infos séance</div>

          <Field label="Titre" value={title} onChange={setTitle} placeholder="Titre du film…" />

          <div className="grid grid-cols-2 gap-3">
            <Field label="Date" value={date} onChange={setDate} placeholder="JJ/MM/AAAA" />
            <Field label="Heure" value={time} onChange={setTime} placeholder="20:00" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Durée" value={duration} onChange={setDuration} placeholder="2h08" />
            <Field label="Langue" value={lang} onChange={setLang} placeholder="VOSTFR" />
          </div>
        </div>

        {/* POSTER MANUAL */}
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageUpload}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-12 rounded-2xl bg-white/5 text-white/60 font-outfit font-semibold text-xs flex items-center justify-center gap-2.5 active:scale-95 transition-all border border-white/8 hover:bg-white/8"
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          Changer l'affiche manuellement
        </button>

        {/* SHARE */}
        <button
          type="button"
          onClick={downloadStory}
          disabled={shareDisabled}
          className={`w-full h-14 rounded-2xl flex items-center justify-center gap-2.5 font-outfit font-extrabold text-sm transition-all ${
            shareDisabled
              ? 'bg-[#E8B200]/40 text-black/40 cursor-wait'
              : 'bg-[#E8B200] text-[#0A0A0A] shadow-[0_4px_24px_rgba(232,178,0,0.28)] active:scale-95'
          }`}
        >
          {isDownloading ? (
            <div className="w-5 h-5 border-2 border-black/30 border-t-black animate-spin rounded-full" />
          ) : (
            <>
              <svg
                className="w-[18px] h-[18px]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
              Partager la Story
            </>
          )}
        </button>
      </div>
    </div>
  );
}