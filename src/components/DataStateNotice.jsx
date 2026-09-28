import { AlertCircle, LoaderCircle } from 'lucide-react';

/** État de chargement, d'erreur ou de liste vide pour les données Google. */
export function DataStateNotice({ kind, title, message, actionLabel, onAction, compact = false }) {
  if (!kind) return null;
  const isError = kind === 'error';
  const Icon = kind === 'loading' ? LoaderCircle : isError ? AlertCircle : null;

  return (
    <section
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      className={`mx-5 rounded-2xl border ${compact ? 'p-4' : 'p-6'}`}
      style={{
        color: 'var(--theme-text)',
        background: 'color-mix(in srgb, var(--theme-surface) 78%, transparent)',
        borderColor: 'var(--theme-border)',
      }}
    >
      <div className="flex items-start gap-3">
        {Icon && <Icon size={18} className={`mt-0.5 shrink-0 ${kind === 'loading' ? 'animate-spin' : ''}`} aria-hidden="true" />}
        <div className="min-w-0 flex-1">
          <p className="font-outfit text-sm font-semibold">{title}</p>
          {message && <p className="mt-1 font-outfit text-xs leading-relaxed opacity-65">{message}</p>}
          {onAction && actionLabel && (
            <button
              type="button"
              onClick={onAction}
              className="mt-3 min-h-11 rounded-full px-4 font-outfit text-xs font-semibold"
              style={{ color: 'var(--theme-bg)', background: 'var(--theme-accent)' }}
            >
              {actionLabel}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
