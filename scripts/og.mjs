/**
 * Genera la imagen para compartir de cada ruta (`public/og/<ruta>.jpg`, 1200×630): una captura del
 * cuarto o de la escena de la sección en reposo, sin la UI de navegación. Es opcional: no corre en
 * el build. Se vuelve a correr cuando cambia el dibujo de una escena.
 *
 * Necesita el sitio corriendo y el Chromium de Playwright (una vez: `npx playwright install chromium`)
 * o, con `CHROME_PATH`, otro Chrome o Chromium ya instalado.
 *
 * Uso: node scripts/og.mjs                         (contra http://localhost:4321, `npm run dev`)
 *      node scripts/og.mjs http://localhost:4322   (contra otro servidor, p. ej. `astro preview`)
 */
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const BASE = (process.argv[2] ?? 'http://localhost:4321').replace(/\/$/, '');
const OUT = new URL('../public/og/', import.meta.url);
/**
 * Rutas, el nombre de su imagen (coincide con `ogImage` en Head.astro) y desde qué altura se recorta
 * la franja de 840 (en el cuarto, desde arriba, para que entre la placa con el nombre).
 */
const ROUTES = [
  ['/', 'cuarto', 20],
  ['/formacion', 'formacion', 80],
  ['/experiencia', 'experiencia', 80],
  ['/proyectos', 'proyectos', 80],
  ['/fuera-del-codigo', 'fuera-del-codigo', 80],
  ['/contacto', 'contacto', 80],
];
/** Se oculta la UI (Volver, chips, pistas, Ordenar, placas de las secciones): queda el dibujo. */
const HIDE_UI =
  '[data-screen], [data-plate], [data-room-ui]:not([data-label]) { visibility: hidden !important; }';

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
// 1600×1000 a 0,75 = 1200×750; se recorta una franja de 630 (840 del escenario).
const page = await browser.newPage({
  viewport: { width: 1600, height: 1000 },
  deviceScaleFactor: 0.75,
  reducedMotion: 'reduce',
});
for (const [route, name, top] of ROUTES) {
  await page.goto(BASE + route, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: HIDE_UI });
  await page.waitForTimeout(500);
  const path = new URL(`${name}.jpg`, OUT).pathname;
  await page.screenshot({
    path,
    type: 'jpeg',
    quality: 85,
    clip: { x: 0, y: top, width: 1600, height: 840 },
  });
  console.log(`${route} → public/og/${name}.jpg`);
}
await browser.close();
