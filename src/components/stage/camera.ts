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
  /** Secciones `tilt`: acercamiento al objeto, y la escena que se endereza encima (empieza antes de que la cámara llegue). */
  tiltCamera: 850,
  tiltSceneDelay: 600,
  tiltSceneIn: 780,
  tiltSceneOut: 700,
  /** Al salir, la cámara empieza a alejarse cuando la escena ya está casi acostada. */
  tiltCameraDelay: 520,
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
export function tween(
  el: HTMLElement,
  to: Keyframe,
  duration: number,
  easing = EASE_FADE,
  delay = 0,
): Promise<boolean> {
  return play(el, [to], { duration, easing, delay });
}

/** Como `tween`, con varios keyframes; si el primero no tiene `offset: 0`, parte del valor actual. */
async function play(
  el: HTMLElement,
  keyframes: Keyframe[],
  { duration, easing = 'linear', delay = 0 }: { duration: number; easing?: string; delay?: number },
): Promise<boolean> {
  const previous = current.get(el);
  if (previous) freeze(previous);
  if (duration <= 0) {
    Object.assign(el.style, keyframes[keyframes.length - 1]);
    return true;
  }
  // `both`: durante el `delay` ya rige el primer keyframe (la escena tilt no se ve antes de tiempo).
  const animation = el.animate(keyframes, { duration, easing, delay, fill: 'both' });
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

export function moveCamera(
  el: HTMLElement,
  camera: Camera,
  duration: number,
  delay = 0,
): Promise<boolean> {
  return tween(el, { transform: cameraTransform(camera) }, duration, EASE_CAMERA, delay);
}

/**
 * Escena de una sección `tilt`, vista desde arriba: entra chica e inclinada sobre el objeto (como
 * el escritorio visto desde la silla), se endereza en el primer 40 % y después solo crece hasta 1:1.
 * El objeto está en el centro del escenario porque la cámara se centra en él.
 */
const TILT = {
  // Del tamaño de las miniaturas con la cámara a `zoom` (2,6): ~100 de ancho × 2,6 ≈ 0,16 del escenario.
  start: 'translate(0px, 32px) perspective(1400px) rotateX(62deg) scale(0.16)',
  upright: 'translate(0px, 14px) perspective(1400px) rotateX(0deg) scale(0.55)',
  flat: 'translate(0px, 0px) perspective(1400px) rotateX(0deg) scale(1)',
};

export function tiltIn(el: HTMLElement, duration: number, delay = 0): Promise<boolean> {
  el.hidden = false;
  return play(
    el,
    [
      { transform: TILT.start, opacity: 0, offset: 0 },
      { transform: TILT.start, opacity: 1, offset: 0.08, easing: 'cubic-bezier(.3, 0, .3, 1)' },
      { transform: TILT.upright, offset: 0.42, easing: 'cubic-bezier(.3, 0, .2, 1)' },
      { transform: TILT.flat, opacity: 1 },
    ],
    { duration, delay },
  );
}

/** La inversa de `tiltIn`, desde donde esté la escena (puede venir de una entrada interrumpida). */
export async function tiltOut(el: HTMLElement, duration: number): Promise<boolean> {
  const done = await play(
    el,
    [
      { transform: TILT.upright, offset: 0.55, easing: 'cubic-bezier(.6, 0, .6, 1)' },
      { transform: TILT.start, opacity: 1, offset: 0.92 },
      { transform: TILT.start, opacity: 0 },
    ],
    { duration, easing: 'cubic-bezier(.6, 0, .8, .4)' },
  );
  if (done) hideTilted(el);
  return done;
}

/** Escena tilt plana y visible (o, con `hideTilted`, oculta y lista para volver a entrar). */
export function showFlat(el: HTMLElement): void {
  el.hidden = false;
  Object.assign(el.style, { transform: TILT.flat, opacity: '1' });
}

export function hideTilted(el: HTMLElement): void {
  el.hidden = true;
  el.style.removeProperty('transform');
  el.style.removeProperty('opacity');
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
