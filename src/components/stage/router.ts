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
  moveCamera,
  prefersReducedMotion,
  stopAll,
  tween,
} from './camera';
import { cameraFor, cameraForSceneRect, type Rect } from './geometry';

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
  const hotspots = sections.map((s) =>
    root.querySelector<HTMLElement>(`[data-hotspot="${s.slug}"]`),
  );

  let current: Target = targetFromPath(location.pathname);
  /** La sección terminó de entrar: recién ahí recibe el teclado (si no, un ítem cortaría el zoom de entrada). */
  let settled = true;
  let generation = 0;
  history.replaceState({ section: current, fromRoom: false } satisfies HistoryState, '');

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

    stopAll();
    updateHistory(target, mode, from);
    document.title = titleFor(target);
    applyInert(target);

    const overlay = overlays.find((el) => el.dataset.overlay === target);
    const others = overlays.filter((el) => el !== overlay && !el.hidden);
    const reduced = prefersReducedMotion();
    const isSwitch = from !== null && target !== null;
    if (from !== null) controllers.get(from)?.leave();

    if (reduced || (isSwitch && SWITCH_MODE === 'cut')) {
      // Fundido: oscurece el escenario, cambia todo de golpe y vuelve a mostrarlo.
      if (!(await tween(stage, { opacity: '0' }, DURATION.cut)) || !alive()) return;
      for (const el of others) el.hidden = true;
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
        if (
          !(await moveCamera(camera, cameraFor(sectionBySlug(target)), DURATION.camera)) ||
          !alive()
        )
          return;
        controllers.get(target)?.enter();
        if (overlay && (!(await fadeIn(overlay, DURATION.overlayIn)) || !alive())) return;
      } else {
        // Salir: overlay fuera → zoom inverso → etiquetas.
        await Promise.all(others.map((el) => fadeOut(el, DURATION.overlayOut)));
        if (!alive()) return;
        if (!(await moveCamera(camera, cameraFor(undefined), DURATION.camera)) || !alive()) return;
        const shown = await Promise.all(roomUi.map((el) => fadeIn(el, DURATION.labelsIn)));
        if (shown.includes(false) || !alive()) return;
      }
    }

    settled = true;
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

  root.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = (event.target as Element).closest<HTMLAnchorElement>(
      'a[data-section], a[data-back]',
    );
    if (!link) return;
    event.preventDefault();
    navigate(link.hasAttribute('data-back') ? null : (link.dataset.section as SectionSlug));
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
