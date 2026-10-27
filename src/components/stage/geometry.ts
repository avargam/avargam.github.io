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

/** Cámara que hace que `r` cubra el escenario completo, centrado. */
export function cameraCovering(r: Rect): Camera {
  return cameraCentering(r, Math.max(STAGE_W / r.w, STAGE_H / r.h));
}

/** Cámara que encuadra una zona de la escena (en coordenadas de la escena), p. ej. un ítem. */
export function cameraForSceneRect(section: ZoomSection, r: Rect): Camera {
  const { placement: p } = section;
  return cameraCovering({
    x: p.x + r.x * p.scale,
    y: p.y + r.y * p.scale,
    w: r.w * p.scale,
    h: r.h * p.scale,
  });
}

/** Cámara a escala `k` con el centro de `r` en el centro del escenario. */
export function cameraCentering(r: Rect, k: number): Camera {
  return { k, x: STAGE_W / 2 - k * (r.x + r.w / 2), y: STAGE_H / 2 - k * (r.y + r.h / 2) };
}

/**
 * Cámara final de una sección: su `frame` o, si no tiene, todo lo que se ve en el cuarto. Las de
 * tipo `tilt` se acercan solo hasta `zoom`: su escena entra encima, a 1:1.
 */
export const cameraFor = (section: Section | undefined): Camera =>
  !section
    ? ROOM_CAMERA
    : section.transition === 'tilt'
      ? cameraCentering(section.object, section.zoom)
      : section.frame
        ? cameraForSceneRect(section, section.frame)
        : cameraCovering(objectRect(section));
