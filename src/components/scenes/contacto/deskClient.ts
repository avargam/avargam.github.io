/**
 * Mesa de Contacto: todo lo que hay encima se arrastra con el puntero, y un clic (o Enter sobre su
 * ancla, o el chip 1–4) abre o cierra cada objeto. Puede haber varios abiertos; Esc cierra el último
 * y, si no queda ninguno, vuelve al cuarto. Nada se guarda al recargar. Lo marca el HTML de la escena:
 *
 *   [data-desk-obj=id]   objeto de un canal (sobre, paquete, tarjetero, carpeta); `data-open` abierto
 *   [data-desk-hit=id]   su ancla `#id` (sin JS, `:target` lo abre)
 *   [data-desk-card]     la tarjeta de LinkedIn (`data-in-holder`, `data-flipped`)
 *   [data-loot]          lo que trae el paquete (`data-out` cuando está en la mesa)
 *   [data-pellet=i]      relleno del paquete: se arrastra fuera de la caja y se lanza fuera de la mesa
 *   [data-desk-sheet]    la hoja de stickers
 *   [data-desk-sticker]  stickers: se despegan de la hoja (`data-on-sheet`) y se pegan a una superficie
 *   [data-surface=…]     donde se pegan: el sobre (frente, carta y bolsillo), el paquete (tapas e
 *                        interior), la carpeta (tapa y hoja), el tarjetero y las caras de la tarjeta
 *   [data-copy-email]    botón de la carta ("Ordenar", `[data-desk-tidy]`, está en la capa)
 */
import { moveCamera, prefersReducedMotion } from '../../stage/camera';
import {
  cameraTransform,
  clampCamera,
  panRange,
  readView,
  type Camera,
} from '../../stage/geometry';
import { restartAttr, trackDrag, type Velocity } from '../../stage/drag';
import { trackPan, stopPan, type PanTarget } from '../../stage/pan';
import { isTouch, type SectionController } from '../../stage/router';
import { contact, contacts, type ContactId } from '../../../data/contact';
import { profile } from '../../../data/profile';
import { PELLETS, SHEET, SIZE, cardInHolder, fromDesk, slotSpot, toDesk, type Spot } from './desk';

const IDS = contacts.map((c) => c.id);
const isId = (id: string): id is ContactId => (IDS as string[]).includes(id);

export function initDesk(root: HTMLElement, overlay: HTMLElement): SectionController {
  const announcer = document.querySelector<HTMLElement>('[data-announcer]');
  const announce = (text: string) => {
    if (announcer) announcer.textContent = text;
  };
  const wait = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, prefersReducedMotion() ? 0 : ms));

  const query = <T extends HTMLElement = HTMLElement>(selector: string) =>
    root.querySelector<T>(selector) as T;
  const objects = new Map(
    [...root.querySelectorAll<HTMLElement>('[data-desk-obj]')].map((el) => [
      el.dataset.deskObj as ContactId,
      el,
    ]),
  );
  const hits = new Map(
    [...root.querySelectorAll<HTMLElement>('[data-desk-hit]')].map((el) => [
      el.dataset.deskHit as ContactId,
      el,
    ]),
  );
  const chips = new Map(
    [...overlay.querySelectorAll<HTMLElement>('[data-item-chip]')].map((el) => [
      el.dataset.itemChip as ContactId,
      el,
    ]),
  );
  const envelope = objects.get('correo')!;
  const parcel = objects.get('github')!;
  const holder = objects.get('linkedin')!;
  const card = query('[data-desk-card]');
  const stamp = query('.copied');
  const loot = [...root.querySelectorAll<HTMLElement>('[data-loot]')];
  const pato = loot.find((el) => el.dataset.loot === 'pato');
  const sheet = query('[data-desk-sheet]');
  const stickers = [...root.querySelectorAll<HTMLElement>('[data-desk-sticker]')];
  const pelletBox = query('[data-pellets]');
  const pellets = [...root.querySelectorAll<HTMLElement>('[data-pellet]')];

  /* ---------- posiciones ---------- */
  const pos = new Map<HTMLElement, Spot>();
  const all = [...root.querySelectorAll<HTMLElement>('.desk-obj')];
  const homes = new Map<HTMLElement, Spot>();
  const read = (el: HTMLElement, name: string) => parseFloat(el.style.getPropertyValue(name));
  for (const el of all) {
    const spot = { x: read(el, '--x'), y: read(el, '--y'), r: read(el, '--r') };
    pos.set(el, spot);
    homes.set(el, spot);
  }
  let z = Math.max(...all.map((el) => Number(el.style.zIndex) || 0));

  function place(el: HTMLElement, { x, y, r }: Partial<Spot>) {
    const spot = {
      ...pos.get(el)!,
      ...(x === undefined ? {} : { x }),
      ...(y === undefined ? {} : { y }),
      ...(r === undefined ? {} : { r }),
    };
    pos.set(el, spot);
    el.style.setProperty('--x', `${spot.x}px`);
    el.style.setProperty('--y', `${spot.y}px`);
    el.style.setProperty('--r', `${spot.r}deg`);
  }

  const cardHome = () => card.hasAttribute('data-in-holder');
  /** Al frente; la tarjeta guardada queda justo debajo del tarjetero. */
  function front(el: HTMLElement) {
    z += 2;
    el.style.zIndex = String(z);
    if (el === holder && cardHome()) card.style.zIndex = String(z - 1);
  }
  const followHolder = () => place(card, cardInHolder(pos.get(holder)!));

  /* ---------- abrir y cerrar ---------- */
  const opened: ContactId[] = [];
  const isOpen = (id: ContactId) => opened.includes(id);

  function mark(id: ContactId, on: boolean) {
    const i = opened.indexOf(id);
    if (i >= 0) opened.splice(i, 1);
    if (on) opened.push(id);
    objects.get(id)?.toggleAttribute('data-open', on);
    hits.get(id)?.setAttribute('aria-expanded', String(on));
    if (on) chips.get(id)?.setAttribute('aria-current', 'true');
    else chips.get(id)?.removeAttribute('aria-current');
  }

  const setHash = () => {
    const last = opened[opened.length - 1];
    history.replaceState(history.state, '', last ? `#${last}` : location.pathname);
  };

  function toggle(id: ContactId, on = !isOpen(id), { hash = true } = {}) {
    if (on === isOpen(id)) return;
    front(objects.get(id)!);
    if (id === 'github' && on) void openParcel();
    else if (id === 'linkedin') void (on ? pullCard() : returnCard());
    else mark(id, on);
    if (id === 'correo' && !on) stamp.removeAttribute('data-on');
    if (hash) setHash();
    if (on) centerDesk(objects.get(id));
    announce(on ? (contact(id)?.name ?? '') : `${contact(id)?.chip} cerrado`);
  }

  function closeAll(options?: { hash?: boolean }) {
    for (const id of [...opened]) toggle(id, false, options);
  }

  /* Paquete: la primera vez tiembla y se corta la cinta. Lo que está adentro salta a la mesa. */
  let broken = false;
  async function openParcel() {
    if (!broken) {
      broken = true;
      restartAttr(parcel, 'data-shake');
      await wait(320);
      parcel.removeAttribute('data-shake');
    }
    mark('github', true);
    await wait(420);
    if (!isOpen('github')) return;
    const inside = loot.filter((el) => !el.hasAttribute('data-out'));
    inside.forEach((el, i) =>
      setTimeout(() => void popOut(el), prefersReducedMotion() ? 0 : i * 140),
    );
  }

  async function popOut(el: HTMLElement) {
    const box = pos.get(parcel)!;
    el.style.setProperty('--fx', `${box.x + 150}px`);
    el.style.setProperty('--fy', `${box.y + 100}px`);
    place(el, {
      x: Math.min(1500, Math.max(10, box.x + Number(el.dataset.dx))),
      y: Math.min(880, Math.max(10, box.y + Number(el.dataset.dy))),
      r: homes.get(el)!.r,
    });
    el.setAttribute('data-out', '');
    restartAttr(el, 'data-jump');
    front(el);
    await wait(800);
    el.removeAttribute('data-jump');
    if (el === pato) quack();
  }

  function overParcel(el: HTMLElement) {
    if (!parcel.hasAttribute('data-open')) return false;
    const box = pos.get(parcel)!;
    const p = pos.get(el)!;
    const cx = p.x + el.offsetWidth / 2;
    const cy = p.y + el.offsetHeight / 2;
    return cx > box.x && cx < box.x + SIZE.github.w && cy > box.y && cy < box.y + SIZE.github.h;
  }

  async function storeLoot(el: HTMLElement) {
    const box = pos.get(parcel)!;
    el.setAttribute('data-store', '');
    place(el, {
      x: box.x + SIZE.github.w / 2 - el.offsetWidth / 2,
      y: box.y + SIZE.github.h / 2 - el.offsetHeight / 2,
    });
    await wait(350);
    el.removeAttribute('data-out');
    el.removeAttribute('data-store');
  }

  let quackTimer = 0;
  function quack() {
    if (!pato) return;
    restartAttr(pato, 'data-quack');
    clearTimeout(quackTimer);
    quackTimer = window.setTimeout(() => pato.removeAttribute('data-quack'), 1200);
  }

  /* Tarjetero: la tarjeta sale, cae al lado y se da vuelta. */
  async function pullCard() {
    mark('linkedin', true);
    front(card);
    if (!cardHome()) {
      card.setAttribute('data-flipped', '');
      return;
    }
    const h = pos.get(holder)!;
    card.removeAttribute('data-in-holder');
    card.setAttribute('data-settle', '');
    place(card, { x: Math.max(20, h.x - 60), y: h.y < 370 ? h.y + 330 : h.y - 230, r: h.r - 8 });
    await wait(520);
    card.removeAttribute('data-settle');
    if (isOpen('linkedin')) card.setAttribute('data-flipped', '');
  }

  async function returnCard() {
    mark('linkedin', false);
    card.removeAttribute('data-flipped');
    await wait(300);
    if (isOpen('linkedin')) return;
    card.setAttribute('data-settle', '');
    card.setAttribute('data-in-holder', '');
    followHolder();
    card.style.zIndex = String(Number(holder.style.zIndex) - 1);
    await wait(550);
    card.removeAttribute('data-settle');
  }

  /* Correo: copiar estampa "¡COPIADO!" en la carta (si el sobre está cerrado, primero lo abre). */
  async function copyEmail() {
    if (!isOpen('correo')) {
      toggle('correo', true);
      await wait(850);
    }
    try {
      await navigator.clipboard.writeText(profile.email);
      restartAttr(stamp, 'data-on');
      announce(`Correo copiado: ${profile.email}`);
    } catch {
      announce(`No se pudo copiar. El correo es ${profile.email}`);
    }
  }

  /* ---------- dentro de otros objetos ---------- */
  // Los stickers van en la hoja o pegados a una superficie, y los pellets en la caja: en
  // coordenadas de ese objeto, que gira sobre su centro (y, dentro de él, de la zona que los lleva).
  // Al sacarlos o meterlos, se quedan donde se ven.
  interface Frame {
    obj: Spot;
    w: number;
    h: number;
    /** Zona dentro del objeto (la capa donde quedan), en sus coordenadas. */
    zone: { x: number; y: number; w: number; h: number };
  }
  const frameOf = (
    obj: HTMLElement,
    w = obj.offsetWidth,
    h = obj.offsetHeight,
    zone = { x: 0, y: 0, w, h },
  ): Frame => ({
    obj: pos.get(obj)!,
    w,
    h,
    zone,
  });
  const center = (el: HTMLElement) => {
    const p = pos.get(el)!;
    return { x: p.x + el.offsetWidth / 2, y: p.y + el.offsetHeight / 2, r: p.r };
  };
  /** Centro de `el` (en la mesa) en coordenadas de la zona. */
  const inZone = (el: HTMLElement, { obj, w, h, zone }: Frame) => {
    const c = center(el);
    const local = fromDesk(obj, w, h, c.x, c.y);
    return { x: local.x - zone.x, y: local.y - zone.y };
  };

  /** Pasa `el` de la mesa a `parent`, la zona de un objeto. */
  function attach(el: HTMLElement, parent: HTMLElement, frame: Frame) {
    const r = pos.get(el)!.r;
    const local = inZone(el, frame);
    parent.append(el);
    place(el, {
      x: local.x - el.offsetWidth / 2,
      y: local.y - el.offsetHeight / 2,
      r: r - frame.obj.r,
    });
  }

  /** Lo inverso: de la zona de un objeto a la mesa. */
  function detach(el: HTMLElement, { obj, w, h, zone }: Frame) {
    const c = center(el);
    const out = toDesk(obj, w, h, c.x + zone.x, c.y + zone.y);
    root.append(el);
    place(el, { x: out.x - el.offsetWidth / 2, y: out.y - el.offsetHeight / 2, r: c.r + obj.r });
  }

  /** El centro de `el` (en la mesa) cae dentro de la zona, a más de `margin` del borde. */
  function over(el: HTMLElement, frame: Frame, margin = 10) {
    const { x, y } = inZone(el, frame);
    const { w, h } = frame.zone;
    return x > margin && x < w - margin && y > margin && y < h - margin;
  }

  const frames = {
    sheet: () => frameOf(sheet, SHEET.w, SHEET.h),
    parcel: () => frameOf(parcel, SIZE.github.w, SIZE.github.h),
  };

  /* Superficies: capas `[data-surface]` de cada objeto, cerrado y abierto (el frente del sobre o su
     carta y bolsillo, las tapas del paquete o su interior, la tapa de la carpeta o su hoja), el
     bolsillo del tarjetero y las dos caras de la tarjeta. Un sticker pegado viaja con su objeto y se
     esconde con la cara que lo lleva. */
  const surfaceActive: Record<string, () => boolean> = {
    correo: () => !isOpen('correo'),
    carta: () => isOpen('correo'),
    bolsillo: () => isOpen('correo'),
    github: () => !isOpen('github'),
    'github-dentro': () => isOpen('github'),
    cv: () => !isOpen('cv'),
    'cv-hoja': () => isOpen('cv'),
    'card-front': () => !card.hasAttribute('data-flipped'),
    'card-back': () => card.hasAttribute('data-flipped'),
  };
  const surfaces = [...root.querySelectorAll<HTMLElement>('[data-surface]')].map((layer) => {
    const obj = layer.parentElement!.closest<HTMLElement>('.desk-obj')!;
    return { layer, obj, active: surfaceActive[layer.dataset.surface!] ?? (() => true) };
  });
  type Surface = (typeof surfaces)[number];

  /**
   * La zona de la capa dentro de su objeto. Sus padres no giran mientras la cara está a la vista,
   * pero pueden estar corridos (la carta sube con `translate`).
   */
  function surfaceFrame({ layer, obj }: Surface) {
    let x = 0;
    let y = 0;
    for (
      let n: HTMLElement | null = layer;
      n && n !== obj;
      n = n.offsetParent as HTMLElement | null
    ) {
      x += n.offsetLeft;
      y += n.offsetTop;
      const [tx = '0', ty = '0'] = getComputedStyle(n).translate.split(' ');
      x += parseFloat(tx) || 0;
      y += parseFloat(ty) || 0;
    }
    return frameOf(obj, obj.offsetWidth, obj.offsetHeight, {
      x,
      y,
      w: layer.offsetWidth,
      h: layer.offsetHeight,
    });
  }

  /* Stickers: se despegan de la hoja, se pegan a una superficie si se sueltan encima y vuelven a su
     hueco si se sueltan sobre la hoja. */
  const fromSheet = new Set(stickers.filter((el) => el.hasAttribute('data-on-sheet')));
  const slots = [...sheet.querySelectorAll<HTMLElement>('[data-sheet-slot]')];
  const markSlots = () => {
    for (const slot of slots) {
      const i = slot.dataset.sheetSlot;
      slot.toggleAttribute('data-empty', !sheet.querySelector(`[data-slot="${i}"]`));
    }
  };

  function toSlot(el: HTMLElement) {
    sheet.append(el);
    el.removeAttribute('data-stuck');
    el.setAttribute('data-on-sheet', '');
    place(el, slotSpot(Number(el.dataset.slot)));
    el.style.zIndex = '1';
    markSlots();
  }

  function stick(el: HTMLElement, surface: Surface) {
    attach(el, surface.layer, surfaceFrame(surface));
    el.style.zIndex = '1';
    restartAttr(el, 'data-stuck');
  }

  function peel(el: HTMLElement) {
    const surface = surfaces.find((s) => s.layer === el.parentElement);
    if (el.parentElement === sheet) detach(el, frames.sheet());
    else if (surface) detach(el, surfaceFrame(surface));
    el.removeAttribute('data-on-sheet');
    el.removeAttribute('data-stuck');
    markSlots();
  }

  /** Lo de más arriba bajo el sticker: la hoja (vuelve a su hueco) o una superficie (se pega). */
  function dropSticker(el: HTMLElement) {
    const zOf = (obj: HTMLElement) => Number(obj.style.zIndex) || 0;
    const targets = [
      { obj: sheet, hit: () => over(el, frames.sheet()), go: () => toSlot(el) },
      ...surfaces
        .filter((s) => s.active())
        .map((s) => ({ obj: s.obj, hit: () => over(el, surfaceFrame(s)), go: () => stick(el, s) })),
    ].sort((a, b) => zOf(b.obj) - zOf(a.obj));
    targets.find((t) => t.hit())?.go();
  }

  /* Pellets: salen de la caja al arrastrarlos y vuelven si se sueltan sobre ella abierta; soltados
     rápido salen volando, girando, hasta dejar la mesa. */
  function toBox(el: HTMLElement) {
    attach(el, pelletBox, frames.parcel());
    el.style.zIndex = '';
  }

  function dropPellet(el: HTMLElement, velocity: Velocity) {
    if (Math.hypot(velocity.vx, velocity.vy) > PELLETS.fling) return fling(el, velocity);
    if (overParcel(el)) toBox(el);
  }

  function fling(el: HTMLElement, { vx, vy }: Velocity) {
    if (prefersReducedMotion()) {
      el.hidden = true;
      return;
    }
    el.setAttribute('data-flying', '');
    const spin = Math.hypot(vx, vy) * 0.5 * (vx < 0 ? -1 : 1);
    let k = 1;
    let last = performance.now();
    const step = (now: number) => {
      // "Ordenar" lo devolvió a la caja a medio vuelo.
      if (!el.hasAttribute('data-flying')) return;
      const dt = Math.min(now - last, 40);
      last = now;
      // Acelera y crece un poco: se va hacia afuera de la pantalla, no se detiene.
      vx *= 1.015;
      vy *= 1.015;
      k = Math.min(1.5, k + 0.0012 * dt);
      const p = pos.get(el)!;
      place(el, { x: p.x + vx * dt, y: p.y + vy * dt, r: p.r + spin * dt });
      el.style.scale = String(k);
      if (p.x < -120 || p.x > 1720 || p.y < -120 || p.y > 1120) {
        el.removeAttribute('data-flying');
        el.hidden = true;
        return;
      }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /** Un clic (sin arrastre) sobre algo que se sacó de un objeto: vuelve a donde estaba. */
  function putBack(el: HTMLElement, from: HTMLElement | null) {
    const surface = surfaces.find((s) => s.layer === from);
    if (from === sheet) toSlot(el);
    else if (surface) stick(el, surface);
    else if (from === pelletBox) toBox(el);
  }

  /* Ordenar: todo cerrado y en su lugar; lo del paquete y los pellets, adentro; los stickers, en
     la hoja (el corazón, despegado en la mesa). */
  async function tidy() {
    closeAll();
    for (const el of loot) el.removeAttribute('data-out');
    for (const el of stickers) {
      if (fromSheet.has(el)) toSlot(el);
      else {
        root.append(el);
        el.removeAttribute('data-stuck');
      }
    }
    markSlots();
    for (const el of pellets) {
      el.removeAttribute('data-flying');
      el.hidden = false;
      el.style.scale = '';
      el.style.zIndex = '';
      pelletBox.append(el);
      place(el, homes.get(el)!);
    }
    for (const el of all) {
      if (el === card || loot.includes(el) || pellets.includes(el) || fromSheet.has(el)) continue;
      el.setAttribute('data-settle', '');
      place(el, homes.get(el)!);
    }
    followHolder();
    await wait(560);
    for (const el of all) el.removeAttribute('data-settle');
  }

  function activate(el: HTMLElement) {
    const id = el.dataset.deskObj;
    if (id && isId(id)) return toggle(id);
    if (el === card) {
      if (cardHome()) return toggle('linkedin', true);
      return void card.toggleAttribute('data-flipped');
    }
    if (el === pato) quack();
  }

  /* ---------- pantallas táctiles: la mesa a su escala, con paneo ---------- */
  // La mesa se aleja hasta que el sobre (lo más ancho, ~600) quepa a lo ancho de la pantalla; lo
  // demás se ve deslizando la mesa vacía. Con mouse se ve entera y no se mueve.
  const DESK = { x: 0, y: 0, w: 1600, h: 1000 };
  const readDesk = (): Camera => {
    const m = new DOMMatrix(getComputedStyle(root).transform);
    return { k: m.a, x: m.e, y: m.f };
  };
  const deskPan: PanTarget = {
    read: readDesk,
    write: (c) => {
      root.style.transform = cameraTransform(c);
    },
    range: (c) => panRange(c.k, DESK),
  };

  /** Centra la mesa en un objeto (o en el sobre, al entrar). */
  function centerDesk(el: HTMLElement = envelope, instant = false) {
    if (!isTouch()) return;
    stopPan();
    const k = Math.min(1, (readView().w * 0.96) / 600);
    const p = pos.get(el)!;
    const cx = p.x + el.offsetWidth / 2;
    const cy = p.y + el.offsetHeight / 2;
    const target = clampCamera({ k, x: 800 - k * cx, y: 500 - k * cy }, DESK);
    void moveCamera(root, target, instant || prefersReducedMotion() ? 0 : 450);
  }
  if (isTouch()) {
    root.style.transformOrigin = '0 0';
    centerDesk(envelope, true);
    addEventListener('resize', () => centerDesk(envelope, true));
  }

  /* ---------- arrastrar y soltar ---------- */
  /** Un clic de puntero ya se manejó en `pointerup`: el `click` que le sigue se ignora. */
  let pointerClick = false;

  root.addEventListener('pointerdown', (event) => {
    const target = event.target as Element;
    if (event.button !== 0 || target.closest('a:not(.desk-hit), button')) return;
    const el = target.closest<HTMLElement>('.desk-obj');
    if (!el) {
      // La mesa vacía se recorre con el dedo.
      if (isTouch()) trackPan(event, root, deskPan, readView().s);
      return;
    }
    // Lo que está dentro de otro objeto sale a la mesa antes de capturar el puntero (moverlo
    // después de capturarlo lo soltaría).
    const from = el.parentElement;
    const isPellet = pellets.includes(el);
    if (stickers.includes(el)) peel(el);
    if (isPellet && from === pelletBox) detach(el, frames.parcel());
    const { x, y } = pos.get(el)!;
    trackDrag(event, el, root, {
      start() {
        if (el === card) card.removeAttribute('data-in-holder');
        front(el);
      },
      move(dx, dy) {
        // Siempre queda a la vista al menos el 40 % del objeto.
        const w = el.offsetWidth;
        const h = el.offsetHeight;
        place(el, {
          x: Math.min(1600 - w * 0.4, Math.max(-w * 0.6, x + dx)),
          y: Math.min(1000 - h * 0.4, Math.max(-h * 0.6, y + dy)),
        });
        if (el === holder && cardHome()) followHolder();
        if (loot.includes(el) || isPellet) parcel.toggleAttribute('data-target', overParcel(el));
      },
      end(moved, velocity) {
        if (!moved) {
          pointerClick = true;
          setTimeout(() => (pointerClick = false));
          putBack(el, from);
          return activate(el);
        }
        if (isPellet) {
          parcel.removeAttribute('data-target');
          return dropPellet(el, velocity);
        }
        restartAttr(el, 'data-drop');
        if (stickers.includes(el)) dropSticker(el);
        if (loot.includes(el)) {
          parcel.removeAttribute('data-target');
          if (overParcel(el)) void storeLoot(el);
        }
      },
    });
  });

  /* ---------- clics y teclado ---------- */
  root.addEventListener('click', (event) => {
    const target = event.target as Element;
    const hit = target.closest<HTMLElement>('[data-desk-hit]');
    if (hit) {
      event.preventDefault();
      if (!pointerClick) toggle(hit.dataset.deskHit as ContactId);
      return;
    }
    if (target.closest('[data-copy-email]')) void copyEmail();
  });
  overlay.querySelector('[data-desk-tidy]')?.addEventListener('click', () => void tidy());

  for (const [id, chip] of chips) {
    chip.addEventListener('click', (event) => {
      event.preventDefault();
      toggle(id);
    });
  }

  function focusStep(delta: number) {
    const list = IDS.map((id) => hits.get(id)!);
    const i = list.indexOf(document.activeElement as HTMLElement);
    const next =
      i === -1 ? (delta > 0 ? 0 : list.length - 1) : (i + delta + list.length) % list.length;
    list[next].focus({ preventScroll: true });
  }

  const fromHash = () => {
    const id = decodeURIComponent(location.hash.slice(1));
    return isId(id) ? id : null;
  };

  // Enlace directo (/contacto#cv): la ruta ya viene con la sección abierta.
  const initial = fromHash();
  if (initial && !overlay.hidden) toggle(initial, true, { hash: false });

  return {
    enter() {
      centerDesk(envelope, true);
      const id = fromHash();
      if (id) toggle(id, true, { hash: false });
    },
    leave: () => closeAll({ hash: false }),
    onKey(event) {
      const index = Number(event.key) - 1;
      if (Number.isInteger(index) && index >= 0 && index < IDS.length) {
        toggle(IDS[index]);
        return true;
      }
      if (event.key === 'c' || event.key === 'C') {
        void copyEmail();
        return true;
      }
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        focusStep(event.key === 'ArrowRight' ? 1 : -1);
        return true;
      }
      if (event.key === 'Escape' && opened.length) {
        const id = opened[opened.length - 1];
        // El foco no puede quedar en un botón que se va: vuelve al ancla del objeto.
        const active = document.activeElement;
        const focusBack =
          objects.get(id)?.contains(active) || (id === 'linkedin' && card.contains(active));
        toggle(id, false);
        if (focusBack) hits.get(id)?.focus({ preventScroll: true });
        return true;
      }
      return false;
    },
  };
}
