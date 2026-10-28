import type { Placement, Rect } from '../components/stage/geometry';

export type SectionSlug =
  'formacion' | 'experiencia' | 'proyectos' | 'fuera-del-codigo' | 'contacto';

/** Etiqueta del objeto en el cuarto: píldora centrada en (x, y) y conector [x1, y1, x2, y2]. */
export interface RoomLabel {
  x: number;
  y: number;
  color: string;
  line: [number, number, number, number];
}

interface SectionBase {
  slug: SectionSlug;
  label: string;
  description: string;
  /** Atajo de teclado (1–5); coincide con el número del chip. */
  key: string;
  roomLabel: RoomLabel;
}

/** La escena (1600×1000) está incrustada en el cuarto y la cámara hace zoom hasta ella. */
export interface ZoomSection extends SectionBase {
  transition: 'zoom';
  placement: Placement;
  /** Parte de la escena visible en el cuarto, en coordenadas de la escena. */
  crop?: Rect;
  /** Adónde va la cámara al entrar, si no es todo `crop` (en coordenadas de la escena). */
  frame?: Rect;
  /** Alto de la escena, si es más alta que el escenario (1000). */
  height?: number;
  /** En pantallas táctiles se ve una franja: con `left`, la cámara entra por el borde izquierdo (si no, al centro). */
  touchStart?: 'left';
}

/**
 * El objeto es muy pequeño para un zoom hasta 1:1: la cámara se acerca un poco (`zoom`) y la escena,
 * vista desde arriba, entra encima del objeto inclinada y se endereza (bajar la mirada a la mesa).
 */
export interface TiltSection extends SectionBase {
  transition: 'tilt';
  /** Zona del objeto en el cuarto, en coordenadas del cuarto. */
  object: Rect;
  /** Escala final de la cámara, centrada en el objeto (más cerca, el cuarto tarda en pintarse al salir). */
  zoom: number;
}

export type Section = ZoomSection | TiltSection;

/**
 * Secciones en el orden de los chips. Cada una es una ruta (`src/pages/<slug>.astro`) y un objeto del cuarto.
 * Las posiciones vienen de los generadores del prototipo (`gen_k.py`, `gen_l.py`); los sobres de Contacto
 * se movieron a la derecha del monitor (Fase 1) para no taparlo durante el zoom; en la Fase 6 pasaron a ser
 * las miniaturas de lo que hay en la mesa.
 */
export const sections: Section[] = [
  {
    slug: 'formacion',
    roomLabel: { x: 262, y: 423, color: 'var(--color-pink)', line: [262, 396, 262, 404] },
    label: 'Formación',
    description: 'Estudios e idiomas.',
    key: '1',
    transition: 'zoom',
    placement: { x: 36, y: 120, scale: 0.28 },
  },
  {
    slug: 'experiencia',
    roomLabel: { x: 675, y: 85, color: 'var(--color-sun)', line: [675, 102, 675, 112] },
    label: 'Experiencia',
    description: 'Dónde he trabajado y con qué herramientas.',
    key: '2',
    transition: 'zoom',
    touchStart: 'left',
    placement: { x: 524.15, y: 105.32, scale: 0.195 },
    crop: { x: 30, y: 24, w: 1540, h: 951 },
  },
  {
    slug: 'proyectos',
    roomLabel: { x: 865, y: 337, color: 'var(--color-peach)', line: [865, 356, 865, 378] },
    label: 'Proyectos',
    description: 'Lo que estoy armando por mi cuenta.',
    key: '3',
    transition: 'zoom',
    touchStart: 'left',
    placement: { x: 710.15, y: 375.32, scale: 0.195 },
    crop: { x: 30, y: 24, w: 1540, h: 951 },
  },
  {
    slug: 'fuera-del-codigo',
    roomLabel: { x: 1375, y: 91, color: 'var(--color-mint)', line: [1375, 108, 1375, 148] },
    label: 'Fuera del código',
    description: 'Juegos, anime y cómics, cine y música.',
    key: '4',
    transition: 'zoom',
    touchStart: 'left',
    placement: { x: 1195.9, y: 127.5, scale: 0.225 },
    // La estantería completa (4 repisas) se ve en el cuarto; al entrar, la cámara encuadra las dos de arriba.
    crop: { x: 196, y: 100, w: 1208, h: 1512 },
    frame: { x: 196, y: 100, w: 1208, h: 752 },
    height: 1612,
  },
  {
    slug: 'contacto',
    roomLabel: { x: 1060, y: 651, color: 'var(--color-lilac)', line: [1060, 596, 1060, 632] },
    label: 'Contacto',
    description: 'Correo, GitHub, LinkedIn y CV.',
    key: '5',
    transition: 'tilt',
    object: { x: 1008, y: 550, w: 104, h: 46 },
    zoom: 2.6,
  },
];

export const sectionBySlug = (slug: string): Section | undefined =>
  sections.find((s) => s.slug === slug);

export function getSection(slug: SectionSlug): Section {
  const section = sectionBySlug(slug);
  if (!section) throw new Error(`Sección desconocida: ${slug}`);
  return section;
}
