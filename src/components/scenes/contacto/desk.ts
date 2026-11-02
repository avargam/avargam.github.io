/**
 * Mesa de Contacto, vista desde arriba (1600×1000): dónde está cada cosa al entrar y al ordenar.
 * Viene del prototipo `prototype/detalle-correo/objetos.html`.
 */
import type { SectionItem } from '../../stage/itemNav';
import { contacts } from '../../../data/contact';

/** Esquina superior izquierda y rotación de un objeto sobre la mesa. */
export interface Spot {
  x: number;
  y: number;
  r: number;
}

export const contactoItems: SectionItem[] = contacts.map(({ id, chip }) => ({ id, chip }));

export const HOME = {
  github: { x: 120, y: 170, r: -5 },
  cv: { x: 150, y: 520, r: 4 },
  correo: { x: 590, y: 410, r: 2 },
  linkedin: { x: 1220, y: 400, r: 5 },
  boligrafo: { x: 1010, y: 186, r: -8 },
} satisfies Record<string, Spot>;

/** Tamaño del paquete y del sobre: se sueltan cosas encima (para guardarlas o pegarlas). */
export const SIZE = {
  github: { w: 380, h: 290 },
  correo: { w: 570, h: 400 },
};

/** La tarjeta guardada asoma del tarjetero; sin JS, `#linkedin` la deja junto a él. */
export const cardInHolder = (h: Spot): Spot => ({ x: h.x + 10, y: h.y, r: h.r });
export const CARD_OUT: Spot = { x: 1160, y: 170, r: -3 };

/** Lo que trae el paquete. Su lugar es relativo al paquete (que se puede mover). */
export const LOOT = [
  { id: 'pato', dx: 410, dy: -30, r: 8 },
  { id: 'enter', dx: 428, dy: 116, r: -10 },
  { id: 'pendrive', dx: 350, dy: 282, r: 14 },
] as const;

/**
 * Relleno del paquete: pellets de embalaje que se arrastran y se lanzan fuera de la mesa. Su lugar
 * en la caja es fijo (sale de una semilla) para que el HTML y "Ordenar" coincidan.
 */
export const PELLETS = {
  count: 46,
  /** Caja donde quepa uno: el elemento (zona de agarre) mide más que el dibujo. */
  w: 40,
  h: 30,
  /** Velocidad mínima al soltar para lanzarlo, en unidades de la mesa por ms. */
  fling: 1.4,
  colors: ['#F5E6B8', '#FFE0CC', '#FBF4FF', '#F5E6B8'],
};

/** Generador con semilla (mulberry32): mismo relleno en cada carga. */
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = seeded(7);
/** Lugar de cada pellet dentro de la caja (esquina superior izquierda de su elemento). */
export const PELLET_SPOTS: (Spot & { color: string })[] = Array.from(
  { length: PELLETS.count },
  (_, i) => ({
    x: Math.round(6 + rand() * (SIZE.github.w - PELLETS.w - 12)),
    y: Math.round(6 + rand() * (SIZE.github.h - PELLETS.h - 12)),
    r: Math.round(rand() * 360),
    color: PELLETS.colors[i % PELLETS.colors.length],
  }),
);

/**
 * Hoja de stickers (la colección de Experiencia): cada uno se despega al arrastrarlo, se pega al
 * sobre si se suelta encima y vuelve a su hueco si se suelta sobre la hoja. El corazón ya viene
 * despegado.
 */
export const SHEET = {
  spot: { x: 1236, y: 736, r: -2 },
  w: 300,
  h: 250,
  /** Celdas de 66 en 4 columnas, desde (18, 40). */
  cell: 66,
  cols: 4,
  origin: { x: 18, y: 40 },
  /** Tamaño del sticker despegado y su escala sobre la hoja. */
  size: 78,
  onSheet: 0.72,
};

export const STICKER_KINDS = [
  'heart',
  'cookie',
  'cat',
  'beanie',
  'book',
  'moon',
  'cloud',
  'yarn',
  'plant',
  'mug',
  'candle',
  'zeppelin',
] as const;

export type StickerKind = (typeof STICKER_KINDS)[number];

/** Los que empiezan fuera de la hoja, sobre la mesa. */
export const PEELED: Partial<Record<StickerKind, Spot>> = {
  heart: { x: 1108, y: 832, r: -12 },
};

/** Lugar del sticker (su esquina) en la hoja, en coordenadas de la hoja. */
export function slotSpot(i: number): Spot {
  const { cell, cols, origin, size } = SHEET;
  return {
    x: origin.x + (i % cols) * cell + cell / 2 - size / 2,
    y: origin.y + Math.floor(i / cols) * cell + cell / 2 - size / 2,
    r: 0,
  };
}

/** Pasa un punto local de un objeto (que gira sobre su centro) a la mesa. */
export function toDesk(obj: Spot, w: number, h: number, px: number, py: number) {
  const a = (obj.r * Math.PI) / 180;
  const dx = px - w / 2;
  const dy = py - h / 2;
  return {
    x: obj.x + w / 2 + dx * Math.cos(a) - dy * Math.sin(a),
    y: obj.y + h / 2 + dx * Math.sin(a) + dy * Math.cos(a),
  };
}

/** Lo inverso de `toDesk`: un punto de la mesa en coordenadas locales del objeto. */
export function fromDesk(obj: Spot, w: number, h: number, x: number, y: number) {
  const a = (-obj.r * Math.PI) / 180;
  const dx = x - obj.x - w / 2;
  const dy = y - obj.y - h / 2;
  return {
    x: w / 2 + dx * Math.cos(a) - dy * Math.sin(a),
    y: h / 2 + dx * Math.sin(a) + dy * Math.cos(a),
  };
}

export const spotStyle = ({ x, y, r }: Spot, z: number): string =>
  `--x:${x}px;--y:${y}px;--r:${r}deg;z-index:${z}`;
