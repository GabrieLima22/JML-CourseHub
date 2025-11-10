import { useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import Fuse from 'fuse.js';
import coursesData from '@/data/courses.json';
import { apiGet } from '@/services/api';

export type Course = {
  id: string;
  title: string;
  slug: string;
  area?: string;
  company: string;
  course_type: string;
  segment: string;
  modality: string[];
  tags: string[];
  summary: string;
  description: string;
  duration_hours: number;
  level: string;
  target_audience: string[];
  deliverables: string[];
  links: {
    landing: string;
    pdf: string;
  };
  related_ids: string[];
  status?: string;
  destaque?: boolean;
  novo?: boolean;
  imagem_capa?: string;
  cor_categoria?: string;
};

export type FilterOptions = {
  companies: string[];
  course_types: string[];
  segments: string[];
  levels: string[];
};

export type SearchResult = Course & {
  matchReason?: string;
};

type LegacyCourse = {
  id: number;
  title: string;
  slug: string;
  company: string;
  course_type: string;
  segment: string;
  modality: string[];
  tags: string[];
  summary: string;
  description: string;
  duration_hours: number;
  level: string;
  target_audience?: string;
  deliverables?: string[];
  links?: {
    landing?: string;
    pdf?: string;
  };
  related_ids?: number[];
};

type ApiCourse = {
  id: string;
  titulo: string;
  slug: string;
  categoria?: string | null;
  empresa?: string | null;
  tipo?: string | null;
  segmento?: string | null;
  modalidade?: string[] | null;
  tags?: string[] | null;
  summary?: string | null;
  description?: string | null;
  carga_horaria?: number | null;
  nivel?: string | null;
  publico_alvo?: string[] | null;
  deliverables?: string[] | null;
  landing_page?: string | null;
  pdf_url?: string | null;
  related_ids?: string[] | null;
  status?: string | null;
  destaque?: boolean | null;
  novo?: boolean | null;
  cor_categoria?: string | null;
  imagem_capa?: string | null;
};

type CoursesApiPayload = {
  courses: ApiCourse[];
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

const toArray = (value?: string | string[] | null) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return value
    .split(',')
    .map(v => v.trim())
    .filter(Boolean);
};

function mapLegacyCourse(course: LegacyCourse): Course {
  return {
    id: String(course.id),
    title: course.title,
    slug: course.slug,
    area: course.segment,
    company: course.company,
    course_type: course.course_type,
    segment: course.segment,
    modality: course.modality ?? [],
    tags: course.tags ?? [],
    summary: course.summary,
    description: course.description,
    duration_hours: course.duration_hours,
    level: course.level,
    target_audience: toArray(course.target_audience),
    deliverables: course.deliverables ?? [],
    links: {
      landing: course.links?.landing ?? '',
      pdf: course.links?.pdf ?? '',
    },
    related_ids: (course.related_ids ?? []).map(id => String(id)),
  };
}

function mapApiCourse(course: ApiCourse): Course {
  return {
    id: course.id,
    title: course.titulo ?? course.slug ?? 'Curso sem título',
    slug: course.slug ?? course.id,
    area: course.categoria ?? course.segmento ?? undefined,
    company: course.empresa ?? 'JML',
    course_type: course.tipo ?? 'aberto',
    segment: course.segmento ?? course.categoria ?? 'Geral',
    modality: course.modalidade ?? [],
    tags: course.tags ?? [],
    summary: course.summary ?? '',
    description: course.description ?? '',
    duration_hours: course.carga_horaria ?? 0,
    level: course.nivel ?? 'Básico',
    target_audience: toArray(course.publico_alvo),
    deliverables: course.deliverables ?? [],
    links: {
      landing: course.landing_page ?? '',
      pdf: course.pdf_url ?? '',
    },
    related_ids: (course.related_ids ?? []).map(String),
    status: course.status ?? undefined,
    destaque: course.destaque ?? undefined,
    novo: course.novo ?? undefined,
    imagem_capa: course.imagem_capa ?? undefined,
    cor_categoria: course.cor_categoria ?? undefined,
  };
}

export function useSearch() {
  const legacyCourses = coursesData as LegacyCourse[];

  const {
    data: remoteCourses,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const response = await apiGet<CoursesApiPayload>(
        '/api/courses?limit=500&status=published'
      );
      return response.data?.courses?.map(mapApiCourse) ?? [];
    },
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  const fallbackCourses = useMemo(
    () => legacyCourses.map(mapLegacyCourse),
    [legacyCourses]
  );

  const usingFallback = !remoteCourses || remoteCourses.length === 0;
  const courses = usingFallback ? fallbackCourses : remoteCourses;

  const fuse = useMemo(() => new Fuse(courses, fuseOptions), [courses]);

  const search = useCallback(
    (query: string, filters: FilterOptions): SearchResult[] => {
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
    },
    [courses, fuse]
  );

  const getCourseById = useCallback(
    (id: string): Course | undefined => courses.find(c => c.id === id),
    [courses]
  );

  const getRelatedCourses = useCallback(
    (ids: string[] = []): Course[] => {
      if (!ids.length) return [];
      return courses.filter(c => ids.includes(c.id));
    },
    [courses]
  );

  const getUniqueCompanies = useCallback(
    () => [...new Set(courses.map(c => c.company).filter(Boolean))],
    [courses]
  );

  const getUniqueCourseTypes = useCallback(
    () => [...new Set(courses.map(c => c.course_type).filter(Boolean))],
    [courses]
  );

  const getUniqueSegments = useCallback(
    () => [...new Set(courses.map(c => c.segment).filter(Boolean))],
    [courses]
  );

  const getUniqueLevels = useCallback(
    () => [...new Set(courses.map(c => c.level).filter(Boolean))],
    [courses]
  );

  return {
    search,
    getCourseById,
    getRelatedCourses,
    allCourses: courses,
    getUniqueCompanies,
    getUniqueCourseTypes,
    getUniqueSegments,
    getUniqueLevels,
    isLoading,
    isFetching,
    isError,
    errorMessage: error instanceof Error ? error.message : null,
    refetch,
    isUsingFallback: usingFallback,
  };
}
