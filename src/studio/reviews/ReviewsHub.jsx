import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  BookOpenText,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Download,
  Film,
  ImagePlus,
  Images,
  Upload,
} from 'lucide-react';
import ShareReview from '../../components/ShareReview';
import { REVIEW_FORMATS, REVIEW_GENRES, getReviewGenreConfig, normalizeReviewGenreName } from './reviewFormats';
import { REVIEW_POST_H, REVIEW_POST_W, canvasToBlob, renderReviewSlide } from './reviewCanvas';
import '../../Studio.css';

const iconByFormat = {
  dossier: BookOpenText,
  fiche: ClipboardList,
  feuilleton: Images,
};

const FORMAT_HINTS = {
  dossier: 'Longread critique: texte, scene forte, verdict.',
  fiche: 'Carte rapide: infos, scores, extraits, comparaison.',
  feuilleton: 'Experience de seance: avant, pendant, moment, apres.',
};

const HEADER_OFFSET = 'var(--header-total-height, 96px)';
const TOOL_ROOT_STYLE = { paddingTop: `calc(${HEADER_OFFSET} + 0.75rem)` };
const TOOL_HEADER_STYLE = { top: HEADER_OFFSET };

function normalizeGenre(film) {
  const raw = film?.genre || film?.genres || film?.type || '';
  const candidates = Array.isArray(raw) ? raw : String(raw).split(',');
  return candidates.map(normalizeReviewGenreName).find((item) => item !== 'default') || 'default';
}

function getPosterUrl(url) {
  if (!url) return '';
  const proxyBase = import.meta.env.DEV ? '/tmdb-proxy' : '/api/proxy-image';
  return `${proxyBase}?url=${encodeURIComponent(url)}`;
}

function createInitialReview(film, genre, genreConfig) {
  const title = film?.titre || film?.title || '';
  const rating = String(film?.note || '4');
  const prompt = genreConfig.prompt;
  return {
    title,
    rating,
    genre: genre === 'default' ? 'Cinema' : genre,
    tag: genre === 'default' ? 'Avis express' : genre,
    duration: film?.duree || '',
    lang: film?.langue || 'VOSTFR',
    room: film?.salle || '',
    director: film?.realisateur || film?.director || film?.crew?.director || '',
    cast: film?.casting || film?.cast || film?.acteurs || '',
    pitch: prompt.pitch,
    shortNote: prompt.shortNote,
    worksText: prompt.worksText,
    blocksText: prompt.blocksText,
    highlightTitle: prompt.highlightTitle,
    highlightText: prompt.highlightText,
    quickTake: prompt.quickTake,
    cta: prompt.cta,
    works: prompt.works,
    blocks: prompt.blocks,
    sceneQuote: prompt.sceneQuote,
    verdict: prompt.verdict,
    archetype: genreConfig.archetype,
    scoreLabels: genreConfig.scoreLabels,
    scores: [82, 74, 88],
    caption1: prompt.caption1,
    caption2: prompt.caption2,
    comparisonTitle: prompt.comparisonTitle,
    comparison: prompt.comparison,
    avant: prompt.avant,
    pendant: prompt.pendant,
    moment: genreConfig.beat.label,
    apres: prompt.apres,
    hype: 3,
  };
}

function getSlideLabels(format, genreConfig) {
  if (format.id === 'dossier') return ['Couverture', ...genreConfig.dossierLabels];
  if (format.id === 'fiche') return ['Couverture', ...genreConfig.ficheHeadlines];
  return ['Couverture', ...genreConfig.feuilletonLabels];
}

function FormatCard({ format, genreConfig, onSelect }) {
  const Icon = iconByFormat[format.id] || Film;
  return (
    <button
      type="button"
      onClick={onSelect}
      className="group text-left rounded-[24px] border border-white/10 bg-white/[0.04] p-4 transition-all active:scale-[0.98]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-outfit text-[9px] font-black uppercase tracking-[0.24em] text-white/40">{format.eyebrow}</p>
          <h3 className="mt-1 font-galinoy text-2xl italic leading-none text-white">{format.name}</h3>
        </div>
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10"
          style={{ color: genreConfig.palette.accent, backgroundColor: `${genreConfig.palette.accent}18` }}
        >
          <Icon size={18} strokeWidth={1.8}/>
        </span>
      </div>
      <p className="mt-4 font-outfit text-xs font-medium leading-relaxed text-white/58">{format.description}</p>
      <p className="mt-3 font-outfit text-[10px] font-bold uppercase tracking-[0.16em] text-white/30">{FORMAT_HINTS[format.id]}</p>
    </button>
  );
}

function TextInput({ label, value, onChange, placeholder }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-outfit text-[9px] font-black uppercase tracking-[0.18em] text-white/30">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3 py-3 font-outfit text-sm font-semibold text-white outline-none transition-colors placeholder:text-white/18 focus:border-[#E8B200]/50"
      />
    </label>
  );
}

function TextArea({ label, value, onChange, rows = 3 }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-outfit text-[9px] font-black uppercase tracking-[0.18em] text-white/30">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.05] px-3 py-3 font-outfit text-sm font-medium leading-relaxed text-white outline-none transition-colors placeholder:text-white/18 focus:border-[#E8B200]/50"
      />
    </label>
  );
}

function ImageSlot({ label, value, onChange, styleValue, onStyleChange, allowStyle = false }) {
  const inputRef = useRef(null);
  const handleFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result || ''));
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="font-outfit text-[9px] font-black uppercase tracking-[0.18em] text-white/35">{label}</span>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-full bg-white/8 px-3 py-1.5 font-outfit text-[10px] font-black uppercase tracking-[0.12em] text-white/60 active:scale-95"
        >
          <Upload size={12}/> Image
        </button>
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="grid aspect-[4/3] w-full place-items-center overflow-hidden rounded-xl bg-black/30 text-white/25"
      >
        {value ? <img src={value} alt="" className="h-full w-full object-cover"/> : <ImagePlus size={24}/>}
      </button>
      {allowStyle && (
        <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-black/20 p-1">
          {[
            ['polaroid', 'Polaroid'],
            ['raw', 'Brut estompe'],
          ].map(([mode, text]) => (
            <button
              key={mode}
              type="button"
              onClick={() => onStyleChange(mode)}
              className={`rounded-lg px-3 py-2 font-outfit text-[10px] font-black uppercase tracking-[0.12em] transition-colors ${styleValue === mode ? 'bg-white text-black' : 'text-white/45'}`}
            >
              {text}
            </button>
          ))}
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden"/>
    </div>
  );
}

function GenreSelect({ value, onChange }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-outfit text-[9px] font-black uppercase tracking-[0.18em] text-white/30">Genre</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-white/10 bg-[#17171A] px-3 py-3 font-outfit text-sm font-semibold text-white outline-none focus:border-[#E8B200]/50"
      >
        {Object.keys(REVIEW_GENRES).map((item) => <option key={item} value={item}>{item === 'default' ? 'Cinema' : item}</option>)}
      </select>
    </label>
  );
}

function PreviewCanvas({ format, slideIndex, review, genreConfig, imageSources, refreshKey }) {
  const canvasRef = useRef(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const busyTimer = window.setTimeout(() => {
      if (!cancelled) setBusy(true);
    }, 0);
    renderReviewSlide({ formatId: format.id, slideIndex, data: review, genreConfig, imageSources })
      .then((canvas) => {
        if (cancelled || !canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, REVIEW_POST_W, REVIEW_POST_H);
        ctx.drawImage(canvas, 0, 0);
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });
    return () => {
      cancelled = true;
      window.clearTimeout(busyTimer);
    };
  }, [format.id, slideIndex, review, genreConfig, imageSources, refreshKey]);

  return (
    <div
      className="relative w-full overflow-hidden border-y border-white/10 bg-black shadow-2xl sm:mx-auto sm:max-w-[430px] sm:rounded-[24px] sm:border"
      style={{
        aspectRatio: `${REVIEW_POST_W}/${REVIEW_POST_H}`,
      }}
    >
      {busy && (
        <div className="absolute inset-0 z-10 grid place-items-center bg-black/40">
          <div className="h-7 w-7 rounded-full border-2 border-[#E8B200] border-t-transparent animate-spin"/>
        </div>
      )}
      <canvas ref={canvasRef} width={REVIEW_POST_W} height={REVIEW_POST_H} className="h-full w-full"/>
    </div>
  );
}

function SlideControls({
  format,
  activeSlide,
  review,
  genre,
  genreConfig,
  images,
  imageStyles,
  setGenre,
  setImages,
  setImageStyles,
  updateReview,
  updateScore,
}) {
  const imageSetter = (key) => (value) => setImages((current) => ({ ...current, [key]: value }));
  const styleSetter = (key) => (value) => setImageStyles((current) => ({ ...current, [key]: value }));
  const sectionTitle = getSlideLabels(format, genreConfig)[activeSlide];

  return (
    <section className="space-y-4 px-3 pb-8 sm:px-5 lg:px-0">
      <div className="rounded-[20px] border border-white/10 bg-white/[0.04] p-3 sm:rounded-[24px] sm:p-4">
        <p className="mb-3 font-outfit text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
          {sectionTitle}
        </p>

        {activeSlide === 0 && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <TextInput label="Titre" value={review.title} onChange={(title) => updateReview({ title })}/>
              <TextInput label="Note" value={review.rating} onChange={(rating) => updateReview({ rating })} placeholder="4.5"/>
              <GenreSelect value={genre} onChange={setGenre}/>
              <TextInput label="Tag" value={review.tag} onChange={(tag) => updateReview({ tag })}/>
            </div>
            <ImageSlot label="Image cover" value={images.cover} onChange={imageSetter('cover')}/>
          </div>
        )}

        {format.id === 'dossier' && activeSlide === 1 && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <TextInput label="Realisation" value={review.director} onChange={(director) => updateReview({ director })}/>
              <TextInput label="Casting" value={review.cast} onChange={(cast) => updateReview({ cast })}/>
            </div>
            <TextArea label="Texte d'ouverture" value={review.pitch} onChange={(pitch) => updateReview({ pitch })} rows={5}/>
            <ImageSlot label="Still du pitch" value={images.still1} onChange={imageSetter('still1')} styleValue={imageStyles.still1} onStyleChange={styleSetter('still1')} allowStyle/>
          </div>
        )}
        {format.id === 'dossier' && activeSlide === 2 && (
          <div className="space-y-3">
            <TextArea label="Texte libre" value={review.worksText} onChange={(worksText) => updateReview({ worksText })} rows={8}/>
            <ImageSlot label="Image 1" value={images.still1} onChange={imageSetter('still1')} styleValue={imageStyles.still1} onStyleChange={styleSetter('still1')} allowStyle/>
            <ImageSlot label="Image 2 optionnelle" value={images.still2} onChange={imageSetter('still2')} styleValue={imageStyles.still2} onStyleChange={styleSetter('still2')} allowStyle/>
          </div>
        )}
        {format.id === 'dossier' && activeSlide === 3 && (
          <div className="space-y-3">
            <TextArea label="Texte libre" value={review.blocksText} onChange={(blocksText) => updateReview({ blocksText })} rows={8}/>
            <ImageSlot label="Image 1 optionnelle" value={images.still2} onChange={imageSetter('still2')} styleValue={imageStyles.still2} onStyleChange={styleSetter('still2')} allowStyle/>
          </div>
        )}
        {format.id === 'dossier' && activeSlide === 4 && (
          <div className="space-y-3">
            <TextInput label="Titre du focus" value={review.highlightTitle} onChange={(highlightTitle) => updateReview({ highlightTitle })}/>
            <TextArea label="Texte du focus" value={review.highlightText} onChange={(highlightText) => updateReview({ highlightText })} rows={5}/>
            <ImageSlot label="Image focus" value={images.scene} onChange={imageSetter('scene')} styleValue={imageStyles.scene} onStyleChange={styleSetter('scene')} allowStyle/>
          </div>
        )}
        {format.id === 'dossier' && activeSlide === 5 && (
          <div className="space-y-3">
            <TextInput label="Note" value={review.rating} onChange={(rating) => updateReview({ rating })}/>
            <TextArea label="Avis rapide" value={review.quickTake} onChange={(quickTake) => updateReview({ quickTake })}/>
            <TextArea label="Archetype" value={review.archetype} onChange={(archetype) => updateReview({ archetype })}/>
            <TextArea label="CTA Instagram" value={review.cta} onChange={(cta) => updateReview({ cta })}/>
          </div>
        )}

        {format.id === 'fiche' && activeSlide === 1 && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <TextInput label="Duree" value={review.duration} onChange={(duration) => updateReview({ duration })}/>
              <TextInput label="Langue" value={review.lang} onChange={(lang) => updateReview({ lang })}/>
              <TextInput label="Salle" value={review.room} onChange={(room) => updateReview({ room })}/>
            </div>
            <TextArea label="Note courte" value={review.shortNote} onChange={(shortNote) => updateReview({ shortNote })}/>
          </div>
        )}
        {format.id === 'fiche' && activeSlide === 2 && (
          <div className="space-y-4">
            {review.scoreLabels.map((label, index) => (
              <label key={label} className="block">
                <span className="mb-1.5 block font-outfit text-[9px] font-black uppercase tracking-[0.18em] text-white/30">{label}</span>
                <input type="range" min="0" max="100" value={review.scores[index]} onChange={(event) => updateScore(index, event.target.value)} className="w-full accent-[#E8B200]"/>
              </label>
            ))}
          </div>
        )}
        {format.id === 'fiche' && activeSlide === 3 && (
          <div className="space-y-3">
            <ImageSlot label="Extrait 1" value={images.still1} onChange={imageSetter('still1')} styleValue={imageStyles.still1} onStyleChange={styleSetter('still1')} allowStyle/>
            <TextArea label="Caption 1" value={review.caption1} onChange={(caption1) => updateReview({ caption1 })}/>
            <ImageSlot label="Extrait 2" value={images.still2} onChange={imageSetter('still2')} styleValue={imageStyles.still2} onStyleChange={styleSetter('still2')} allowStyle/>
            <TextArea label="Caption 2" value={review.caption2} onChange={(caption2) => updateReview({ caption2 })}/>
          </div>
        )}
        {format.id === 'fiche' && activeSlide === 4 && (
          <div className="space-y-3">
            <TextInput label="Si tu as aime" value={review.comparisonTitle} onChange={(comparisonTitle) => updateReview({ comparisonTitle })}/>
            <TextArea label="Comparaison" value={review.comparison} onChange={(comparison) => updateReview({ comparison })}/>
          </div>
        )}
        {format.id === 'fiche' && activeSlide === 5 && (
          <TextArea label="Resume" value={review.verdict} onChange={(verdict) => updateReview({ verdict })}/>
        )}

        {format.id === 'feuilleton' && activeSlide === 1 && (
          <div className="space-y-3">
            <label className="block">
              <span className="mb-1.5 block font-outfit text-[9px] font-black uppercase tracking-[0.18em] text-white/30">Hype avant</span>
              <input type="range" min="1" max="5" value={review.hype} onChange={(event) => updateReview({ hype: Number(event.target.value) })} className="w-full accent-[#E8B200]"/>
            </label>
            <TextArea label="Avant" value={review.avant} onChange={(avant) => updateReview({ avant })}/>
          </div>
        )}
        {format.id === 'feuilleton' && activeSlide === 2 && (
          <div className="space-y-3">
            <TextArea label="Pendant" value={review.pendant} onChange={(pendant) => updateReview({ pendant })} rows={4}/>
            <ImageSlot label="Image pendant" value={images.still1} onChange={imageSetter('still1')} styleValue={imageStyles.still1} onStyleChange={styleSetter('still1')} allowStyle/>
          </div>
        )}
        {format.id === 'feuilleton' && activeSlide === 3 && (
          <div className="space-y-3">
            <TextArea label={genreConfig.beat.label} value={review.moment} onChange={(moment) => updateReview({ moment })}/>
            <ImageSlot label="Image moment" value={images.scene} onChange={imageSetter('scene')} styleValue={imageStyles.scene} onStyleChange={styleSetter('scene')} allowStyle/>
          </div>
        )}
        {format.id === 'feuilleton' && activeSlide === 4 && (
          <div className="space-y-3">
            <TextArea label="Apres" value={review.apres} onChange={(apres) => updateReview({ apres })}/>
            <TextInput label="Note finale" value={review.rating} onChange={(rating) => updateReview({ rating })}/>
          </div>
        )}
        {format.id === 'feuilleton' && activeSlide === 5 && (
          <div className="space-y-3">
            <TextArea label="Archetype" value={review.archetype} onChange={(archetype) => updateReview({ archetype })}/>
            <TextArea label="Verdict" value={review.verdict} onChange={(verdict) => updateReview({ verdict })}/>
          </div>
        )}
      </div>
    </section>
  );
}

function FormatBuilder({ format, film, initialGenre, onBack, onClassic }) {
  const [genre, setGenre] = useState(initialGenre);
  const genreConfig = getReviewGenreConfig(genre);
  const [review, setReview] = useState(() => createInitialReview(film, genre, genreConfig));
  const [activeSlide, setActiveSlide] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const poster = getPosterUrl(film?.affiche);
  const [images, setImages] = useState({ cover: '', still1: '', still2: '', scene: '' });
  const [imageStyles, setImageStyles] = useState({ still1: 'polaroid', still2: 'polaroid', scene: 'polaroid' });
  const slides = getSlideLabels(format, genreConfig);

  const updateReview = (patch) => setReview((current) => ({ ...current, ...patch }));
  const updateScore = (index, value) => {
    setReview((current) => {
      const next = [...current.scores];
      next[index] = Number(value);
      return { ...current, scores: next };
    });
  };

  const imageSources = useMemo(() => ({ poster, ...images, styles: imageStyles }), [poster, images, imageStyles]);

  useEffect(() => {
    const nextConfig = getReviewGenreConfig(genre);
    setReview((current) => ({
      ...current,
      genre: genre === 'default' ? current.genre : genre,
      tag: genre === 'default' ? current.tag : genre,
      scoreLabels: nextConfig.scoreLabels,
      archetype: nextConfig.archetype,
      moment: nextConfig.beat.label,
      comparisonTitle: nextConfig.prompt.comparisonTitle,
    }));
    setRefreshKey((value) => value + 1);
  }, [genre]);

  const exportAll = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const files = [];
      for (let index = 0; index < slides.length; index += 1) {
        const canvas = await renderReviewSlide({ formatId: format.id, slideIndex: index, data: review, genreConfig, imageSources });
        const blob = await canvasToBlob(canvas);
        if (blob) files.push(new File([blob], `${format.id}_${String(index + 1).padStart(2, '0')}_${slides[index].replace(/[^a-z0-9]/gi, '').toLowerCase()}.png`, { type: 'image/png' }));
      }

      if (navigator.canShare?.({ files })) {
        await navigator.share({ files, title: `${format.name} - ${review.title}` });
      } else {
        files.forEach((file, index) => {
          const url = URL.createObjectURL(file);
          const link = document.createElement('a');
          link.href = url;
          link.download = file.name;
          setTimeout(() => {
            link.click();
            URL.revokeObjectURL(url);
          }, index * 160);
        });
      }
    } catch (error) {
      console.error(error);
      alert('Export impossible pour le moment.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] pb-safe-24 text-[#F0EEF5]" style={TOOL_ROOT_STYLE}>
      <header className="sticky z-40 border-y border-white/10 bg-[#050505]/92 px-3 py-2.5 backdrop-blur-xl sm:px-4 sm:py-3" style={TOOL_HEADER_STYLE}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" onClick={onBack} className="grid h-10 w-10 place-items-center rounded-full bg-white/5 text-white/70 active:scale-95">
              <ArrowLeft size={18}/>
            </button>
            <div className="min-w-0">
              <p className="font-outfit text-[8px] font-black uppercase tracking-[0.2em] text-white/35 sm:text-[9px]">1080 x 1350</p>
              <h2 className="truncate font-galinoy text-lg italic leading-none text-white sm:text-xl">{format.name}</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={exportAll}
            disabled={isExporting}
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-[#E8B200] px-3 font-outfit text-[10px] font-black uppercase tracking-[0.1em] text-black active:scale-95 disabled:opacity-50 sm:gap-2 sm:px-4"
          >
            {isExporting ? <span className="h-4 w-4 rounded-full border-2 border-black/30 border-t-black animate-spin"/> : <Download size={15}/>}
            Tout
          </button>
        </div>
      </header>

      <main className="space-y-4 pt-3 sm:px-5 sm:pt-5 lg:grid lg:grid-cols-[minmax(0,430px)_minmax(0,1fr)] lg:gap-5 lg:space-y-0">
        <section className="space-y-3 lg:sticky lg:top-[calc(var(--header-total-height,96px)+4.75rem)] lg:self-start">
          <PreviewCanvas format={format} slideIndex={activeSlide} review={review} genreConfig={genreConfig} imageSources={imageSources} refreshKey={refreshKey}/>
          <div className="mx-3 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-2 sm:mx-0">
            <button type="button" onClick={() => setActiveSlide(Math.max(0, activeSlide - 1))} className="grid h-10 w-10 place-items-center rounded-full bg-white/5 text-white/60 active:scale-95">
              <ChevronLeft size={18}/>
            </button>
            <div className="min-w-0 text-center">
              <p className="font-outfit text-[9px] font-black uppercase tracking-[0.18em] text-white/30">Slide {activeSlide + 1} / {slides.length}</p>
              <p className="truncate font-outfit text-sm font-extrabold text-white">{slides[activeSlide]}</p>
            </div>
            <button type="button" onClick={() => setActiveSlide(Math.min(slides.length - 1, activeSlide + 1))} className="grid h-10 w-10 place-items-center rounded-full bg-white/5 text-white/60 active:scale-95">
              <ChevronRight size={18}/>
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto px-3 pb-1 scrollbar-hide sm:px-0">
            {slides.map((slide, index) => (
              <button
                key={`${slide}-${index}`}
                type="button"
                onClick={() => setActiveSlide(index)}
                className={`shrink-0 rounded-full px-3 py-2 font-outfit text-[10px] font-black uppercase tracking-[0.12em] ${index === activeSlide ? 'text-black' : 'bg-white/5 text-white/45'}`}
                style={index === activeSlide ? { backgroundColor: genreConfig.palette.accent } : undefined}
              >
                {slide}
              </button>
            ))}
          </div>
        </section>

        <div>
          <SlideControls
            format={format}
            activeSlide={activeSlide}
            review={review}
            genre={genre}
            genreConfig={genreConfig}
            images={images}
            imageStyles={imageStyles}
            setGenre={setGenre}
            setImages={setImages}
            setImageStyles={setImageStyles}
            updateReview={updateReview}
            updateScore={updateScore}
          />
          <button
            type="button"
            onClick={onClassic}
            className="mx-3 mb-8 w-[calc(100%-1.5rem)] rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 font-outfit text-xs font-black uppercase tracking-[0.18em] text-white/50 active:scale-[0.99] sm:mx-5 sm:w-[calc(100%-2.5rem)] lg:mx-0 lg:w-full"
          >
            Ancien format classique
          </button>
        </div>
      </main>
    </div>
  );
}

export default function ReviewsHub({ historyData = [], pendingFilm, onBack }) {
  const [selectedFormat, setSelectedFormat] = useState(null);
  const [showClassic, setShowClassic] = useState(false);
  const film = useMemo(() => pendingFilm || historyData?.[0] || {}, [pendingFilm, historyData]);
  const genre = useMemo(() => normalizeGenre(film), [film]);
  const genreConfig = getReviewGenreConfig(genre);

  if (showClassic) {
    return <ShareReview historyData={historyData} pendingFilm={pendingFilm} onBack={() => setShowClassic(false)}/>;
  }

  if (selectedFormat) {
    return (
      <FormatBuilder
        format={selectedFormat}
        film={film}
        initialGenre={genre}
        onBack={() => setSelectedFormat(null)}
        onClassic={() => setShowClassic(true)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] pb-safe-24 text-[#F0EEF5]" style={TOOL_ROOT_STYLE}>
      <header className="sticky z-40 border-y border-white/10 bg-[#050505]/92 px-3 py-2.5 backdrop-blur-xl sm:px-4 sm:py-3" style={TOOL_HEADER_STYLE}>
        <div className="flex items-center gap-3">
          <button type="button" onClick={onBack} className="grid h-10 w-10 place-items-center rounded-full bg-white/5 text-white/70 active:scale-95">
            <ArrowLeft size={18}/>
          </button>
          <div>
            <p className="font-outfit text-[9px] font-black uppercase tracking-[0.22em] text-white/35">Atelier critique</p>
            <h2 className="font-galinoy text-2xl italic leading-none text-white">Avis Express</h2>
          </div>
        </div>
      </header>

      <main className="space-y-4 px-3 pt-4 sm:px-5 sm:pt-5">
        <section className="rounded-[22px] border border-white/10 bg-[#050505] p-4 sm:rounded-[28px] sm:p-5">
          <p className="font-outfit text-[10px] font-black uppercase tracking-[0.22em]" style={{ color: genreConfig.palette.accent }}>
            Instagram post · 1080 x 1350
          </p>
          <h1 className="mt-2 font-galinoy text-3xl italic leading-[0.95] text-white sm:text-4xl">Choisir la forme de la critique</h1>
          <p className="mt-4 max-w-sm font-outfit text-sm font-medium leading-relaxed text-white/55">
            Chaque format genere un carrousel pret pour Instagram, avec images, texte et export en un clic.
          </p>
        </section>

        <div className="grid gap-3">
          {REVIEW_FORMATS.map((format) => (
            <FormatCard
              key={format.id}
              format={format}
              genreConfig={genreConfig}
              onSelect={() => setSelectedFormat(format)}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShowClassic(true)}
          className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 font-outfit text-xs font-black uppercase tracking-[0.18em] text-white/50 active:scale-[0.99]"
        >
          Ancien format classique
        </button>
      </main>
    </div>
  );
}
