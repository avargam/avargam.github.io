/**
 * Geometría del escritorio de Proyectos, en coordenadas de la escena (1600×1000). Sacada de `p1()`
 * en `prototype/generadores/gen_g.py` y de `prototype/detalle-escritorio/`.
 */
import { projects, type Project } from '../../../data/projects';
import type { Rect } from '../../stage/geometry';
import type { SectionItem } from '../../stage/itemNav';

export interface ProyectosItem extends SectionItem {
  /** Nombre para el botón y los anuncios. */
  name: string;
  project: Project;
  /** Carpeta del escritorio (botón). */
  folder: Rect;
  /** Pestaña de la barra de tareas. */
  tab: Rect;
}

/** Ventana de un proyecto abierto. */
export const WINDOW: Rect = { x: 280, y: 112, w: 960, h: 690 };

const TAB_W = 190;
const tabRect = (i: number): Rect => ({ x: 140 + i * (TAB_W + 10), y: 884, w: TAB_W, h: 32 });
const folderRect = (i: number): Rect => ({ x: 74, y: 150 + i * 160, w: 132, h: 126 });

export const proyectosItems: ProyectosItem[] = projects.map((project, i) => ({
  id: project.id,
  chip: project.chip,
  name: `${project.title}: ${project.eyebrow.toLowerCase()}`,
  project,
  folder: folderRect(i),
  tab: tabRect(i),
}));

export const proyectosItem = (id: string) => proyectosItems.find((i) => i.id === id);

/**
 * Transform (`translate` + `scale` con origen 0 0) que lleva la ventana a `r`: de dónde sale al
 * abrirse (su carpeta) y hacia dónde se va al minimizarse (su pestaña).
 */
export const windowTo = (r: Rect) => ({
  translate: `${r.x - WINDOW.x}px ${r.y - WINDOW.y}px`,
  scale: `${(r.w / WINDOW.w).toFixed(4)} ${(r.h / WINDOW.h).toFixed(4)}`,
});
