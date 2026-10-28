/**
 * Arrastre con el puntero de un objeto de una escena (en sus unidades: la escena mide 1600 de
 * ancho y la cámara la escala). Lo usan la mesa de Contacto y los stickers del corcho. Mientras se
 * mueve, el objeto lleva `data-lifted`; quien lo usa decide dónde queda y qué pasa al soltarlo.
 *
 * El HTML marca lo arrastrable con `data-draggable` (o lo envuelve en `[data-desk]`): en pantallas
 * táctiles, el router no recorre la escena cuando el dedo empieza encima.
 */
import { STAGE_W } from './geometry';

/** Movimiento mínimo (en unidades del escenario) para que un clic pase a ser arrastre. */
export const DRAG_THRESHOLD = 5;

export interface DragHandlers {
  /** El puntero superó el umbral: el objeto empieza a moverse. */
  start?: () => void;
  /** Desplazamiento desde donde se tomó, en unidades de la escena. */
  move: (dx: number, dy: number) => void;
  /** Se soltó; `moved` es falso si fue un clic. */
  end: (moved: boolean) => void;
}

/** Sigue el puntero de `event` sobre `el` hasta soltarlo. `scene` da la escala (su ancho es 1600). */
export function trackDrag(
  event: PointerEvent,
  el: HTMLElement,
  scene: HTMLElement,
  { start, move, end }: DragHandlers,
) {
  event.preventDefault();
  el.setPointerCapture(event.pointerId);
  const k = scene.getBoundingClientRect().width / STAGE_W;
  const { pointerId, clientX: sx, clientY: sy } = event;
  let moved = false;

  const onMove = (e: PointerEvent) => {
    if (e.pointerId !== pointerId) return;
    const dx = (e.clientX - sx) / k;
    const dy = (e.clientY - sy) / k;
    if (!moved) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      moved = true;
      el.setAttribute('data-lifted', '');
      start?.();
    }
    move(dx, dy);
  };
  const onEnd = (e: PointerEvent) => {
    if (e.pointerId !== pointerId) return;
    el.removeEventListener('pointermove', onMove);
    el.removeEventListener('pointerup', onEnd);
    el.removeEventListener('pointercancel', onEnd);
    el.removeAttribute('data-lifted');
    end(moved);
  };
  el.addEventListener('pointermove', onMove);
  el.addEventListener('pointerup', onEnd);
  el.addEventListener('pointercancel', onEnd);
}

/** Vuelve a poner un atributo que dispara una animación CSS, para que se repita. */
export function restartAttr(el: HTMLElement, attr: string) {
  el.removeAttribute(attr);
  void el.offsetWidth;
  el.setAttribute(attr, '');
}
