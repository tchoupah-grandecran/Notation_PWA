import { useState, useRef, useEffect, useCallback } from 'react';

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
  // Calcule le plus grand rectangle source qui couvre exactement w×h (object-fit: cover)
  const imgRatio    = img.naturalWidth  / img.naturalHeight;
  const targetRatio = w / h;
  let sx, sy, sw, sh;
  if (imgRatio > targetRatio) {
    // Image plus large → recadre la largeur, garde toute la hauteur
    sh = img.naturalHeight;
    sw = sh * targetRatio;
    sx = (img.naturalWidth - sw) / 2;
    sy = 0;
  } else {
    // Image plus haute → recadre la hauteur, garde toute la largeur
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
// CONSTANTS
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
// RENDER ENGINE
// ─────────────────────────────────────────────────────────────────────────────
async function renderStoryToCanvas(canvas, params) {
  const { title, date, time, lang, expectation, posterImg, screeningLabel } = params;
  const ctx = canvas.getContext('2d');
  canvas.width  = STORY_W;
  canvas.height = STORY_H;

  // 1. BACKGROUND ─────────────────────────────────────────────────────────────
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, STORY_W, STORY_H);

  // Affiche : cover strict — garantit que TOUTE la story est couverte
  if (posterImg) drawImageCover(ctx, posterImg, 0, 0, STORY_W, STORY_H);

  // Dégradé lisibilité
  const grad = ctx.createLinearGradient(0, 0, 0, STORY_H);
  grad.addColorStop(0,    'rgba(0,0,0,0.55)');
  grad.addColorStop(0.35, 'rgba(0,0,0,0.05)');
  grad.addColorStop(0.6,  'rgba(0,0,0,0.40)');
  grad.addColorStop(1,    'rgba(0,0,0,0.97)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, STORY_W, STORY_H);

  // 2. UI CONTENT ─────────────────────────────────────────────────────────────
  ctx.save();
  ctx.translate(0, 100);

  const LEFT   = 64;
  const MAX_W  = STORY_W - LEFT * 2;

  // Titre : calcul taille
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

  // Badge séance
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

  // Titre
  ctx.textBaseline = 'top';
  ctx.font = `900 ${fsize}px ${FONT}`;
  ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 6;
  ctx.fillStyle   = '#FFF';
  titleLines.forEach((l, i) => ctx.fillText(l, LEFT, titleY + i * lineH));
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

  // Badges info
  const BFONT = `bold 42px ${FONT}`;
  const BH    = 88;
  const BY    = titleY + titleLines.length * lineH + 40;
  ctx.font = BFONT; ctx.textBaseline = 'middle';
  let bx = LEFT;

  const badgesInfo = [
    { text: date,                  type: 'calendar' },
    { text: time.replace(':', 'h'), type: 'clock'    },
    { text: lang,                  type: 'globe'     },
  ];

  for (const badge of badgesInfo) {
    const iconSize = 34, gap = 14, px = 32;
    const bw = px + iconSize + gap + ctx.measureText(badge.text).width + px;

    ctx.save();
    ctx.globalAlpha = 0.92; ctx.fillStyle = '#1C1C1E';
    roundRect(ctx, bx, BY, bw, BH, BH / 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();

    // Icône
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

  // Hype Meter card
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
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
      <div className="w-20 h-20 bg-white/5 rounded-full border border-white/10 flex items-center justify-center mb-6 shadow-2xl">
        <svg className="w-8 h-8 text-[var(--color-primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      </div>
      <h2 className="font-syne font-black text-3xl mb-2 text-white">Zone Sécurisée</h2>
      <form onSubmit={(e) => { e.preventDefault(); if (password.toUpperCase() === 'POPCORN') onUnlock(); else { alert('Mot de passe incorrect'); setPassword(''); }}}
        className="flex flex-col gap-4 w-full max-w-xs">
        <input type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)}
          className="bg-black/40 border border-white/10 rounded-2xl p-4 text-center font-bold tracking-widest outline-none focus:border-[var(--color-primary)] transition-colors text-white"/>
        <button type="submit" className="bg-[var(--color-primary)] text-black font-black uppercase tracking-widest py-4 rounded-2xl active:scale-95 transition-transform">Déverrouiller</button>
      </form>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STUDIO HUB
// ─────────────────────────────────────────────────────────────────────────────
function StudioHub({ isScrolled, onSelectTool, onLock }) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      <header className={`z-40 sticky top-0 w-full transition-all duration-500 bg-[var(--color-bg)]/80 backdrop-blur-2xl border-b ${isScrolled ? 'pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-3 border-white/10 shadow-lg' : 'pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-5 border-transparent'}`}>
        <div className="px-6 flex justify-between items-center">
          <h1 className={`font-syne font-black text-white leading-none transition-all duration-500 ${isScrolled ? 'text-2xl' : 'text-4xl'}`}>Studio</h1>
          <button onClick={onLock} className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </button>
        </div>
      </header>
      <main className="px-6 pt-6 space-y-4">
        <div onClick={() => onSelectTool('recap')} className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-3xl p-6 cursor-pointer active:scale-95 transition-all">
          <h3 className="font-syne font-black text-2xl text-white mb-2">Récap' Mensuel</h3>
          <p className="text-xs text-white/50 font-medium">Génère tes statistiques du mois.</p>
        </div>
        <div onClick={() => onSelectTool('seance')} className="bg-gradient-to-tr from-white/10 to-transparent border border-white/10 rounded-3xl p-5 cursor-pointer active:scale-95 transition-all">
          <h3 className="font-syne font-black text-lg text-white mb-1">Séance</h3>
          <p className="text-[10px] text-white/50 font-medium">Annonce ton film en story.</p>
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

  // Charge l'affiche TMDB initiale
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

  // Libère les blob URLs à la destruction
  useEffect(() => () => { blobUrlsRef.current.forEach(URL.revokeObjectURL); }, []);

  // Ref toujours à jour pour le rendu
  paramsRef.current = { title, date, time, lang, expectation, posterImg, screeningLabel };

  // Re-render à chaque changement de paramètre
  useEffect(() => {
    if (previewRef.current) renderStoryToCanvas(previewRef.current, paramsRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, date, time, lang, expectation, posterImg, screeningLabel]);

  const assignPreviewRef = useCallback((node) => {
    previewRef.current = node;
    if (node) requestAnimationFrame(() => renderStoryToCanvas(node, paramsRef.current));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scale du canvas de preview
  useEffect(() => {
    const update = () => { if (wrapperRef.current) setPreviewScale(wrapperRef.current.offsetWidth / STORY_W); };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Upload d'une affiche personnalisée
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

        {/* PREVIEW */}
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

        {/* EDITOR */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col gap-5 text-white">
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
        </div>

        {/* ACTIONS */}
        <div className="flex flex-col gap-3">
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
          <button onClick={downloadStory} disabled={isDownloading || !title.trim()}
            className="w-full h-16 rounded-2xl bg-[var(--color-primary)] text-black font-syne font-black text-lg flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-40 disabled:scale-100">
            {isDownloading
              ? <div className="w-6 h-6 border-2 border-black border-t-transparent animate-spin rounded-full"/>
              : (<><svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
                </svg>Partager la Story</>)}
          </button>
        </div>

        <p className="text-center text-white/25 text-xs">Story générée en 1080×1920px — partage natif sur iOS</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RECAP TOOL (placeholder)
// ─────────────────────────────────────────────────────────────────────────────
function RecapTool({ onBack }) {
  return (
    <div className="animate-in fade-in pb-24 flex flex-col min-h-screen bg-[#0C0C0E]">
      <header className="z-40 sticky top-0 w-full bg-[#0C0C0E]/90 backdrop-blur-xl border-b border-white/10 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 px-6 flex justify-between items-center text-white">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h2 className="font-syne font-black text-lg">Récap Mensuel</h2>
        <div className="w-10"/>
      </header>
      <div className="p-6 text-center text-white/50"><p>Bientôt disponible…</p></div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────────────────────────────────────
export function Studio({ historyData, pendingFilm, isScrolled }) {
  const [isUnlocked, setIsUnlocked] = useState(localStorage.getItem('grandecran_studio_unlocked') === 'true');
  const [activeTool, setActiveTool] = useState(null);

  if (!isUnlocked) return <LockScreen onUnlock={() => { setIsUnlocked(true); localStorage.setItem('grandecran_studio_unlocked', 'true'); }}/>;
  if (activeTool === 'recap')  return <RecapTool onBack={() => setActiveTool(null)}/>;
  if (activeTool === 'seance') return <SeanceStoryTool historyData={historyData} pendingFilm={pendingFilm} onBack={() => setActiveTool(null)}/>;
  return <StudioHub isScrolled={isScrolled} onSelectTool={setActiveTool} onLock={() => { setIsUnlocked(false); localStorage.removeItem('grandecran_studio_unlocked'); }}/>;
}