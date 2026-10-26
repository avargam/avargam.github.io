export interface Project {
  name: string;
  description: string;
  tags: string[];
  url?: string;
  repo?: string;
}

/**
 * Para agregar un proyecto, suma un objeto a este arreglo.
 * El primero es un marcador de posición: reemplázalo por tu proyecto real.
 */
export const projects: Project[] = [
  {
    name: '[Nombre de tu proyecto personal]',
    description: '[Una o dos líneas sobre qué es y por qué lo empezaste.]',
    tags: ['[Tecnología]', '[Tecnología]'],
  },
];
