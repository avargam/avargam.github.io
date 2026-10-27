/**
 * Geometría del escenario. Todo se mide en unidades del cuarto (1600×1000); cada escena usa
 * el mismo sistema y se incrusta en el cuarto con `placement`. La cámara es un transform
 * (`translate` + `scale`, con origen 0 0) aplicado sobre el cuarto completo.
 */
import type { Section, ZoomSection } from '../../data/sections';

export const STAGE_W = 1600;
export const STAGE_H = 1000;

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Origen y escala de una escena dentro del cuarto. */
export interface Placement {
  x: number;
  y: number;
  scale: number;
}

/** Transform de cámara: punto del cuarto `p` → pantalla `k·p + (x, y)`. */
export interface Camera {
  x: number;
  y: number;
  k: number;
}

export const ROOM_CAMERA: Camera = { x: 0, y: 0, k: 1 };

/** Parte visible del escenario, en sus unidades, centrada en él (`s` es la escala a la pantalla). */
export interface View {
  s: number;
  w: number;
  h: number;
}

/**
 * Lo que se ve del escenario. Con mouse es todo (1600×1000); en pantallas táctiles el escenario
 * llena la pantalla y se ve una franja. Lo calcula el script de `RoomLayout` antes del primer paint;
 * en el build (sin `document`) es el escenario completo.
 */
export function readView(): View {
  if (typeof document === 'undefined') return { s: 1, w: STAGE_W, h: STAGE_H };
  const style = document.documentElement.style;
  const read = (name: string, fallback: number) =>
    parseFloat(style.getPropertyValue(name)) || fallback;
  return { s: read('--fit', 1), w: read('--vw', STAGE_W), h: read('--vh', STAGE_H) };
}

/** Rango de la traslación para que, a escala `k`, lo visible no salga de `b`; si `b` es más chico, lo centra. */
export function panRange(k: number, b: Rect, view: View = readView()) {
  const range = (v: number, total: number, start: number, size: number): [number, number] => {
    const visible0 = (total - v) / 2;
    const lo = visible0 + v - k * (start + size);
    const hi = visible0 - k * start;
    return lo <= hi ? [lo, hi] : [(lo + hi) / 2, (lo + hi) / 2];
  };
  return { x: range(view.w, STAGE_W, b.x, b.w), y: range(view.h, STAGE_H, b.y, b.h) };
}

export const clampCamera = (c: Camera, b: Rect, view: View = readView()): Camera => {
  const { x, y } = panRange(c.k, b, view);
  return { k: c.k, x: Math.min(x[1], Math.max(x[0], c.x)), y: Math.min(y[1], Math.max(y[0], c.y)) };
};

/** Transform de la escena dentro de la caja de su objeto (`objectRect`), para que el recorte quede alineado. */
export function sceneInObject(section: ZoomSection): string {
  const { placement: p, crop } = section;
  return `translate(${-(crop?.x ?? 0) * p.scale}px, ${-(crop?.y ?? 0) * p.scale}px) scale(${p.scale})`;
}

export const rectStyle = (r: Rect): string =>
  `left:${r.x}px;top:${r.y}px;width:${r.w}px;height:${r.h}px`;

export const cameraTransform = (c: Camera): string => `translate(${c.x}px, ${c.y}px) scale(${c.k})`;

/** Rectángulo que ocupa el objeto de la sección en el cuarto. */
export function objectRect(section: Section): Rect {
  if (section.transition === 'tilt') return section.object;
  const { placement: p, crop } = section;
  const r = crop ?? { x: 0, y: 0, w: STAGE_W, h: STAGE_H };
  return { x: p.x + r.x * p.scale, y: p.y + r.y * p.scale, w: r.w * p.scale, h: r.h * p.scale };
}

/** Cámara que hace que `r` cubra lo visible del escenario, centrado (en pantallas táctiles, la franja visible). */
export function cameraCovering(r: Rect, view: View = readView()): Camera {
  return cameraCentering(r, Math.max(view.w / r.w, view.h / r.h));
}

/** Zona de la escena (en sus coordenadas) llevada al cuarto. */
export function sceneToRoom(section: ZoomSection, r: Rect): Rect {
  const { placement: p } = section;
  return { x: p.x + r.x * p.scale, y: p.y + r.y * p.scale, w: r.w * p.scale, h: r.h * p.scale };
}

/** Escala de la vista de la sección en el teléfono: cubre lo visible con su `frame` o con la escena entera. */
const sectionScale = (section: ZoomSection, view: View) =>
  cameraCovering(section.frame ? sceneToRoom(section, section.frame) : objectRect(section), view).k;

/**
 * Cámara que encuadra una zona de la escena (en coordenadas de la escena), p. ej. un ítem. Si se ve
 * solo una franja (pantallas táctiles), no se acerca más que la vista de la sección, salvo para que
 * la zona quepa entera: la centra y lo demás se ve deslizando.
 */
export function cameraForSceneRect(section: ZoomSection, r: Rect, view: View = readView()): Camera {
  const room = sceneToRoom(section, r);
  if (view.w >= STAGE_W) return cameraCovering(room, view);
  const k = Math.max(sectionScale(section, view), Math.min(view.w / room.w, view.h / room.h));
  return clampCamera(cameraCentering(room, k), objectRect(section), view);
}

/** Cámara a escala `k` con el centro de `r` en el centro del escenario. */
export function cameraCentering(r: Rect, k: number): Camera {
  return { k, x: STAGE_W / 2 - k * (r.x + r.w / 2), y: STAGE_H / 2 - k * (r.y + r.h / 2) };
}

/**
 * Cámara final de una sección: su `frame` o, si no tiene, todo lo que se ve en el cuarto. Las de
 * tipo `tilt` se acercan solo hasta `zoom`: su escena entra encima, a 1:1. Si se ve solo una
 * franja de la escena (pantallas táctiles), la cámara parte desde su borde izquierdo.
 */
export function cameraFor(section: Section | undefined, view: View = readView()): Camera {
  if (!section) return ROOM_CAMERA;
  if (section.transition === 'tilt') return cameraCentering(section.object, section.zoom);
  const frame = section.frame ? sceneToRoom(section, section.frame) : objectRect(section);
  const camera = cameraCovering(frame, view);
  if (view.w >= STAGE_W) return camera;
  const clamped = clampCamera(camera, objectRect(section), view);
  if (section.touchStart !== 'left') return clamped;
  return { ...clamped, x: panRange(camera.k, objectRect(section), view).x[1] };
}
