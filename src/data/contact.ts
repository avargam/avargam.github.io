/**
 * Contacto: un objeto de la mesa por canal. Los valores salen de `profile.ts`; el CV es el PDF de
 * `public/cv/` (sin teléfono: el sitio es público).
 */
import { profile } from './profile';

export type ContactId = 'correo' | 'github' | 'linkedin' | 'cv';

export interface Contact {
  /** Ancla del objeto (`#correo`). */
  id: ContactId;
  chip: string;
  /** Nombre accesible del objeto y lo que se anuncia al abrirlo. */
  name: string;
  href: string;
}

const base = import.meta.env.BASE_URL.replace(/\/$/, '');

export const cvFile = `${base}/cv/AlonsoVargas_CV.pdf`;

export const contacts: Contact[] = [
  {
    id: 'correo',
    chip: 'Correo',
    name: `Correo: ${profile.email}`,
    href: `mailto:${profile.email}`,
  },
  { id: 'github', chip: 'GitHub', name: 'GitHub', href: profile.links.github },
  { id: 'linkedin', chip: 'LinkedIn', name: 'Perfil de LinkedIn', href: profile.links.linkedin },
  { id: 'cv', chip: 'CV', name: 'CV en PDF', href: cvFile },
];

export const contact = (id: string) => contacts.find((c) => c.id === id);
