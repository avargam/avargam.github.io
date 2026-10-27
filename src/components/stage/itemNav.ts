/**
 * Navegación entre los ítems de una sección (edificios, post-its, proyectos…). Al elegir un ítem
 * la cámara se acerca a él y, al llegar, se activa su capa de detalle; Esc vuelve a la vista de
 * la sección. Lo comparten todas las secciones; cada una solo marca su HTML:
 *
 *   escena:  [data-items]            raíz que recibe `data-selected`
 *            [data-item-hit=id]      botón del objeto
 *            [data-item-detail=id]   capa de detalle (id = ancla `#id`), visible con `data-active`
 *                                    (y `data-leaving` mientras sale)
 *   overlay: [data-item-chip=id]     chip numerado (`<a href="#id">`)
 */
import type { SectionSlug } from '../../data/sections';
import type { SectionController } from './router';

export interface SectionItem {
  id: string;
  /** Texto del chip numerado. */
  chip: string;
}

interface Options {
  slug: SectionSlug;
  ids: string[];
  /** Texto que se anuncia al seleccionar un ítem. */
  describe: (id: string) => string;
  /**
   * Lleva la cámara al ítem (o, con `null`, a la vista de la sección). Resuelve `false` si otra
   * selección la interrumpió.
   */
  focus: (id: string | null, instant: boolean) => Promise<boolean>;
}

export function createItemNav({ slug, ids, describe, focus }: Options): SectionController | null {
  const itemsEl = document.querySelector<HTMLElement>(`[data-scene="${slug}"] [data-items]`);
  const overlayEl = document.querySelector<HTMLElement>(`[data-overlay="${slug}"]`);
  const announcer = document.querySelector<HTMLElement>('[data-announcer]');
  if (!itemsEl || !overlayEl) return null;
  const items: HTMLElement = itemsEl;
  const overlay: HTMLElement = overlayEl;

  const byId = <T extends HTMLElement>(root: HTMLElement, attr: string) =>
    new Map(
      [...root.querySelectorAll<T>(`[${attr}]`)].map((el) => [el.getAttribute(attr) ?? '', el]),
    );
  const hits = byId<HTMLButtonElement>(items, 'data-item-hit');
  const details = byId(items, 'data-item-detail');
  const chips = byId<HTMLAnchorElement>(overlay, 'data-item-chip');

  let token = 0;
  const selected = () => items.dataset.selected ?? null;
  const fromHash = () => {
    const id = decodeURIComponent(location.hash.slice(1));
    return ids.includes(id) ? id : null;
  };
  const setHash = (id: string | null) =>
    history.replaceState(history.state, '', id ? `#${id}` : location.pathname);

  /** Estado visible de la selección (sin cámara): atributos, chips y botones. */
  function mark(id: string | null) {
    if (id) items.dataset.selected = id;
    else delete items.dataset.selected;
    for (const [key, el] of hits) el.setAttribute('aria-pressed', String(key === id));
    for (const [key, el] of chips) {
      if (key === id) el.setAttribute('aria-current', 'true');
      else el.removeAttribute('aria-current');
    }
    // La capa que estaba activa queda con `data-leaving` hasta que termina su animación de salida
    // (si la sección define una; si no, el atributo no tiene efecto).
    for (const el of details.values()) {
      el.toggleAttribute('data-leaving', el.hasAttribute('data-active'));
      el.removeAttribute('data-active');
    }
  }

  async function select(id: string, { hash = true, announce = true, instant = false } = {}) {
    const my = ++token;
    mark(id);
    if (hash) setHash(id);
    if (announce && announcer) announcer.textContent = describe(id);
    const arrived = await focus(id, instant);
    if (arrived && my === token) details.get(id)?.setAttribute('data-active', '');
  }

  /** Vuelve a la vista de la sección. Con `camera: false`, la cámara la maneja el router (al salir). */
  function clear({ camera = true } = {}) {
    token++;
    mark(null);
    if (camera) {
      setHash(null);
      if (announcer) announcer.textContent = 'Vista general';
      void focus(null, false);
    }
  }

  const step = (delta: number) => {
    const from = ids.indexOf(selected() ?? '');
    const next =
      ids[
        from === -1 ? (delta > 0 ? 0 : ids.length - 1) : (from + delta + ids.length) % ids.length
      ];
    void select(next);
    hits.get(next)?.focus({ preventScroll: true });
  };

  for (const el of details.values()) {
    el.addEventListener('animationend', (event) => {
      if (event.target === el) el.removeAttribute('data-leaving');
    });
  }
  for (const [id, el] of hits) el.addEventListener('click', () => void select(id));
  for (const [id, el] of chips) {
    el.addEventListener('click', (event) => {
      event.preventDefault();
      void select(id);
    });
  }

  // Deep link: la ruta ya viene con la sección abierta y un #ítem.
  const initial = fromHash();
  if (!overlay.hidden && initial) {
    void select(initial, { hash: false, announce: false, instant: true });
  }

  return {
    enter() {
      const id = fromHash();
      if (id) void select(id, { hash: false, announce: false });
    },
    leave: () => clear({ camera: false }),
    onKey(event) {
      const index = Number(event.key) - 1;
      if (Number.isInteger(index) && index >= 0 && index < ids.length) {
        void select(ids[index]);
        return true;
      }
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        step(event.key === 'ArrowRight' ? 1 : -1);
        return true;
      }
      if (event.key === 'Escape' && selected()) {
        clear();
        return true;
      }
      return false;
    },
  };
}
