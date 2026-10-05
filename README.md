# Sitio personal · Alonso Vargas Manríquez

Página estática en HTML/CSS puro, sin build ni dependencias.

## Estructura

- `index.html`: contenido
- `style.css`: estilos (modo claro/oscuro automático)

## Publicar en GitHub Pages

1. Crea un repositorio llamado `avargam.github.io` (así el sitio queda en `https://avargam.github.io`).
2. Sube `index.html`, `style.css` y este README a la rama `main`.
3. En el repositorio, ve a **Settings → Pages**, elige **Deploy from a branch**, rama `main`, carpeta `/ (root)`, y guarda.
4. Espera uno o dos minutos y abre la URL.

## Agregar un proyecto

En `index.html`, dentro de `<div class="cards">`, copia un bloque `<article class="card">` completo y edita título, descripción, etiquetas y enlace. Las clases `c1` a `c4` cambian el color del borde superior.

## Probar en local

Abre `index.html` en el navegador, o ejecuta `python3 -m http.server` en esta carpeta y entra a `http://localhost:8000`.
