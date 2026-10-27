/** Forma de los stickers de una categoría en el corcho. */
export type StickerShape = 'pill' | 'patch' | 'disk' | 'tag';

export interface Skill {
  name: string;
  /** Texto del sticker cuando el nombre no cabe. */
  short?: string;
}

export interface SkillGroup {
  label: string;
  shape: StickerShape;
  color: string;
  items: Skill[];
}

/** Solo lo que se usó en algún cargo de `experience.ts` (cada uno se conecta con hilo rojo). */
export const skills: SkillGroup[] = [
  {
    label: 'Lenguajes',
    shape: 'pill',
    color: 'var(--color-pink)',
    items: [
      { name: 'Python' },
      { name: 'JavaScript / TypeScript', short: 'JS / TS' },
      { name: 'PHP' },
      { name: 'C#' },
      { name: 'SQL' },
      { name: 'HTML / CSS' },
    ],
  },
  {
    label: 'Frameworks',
    shape: 'patch',
    color: 'var(--color-mint)',
    items: [{ name: 'React' }, { name: 'Node.js' }, { name: 'Symfony' }],
  },
  {
    label: 'Bases de datos',
    shape: 'disk',
    color: 'var(--color-sun)',
    items: [{ name: 'PostgreSQL' }, { name: 'MySQL' }],
  },
  {
    label: 'Herramientas',
    shape: 'tag',
    color: 'var(--color-lilac)',
    items: [{ name: 'Git' }, { name: 'Docker' }, { name: 'Pytest' }, { name: 'Scrum' }],
  },
];
