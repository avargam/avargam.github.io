export type JobId = 'sdi' | 'cenia' | 'asistente' | 'cetiuc';

/** Lo que dibuja el post-it del corcho. */
interface PostIt {
  /** Período en mayúsculas, como se escribe a mano en la nota. */
  period: string;
  /** Cargo en dos líneas. */
  lines: [string, string];
  sub: string;
}

/** Lo que dice la postal de detalle. */
interface Postcard {
  /** Remitente, en versalitas sobre el mensaje. */
  from: string;
  tags: string[];
  /** Modalidad, bajo el cargo en las líneas del destinatario. */
  mode: string;
  /** Organización en las líneas del destinatario. */
  place: string;
  stamp: string;
  /** Fecha del matasellos. */
  postmark: string;
}

export interface Job {
  id: JobId;
  /** Texto del chip numerado. */
  chip: string;
  period: string;
  title: string;
  org: string;
  summary: string;
  /** Tecnologías que se usaron, por nombre de `skills.ts`. Se conectan con hilo rojo. */
  stack: string[];
  postIt: PostIt;
  postcard: Postcard;
}

export const experience: Job[] = [
  {
    id: 'sdi',
    chip: 'SDI',
    period: 'Jul 2026 – Oct 2026',
    title: 'Desarrollador Fullstack · Práctica profesional',
    org: 'Servicio de Desarrollo e Informática (SDI), Facultad de Ingeniería UC',
    summary:
      'Construí GPPT, una plataforma en Symfony (PHP) que reemplaza la gestión en Excel de los profesores part-time de la Escuela de Ingeniería. Además diseñé un sistema de tickets para atender solicitudes y otro para asignar y seguir pagos de forma semiautomática.',
    stack: ['PHP', 'Symfony', 'SQL', 'MySQL', 'HTML / CSS', 'Git', 'Docker'],
    postIt: {
      period: 'JUL – OCT 2026',
      lines: ['Desarrollador', 'Fullstack'],
      sub: 'SDI UC · práctica',
    },
    postcard: {
      from: 'Servicio de Desarrollo e Informática (SDI)',
      tags: ['Symfony', 'PHP', 'Sistema de tickets', 'Pagos semiautomáticos'],
      mode: 'Práctica profesional',
      place: 'Facultad de Ingeniería UC',
      stamp: 'UC · 2026',
      postmark: 'OCT 2026',
    },
  },
  {
    id: 'cenia',
    chip: 'CENIA',
    period: 'Mar 2026 – Jul 2026',
    title: 'Desarrollador Web',
    org: 'CENIA · Contrato de formación',
    summary:
      'Desarrollé el Observatorio Científico de Sciencenia, mi proyecto de título: una plataforma interactiva con cerca de 500 publicaciones obtenidas por scraping y un gráfico para explorar cómo se relacionan entre sí.',
    stack: ['Python', 'JavaScript / TypeScript', 'React', 'PostgreSQL', 'Docker'],
    postIt: {
      period: 'MAR – JUL 2026',
      lines: ['Desarrollador', 'Web'],
      sub: 'CENIA · Sciencenia',
    },
    postcard: {
      from: 'Centro Nacional de Inteligencia Artificial (CENIA)',
      tags: ['Scraping', '~500 publicaciones', 'Grafo interactivo', 'Proyecto de título'],
      mode: 'Contrato de formación',
      place: 'CENIA · Sciencenia',
      stamp: 'CENIA · 2026',
      postmark: 'JUL 2026',
    },
  },
  {
    id: 'asistente',
    chip: 'Asistente',
    period: 'Ago 2021 – Jul 2026',
    title: 'Asistente Pedagógico',
    org: 'Pontificia Universidad Católica de Chile',
    summary:
      'Llegué a Coordinador General de Introducción a la Programación (IIC1103): un equipo de 10 profesores y 1300 estudiantes en un semestre. También fui ayudante corrector de Diseño Detallado de Software (IIC2113), evaluando con principios de Clean Code, y ayudante en IIC3113 e IIC101G.',
    stack: ['Python', 'C#', 'Git', 'Pytest'],
    postIt: {
      period: 'AGO 2021 – JUL 2026',
      lines: ['Asistente', 'Pedagógico'],
      sub: 'UC · IIC1103',
    },
    postcard: {
      from: 'Pontificia Universidad Católica de Chile',
      tags: ['Coordinador IIC1103', '1300 estudiantes', 'Clean Code'],
      mode: 'Coordinador general',
      place: 'Ingeniería UC',
      stamp: 'UC · 2021',
      postmark: 'JUL 2026',
    },
  },
  {
    id: 'cetiuc',
    chip: 'CETIUC',
    period: 'Ago 2023 – Nov 2023',
    title: 'Desarrollador Frontend · Proyecto Capstone',
    org: 'CETIUC',
    summary:
      'Módulos de frontend en React sobre una API en Node.js, incluyendo la generación de documentos de asesoría y assessments personalizados para los clientes.',
    stack: ['React', 'Node.js', 'JavaScript / TypeScript', 'Git', 'Scrum'],
    postIt: {
      period: 'AGO – NOV 2023',
      lines: ['Desarrollador', 'Frontend'],
      sub: 'Capstone · CETIUC',
    },
    postcard: {
      from: 'CETIUC · Proyecto Capstone',
      tags: ['React', 'Node.js', 'Assessments'],
      mode: 'Proyecto Capstone',
      place: 'CETIUC',
      stamp: 'UC · 2023',
      postmark: 'NOV 2023',
    },
  },
];

/** Cargo sin la modalidad ("Desarrollador Fullstack"), para la postal y los lectores de pantalla. */
export const jobRole = (job: Job) => job.title.split(' · ')[0];
