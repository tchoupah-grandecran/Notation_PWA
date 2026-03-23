/**
 * Avatar3D — effet pop-out où la tête dépasse au-dessus du cercle.
 *
 * Architecture 3 couches :
 *  1. Fond cercle  — overflow:hidden, image à l'intérieur
 *  2. Bordure      — anneau coloré par-dessus
 *  3. Tête         — image dupliquée + clipPath qui laisse sortir
 *                    uniquement le haut (environ 22% de la hauteur)
 *
 * ⚠️  Le wrapper ne doit JAMAIS avoir overflow:hidden — c'est ce qui
 *     permet à la 3e couche de sortir du cercle.
 *
 * Props :
 *  src      — URL de l'avatar
 *  size     — diamètre en pixels (défaut 56)
 *  primary  — couleur de la bordure (ex: '#D4AF37')
 *  glow     — couleur du halo (ex: 'rgba(212,175,55,0.12)')
 *  opacity  — opacité globale (défaut 1, utile pour les non-sélectionnés)
 *  borderWidth — épaisseur de la bordure en px (défaut 2.5)
 */
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