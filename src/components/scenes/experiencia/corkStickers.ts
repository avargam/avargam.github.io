/**
 * Stickers decorativos del corcho (`[data-cork-sticker]`): se arrastran por el corcho y, soltados
 * sobre la postal abierta, se pegan a ella (`[data-postcard-stuck]`): viajan con la postal cuando se
 * cae y siguen ahí al volver a abrirla. Tomar uno pegado lo devuelve al corcho. Nada se guarda al
 * recargar. Posiciones en unidades de la escena (`left`, `top` y `rotate` del sticker).
 */
import { restartAttr, trackDrag } from '../../stage/drag';
import { POSTCARD } from './board';

/** Área de corcho dentro del marco (`art/cork.png`): el centro del sticker no sale de ella. */
const CORK = { x0: 55, y0: 55, x1: 1545, y1: 945 };
/** Margen dentro de la postal para que un sticker se pegue. */
const STICK_MARGIN = 10;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const num = (value: string) => parseFloat(value) || 0;

export function initCorkStickers() {
  const scene = document.querySelector<HTMLElement>('[data-scene="experiencia"]');
  const board = scene?.querySelector<HTMLElement>('[data-sticker-board]');
  if (!scene || !board) return;

  const tilt = (postcard: Element) => num(getComputedStyle(postcard).getPropertyValue('--tilt'));

  function place(el: HTMLElement, x: number, y: number, r = num(el.style.rotate)) {
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.rotate = `${r}deg`;
  }

  /** Despega un sticker de su postal y lo deja en el corcho, en el mismo lugar. */
  function unstick(el: HTMLElement) {
    const postcard = el.closest('.postcard');
    if (!postcard) return;
    board!.append(el);
    el.removeAttribute('data-stuck');
    const x = num(el.style.left) + POSTCARD.x;
    const y = num(el.style.top) + POSTCARD.y;
    place(el, x, y, num(el.style.rotate) + tilt(postcard));
  }

  /** Si el sticker quedó sobre la postal abierta, se pega a ella. */
  function stickIfOnPostcard(el: HTMLElement) {
    const postcard = scene!.querySelector<HTMLElement>('.postcard[data-active]');
    const layer = postcard?.querySelector<HTMLElement>('[data-postcard-stuck]');
    if (!postcard || !layer) return;
    const x = num(el.style.left) - POSTCARD.x;
    const y = num(el.style.top) - POSTCARD.y;
    const cx = x + el.offsetWidth / 2;
    const cy = y + el.offsetHeight / 2;
    const m = STICK_MARGIN;
    if (cx < m || cx > POSTCARD.w - m || cy < m || cy > POSTCARD.h - m) return;
    layer.append(el);
    place(el, x, y, num(el.style.rotate) - tilt(postcard));
    restartAttr(el, 'data-stuck');
  }

  scene.addEventListener('pointerdown', (event) => {
    const el = (event.target as Element).closest<HTMLElement>('[data-cork-sticker]');
    if (!el || event.button !== 0) return;
    unstick(el);
    const x = num(el.style.left);
    const y = num(el.style.top);
    const hw = el.offsetWidth / 2;
    const hh = el.offsetHeight / 2;
    trackDrag(event, el, scene, {
      move(dx, dy) {
        place(
          el,
          clamp(x + dx, CORK.x0 - hw, CORK.x1 - hw),
          clamp(y + dy, CORK.y0 - hh, CORK.y1 - hh),
        );
      },
      end(moved) {
        if (!moved) return;
        restartAttr(el, 'data-drop');
        stickIfOnPostcard(el);
      },
    });
  });
}
