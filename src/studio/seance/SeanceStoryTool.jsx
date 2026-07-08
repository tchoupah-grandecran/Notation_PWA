import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft } from 'lucide-react';
import '../../Studio.css';

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

const FONT_SANS = '"DM Sans", sans-serif';
const FONT_SYNE = '"Syne", sans-serif';

// ─────────────────────────────────────────────────────────────────────────────
// STORY SÉANCE — CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const STORY_W = 1080;
const STORY_H = 1920;
const GOLD    = '#E8B200';
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
export default function SeanceStoryTool({ historyData = [], onBack, pendingFilm }) {
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
