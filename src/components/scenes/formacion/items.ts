/**
 * Ítems de Formación: un edificio de la ciudad por ítem. Coordenadas de la escena (1600×1000),
 * sacadas de `window_scene()` en `prototype/generadores/gen_k.py`.
 */
import type { SectionItem } from '../../stage/itemNav';

export type FormacionItemId = 'titulo' | 'major' | 'minor' | 'idiomas';

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface FormacionItem extends SectionItem {
  id: FormacionItemId;
  /** Nombre completo, en la píldora de hover y para lectores de pantalla. */
  name: string;
  /** Zona clicable del edificio. */
  hit: Box;
  /** Halo del estado seleccionado (elipse). */
  halo: { cx: number; cy: number; rx: number; ry: number };
  /** Contorno punteado del estado seleccionado (path SVG). */
  outline: string;
  /** Píldora de hover: centro horizontal y borde superior. */
  hoverLabel: { x: number; y: number };
  /** Lado de la tarjeta y punta de su globo. */
  card: { side: 'left' | 'right'; tip: { x: number; y: number } };
}

export const formacionItems: FormacionItem[] = [
  {
    id: 'titulo',
    chip: 'Título',
    name: 'Título: Ingeniería Civil de Computación',
    hit: { x: 682, y: 546, w: 396, h: 368 },
    halo: { cx: 880, cy: 730, rx: 260, ry: 230 },
    outline: 'M686 690 L880 590 L1074 690 V914 H686 Z',
    hoverLabel: { x: 880, y: 500 },
    card: { side: 'right', tip: { x: 922, y: 598 } },
  },
  {
    id: 'major',
    chip: 'Major · Software',
    name: 'Major en Software',
    hit: { x: 470, y: 366, w: 180, h: 548 },
    halo: { cx: 560, cy: 660, rx: 170, ry: 300 },
    outline: 'M462 422 H658 V918 H462 Z',
    hoverLabel: { x: 560, y: 322 },
    card: { side: 'left', tip: { x: 575, y: 426 } },
  },
  {
    id: 'minor',
    chip: 'Minor · Ciencia de Datos',
    name: 'Minor en Ciencia de Datos',
    hit: { x: 1110, y: 430, w: 190, h: 484 },
    halo: { cx: 1205, cy: 690, rx: 170, ry: 270 },
    outline: 'M1102 462 H1308 V918 H1102 Z',
    hoverLabel: { x: 1205, y: 386 },
    card: { side: 'right', tip: { x: 1205, y: 426 } },
  },
  {
    id: 'idiomas',
    chip: 'Idiomas',
    name: 'Idiomas: español e inglés',
    hit: { x: 200, y: 700, w: 230, h: 214 },
    halo: { cx: 315, cy: 810, rx: 190, ry: 150 },
    outline: 'M192 696 H438 V918 H192 Z',
    hoverLabel: { x: 315, y: 656 },
    card: { side: 'left', tip: { x: 315, y: 700 } },
  },
];

export const DEFAULT_ITEM: FormacionItemId = 'titulo';
