export const REVIEW_POST_W = 1080;
export const REVIEW_POST_H = 1350;

const FONT_SANS = '"DM Sans", system-ui, sans-serif';
const FONT_DISPLAY = '"Syne", system-ui, sans-serif';
const PANEL_BG = 'rgba(248,243,234,0.9)';
const PANEL_TEXT = '#27211B';

function makeCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = REVIEW_POST_W;
  canvas.height = REVIEW_POST_H;
  return canvas;
}

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
  const words = String(text || '').split(/\s+/).filter(Boolean);
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

function fitLines(ctx, text, maxWidth, maxLines) {
  const allLines = wrapText(ctx, text, maxWidth);
  const lines = allLines.slice(0, maxLines);
  if (allLines.length <= maxLines || lines.length === 0) return lines;

  let last = lines[lines.length - 1].replace(/\s+$/, '');
  while (last && ctx.measureText(`${last}...`).width > maxWidth) {
    last = last.split(/\s+/).slice(0, -1).join(' ');
  }
  lines[lines.length - 1] = last ? `${last}...` : '...';
  return lines;
}

function drawTextBlock(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
  const lines = wrapText(ctx, text, maxWidth).slice(0, maxLines);
  lines.forEach((line, index) => ctx.fillText(line, x, y + index * lineHeight));
  return y + lines.length * lineHeight;
}

function drawRichTextBlock(ctx, text, x, y, maxWidth, lineHeight, maxLines, styles) {
  const tokens = String(text || '')
    .split(/(".*?"|«.*?»)/g)
    .filter(Boolean)
    .flatMap((part) => {
      const strong = (part.startsWith('"') && part.endsWith('"')) || (part.startsWith('«') && part.endsWith('»'));
      return part.replace(/^["«]|["»]$/g, '').split(/\s+/).filter(Boolean).map((word) => ({ word, strong }));
    });
  let cx = x;
  let cy = y;
  let line = 0;
  for (const token of tokens) {
    ctx.font = token.strong ? styles.strongFont : styles.font;
    const word = `${token.word} `;
    const width = ctx.measureText(word).width;
    if (cx + width > x + maxWidth && cx > x) {
      line += 1;
      if (line >= maxLines) return cy;
      cx = x;
      cy += lineHeight;
    }
    ctx.fillStyle = token.strong ? styles.strongColor : styles.color;
    ctx.fillText(word, cx, cy);
    cx += width;
  }
  return cy + lineHeight;
}

function drawCoverImage(ctx, img, x, y, w, h) {
  if (!img) return;
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const targetRatio = w / h;
  let sx;
  let sy;
  let sw;
  let sh;
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

function drawStars(ctx, rating, x, y, size, color, emptyColor) {
  const value = Number(String(rating || 0).replace(',', '.')) || 0;
  for (let i = 0; i < 5; i += 1) {
    const filled = i < Math.round(value);
    ctx.save();
    ctx.translate(x + i * (size + 14), y);
    ctx.fillStyle = filled ? color : emptyColor;
    ctx.beginPath();
    for (let p = 0; p < 10; p += 1) {
      const a = -Math.PI / 2 + p * Math.PI / 5;
      const r = p % 2 === 0 ? size / 2 : size / 4;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      p === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

function hexToRgb(hex) {
  const clean = String(hex || '#000000').replace('#', '');
  const value = clean.length === 3
    ? clean.split('').map((char) => char + char).join('')
    : clean.padEnd(6, '0').slice(0, 6);
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

function rgba(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

function relativeLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const channel = (value) => {
    const srgb = value / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrastRatio(hexA, hexB) {
  const a = relativeLuminance(hexA);
  const b = relativeLuminance(hexB);
  const light = Math.max(a, b);
  const dark = Math.min(a, b);
  return (light + 0.05) / (dark + 0.05);
}

function readableAccentOnPanel(palette) {
  return contrastRatio(palette.accent, '#F8F3EA') >= 3.6 ? palette.accent : PANEL_TEXT;
}

function noise01(seed) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function drawGrain(ctx, alpha = 0.12) {
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  for (let i = 0; i < 10500; i += 1) {
    const x = Math.floor(noise01(i + 4.1) * REVIEW_POST_W);
    const y = Math.floor(noise01(i + 9.7) * REVIEW_POST_H);
    const size = noise01(i + 2.2) > 0.86 ? 2.3 : 1.2;
    const tone = 28 + Math.floor(noise01(i + 1.4) * 74);
    ctx.globalAlpha = alpha * (0.08 + noise01(i + 6.6) * 0.44);
    ctx.fillStyle = `rgb(${tone},${tone},${tone})`;
    ctx.fillRect(x, y, size, size);
  }
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < 5200; i += 1) {
    const x = Math.floor(noise01(i + 104.1) * REVIEW_POST_W);
    const y = Math.floor(noise01(i + 109.7) * REVIEW_POST_H);
    const size = noise01(i + 102.2) > 0.9 ? 1.8 : 1;
    const tone = 168 + Math.floor(noise01(i + 101.4) * 70);
    ctx.globalAlpha = alpha * (0.04 + noise01(i + 106.6) * 0.22);
    ctx.fillStyle = `rgb(${tone},${tone},${tone})`;
    ctx.fillRect(x, y, size, size);
  }
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  for (let i = 0; i < 18; i += 1) {
    const x = noise01(i + 211.3) * REVIEW_POST_W;
    const y = noise01(i + 219.9) * REVIEW_POST_H;
    const r = 70 + noise01(i + 227.4) * 170;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, `rgba(20,20,20,${alpha * (0.16 + noise01(i + 233.2) * 0.2)})`);
    grad.addColorStop(1, 'rgba(20,20,20,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  ctx.restore();
}

function drawIrregularBurnMark(ctx, x, y, radius, seed) {
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = 'rgba(0,0,0,0.82)';
  ctx.beginPath();
  for (let i = 0; i < 18; i += 1) {
    const angle = (Math.PI * 2 * i) / 18;
    const wobble = 0.52 + noise01(seed + i * 4.7) * 0.78;
    const px = x + Math.cos(angle) * radius * wobble;
    const py = y + Math.sin(angle) * radius * (0.72 + noise01(seed + i * 3.1) * 0.42);
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();

  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = 'rgba(0,0,0,0.42)';
  ctx.beginPath();
  ctx.arc(x + radius * 0.18, y - radius * 0.12, radius * 0.38, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawFilmDamage(ctx, palette, inverted = false, seedOffset = 0) {
  const ink = inverted ? palette.bg : palette.ink;
  const accent = palette.accent;
  const leak = palette.leak || accent;
  const cool = palette.cool || palette.muted;

  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  let leakGrad = ctx.createRadialGradient(-120, 180, 20, 110, 240, 680);
  leakGrad.addColorStop(0, rgba(leak, inverted ? 0.58 : 0.42));
  leakGrad.addColorStop(0.36, rgba(leak, inverted ? 0.22 : 0.16));
  leakGrad.addColorStop(1, rgba(leak, 0));
  ctx.fillStyle = leakGrad;
  ctx.fillRect(0, 0, REVIEW_POST_W, REVIEW_POST_H);

  leakGrad = ctx.createRadialGradient(REVIEW_POST_W + 80, REVIEW_POST_H - 60, 30, REVIEW_POST_W - 90, REVIEW_POST_H - 160, 560);
  leakGrad.addColorStop(0, rgba(cool, inverted ? 0.36 : 0.28));
  leakGrad.addColorStop(0.42, rgba(cool, inverted ? 0.16 : 0.11));
  leakGrad.addColorStop(1, rgba(cool, 0));
  ctx.fillStyle = leakGrad;
  ctx.fillRect(0, 0, REVIEW_POST_W, REVIEW_POST_H);
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = inverted ? 0.16 : 0.09;
  ctx.fillStyle = rgba(ink, 0.9);
  const horizontalCount = noise01(hexToRgb(cool).b + seedOffset + 18.8) > 0.62 ? 2 : 1;
  for (let i = 0; i < horizontalCount; i += 1) {
    const seed = hexToRgb(cool).r + seedOffset + i * 31.4;
    const y = Math.floor((0.18 + noise01(seed + 22) * 0.64) * REVIEW_POST_H);
    const h = noise01(seed + 7) > 0.66 ? 2 : 1;
    ctx.fillRect(0, y, REVIEW_POST_W, h);
  }
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = inverted ? rgba(palette.bg, 0.2) : 'rgba(255,255,255,0.16)';
  ctx.lineWidth = 1;
  const scratchCount = noise01(hexToRgb(accent).r + seedOffset + 9.4) > 0.58 ? 2 : 1;
  for (let i = 0; i < scratchCount; i += 1) {
    const seed = seedOffset + i * 19.7 + hexToRgb(accent).g;
    const x = Math.floor((0.16 + noise01(seed + 15.5) * 0.68) * REVIEW_POST_W);
    const top = -60 + noise01(i + 7.7) * 180;
    const len = 360 + noise01(i + 3.8) * 980;
    ctx.globalAlpha = 0.22 + noise01(seed + 1.1) * 0.32;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.bezierCurveTo(x + 8, top + len * 0.25, x - 10, top + len * 0.62, x + 4, top + len);
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.fillStyle = inverted ? rgba(palette.bg, 0.28) : 'rgba(255,255,255,0.42)';
  for (let i = 0; i < 90; i += 1) {
    const r = 0.8 + noise01(seedOffset + i + 17.2) * 2.8;
    const x = noise01(seedOffset + i + 19.3) * REVIEW_POST_W;
    const y = noise01(seedOffset + i + 23.4) * REVIEW_POST_H;
    ctx.globalAlpha = 0.15 + noise01(seedOffset + i + 29.2) * 0.45;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  const burnX = (0.1 + noise01(seedOffset + hexToRgb(leak).r + 71.2) * 0.8) * REVIEW_POST_W;
  const burnY = (0.1 + noise01(seedOffset + hexToRgb(leak).g + 82.8) * 0.76) * REVIEW_POST_H;
  const burnR = 11 + noise01(seedOffset + hexToRgb(leak).b + 93.5) * 18;
  drawIrregularBurnMark(ctx, burnX, burnY, burnR, seedOffset + hexToRgb(leak).r + hexToRgb(accent).b);
}

function rgbString(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

function mixRgb(hexA, hexB, amount) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const mix = (from, to) => Math.round(from + (to - from) * amount);
  return `rgb(${mix(a.r, b.r)},${mix(a.g, b.g)},${mix(a.b, b.b)})`;
}

function drawLowResGradientBlob(ctx, x, y, r, color, alpha, stretchX = 1, stretchY = 1) {
  const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
  grad.addColorStop(0, color.replace('ALPHA', alpha));
  grad.addColorStop(0.35, color.replace('ALPHA', alpha * 0.62));
  grad.addColorStop(0.72, color.replace('ALPHA', alpha * 0.18));
  grad.addColorStop(1, color.replace('ALPHA', 0));
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(stretchX, stretchY);
  ctx.translate(-x, -y);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBlurredGradientField(ctx, palette, inverted = false, seedOffset = 0) {
  const smallW = 108;
  const smallH = 135;
  const layer = document.createElement('canvas');
  layer.width = smallW;
  layer.height = smallH;
  const lctx = layer.getContext('2d');
  const bg = inverted ? palette.ink : palette.bg;
  const accent = palette.accent;
  const leak = palette.leak || accent;
  const cool = palette.cool || palette.muted;
  const paper = inverted ? palette.ink : '#E9E3D8';
  const base = lctx.createLinearGradient(0, 0, smallW, smallH);
  base.addColorStop(0, mixRgb(cool, paper, inverted ? 0.18 : 0.62));
  base.addColorStop(0.32, mixRgb(bg, paper, inverted ? 0.08 : 0.48));
  base.addColorStop(0.68, mixRgb(accent, paper, inverted ? 0.18 : 0.54));
  base.addColorStop(1, mixRgb(leak, paper, inverted ? 0.12 : 0.58));
  lctx.fillStyle = base;
  lctx.fillRect(0, 0, smallW, smallH);

  lctx.globalCompositeOperation = inverted ? 'screen' : 'source-over';
  const colors = [
    rgbString(accent, 'ALPHA'),
    rgbString(leak, 'ALPHA'),
    rgbString(cool, 'ALPHA'),
    'rgba(244,238,224,ALPHA)',
    inverted ? 'rgba(8,10,14,ALPHA)' : 'rgba(190,184,170,ALPHA)',
  ];
  for (let i = 0; i < 18; i += 1) {
    const color = colors[i % colors.length];
    const x = smallW * (-0.1 + noise01(seedOffset + i + 30.1) * 1.2);
    const y = smallH * (-0.08 + noise01(seedOffset + i + 41.7) * 1.16);
    const r = 34 + noise01(seedOffset + i + 52.4) * 54;
    const alpha = (inverted ? 0.08 : 0.1) + noise01(seedOffset + i + 63.8) * (inverted ? 0.12 : 0.16);
    const sx = 0.8 + noise01(seedOffset + i + 74.2) * 1.4;
    const sy = 0.65 + noise01(seedOffset + i + 85.5) * 1.2;
    drawLowResGradientBlob(lctx, x, y, r, color, alpha, sx, sy);
  }

  lctx.globalCompositeOperation = 'multiply';
  drawLowResGradientBlob(lctx, smallW * 0.5, smallH * 0.58, 76, 'rgba(18,18,18,ALPHA)', inverted ? 0.18 : 0.08, 1.7, 0.72);

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(layer, 0, 0, REVIEW_POST_W, REVIEW_POST_H);
  ctx.restore();
}

function drawVignette(ctx, strength = 0.62) {
  const grad = ctx.createRadialGradient(
    REVIEW_POST_W / 2,
    REVIEW_POST_H / 2,
    REVIEW_POST_W * 0.18,
    REVIEW_POST_W / 2,
    REVIEW_POST_H / 2,
    REVIEW_POST_H * 0.72,
  );
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(0.68, 'rgba(0,0,0,0.08)');
  grad.addColorStop(1, `rgba(0,0,0,${strength})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, REVIEW_POST_W, REVIEW_POST_H);
}

function drawFilmPerforations(ctx, palette, inverted = false) {
  ctx.save();
  const ink = inverted ? palette.bg : palette.ink;
  const fill = inverted ? 'rgba(255,255,255,0.035)' : rgba(ink, 0.035);
  const stroke = inverted ? 'rgba(255,255,255,0.055)' : rgba(ink, 0.045);
  for (let y = 128; y < REVIEW_POST_H - 120; y += 116) {
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.5;
    roundRect(ctx, 30, y, 22, 56, 5);
    ctx.fill();
    ctx.stroke();
    roundRect(ctx, REVIEW_POST_W - 52, y + 42, 22, 56, 5);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function drawEditorialBackground(ctx, palette, inverted = false, seedOffset = 0) {
  drawBlurredGradientField(ctx, palette, inverted, seedOffset);

  ctx.save();
  ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = inverted ? 0.08 : 0.045;
  const scanCount = inverted ? 2 : 1;
  for (let i = 0; i < scanCount; i += 1) {
    const y = (0.22 + noise01(seedOffset + i + 401.8) * 0.56) * REVIEW_POST_H;
    const g = ctx.createLinearGradient(0, y, REVIEW_POST_W, y + 12);
    g.addColorStop(0, 'rgba(255,255,255,0.08)');
    g.addColorStop(0.5, 'rgba(0,0,0,0.08)');
    g.addColorStop(1, 'rgba(255,255,255,0.04)');
    ctx.fillStyle = g;
    ctx.fillRect(0, y, REVIEW_POST_W, 10);
  }
  ctx.restore();

  drawFilmDamage(ctx, palette, inverted, seedOffset);
  drawGrain(ctx, inverted ? 0.2 : 0.24);
  drawVignette(ctx, inverted ? 0.5 : 0.36);
  if (inverted) drawFilmPerforations(ctx, palette, inverted);
}

function drawChrome(ctx, data, genreConfig, formatName, slideLabel, inverted = false, seedOffset = 0) {
  const palette = genreConfig.palette;
  drawEditorialBackground(ctx, palette, inverted, seedOffset);
  ctx.fillStyle = inverted ? palette.bg : palette.ink;
  ctx.font = `800 24px ${FONT_SANS}`;
  ctx.textBaseline = 'top';
  ctx.fillText('GRAND ECRAN', 76, 60);
  ctx.textAlign = 'right';
  ctx.fillStyle = palette.accent;
  ctx.fillText(formatName.toUpperCase(), REVIEW_POST_W - 76, 60);
  ctx.textAlign = 'left';
  ctx.fillStyle = inverted ? palette.bg : palette.muted;
  ctx.font = `700 22px ${FONT_SANS}`;
  ctx.fillText(slideLabel.toUpperCase(), 76, REVIEW_POST_H - 78);
  ctx.textAlign = 'right';
  ctx.fillText(String(data.genre || 'Cinema').toUpperCase(), REVIEW_POST_W - 76, REVIEW_POST_H - 78);
  ctx.textAlign = 'left';
}

function getGenreSlideText(genreConfig, group, index, fallback = '') {
  return genreConfig?.[group]?.[index - 1] || fallback;
}

function drawGenreLexicon(ctx, genreConfig, x, y, inverted = false) {
  const palette = genreConfig.palette;
  const words = genreConfig.lexicon || [];
  ctx.save();
  ctx.font = `900 18px ${FONT_SANS}`;
  ctx.textBaseline = 'middle';
  words.slice(0, 3).forEach((word, index) => {
    const label = String(word || '').toUpperCase();
    const width = ctx.measureText(label).width + 34;
    ctx.fillStyle = rgba(palette.accent, inverted ? 0.2 : 0.14);
    roundRect(ctx, x, y + index * 42, width, 28, 14);
    ctx.fill();
    ctx.fillStyle = inverted ? palette.bg : palette.accent;
    ctx.fillText(label, x + 17, y + index * 42 + 14);
  });
  ctx.restore();
}

function drawSlideTitle(ctx, text, x, y, maxWidth, color, initialSize = 76) {
  let size = initialSize;
  ctx.fillStyle = color;
  ctx.textBaseline = 'top';
  do {
    ctx.font = `900 ${size}px ${FONT_DISPLAY}`;
    size -= 4;
  } while (ctx.measureText(String(text || '')).width > maxWidth && size >= 48);
  drawTextBlock(ctx, text, x, y, maxWidth, size + 8, 2);
}

function drawTextPanel(ctx, x, y, w, h, palette, options = {}) {
  const { alpha = 0.9, radius = 26 } = options;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.18)';
  ctx.shadowBlur = 26;
  ctx.shadowOffsetY = 14;
  ctx.fillStyle = alpha === 0.9 ? PANEL_BG : `rgba(248,243,234,${alpha})`;
  roundRect(ctx, x, y, w, h, radius);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = rgba(palette.accent, 0.2);
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, radius);
  ctx.stroke();
  ctx.restore();
}

function drawSafeTextBlock(ctx, text, x, y, maxWidth, lineHeight, maxLines, palette, options = {}) {
  const { textColor = PANEL_TEXT, ...panelOptions } = options;
  const lines = fitLines(ctx, text, maxWidth, maxLines);
  const height = Math.max(lineHeight + 28, lines.length * lineHeight + 34);
  drawTextPanel(ctx, x - 24, y - 20, maxWidth + 48, height, palette, panelOptions);
  ctx.fillStyle = textColor;
  lines.forEach((line, index) => ctx.fillText(line, x, y + index * lineHeight));
  return y + lines.length * lineHeight;
}

function drawSafeRichTextBlock(ctx, text, x, y, maxWidth, lineHeight, maxLines, styles, palette, options = {}) {
  const { textColor = PANEL_TEXT, ...panelOptions } = options;
  const safeLines = fitLines(ctx, text, maxWidth, maxLines);
  const safeText = safeLines.join(' ');
  const height = Math.max(lineHeight + 28, safeLines.length * lineHeight + 34);
  drawTextPanel(ctx, x - 24, y - 20, maxWidth + 48, height, palette, panelOptions);
  return drawRichTextBlock(ctx, safeText, x, y, maxWidth, lineHeight, maxLines, {
    ...styles,
    color: textColor,
  });
}

function getImageMode(styles, key) {
  return styles?.[key] === 'raw' ? 'raw' : 'polaroid';
}

function photoOptions(styles, key, options = {}) {
  const mode = getImageMode(styles, key);
  return {
    ...options,
    polaroid: mode === 'polaroid',
    feather: mode === 'raw',
    tape: mode === 'polaroid',
  };
}

function drawRawFeatherLayer(ctx, img, w, h, palette, label) {
  const layer = document.createElement('canvas');
  layer.width = Math.max(1, Math.round(w));
  layer.height = Math.max(1, Math.round(h));
  const lctx = layer.getContext('2d');
  const r = 34;
  roundRect(lctx, 0, 0, w, h, r);
  lctx.clip();
  lctx.fillStyle = rgba(palette.accent, 0.18);
  lctx.fillRect(0, 0, w, h);
  if (img) drawCoverImage(lctx, img, 0, 0, w, h);
  else {
    lctx.fillStyle = palette.muted;
    lctx.font = `800 28px ${FONT_SANS}`;
    lctx.textAlign = 'center';
    lctx.textBaseline = 'middle';
    lctx.fillText(label || 'IMAGE', w / 2, h / 2);
  }
  lctx.globalCompositeOperation = 'destination-in';
  const mask = lctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.28, w / 2, h / 2, Math.max(w, h) * 0.66);
  mask.addColorStop(0, 'rgba(0,0,0,1)');
  mask.addColorStop(0.72, 'rgba(0,0,0,0.98)');
  mask.addColorStop(1, 'rgba(0,0,0,0)');
  lctx.fillStyle = mask;
  lctx.fillRect(0, 0, w, h);
  ctx.drawImage(layer, 0, 0, w, h);
}

function drawPhotoSlot(ctx, img, x, y, w, h, palette, label, options = {}) {
  const {
    rotation = 0,
    polaroid = true,
    caption = '',
    tape = true,
    feather = false,
  } = options;
  const border = polaroid ? 26 : 0;
  const bottom = polaroid ? 74 : 0;
  const radius = polaroid ? 18 : 28;

  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(rotation);
  ctx.translate(-w / 2, -h / 2);

  ctx.shadowColor = polaroid ? 'rgba(0,0,0,0.24)' : 'rgba(0,0,0,0.18)';
  ctx.shadowBlur = polaroid ? 42 : 28;
  ctx.shadowOffsetY = polaroid ? 24 : 16;
  if (polaroid) {
    ctx.fillStyle = '#FBF6EC';
    roundRect(ctx, 0, 0, w, h, radius + 10);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = 'rgba(42,36,28,0.08)';
    ctx.lineWidth = 2;
    roundRect(ctx, 0, 0, w, h, radius + 10);
    ctx.stroke();
  } else {
    ctx.shadowColor = 'transparent';
  }

  if (tape && polaroid) {
    ctx.save();
    ctx.translate(w * 0.5, -8);
    ctx.rotate(-rotation * 0.7);
    ctx.fillStyle = `rgba(248,243,234,0.62)`;
    roundRect(ctx, -82, 0, 164, 32, 7);
    ctx.fill();
    ctx.strokeStyle = rgba(palette.accent, 0.2);
    ctx.lineWidth = 1.5;
    roundRect(ctx, -82, 0, 164, 32, 7);
    ctx.stroke();
    ctx.restore();
  }

  const ix = border;
  const iy = border;
  const iw = w - border * 2;
  const ih = h - border - bottom;
  if (feather) {
    drawRawFeatherLayer(ctx, img, w, h, palette, label);
  } else {
    roundRect(ctx, ix, iy, iw, ih, radius);
    ctx.clip();
    ctx.fillStyle = rgba(palette.accent, 0.16);
    ctx.fillRect(ix, iy, iw, ih);
    if (img) drawCoverImage(ctx, img, ix, iy, iw, ih);
    else {
      ctx.fillStyle = palette.muted;
      ctx.font = `800 28px ${FONT_SANS}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label || 'IMAGE', w / 2, border + ih / 2);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
    }
  }
  ctx.restore();

  if (polaroid) {
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(rotation);
    ctx.translate(-w / 2, -h / 2);
    ctx.fillStyle = '#2B251F';
    ctx.font = `800 20px ${FONT_SANS}`;
    ctx.textBaseline = 'top';
    ctx.fillText(String(caption || label || 'IMAGE').toUpperCase(), border, h - 52);
    ctx.restore();
  }
}

function drawCarouselBridgePhoto(ctx, img, palette, label, styles, key, side, options = {}) {
  const {
    y = 770,
    w = 560,
    h = 430,
    visible = 270,
    rotation = 0,
    alpha = 0.96,
    caption = label,
  } = options;
  const x = side === 'right' ? REVIEW_POST_W - visible : visible - w;
  ctx.save();
  ctx.globalAlpha = alpha;
  drawPhotoSlot(ctx, img, x, y, w, h, palette, label, photoOptions(styles, key, {
    rotation,
    caption,
    tape: false,
  }));
  ctx.restore();
}

function coverSlide(ctx, data, genreConfig, imgs, formatName, seedOffset = 0) {
  const palette = genreConfig.palette;
  const img = imgs.cover || imgs.poster || imgs.still1;
  if (img) drawCoverImage(ctx, img, 0, 0, REVIEW_POST_W, REVIEW_POST_H);
  else drawEditorialBackground(ctx, palette, false, seedOffset);
  const g = ctx.createLinearGradient(0, 0, 0, REVIEW_POST_H);
  g.addColorStop(0, 'rgba(0,0,0,0.15)');
  g.addColorStop(0.48, 'rgba(0,0,0,0.10)');
  g.addColorStop(1, 'rgba(0,0,0,0.84)');
  ctx.fillStyle = img ? g : 'rgba(0,0,0,0.28)';
  ctx.fillRect(0, 0, REVIEW_POST_W, REVIEW_POST_H);
  drawFilmDamage(ctx, palette, false, seedOffset);
  drawGrain(ctx, 0.2);
  drawVignette(ctx, 0.58);
  ctx.save();
  ctx.fillStyle = rgba(palette.accent, 0.82);
  roundRect(ctx, 0, 0, 34, REVIEW_POST_H, 0);
  ctx.fill();
  ctx.globalAlpha = 0.22;
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  for (let y = 120; y < REVIEW_POST_H; y += 58) {
    ctx.beginPath();
    ctx.moveTo(14, y);
    ctx.lineTo(22, y + 24);
    ctx.stroke();
  }
  ctx.restore();
  ctx.fillStyle = palette.accent;
  ctx.font = `900 24px ${FONT_SANS}`;
  ctx.fillText(formatName.toUpperCase(), 76, 78);
  ctx.fillStyle = '#fff';
  ctx.font = `900 100px ${FONT_DISPLAY}`;
  drawTextBlock(ctx, data.title || 'Titre du film', 76, 890, 860, 104, 3);
  ctx.font = `800 30px ${FONT_SANS}`;
  ctx.fillStyle = 'rgba(255,255,255,0.72)';
  ctx.fillText(String(data.tag || data.genre || 'Critique').toUpperCase(), 76, 1180);
  drawGenreLexicon(ctx, genreConfig, 76, 155, true);
  drawStars(ctx, data.rating, 76, 1260, 38, palette.accent, 'rgba(255,255,255,0.28)');
}

function drawDossierContinuity(ctx, palette, index, inverted = false) {
  const ink = inverted ? palette.bg : palette.ink;
  const boundaryY = [1030, 870, 430, 790, 365, 690];
  const y0 = boundaryY[index - 1] ?? 860;
  const y1 = boundaryY[index] ?? 690;
  const c1x = 250 + noise01(index * 17.4) * 180;
  const c2x = 760 + noise01(index * 23.9) * 180;
  const c1y = y0 + (noise01(index * 31.2) - 0.5) * 420;
  const c2y = y1 + (noise01(index * 41.8) - 0.5) * 420;

  ctx.save();
  ctx.strokeStyle = rgba(palette.accent, inverted ? 0.52 : 0.44);
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 18]);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-80, y0);
  ctx.bezierCurveTo(c1x, c1y, c2x, c2y, REVIEW_POST_W + 80, y1);
  ctx.stroke();
  ctx.setLineDash([]);

  const t = 0.38 + noise01(index * 19.1) * 0.24;
  const p0 = { x: -80, y: y0 };
  const p1 = { x: c1x, y: c1y };
  const p2 = { x: c2x, y: c2y };
  const p3 = { x: REVIEW_POST_W + 80, y: y1 };
  const mt = 1 - t;
  const nodeX = mt ** 3 * p0.x + 3 * mt ** 2 * t * p1.x + 3 * mt * t ** 2 * p2.x + t ** 3 * p3.x;
  const nodeY = mt ** 3 * p0.y + 3 * mt ** 2 * t * p1.y + 3 * mt * t ** 2 * p2.y + t ** 3 * p3.y;
  ctx.fillStyle = rgba(palette.accent, 0.85);
  ctx.beginPath();
  ctx.arc(nodeX, nodeY, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = rgba(ink, 0.22);
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(nodeX, nodeY, 22, 0, Math.PI * 2);
  ctx.stroke();

  ctx.globalAlpha = inverted ? 0.08 : 0.065;
  ctx.fillStyle = palette.accent;
  ctx.font = `900 210px ${FONT_DISPLAY}`;
  ctx.textBaseline = 'top';
  const panoramaX = 660 - index * 470;
  ctx.fillText('DOSSIER', panoramaX, 790);
  ctx.restore();
}

function drawDossierEdgeEcho(ctx, palette, index, inverted = false) {
  const ink = inverted ? palette.bg : palette.ink;
  ctx.save();
  ctx.globalAlpha = inverted ? 0.18 : 0.14;
  ctx.fillStyle = '#F8F3EA';
  ctx.strokeStyle = rgba(ink, 0.18);
  ctx.lineWidth = 2;

  if (index === 2 || index === 4) {
    ctx.save();
    ctx.translate(-96, 640);
    ctx.rotate(-0.06);
    roundRect(ctx, 0, 0, 210, 260, 18);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = rgba(palette.accent, 0.26);
    roundRect(ctx, 22, 24, 166, 160, 12);
    ctx.fill();
    ctx.restore();
  }

  if (index === 1 || index === 3 || index === 5) {
    ctx.save();
    ctx.translate(REVIEW_POST_W - 78, 460);
    ctx.rotate(0.08);
    roundRect(ctx, 0, 0, 235, 285, 18);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = rgba(palette.accent, 0.22);
    roundRect(ctx, 24, 26, 186, 176, 12);
    ctx.fill();
    ctx.restore();
  }

  ctx.globalAlpha = inverted ? 0.2 : 0.13;
  ctx.fillStyle = palette.accent;
  ctx.font = `900 34px ${FONT_SANS}`;
  ctx.translate(index % 2 === 0 ? -28 : REVIEW_POST_W - 92, 1060);
  ctx.rotate(index % 2 === 0 ? -Math.PI / 2 : Math.PI / 2);
  ctx.fillText('A SUIVRE', 0, 0);
  ctx.restore();
}

function drawSwipeCue(ctx, palette, text, x, y) {
  ctx.save();
  const cx = REVIEW_POST_W - 104;
  const cy = y + 10;
  ctx.fillStyle = rgba(palette.accent, 0.18);
  ctx.beginPath();
  ctx.arc(cx, cy, 36, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = rgba(palette.accent, 0.82);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, 36, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = palette.accent;
  ctx.font = `900 38px ${FONT_SANS}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('→', cx, cy - 2);
  ctx.restore();
}

function dossierSlide(ctx, index, data, genreConfig, imgs, seedOffset = 0) {
  const palette = genreConfig.palette;
  const imageStyles = imgs.styles || {};
  const panelAccent = readableAccentOnPanel(palette);
  const slides = ['Couverture', ...genreConfig.dossierLabels];
  if (index === 0) return coverSlide(ctx, data, genreConfig, imgs, 'Le Dossier', seedOffset);
  const inverted = index === 3;
  drawChrome(ctx, data, genreConfig, 'Le Dossier', slides[index], inverted, seedOffset);
  drawDossierContinuity(ctx, palette, index, inverted);
  drawDossierEdgeEcho(ctx, palette, index, inverted);
  const ink = inverted ? palette.bg : palette.ink;

  if (index === 1) {
    ctx.fillStyle = palette.accent;
    ctx.font = `900 24px ${FONT_SANS}`;
    ctx.fillText(getGenreSlideText(genreConfig, 'dossierKickers', index, 'OUVERTURE DU DOSSIER').toUpperCase(), 76, 150);
    ctx.fillStyle = PANEL_TEXT;
    ctx.font = `900 66px ${FONT_DISPLAY}`;
    drawSafeTextBlock(ctx, getGenreSlideText(genreConfig, 'dossierHeadlines', index, 'Ce que le film promet vraiment'), 76, 205, 570, 70, 3, palette);
    drawPhotoSlot(ctx, imgs.still1 || imgs.poster, 590, 235, 390, 520, palette, 'IMAGE 01', photoOptions(imageStyles, 'still1', { rotation: 0.055, caption: genreConfig.lexicon?.[0] || 'Image 01' }));
    ctx.font = `800 24px ${FONT_SANS}`;
    ctx.fillStyle = palette.accent;
    drawTextBlock(ctx, [data.director && `REAL. ${data.director}`, data.cast && `CAST. ${data.cast}`].filter(Boolean).join('  /  '), 76, 450, 520, 34, 3);
    ctx.font = `500 35px ${FONT_SANS}`;
    ctx.fillStyle = PANEL_TEXT;
    drawSafeTextBlock(ctx, data.pitch, 76, 560, 510, 50, 7, palette);
    drawSwipeCue(ctx, palette, 'Les pieces du dossier', REVIEW_POST_W - 76, 1130, 'right');
    return;
  }

  if (index === 2) {
    ctx.fillStyle = palette.accent;
    ctx.font = `900 24px ${FONT_SANS}`;
    ctx.fillText(getGenreSlideText(genreConfig, 'dossierKickers', index, 'CE QUI TIENT').toUpperCase(), 76, 150);
    ctx.fillStyle = PANEL_TEXT;
    ctx.font = `900 64px ${FONT_DISPLAY}`;
    drawSafeTextBlock(ctx, getGenreSlideText(genreConfig, 'dossierHeadlines', index, 'Ce qui donne envie de croire au film'), 76, 205, 770, 70, 3, palette);
    drawPhotoSlot(ctx, imgs.still1 || imgs.poster, 610, 390, 380, 475, palette, 'IMAGE 1', photoOptions(imageStyles, 'still1', { rotation: 0.045, caption: genreConfig.lexicon?.[0] || 'Detail' }));
    if (imgs.still2) drawPhotoSlot(ctx, imgs.still2, 690, 790, 320, 390, palette, 'IMAGE 2', photoOptions(imageStyles, 'still2', { rotation: -0.035, caption: genreConfig.lexicon?.[1] || 'Detail' }));
    ctx.font = `500 35px ${FONT_SANS}`;
    drawSafeRichTextBlock(ctx, data.worksText || data.works?.join(' '), 76, 430, 540, 49, 11, {
      font: `500 35px ${FONT_SANS}`,
      strongFont: `900 35px ${FONT_SANS}`,
      color: PANEL_TEXT,
      strongColor: panelAccent,
    }, palette);
    drawSwipeCue(ctx, palette, 'Les zones d ombre', 76, 1130, 'left');
    return;
  }

  if (index === 3) {
    ctx.fillStyle = palette.accent;
    ctx.font = `900 24px ${FONT_SANS}`;
    ctx.fillText(getGenreSlideText(genreConfig, 'dossierKickers', index, 'CE QUI MANQUE').toUpperCase(), 76, 150);
    ctx.fillStyle = PANEL_TEXT;
    ctx.font = `900 64px ${FONT_DISPLAY}`;
    drawSafeTextBlock(ctx, getGenreSlideText(genreConfig, 'dossierHeadlines', index, 'La ou le film laisse des traces moins nettes'), 76, 205, 840, 70, 3, palette);
    if (imgs.still2) drawPhotoSlot(ctx, imgs.still2, 610, 395, 380, 475, palette, 'IMAGE', photoOptions(imageStyles, 'still2', { rotation: -0.05, caption: genreConfig.lexicon?.[2] || 'Contrechamp' }));
    ctx.font = `500 35px ${FONT_SANS}`;
    drawSafeRichTextBlock(ctx, data.blocksText || data.blocks?.join(' '), 76, 430, 560, 49, 11, {
      font: `500 35px ${FONT_SANS}`,
      strongFont: `900 35px ${FONT_SANS}`,
      color: PANEL_TEXT,
      strongColor: panelAccent,
    }, palette);
    drawSwipeCue(ctx, palette, 'Le focus', REVIEW_POST_W - 76, 1130, 'right');
    return;
  }

  if (index === 4) {
    ctx.fillStyle = palette.accent;
    ctx.font = `900 24px ${FONT_SANS}`;
    ctx.fillText(getGenreSlideText(genreConfig, 'dossierKickers', index, 'FOCUS').toUpperCase(), 76, 150);
    ctx.fillStyle = PANEL_TEXT;
    ctx.font = `900 64px ${FONT_DISPLAY}`;
    drawSafeTextBlock(ctx, data.highlightTitle || getGenreSlideText(genreConfig, 'dossierHeadlines', index, 'Le moment qui concentre tout'), 76, 205, 760, 70, 2, palette);
    drawPhotoSlot(ctx, imgs.scene || imgs.still2 || imgs.poster, 72, 345, 940, 565, palette, 'FOCUS', photoOptions(imageStyles, 'scene', { rotation: -0.035, caption: genreConfig.beat.label }));
    ctx.font = `500 35px ${FONT_SANS}`;
    ctx.fillStyle = PANEL_TEXT;
    drawSafeRichTextBlock(ctx, data.highlightText || data.sceneQuote || data.moment, 120, 920, 820, 48, 4, {
      font: `500 35px ${FONT_SANS}`,
      strongFont: `900 35px ${FONT_SANS}`,
      color: PANEL_TEXT,
      strongColor: panelAccent,
    }, palette);
    drawSwipeCue(ctx, palette, 'Recap express', REVIEW_POST_W - 76, 1130, 'right');
    return;
  }

  ctx.fillStyle = palette.accent;
  ctx.font = `900 24px ${FONT_SANS}`;
  ctx.fillText(getGenreSlideText(genreConfig, 'dossierKickers', index, 'RECAP EXPRESS').toUpperCase(), 76, 150);
  ctx.fillStyle = PANEL_TEXT;
  ctx.font = `900 64px ${FONT_DISPLAY}`;
  drawSafeTextBlock(ctx, getGenreSlideText(genreConfig, 'dossierHeadlines', index, 'Le dossier en une minute'), 76, 205, 560, 70, 2, palette);
  drawPhotoSlot(ctx, imgs.poster || imgs.cover, 630, 150, 345, 505, palette, 'POSTER', photoOptions(imageStyles, 'still1', { rotation: 0.04, caption: 'Poster' }));
  ctx.font = `900 126px ${FONT_DISPLAY}`;
  ctx.fillStyle = palette.accent;
  ctx.fillText(`${data.rating || '4'}/5`, 76, 420);
  ctx.save();
  ctx.strokeStyle = rgba(palette.accent, 0.28);
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(585, 465, 118, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(585, 465, 82, 0, Math.PI * 1.55);
  ctx.stroke();
  ctx.restore();
  ctx.font = `800 40px ${FONT_SANS}`;
  ctx.fillStyle = PANEL_TEXT;
  drawSafeTextBlock(ctx, data.quickTake || data.verdict, 76, 660, 860, 56, 4, palette);
  ctx.font = `900 34px ${FONT_SANS}`;
  ctx.fillStyle = PANEL_TEXT;
  drawSafeTextBlock(ctx, data.archetype || genreConfig.archetype, 76, 915, 760, 46, 2, palette);
  ctx.save();
  ctx.fillStyle = rgba(palette.accent, 0.16);
  roundRect(ctx, 76, 1080, 890, 118, 34);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = ink;
  ctx.font = `900 31px ${FONT_SANS}`;
  drawTextBlock(ctx, data.cta || 'Aime, partage, commente : tu en as pense quoi ?', 115, 1116, 800, 40, 2);
}

function ficheSlide(ctx, index, data, genreConfig, imgs, seedOffset = 0) {
  const palette = genreConfig.palette;
  const imageStyles = imgs.styles || {};
  const panelAccent = readableAccentOnPanel(palette);
  const slides = ['Couverture', ...genreConfig.ficheHeadlines];
  if (index === 0) return coverSlide(ctx, data, genreConfig, imgs, 'La Fiche Cine', seedOffset);
  drawChrome(ctx, data, genreConfig, 'La Fiche Cine', slides[index], false, seedOffset);
  drawSlideTitle(ctx, slides[index], 76, 150, 650, palette.ink, 76);
  drawGenreLexicon(ctx, genreConfig, 780, 154);

  if (index === 1) {
    const infos = [
      [genreConfig.lexicon?.[0]?.toUpperCase() || 'GENRE', data.genre],
      ['DUREE', data.duration],
      ['LANGUE', data.lang],
      ['SALLE', data.room],
    ];
    infos.forEach(([label, value], i) => {
      const x = 76 + (i % 2) * 470;
      const y = 330 + Math.floor(i / 2) * 230;
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.12)';
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 10;
      ctx.fillStyle = PANEL_BG;
      roundRect(ctx, x - 20, y - 22, 410, 150, 24);
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.strokeStyle = rgba(palette.accent, 0.18);
      ctx.lineWidth = 2;
      roundRect(ctx, x - 20, y - 22, 410, 150, 24);
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = panelAccent;
      ctx.font = `900 24px ${FONT_SANS}`;
      ctx.fillText(label, x, y);
      ctx.fillStyle = PANEL_TEXT;
      ctx.font = `800 54px ${FONT_DISPLAY}`;
      drawTextBlock(ctx, value || '—', x, y + 46, 390, 62, 2);
    });
    ctx.fillStyle = PANEL_TEXT;
    ctx.font = `500 34px ${FONT_SANS}`;
    drawSafeTextBlock(ctx, data.shortNote, 76, 870, 880, 48, 5, palette);
    return;
  }

  if (index === 2) {
    data.scoreLabels.forEach((label, i) => {
      const y = 340 + i * 170;
      const value = data.scores?.[i] ?? 75;
      ctx.save();
      ctx.globalAlpha = 0.07;
      ctx.fillStyle = palette.accent;
      ctx.font = `900 120px ${FONT_DISPLAY}`;
      ctx.fillText(`0${i + 1}`, 780, y - 48);
      ctx.restore();
      ctx.fillStyle = palette.ink;
      ctx.font = `800 38px ${FONT_SANS}`;
      ctx.fillText(label.toUpperCase(), 76, y);
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      roundRect(ctx, 76, y + 64, 860, 34, 17);
      ctx.fill();
      ctx.fillStyle = palette.accent;
      roundRect(ctx, 76, y + 64, 860 * (value / 100), 34, 17);
      ctx.fill();
      ctx.fillStyle = palette.muted;
      ctx.font = `800 28px ${FONT_SANS}`;
      ctx.fillText(`${value}/100`, 820, y);
    });
    return;
  }

  if (index === 3) {
    drawPhotoSlot(ctx, imgs.still1 || imgs.poster, 82, 300, 420, 600, palette, 'EXTRAIT 1', photoOptions(imageStyles, 'still1', { rotation: -0.06, caption: 'Extrait 01' }));
    drawPhotoSlot(ctx, imgs.still2 || imgs.scene, 578, 285, 420, 600, palette, 'EXTRAIT 2', photoOptions(imageStyles, imgs.still2 ? 'still2' : 'scene', { rotation: 0.05, caption: 'Extrait 02' }));
    ctx.font = `700 28px ${FONT_SANS}`;
    ctx.fillStyle = PANEL_TEXT;
    drawSafeTextBlock(ctx, data.caption1, 96, 930, 390, 40, 3, palette);
    ctx.fillStyle = PANEL_TEXT;
    drawSafeTextBlock(ctx, data.caption2, 594, 930, 390, 40, 3, palette);
    return;
  }

  if (index === 4) {
    ctx.save();
    ctx.fillStyle = rgba(palette.accent, 0.13);
    roundRect(ctx, 48, 285, 980, 640, 42);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = palette.accent;
    ctx.font = `900 42px ${FONT_SANS}`;
    ctx.fillText((genreConfig.ficheHeadlines?.[3] || 'SI TU AS AIME...').toUpperCase(), 76, 330);
    ctx.fillStyle = palette.ink;
    ctx.font = `900 72px ${FONT_DISPLAY}`;
    drawTextBlock(ctx, data.comparisonTitle, 76, 405, 860, 86, 3);
    ctx.fillStyle = PANEL_TEXT;
    ctx.font = `500 38px ${FONT_SANS}`;
    drawSafeTextBlock(ctx, data.comparison, 76, 710, 840, 54, 6, palette);
    return;
  }

  ctx.font = `900 100px ${FONT_DISPLAY}`;
  ctx.fillStyle = palette.accent;
  ctx.fillText(`${data.rating || '4'}/5`, 76, 310);
  ctx.save();
  ctx.fillStyle = rgba(palette.accent, 0.11);
  ctx.beginPath();
  ctx.ellipse(760, 820, 260, 180, -0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = palette.ink;
  ctx.font = `900 54px ${FONT_DISPLAY}`;
  ctx.fillStyle = PANEL_TEXT;
  drawSafeTextBlock(ctx, `“${data.verdict || 'Une recommandation nette.'}”`, 76, 520, 860, 68, 5, palette);
}

function feuilletonSlide(ctx, index, data, genreConfig, imgs, seedOffset = 0) {
  const palette = genreConfig.palette;
  const imageStyles = imgs.styles || {};
  const slides = ['Couverture', ...genreConfig.feuilletonLabels];
  if (index === 0) return coverSlide(ctx, data, genreConfig, imgs, 'Le Feuilleton', seedOffset);
  drawChrome(ctx, data, genreConfig, 'Le Feuilleton', slides[index], false, seedOffset);
  drawSlideTitle(ctx, slides[index], 76, 150, 650, palette.ink, 82);
  drawGenreLexicon(ctx, genreConfig, 785, 154);

  if (index === 1) {
    ctx.save();
    ctx.fillStyle = rgba(palette.accent, 0.13);
    roundRect(ctx, 58, 285, 420, 240, 38);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = palette.accent;
    ctx.font = `900 118px ${FONT_DISPLAY}`;
    ctx.fillText(`${data.hype || 3}/5`, 76, 330);
    ctx.fillStyle = PANEL_TEXT;
    ctx.font = `500 42px ${FONT_SANS}`;
    drawSafeTextBlock(ctx, data.avant, 76, 540, 860, 60, 7, palette);
    return;
  }

  if (index === 2) {
    drawPhotoSlot(ctx, imgs.still1 || imgs.poster, 90, 270, 890, 500, palette, 'PENDANT', photoOptions(imageStyles, 'still1', { rotation: -0.028, caption: 'Pendant' }));
    ctx.fillStyle = PANEL_TEXT;
    ctx.font = `700 38px ${FONT_SANS}`;
    drawSafeTextBlock(ctx, data.pendant, 76, 835, 860, 54, 6, palette);
    return;
  }

  if (index === 3) {
    drawPhotoSlot(ctx, imgs.scene || imgs.still2 || imgs.poster, 88, 290, 900, 585, palette, genreConfig.beat.label, photoOptions(imageStyles, imgs.scene ? 'scene' : 'still2', { rotation: 0.04, caption: genreConfig.beat.label }));
    ctx.fillStyle = PANEL_TEXT;
    ctx.font = `900 58px ${FONT_DISPLAY}`;
    drawSafeTextBlock(ctx, `“${data.moment || data.sceneQuote || 'Le moment qui accroche.'}”`, 110, 930, 830, 70, 4, palette);
    return;
  }

  if (index === 4) {
    ctx.save();
    ctx.fillStyle = rgba(palette.accent, 0.12);
    roundRect(ctx, 52, 278, 976, 505, 48);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = PANEL_TEXT;
    ctx.font = `500 42px ${FONT_SANS}`;
    drawSafeTextBlock(ctx, data.apres, 76, 320, 860, 60, 8, palette);
    ctx.fillStyle = palette.accent;
    ctx.font = `900 120px ${FONT_DISPLAY}`;
    ctx.fillText(`${data.rating || '4'}/5`, 76, 925);
    return;
  }

  ctx.fillStyle = palette.accent;
  ctx.font = `900 48px ${FONT_SANS}`;
  ctx.fillText('ARCHETYPE', 76, 320);
  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = palette.accent;
  ctx.font = `900 260px ${FONT_DISPLAY}`;
  ctx.fillText('TYPE', 510, 795);
  ctx.restore();
  ctx.fillStyle = palette.ink;
  ctx.font = `900 72px ${FONT_DISPLAY}`;
  ctx.fillStyle = PANEL_TEXT;
  drawSafeTextBlock(ctx, data.archetype || genreConfig.archetype, 76, 405, 840, 84, 4, palette);
  ctx.fillStyle = PANEL_TEXT;
  ctx.font = `500 34px ${FONT_SANS}`;
  drawSafeTextBlock(ctx, data.verdict, 76, 790, 860, 50, 5, palette);
}

async function loadImage(src) {
  if (!src) return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export async function renderReviewSlide({ formatId, slideIndex, data, genreConfig, imageSources }) {
  await document.fonts?.ready;
  const canvas = makeCanvas();
  const ctx = canvas.getContext('2d');
  const accentRgb = hexToRgb(genreConfig.palette.accent);
  const formatSeed = String(formatId || 'review').split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const seedOffset = formatSeed + slideIndex * 137.17 + accentRgb.r * 0.73 + accentRgb.g * 1.19 + accentRgb.b * 1.61;
  const imgs = {
    poster: await loadImage(imageSources.poster),
    cover: await loadImage(imageSources.cover),
    still1: await loadImage(imageSources.still1),
    still2: await loadImage(imageSources.still2),
    scene: await loadImage(imageSources.scene),
    styles: imageSources.styles || {},
  };

  if (formatId === 'fiche') ficheSlide(ctx, slideIndex, data, genreConfig, imgs, seedOffset);
  else if (formatId === 'feuilleton') feuilletonSlide(ctx, slideIndex, data, genreConfig, imgs, seedOffset);
  else dossierSlide(ctx, slideIndex, data, genreConfig, imgs, seedOffset);

  return canvas;
}

export function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Export image impossible: canvas vide ou bloque par CORS.'));
      }, 'image/png', 1);
    } catch (error) {
      reject(error);
    }
  });
}
