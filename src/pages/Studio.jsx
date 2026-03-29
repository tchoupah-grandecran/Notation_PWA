import { useState, useRef, useEffect, useCallback } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// UTILITAIRES CANVAS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Charge une image via le proxy Vercel pour éviter les erreurs CORS.
 * Retourne une HTMLImageElement prête à être dessinée sur canvas.
 */
async function loadImageViaProxy(originalUrl) {
  if (!originalUrl) return null;

  // Si l'URL est déjà un data: URL ou une URL locale, pas besoin de proxy
  if (originalUrl.startsWith('data:') || originalUrl.startsWith('/') || originalUrl.startsWith('blob:')) {
    return loadImageDirect(originalUrl);
  }

  // Passer par le proxy Vercel
  const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(originalUrl)}`;
  return loadImageDirect(proxyUrl);
}

function loadImageDirect(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload  = () => resolve(img);
    img.onerror = () => resolve(null); // Échec gracieux
    img.src = src;
  });
}

/**
 * Flou d'image sans ctx.filter (compatible Safari/iOS) :
 * on dessine l'image dans un canvas offscreen en petit, puis on la
 * redessine agrandie — l'interpolation bilinéaire crée un flou naturel.
 */
function drawBlurredImage(ctx, img, x, y, w, h, blurRadius = 20) {
  if (!img) return;
  // Étape 1 : réduire l'image (factor = 1/blur)
  const factor = Math.max(1, blurRadius);
  const sw = Math.max(1, Math.round(w / factor));
  const sh = Math.max(1, Math.round(h / factor));

  const offscreen = document.createElement('canvas');
  offscreen.width  = sw;
  offscreen.height = sh;
  const offCtx = offscreen.getContext('2d');

  // cover dans le petit canvas
  const imgRatio    = img.width / img.height;
  const targetRatio = w / h;
  let sx, sy, iw, ih;
  if (imgRatio > targetRatio) {
    ih = img.height; iw = ih * targetRatio;
    sx = (img.width - iw) / 2; sy = 0;
  } else {
    iw = img.width; ih = iw / targetRatio;
    sx = 0; sy = (img.height - ih) / 2;
  }
  offCtx.drawImage(img, sx, sy, iw, ih, 0, 0, sw, sh);

  // Étape 2 : redessiner aggrandi → flou naturel
  ctx.imageSmoothingEnabled  = true;
  ctx.imageSmoothingQuality  = 'high';
  ctx.drawImage(offscreen, 0, 0, sw, sh, x, y, w, h);
}

/**
 * Découpe et dessine une image en "cover" (comme object-fit: cover)
 * sur le canvas dans une zone donnée.
 */
function drawImageCover(ctx, img, x, y, w, h) {
  if (!img) return;
  const imgRatio = img.width / img.height;
  const targetRatio = w / h;
  let sx, sy, sw, sh;
  if (imgRatio > targetRatio) {
    sh = img.height;
    sw = sh * targetRatio;
    sx = (img.width - sw) / 2;
    sy = 0;
  } else {
    sw = img.width;
    sh = sw / targetRatio;
    sx = 0;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

/**
 * Dessine un rectangle arrondi (polyfill pour les vieux navigateurs).
 */
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

/**
 * Découpe le texte pour qu'il tienne dans une largeur max (word-wrap).
 */
function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
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

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTES DE DESIGN STORY
// ─────────────────────────────────────────────────────────────────────────────

const STORY_W = 1080;
const STORY_H = 1920;
const PRIMARY_COLOR = '#E8B200';

const EXPECTATIONS = [
  { label: 'Sceptique',     color: 'rgba(255,255,255,0.4)', barHex: 'rgba(255,255,255,0.4)' },
  { label: 'Curieux',       color: '#60A5FA',               barHex: '#60A5FA' },
  { label: 'Intrigué',      color: '#C084FC',               barHex: '#C084FC' },
  { label: 'Très impatient',color: '#FB923C',               barHex: '#FB923C' },
  { label: 'Hype absolue',  color: PRIMARY_COLOR,           barHex: PRIMARY_COLOR },
];

// ─────────────────────────────────────────────────────────────────────────────
// MOTEUR DE RENDU CANVAS
// ─────────────────────────────────────────────────────────────────────────────

async function renderStoryToCanvas(canvas, { title, date, time, lang, expectation, posterImg, screeningLabel }) {
  const ctx = canvas.getContext('2d');
  canvas.width = STORY_W;
  canvas.height = STORY_H;

  // ── Fond
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, STORY_W, STORY_H);

  // ── Affiche (fond flou compatible Safari + affiche nette)
  if (posterImg) {
    // Couche floue en fond (sans ctx.filter — compatible iOS Safari)
    ctx.save();
    ctx.globalAlpha = 0.38;
    const overshoot = 120; // dépasse le cadre pour éviter les bords blancs
    drawBlurredImage(
      ctx, posterImg,
      -overshoot, -overshoot,
      STORY_W + overshoot * 2, STORY_H + overshoot * 2,
      28
    );
    ctx.globalAlpha = 1;
    ctx.restore();

    // Affiche nette par-dessus
    ctx.save();
    ctx.globalAlpha = 0.88;
    drawImageCover(ctx, posterImg, 0, 0, STORY_W, STORY_H);
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // ── Dégradé sombre (du bas vers le haut) pour lisibilité
  const grad = ctx.createLinearGradient(0, 0, 0, STORY_H);
  grad.addColorStop(0,    'rgba(0,0,0,0.55)');
  grad.addColorStop(0.35, 'rgba(0,0,0,0.05)');
  grad.addColorStop(0.6,  'rgba(0,0,0,0.4)');
  grad.addColorStop(1,    'rgba(0,0,0,0.97)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, STORY_W, STORY_H);

  // ─────────────────────────────────────────────────────────────────────────
  // BADGE "2026 — Séance #N"  (en haut à gauche)
  // ─────────────────────────────────────────────────────────────────────────
  const badgeText = screeningLabel.toUpperCase();
  ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
  const badgeMetrics = ctx.measureText(badgeText);
  const badgePadX = 48, badgePadY = 28;
  const badgeW = badgeMetrics.width + badgePadX * 2;
  const badgeH = 90;
  const badgeX = 64, badgeY = 120;

  // Fond du badge
  ctx.save();
  ctx.globalAlpha = 0.88;
  ctx.fillStyle = '#1C1C1E';
  roundRect(ctx, badgeX, badgeY, badgeW, badgeH, badgeH / 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.restore();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 34px system-ui, -apple-system, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(badgeText, badgeX + badgePadX, badgeY + badgeH / 2);

  // ─────────────────────────────────────────────────────────────────────────
  // TITRE DU FILM
  // ─────────────────────────────────────────────────────────────────────────
  const TITLE_FONT_SIZE = 108;
  const TITLE_MAX_W = STORY_W - 128;
  ctx.font = `900 ${TITLE_FONT_SIZE}px system-ui, -apple-system, sans-serif`;
  ctx.textBaseline = 'top';

  // Réduire la taille si le titre est très long
  let fontSize = TITLE_FONT_SIZE;
  while (fontSize > 60) {
    ctx.font = `900 ${fontSize}px system-ui, -apple-system, sans-serif`;
    const lines = wrapText(ctx, title || 'Titre du film', TITLE_MAX_W);
    if (lines.length <= 3) break;
    fontSize -= 8;
  }

  const titleLines = wrapText(ctx, title || 'Titre du film', TITLE_MAX_W);
  const titleLineH = fontSize * 1.0;
  const totalTitleH = titleLines.length * titleLineH;

  // Zone du bas réservée aux infos : 680px depuis le bas
  const BOTTOM_ZONE_TOP = STORY_H - 680;
  const titleY = BOTTOM_ZONE_TOP - totalTitleH - 40;

  // Ombre portée sur le titre
  ctx.shadowColor = 'rgba(0,0,0,0.9)';
  ctx.shadowBlur = 30;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle = '#FFFFFF';

  titleLines.forEach((line, i) => {
    ctx.fillText(line, 64, titleY + i * titleLineH);
  });
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  // ─────────────────────────────────────────────────────────────────────────
  // BADGES INFO (Date / Heure / Langue)
  // ─────────────────────────────────────────────────────────────────────────
  const badges = [
    { text: date,                  accent: false },
    { text: time.replace(':', 'h'), accent: false },
    { text: lang,                  accent: true  },
  ];

  const BADGE_H = 88;
  const BADGE_FONT = 'bold 42px system-ui, -apple-system, sans-serif';
  ctx.font = BADGE_FONT;
  ctx.textBaseline = 'middle';

  let bx = 64;
  const by = BOTTOM_ZONE_TOP + 20;

  for (const b of badges) {
    const tw = ctx.measureText(b.text).width;
    const bw = tw + 80;

    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.fillStyle = '#1C1C1E';
    roundRect(ctx, bx, by, bw, BADGE_H, BADGE_H / 2);
    ctx.fill();
    ctx.strokeStyle = b.accent ? `${PRIMARY_COLOR}60` : 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.restore();

    ctx.fillStyle = b.accent ? PRIMARY_COLOR : '#FFFFFF';
    ctx.font = BADGE_FONT;
    ctx.fillText(b.text, bx + 40, by + BADGE_H / 2);

    bx += bw + 18;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // HYPE METER CARD
  // ─────────────────────────────────────────────────────────────────────────
  const CARD_X = 64;
  const CARD_Y = by + BADGE_H + 50;
  const CARD_W = STORY_W - 128;
  const CARD_H = 260;
  const CARD_R = 56;

  // Fond de la carte
  ctx.save();
  ctx.globalAlpha = 0.72;
  ctx.fillStyle = '#000000';
  roundRect(ctx, CARD_X, CARD_Y, CARD_W, CARD_H, CARD_R);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.restore();

  // Label "HYPE METER"
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
  ctx.textBaseline = 'top';
  ctx.fillText('HYPE  METER', CARD_X + 52, CARD_Y + 44); // espaces pour simuler letter-spacing

  // Label d'expectation
  const expLabel = EXPECTATIONS[expectation].label;
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `900 italic 68px system-ui, -apple-system, sans-serif`;
  ctx.textBaseline = 'top';
  ctx.fillText(expLabel, CARD_X + 52, CARD_Y + 82);

  // Score N/5
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.font = `900 italic 88px system-ui, -apple-system, sans-serif`;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'right';
  ctx.fillText(`${expectation + 1}/5`, CARD_X + CARD_W - 52, CARD_Y + 54);
  ctx.textAlign = 'left';

  // Barres de progression
  const BAR_Y = CARD_Y + CARD_H - 60;
  const BAR_H = 22;
  const BAR_GAP = 14;
  const TOTAL_BAR_W = CARD_W - 104;
  const barW = (TOTAL_BAR_W - BAR_GAP * 4) / 5;

  for (let i = 0; i < 5; i++) {
    const bBarX = CARD_X + 52 + i * (barW + BAR_GAP);
    roundRect(ctx, bBarX, BAR_Y, barW, BAR_H, BAR_H / 2);
    if (i <= expectation) {
      ctx.fillStyle = EXPECTATIONS[i].barHex;
      // Légère lueur sur la barre active
      ctx.shadowColor = EXPECTATIONS[i].barHex;
      ctx.shadowBlur = 12;
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.shadowBlur = 0;
    }
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  return canvas;
}

// ─────────────────────────────────────────────────────────────────────────────
// ── 1. Écran de verrouillage
// ─────────────────────────────────────────────────────────────────────────────
function LockScreen({ onUnlock }) {
  const [password, setPassword] = useState('');
  const STUDIO_PASSWORD = 'POPCORN';
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
      <div className="w-20 h-20 bg-white/5 rounded-full border border-white/10 flex items-center justify-center mb-6 shadow-2xl">
        <svg className="w-8 h-8 text-[var(--color-primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>
      <h2 className="font-syne font-black text-3xl mb-2 text-white">Zone Sécurisée</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (password.toUpperCase() === STUDIO_PASSWORD) onUnlock();
          else { alert('Mot de passe incorrect'); setPassword(''); }
        }}
        className="flex flex-col gap-4 w-full max-w-xs"
      >
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="bg-black/40 border border-white/10 rounded-2xl p-4 text-center font-bold tracking-widest outline-none focus:border-[var(--color-primary)] transition-colors text-white"
        />
        <button
          type="submit"
          className="bg-[var(--color-primary)] text-black font-black uppercase tracking-widest py-4 rounded-2xl active:scale-95 transition-transform"
        >
          Déverrouiller
        </button>
      </form>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ── 2. Hub Studio
// ─────────────────────────────────────────────────────────────────────────────
function StudioHub({ isScrolled, onSelectTool, onLock }) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      <header
        className={`z-40 sticky top-0 w-full transition-all duration-500 bg-[var(--color-bg)]/80 backdrop-blur-2xl border-b ${
          isScrolled ? 'pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-3 border-white/10 shadow-lg' : 'pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-5 border-transparent'
        }`}
      >
        <div className="px-6 flex justify-between items-center">
          <h1 className={`font-syne font-black text-white leading-none transition-all duration-500 ${isScrolled ? 'text-2xl' : 'text-4xl'}`}>
            Studio
          </h1>
          <button
            onClick={onLock}
            className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </button>
        </div>
      </header>
      <main className="px-6 pt-6 space-y-4">
        <div
          onClick={() => onSelectTool('recap')}
          className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-3xl p-6 relative overflow-hidden cursor-pointer group active:scale-95 transition-all"
        >
          <h3 className="font-syne font-black text-2xl text-white mb-2">Récap' Mensuel</h3>
          <p className="text-xs text-white/50 font-medium">Génère tes statistiques du mois.</p>
        </div>
        <div
          onClick={() => onSelectTool('seance')}
          className="bg-gradient-to-tr from-white/10 to-transparent border border-white/10 rounded-3xl p-5 cursor-pointer active:scale-95 transition-all"
        >
          <h3 className="font-syne font-black text-lg text-white mb-1">Séance</h3>
          <p className="text-[10px] text-white/50 font-medium">Annonce ton film en story.</p>
        </div>
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ── 3. Outil Story Séance — Rendu 100% Canvas
// ─────────────────────────────────────────────────────────────────────────────
function SeanceStoryTool({ historyData = [], onBack, pendingFilm }) {
  const [title, setTitle]           = useState(pendingFilm?.titre || '');
  const [date, setDate]             = useState(pendingFilm?.date  || new Date().toLocaleDateString('fr-FR'));
  const [time, setTime]             = useState(pendingFilm?.heure ? pendingFilm.heure.replace('h', ':') : '20:00');
  const [lang, setLang]             = useState(pendingFilm?.langue || 'VOSTFR');
  const [expectation, setExpectation] = useState(2);
  const [isDownloading, setIsDownloading] = useState(false);
  const [posterImg, setPosterImg]   = useState(null);
  const [posterLoading, setPosterLoading] = useState(false);

  const canvasRef   = useRef(null);   // (non utilisé mais conservé pour compatibilité)
  const previewRef  = useRef(null);   // Canvas de prévisualisation (scale adaptatif)
  const wrapperRef  = useRef(null);

  // ── Calcul du numéro de séance
  const currentYear = date ? date.split('/')[2] : new Date().getFullYear().toString();
  const yearlyScreeningNumber =
    (historyData || []).filter((f) => f.date && f.date.endsWith(currentYear)).length + 1;
  const screeningLabel = `${currentYear} — Séance #${yearlyScreeningNumber}`;

  // ── Chargement de l'affiche via proxy
  useEffect(() => {
    if (!pendingFilm?.affiche) {
      setPosterImg(null);
      return;
    }
    setPosterLoading(true);
    loadImageViaProxy(pendingFilm.affiche).then((img) => {
      setPosterImg(img);
      setPosterLoading(false);
    });
  }, [pendingFilm?.affiche]);

  // ── Rendu canvas — fonction stable référencée par ref
  const renderParamsRef = useRef({});
  renderParamsRef.current = { title, date, time, lang, expectation, posterImg, screeningLabel };

  const triggerRender = useCallback(() => {
    const canvas = previewRef.current;
    if (!canvas) return;
    renderStoryToCanvas(canvas, renderParamsRef.current);
  }, []); // stable — accède aux params via ref

  // Rendu à chaque changement de valeur
  useEffect(() => {
    triggerRender();
  }, [title, date, time, lang, expectation, posterImg, screeningLabel, triggerRender]);

  // Callback ref : déclenche le premier rendu dès que le canvas est monté dans le DOM
  const setPreviewRef = useCallback((node) => {
    previewRef.current = node;
    if (node) triggerRender(); // rendu immédiat au montage
  }, [triggerRender]);

  // ── Scale CSS du canvas de prévisualisation
  const [previewScale, setPreviewScale] = useState(0.3);
  useEffect(() => {
    const update = () => {
      if (wrapperRef.current) setPreviewScale(wrapperRef.current.offsetWidth / STORY_W);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // ── Téléchargement / partage
  const downloadStory = useCallback(async () => {
    if (isDownloading) return;
    setIsDownloading(true);

    try {
      // Rendu haute résolution dans un canvas dédié (params toujours frais via ref)
      const exportCanvas = document.createElement('canvas');
      await renderStoryToCanvas(exportCanvas, renderParamsRef.current);

      exportCanvas.toBlob(async (blob) => {
        if (!blob) { alert('Erreur lors de la génération.'); setIsDownloading(false); return; }

        const snapTitle = renderParamsRef.current.title;
        const snapNum   = yearlyScreeningNumber;
        const file = new File([blob], `seance_${snapNum}.png`, { type: 'image/png' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({ files: [file], title: `Séance #${snapNum} — ${snapTitle}` });
          } catch (shareErr) {
            if (shareErr.name !== 'AbortError') console.error(shareErr);
          }
        } else {
          const url = URL.createObjectURL(blob);
          const a   = document.createElement('a');
          a.href     = url;
          a.download = `story_seance_${snapNum}.png`;
          a.click();
          setTimeout(() => URL.revokeObjectURL(url), 5000);
        }
        setIsDownloading(false);
      }, 'image/png');
    } catch (err) {
      console.error(err);
      alert('Une erreur est survenue. Réessaie.');
      setIsDownloading(false);
    }
  }, [isDownloading, yearlyScreeningNumber]);

  return (
    <div className="animate-in fade-in pb-24 flex flex-col min-h-screen bg-[#0C0C0E] overflow-x-hidden">
      {/* Header */}
      <header className="z-40 sticky top-0 w-full bg-[#0C0C0E]/90 backdrop-blur-xl border-b border-white/10 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 px-6 flex justify-between items-center text-white">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h2 className="font-syne font-black text-lg">Story Séance</h2>
        <div className="w-10" />
      </header>

      <div className="px-6 py-6 flex flex-col gap-8">

        {/* ── PRÉVISUALISATION CANVAS ── */}
        <div
          ref={wrapperRef}
          className="w-full relative bg-black rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl"
          style={{ aspectRatio: '9/16' }}
        >
          {/* Indicateur de chargement de l'affiche */}
          {posterLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/60 rounded-[2rem]">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
                <span className="text-white/60 text-xs font-medium">Chargement de l'affiche…</span>
              </div>
            </div>
          )}
          <canvas
            ref={setPreviewRef}
            width={STORY_W}
            height={STORY_H}
            className="absolute top-0 left-0 origin-top-left"
            style={{
              width:  `${STORY_W}px`,
              height: `${STORY_H}px`,
              transform: `scale(${previewScale})`,
            }}
          />
        </div>

        {/* ── ÉDITEUR ── */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col gap-5 text-white">

          {/* Titre */}
          <div>
            <label className="text-white/40 text-xs font-bold uppercase tracking-widest mb-2 block">Titre du film</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex : Interstellar"
              className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 font-bold outline-none focus:border-[var(--color-primary)] transition-colors"
            />
          </div>

          {/* Date + Heure */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-white/40 text-xs font-bold uppercase tracking-widest mb-2 block">Date</label>
              <input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-center outline-none focus:border-[var(--color-primary)] transition-colors"
              />
            </div>
            <div>
              <label className="text-white/40 text-xs font-bold uppercase tracking-widest mb-2 block">Heure</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-center outline-none focus:border-[var(--color-primary)] transition-colors"
              />
            </div>
          </div>

          {/* Langue */}
          <div>
            <label className="text-white/40 text-xs font-bold uppercase tracking-widest mb-2 block">Version</label>
            <div className="flex gap-2">
              {['VOSTFR', 'VF', 'VO'].map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
                    lang === l
                      ? 'bg-[var(--color-primary)] text-black'
                      : 'bg-black/40 border border-white/10 text-white/60'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Hype Meter */}
          <div>
            <label className="text-white/40 text-xs font-bold uppercase tracking-widest mb-3 block">
              Hype Meter — <span className="text-white/70">{EXPECTATIONS[expectation].label}</span>
            </label>
            <div className="flex gap-2">
              {EXPECTATIONS.map((exp, i) => (
                <button
                  key={i}
                  onClick={() => setExpectation(i)}
                  className="flex-1 h-10 rounded-full transition-all active:scale-95"
                  style={{
                    background: i <= expectation ? exp.barHex : 'rgba(255,255,255,0.1)',
                    boxShadow: i <= expectation && i === expectation ? `0 0 12px ${exp.barHex}` : 'none',
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── BOUTON PARTAGER ── */}
        <button
          onClick={downloadStory}
          disabled={isDownloading || !title.trim()}
          className="w-full h-16 rounded-2xl bg-[var(--color-primary)] text-black font-syne font-black text-lg flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-40 disabled:scale-100"
        >
          {isDownloading ? (
            <div className="w-6 h-6 border-2 border-black border-t-transparent animate-spin rounded-full" />
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
              Partager la Story
            </>
          )}
        </button>

        {/* Note technique */}
        <p className="text-center text-white/25 text-xs leading-relaxed">
          La story est générée en 1080×1920px.{'\n'}
          Sur iOS, elle s'ouvrira dans le menu de partage natif.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ── 4. Outil Récap Mensuel
// ─────────────────────────────────────────────────────────────────────────────
function RecapTool({ historyData = [], onBack }) {
  return (
    <div className="animate-in fade-in pb-24 flex flex-col min-h-screen bg-[#0C0C0E]">
      <header className="z-40 sticky top-0 w-full bg-[#0C0C0E]/90 backdrop-blur-xl border-b border-white/10 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 px-6 flex justify-between items-center text-white">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h2 className="font-syne font-black text-lg">Récap Mensuel</h2>
        <div className="w-10" />
      </header>
      <div className="p-6 text-center text-white/50">
        <p>Bientôt disponible…</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ── 5. Composant principal Studio
// ─────────────────────────────────────────────────────────────────────────────
export function Studio({ historyData, pendingFilm, isScrolled }) {
  const [isUnlocked, setIsUnlocked] = useState(
    localStorage.getItem('grandecran_studio_unlocked') === 'true'
  );
  const [activeTool, setActiveTool] = useState(null);

  if (!isUnlocked) {
    return (
      <LockScreen
        onUnlock={() => {
          setIsUnlocked(true);
          localStorage.setItem('grandecran_studio_unlocked', 'true');
        }}
      />
    );
  }
  if (activeTool === 'recap') {
    return <RecapTool historyData={historyData} onBack={() => setActiveTool(null)} />;
  }
  if (activeTool === 'seance') {
    return (
      <SeanceStoryTool
        historyData={historyData}
        pendingFilm={pendingFilm}
        onBack={() => setActiveTool(null)}
      />
    );
  }
  return (
    <StudioHub
      isScrolled={isScrolled}
      onSelectTool={setActiveTool}
      onLock={() => {
        setIsUnlocked(false);
        localStorage.removeItem('grandecran_studio_unlocked');
      }}
    />
  );
}