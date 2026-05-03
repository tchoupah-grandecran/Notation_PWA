export function Avatar3D({
  src,
  size = 56,
  primary = 'var(--color-primary)',
  glow = 'var(--color-primary-muted)',
  opacity = 1,
  borderWidth = 2.5,
  className = '', 
}) {
  const px = `${size}px`;

  return (
    <div
      className={`relative flex-shrink-0 ${className}`}
      style={{ width: px, height: px, opacity }}
    >
      {/* Couche 1 — fond + image tronquée dans le cercle */}
      <div
        className="absolute inset-0 rounded-full bg-white/5"
        style={{ overflow: 'hidden', zIndex: 0 }}
      >
        <img
          src={src}
          alt=""
          className="w-full h-full object-contain object-bottom"
          style={{ transform: 'scale(1.15)', transformOrigin: 'bottom center' }}
        />
      </div>

      {/* Couche 2 — bordure colorée */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          border: `${borderWidth}px solid ${primary}`,
          boxShadow: `0 0 16px ${glow}`,
          zIndex: 10,
        }}
      />

      {/* Couche 3 — tête qui dépasse (clipPath laisse passer le haut ~22%) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          clipPath: 'inset(-55% -55% 78% -55%)',
          zIndex: 20,
        }}
      >
        <img
          src={src}
          alt=""
          className="w-full h-full object-contain object-bottom"
          style={{ transform: 'scale(1.15)', transformOrigin: 'bottom center' }}
        />
      </div>
    </div>
  );
}