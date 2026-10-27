/**
 * Paneo en pantallas táctiles: arrastrar con el dedo desplaza la vista (la cámara del cuarto o la
 * mesa de Contacto) dentro de sus límites, con un borde elástico y con inercia al soltar. Un toque
 * sin movimiento sigue siendo un clic; después de un arrastre, el clic se descarta.
 */
import type { Camera } from './geometry';
import { prefersReducedMotion } from './camera';

/** La vista que se mueve: leer y escribir su transform, y el rango permitido de su traslación. */
export interface PanTarget {
  read(): Camera;
  write(camera: Camera): void;
  range(camera: Camera): { x: [number, number]; y: [number, number] };
}

/** Movimiento mínimo (px de pantalla) para que el toque pase a ser arrastre. */
const THRESHOLD = 8;
/** Fracción del movimiento que se aplica más allá del borde. */
const RUBBER = 0.35;
const FRICTION = 0.94;

const clamp = (v: number, [lo, hi]: [number, number]) => Math.min(hi, Math.max(lo, v));

let glide = 0;
/** Detiene la inercia en curso (otra animación toma la vista). */
export const stopPan = () => cancelAnimationFrame(glide);

/**
 * Empieza a seguir un `pointerdown`. `scale` convierte px de pantalla a unidades de la traslación.
 * Llama a `onPan` la primera vez que el toque se vuelve arrastre.
 */
export function trackPan(
  start: PointerEvent,
  surface: HTMLElement,
  target: PanTarget,
  scale: number,
  onPan?: () => void,
): void {
  stopPan();
  const id = start.pointerId;
  let last = { x: start.clientX, y: start.clientY, t: performance.now() };
  let velocity = { x: 0, y: 0 };
  let moving = false;

  const move = (event: PointerEvent) => {
    if (event.pointerId !== id) return;
    if (!moving) {
      if (Math.hypot(event.clientX - start.clientX, event.clientY - start.clientY) < THRESHOLD)
        return;
      moving = true;
      surface.setPointerCapture(id);
      onPan?.();
    }
    const now = performance.now();
    const dx = (event.clientX - last.x) / scale;
    const dy = (event.clientY - last.y) / scale;
    const dt = Math.max(1, now - last.t);
    velocity = { x: 0.8 * (dx / dt) + 0.2 * velocity.x, y: 0.8 * (dy / dt) + 0.2 * velocity.y };
    last = { x: event.clientX, y: event.clientY, t: now };
    const c = target.read();
    const { x, y } = target.range(c);
    const rub = (v: number, d: number, r: [number, number]) =>
      v + (v + d < r[0] || v + d > r[1] ? d * RUBBER : d);
    target.write({ k: c.k, x: rub(c.x, dx, x), y: rub(c.y, dy, y) });
  };

  const end = (event: PointerEvent) => {
    if (event.pointerId !== id) return;
    surface.removeEventListener('pointermove', move);
    surface.removeEventListener('pointerup', end);
    surface.removeEventListener('pointercancel', end);
    if (!moving) return;
    // El clic que sigue a un arrastre no cuenta (no debe entrar a una sección ni abrir un objeto).
    const swallow = (click: Event) => {
      click.preventDefault();
      click.stopPropagation();
    };
    addEventListener('click', swallow, { capture: true, once: true });
    setTimeout(() => removeEventListener('click', swallow, { capture: true }), 0);
    if (performance.now() - last.t > 80 || prefersReducedMotion()) velocity = { x: 0, y: 0 };
    coast(target, velocity);
  };

  surface.addEventListener('pointermove', move);
  surface.addEventListener('pointerup', end);
  surface.addEventListener('pointercancel', end);
}

/** Inercia: la velocidad decae; al terminar (o al pasar el borde) vuelve dentro de los límites. */
function coast(target: PanTarget, v: { x: number; y: number }) {
  let last = performance.now();
  const frame = (now: number) => {
    const dt = Math.min(32, now - last);
    last = now;
    const c = target.read();
    const { x, y } = target.range(c);
    const outside = c.x < x[0] || c.x > x[1] || c.y < y[0] || c.y > y[1];
    if (Math.hypot(v.x, v.y) > 0.02 && !outside) {
      target.write({ k: c.k, x: c.x + v.x * dt, y: c.y + v.y * dt });
      v = { x: v.x * FRICTION, y: v.y * FRICTION };
      glide = requestAnimationFrame(frame);
      return;
    }
    settle(target);
  };
  glide = requestAnimationFrame(frame);
}

/** Vuelve dentro de los límites en ~300 ms. */
function settle(target: PanTarget) {
  const from = target.read();
  const { x, y } = target.range(from);
  const to = { k: from.k, x: clamp(from.x, x), y: clamp(from.y, y) };
  if (to.x === from.x && to.y === from.y) return;
  const t0 = performance.now();
  const frame = (now: number) => {
    const t = Math.min(1, (now - t0) / 300);
    const e = 1 - (1 - t) ** 3;
    target.write({ k: from.k, x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e });
    if (t < 1) glide = requestAnimationFrame(frame);
  };
  glide = requestAnimationFrame(frame);
}
