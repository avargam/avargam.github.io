export const degree = {
  title: 'Ingeniería Civil de Computación',
  org: 'Pontificia Universidad Católica de Chile',
  /** Meses en formato AAAA-MM. */
  start: '2020-03',
  end: '2026-11',
  startLabel: '2020',
  endLabel: 'nov 2026',
};

/** Avance de la carrera (0–1) a la fecha dada. Se calcula en el build; un rebuild lo actualiza. */
export function degreeProgress(now = new Date()): number {
  const start = new Date(`${degree.start}-01`).getTime();
  const end = new Date(`${degree.end}-01`).getTime();
  return Math.min(1, Math.max(0, (now.getTime() - start) / (end - start)));
}

export const degreeNote = (now = new Date()): string =>
  degreeProgress(now) < 1
    ? `Titulación esperada en ${degree.endLabel.replace('nov', 'noviembre de')}`
    : `Titulado en ${degree.endLabel.replace('nov', 'noviembre de')}`;

export interface Specialization {
  kind: 'Major' | 'Minor';
  name: string;
  summary: string;
  skills: string[];
  /** Versiones cortas de `skills`, para espacios chicos (el panel del Minor). */
  short?: string[];
}

export const major: Specialization = {
  kind: 'Major',
  name: 'Software',
  summary: 'Diseñar y construir software mantenible, de punta a punta.',
  skills: [
    'Desarrollo full-stack: interfaz, API y base de datos',
    'Diseño de software y código limpio',
    'Testing y automatización (Pytest, GitHub Actions)',
    'Trabajo en equipo con metodologías ágiles (Scrum)',
  ],
};

export const minor: Specialization = {
  kind: 'Minor',
  name: 'Ciencia de Datos',
  summary: 'Obtener, procesar y mostrar datos para que se entiendan.',
  skills: [
    'Recolección de datos y scraping',
    'Procesamiento y análisis con Python',
    'Visualización interactiva de datos',
    'Modelamiento de datos en SQL',
  ],
  short: ['Scraping', 'Análisis con Python', 'Visualización', 'Modelamiento SQL'],
};

export interface Language {
  code: string;
  name: string;
  level: string;
  cert?: { name: string; score: number; max: number; year: number };
}

export const languages: Language[] = [
  { code: 'ES', name: 'Español', level: 'Nativo' },
  {
    code: 'EN',
    name: 'Inglés',
    level: 'C1',
    cert: { name: 'TOEIC', score: 975, max: 990, year: 2021 },
  },
];
