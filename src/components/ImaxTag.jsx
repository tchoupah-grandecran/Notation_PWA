import React from 'react';

/**
 * Composant réutilisable pour afficher un tag IMAX si la séance est IMAX.
 * @param {string} salle - Le nom de la salle.
 * @param {string} commentaire - Le commentaire de la séance.
 * @returns {JSX.Element|null} - Le tag IMAX ou null.
 */
export function ImaxTag({ salle, commentaire }) {
  // Logique de détection : on cherche "IMAX" dans salle ou commentaire
  const isImax = (salle && salle.toUpperCase().includes('IMAX')) ||
                 (commentaire && commentaire.toUpperCase().includes('IMAX'));

  if (!isImax) return null;

  return (
    <span
      className="inline-flex items-center justify-center rounded-full bg-[#0072ce] px-2 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-md border border-white/10"
      style={{
        fontFamily: 'system-ui, sans-serif', // pour un rendu clean du gras
      }}
    >
      IMAX
    </span>
  );
}