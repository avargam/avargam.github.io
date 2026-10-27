export type ProjectId = 'sudoku' | 'recetario' | 'sitio';

export interface ProjectLink {
  label: string;
  href: string;
  /** El principal va en rosa; el resto, con borde. */
  primary?: boolean;
}

/** Proyectos personales. Cada uno es una carpeta del escritorio y una ventana. */
export interface Project {
  id: ProjectId;
  /** Texto de la pestaña de la barra de tareas. */
  chip: string;
  /** Nombre bajo la carpeta, en líneas. */
  folder: string[];
  /** Título de la ventana. */
  window: string;
  color: string;
  eyebrow: string;
  title: string;
  description: string;
  tags: string[];
  highlight?: string;
  /** Qué muestra la vista previa animada. */
  legend: string;
  links: ProjectLink[];
}

export const projects: Project[] = [
  {
    id: 'sudoku',
    chip: 'Sudoku Coach',
    folder: ['Sudoku', 'Coach'],
    window: 'sudoku-coach',
    color: '#FF6FA3',
    eyebrow: 'App Android · 2026',
    title: 'Sudoku Coach',
    description:
      'App Android que lee con la cámara un sudoku en papel, incluidos los números escritos a lápiz, y enseña el siguiente paso lógico en vez de la respuesta. Todo corre en el teléfono.',
    tags: ['Kotlin', 'Jetpack Compose', 'OpenCV', 'ML Kit'],
    highlight: '13 técnicas que coinciden con HoDoKu en 16.753 pasos',
    legend: 'Tablero detectado · lápiz · pista en tres etapas',
    links: [
      {
        label: 'Descargar APK',
        href: 'https://github.com/avargam/sudoku-coach/releases/latest',
        primary: true,
      },
      { label: 'Ver código', href: 'https://github.com/avargam/sudoku-coach' },
    ],
  },
  {
    id: 'recetario',
    chip: 'Recetario',
    folder: ['Recetario'],
    window: 'recetario',
    color: '#8ADBC8',
    eyebrow: 'App web · 2026',
    title: 'Recetario',
    description:
      'Red social de recetas: publicar, comentar, valorar y guardar en colecciones, con panel de moderación. Un lector basado en reglas convierte los pasos escritos en una tarjeta de íconos.',
    tags: ['Next.js', 'Django REST', 'PostgreSQL'],
    highlight: '171 íconos en la tarjeta recordatorio',
    legend: 'Cada paso escrito se vuelve íconos',
    links: [
      { label: 'Abrir app', href: 'https://proyecto-recetario-rose.vercel.app', primary: true },
    ],
  },
  {
    id: 'sitio',
    chip: 'Este sitio',
    folder: ['Este sitio'],
    window: 'avargam.github.io',
    color: '#FFE86B',
    eyebrow: 'Sitio web · 2026',
    title: 'Este sitio',
    description:
      'Este portafolio: un cuarto ilustrado donde cada objeto es una sección y la cámara hace zoom hasta ella. Sin librerías de animación: SVG, CSS y Web Animations.',
    tags: ['Astro', 'TypeScript', 'Tailwind'],
    legend: 'El cuarto dentro del monitor del cuarto',
    links: [{ label: 'Ver código', href: 'https://github.com/avargam/avargam.github.io' }],
  },
];
