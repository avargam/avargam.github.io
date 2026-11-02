/**
 * Geometría de la estantería de Fuera del código, en coordenadas de la escena (1600×1612). Viene
 * del prototipo `prototype/detalle-estanteria/` (`gen.py` + `template.html`).
 */
import type { Rect } from '../../stage/geometry';
import type { SectionItem } from '../../stage/itemNav';
import { topics, type TopicId } from '../../../data/personal';

/** Borde superior del fondo de la primera repisa y alto de cada repisa. */
export const VT = 130;
export const VH = 360;

/** Fondo de la repisa `i` (donde se apoyan los objetos). */
export const shelfBase = (i: number): number => VT + i * VH + 330;

/** Vistas de dos repisas: la de arriba es el encuadre de entrada de la sección. */
export const PAIRS: Rect[] = [
  { x: 196, y: 100, w: 1208, h: 752 },
  { x: 196, y: 820, w: 1208, h: 752 },
];

const centered = (cx: number, cy: number, w: number, h: number): Rect => ({
  x: cx - w / 2,
  y: cy - h / 2,
  w,
  h,
});

export interface ShelfItem extends SectionItem {
  id: TopicId;
  name: string;
  plate: string;
  /** Repisa (0–3) y par de repisas en que está. */
  index: number;
  pair: number;
  /** Encuadre de la cámara al elegirla y zona clicable de la repisa. */
  frame: Rect;
  hit: Rect;
}

export const fueraItems: ShelfItem[] = topics.map((topic, index) => ({
  ...topic,
  index,
  pair: index < 2 ? 0 : 1,
  frame: centered(800, VT + index * VH + 170, 1180, 738),
  // El contorno punteado (9 px por fuera) queda a 13 px de cada lateral, sin taparse con el derecho.
  hit: { x: 254, y: VT + index * VH + 20, w: 1092, h: 330 },
}));

export const fueraItem = (id: string) => fueraItems.find((item) => item.id === id);

/** Centro del detalle que vuela al frente (libro, caja, consola) en cada repisa. */
export const DETAIL_CENTER = { juegos: { x: 800, y: 262 }, anime: { x: 800, y: 440 } };

/**
 * Juegos: cajas de mesa apiladas (la primera arriba, cada una corrida `jitter` px; su tamaño está en
 * `games`), cartuchos sobre la pila, consola, d20. La caja elegida sale `slide` px hacia la derecha.
 * La consola de la repisa es la grande (`.console`, 600×290) a un tercio: la grande sale de ella.
 */
export const GAMES = {
  box: { x: 572, jitter: [10, 2, 8, 0], slide: 24, base: shelfBase(0) },
  cart: { x: 298, step: 50, w: 46, h: 64, top: shelfBase(0) - 90 - 38 - 64 },
  handheld: { x: 902, y: 354, w: 198, h: 96 },
  d20: { x: 1238, y: 392 },
};

/**
 * Anime: lomos de los tomos; el libro abierto mide 640×280 y vuela desde su lomo. El fūrin cuelga
 * de la repisa de arriba (`chime` es su zona clicable).
 */
export const ANIME = {
  x: 280,
  w: 54,
  gap: 4,
  base: shelfBase(1),
  book: { x: 480, y: 300 },
  chime: { x: 1236, y: 492, w: 88, h: 262 },
};

/**
 * Cine: cajas de DVD apiladas (la primera arriba, cada una corrida `jitter` px), lente del
 * proyector y pantalla (el telón desplegado). La caja elegida sale `slide` px hacia la derecha.
 */
export const CINE = {
  x: 266,
  w: 190,
  h: 42,
  step: 43,
  jitter: [6, -2, 8, 0, 10, 2],
  slide: 36,
  base: shelfBase(2),
  lens: { x: 1187, y: shelfBase(2) - 140 },
  screen: { x: 707, y: 883, w: 326, h: 224 },
  /** Zona clicable de la claqueta. */
  clapper: { x: 554, y: 1070, w: 112, h: 112 },
};

/** Música: portadas en la repisa de pared y plato del tocadiscos. */
export const MUSICA = {
  x: 262,
  step: 110,
  size: 96,
  top: VT + 3 * VH + 126 - 96 - 4,
  platter: { x: 790, y: shelfBase(3) - 80 },
};
