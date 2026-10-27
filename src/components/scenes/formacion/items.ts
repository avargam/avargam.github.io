/**
 * Ítems de Formación: un edificio de la ciudad por ítem. Coordenadas de la escena (1600×1000),
 * sacadas de `window_scene()` en `prototype/generadores/gen_k.py` y de `prototype/detalle-v2/`.
 */
import type { Rect } from '../../stage/geometry';
import type { SectionItem } from '../../stage/itemNav';

export type FormacionItemId = 'titulo' | 'major' | 'minor' | 'idiomas';

export interface FormacionItem extends SectionItem {
  id: FormacionItemId;
  /** Nombre completo, en la píldora de hover y para lectores de pantalla. */
  name: string;
  /** Zona clicable del edificio. */
  hit: Rect;
  /** Píldora de hover: centro horizontal y borde superior. */
  hoverLabel: { x: number; y: number };
  /** Encuadre de la cámara al seleccionarlo (proporción 1.6, como el escenario). */
  frame: Rect;
}

/** Encuadre a partir de su centro y tamaño. */
const centered = (cx: number, cy: number, w: number, h: number): Rect => ({
  x: cx - w / 2,
  y: cy - h / 2,
  w,
  h,
});

export const formacionItems: FormacionItem[] = [
  {
    id: 'titulo',
    chip: 'Título',
    name: 'Título: Ingeniería Civil de Computación',
    hit: { x: 682, y: 546, w: 396, h: 368 },
    hoverLabel: { x: 880, y: 500 },
    frame: centered(880, 740, 640, 400),
  },
  {
    id: 'major',
    chip: 'Major · Software',
    name: 'Major en Software',
    hit: { x: 470, y: 366, w: 180, h: 548 },
    hoverLabel: { x: 560, y: 322 },
    frame: centered(800, 480, 1000, 625),
  },
  {
    id: 'minor',
    chip: 'Minor · Ciencia de Datos',
    name: 'Minor en Ciencia de Datos',
    hit: { x: 1110, y: 430, w: 190, h: 484 },
    hoverLabel: { x: 1205, y: 386 },
    frame: centered(1205, 516, 400, 250),
  },
  {
    id: 'idiomas',
    chip: 'Idiomas',
    name: 'Idiomas: español e inglés',
    hit: { x: 192, y: 568, w: 246, h: 346 },
    hoverLabel: { x: 315, y: 522 },
    frame: centered(315, 680, 480, 300),
  },
];

export const formacionItem = (id: string) => formacionItems.find((i) => i.id === id);
