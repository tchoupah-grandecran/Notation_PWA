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
    const resp = await fetch(originalUrl, {
      mode: 'cors',
      cache: 'force-cache',
    });

    if (resp.ok) {
      const blob = await resp.blob();
      return loadImgElement(URL.createObjectURL(blob));
    }
  } catch (_) {}

  const proxyBase = import.meta.env.DEV
    ? '/tmdb-proxy'
    : '/api/proxy-image';

  try {
    const resp = await fetch(
      `${proxyBase}?url=${encodeURIComponent(originalUrl)}`,
      { cache: 'force-cache' }
    );

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

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function wrapText(ctx, text, maxWidth) {
  if (!text) return [];

  const words = String(text).split(/\s+/);
  const lines = [];
  let current = '';

  for (const word of words) {
    const test = current
      ? `${current} ${word}`
      : word;

    if (
      ctx.measureText(test).width > maxWidth &&
      current
    ) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }

  if (current) lines.push(current);

  return lines;
}

/**
 * Contient l'image dans une zone sans jamais la recadrer.
 */
function getContainRect(img, x, y, w, h) {
  if (!img?.naturalWidth || !img?.naturalHeight) {
    return { x, y, w, h };
  }

  const imageRatio =
    img.naturalWidth / img.naturalHeight;

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

function drawImageContain(
  ctx,
  img,
  x,
  y,
  w,
  h
) {
  if (!img) return null;

  const rect = getContainRect(
    img,
    x,
    y,
    w,
    h
  );

  ctx.drawImage(
    img,
    rect.x,
    rect.y,
    rect.w,
    rect.h
  );

  return rect;
}

// ─────────────────────────────────────────────────────────────────────────────
// ACCENT COLOR
// ─────────────────────────────────────────────────────────────────────────────

function getPosterAccent(img) {
  if (!img?.naturalWidth || !img?.naturalHeight) {
    return {
      r: 232,
      g: 178,
      b: 0,
    };
  }

  try {
    const sampleCanvas =
      document.createElement('canvas');

    const size = 40;

    sampleCanvas.width = size;
    sampleCanvas.height = size;

    const sampleCtx =
      sampleCanvas.getContext('2d');

    sampleCtx.drawImage(
      img,
      0,
      0,
      size,
      size
    );

    const data = sampleCtx.getImageData(
      0,
      0,
      size,
      size
    ).data;

    let r = 0;
    let g = 0;
    let b = 0;
    let count = 0;

    for (let i = 0; i < data.length; i += 4) {
      const rr = data[i];
      const gg = data[i + 1];
      const bb = data[i + 2];

      const brightness =
        (rr + gg + bb) / 3;

      if (brightness > 245) continue;

      r += rr;
      g += gg;
      b += bb;
      count++;
    }

    if (!count) {
      return {
        r: 232,
        g: 178,
        b: 0,
      };
    }

    return {
      r: Math.round(r / count),
      g: Math.round(g / count),
      b: Math.round(b / count),
    };
  } catch (_) {
    return {
      r: 232,
      g: 178,
      b: 0,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CINEMA TEXTURE
// ─────────────────────────────────────────────────────────────────────────────

function drawFilmGrain(
  ctx,
  x,
  y,
  w,
  h,
  intensity = 0.055
) {
  const amount = Math.floor(
    w * h * 0.00013
  );

  ctx.save();

  for (let i = 0; i < amount; i++) {
    const px =
      x + Math.random() * w;

    const py =
      y + Math.random() * h;

    const alpha =
      Math.random() * intensity;

    ctx.fillStyle =
      `rgba(255,255,255,${alpha})`;

    ctx.fillRect(
      px,
      py,
      Math.random() > 0.92 ? 2 : 1,
      Math.random() > 0.92 ? 2 : 1
    );
  }

  ctx.restore();
}

function drawDust(
  ctx,
  x,
  y,
  w,
  h
) {
  ctx.save();

  const count = 70;

  for (let i = 0; i < count; i++) {
    const px =
      x + Math.random() * w;

    const py =
      y + Math.random() * h;

    const radius =
      Math.random() * 1.8 + 0.4;

    const opacity =
      Math.random() * 0.12;

    ctx.fillStyle =
      `rgba(255,255,255,${opacity})`;

    ctx.beginPath();
    ctx.arc(
      px,
      py,
      radius,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  ctx.restore();
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPECTATIONS
// ─────────────────────────────────────────────────────────────────────────────

const EXPECTATIONS = [
  {
    label: 'RÉSERVÉ',
    sub: 'J’attends de voir.',
    barHex: '#A3A3A3',
  },
  {
    label: 'CURIEUX',
    sub: 'Ça m’intrigue.',
    barHex: '#93C5FD',
  },
  {
    label: 'ATTENTIF',
    sub: 'J’ai envie de le découvrir.',
    barHex: '#C084FC',
  },
  {
    label: 'TRÈS ATTENDU',
    sub: 'J’ai vraiment hâte.',
    barHex: '#FB923C',
  },
  {
    label: 'ÉVÉNEMENT',
    sub: 'Impossible de passer à côté.',
    barHex: '#E8B200',
  },
];

const FONT_SANS =
  '"DM Sans", sans-serif';

const FONT_SERIF =
  '"Instrument Serif", Georgia, serif';

const FONT_LIGHTBOX =
  '"Limelight", serif';

// ─────────────────────────────────────────────────────────────────────────────
// WHY OPTIONS
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// STORY RENDERER
// ─────────────────────────────────────────────────────────────────────────────

async function renderStoryToCanvas(
  canvas,
  params
) {
  await ensureFontsLoaded();

  const {
    title,
    date,
    time,
    lang,
    duration,
    expectation,
    posterImg,
    screeningLabel,
    styleMode,
    whyFilm,
    personalText,
  } = params;

  const ctx =
    canvas.getContext('2d');

  canvas.width = 1080;
  canvas.height = 1920;

  const isCinema =
    styleMode === 'cinema';

  const accent =
    getPosterAccent(posterImg);

  const accentRgb =
    `${accent.r}, ${accent.g}, ${accent.b}`;

  // ───────────────────────────────────────
  // BACKGROUND
  // ───────────────────────────────────────

  ctx.fillStyle = isCinema
    ? '#070707'
    : '#F3EFE8';

  ctx.fillRect(
    0,
    0,
    1080,
    1920
  );

  // ───────────────────────────────────────
  // POSTER AREA
  // ───────────────────────────────────────

  const POSTER_BOX_X =
    isCinema ? 42 : 50;

  const POSTER_BOX_Y =
    isCinema ? 72 : 70;

  const POSTER_BOX_W =
    isCinema ? 996 : 980;

  // Environ 70 % de la Story.
  const POSTER_BOX_H =
    isCinema ? 1335 : 1305;

  // ───────────────────────────────────────
  // CINEMA AMBIENT LIGHT
  // ───────────────────────────────────────

  if (
    isCinema &&
    posterImg
  ) {
    const glow =
      ctx.createRadialGradient(
        540,
        POSTER_BOX_Y +
          POSTER_BOX_H / 2,
        50,
        540,
        POSTER_BOX_Y +
          POSTER_BOX_H / 2,
        850
      );

    glow.addColorStop(
      0,
      `rgba(${accentRgb},0.18)`
    );

    glow.addColorStop(
      0.45,
      `rgba(${accentRgb},0.06)`
    );

    glow.addColorStop(
      1,
      'rgba(0,0,0,0)'
    );

    ctx.fillStyle = glow;

    ctx.fillRect(
      0,
      POSTER_BOX_Y - 100,
      1080,
      POSTER_BOX_H + 200
    );
  }

  // ───────────────────────────────────────
  // POSTER BACKDROP
  // ───────────────────────────────────────

  if (posterImg) {
    ctx.save();

    if (isCinema) {
      ctx.shadowColor =
        `rgba(${accentRgb},0.22)`;

      ctx.shadowBlur = 60;
    }

    ctx.fillStyle =
      isCinema
        ? `rgba(${accentRgb},0.07)`
        : 'rgba(0,0,0,0.035)';

    roundRect(
      ctx,
      POSTER_BOX_X,
      POSTER_BOX_Y,
      POSTER_BOX_W,
      POSTER_BOX_H,
      isCinema ? 3 : 0
    );

    ctx.fill();

    ctx.restore();
  }

  // ───────────────────────────────────────
  // POSTER
  // ───────────────────────────────────────

  let posterRect = null;

  if (posterImg) {
    posterRect =
      drawImageContain(
        ctx,
        posterImg,
        POSTER_BOX_X,
        POSTER_BOX_Y,
        POSTER_BOX_W,
        POSTER_BOX_H
      );
  }

  // ───────────────────────────────────────
  // POSTER FRAME
  // ───────────────────────────────────────

  if (posterRect) {
    ctx.save();

    if (isCinema) {
      ctx.strokeStyle =
        `rgba(${accentRgb},0.65)`;

      ctx.lineWidth = 3;

      ctx.shadowColor =
        `rgba(${accentRgb},0.45)`;

      ctx.shadowBlur = 18;
    } else {
      ctx.strokeStyle =
        'rgba(25,25,25,0.12)';

      ctx.lineWidth = 2;
    }

    ctx.strokeRect(
      posterRect.x,
      posterRect.y,
      posterRect.w,
      posterRect.h
    );

    ctx.restore();

    // Deuxième filet cinéma
    if (isCinema) {
      ctx.save();

      ctx.strokeStyle =
        'rgba(255,255,255,0.22)';

      ctx.lineWidth = 1;

      ctx.strokeRect(
        posterRect.x - 7,
        posterRect.y - 7,
        posterRect.w + 14,
        posterRect.h + 14
      );

      ctx.restore();
    }

    // Grain uniquement sur la surface de l'affiche
    if (isCinema) {
      drawFilmGrain(
        ctx,
        posterRect.x,
        posterRect.y,
        posterRect.w,
        posterRect.h,
        0.065
      );

      drawDust(
        ctx,
        posterRect.x,
        posterRect.y,
        posterRect.w,
        posterRect.h
      );
    }
  } else {
    // Placeholder si aucune affiche
    ctx.save();

    ctx.fillStyle =
      isCinema
        ? '#111'
        : '#E5E0D8';

    ctx.fillRect(
      POSTER_BOX_X,
      POSTER_BOX_Y,
      POSTER_BOX_W,
      POSTER_BOX_H
    );

    ctx.font =
      `400 42px ${FONT_SERIF}`;

    ctx.fillStyle =
      isCinema
        ? 'rgba(255,255,255,0.3)'
        : 'rgba(0,0,0,0.25)';

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillText(
      'Votre affiche',
      540,
      POSTER_BOX_Y +
        POSTER_BOX_H / 2
    );

    ctx.restore();
  }

  // ───────────────────────────────────────
  // CINEMA CROP MARKS
  // ───────────────────────────────────────

  if (
    isCinema &&
    posterRect
  ) {
    const mark = 24;

    ctx.save();

    ctx.strokeStyle =
      `rgba(${accentRgb},0.65)`;

    ctx.lineWidth = 2;

    // haut gauche
    ctx.beginPath();
    ctx.moveTo(
      posterRect.x - mark,
      posterRect.y
    );
    ctx.lineTo(
      posterRect.x - 6,
      posterRect.y
    );

    ctx.moveTo(
      posterRect.x,
      posterRect.y - mark
    );
    ctx.lineTo(
      posterRect.x,
      posterRect.y - 6
    );

    // haut droit
    ctx.moveTo(
      posterRect.x +
        posterRect.w +
        6,
      posterRect.y
    );
    ctx.lineTo(
      posterRect.x +
        posterRect.w +
        mark,
      posterRect.y
    );

    ctx.moveTo(
      posterRect.x +
        posterRect.w,
      posterRect.y - mark
    );
    ctx.lineTo(
      posterRect.x +
        posterRect.w,
      posterRect.y - 6
    );

    // bas gauche
    ctx.moveTo(
      posterRect.x - mark,
      posterRect.y +
        posterRect.h
    );
    ctx.lineTo(
      posterRect.x - 6,
      posterRect.y +
        posterRect.h
    );

    ctx.moveTo(
      posterRect.x,
      posterRect.y +
        posterRect.h +
        6
    );
    ctx.lineTo(
      posterRect.x,
      posterRect.y +
        posterRect.h +
        mark
    );

    // bas droit
    ctx.moveTo(
      posterRect.x +
        posterRect.w +
        6,
      posterRect.y +
        posterRect.h
    );
    ctx.lineTo(
      posterRect.x +
        posterRect.w +
        mark,
      posterRect.y +
        posterRect.h
    );

    ctx.moveTo(
      posterRect.x +
        posterRect.w,
      posterRect.y +
        posterRect.h +
        6
    );
    ctx.lineTo(
      posterRect.x +
        posterRect.w,
      posterRect.y +
        posterRect.h +
        mark
    );

    ctx.stroke();
    ctx.restore();
  }

  // ───────────────────────────────────────
  // TOP MICRO LABEL
  // ───────────────────────────────────────

  ctx.save();

  ctx.font =
    `600 17px ${FONT_SANS}`;

  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';

  ctx.fillStyle = isCinema
    ? 'rgba(255,255,255,0.72)'
    : 'rgba(25,25,25,0.62)';

  ctx.fillText(
    'AVANT-SÉANCE',
    48,
    36
  );

  ctx.textAlign = 'right';

  ctx.font =
    `500 16px ${FONT_SANS}`;

  ctx.fillStyle = isCinema
    ? 'rgba(255,255,255,0.45)'
    : 'rgba(25,25,25,0.42)';

  ctx.fillText(
    screeningLabel,
    1032,
    36
  );

  ctx.restore();

  // ───────────────────────────────────────
  // VERTICAL CINEMA MARK
  // ───────────────────────────────────────

  if (
    isCinema &&
    posterRect
  ) {
    ctx.save();

    ctx.translate(
      Math.max(
        20,
        posterRect.x - 30
      ),
      posterRect.y +
        posterRect.h / 2
    );

    ctx.rotate(
      -Math.PI / 2
    );

    ctx.font =
      `600 14px ${FONT_SANS}`;

    ctx.letterSpacing = '3px';

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle =
      `rgba(${accentRgb},0.75)`;

    ctx.fillText(
      'AVANT-SÉANCE',
      0,
      0
    );

    ctx.restore();
  }

  // ───────────────────────────────────────
  // CONTENT START
  // ───────────────────────────────────────

  const posterBottom =
    posterRect
      ? posterRect.y + posterRect.h
      : POSTER_BOX_Y +
        POSTER_BOX_H;

  let cy =
    Math.min(
      posterBottom + 30,
      1435
    );

  // ───────────────────────────────────────
  // SESSION META
  // ───────────────────────────────────────

  const metaItems = [
    date,
    time
      ? time.replace(':', 'h')
      : '',
    duration,
    lang,
  ].filter(Boolean);

  if (metaItems.length) {
    ctx.save();

    ctx.font =
      `600 17px ${FONT_SANS}`;

    ctx.textBaseline =
      'middle';

    ctx.textAlign =
      'left';

    let totalWidth = 0;

    const itemWidths =
      metaItems.map((item) => {
        const width =
          ctx.measureText(item).width + 28;

        totalWidth += width;

        return width;
      });

    totalWidth +=
      (metaItems.length - 1) * 10;

    let mx =
      (1080 - totalWidth) / 2;

    for (
      let i = 0;
      i < metaItems.length;
      i++
    ) {
      const item =
        metaItems[i];

      const width =
        itemWidths[i];

      if (isCinema) {
        ctx.fillStyle =
          'rgba(255,255,255,0.08)';

        roundRect(
          ctx,
          mx,
          cy,
          width,
          36,
          18
        );

        ctx.fill();

        ctx.fillStyle =
          'rgba(255,255,255,0.72)';
      } else {
        ctx.fillStyle =
          'rgba(25,25,25,0.07)';

        roundRect(
          ctx,
          mx,
          cy,
          width,
          36,
          18
        );

        ctx.fill();

        ctx.fillStyle =
          'rgba(25,25,25,0.6)';
      }

      ctx.fillText(
        item,
        mx + 14,
        cy + 18
      );

      mx +=
        width + 10;
    }

    ctx.restore();

    cy += 52;
  }

  // ───────────────────────────────────────
  // EXPECTATION
  // ───────────────────────────────────────

  const expectationData =
    EXPECTATIONS[
      Math.max(
        0,
        Math.min(
          4,
          expectation
        )
      )
    ];

  const expectationColor =
    expectationData.barHex;

  ctx.save();

  ctx.textAlign =
    'center';

  ctx.textBaseline =
    'top';

  ctx.font =
    `600 15px ${FONT_SANS}`;

  ctx.fillStyle =
    isCinema
      ? 'rgba(255,255,255,0.38)'
      : 'rgba(25,25,25,0.38)';

  ctx.fillText(
    'MON ATTENTE',
    540,
    cy
  );

  cy += 25;

  // Limelight
  ctx.font =
    `400 70px ${FONT_LIGHTBOX}`;

  ctx.fillStyle =
    isCinema
      ? expectationColor
      : '#181818';

  ctx.fillText(
    expectationData.label,
    540,
    cy
  );

  cy += 86;

  // petite jauge
  const gaugeW = 910;
  const gaugeH = 10;
  const gaugeX =
    (1080 - gaugeW) / 2;

  ctx.fillStyle =
    isCinema
      ? 'rgba(255,255,255,0.10)'
      : 'rgba(25,25,25,0.10)';

  roundRect(
    ctx,
    gaugeX,
    cy,
    gaugeW,
    gaugeH,
    3
  );

  ctx.fill();

  ctx.fillStyle =
    expectationColor;

  roundRect(
    ctx,
    gaugeX,
    cy,
    gaugeW *
      ((expectation + 1) / 5),
    gaugeH,
    3
  );

  ctx.fill();

  cy += 17;

  ctx.font =
    `500 35px ${FONT_SERIF}`;

  ctx.fillStyle =
    isCinema
      ? 'rgba(255,255,255,0.58)'
      : 'rgba(25,25,25,0.55)';

  ctx.fillText(
    expectationData.sub,
    540,
    cy
  );

  ctx.restore();

  cy += 74;

// ───────────────────────────────────────
  // WHY FILM
  // ───────────────────────────────────────

  if (
    whyFilm ||
    personalText
  ) {
    ctx.save();

    ctx.textAlign =
      'center';

    ctx.textBaseline =
      'top';

    ctx.font =
      `600 20px ${FONT_SANS}`;

    ctx.fillStyle =
      isCinema
        ? `rgba(${accentRgb},0.82)`
        : 'rgba(25,25,25,0.42)';

    ctx.fillText(
      'POURQUOI CE FILM ?',
      540,
      cy
    );

    // 1. Écart sous le titre "POURQUOI CE FILM ?" (Passe de 22 à 32)
    cy += 35;

    if (whyFilm) {
      ctx.font =
        `600 30px ${FONT_SANS}`;

      const pillWidth =
        ctx.measureText(
          whyFilm
        ).width + 40;

      const pillX =
        (1080 - pillWidth) / 2;

      ctx.fillStyle =
        isCinema
          ? `rgba(${accentRgb},0.13)`
          : 'rgba(25,25,25,0.07)';

      // 1. Définir la nouvelle hauteur de la gélule
      const pillHeight = 50; // Augmenté de 32 à 50
      const borderRadius = pillHeight / 2; // 25 pour garder les bords bien arrondis

      roundRect(
        ctx,
        pillX,
        cy,
        pillWidth,
        pillHeight,  // Hauteur modifiée
        borderRadius // Rayon modifié
      );

      ctx.fill();

      ctx.fillStyle =
        isCinema
          ? `rgba(${accentRgb},0.95)`
          : 'rgba(25,25,25,0.7)';

      ctx.textBaseline =
        'middle';

      // 2. Centrer le texte verticalement au milieu de la nouvelle hauteur
      ctx.fillText(
        whyFilm,
        540,
        cy + (pillHeight / 2) // Décalage dynamique (25px au lieu de 16px)
      );

      // 3. Ne pas oublier de prendre en compte la nouvelle hauteur pour l'écart suivant
      cy += pillHeight + 44; // Ex: 50px de hauteur + 24px d'espace sous la gélule (= 74px au total)
    }

    if (personalText) {
      ctx.font =
        `400 50px ${FONT_SERIF}`;

      ctx.fillStyle =
        isCinema
          ? 'rgba(255,255,255,0.72)'
          : 'rgba(25,25,25,0.66)';

      const personalLines =
        wrapText(
          ctx,
          personalText,
          760
        ).slice(0, 2);

      // 3. Interligne augmenté (Passe de 25 à 30)
      const lineHeight = 30;

      personalLines.forEach(
        (line, index) => {
          ctx.fillText(
            line,
            540,
            cy +
              index * lineHeight
          );
        }
      );

      cy +=
        personalLines.length *
          lineHeight;
    }

    ctx.restore();
  }

  // ───────────────────────────────────────
  // FOOTER
  // ───────────────────────────────────────

  ctx.save();

  ctx.font =
    `500 13px ${FONT_SANS}`;

  ctx.textAlign =
    'center';

  ctx.textBaseline =
    'middle';

  ctx.fillStyle =
    isCinema
      ? 'rgba(255,255,255,0.28)'
      : 'rgba(25,25,25,0.28)';

  ctx.fillText(
    screeningLabel,
    540,
    1882
  );

  ctx.restore();

  // ───────────────────────────────────────
  // CINEMA LIGHT LINE
  // ───────────────────────────────────────

  if (isCinema) {
    const lineY = 1852;

    const line =
      ctx.createLinearGradient(
        300,
        lineY,
        780,
        lineY
      );

    line.addColorStop(
      0,
      'rgba(255,255,255,0)'
    );

    line.addColorStop(
      0.5,
      `rgba(${accentRgb},0.75)`
    );

    line.addColorStop(
      1,
      'rgba(255,255,255,0)'
    );

    ctx.fillStyle = line;

    ctx.fillRect(
      300,
      lineY,
      480,
      1
    );
  }

  return canvas;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function SeanceStoryTool({
  historyData = [],
  onBack,
  pendingFilm,
}) {
  const [title, setTitle] =
    useState(
      pendingFilm?.titre || ''
    );

  const [date, setDate] =
    useState(
      pendingFilm?.date ||
        new Date().toLocaleDateString(
          'fr-FR'
        )
    );

  const [time, setTime] =
    useState(
      pendingFilm?.heure
        ? pendingFilm.heure.replace(
            'h',
            ':'
          )
        : '20:00'
    );

  const [lang, setLang] =
    useState(
      pendingFilm?.langue ||
        'VOSTFR'
    );

  const [duration, setDuration] =
    useState(
      pendingFilm?.duree || ''
    );

  const [expectation, setExpectation] =
    useState(2);

  const [styleMode, setStyleMode] =
    useState('cinema');

  const [whyFilm, setWhyFilm] =
    useState('');

  const [personalText, setPersonalText] =
    useState('');

  const [isDownloading, setIsDownloading] =
    useState(false);

  const [posterImg, setPosterImg] =
    useState(null);

  const [posterLoading, setPosterLoading] =
    useState(false);

  const [previewScale, setPreviewScale] =
    useState(0.3);

  const previewRef =
    useRef(null);

  const wrapperRef =
    useRef(null);

  const fileInputRef =
    useRef(null);

  const paramsRef =
    useRef({});

  const blobUrlsRef =
    useRef([]);

  // ───────────────────────────────────────
  // SCREENING NUMBER
  // ───────────────────────────────────────

  const extractYear = (value) => {
    if (!value) {
      return String(
        new Date().getFullYear()
      );
    }

    const match =
      String(value).match(
        /(20\d{2})/
      );

    return match
      ? match[1]
      : String(
          new Date().getFullYear()
        );
  };

  const currentYear =
    extractYear(date);

  const yearlyScreeningNumber =
    (historyData || []).filter(
      (film) =>
        extractYear(film?.date) ===
        currentYear
    ).length + 1;

  const screeningLabel =
    `${currentYear} — Séance #${String(
      yearlyScreeningNumber
    ).padStart(3, '0')}`;

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

    loadImageForCanvas(
      pendingFilm.affiche
    ).then((img) => {
      if (cancelled) return;

      if (
        img?.src?.startsWith(
          'blob:'
        )
      ) {
        blobUrlsRef.current.push(
          img.src
        );
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
      blobUrlsRef.current.forEach(
        (url) => {
          try {
            URL.revokeObjectURL(
              url
            );
          } catch (_) {}
        }
      );
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
    whyFilm,
    personalText,
  };

  // ───────────────────────────────────────
  // PREVIEW RENDER
  // ───────────────────────────────────────

  useEffect(() => {
    if (!previewRef.current) return;

    renderStoryToCanvas(
      previewRef.current,
      paramsRef.current
    );
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
    whyFilm,
    personalText,
  ]);

  const assignPreviewRef =
    useCallback((node) => {
      previewRef.current = node;

      if (node) {
        requestAnimationFrame(() => {
          renderStoryToCanvas(
            node,
            paramsRef.current
          );
        });
      }
    }, []);

  // ───────────────────────────────────────
  // PREVIEW SCALE
  // ───────────────────────────────────────

  useEffect(() => {
    const update = () => {
      if (!wrapperRef.current) return;

      setPreviewScale(
        wrapperRef.current
          .offsetWidth / 1080
      );
    };

    update();

    window.addEventListener(
      'resize',
      update
    );

    return () =>
      window.removeEventListener(
        'resize',
        update
      );
  }, []);

  // ───────────────────────────────────────
  // MANUAL IMAGE UPLOAD
  // ───────────────────────────────────────

  const handleImageUpload =
    async (event) => {
      const file =
        event.target.files?.[0];

      if (!file) return;

      setPosterLoading(true);

      const objectUrl =
        URL.createObjectURL(file);

      blobUrlsRef.current.push(
        objectUrl
      );

      try {
        const img =
          await loadImgElement(
            objectUrl
          );

        setPosterImg(img);
      } catch (_) {
        alert(
          "Impossible de charger cette image."
        );
      } finally {
        setPosterLoading(false);

        if (
          fileInputRef.current
        ) {
          fileInputRef.current.value =
            '';
        }
      }
    };

  // ───────────────────────────────────────
  // DOWNLOAD / SHARE
  // ───────────────────────────────────────

  const downloadStory =
    useCallback(async () => {
      if (isDownloading) return;

      setIsDownloading(true);

      try {
        const exportCanvas =
          document.createElement(
            'canvas'
          );

        await renderStoryToCanvas(
          exportCanvas,
          paramsRef.current
        );

        exportCanvas.toBlob(
          async (blob) => {
            if (!blob) {
              alert(
                'Erreur de génération.'
              );

              setIsDownloading(false);
              return;
            }

            const file =
              new File(
                [blob],
                `seance_${yearlyScreeningNumber}.png`,
                {
                  type: 'image/png',
                }
              );

            if (
              navigator.canShare?.({
                files: [file],
              })
            ) {
              try {
                await navigator.share({
                  files: [file],
                  title:
                    `Séance #${yearlyScreeningNumber} — ${paramsRef.current.title}`,
                });
              } catch (error) {
                if (
                  error.name !==
                  'AbortError'
                ) {
                  console.error(
                    error
                  );
                }
              }
            } else {
              const url =
                URL.createObjectURL(
                  blob
                );

              const link =
                document.createElement(
                  'a'
                );

              link.href = url;
              link.download =
                `story_seance_${yearlyScreeningNumber}.png`;

              link.click();

              setTimeout(() => {
                URL.revokeObjectURL(
                  url
                );
              }, 5000);
            }

            setIsDownloading(false);
          },
          'image/png'
        );
      } catch (error) {
        console.error(error);

        alert(
          'Erreur inattendue. Réessaie.'
        );

        setIsDownloading(false);
      }
    }, [
      isDownloading,
      yearlyScreeningNumber,
    ]);

  // ───────────────────────────────────────
  // UI
  // ───────────────────────────────────────

  return (
    <div className="animate-in fade-in pb-24 flex flex-col min-h-screen bg-[#0C0C0E] overflow-x-hidden">

      {/* HEADER */}
      <header
        className="
          z-40 sticky top-0 w-full
          bg-[#0C0C0E]/90
          backdrop-blur-xl
          border-b border-white/10
          pt-[calc(env(safe-area-inset-top)+1rem)]
          pb-4 px-6
          flex justify-between items-center
          text-white
        "
      >
        <button
          onClick={onBack}
          className="
            w-10 h-10 rounded-full
            bg-white/5
            flex items-center justify-center
            active:scale-95 transition-transform
          "
        >
          <ChevronLeft
            size={20}
            strokeWidth={2.5}
          />
        </button>

        <h2
          className="
            font-galinoy italic
            text-xl tracking-tight
          "
        >
          Story Séance
        </h2>

        <div className="w-10" />
      </header>

      <div className="px-5 py-6 flex flex-col gap-5">

        {/* ──────────────────────────────── */}
        {/* PREVIEW                          */}
        {/* ──────────────────────────────── */}

        <div
          ref={wrapperRef}
          className="
            w-full relative
            bg-black
            rounded-[2rem]
            border border-white/10
            overflow-hidden
            shadow-2xl
          "
          style={{
            aspectRatio: '9 / 16',
          }}
        >
          {posterLoading && (
            <div
              className="
                absolute inset-0
                flex items-center justify-center
                z-10
                bg-black/60
                rounded-[2rem]
              "
            >
              <div
                className="
                  w-8 h-8
                  border-2
                  border-[#E8B200]
                  border-t-transparent
                  rounded-full
                  animate-spin
                "
              />
            </div>
          )}

          <canvas
            ref={assignPreviewRef}
            width={1080}
            height={1920}
            className="
              absolute top-0 left-0
              origin-top-left
            "
            style={{
              width: '1080px',
              height: '1920px',
              transform:
                `scale(${previewScale})`,
            }}
          />
        </div>

        {/* ──────────────────────────────── */}
        {/* STYLE                            */}
        {/* ──────────────────────────────── */}

        <div
          className="
            bg-[#141418]
            border border-white/8
            rounded-2xl
            p-5
          "
        >
          <div
            className="
              font-outfit
              text-[10px]
              font-bold
              tracking-widest
              uppercase
              text-white/30
              mb-3
            "
          >
            Direction artistique
          </div>

          <div className="grid grid-cols-2 gap-2">

            <button
              type="button"
              onClick={() =>
                setStyleMode(
                  'editorial'
                )
              }
              className={`
                rounded-xl
                px-3 py-3
                text-left
                transition-all
                border
                ${
                  styleMode ===
                  'editorial'
                    ? `
                      bg-white/10
                      border-white/20
                      text-white
                    `
                    : `
                      bg-white/[0.03]
                      border-white/5
                      text-white/35
                    `
                }
              `}
            >
              <div
                className="
                  font-outfit
                  text-[11px]
                  font-bold
                "
              >
                Éditorial
              </div>

              <div
                className="
                  font-outfit
                  text-[9px]
                  mt-1
                  text-white/30
                "
              >
                Magazine cinéma
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                setStyleMode(
                  'cinema'
                )
              }
              className={`
                rounded-xl
                px-3 py-3
                text-left
                transition-all
                border
                ${
                  styleMode ===
                  'cinema'
                    ? `
                      bg-white/10
                      border-[#E8B200]/40
                      text-white
                    `
                    : `
                      bg-white/[0.03]
                      border-white/5
                      text-white/35
                    `
                }
              `}
            >
              <div
                className="
                  font-outfit
                  text-[11px]
                  font-bold
                "
              >
                Cinéma
              </div>

              <div
                className="
                  font-outfit
                  text-[9px]
                  mt-1
                  text-white/30
                "
              >
                Immersif & texturé
              </div>
            </button>

          </div>
        </div>

        {/* ──────────────────────────────── */}
        {/* HYPE                             */}
        {/* ──────────────────────────────── */}

        <div
          className="
            bg-[#141418]
            border border-white/8
            rounded-2xl
            p-5
          "
        >
          <div
            className="
              font-outfit
              text-[10px]
              font-bold
              tracking-widest
              uppercase
              text-white/30
              mb-4
            "
          >
            Mon niveau d'attente
          </div>

          <div className="flex gap-2 mb-4">
            {EXPECTATIONS.map(
              (exp, index) => (
                <button
                  key={exp.label}
                  type="button"
                  onClick={() =>
                    setExpectation(
                      index
                    )
                  }
                  className="
                    flex-1
                    flex flex-col
                    items-center
                    gap-2
                    group
                    transition-all
                    active:scale-95
                  "
                >
                  <div
                    className="
                      w-full
                      h-1.5
                      rounded-full
                      transition-all
                    "
                    style={{
                      background:
                        index <=
                        expectation
                          ? exp.barHex
                          : 'rgba(255,255,255,0.08)',
                    }}
                  />

                  <span
                    className="
                      font-outfit
                      text-[8px]
                      font-semibold
                      transition-all
                    "
                    style={{
                      color:
                        index ===
                        expectation
                          ? exp.barHex
                          : 'rgba(255,255,255,0.2)',
                    }}
                  >
                    {exp.label}
                  </span>
                </button>
              )
            )}
          </div>

          <div className="flex items-center gap-2">
            <span
              className="
                font-outfit
                font-bold
                text-sm
              "
              style={{
                color:
                  EXPECTATIONS[
                    expectation
                  ].barHex,
              }}
            >
              {
                EXPECTATIONS[
                  expectation
                ].label
              }
            </span>

            <span className="text-white/20">
              ·
            </span>

            <span
              className="
                font-outfit
                text-xs
                text-white/35
                italic
              "
            >
              {
                EXPECTATIONS[
                  expectation
                ].sub
              }
            </span>
          </div>
        </div>

        {/* ──────────────────────────────── */}
        {/* WHY FILM                         */}
        {/* ──────────────────────────────── */}

        <div
          className="
            bg-[#141418]
            border border-white/8
            rounded-2xl
            p-5
          "
        >
          <div
            className="
              font-outfit
              text-[10px]
              font-bold
              tracking-widest
              uppercase
              text-white/30
              mb-4
            "
          >
            Pourquoi ce film ?
          </div>

          <div className="flex flex-wrap gap-2">
            {WHY_OPTIONS.map(
              (option) => {
                const selected =
                  whyFilm === option;

                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() =>
                      setWhyFilm(
                        selected
                          ? ''
                          : option
                      )
                    }
                    className={`
                      rounded-full
                      px-3 py-2
                      font-outfit
                      text-[10px]
                      font-semibold
                      border
                      transition-all
                      active:scale-95
                      ${
                        selected
                          ? `
                            bg-[#E8B200]
                            border-[#E8B200]
                            text-[#111]
                          `
                          : `
                            bg-white/5
                            border-white/10
                            text-white/45
                          `
                      }
                    `}
                  >
                    {option}
                  </button>
                );
              }
            )}
          </div>

          <textarea
            value={personalText}
            onChange={(e) =>
              setPersonalText(
                e.target.value
              )
            }
            maxLength={120}
            rows={2}
            placeholder="Une petite phrase personnelle…"
            className="
              mt-4
              w-full
              resize-none
              bg-white/5
              border border-white/10
              rounded-xl
              px-4 py-3
              font-outfit
              text-sm
              text-white
              placeholder:text-white/20
              outline-none
              focus:border-[#E8B200]/50
              transition-colors
            "
          />
        </div>

        {/* ──────────────────────────────── */}
        {/* SESSION INFOS                    */}
        {/* ──────────────────────────────── */}

        <div
          className="
            bg-[#141418]
            border border-white/8
            rounded-2xl
            p-5
            flex flex-col
            gap-4
          "
        >
          <div
            className="
              font-outfit
              text-[10px]
              font-bold
              tracking-widest
              uppercase
              text-white/30
            "
          >
            Infos séance
          </div>

          <div>
            <label
              className="
                font-outfit
                text-[9px]
                font-semibold
                text-white/30
                uppercase
                tracking-widest
                block mb-1.5
              "
            >
              Titre
            </label>

            <input
              type="text"
              value={title}
              onChange={(e) =>
                setTitle(
                  e.target.value
                )
              }
              placeholder="Titre du film…"
              className="
                w-full
                bg-white/5
                border border-white/10
                rounded-xl
                px-4 py-3
                font-outfit
                text-sm
                text-white
                placeholder:text-white/20
                outline-none
                focus:border-[#E8B200]/50
                transition-colors
              "
            />
          </div>

          <div className="grid grid-cols-2 gap-3">

            <div>
              <label
                className="
                  font-outfit
                  text-[9px]
                  font-semibold
                  text-white/30
                  uppercase
                  tracking-widest
                  block mb-1.5
                "
              >
                Date
              </label>

              <input
                type="text"
                value={date}
                onChange={(e) =>
                  setDate(
                    e.target.value
                  )
                }
                placeholder="JJ/MM/AAAA"
                className="
                  w-full
                  bg-white/5
                  border border-white/10
                  rounded-xl
                  px-4 py-3
                  font-outfit
                  text-sm
                  text-white
                  placeholder:text-white/20
                  outline-none
                  focus:border-[#E8B200]/50
                "
              />
            </div>

            <div>
              <label
                className="
                  font-outfit
                  text-[9px]
                  font-semibold
                  text-white/30
                  uppercase
                  tracking-widest
                  block mb-1.5
                "
              >
                Heure
              </label>

              <input
                type="text"
                value={time}
                onChange={(e) =>
                  setTime(
                    e.target.value
                  )
                }
                placeholder="20:00"
                className="
                  w-full
                  bg-white/5
                  border border-white/10
                  rounded-xl
                  px-4 py-3
                  font-outfit
                  text-sm
                  text-white
                  placeholder:text-white/20
                  outline-none
                  focus:border-[#E8B200]/50
                "
              />
            </div>

          </div>

          <div className="grid grid-cols-2 gap-3">

            <div>
              <label
                className="
                  font-outfit
                  text-[9px]
                  font-semibold
                  text-white/30
                  uppercase
                  tracking-widest
                  block mb-1.5
                "
              >
                Durée
              </label>

              <input
                type="text"
                value={duration}
                onChange={(e) =>
                  setDuration(
                    e.target.value
                  )
                }
                placeholder="2h08"
                className="
                  w-full
                  bg-white/5
                  border border-white/10
                  rounded-xl
                  px-4 py-3
                  font-outfit
                  text-sm
                  text-white
                  placeholder:text-white/20
                  outline-none
                  focus:border-[#E8B200]/50
                "
              />
            </div>

            <div>
              <label
                className="
                  font-outfit
                  text-[9px]
                  font-semibold
                  text-white/30
                  uppercase
                  tracking-widest
                  block mb-1.5
                "
              >
                Langue
              </label>

              <input
                type="text"
                value={lang}
                onChange={(e) =>
                  setLang(
                    e.target.value
                  )
                }
                placeholder="VOSTFR"
                className="
                  w-full
                  bg-white/5
                  border border-white/10
                  rounded-xl
                  px-4 py-3
                  font-outfit
                  text-sm
                  text-white
                  placeholder:text-white/20
                  outline-none
                  focus:border-[#E8B200]/50
                "
              />
            </div>

          </div>
        </div>

        {/* ──────────────────────────────── */}
        {/* POSTER MANUAL                    */}
        {/* ──────────────────────────────── */}

        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={
            handleImageUpload
          }
          className="hidden"
        />

        <button
          type="button"
          onClick={() =>
            fileInputRef.current?.click()
          }
          className="
            w-full h-12
            rounded-2xl
            bg-white/5
            text-white/60
            font-outfit
            font-semibold
            text-xs
            flex items-center
            justify-center
            gap-2.5
            active:scale-95
            transition-all
            border border-white/8
            hover:bg-white/8
          "
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect
              x="3"
              y="3"
              width="18"
              height="18"
              rx="2"
            />

            <circle
              cx="8.5"
              cy="8.5"
              r="1.5"
            />

            <polyline
              points="21 15 16 10 5 21"
            />
          </svg>

          Changer l'affiche manuellement
        </button>

        {/* ──────────────────────────────── */}
        {/* SHARE                             */}
        {/* ──────────────────────────────── */}

        <button
          type="button"
          onClick={downloadStory}
          disabled={
            isDownloading ||
            !title.trim()
          }
          className={`
            w-full h-14
            rounded-2xl
            flex items-center
            justify-center
            gap-2.5
            font-outfit
            font-extrabold
            text-sm
            transition-all
            ${
              isDownloading ||
              !title.trim()
                ? `
                  bg-[#E8B200]/40
                  text-black/40
                  cursor-wait
                `
                : `
                  bg-[#E8B200]
                  text-[#0A0A0A]
                  shadow-[0_4px_24px_rgba(232,178,0,0.28)]
                  active:scale-95
                `
            }
          `}
        >
          {isDownloading ? (
            <div
              className="
                w-5 h-5
                border-2
                border-black/30
                border-t-black
                animate-spin
                rounded-full
              "
            />
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
                <line
                  x1="12"
                  y1="2"
                  x2="12"
                  y2="15"
                />
              </svg>

              Partager la Story
            </>
          )}
        </button>

      </div>
    </div>
  );
}