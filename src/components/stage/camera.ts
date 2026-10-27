/**
 * Animaciones del escenario con WAAPI. Cada animación parte del valor actual (keyframe implícito),
 * así una navegación puede interrumpir a otra a mitad de camino sin saltos.
 */
import { cameraTransform, type Camera } from './geometry';

const EASE_CAMERA = 'cubic-bezier(.65, 0, .35, 1)';
const EASE_FADE = 'ease-out';

export const prefersReducedMotion = (): boolean =>
  matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Duraciones en ms del storyboard (T_storyboard_formacion). */
export const DURATION = {
  labelsOut: 200,
  camera: 600,
  overlayIn: 250,
  overlayOut: 150,
  cut: 150,
  labelsIn: 200,
  /** Viaje de la cámara entre ítems dentro de una sección. */
  item: 900,
} as const;

const running = new Set<Animation>();
/** Animación en curso por elemento: una nueva sobre el mismo elemento reemplaza a la anterior. */
const current = new WeakMap<HTMLElement, Animation>();

/** Deja la animación en su valor actual y la cancela. */
function freeze(animation: Animation): void {
  try {
    animation.commitStyles();
  } catch {
    // el elemento quedó oculto; no hay valor que conservar
  }
  animation.cancel();
  running.delete(animation);
}

/**
 * Lleva `el` hasta `to` y deja el valor final escrito en su estilo. Interrumpe la animación
 * anterior del mismo elemento. Devuelve `false` si esta a su vez fue interrumpida.
 */
export async function tween(
  el: HTMLElement,
  to: Keyframe,
  duration: number,
  easing = EASE_FADE,
): Promise<boolean> {
  const previous = current.get(el);
  if (previous) freeze(previous);
  if (duration <= 0) {
    Object.assign(el.style, to);
    return true;
  }
  const animation = el.animate([to], { duration, easing, fill: 'forwards' });
  running.add(animation);
  current.set(el, animation);
  try {
    await animation.finished;
    animation.commitStyles();
    animation.cancel();
    return true;
  } catch {
    // cancelada por stopAll() o por otra animación del mismo elemento
    return false;
  } finally {
    running.delete(animation);
    if (current.get(el) === animation) current.delete(el);
  }
}

/** Congela todas las animaciones en su valor actual y las cancela. */
export function stopAll(): void {
  for (const animation of [...running]) freeze(animation);
}

export function moveCamera(el: HTMLElement, camera: Camera, duration: number): Promise<boolean> {
  return tween(el, { transform: cameraTransform(camera) }, duration, EASE_CAMERA);
}

export async function fadeIn(el: HTMLElement, duration: number): Promise<boolean> {
  if (el.hidden) {
    el.style.opacity = '0';
    el.hidden = false;
  }
  return tween(el, { opacity: '1' }, duration);
}

export async function fadeOut(el: HTMLElement, duration: number): Promise<boolean> {
  if (el.hidden) return true;
  const done = await tween(el, { opacity: '0' }, duration);
  if (done) el.hidden = true;
  return done;
}
