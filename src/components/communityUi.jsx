import { Avatar3D } from './Avatar3D';

/* Avatar d'un ami : Avatar3D si une image existe, sinon l'initiale du prénom. */
export function FriendAvatar({ name, url, size = 40 }) {
  if (url) {
    return (
      <div className="shrink-0">
        <Avatar3D src={url} size={size} primary="transparent" borderWidth={0} />
      </div>
    );
  }
  return (
    <span
      aria-hidden="true"
      className="flex shrink-0 items-center justify-center rounded-full font-galinoy italic"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.5),
        background: 'color-mix(in srgb, var(--theme-accent) 18%, transparent)',
        color: 'var(--theme-accent)',
      }}
    >
      {(name || '?').trim().charAt(0).toUpperCase()}
    </span>
  );
}

/* Bloc de chargement animé. La classe .ge-skeleton est définie dans le <style> de Community.jsx. */
export const Skeleton = ({ className = '' }) => <div aria-hidden="true" className={`ge-skeleton ${className}`} />;

export function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="flex flex-col items-center rounded-[20px] border border-[var(--theme-border)] bg-[var(--theme-surface)] px-6 py-10 text-center">
      <span
        className="mb-4 flex h-14 w-14 items-center justify-center rounded-full"
        style={{
          background: 'color-mix(in srgb, var(--theme-accent) 14%, transparent)',
          color: 'var(--theme-accent)',
        }}
      >
        <Icon size={24} aria-hidden="true" />
      </span>
      <p className="font-galinoy text-[22px] italic text-[var(--theme-text)]">{title}</p>
      <p className="mt-2 max-w-[30ch] font-outfit text-[13px] leading-relaxed text-[var(--theme-text-secondary)]">{text}</p>
      {action}
    </div>
  );
}