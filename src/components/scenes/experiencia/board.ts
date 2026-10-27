/**
 * Geometría del corcho de Experiencia, en coordenadas de la escena (1600×1000). Post-its y
 * distribución de stickers sacados de `h1()` en `prototype/generadores/gen_f.py`; hilos y
 * stickers decorativos de `prototype/detalle-corcho/`.
 */
import { experience, type Job, type JobId } from '../../../data/experience';
import { skills, type Skill, type StickerShape } from '../../../data/skills';
import type { Rect } from '../../stage/geometry';
import type { SectionItem } from '../../stage/itemNav';

export type ExperienciaItemId = JobId | 'skills';

export interface ExperienciaItem extends SectionItem {
  id: ExperienciaItemId;
  /** Nombre para el botón y los anuncios. */
  name: string;
  hit: Rect;
}

export interface PlacedPostIt {
  job: Job;
  rect: Rect;
  color: string;
  rotate: number;
  /** Chinche de donde salen los hilos (arriba al centro, con la rotación aplicada). */
  tack: { x: number; y: number };
}

export interface PlacedSticker {
  id: string;
  label: string;
  /** Nombre completo, para lectores de pantalla. */
  name: string;
  shape: StickerShape;
  color: string;
  rect: Rect;
  rotate: number;
  /** Título de categoría (ciruela) o tecnología. */
  title: boolean;
  /** Cargos que la usaron (vacío en los títulos). */
  jobs: JobId[];
}

export interface Thread {
  job: JobId;
  sticker: string;
  d: string;
  end: { x: number; y: number };
  /** Orden del hilo dentro de su cargo (define el retraso). */
  index: number;
}

/* ---------- Post-its ---------- */

const POSTITS: Record<JobId, { x: number; y: number; color: string; rotate: number }> = {
  sdi: { x: 96, y: 136, color: '#FFE86B', rotate: -2.5 },
  cenia: { x: 358, y: 160, color: '#A8EBC8', rotate: 2.2 },
  asistente: { x: 100, y: 396, color: '#FF9FC5', rotate: 1.6 },
  cetiuc: { x: 364, y: 424, color: '#9ED8F0', rotate: -2 },
};
const POSTIT_W = 240;
const POSTIT_H = 230;

function rotateAround(px: number, py: number, cx: number, cy: number, deg: number) {
  const a = (deg * Math.PI) / 180;
  return {
    x: cx + (px - cx) * Math.cos(a) - (py - cy) * Math.sin(a),
    y: cy + (px - cx) * Math.sin(a) + (py - cy) * Math.cos(a),
  };
}

export const postIts: PlacedPostIt[] = experience.map((job) => {
  const { x, y, color, rotate } = POSTITS[job.id];
  const rect = { x, y, w: POSTIT_W, h: POSTIT_H };
  const tack = rotateAround(x + POSTIT_W / 2, y + 16, x + POSTIT_W / 2, y + POSTIT_H / 2, rotate);
  return { job, rect, color, rotate, tack };
});

/* ---------- Stickers ---------- */

/** Ancho aproximado del texto (DM Sans 800); los stickers tienen ancho fijo para ubicar los hilos. */
const textWidth = (text: string, size: number, k: number) => text.length * size * k;
const ROTATIONS = [-4, 3, -2, 4, -3, 2, -5, 3, -1];
const COLUMNS = [
  { x: 112, w: 330 },
  { x: 450, w: 410 },
  { x: 890, w: 210 },
  { x: 1160, w: 340 },
];
const TITLE_Y = 684;
const ROW_Y = 758;
const ROW_STEP = 52;

export const skillId = (name: string) =>
  name
    .toLowerCase()
    .replace('#', '-sharp')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const jobsUsing = (skill: Skill) =>
  experience.filter((job) => job.stack.includes(skill.name)).map((job) => job.id);

export const stickers: PlacedSticker[] = skills.flatMap((group, i) => {
  const column = COLUMNS[i];
  const pad = group.shape === 'tag' || group.shape === 'disk' ? 24 : 0;
  const title: PlacedSticker = {
    id: `cat-${skillId(group.label)}`,
    label: group.label,
    name: group.label,
    shape: group.shape,
    color: 'var(--color-plum)',
    rect: { x: column.x, y: TITLE_Y, w: textWidth(group.label, 25, 0.56) + 40 + pad, h: 52 },
    rotate: -3,
    title: true,
    jobs: [],
  };
  let x = column.x;
  let y = ROW_Y;
  const items = group.items.map((skill, k): PlacedSticker => {
    const label = skill.short ?? skill.name;
    const extra = group.shape === 'tag' || group.shape === 'disk' ? 14 : 0;
    const w = Math.round(textWidth(label, 20, 0.57)) + 34 + extra;
    const h = group.shape === 'disk' ? 48 : 42;
    if (x + w > column.x + column.w) {
      x = column.x;
      y += ROW_STEP;
    }
    const rect = { x, y, w, h };
    x += w + 16;
    return {
      id: skillId(skill.name),
      label,
      name: skill.name,
      shape: group.shape,
      color: group.color,
      rect,
      rotate: ROTATIONS[(k + i) % ROTATIONS.length],
      title: false,
      jobs: jobsUsing(skill),
    };
  });
  return [title, ...items];
});

/** Stickers decorativos (sin contenido): centro, rotación y figura. */
export const decor = [
  { kind: 'star', x: 1070, y: 860, rotate: 12 },
  { kind: 'heart', x: 548, y: 864, rotate: -10 },
  { kind: 'code', x: 700, y: 858, rotate: 8 },
  { kind: 'smiley', x: 1210, y: 380, rotate: -6 },
] as const;

/* ---------- Hilos ---------- */

/** Hilo con una caída suave hacia abajo, proporcional a su largo. */
function threadPath(a: { x: number; y: number }, b: { x: number; y: number }) {
  const sag = Math.hypot(b.x - a.x, b.y - a.y) * 0.14;
  const f = (n: number) => Math.round(n * 10) / 10;
  return `M${f(a.x)} ${f(a.y)} Q${f((a.x + b.x) / 2)} ${f((a.y + b.y) / 2 + sag)} ${f(b.x)} ${f(b.y)}`;
}

const stickerByName = new Map(stickers.filter((s) => !s.title).map((s) => [s.name, s]));

export const threads: Thread[] = postIts.flatMap(({ job, tack }) =>
  job.stack.map((name, index) => {
    const sticker = stickerByName.get(name);
    if (!sticker) throw new Error(`"${name}" (${job.id}) no está en skills.ts`);
    const end = { x: sticker.rect.x + sticker.rect.w / 2, y: sticker.rect.y + 4 };
    return { job: job.id, sticker: sticker.id, d: threadPath(tack, end), end, index };
  }),
);

/** Tiempos del hilo (ms): un cargo los tiende uno tras otro; Skills, todos los cargos a la vez. */
export const THREAD = {
  stagger: 110,
  draw: 520,
  skillsJob: 260,
  skillsStagger: 60,
  skillsDraw: 450,
};

/** Cuánto tarda en tenderse el hilo de un cargo, antes de que llegue su postal. */
export const threadTime = (job: JobId) => {
  const n = experience.find((j) => j.id === job)?.stack.length ?? 0;
  return (n - 1) * THREAD.stagger + THREAD.draw + 150;
};

/* ---------- Ítems ---------- */

export const experienciaItems: ExperienciaItem[] = [
  ...postIts.map(({ job, rect }) => ({
    id: job.id,
    chip: job.chip,
    name: `${job.title} en ${job.org}, ${job.period}`,
    hit: rect,
  })),
  {
    id: 'skills',
    chip: 'Skills',
    name: 'Skills: tecnologías y en qué cargos las usé',
    hit: { x: 100, y: 672, w: 1400, h: 250 },
  },
];

export const experienciaItem = (id: string) => experienciaItems.find((i) => i.id === id);
