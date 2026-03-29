// api/proxy-image.js
// Route API Vercel — Proxy d'images pour contourner les restrictions CORS (TMDB, etc.)
// Déployez ce fichier dans le dossier /api de votre projet Vercel.

export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL manquante' });
  }

  // Autoriser uniquement les domaines connus (sécurité)
  const allowedDomains = [
    'image.tmdb.org',
    'images.tmdb.org',
    'via.placeholder.com',
    'upload.wikimedia.org',
  ];

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    return res.status(400).json({ error: 'URL invalide' });
  }

  const isAllowed = allowedDomains.some((domain) =>
    parsedUrl.hostname === domain || parsedUrl.hostname.endsWith('.' + domain)
  );

  if (!isAllowed) {
    return res.status(403).json({ error: `Domaine non autorisé : ${parsedUrl.hostname}` });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GrandEcranBot/1.0)',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Échec de récupération de l\'image' });
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = await response.arrayBuffer();

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).send(Buffer.from(buffer));
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}