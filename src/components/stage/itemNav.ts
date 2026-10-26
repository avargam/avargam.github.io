/**
 * Navegación entre los ítems de una sección (edificios, post-its, proyectos…): selección,
 * chips, tarjetas, teclado y hash. Lo comparten todas las secciones; cada una solo marca su
 * HTML con estos atributos:
 *
 *   escena:  [data-items]          raíz que recibe `data-selected`
 *            [data-item-hit=id]    botón del objeto (abre su tarjeta)
 *   overlay: [data-item-chip=id]   chip numerado (`<a href="#id">`)
 *            [data-item-card=id]   tarjeta de detalle
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
  defaultId: string;
  /** Texto que se anuncia al seleccionar un ítem. */
  describe: (id: string) => string;
}

export function createItemNav({
  slug,
  ids,
  defaultId,
  describe,
}: Options): SectionController | null {
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
  const chips = byId<HTMLAnchorElement>(overlay, 'data-item-chip');
  const cards = byId(overlay, 'data-item-card');

  const isOpen = () => !overlay.hidden;
  const fromHash = () => {
    const id = decodeURIComponent(location.hash.slice(1));
    return ids.includes(id) ? id : null;
  };

  function select(id: string, { hash = true, announce = true } = {}) {
    items.dataset.selected = id;
    for (const [key, el] of hits) el.setAttribute('aria-pressed', String(key === id));
    for (const [key, el] of chips) {
      if (key === id) el.setAttribute('aria-current', 'true');
      else el.removeAttribute('aria-current');
    }
    for (const [key, el] of cards) el.toggleAttribute('data-active', key === id);
    if (hash) history.replaceState(history.state, '', `#${id}`);
    if (announce && announcer) announcer.textContent = describe(id);
  }

  function clear() {
    delete items.dataset.selected;
    for (const el of hits.values()) el.setAttribute('aria-pressed', 'false');
  }

  /** ← → recorren los objetos con el foco; Enter (nativo del botón) abre el enfocado. */
  function moveFocus(step: number) {
    const list = ids.map((id) => hits.get(id)).filter((el): el is HTMLButtonElement => !!el);
    const focused = list.indexOf(document.activeElement as HTMLButtonElement);
    const from = focused !== -1 ? focused : ids.indexOf(items.dataset.selected ?? defaultId);
    list[(from + step + list.length) % list.length]?.focus();
  }

  for (const [id, el] of hits) el.addEventListener('click', () => select(id));
  for (const [id, el] of chips) {
    el.addEventListener('click', (event) => {
      event.preventDefault();
      select(id);
    });
  }

  if (isOpen())
    select(fromHash() ?? items.dataset.selected ?? defaultId, { hash: false, announce: false });

  return {
    enter: () => select(fromHash() ?? defaultId, { hash: false, announce: false }),
    leave: clear,
    onKey(event) {
      const index = Number(event.key) - 1;
      if (Number.isInteger(index) && index >= 0 && index < ids.length) {
        select(ids[index]);
        return true;
      }
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        moveFocus(event.key === 'ArrowRight' ? 1 : -1);
        return true;
      }
      return false;
    },
  };
}
