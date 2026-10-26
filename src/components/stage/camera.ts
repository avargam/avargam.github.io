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
} as const;

const running = new Set<Animation>();

/** Lleva `el` hasta `to` y deja el valor final escrito en su estilo. Devuelve `false` si fue interrumpida. */
export async function tween(
  el: HTMLElement,
  to: Keyframe,
  duration: number,
  easing = EASE_FADE,
): Promise<boolean> {
  if (duration <= 0) {
    Object.assign(el.style, to);
    return true;
  }
  const animation = el.animate([to], { duration, easing, fill: 'forwards' });
  running.add(animation);
  try {
    await animation.finished;
    animation.commitStyles();
    animation.cancel();
    return true;
  } catch {
    // cancelada por stopAll()
    return false;
  } finally {
    running.delete(animation);
  }
}

/** Congela todas las animaciones en su valor actual y las cancela. */
export function stopAll(): void {
  for (const animation of running) {
    try {
      animation.commitStyles();
    } catch {
      // el elemento quedó oculto; no hay valor que conservar
    }
    animation.cancel();
  }
  running.clear();
}

export async function moveCamera(
  el: HTMLElement,
  camera: Camera,
  duration: number,
): Promise<boolean> {
  el.classList.add('is-moving');
  const done = await tween(el, { transform: cameraTransform(camera) }, duration, EASE_CAMERA);
  el.classList.remove('is-moving');
  return done;
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
