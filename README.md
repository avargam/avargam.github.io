# avargam.github.io

Sitio personal de Alonso Vargas Manríquez: un cuarto ilustrado donde cada objeto es una sección (Formación, Experiencia, Proyectos, Fuera del código y Contacto). Al elegir uno, la cámara entra en él y el objeto se vuelve la escena de la sección.

## Stack

- [Astro](https://astro.build) + TypeScript (estricto): HTML estático; el JavaScript del cliente es la cámara y la interacción de cada escena
- [Tailwind CSS v4](https://tailwindcss.com) con los colores de la paleta como tokens (`src/styles/global.css`)
- Ilustraciones en SVG; animaciones con CSS y Web Animations, sin librerías
- ESLint (flat config) + Prettier (con plugins de Astro y Tailwind)
- GitHub Actions → GitHub Pages
- Tipografías autoalojadas con Fontsource (Bricolage Grotesque, DM Sans y Caveat)

## Empezar

Requiere Node 20.19 o superior (`.nvmrc` fija la 22).

```bash
npm install
npm run dev        # http://localhost:4321
```

| Comando                | Qué hace                               |
| ---------------------- | -------------------------------------- |
| `npm run dev`          | Servidor de desarrollo                 |
| `npm run build`        | Genera el sitio estático en `dist/`    |
| `npm run preview`      | Sirve `dist/` localmente               |
| `npm run check`        | Verificación de tipos (`astro check`)  |
| `npm run lint`         | ESLint                                 |
| `npm run format`       | Prettier (escribe cambios)             |
| `npm run format:check` | Prettier (solo verifica; lo usa el CI) |

## Cómo funciona

- **Una sola app en todas las rutas.** `/`, `/formacion`, `/experiencia`… renderizan el mismo cuarto (`components/room/Room.astro`) con la sección indicada ya abierta. En el cliente, `components/stage/router.ts` intercepta los enlaces, mueve la cámara y actualiza la URL; sin JS, cada enlace carga su página con la escena abierta.
- **Escenario y cámara.** Todo vive en un escenario de 1600×1000 (`stage/World.astro`) que se ajusta a la ventana. La cámara es un `transform` sobre el cuarto (`stage/geometry.ts` calcula, `stage/camera.ts` anima).
- **Dos tipos de sección** (`data/sections.ts`):
  - `zoom`: la escena está dentro del objeto del cuarto, a escala, y la cámara entra hasta ella (Formación, Experiencia, Proyectos, Fuera del código);
  - `tilt`: el objeto es muy chico para un zoom hasta 1:1; la cámara se acerca y la escena, vista desde arriba, entra inclinada encima (Contacto).
- **Ítems.** Cada sección tiene ítems (edificios, notas, carpetas, repisas, objetos de la mesa) que se eligen con clic, chips numerados o teclado. Comparten `stage/itemNav.ts`, salvo Contacto (`scenes/contacto/deskClient.ts`), donde los objetos se arrastran y pueden estar varios abiertos.
- **Pantallas táctiles.** En un teléfono el escenario llena la pantalla y se recorre con el dedo (`stage/pan.ts`). En el cuarto, un toque resalta un objeto y el segundo entra. La UI de cada capa (`data-screen`) se dibuja a tamaño de pantalla.
- **Animaciones ambientales** del cuarto (taza, gato, estrellas, ventanas, monitor, post-it): solo con el cuarto en reposo, con `--ambient-state` (ver `World.astro`). Con `prefers-reduced-motion`, no hay.

## Estructura

```
src/
  components/
    stage/        escenario, geometría, cámara, router, ítems y paneo
    room/         el cuarto: fondo, etiquetas, miniatura de Contacto, gato, avatar
    scenes/<slug>/  escena de cada sección, su capa HTML (Overlay) y su lógica
    ui/           SectionShell (Volver, chips, pista), chips
    Head.astro    metadatos y la imagen para compartir de cada ruta
  data/           contenido editable (ver abajo)
  layouts/        RoomLayout.astro (ajuste del escenario al viewport)
  pages/          una página por ruta, el 404 y el sitemap
public/
  cv/             el CV en PDF
  og/             imágenes para compartir (las genera scripts/og.mjs)
scripts/          herramientas opcionales (no corren en el build)
```

## Cómo editar el contenido

El texto vive en `src/data/`, tipado; las escenas lo leen al hacer el build.

- `profile.ts`: nombre, cargo, correo y enlaces (GitHub, LinkedIn)
- `education.ts`, `experience.ts`, `skills.ts`: Formación y Experiencia
- `projects.ts`: las carpetas de Proyectos
- `personal.ts`: los temas y objetos de Fuera del código (tomos, películas, juegos)
- `contact.ts`: los objetos de la mesa de Contacto

Casos especiales:

- **Música** (`music.json`): un disco por artista. La portada es `src/assets/music/<id>.jpg` (o `.png`, `.webp`) y `audio` es una URL o una ruta de `public/`. `node scripts/fetch-music.mjs` completa desde iTunes la portada y el audio que falten.
- **Clips de Cine**: `films[].clips` en `personal.ts`, con archivos en `public/clips/`. Mientras no haya clips, la pantalla muestra escenas de relleno.
- **CV**: se reemplaza `public/cv/AlonsoVargas_CV.pdf` (el sitio es público: sin teléfono ni dirección).
- **Imágenes para compartir**: si cambia el dibujo de una escena, con el sitio corriendo, `node scripts/og.mjs` vuelve a generar `public/og/*.jpg`. Usa Playwright: una vez, `npx playwright install chromium`, o `CHROME_PATH=/ruta/a/chrome`.

## Paleta

Los tokens están en `@theme` de `src/styles/global.css` y generan utilidades como `bg-wall`, `text-plum`, `border-plum`, `bg-mint`.

| Token    | Valor     | Uso                   |
| -------- | --------- | --------------------- |
| `wall`   | `#f9ddf0` | Pared y fondos claros |
| `plum`   | `#5a2f6b` | Títulos, bordes       |
| `ink`    | `#2b2d42` | Texto principal       |
| `muted`  | `#5b4a6b` | Texto secundario      |
| `pink`   | `#ff6fa3` | Acento principal      |
| `violet` | `#7b6cf6` | Etiquetas y detalles  |
| `mint`   | `#8adbc8` | Acento secundario     |
| `sun`    | `#ffe86b` | Hover, luces          |
| `lilac`  | `#c6b8ff` | Chips, acento suave   |

## Ramas y despliegue

- `main` es producción: cada push despliega en GitHub Pages (`https://avargam.github.io`).
- `dev` integra; cada cambio llega en una rama `feat/...` con su PR a `dev`.
- El workflow (`.github/workflows/deploy.yml`) corre lint, formato, tipos y build en `dev`, `main` y las PRs, pero solo despliega desde `main`.

Si el repositorio se llamara distinto de `avargam.github.io`, habría que agregar `base: '/nombre-del-repo'` en `astro.config.mjs` y ajustar `site`.
