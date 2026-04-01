import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Download, PenLine, X, Plus } from 'lucide-react';
import { getMovieDetailsWithCast } from '../api';

const SHARE_W = 1080;
const SHARE_H = 1350;
const INSTA_LOGO_URL = 'https://i.imgur.com/aJWAYr7.png';
const GOLD = '#E8B200';
const FONT_SANS = "'DM Sans', sans-serif";
const FONT_SYNE = "'Syne', sans-serif";

// ==========================================
// UTILITAIRES
// ==========================================
const proxyUrl = (url) => {
  if (!url) return '';
  const proxyBase = import.meta.env.DEV ? '/tmdb-proxy' : '/api/proxy-image';
  return `${proxyBase}?url=${encodeURIComponent(url)}`;
};

const loadImage = (src) => new Promise((res) => {
  if (!src) return res(null);
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => res(img);
  img.onerror = () => res(null);
  img.src = src;
});

const drawImageCover = (ctx, img, x, y, w, h) => {
  if (!img) return;
  const imgRatio = img.naturalWidth / img.naturalHeight;
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
};

const roundRect = (ctx, x, y, w, h, r) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r); ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r); ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r); ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r); ctx.closePath();
};

const wrapText = (ctx, text, maxWidth) => {
  const words = (text || '').split(' ');
  const lines = [];
  let currentLine = words[0] || '';
  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + " " + word).width;
    if (width < maxWidth) { currentLine += " " + word; } 
    else { lines.push(currentLine); currentLine = word; }
  }
  lines.push(currentLine);
  return lines;
};

const extractPoints = (comment, type) => {
  if (!comment) return [];
  const prefix = type === 'positif' ? '+' : '-';
  return comment.split('\n').map(l => l.trim()).filter(l => l.startsWith(prefix)).map(l => {
    const parts = l.replace(/^[+-]\s*/, '').split('|').map(p => p.trim());
    return { title: parts[0] || '', detail: parts[1] || '' };
  });
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const parts = dateStr.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
};

// ==========================================
// MOTEUR DE DESSIN CANVAS
// ==========================================
const renderShareSlideToCanvas = async (canvas, slideIdx, params) => {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const { film, movieDetails, pros, cons, yearlyIndex, historyData, pendingFilm, imageCache, ratingScale, selectedIdx } = params;

  try {
    ctx.clearRect(0, 0, SHARE_W, SHARE_H);
    const logoImg = imageCache.current[INSTA_LOGO_URL];
    
    const drawSharedHeader = (isLight = false) => {
      if (logoImg) {
        ctx.save(); ctx.beginPath(); ctx.arc(SHARE_W - 64, 64, 30, 0, Math.PI * 2); ctx.clip();
        ctx.drawImage(logoImg, SHARE_W - 94, 34, 60, 60); ctx.restore();
      }
      ctx.font = `bold 24px ${FONT_SANS}`;
      ctx.fillStyle = isLight ? 'rgba(30,30,30,0.3)' : 'rgba(255,255,255,0.3)';
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.fillText(film.titre || '', SHARE_W - 110, 64);
    };

    const drawSharedFooter = (isLight = false) => {
      ctx.strokeStyle = isLight ? 'rgba(30,30,30,0.07)' : 'rgba(255,255,255,0.07)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, SHARE_H - 100); ctx.lineTo(SHARE_W, SHARE_H - 100); ctx.stroke();
      
      ctx.font = `800 24px ${FONT_SYNE}`;
      ctx.fillStyle = isLight ? 'rgba(30,30,30,0.25)' : 'rgba(255,255,255,0.2)';
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(film.titre || '', 48, SHARE_H - 50);
      
      ctx.font = `bold 20px ${FONT_SANS}`;
      ctx.textAlign = 'right';
      ctx.fillText(`${slideIdx + 1} / 6`, SHARE_W - 48, SHARE_H - 50);
    };

    if (slideIdx === 0) {
      // === SLIDE 1 : AFFICHE ===
      ctx.fillStyle = '#0A0A0A'; ctx.fillRect(0, 0, SHARE_W, SHARE_H);
      const poster = imageCache.current[proxyUrl(film.affiche)];
      if (poster) drawImageCover(ctx, poster, 0, 0, SHARE_W, SHARE_H);
      
      const g1 = ctx.createLinearGradient(0, SHARE_H * 0.4, 0, SHARE_H);
      g1.addColorStop(0, 'rgba(0,0,0,0)'); g1.addColorStop(0.5, 'rgba(0,0,0,0.5)'); g1.addColorStop(1, 'rgba(0,0,0,0.98)');
      ctx.fillStyle = g1; ctx.fillRect(0, 0, SHARE_W, SHARE_H);
      
      drawSharedHeader(false);

      const metaText = `${film.genre || 'Cinéma'}   ·   ${film.duree || '—'}   ·   ${film.langue || '—'}`;
      const metaBaseY = SHARE_H - 60; 

      ctx.font = `800 78px ${FONT_SYNE}`;
      const lines = wrapText(ctx, film.titre || '', SHARE_W - 96);
      const titleLineHeight = 85;
      const titleStartY = metaBaseY - 40 - (lines.length * titleLineHeight);

      ctx.font = `500 24px ${FONT_SANS}`; ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
      ctx.fillText(metaText, 48, metaBaseY);

      ctx.font = `800 78px ${FONT_SYNE}`; ctx.fillStyle = '#FFF'; ctx.textBaseline = 'top';
      lines.forEach((line, i) => ctx.fillText(line, 48, titleStartY + (i * titleLineHeight)));

      const pillY = titleStartY - 30;
      ctx.fillStyle = GOLD; roundRect(ctx, 48, pillY - 14, 60, 6, 3); ctx.fill();
      ctx.font = `bold 21px ${FONT_SANS}`; ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.textBaseline = 'middle';
      ctx.fillText(`#${yearlyIndex}`, 125, pillY - 11);

    } else if (slideIdx === 1) {
      // === SLIDE 2 : FICHE ===
      ctx.fillStyle = '#0C0C0C'; ctx.fillRect(0, 0, SHARE_W, SHARE_H);
      const poster = imageCache.current[proxyUrl(film.affiche)];
      if (poster) {
        ctx.globalAlpha = 0.12; drawImageCover(ctx, poster, 0, 0, SHARE_W, SHARE_H); ctx.globalAlpha = 1;
        const g2 = ctx.createRadialGradient(SHARE_W/2, SHARE_H, 0, SHARE_W/2, SHARE_H, 1000);
        g2.addColorStop(0, 'transparent'); g2.addColorStop(1, '#0C0C0C');
        ctx.fillStyle = g2; ctx.fillRect(0, 0, SHARE_W, SHARE_H);
      }
      
      drawSharedHeader(false);
      
      ctx.font = `bold 21px ${FONT_SANS}`; ctx.fillStyle = GOLD; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText("LE FILM", 48, 150);
      
      ctx.font = `800 51px ${FONT_SYNE}`; ctx.fillStyle = '#FFF';
      const titleLines = wrapText(ctx, film.titre || '—', SHARE_W - 96);
      const titleLineHeight = 55;
      titleLines.forEach((line, i) => ctx.fillText(line, 48, 180 + (i * titleLineHeight)));
      
      let currentY = 180 + (titleLines.length * titleLineHeight);
      
      ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(48, currentY + 15); ctx.lineTo(SHARE_W - 48, currentY + 15); ctx.stroke();

      ctx.font = `bold 18px ${FONT_SANS}`; ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillText("RÉAL.", 48, currentY + 45);
      ctx.font = `800 66px ${FONT_SYNE}`; ctx.fillStyle = '#FFF';
      ctx.fillText(movieDetails?.credits?.crew?.find(c => c.job === 'Director')?.name || '—', 48, currentY + 75);

      ctx.font = `bold 18px ${FONT_SANS}`; ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillText("AVEC", 48, currentY + 175);
      
      const cast = movieDetails?.credits?.cast?.slice(0, 6) || [];
      let cy = currentY + 205;
      cast.forEach((c, i) => {
        const isRightCol = i % 2 !== 0;
        const cx = isRightCol ? (SHARE_W / 2) + 24 : 48;
        if (isRightCol && i > 0) cy -= 100;

        const castImg = imageCache.current[proxyUrl(`https://image.tmdb.org/t/p/w185${c.profile_path}`)];
        ctx.save(); ctx.beginPath(); ctx.arc(cx + 42, cy + 42, 42, 0, Math.PI * 2); ctx.clip();
        if (castImg) { ctx.drawImage(castImg, cx, cy, 84, 84); } 
        else { 
          ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.fill(); 
          ctx.fillStyle='rgba(255,255,255,0.3)'; ctx.font=`bold 24px ${FONT_SYNE}`; ctx.textAlign='center'; ctx.textBaseline='middle'; 
          ctx.fillText(c.name.substring(0,2).toUpperCase(), cx+42, cy+42); 
        }
        ctx.restore();

        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.font = `bold 30px ${FONT_SANS}`; ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fillText(c.name, cx + 100, cy + 12);
        ctx.font = `italic 24px ${FONT_SANS}`; ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillText(c.character || '—', cx + 100, cy + 46);
        
        cy += 100;
      });

      ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(48, 1080); ctx.lineTo(SHARE_W - 48, 1080); ctx.stroke();
      
      const cols = ["GENRE", "SORTIE", "DURÉE", "VERSION"];
      const vals = [film.genre, formatDate(movieDetails?.release_date), film.duree, film.langue];
      
      cols.forEach((col, i) => {
        const x = 48 + i * ((SHARE_W - 96) / 4);
        ctx.font = `bold 36px ${FONT_SYNE}`; ctx.fillStyle = '#FFF';
        ctx.fillText(vals[i] || '—', x, 1110);
        ctx.font = `bold 19px ${FONT_SANS}`; ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.fillText(col, x, 1160);
        if (i > 0) { ctx.beginPath(); ctx.moveTo(x - 20, 1100); ctx.lineTo(x - 20, 1180); ctx.stroke(); }
      });

      drawSharedFooter(false);

    } else if (slideIdx === 2) {
      // === SLIDE 3 : NOTE ===
      ctx.fillStyle = '#FFFDF2'; ctx.fillRect(0, 0, SHARE_W, SHARE_H);
      drawSharedHeader(true);
      
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.font = `bold 21px ${FONT_SANS}`; ctx.fillStyle = 'rgba(30,30,30,0.3)';
      ctx.fillText('MA NOTE', SHARE_W / 2, 380);
      
      const rating = parseFloat(String(film.note || 0).replace(',', '.')) || 0;
      const intPart = Math.floor(rating);
      const decPart = (rating % 1 === 0) ? '.0' : ('.' + Math.round((rating % 1) * 10));
      
      ctx.font = `800 270px ${FONT_SYNE}`; const wInt = ctx.measureText(intPart).width;
      ctx.font = `800 102px ${FONT_SYNE}`; const wDec = ctx.measureText(decPart).width;
      ctx.font = `bold 27px ${FONT_SANS}`; const wScale = ctx.measureText(`/ ${ratingScale}`).width;
      
      const wRight = Math.max(wDec, wScale);
      const gap = 15; 
      const totalW = wInt + gap + wRight;
      const startX = (SHARE_W - totalW) / 2;
      const baseY = 420;
      
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.font = `800 270px ${FONT_SYNE}`; ctx.fillStyle = '#1E1E1E';
      ctx.fillText(intPart, startX, baseY);
      
      const rightX = startX + wInt + gap;
      ctx.font = `800 102px ${FONT_SYNE}`; ctx.fillStyle = GOLD;
      ctx.fillText(decPart, rightX, baseY + 35);
      
      ctx.font = `bold 27px ${FONT_SANS}`; ctx.fillStyle = 'rgba(30,30,30,0.3)';
      ctx.fillText(`/ ${ratingScale}`, rightX + 5, baseY + 145);

      const starW = 42; const starGap = 12;
      const totalStarW = (5 * starW) + (4 * starGap);
      const starStartX = (SHARE_W - totalStarW) / 2;
      const starY = baseY + 320; 

      for (let i = 0; i < 5; i++) {
        const filled = i < Math.floor(rating);
        const half = !filled && (rating % 1 >= 0.5) && i === Math.floor(rating);
        const cx = starStartX + i * (starW + starGap) + starW / 2;
        const cy = starY + starW / 2;
        
        ctx.save(); ctx.translate(cx, cy); ctx.scale(21, 21);
        const sp = new Path2D('M 0 -1 L 0.29 -0.40 L 0.95 -0.31 L 0.48 0.15 L 0.59 0.81 L 0 0.50 L -0.59 0.81 L -0.48 0.15 L -0.95 -0.31 L -0.29 -0.40 Z');
        if (half) {
          ctx.save(); ctx.beginPath(); ctx.rect(-1, -1, 1, 2); ctx.clip(); ctx.fillStyle = GOLD; ctx.fill(sp); ctx.restore();
          ctx.save(); ctx.beginPath(); ctx.rect(0, -1, 1, 2); ctx.clip(); ctx.fillStyle = 'rgba(30,30,30,0.12)'; ctx.fill(sp); ctx.restore();
        } else {
          ctx.fillStyle = filled ? GOLD : 'rgba(30,30,30,0.12)'; ctx.fill(sp);
        }
        ctx.restore();
      }

      const ruleY = starY + 70;
      ctx.strokeStyle = 'rgba(30,30,30,0.12)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(SHARE_W / 2 - 48, ruleY); ctx.lineTo(SHARE_W / 2 + 48, ruleY); ctx.stroke();

      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.font = `500 33px ${FONT_SYNE}`; ctx.fillStyle = 'rgba(30,30,30,0.55)';
      const verdictLines = wrapText(ctx, film.commentaire || film.titre, SHARE_W - 200);
      verdictLines.forEach((l, idx) => ctx.fillText(l, SHARE_W / 2, ruleY + 40 + (idx * 45)));

      if (film.coupDeCoeur) {
        const bY = ruleY + 40 + (verdictLines.length * 45) + 30;
        ctx.fillStyle = 'rgba(200,50,50,0.06)'; roundRect(ctx, SHARE_W/2 - 120, bY, 240, 48, 24); ctx.fill();
        ctx.strokeStyle = 'rgba(200,50,50,0.2)'; ctx.lineWidth = 1; ctx.stroke();
        ctx.font = `bold 18px ${FONT_SANS}`; ctx.fillStyle = 'rgba(30,30,30,0.45)'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('❤️ COUP DE CŒUR', SHARE_W/2, bY + 24);
      }

      drawSharedFooter(true);

    } else if (slideIdx === 3 || slideIdx === 4) {
      // === SLIDES 4 & 5 : POINTS ===
      const isPros = slideIdx === 3;
      ctx.fillStyle = isPros ? '#0C0C0C' : '#FFFDF2'; ctx.fillRect(0, 0, SHARE_W, SHARE_H);
      
      const poster = imageCache.current[proxyUrl(film.affiche)];
      if (poster) {
        ctx.globalAlpha = isPros ? 0.12 : 0.06;
        drawImageCover(ctx, poster, 0, 0, SHARE_W, SHARE_H); ctx.globalAlpha = 1;
      }
      
      const gP = ctx.createLinearGradient(0, 0, 0, SHARE_H);
      gP.addColorStop(0, isPros ? 'rgba(12,12,12,0.8)' : 'rgba(255,253,242,0.8)'); gP.addColorStop(1, isPros ? '#0C0C0C' : '#FFFDF2');
      ctx.fillStyle = gP; ctx.fillRect(0, 0, SHARE_W, SHARE_H);

      drawSharedHeader(!isPros);
      
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.font = `bold 21px ${FONT_SANS}`; ctx.fillStyle = isPros ? GOLD : 'rgba(30,30,30,0.3)';
      ctx.fillText(isPros ? "✦ POINTS FORTS" : "– POINTS FAIBLES", 48, 150);
      ctx.font = `800 72px ${FONT_SYNE}`; ctx.fillStyle = isPros ? '#FFF' : '#1E1E1E';
      ctx.fillText("Ce qui m'a", 48, 185);
      ctx.fillStyle = isPros ? GOLD : 'rgba(30,30,30,0.42)';
      ctx.fillText(isPros ? "convaincu" : "moins convaincu", 48, 265);
      
      ctx.strokeStyle = isPros ? 'rgba(255,255,255,0.07)' : 'rgba(30,30,30,0.09)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(48, 360); ctx.lineTo(SHARE_W - 48, 360); ctx.stroke();

      let startY = 400;
      const items = isPros ? pros : cons;
      const validItems = items.filter(p => p.title.trim() !== '');

      if (validItems.length === 0) {
        if (!isPros && ((parseFloat(String(film.note||0).replace(',','.')) / ratingScale) >= 0.76)) {
          ctx.fillStyle = 'rgba(30,30,30,0.04)'; roundRect(ctx, 48, startY, SHARE_W - 96, 120, 8); ctx.fill();
          ctx.fillStyle = 'rgba(30,30,30,0.12)'; ctx.fillRect(48, startY, 6, 120);
          ctx.font = `italic 24px ${FONT_SANS}`; ctx.fillStyle = 'rgba(30,30,30,0.45)';
          const noteLines = wrapText(ctx, "Difficile de trouver vraiment à redire — les quelques bémols sont mineurs face à l'ensemble.", SHARE_W - 140);
          noteLines.forEach((l, idx) => ctx.fillText(l, 80, startY + 30 + (idx * 35)));
        } else {
          ctx.font = `bold 22.5px ${FONT_SANS}`; ctx.fillStyle = isPros ? 'rgba(255,255,255,0.3)' : 'rgba(30,30,30,0.25)';
          ctx.fillText(`—`, 48, startY + 5);
          ctx.font = `bold 33px ${FONT_SYNE}`; ctx.fillStyle = isPros ? 'rgba(255,255,255,0.3)' : 'rgba(30,30,30,0.3)';
          ctx.fillText("À compléter", 110, startY);
        }
      } else {
        validItems.forEach((p, i) => {
          ctx.font = `bold 22.5px ${FONT_SANS}`; ctx.fillStyle = isPros ? 'rgba(232,178,0,0.7)' : 'rgba(30,30,30,0.25)';
          ctx.fillText(`0${i+1}`, 48, startY + 5);
          ctx.font = `bold 33px ${FONT_SYNE}`; ctx.fillStyle = isPros ? '#FFF' : '#1E1E1E';
          ctx.fillText(p.title, 110, startY);
          if (p.detail) {
            ctx.font = `normal 25.5px ${FONT_SANS}`; ctx.fillStyle = isPros ? 'rgba(255,255,255,0.4)' : 'rgba(30,30,30,0.45)';
            const lines = wrapText(ctx, p.detail, SHARE_W - 160);
            lines.forEach((l, idx) => ctx.fillText(l, 110, startY + 45 + (idx * 35)));
            startY += (lines.length * 35);
          }
          startY += 80;
          ctx.beginPath(); ctx.moveTo(48, startY - 20); ctx.lineTo(SHARE_W - 48, startY - 20); ctx.stroke();
        });
      }

      drawSharedFooter(!isPros);

    } else if (slideIdx === 5) {
      // === SLIDE 6 : PROFIL ===
      ctx.fillStyle = '#0A0A0A'; ctx.fillRect(0, 0, SHARE_W, SHARE_H);
      const g6 = ctx.createRadialGradient(0, SHARE_H, 0, 0, SHARE_H, 600);
      g6.addColorStop(0, 'rgba(232,178,0,0.12)'); g6.addColorStop(1, 'transparent');
      ctx.fillStyle = g6; ctx.fillRect(0, 0, SHARE_W, SHARE_H);

      drawSharedHeader(false);

      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.font = `bold 21px ${FONT_SANS}`; ctx.fillStyle = 'rgba(255,255,255,0.22)';
      ctx.fillText("MES DERNIERS AVIS", 48, 130);

      const recentFilms = historyData.slice(selectedIdx + 1, selectedIdx + 4);
      let pX = 48;
      const pwSmall = 240; 
      const phSmall = 360;
      const gapSmall = 132; 

      for (let i = 0; i < 3; i++) {
        const m = recentFilms[i];
        if (m) {
          const pImg = imageCache.current[proxyUrl(m.affiche)];
          ctx.save(); roundRect(ctx, pX, 170, pwSmall, phSmall, 16); ctx.clip();
          ctx.fillStyle = '#111'; ctx.fillRect(pX, 170, pwSmall, phSmall);
          if (pImg) drawImageCover(ctx, pImg, pX, 170, pwSmall, phSmall);
          const gradP = ctx.createLinearGradient(0, 170 + phSmall*0.4, 0, 170 + phSmall); 
          gradP.addColorStop(0, 'transparent'); gradP.addColorStop(1, 'rgba(0,0,0,0.8)');
          ctx.fillStyle = gradP; ctx.fillRect(pX, 170, pwSmall, phSmall);
          ctx.restore();

          ctx.textAlign = 'center'; ctx.font = `800 22px ${FONT_SYNE}`; ctx.fillStyle = GOLD;
          ctx.fillText(`${String(m.note || 0).replace('.',',')} ★`, pX + pwSmall/2, 170 + phSmall - 35);
          
          ctx.textAlign = 'left'; ctx.font = `bold 18px ${FONT_SANS}`; ctx.fillStyle = 'rgba(255,255,255,0.55)';
          const smallTitleLines = wrapText(ctx, m.titre || '—', pwSmall);
          smallTitleLines.slice(0, 2).forEach((l, idx) => ctx.fillText(l, pX, 170 + phSmall + 16 + (idx * 24)));
        } else {
          ctx.save(); roundRect(ctx, pX, 170, pwSmall, phSmall, 16); ctx.clip();
          ctx.fillStyle = 'rgba(255,255,255,0.02)'; ctx.fillRect(pX, 170, pwSmall, phSmall);
          ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 2; ctx.stroke();
          ctx.restore();
          
          ctx.textAlign = 'left'; ctx.font = `bold 18px ${FONT_SANS}`; ctx.fillStyle = 'rgba(255,255,255,0.2)';
          ctx.fillText('À découvrir', pX, 170 + phSmall + 16);
        }
        pX += pwSmall + gapSmall;
      }

      ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(48, 620); ctx.lineTo(SHARE_W - 48, 620); ctx.stroke();

      ctx.textAlign = 'left'; ctx.font = `bold 21px ${FONT_SANS}`; ctx.fillStyle = 'rgba(255,255,255,0.22)';
      ctx.fillText("PROCHAIN FILM", 48, 660);

      const nextFilm = selectedIdx > 0 ? historyData[selectedIdx - 1] : pendingFilm;
      const pwLarge = 360; const phLarge = 540; const nfX = 48; const nfY = 700;

      if (nextFilm) {
        const nfImg = imageCache.current[proxyUrl(nextFilm.affiche)];
        ctx.save(); roundRect(ctx, nfX, nfY, pwLarge, phLarge, 24); ctx.clip();
        ctx.fillStyle = '#111'; ctx.fillRect(nfX, nfY, pwLarge, phLarge);
        if (nfImg) drawImageCover(ctx, nfImg, nfX, nfY, pwLarge, phLarge);
        ctx.restore();

        const infoX = nfX + pwLarge + 48;
        let infoY = nfY + 120;

        ctx.fillStyle = 'rgba(232,178,0,0.1)'; roundRect(ctx, infoX, infoY, 140, 42, 21); ctx.fill();
        ctx.strokeStyle = 'rgba(232,178,0,0.3)'; ctx.lineWidth = 1; ctx.stroke();
        ctx.font = `bold 16px ${FONT_SANS}`; ctx.fillStyle = GOLD;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('À NOTER', infoX + 70, infoY + 21);

        infoY += 80;

        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.font = `800 64px ${FONT_SYNE}`; ctx.fillStyle = '#FFF';
        const nfTitleLines = wrapText(ctx, nextFilm.titre || 'À venir', SHARE_W - infoX - 48);
        nfTitleLines.slice(0, 3).forEach((l, idx) => ctx.fillText(l, infoX, infoY + (idx * 70)));

        infoY += (nfTitleLines.slice(0, 3).length * 70) + 20;

        ctx.font = `normal 26px ${FONT_SANS}`; ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillText(nextFilm.date || 'Prochaine séance', infoX, infoY);

      } else {
        ctx.save(); roundRect(ctx, nfX, nfY, pwLarge, phLarge, 24); ctx.clip();
        ctx.fillStyle = 'rgba(255,255,255,0.02)'; ctx.fillRect(nfX, nfY, pwLarge, phLarge);
        ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 2; ctx.stroke();
        ctx.restore();
        
        const infoX = nfX + pwLarge + 48;
        const infoY = nfY + 160;
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.font = `800 64px ${FONT_SYNE}`; ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillText("À venir", infoX, infoY);
        ctx.font = `normal 26px ${FONT_SANS}`; ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillText("Aucun ticket en attente", infoX, infoY + 80);
      }

      drawSharedFooter(false);
    }
  } catch (err) {
    console.error("Erreur durant le rendu Canvas :", err);
  }
};

// ==========================================
// COMPOSANT REACT PRINCIPAL
// ==========================================
export default function ShareReview({ historyData, pendingFilm, onBack, ratingScale = 5 }) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [movieDetails, setMovieDetails] = useState(null);
  
  const [pros, setPros] = useState([]);
  const [cons, setCons] = useState([]);
  const [isEditingPoints, setIsEditingPoints] = useState(false);

  // States pour la navigation tactile (Swipe)
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const previewRef = useRef(null);
  const imageCache = useRef({});

  const film = historyData[selectedIdx] || historyData[0];

  const currentYear = film?.date ? film.date.split('/')[2] : String(new Date().getFullYear());
  const filmsThisYear = historyData.filter(f => f.date && f.date.endsWith(currentYear));
  const indexInYear = filmsThisYear.findIndex(f => f === film);
  const yearlyIndex = filmsThisYear.length - indexInYear;

  useEffect(() => {
    if (!film) return;
    const p = extractPoints(film.commentaire, 'positif');
    const c = extractPoints(film.commentaire, 'negatif');
    setPros(p.length ? p : [{ title: '', detail: '' }]);
    setCons(c.length ? c : [{ title: '', detail: '' }]);

    getMovieDetailsWithCast(film.tmdbId, film.titre).then(details => {
      setMovieDetails(details);
    });
  }, [selectedIdx, film]);

  useEffect(() => {
    if (!film || !previewRef.current) return;

    const draw = async () => {
      try {
        await document.fonts.load(`10px ${FONT_SYNE}`);
        await document.fonts.load(`10px ${FONT_SANS}`);
      } catch (e) {
        console.warn("Erreur de chargement des polices", e);
      }

      const urlsToLoad = [INSTA_LOGO_URL, proxyUrl(film.affiche)];
      
      if (currentSlide === 1 && movieDetails?.credits?.cast) {
        movieDetails.credits.cast.slice(0, 6).forEach(c => {
          if (c.profile_path) urlsToLoad.push(proxyUrl(`https://image.tmdb.org/t/p/w185${c.profile_path}`));
        });
      }
      if (currentSlide === 5) {
        historyData.slice(selectedIdx + 1, selectedIdx + 4).forEach(f => urlsToLoad.push(proxyUrl(f.affiche)));
        const nextFilm = selectedIdx > 0 ? historyData[selectedIdx - 1] : pendingFilm;
        if (nextFilm?.affiche) urlsToLoad.push(proxyUrl(nextFilm.affiche));
      }

      await Promise.all(urlsToLoad.map(async url => {
        if (url && !imageCache.current[url]) {
          imageCache.current[url] = await loadImage(url);
        }
      }));

      renderShareSlideToCanvas(previewRef.current, currentSlide, {
        film, movieDetails, pros, cons, yearlyIndex, historyData, pendingFilm, imageCache, ratingScale, selectedIdx
      });
    };

    draw();
  }, [currentSlide, film, movieDetails, pros, cons, selectedIdx, historyData, pendingFilm, yearlyIndex, ratingScale]);

  const handleDownload = () => {
    if (!previewRef.current) return;
    previewRef.current.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Avis_${film.titre.replace(/\s+/g, '_')}_Slide_${currentSlide + 1}.png`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    }, 'image/png');
  };

  // --- NAVIGATION LOGIC ---
  const handlePrev = useCallback(() => {
    if (currentSlide > 0) setCurrentSlide(prev => prev - 1);
  }, [currentSlide]);

  const handleNext = useCallback(() => {
    if (currentSlide < 5) setCurrentSlide(prev => prev + 1);
  }, [currentSlide]);

  // Swipe Handlers
  const minSwipeDistance = 50;
  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);
  const onTouchEndHandler = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) handleNext();
    if (isRightSwipe) handlePrev();
  };

  const slideNames = ['Affiche', 'Fiche', 'Note', 'Points +', 'Points -', 'Profil'];

  if (!film) return (
    <div className="min-h-screen bg-[#0C0C0E] flex flex-col">
       <header className="px-6 py-4 flex items-center border-b border-white/10"><button onClick={onBack} className="text-white"><ChevronLeft/></button></header>
       <div className="flex-1 flex items-center justify-center text-white/40">Aucun film à partager.</div>
    </div>
  );

  return (
    <div className="animate-in fade-in pb-24 flex flex-col min-h-screen bg-[#0C0C0E] overflow-x-hidden text-[#F0EEF5]">
      
      {/* HEADER */}
      <header className="z-40 sticky top-0 w-full bg-[#0C0C0E]/90 backdrop-blur-xl border-b border-white/10 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 px-6 flex justify-between items-center text-white">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center active:scale-90 transition-transform"><ChevronLeft size={20} strokeWidth={2.5}/></button>
        <h2 className="font-syne font-black text-lg">Avis Express</h2>
        <div className="w-10"/>
      </header>

      {/* SÉLECTEUR DE FILM */}
      <div className="pt-6 px-6 mb-6 overflow-x-auto flex gap-3 scrollbar-hide snap-x">
        {historyData.map((m, idx) => (
          <div key={idx} onClick={() => { setSelectedIdx(idx); setCurrentSlide(0); setIsEditingPoints(false); }}
            className={`flex-shrink-0 w-14 h-20 rounded-md bg-cover bg-center border-2 transition-all cursor-pointer snap-center ${idx === selectedIdx ? 'border-[#E8B200] scale-110 shadow-lg' : 'border-transparent opacity-40'}`}
            style={{ backgroundImage: `url('${proxyUrl(m.affiche)}')` }}
          />
        ))}
      </div>

      {/* PRÉVISUALISATION CANVAS AVEC SWIPE & FLÈCHES */}
      <div className="px-6 mb-6 relative flex justify-center group">
        
        {/* Flèche Gauche */}
        <button 
          onClick={handlePrev}
          className={`absolute left-2 z-10 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center transition-all ${currentSlide === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100 hover:bg-black/80 hover:scale-110'}`}
        >
          <ChevronLeft size={20} className="text-white ml-[-2px]"/>
        </button>

        {/* Le Canvas (avec zones tactiles) */}
        <div 
          onTouchStart={onTouchStart} 
          onTouchMove={onTouchMove} 
          onTouchEnd={onTouchEndHandler}
          className="w-full max-w-md aspect-[4/5] bg-[#1A1A1F] rounded-[18px] shadow-[0_32px_64px_rgba(0,0,0,0.4)] border border-white/10 overflow-hidden relative cursor-ew-resize"
        >
          <canvas
            ref={previewRef}
            width={SHARE_W}
            height={SHARE_H}
            className="w-full h-full object-contain"
          />
          
          {/* Bouton d'Édition Flottant (Slides 4 & 5) */}
          {(currentSlide === 3 || currentSlide === 4) && (
            <button 
              onClick={(e) => { e.stopPropagation(); setIsEditingPoints(true); }}
              className="absolute bottom-4 right-4 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/20 bg-black/70 backdrop-blur-md text-white/90 text-[10px] font-bold uppercase tracking-widest hover:bg-black/90 active:scale-95 transition-all shadow-lg"
            >
              <PenLine size={12} strokeWidth={2.5} /> Modifier
            </button>
          )}
        </div>

        {/* Flèche Droite */}
        <button 
          onClick={handleNext}
          className={`absolute right-2 z-10 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center transition-all ${currentSlide === 5 ? 'opacity-0 pointer-events-none' : 'opacity-100 hover:bg-black/80 hover:scale-110'}`}
        >
          <ChevronRight size={20} className="text-white ml-[2px]"/>
        </button>
      </div>

      {/* STEPPER */}
      <div className="px-6 mb-8 max-w-md mx-auto w-full">
        <div className="flex items-center gap-1.5 mb-2">
          {slideNames.map((_, i) => (
             <div key={i} onClick={() => { setCurrentSlide(i); setIsEditingPoints(false); }} className={`flex-1 h-1.5 cursor-pointer rounded-full transition-all ${i === currentSlide ? 'bg-[#E8B200]' : i < currentSlide ? 'bg-[#E8B200]/30' : 'bg-white/10'}`} />
          ))}
        </div>
        <div className="flex justify-between px-1">
          {slideNames.map((name, i) => (
             <span key={i} onClick={() => { setCurrentSlide(i); setIsEditingPoints(false); }} className={`text-[9px] uppercase font-bold tracking-widest cursor-pointer ${i === currentSlide ? 'text-[#E8B200]' : 'text-white/30'}`}>{name}</span>
          ))}
        </div>
      </div>

      {/* BOUTON TÉLÉCHARGEMENT */}
      <div className="px-6 pb-6 max-w-md mx-auto w-full">
        <button onClick={handleDownload} className="w-full h-14 rounded-2xl bg-[#E8B200] text-[#0A0A0A] font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-[0_4px_24px_rgba(232,178,0,0.3)]">
          <Download size={18} strokeWidth={2.5}/> Télécharger ({slideNames[currentSlide]})
        </button>
      </div>

      {/* BOTTOM SHEET (PANNEAU D'ÉDITION) */}
      {isEditingPoints && (currentSlide === 3 || currentSlide === 4) && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setIsEditingPoints(false)} />
          <div className={`relative w-full max-w-md mx-auto border-t border-white/10 rounded-t-3xl flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-full duration-300 shadow-2xl ${currentSlide === 3 ? 'bg-[#0C0C0E]' : 'bg-[#F5F2EC]'}`}>
            <div className="w-full flex justify-center pt-3 pb-1 cursor-pointer" onClick={() => setIsEditingPoints(false)}>
              <div className={`w-12 h-1.5 rounded-full ${currentSlide === 3 ? 'bg-white/20' : 'bg-black/20'}`} />
            </div>
            <div className={`flex items-center justify-between px-6 pb-4 border-b ${currentSlide === 3 ? 'border-white/10' : 'border-black/10'}`}>
              <h3 className={`text-xs font-bold uppercase tracking-widest ${currentSlide === 3 ? 'text-white/80' : 'text-black/70'}`}>
                {currentSlide === 3 ? 'Points forts' : 'Points faibles'} — jusqu'à 4
              </h3>
              <button onClick={() => setIsEditingPoints(false)} className={`p-2 -mr-2 rounded-full ${currentSlide === 3 ? 'text-white/50 hover:bg-white/10' : 'text-black/50 hover:bg-black/10'}`}>
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
              {(currentSlide === 3 ? pros : cons).map((p, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${currentSlide === 3 ? 'text-[#E8B200]' : 'text-black/40'}`}>0{i+1}</span>
                    {i > 0 && (
                      <button onClick={() => { const arr = currentSlide === 3 ? [...pros] : [...cons]; arr.splice(i, 1); currentSlide === 3 ? setPros(arr) : setCons(arr); }} className="text-[9px] font-bold text-red-500/80 hover:text-red-500 uppercase tracking-widest">✕ retirer</button>
                    )}
                  </div>
                  <input type="text" placeholder="Titre du point..." value={p.title} onChange={(e) => { const arr = currentSlide === 3 ? [...pros] : [...cons]; arr[i].title = e.target.value; currentSlide === 3 ? setPros(arr) : setCons(arr); }} className={`w-full border rounded-xl px-4 py-3.5 text-sm font-bold outline-none transition-colors ${currentSlide === 3 ? 'bg-white/5 border-white/10 text-white placeholder-white/30 focus:border-[#E8B200]' : 'bg-black/5 border-black/10 text-black placeholder-black/30 focus:border-black/30'}`} maxLength={60}/>
                  <textarea placeholder="Détail optionnel..." value={p.detail} onChange={(e) => { const arr = currentSlide === 3 ? [...pros] : [...cons]; arr[i].detail = e.target.value; currentSlide === 3 ? setPros(arr) : setCons(arr); }} className={`w-full border rounded-xl px-4 py-3 text-xs outline-none transition-colors resize-none h-24 ${currentSlide === 3 ? 'bg-white/5 border-white/10 text-white/70 placeholder-white/30 focus:border-[#E8B200]' : 'bg-black/5 border-black/10 text-black/70 placeholder-black/30 focus:border-black/30'}`} maxLength={160}/>
                  {i < (currentSlide === 3 ? pros : cons).length - 1 && (<div className={`h-px w-full mt-4 ${currentSlide === 3 ? 'bg-white/10' : 'bg-black/10'}`} />)}
                </div>
              ))}
              {(currentSlide === 3 ? pros : cons).length < 4 && (
                <button onClick={() => { currentSlide === 3 ? setPros([...pros, {title:'', detail:''}]) : setCons([...cons, {title:'', detail:''}]); }} className={`w-full py-3.5 border border-dashed rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors ${currentSlide === 3 ? 'border-white/20 text-white/40 hover:border-[#E8B200] hover:text-[#E8B200]' : 'border-black/20 text-black/40 hover:border-black/40 hover:text-black/60'}`}>
                  <Plus size={14} strokeWidth={2.5}/> Ajouter un point
                </button>
              )}
            </div>
            <div className={`p-6 border-t ${currentSlide === 3 ? 'border-white/10 bg-[#0C0C0E]' : 'border-black/10 bg-[#F5F2EC]'}`}>
              <button onClick={() => setIsEditingPoints(false)} className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-sm active:scale-95 transition-transform ${currentSlide === 3 ? 'bg-[#E8B200] text-black' : 'bg-[#1E1E1E] text-[#F5F2EC]'}`}>
                Appliquer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}