import type { Placement, Rect } from '../components/stage/geometry';

export type SectionSlug =
  'formacion' | 'experiencia' | 'proyectos' | 'fuera-del-codigo' | 'contacto';

interface SectionBase {
  slug: SectionSlug;
  label: string;
  description: string;
  /** Atajo de teclado (1–5); coincide con el número del chip. */
  key: string;
}

/** La escena (1600×1000) está incrustada en el cuarto y la cámara hace zoom hasta ella. */
export interface ZoomSection extends SectionBase {
  transition: 'zoom';
  placement: Placement;
  /** Parte de la escena visible en el cuarto, en coordenadas de la escena. */
  crop?: Rect;
}

/** El objeto es muy pequeño para un zoom: la escena entra con fundido/tilt sobre el cuarto. */
export interface TiltSection extends SectionBase {
  transition: 'tilt';
  /** Zona del objeto en el cuarto, en coordenadas del cuarto. */
  object: Rect;
}

export type Section = ZoomSection | TiltSection;

/**
 * Secciones en el orden de los chips. Cada una es una ruta (`src/pages/<slug>.astro`) y un objeto del cuarto.
 * Las posiciones vienen de los generadores del prototipo (`gen_k.py`, `gen_l.py`).
 */
export const sections: Section[] = [
  {
    slug: 'formacion',
    label: 'Formación',
    description: 'Estudios e idiomas.',
    key: '1',
    transition: 'zoom',
    placement: { x: 36, y: 120, scale: 0.28 },
  },
  {
    slug: 'experiencia',
    label: 'Experiencia',
    description: 'Dónde he trabajado y con qué herramientas.',
    key: '2',
    transition: 'zoom',
    placement: { x: 484.15, y: 105.32, scale: 0.195 },
    crop: { x: 30, y: 24, w: 1540, h: 951 },
  },
  {
    slug: 'proyectos',
    label: 'Proyectos',
    description: 'Lo que estoy armando por mi cuenta.',
    key: '3',
    transition: 'zoom',
    placement: { x: 710.15, y: 375.32, scale: 0.195 },
    crop: { x: 30, y: 24, w: 1540, h: 951 },
  },
  {
    slug: 'fuera-del-codigo',
    label: 'Fuera del código',
    description: 'Juegos, anime y cómics, policial y música.',
    key: '4',
    transition: 'zoom',
    placement: { x: 1195.9, y: 127.5, scale: 0.225 },
    crop: { x: 196, y: 100, w: 1208, h: 752 },
  },
  {
    slug: 'contacto',
    label: 'Contacto',
    description: 'Cómo escribirme.',
    key: '5',
    transition: 'tilt',
    object: { x: 926, y: 540, w: 72, h: 45 },
  },
];

export const sectionBySlug = (slug: string): Section | undefined =>
  sections.find((s) => s.slug === slug);

export function getSection(slug: SectionSlug): Section {
  const section = sectionBySlug(slug);
  if (!section) throw new Error(`Sección desconocida: ${slug}`);
  return section;
}
