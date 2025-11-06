import { useMemo } from 'react';
import Fuse from 'fuse.js';
import coursesData from '@/data/courses.json';

export type Course = {
  id: number;
  title: string;
  slug: string;
  company: string;           // Nova propriedade: "JML" ou "Conecta"
  course_type: string;       // Nova propriedade: "aberto", "incompany", "ead"
  segment: string;           // Nova propriedade: "Judiciário", "Sistema S", "Estatais"
  modality: string[];        // Atualizado para novas modalidades
  tags: string[];
  summary: string;
  description: string;
  duration_hours: number;
  level: string;
  target_audience: string;
  deliverables: string[];
  links: {
    landing: string;
    pdf: string;
  };
  related_ids: number[];
};

export type FilterOptions = {
  companies: string[];       // Nova: ["JML", "Conecta"]
  course_types: string[];    // Nova: ["aberto", "incompany", "ead"]
  segments: string[];        // Atualizada: ["Judiciário", "Sistema S", "Estatais"]
  levels: string[];          // Mantida: ["Básico", "Intermediário", "Avançado"]
};

export type SearchResult = Course & {
  matchReason?: string;
};

const fuseOptions = {
  keys: [
    { name: 'title', weight: 3 },
    { name: 'summary', weight: 2 },
    { name: 'tags', weight: 2 },
    { name: 'description', weight: 1 },
  ],
  threshold: 0.4,
  includeScore: true,
  includeMatches: true,
};

const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

export function useSearch() {
  const courses = coursesData as Course[];

  const fuse = useMemo(() => new Fuse(courses, fuseOptions), [courses]);

  const search = (query: string, filters: FilterOptions): SearchResult[] => {
    let results: SearchResult[] = [];

    if (query.trim()) {
      const fuseResults = fuse.search(query);
      results = fuseResults.map(({ item, matches }) => {
        const matchedField = matches?.[0]?.key || 'tags';
        const matchReason =
          matchedField === 'title'
            ? `Título relacionado`
            : matchedField === 'tags'
            ? `Tag: "${matches?.[0]?.value}"`
            : `Relacionado a "${query}"`;
        return { ...item, matchReason };
      });
    } else {
      results = courses.map(c => ({ ...c }));
    }

    // Apply filters - Nova lógica JML/Conecta
    if (filters.companies.length > 0) {
      results = results.filter(c => filters.companies.includes(c.company));
    }
    if (filters.course_types.length > 0) {
      results = results.filter(c => filters.course_types.includes(c.course_type));
    }
    if (filters.segments.length > 0) {
      results = results.filter(c => filters.segments.includes(c.segment));
    }
    if (filters.levels.length > 0) {
      results = results.filter(c => filters.levels.includes(c.level));
    }

    return results;
  };

  const getCourseById = (id: number): Course | undefined => {
    return courses.find(c => c.id === id);
  };

  const getRelatedCourses = (ids: number[]): Course[] => {
    return courses.filter(c => ids.includes(c.id));
  };

  // Funções auxiliares para obter valores únicos dos filtros
  const getUniqueCompanies = (): string[] => {
    return [...new Set(courses.map(c => c.company))];
  };

  const getUniqueCourseTypes = (): string[] => {
    return [...new Set(courses.map(c => c.course_type))];
  };

  const getUniqueSegments = (): string[] => {
    return [...new Set(courses.map(c => c.segment))];
  };

  const getUniqueLevels = (): string[] => {
    return [...new Set(courses.map(c => c.level))];
  };

  return { 
    search, 
    getCourseById, 
    getRelatedCourses, 
    allCourses: courses,
    getUniqueCompanies,
    getUniqueCourseTypes,
    getUniqueSegments,
    getUniqueLevels
  };
}
