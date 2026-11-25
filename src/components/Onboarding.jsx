import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Clock3, FileSpreadsheet, House, Users, X } from 'lucide-react';

const PAGES = [
  {
    id: 'home',
    label: 'Accueil',
    detail: 'Les films à noter et les grands repères de ton année cinéma.',
    Icon: House,
  },
  {
    id: 'journal',
    label: 'Journal',
    detail: 'Toutes tes séances, à parcourir et à retrouver.',
    Icon: Clock3,
  },
  {
    id: 'friends',
    label: 'Amis',
    detail: 'L’activité partagée et les cinémas de tes proches.',
    Icon: Users,
  },
];

export function Onboarding({ spreadsheetId, onClose }) {
  const [step, setStep] = useState(0);
  const dialogRef = useRef(null);
  const titleRef = useRef(null);
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(spreadsheetId)}/edit`;

  useEffect(() => {
    titleRef.current?.focus();
  }, [step]);

  useEffect(() => {
    const handleDialogKeys = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = dialogRef.current?.querySelectorAll('a[href], button:not([disabled])');
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleDialogKeys);
    return () => document.removeEventListener('keydown', handleDialogKeys);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto px-5 py-6"
      style={{ background: 'var(--theme-bg)', color: 'var(--theme-text)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      ref={dialogRef}
    >
      <div className="relative mx-auto flex min-h-[min(680px,calc(100dvh-3rem))] w-full max-w-lg flex-col py-3">
        <header className="flex items-center justify-between">
          <span className="font-outfit text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--theme-text-secondary)]">Grand Écran</span>
          <div className="flex items-center gap-4">
            <span className="font-outfit text-[11px] tabular-nums text-[var(--theme-text-secondary)]">0{step + 1} <span className="opacity-50">/ 02</span></span>
            <button type="button" onClick={onClose} aria-label="Passer la présentation" className="grid h-10 w-10 place-items-center rounded-full text-[var(--theme-text-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]">
              <X size={18} />
            </button>
          </div>
        </header>

        {step === 0 ? (
          <section className="my-auto py-12" key="journal-intro">
            <p className="mb-4 font-outfit text-[11px] font-semibold uppercase tracking-[0.17em] text-[var(--theme-accent)]">Ton espace personnel</p>
            <h1 id="onboarding-title" ref={titleRef} tabIndex={-1} className="max-w-[13ch] font-galinoy text-[clamp(2.7rem,12vw,4.3rem)] italic leading-[0.98] text-[var(--theme-text)] focus:outline-none">
              Ton journal est prêt.
            </h1>
            <div className="mt-10 border-y border-[var(--theme-border)] py-5">
              <div className="flex items-start gap-4">
                <FileSpreadsheet size={21} className="mt-1 shrink-0 text-[var(--theme-accent)]" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="font-outfit text-[10px] uppercase tracking-[0.14em] text-[var(--theme-text-secondary)]">Fichier Google Sheets créé pour toi</p>
                  <p className="mt-1 break-words font-outfit text-[16px] font-semibold">Mon Journal Grand Écran 🍿</p>
                  <a href={spreadsheetUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-10 items-center gap-1 font-outfit text-[12px] font-medium text-[var(--theme-accent)] underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]">
                    Ouvrir le fichier <ArrowUpRight size={14} aria-hidden="true" />
                  </a>
                </div>
              </div>
            </div>
            <p className="mt-6 max-w-[38ch] font-outfit text-[13px] leading-relaxed text-[var(--theme-text-secondary)]">
              Tes séances et tes préférences y sont conservées. Tu peux l’ouvrir dans Google Sheets quand tu veux.
            </p>
          </section>
        ) : (
          <section className="my-auto py-10" key="app-map">
            <p className="mb-4 font-outfit text-[11px] font-semibold uppercase tracking-[0.17em] text-[var(--theme-accent)]">Pour commencer</p>
            <h1 id="onboarding-title" ref={titleRef} tabIndex={-1} className="max-w-[14ch] font-galinoy text-[clamp(2.5rem,11vw,3.8rem)] italic leading-[0.98] text-[var(--theme-text)] focus:outline-none">
              Trois repères dans ton cinéma.
            </h1>
            <ol className="mt-9 divide-y divide-[var(--theme-border)] border-y border-[var(--theme-border)]">
              {PAGES.map(({ id, label, detail, Icon }, index) => (
                <li key={id} className="flex items-start gap-4 py-4">
                  <span className="w-6 shrink-0 pt-0.5 font-outfit text-[10px] tabular-nums text-[var(--theme-accent)]">0{index + 1}</span>
                  <Icon size={17} className="mt-0.5 shrink-0 text-[var(--theme-text-secondary)]" aria-hidden="true" />
                  <div>
                    <h2 className="font-outfit text-[14px] font-semibold">{label}</h2>
                    <p className="mt-1 font-outfit text-[12px] leading-relaxed text-[var(--theme-text-secondary)]">{detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        <footer className="mt-auto flex items-center justify-between gap-4 border-t border-[var(--theme-border)] pt-4">
          {step === 1 ? (
            <button type="button" onClick={() => setStep(0)} className="inline-flex min-h-11 items-center gap-2 px-2 font-outfit text-[12px] text-[var(--theme-text-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]">
              <ArrowLeft size={15} aria-hidden="true" /> Retour
            </button>
          ) : <span aria-hidden="true" />}
          <button
            type="button"
            onClick={step === 0 ? () => setStep(1) : onClose}
            className="inline-flex min-h-12 items-center gap-3 rounded-full px-5 font-outfit text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
            style={{ background: 'var(--theme-accent)', color: 'var(--theme-action-ink)' }}
          >
            {step === 0 ? 'Continuer' : 'Aller à l’accueil'}
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        </footer>
      </div>
    </div>
  );
}
