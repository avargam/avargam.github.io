# avargam.github.io

Sitio personal de Alonso Vargas Manríquez: perfil profesional, enlaces y hub de proyectos, presentado como un cuarto ilustrado donde cada objeto lleva a una sección.

## Stack

- [Astro](https://astro.build) + TypeScript (estricto): HTML estático, casi sin JavaScript en el cliente
- [Tailwind CSS v4](https://tailwindcss.com) con los colores de la paleta como tokens (`src/styles/global.css`)
- ESLint (flat config) + Prettier (con plugins de Astro y Tailwind)
- GitHub Actions → GitHub Pages
- Tipografías autoalojadas con Fontsource (Bricolage Grotesque y DM Sans): sin pedidos a Google Fonts

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

## Estructura

```
src/
  components/   Scene.astro (la ilustración con enlaces), Card, PageIntro
  data/         Contenido editable: perfil, experiencia, proyectos, etc.
  layouts/      BaseLayout.astro (head, navegación, pie)
  pages/        Una página por sección (ruta = nombre de archivo)
  styles/       global.css (Tailwind + tokens de la paleta)
public/         Archivos estáticos (favicon)
design/         Fuente de diseño: scene.svg de referencia
.github/workflows/deploy.yml
```

## Cómo editar el contenido

Todo el texto vive en `src/data/*.ts`, tipado, sin tocar las páginas:

- `profile.ts`: nombre, presentación, correo y enlaces
- `projects.ts`: **hay un marcador de posición**; reemplázalo por tu proyecto real y agrega más objetos al arreglo
- `personal.ts`: favoritos de "Fuera del código" (también son marcadores)
- `experience.ts`, `education.ts`, `skills.ts`: trayectoria y herramientas
- `nav.ts`: lista de secciones (alimenta el menú y las tarjetas de la portada)

### Agregar una sección nueva

1. Crea `src/pages/<slug>.astro` (copia `formacion.astro` como base).
2. Agrega `{ slug, label, description }` en `src/data/nav.ts`.
3. Si quieres que tenga un objeto en la escena, envuelve un grupo del SVG en `Scene.astro` con `<a class="hotspot" href={href('<slug>')} aria-label="…"><title>…</title>…</a>`.

## La escena

`src/components/Scene.astro` es un SVG inline. Cada objeto clicable está envuelto en `<a class="hotspot">` (hover y foco por teclado en `global.css`). Las etiquetas de colores son decorativas (`aria-hidden`): la navegación accesible está en el menú y en las tarjetas bajo la ilustración.

`design/scene.svg` es la misma ilustración sin enlaces, útil como referencia o para abrirla en un editor.

## Paleta

Base "A4b Vaporwave" con las cortinas y la estantería de "A4a". Los tokens están en `@theme` de `src/styles/global.css` y generan utilidades como `bg-wall`, `text-plum`, `border-plum`, `bg-mint`.

| Token        | Valor     | Uso                          |
| ------------ | --------- | ---------------------------- |
| `wall`       | `#f9ddf0` | Fondo                        |
| `plum`       | `#5a2f6b` | Títulos y bordes             |
| `ink`        | `#2b2d42` | Texto principal              |
| `muted`      | `#5b4a6b` | Texto secundario             |
| `pink`       | `#ff6fa3` | Acento principal             |
| `violet`     | `#7b6cf6` | Enlaces y foco               |
| `periwinkle` | `#6f82e0` | Cortinas                     |
| `mint`       | `#8adbc8` | Etiquetas "Fuera del código" |

## Despliegue (GitHub Pages)

1. Crea el repositorio **`avargam.github.io`** en GitHub (nombre exacto, así el sitio queda en `https://avargam.github.io` sin `base`).
2. En el repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Haz push a `main`. El workflow ejecuta lint, formato, tipos y build, y publica `dist/`.

Si el repositorio se llama distinto, agrega `base: '/nombre-del-repo'` en `astro.config.mjs` y ajusta `site`.

## Pendiente de completar

- [ ] Reemplazar el proyecto de ejemplo en `src/data/projects.ts`
- [ ] Escribir tus favoritos en `src/data/personal.ts`
- [ ] Ajustar el avatar para que se parezca más a ti (en `Scene.astro` y `design/scene.svg`)
- [ ] Revisar versiones de las acciones de GitHub en `deploy.yml` al crear el repo
