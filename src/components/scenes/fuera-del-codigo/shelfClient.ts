/**
 * Objetos de las repisas de Fuera del código: un segundo nivel dentro de cada repisa (ítem). Elegir
 * un objeto abre su detalle (libro, caja, consola, película, disco); ← → pasan al siguiente de la
 * misma repisa y Esc lo cierra. Lo marca el HTML de cada repisa:
 *
 *   [data-sub-topic=repisa]   contenedor de la repisa; recibe `data-open` con el objeto abierto
 *   [data-sub=id]             el objeto (`<a href="#id">`; sin JS, el ancla muestra el detalle)
 *   [data-sub-detail=id]      su detalle, visible con `data-open`
 *   [data-sub-close]          botón ✕ del detalle
 *
 * Música (audio y reproductor) y Juegos (el d20) tienen además su propia lógica aquí.
 */
import { prefersReducedMotion } from '../../stage/camera';
import type { ItemNav } from '../../stage/itemNav';

export interface Shelf {
  /** Teclas con un objeto abierto (← →, Esc, espacio en Música). Devuelve `true` si la consumió. */
  onKey(event: KeyboardEvent): boolean;
  /**
   * Cierra el objeto abierto, si hay uno. Con `hash: false` no toca la URL (la maneja otro); con
   * `cancel: false` no descarta un objeto que espera a que la cámara llegue a su repisa.
   */
  close(options?: { hash?: boolean; cancel?: boolean }): void;
  /** Si la URL apunta a un objeto (`#anime-frieren`), lo abre. Devuelve `true` si lo hizo. */
  openFromHash(instant?: boolean): boolean;
}

export function initShelf(root: HTMLElement, nav: ItemNav): Shelf {
  const announcer = document.querySelector<HTMLElement>('[data-announcer]');
  const objects = new Map(
    [...root.querySelectorAll<HTMLElement>('[data-sub]')].map((el) => [el.dataset.sub ?? '', el]),
  );
  const details = new Map(
    [...root.querySelectorAll<HTMLElement>('[data-sub-detail]')].map((el) => [
      el.dataset.subDetail ?? '',
      el,
    ]),
  );
  const topicOf = (id: string) =>
    objects.get(id)?.closest<HTMLElement>('[data-sub-topic]')?.dataset.subTopic ?? null;
  const topicEl = (topic: string) => root.querySelector<HTMLElement>(`[data-sub-topic="${topic}"]`);
  const idsOf = (topic: string) => [...objects.keys()].filter((id) => topicOf(id) === topic);

  let open: string | null = null;
  let token = 0;
  const music = initMusic();

  const setHash = (hash: string) => history.replaceState(history.state, '', `#${hash}`);

  /** Muestra el detalle de `id` (su repisa ya está elegida). Reabrir reinicia sus animaciones. */
  function show(id: string) {
    const topic = topicOf(id);
    const detail = details.get(id);
    if (!topic || !detail) return;
    hide();
    open = id;
    topicEl(topic)?.setAttribute('data-open', id);
    objects.get(id)?.setAttribute('aria-current', 'true');
    void detail.offsetWidth;
    detail.setAttribute('data-open', '');
    for (const video of detail.querySelectorAll('video')) void video.play().catch(() => {});
    if (topic === 'musica') music.play(id);
    setHash(id);
    if (announcer) announcer.textContent = detail.getAttribute('aria-label') ?? '';
  }

  /** Quita el detalle abierto (sin mover la cámara ni la URL). */
  function hide() {
    if (!open) return;
    const detail = details.get(open);
    detail?.removeAttribute('data-open');
    for (const video of detail?.querySelectorAll('video') ?? []) video.pause();
    objects.get(open)?.removeAttribute('aria-current');
    const topic = topicOf(open);
    if (topic) topicEl(topic)?.removeAttribute('data-open');
    if (topic === 'musica') music.stop();
    open = null;
  }

  /** Abre un objeto; si su repisa no está elegida, primero lleva la cámara a ella. */
  async function select(id: string, instant = false) {
    const topic = topicOf(id);
    if (!topic) return;
    const my = ++token;
    if (nav.selected() !== topic && !(await nav.select(topic, instant))) return;
    if (my === token) show(id);
  }

  function close({ hash = true, cancel = true } = {}) {
    if (cancel) token++;
    if (!open) return;
    const id = open;
    const topic = topicOf(id);
    // El ✕ desaparece con el detalle: el foco vuelve al objeto de la repisa.
    const focusBack = details.get(id)?.contains(document.activeElement);
    hide();
    if (hash && topic) setHash(topic);
    if (focusBack) objects.get(id)?.focus({ preventScroll: true });
    if (announcer && hash) announcer.textContent = 'Detalle cerrado';
  }

  function step(delta: number) {
    if (!open) return;
    const ids = idsOf(topicOf(open) ?? '');
    const next = ids[(ids.indexOf(open) + delta + ids.length) % ids.length];
    show(next);
    objects.get(next)?.focus({ preventScroll: true });
  }

  /* ---------- clics ---------- */
  root.addEventListener('click', (event) => {
    const target = event.target as Element;
    const object = target.closest<HTMLElement>('[data-sub]');
    if (object) {
      event.preventDefault();
      const id = object.dataset.sub ?? '';
      if (id === open) close();
      else void select(id);
      return;
    }
    if (target.closest('[data-sub-close]')) {
      event.preventDefault();
      close();
      return;
    }
    if (target.closest('[data-roll]')) {
      void roll();
      return;
    }
    const peg = target.closest<HTMLAnchorElement>('[data-peg]');
    if (peg) {
      event.preventDefault();
      void nav.select(peg.dataset.peg ?? '');
      return;
    }
  });

  // Un clic fuera del detalle abierto (en la repisa, la pared o el cuarto alrededor) lo cierra.
  // Los objetos y los controles de la capa (chips, Volver) tienen su propia acción.
  document.addEventListener('click', (event) => {
    const target = event.target as Element;
    if (!open || event.defaultPrevented || target.closest('[data-overlay]')) return;
    if (
      target.closest(
        '[data-sub], [data-roll], .sub-detail.fly, .film-screen, .ticket, [data-player]',
      )
    )
      return;
    close();
  });

  // Chrome deja el texto SVG rasterizado a la escala inicial del vuelo: al llegar, se vuelve a pintar.
  for (const el of root.querySelectorAll<HTMLElement>('.fly')) {
    el.addEventListener('animationend', (event) => {
      if (event.target !== el) return;
      for (const svg of el.querySelectorAll('svg')) {
        svg.style.display = 'none';
        void svg.getBoundingClientRect();
        svg.style.display = '';
      }
    });
  }

  /* ---------- Juegos: el d20 elige un juego al azar ---------- */
  async function roll() {
    const games = topicEl('juegos');
    const die = games?.querySelector<SVGSVGElement>('.big-d20');
    const face = die?.querySelector('text');
    const ids = idsOf('juegos');
    if (!games || !face || games.hasAttribute('data-rolling')) return;
    if (nav.selected() !== 'juegos' && !(await nav.select('juegos'))) return;
    close();
    const my = ++token;
    const pick = ids[Math.floor(Math.random() * ids.length)];
    const reduced = prefersReducedMotion();
    const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, reduced ? 0 : ms));
    games.setAttribute('data-rolling', '');
    const flicker = setInterval(() => {
      face.textContent = String(1 + Math.floor(Math.random() * ids.length));
    }, 70);
    await wait(1050);
    clearInterval(flicker);
    face.textContent = String(ids.indexOf(pick) + 1);
    if (announcer) announcer.textContent = `El d20 sacó ${ids.indexOf(pick) + 1}`;
    await wait(250);
    objects.get(pick)?.classList.add('lucky');
    await wait(reduced ? 800 : 1000);
    objects.get(pick)?.classList.remove('lucky');
    games.removeAttribute('data-rolling');
    if (my === token && nav.selected() === 'juegos') {
      show(pick);
      objects.get(pick)?.focus({ preventScroll: true });
    }
  }

  /* ---------- Música: vinilo, audio y reproductor ---------- */
  function initMusic() {
    const topic = topicEl('musica');
    const audio = topic?.querySelector<HTMLAudioElement>('[data-audio-player]');
    const disc = topic?.querySelector<HTMLElement>('[data-disc]');
    const toggle = topic?.querySelector<HTMLButtonElement>('[data-player-action="toggle"]');
    let timer = 0;
    const fmt = (t: number) =>
      `${Math.floor((t || 0) / 60)}:${String(Math.floor(t || 0) % 60).padStart(2, '0')}`;

    function setPaused(paused: boolean) {
      topic?.toggleAttribute('data-paused', paused);
      if (!toggle) return;
      toggle.textContent = paused ? '▶' : '❚❚';
      toggle.setAttribute('aria-label', paused ? 'Reproducir' : 'Pausar');
    }

    const current = () => (open && topicOf(open) === 'musica' ? details.get(open) : undefined);

    audio?.addEventListener('timeupdate', () => {
      const song = current();
      if (!song) return;
      song
        .querySelector<HTMLElement>('.progress')
        ?.style.setProperty('--p', String(audio.duration ? audio.currentTime / audio.duration : 0));
      const time = song.querySelector('[data-time]');
      if (time) time.textContent = fmt(audio.currentTime);
    });
    // La duración sale del archivo: los clips pueden durar lo que sea.
    audio?.addEventListener('loadedmetadata', () => {
      const duration = current()?.querySelector('[data-duration]');
      if (duration) duration.textContent = fmt(audio.duration);
    });
    audio?.addEventListener('ended', () => step(1));

    topic?.querySelector('.controls')?.addEventListener('click', (event) => {
      const action = (event.target as Element).closest<HTMLElement>('[data-player-action]')?.dataset
        .playerAction;
      if (!action) return;
      event.stopPropagation();
      const ids = idsOf('musica');
      if (action === 'toggle' && open && topicOf(open) === 'musica') return togglePlay();
      if (!open || topicOf(open) !== 'musica') return void select(ids[0]);
      step(action === 'prev' ? -1 : 1);
    });

    function togglePlay() {
      if (!audio) return;
      if (audio.paused) {
        void audio.play().catch(() => {});
        setPaused(false);
      } else {
        audio.pause();
        setPaused(true);
      }
    }

    return {
      togglePlay,
      play(id: string) {
        const object = objects.get(id);
        const song = details.get(id);
        if (!audio || !disc || !object || !song) return;
        clearTimeout(timer);
        // El vinilo cae desde la portada elegida y lleva la portada en la etiqueta.
        const rect = { x: disc.offsetLeft + 65, y: disc.offsetTop + 65 };
        disc.style.setProperty('--sx', `${Number(object.dataset.coverX) - rect.x}px`);
        disc.style.setProperty('--sy', `${Number(object.dataset.coverY) - rect.y}px`);
        const cover = object.querySelector('img');
        disc.style.setProperty(
          '--cover',
          cover ? `url("${cover.currentSrc || cover.src}")` : 'none',
        );
        setPaused(false);
        audio.src = song.dataset.audio ?? '';
        audio.volume = 0.6;
        // La música parte cuando la aguja baja (y nunca sin un clic o una tecla de por medio).
        timer = window.setTimeout(
          () => void audio.play().catch(() => {}),
          prefersReducedMotion() ? 0 : 1100,
        );
      },
      stop() {
        clearTimeout(timer);
        audio?.pause();
        setPaused(false);
      },
    };
  }

  return {
    onKey(event) {
      if (!open) return false;
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        step(event.key === 'ArrowRight' ? 1 : -1);
        return true;
      }
      if (event.key === 'Escape') {
        close();
        return true;
      }
      if (event.key === ' ' && topicOf(open) === 'musica') {
        music.togglePlay();
        return true;
      }
      return false;
    },
    close,
    openFromHash(instant = false) {
      const id = decodeURIComponent(location.hash.slice(1));
      if (!objects.has(id)) return false;
      void select(id, instant);
      return true;
    },
  };
}
