export interface Job {
  period: string;
  title: string;
  org: string;
  summary: string;
}

export const experience: Job[] = [
  {
    period: 'Jul 2026 – hoy',
    title: 'Desarrollador Fullstack · Práctica profesional',
    org: 'Servicio de Desarrollo e Informática (SDI), Facultad de Ingeniería UC',
    summary:
      'Construyo GPPT, una plataforma en Symfony (PHP) que reemplaza la gestión en Excel de los profesores part-time de la Escuela de Ingeniería. Además diseño un sistema de tickets para atender solicitudes y otro para asignar y seguir pagos de forma semiautomática.',
  },
  {
    period: 'Mar 2026 – Jul 2026',
    title: 'Desarrollador Web',
    org: 'CENIA · Contrato de formación',
    summary:
      'Desarrollé el Observatorio Científico de Sciencenia, mi proyecto de título: una plataforma interactiva con cerca de 500 publicaciones obtenidas por scraping y un gráfico para explorar cómo se relacionan entre sí.',
  },
  {
    period: 'Ago 2021 – Jul 2026',
    title: 'Asistente Pedagógico',
    org: 'Pontificia Universidad Católica de Chile',
    summary:
      'Llegué a Coordinador General de Introducción a la Programación (IIC1103): un equipo de 10 profesores y 1300 estudiantes en un semestre. También fui ayudante corrector de Diseño Detallado de Software (IIC2113), evaluando con principios de Clean Code, y ayudante en IIC3113 e IIC101G.',
  },
  {
    period: 'Ago 2023 – Nov 2023',
    title: 'Desarrollador Frontend · Proyecto Capstone',
    org: 'CETIUC',
    summary:
      'Módulos de frontend en React sobre una API en Node.js, incluyendo la generación de documentos de asesoría y assessments personalizados para los clientes.',
  },
];
