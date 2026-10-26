export interface Section {
  slug: string;
  label: string;
  description: string;
}

/** Secciones del sitio. Cada una es una página (`src/pages/<slug>.astro`) y un objeto de la escena. */
export const sections: Section[] = [
  {
    slug: 'proyectos',
    label: 'Proyectos',
    description: 'Lo que estoy armando por mi cuenta.',
  },
  {
    slug: 'experiencia',
    label: 'Experiencia',
    description: 'Dónde he trabajado y con qué herramientas.',
  },
  {
    slug: 'formacion',
    label: 'Formación',
    description: 'Estudios e idiomas.',
  },
  {
    slug: 'fuera-del-codigo',
    label: 'Fuera del código',
    description: 'Juegos, música, anime y lo que leo y veo.',
  },
  {
    slug: 'contacto',
    label: 'Contacto',
    description: 'Cómo escribirme.',
  },
];
