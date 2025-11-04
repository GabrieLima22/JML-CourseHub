import { useMemo } from 'react';
import Fuse from 'fuse.js';
import coursesData from '@/data/courses.json';

export type Course = {
  id: number;
  title: string;
  slug: string;
  area: string;
  modality: string[];
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
  modalities: string[];
  areas: string[];
  levels: string[];
  segments: string[];
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

    // Apply filters
    if (filters.modalities.length > 0) {
      results = results.filter(c =>
        c.modality.some(m => filters.modalities.includes(m))
      );
    }
    if (filters.areas.length > 0) {
      results = results.filter(c => filters.areas.includes(c.area));
    }
    if (filters.levels.length > 0) {
      results = results.filter(c => filters.levels.includes(c.level));
    }
    if (filters.segments.length > 0) {
      const normalizedSegments = filters.segments.map(normalizeText);
      results = results.filter(c => {
        const normalizedTags = c.tags.map(normalizeText);
        const audience = normalizeText(c.target_audience);
        return normalizedSegments.some(segment => normalizedTags.includes(segment) || audience.includes(segment));
      });
    }

    return results;
  };

  const getCourseById = (id: number): Course | undefined => {
    return courses.find(c => c.id === id);
  };

  const getRelatedCourses = (ids: number[]): Course[] => {
    return courses.filter(c => ids.includes(c.id));
  };

  return { search, getCourseById, getRelatedCourses, allCourses: courses };
}
