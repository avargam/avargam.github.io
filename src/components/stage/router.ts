/**
 * Navegación del cuarto: convierte clics, teclado y back/forward en movimientos de cámara.
 *
 * Toda navegación pasa por `go(target)`, que interrumpe la anterior y anima desde el estado
 * visual actual. El HTML de cada ruta ya viene en su estado final, así que sin JS todo funciona
 * con navegación normal.
 */
import { profile } from '../../data/profile';
import { sectionBySlug, sections, type SectionSlug } from '../../data/sections';
import {
  DURATION,
  fadeIn,
  fadeOut,
  hideTilted,
  moveCamera,
  prefersReducedMotion,
  showFlat,
  stopAll,
  tiltIn,
  tiltOut,
  tween,
} from './camera';
import {
  cameraFor,
  cameraForSceneRect,
  cameraTransform,
  clampCamera,
  objectRect,
  panRange,
  readView,
  ROOM_CAMERA,
  sceneToRoom,
  STAGE_H,
  STAGE_W,
  type Camera,
  type Rect,
} from './geometry';
import { stopPan, trackPan, type PanTarget } from './pan';

type Target = SectionSlug | null;
type HistoryMode = 'push' | 'replace' | 'none';

interface HistoryState {
  section: Target;
  /** Hay una entrada del cuarto justo antes en el historial: Volver puede usar `history.back()`. */
  fromRoom: boolean;
}

/**
 * Comportamiento propio de una sección abierta (ítems, teclado). Se registra con
 * `registerSection` desde el script de la sección.
 */
export interface SectionController {
  /** Después del zoom de entrada (o del fundido): aplica la selección inicial. */
  enter(): void;
  /** Antes del zoom de salida: quita la selección para que la escena vuelva al reposo. */
  leave(): void;
  /** Teclas dentro de la sección (← →, dígitos…). Devuelve `true` si la consumió. */
  onKey(event: KeyboardEvent): boolean;
}

const controllers = new Map<SectionSlug, SectionController>();

export function registerSection(slug: SectionSlug, controller: SectionController): void {
  controllers.set(slug, controller);
}

let stageCamera: HTMLElement | null = null;

/** Pantalla táctil: el escenario la llena y se recorre con el dedo (lo decide `RoomLayout`). */
export const isTouch = (): boolean => document.documentElement.classList.contains('touch');

const ROOM_RECT: Rect = { x: 0, y: 0, w: STAGE_W, h: STAGE_H };

/** Hasta dónde se puede recorrer: el cuarto, o la escena de una sección `zoom` (las `tilt` no mueven la cámara). */
function panBounds(slug: SectionSlug | null): Rect | null {
  const section = slug ? sectionBySlug(slug) : undefined;
  if (!section) return ROOM_RECT;
  return section.transition === 'zoom' ? objectRect(section) : null;
}

/** Transform actual de la cámara (también a mitad de una animación). */
function readCamera(el: HTMLElement): Camera {
  const m = new DOMMatrix(getComputedStyle(el).transform);
  return { k: m.a, x: m.e, y: m.f };
}

/**
 * En pantallas táctiles, centra una zona de la escena sin cambiar el zoom (la postal de una nota,
 * la ventana de un proyecto): lo demás se ve deslizando. Con mouse no hace nada, porque se ve todo.
 */
export function panToSceneRect(slug: SectionSlug, rect: Rect, instant = false): Promise<boolean> {
  const section = sectionBySlug(slug);
  stageCamera ??= document.querySelector<HTMLElement>('[data-camera]');
  if (!isTouch() || !stageCamera || section?.transition !== 'zoom') return Promise.resolve(true);
  const r = sceneToRoom(section, rect);
  const { k } = cameraFor(section);
  const centered = {
    k,
    x: STAGE_W / 2 - k * (r.x + r.w / 2),
    y: STAGE_H / 2 - k * (r.y + r.h / 2),
  };
  const duration = instant || prefersReducedMotion() ? 0 : DURATION.item * 0.6;
  return moveCamera(stageCamera, clampCamera(centered, objectRect(section)), duration);
}

/**
 * Mueve la cámara dentro de una sección abierta: a una zona de su escena (un ítem) o, con
 * `null`, de vuelta al encuadre de la sección. Devuelve `false` si otra animación la interrumpió.
 */
export function focusSceneRect(
  slug: SectionSlug,
  rect: Rect | null,
  instant = false,
): Promise<boolean> {
  const section = sectionBySlug(slug);
  // El script de una sección puede ejecutarse antes que initRouter (deep link con #ítem).
  stageCamera ??= document.querySelector<HTMLElement>('[data-camera]');
  if (!stageCamera || section?.transition !== 'zoom') return Promise.resolve(false);
  const camera = rect ? cameraForSceneRect(section, rect) : cameraFor(section);
  const duration = instant || prefersReducedMotion() ? 0 : DURATION.item;
  return moveCamera(stageCamera, camera, duration);
}

/**
 * Cómo pasar de una sección a otra con un enlace directo entre secciones: `cut` funde directo;
 * `via-room` sale al cuarto y vuelve a entrar. (El teclado no cambia de sección dentro de una:
 * los dígitos eligen ítems.)
 */
const SWITCH_MODE = 'cut' as 'cut' | 'via-room';

const base = import.meta.env.BASE_URL.replace(/\/$/, '');
const urlFor = (target: Target) => `${base}/${target ?? ''}`;

function targetFromPath(pathname: string): Target {
  const slug = pathname
    .slice(base.length)
    .replace(/^\/+|\/+$/g, '')
    .replace(/\.html$/, '');
  return sectionBySlug(slug)?.slug ?? null;
}

const titleFor = (target: Target) =>
  target ? `${sectionBySlug(target)?.label} · ${profile.shortName}` : profile.name;

function queryStage() {
  const root = document.querySelector<HTMLElement>('[data-room-root]');
  const stage = root?.querySelector<HTMLElement>('[data-stage]');
  const camera = root?.querySelector<HTMLElement>('[data-camera]');
  const announcer = root?.querySelector<HTMLElement>('[data-announcer]');
  if (!root || !stage || !camera || !announcer) return null;
  return { root, stage, camera, announcer };
}

export function initRouter(): void {
  const dom = queryStage();
  if (!dom) return;
  const { root, stage, camera, announcer } = dom;
  stageCamera = camera;

  const all = (selector: string) => [...root.querySelectorAll<HTMLElement>(selector)];
  /** Etiquetas, chips y pista: se desvanecen antes del zoom. */
  const roomUi = all('[data-room-ui]');
  const overlays = all('[data-overlay]');
  const scenes = all('[data-scene]');
  const roomOnly = all('[data-room-only]');
  /** Escenas de las secciones `tilt`: van sobre la cámara, a 1:1, y entran inclinadas. */
  const tiltScenes = all('[data-tilt-scene]');
  const tiltScene = (target: Target) => tiltScenes.find((el) => el.dataset.tiltScene === target);
  const hotspots = sections.map((s) =>
    root.querySelector<HTMLElement>(`[data-hotspot="${s.slug}"]`),
  );

  let current: Target = targetFromPath(location.pathname);
  /** La sección terminó de entrar: recién ahí recibe el teclado (si no, un ítem cortaría el zoom de entrada). */
  let settled = true;
  let generation = 0;
  history.replaceState({ section: current, fromRoom: false } satisfies HistoryState, '');
  if (current === null) root.dataset.view = 'room';

  const announce = (message: string) => {
    announcer.textContent = message;
  };

  /** Solo la escena abierta (o el cuarto) recibe foco y clics. */
  function applyInert(target: Target) {
    for (const el of roomOnly) el.inert = target !== null;
    for (const el of scenes) el.inert = el.dataset.scene !== target;
  }

  function updateHistory(target: Target, mode: HistoryMode, from: Target) {
    if (mode === 'none') return;
    const prev = history.state as HistoryState | null;
    const state: HistoryState = {
      section: target,
      fromRoom: from === null ? target !== null : (prev?.fromRoom ?? false),
    };
    history[mode === 'push' ? 'pushState' : 'replaceState'](state, '', urlFor(target));
  }

  async function go(target: Target, mode: HistoryMode) {
    const from = current;
    const id = ++generation;
    const alive = () => id === generation;
    current = target;
    settled = false;
    // A diferencia de `data-view`, cambia al empezar el viaje: lo que reacciona a él (el velo de la
    // ventana) se anima junto con la cámara.
    root.dataset.destination = target ?? 'room';
    disarm();
    // Las animaciones ambientales del cuarto se pausan durante el zoom y dentro de las secciones.
    delete root.dataset.view;

    stopAll();
    stopPan();
    updateHistory(target, mode, from);
    document.title = titleFor(target);
    applyInert(target);

    const overlay = overlays.find((el) => el.dataset.overlay === target);
    const others = overlays.filter((el) => el !== overlay && !el.hidden);
    const reduced = prefersReducedMotion();
    const isSwitch = from !== null && target !== null;
    const scene = tiltScene(target);
    const fromScene = tiltScene(from);
    if (from !== null) controllers.get(from)?.leave();

    if (reduced || (isSwitch && SWITCH_MODE === 'cut')) {
      // Fundido: oscurece el escenario, cambia todo de golpe y vuelve a mostrarlo.
      if (!(await tween(stage, { opacity: '0' }, DURATION.cut)) || !alive()) return;
      for (const el of others) el.hidden = true;
      for (const el of tiltScenes) {
        if (el === scene) showFlat(el);
        else hideTilted(el);
      }
      await moveCamera(camera, cameraFor(target ? sectionBySlug(target) : undefined), 0);
      for (const el of roomUi) {
        el.hidden = target !== null;
        el.style.opacity = '1';
      }
      if (target !== null) controllers.get(target)?.enter();
      if (overlay) {
        overlay.hidden = false;
        overlay.style.opacity = '1';
      }
      if (!(await tween(stage, { opacity: '1' }, DURATION.cut)) || !alive()) return;
    } else {
      await tween(stage, { opacity: '1' }, DURATION.cut);
      if (target !== null) {
        // Entrar: etiquetas fuera → zoom → overlay.
        await Promise.all([
          ...roomUi.map((el) => fadeOut(el, DURATION.labelsOut)),
          ...others.map((el) => fadeOut(el, DURATION.overlayOut)),
        ]);
        if (!alive()) return;
        if (isSwitch && !(await moveCamera(camera, cameraFor(undefined), DURATION.camera))) return;
        if (!alive()) return;
        const entered = scene
          ? // La cámara se acerca al objeto y la escena se endereza encima antes de que llegue.
            (
              await Promise.all([
                moveCamera(camera, cameraFor(sectionBySlug(target)), DURATION.tiltCamera),
                tiltIn(scene, DURATION.tiltSceneIn, DURATION.tiltSceneDelay),
              ])
            ).every(Boolean)
          : await moveCamera(camera, cameraFor(sectionBySlug(target)), DURATION.camera);
        if (!entered || !alive()) return;
        controllers.get(target)?.enter();
        if (overlay && (!(await fadeIn(overlay, DURATION.overlayIn)) || !alive())) return;
      } else {
        // Salir: overlay fuera → zoom inverso → etiquetas.
        await Promise.all(others.map((el) => fadeOut(el, DURATION.overlayOut)));
        if (!alive()) return;
        const left = fromScene
          ? (
              await Promise.all([
                tiltOut(fromScene, DURATION.tiltSceneOut),
                moveCamera(camera, ROOM_CAMERA, DURATION.tiltCamera, DURATION.tiltCameraDelay),
              ])
            ).every(Boolean)
          : await moveCamera(camera, ROOM_CAMERA, DURATION.camera);
        if (!left || !alive()) return;
        const shown = await Promise.all(roomUi.map((el) => fadeIn(el, DURATION.labelsIn)));
        if (shown.includes(false) || !alive()) return;
      }
    }

    settled = true;
    if (target === null) root.dataset.view = 'room';
    if (target !== null) {
      overlay?.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
      announce(sectionBySlug(target)?.label ?? '');
    } else {
      if (from !== null)
        hotspots[sections.findIndex((s) => s.slug === from)]?.focus({ preventScroll: true });
      announce('Cuarto');
    }
  }

  function navigate(target: Target) {
    if (target === current) return;
    if (target === null) return back();
    go(target, current === null ? 'push' : 'replace');
  }

  /** Volver al cuarto: deshace la entrada si vino del cuarto; si llegó por enlace directo, reemplaza la URL. */
  function back() {
    if (current === null) return;
    if ((history.state as HistoryState | null)?.fromRoom) history.back();
    else go(null, 'replace');
  }

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(profile.email);
      announce(`Correo copiado: ${profile.email}`);
    } catch {
      announce(`No se pudo copiar. El correo es ${profile.email}`);
    }
  }

  function moveFocus(step: number) {
    const links = hotspots.filter((el): el is HTMLElement => el !== null);
    const index = links.indexOf(document.activeElement as HTMLElement);
    const next =
      index === -1
        ? step > 0
          ? 0
          : links.length - 1
        : (index + step + links.length) % links.length;
    links[next]?.focus();
  }

  /* ---------- pantallas táctiles: paneo y doble toque ---------- */
  const roomHint = root.querySelector<HTMLElement>('[data-room-hint]');
  const ROOM_HINT = roomHint?.textContent ?? '';

  /** En el cuarto, el primer toque en un objeto lo resalta y lo centra; el segundo entra. */
  function arm(slug: SectionSlug) {
    const section = sectionBySlug(slug);
    if (!section) return;
    root.dataset.armed = slug;
    const label = `Toca de nuevo para entrar a ${section.label}`;
    if (roomHint) roomHint.textContent = label;
    announce(label);
    const r = objectRect(section);
    const centered = { k: 1, x: STAGE_W / 2 - (r.x + r.w / 2), y: STAGE_H / 2 - (r.y + r.h / 2) };
    stopPan();
    void moveCamera(camera, clampCamera(centered, ROOM_RECT), prefersReducedMotion() ? 0 : 450);
  }

  function disarm() {
    if (!root.dataset.armed) return;
    delete root.dataset.armed;
    if (roomHint) roomHint.textContent = ROOM_HINT;
  }

  const cameraPan: PanTarget = {
    read: () => readCamera(camera),
    write: (c) => {
      camera.style.transform = cameraTransform(c);
    },
    range: (c) => panRange(c.k, panBounds(current) ?? ROOM_RECT),
  };

  root.addEventListener('pointerdown', (event) => {
    if (!isTouch() || !settled || event.button !== 0 || !panBounds(current)) return;
    // La UI de pantalla (chips con su propio scroll), la mesa de Contacto y lo arrastrable manejan su arrastre.
    if ((event.target as Element).closest('[data-screen], [data-desk], [data-draggable]')) return;
    stopAll();
    trackPan(event, root, cameraPan, readView().s);
  });

  /** Al girar el teléfono cambia lo visible: la cámara vuelve al encuadre de la sección. */
  addEventListener('resize', () => {
    if (!isTouch() || !settled) return;
    void moveCamera(camera, cameraFor(current ? sectionBySlug(current) : undefined), 0);
  });
  // El HTML trae la cámara calculada para el escenario completo; en pantallas táctiles se ve una
  // franja, así que se recalcula (salvo con un #ítem, que ya encuadró su sección).
  if (isTouch() && !location.hash) {
    void moveCamera(camera, cameraFor(current ? sectionBySlug(current) : undefined), 0);
  }

  root.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = (event.target as Element).closest<HTMLAnchorElement>(
      'a[data-section], a[data-back]',
    );
    if (!link) {
      disarm();
      return;
    }
    event.preventDefault();
    const slug = link.dataset.section as SectionSlug | undefined;
    if (slug && isTouch() && current === null && root.dataset.armed !== slug) return arm(slug);
    navigate(link.hasAttribute('data-back') ? null : (slug ?? null));
  });

  addEventListener('popstate', () => go(targetFromPath(location.pathname), 'none'));

  addEventListener('keydown', (event) => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
    const el = event.target as HTMLElement;
    if (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) return;

    if (current !== null && settled && controllers.get(current)?.onKey(event)) {
      event.preventDefault();
      return;
    }

    const byKey = current === null ? sections.find((s) => s.key === event.key) : undefined;
    if (byKey) {
      event.preventDefault();
      navigate(byKey.slug);
    } else if (event.key === 'Escape' && current !== null) {
      event.preventDefault();
      back();
    } else if (event.key === 'c' || event.key === 'C') {
      copyEmail();
    } else if (current === null && (event.key === 'ArrowRight' || event.key === 'ArrowLeft')) {
      event.preventDefault();
      moveFocus(event.key === 'ArrowRight' ? 1 : -1);
    }
  });
}
