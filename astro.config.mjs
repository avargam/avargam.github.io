import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// Sitio de usuario en GitHub Pages: https://avargam.github.io (sin `base`).
// Si algún día se publica como proyecto (repo con otro nombre), agregar `base: '/nombre-repo'`.
export default defineConfig({
  site: 'https://avargam.github.io',
  vite: {
    plugins: [tailwindcss()],
  },
});
