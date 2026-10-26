export interface SkillGroup {
  label: string;
  items: string[];
}

export const skills: SkillGroup[] = [
  {
    label: 'Lenguajes',
    items: ['Python', 'JavaScript / TypeScript', 'C#', 'Ruby', 'SQL', 'HTML / CSS'],
  },
  {
    label: 'Frameworks',
    items: [
      'React',
      'Node.js',
      'Symfony',
      'Ruby on Rails',
      'Flask',
      'FastAPI',
      'Django',
      'Tailwind',
      'Bootstrap',
    ],
  },
  { label: 'Bases de datos', items: ['PostgreSQL', 'MySQL'] },
  {
    label: 'Herramientas',
    items: ['Git', 'Docker', 'GitHub Actions', 'AWS', 'Pytest', 'Scrum'],
  },
];
