/** Sitemap: el cuarto y una ruta por sección (todas prerenderizadas). */
import type { APIRoute } from 'astro';
import { sections } from '../data/sections';

export const GET: APIRoute = ({ site }) => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const urls = ['', ...sections.map((s) => s.slug)].map(
    (path) => `  <url><loc>${new URL(`${base}/${path}`, site)}</loc></url>`,
  );
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml' } },
  );
};
