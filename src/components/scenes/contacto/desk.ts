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
  lapiz: { x: 1010, y: 170, r: -8 },
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
  { id: 'tecla', dx: 420, dy: 120, r: -10 },
  { id: 'disquete', dx: 335, dy: 285, r: 12 },
] as const;

/** Estampillas y stickers: se pegan al sobre si se sueltan encima. */
export const STICKERS = [
  { kind: 'sticker', art: 'star', x: 1170, y: 822, r: -10 },
  { kind: 'stamp', color: 'var(--color-pink)', x: 1262, y: 795, r: -6 },
  { kind: 'stamp', color: 'var(--color-mint)', x: 1335, y: 785, r: 4 },
  { kind: 'stamp', color: 'var(--color-sun)', x: 1408, y: 800, r: -2 },
  { kind: 'sticker', art: 'cat', x: 1484, y: 792, r: 8 },
] as const;

export const spotStyle = ({ x, y, r }: Spot, z: number): string =>
  `--x:${x}px;--y:${y}px;--r:${r}deg;z-index:${z}`;
