import { useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import Fuse from 'fuse.js';
import coursesData from '@/data/courses.json';
import { apiGet } from '@/services/api';

export type CourseProgramItem = {
  title?: string;
  description?: string;
  topics?: string[];
};

export type CourseSpeaker = {
  name: string;
  role?: string;
  company?: string;
  bio?: string;
  avatar?: string;
};

export type CourseInvestmentOption = {
  title?: string;
  price?: string;
  includes?: string[];
};

export type CourseInvestment = {
  summary?: string;
  options?: CourseInvestmentOption[];
  notes?: string;
};

export type CourseContacts = {
  email?: string;
  phone?: string;
  whatsapp?: string;
  website?: string;
  hours?: string;
};

export type Course = {
  id: string;
  title: string;
  subtitle?: string;
  slug: string;
  area?: string;
  company: string;
  course_type: string;
  segment: string;
  segments: string[];
  modality: string[];
  tags: string[];
  badges: string[];
  summary: string;
  description: string;
  duration_hours: number;
  startDate?: string | null;
  endDate?: string | null;
  location?: string | null;
  address?: string | null;
  schedule_details?: string | null;
  price_summary?: string | null;
  target_audience: string[];
  deliverables: string[];
  learning_points: string[];
  objectives?: string[];
  program_sections: CourseProgramItem[];
  methodology?: string | null;
  speakers: CourseSpeaker[];
  investment_details?: CourseInvestment;
  payment_methods: string[];
  reasons_to_attend: string[];
  registration_guidelines: string[];
  contacts?: CourseContacts;
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
  subtitle?: string;
  category?: string;
  segments?: string[];
  badges?: string[];
  startDate?: string;
  endDate?: string;
  location?: string;
  address?: string;
  schedule_details?: string;
  price_summary?: string;
  learning_points?: string[];
  methodology?: string;
  speakers?: CourseSpeaker[];
  investment_details?: CourseInvestment;
  payment_methods?: string[];
  reasons_to_attend?: string[];
  registration_guidelines?: string[];
  contacts?: CourseContacts;
};

type ApiCourse = {
  id: string;
  titulo: string;
  titulo_complemento?: string | null;
  slug: string;
  categoria?: string | null;
  empresa?: string | null;
  tipo?: string | null;
  segmento?: string | null;
  segmentos_adicionais?: string[] | null;
  modalidade?: string[] | null;
  tags?: string[] | null;
  summary?: string | null;
  description?: string | null;
  carga_horaria?: number | null;
  nivel?: string | null;
  publico_alvo?: string[] | null;
  aprendizados?: string[] | null;
  deliverables?: string[] | null;
  landing_page?: string | null;
  pdf_url?: string | null;
  data_inicio?: string | null;
  data_fim?: string | null;
  local?: string | null;
  endereco_completo?: string | null;
  objetivos?: string[] | null;
  programacao?: any[] | null;
  metodologia?: string | null;
  logistica_detalhes?: string | null;
  preco_resumido?: string | null;
  badges?: string[] | null;
  motivos_participar?: string[] | null;
  orientacoes_inscricao?: string[] | null;
  contatos?: any | null;
  professores?: any[] | null;
  coordenacao?: any | null;
  investimento?: any | null;
  forma_pagamento?: string[] | null;
  inscricao_url?: string | null;
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

function normalizeProgramacao(value?: any[] | null): CourseProgramItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(item => {
      if (typeof item === 'string') {
        return { title: item };
      }
      if (item && typeof item === 'object') {
        return {
          title: item.titulo ?? item.title ?? '',
          description: item.descricao ?? item.description ?? undefined,
          topics: Array.isArray(item.topicos ?? item.topics)
            ? (item.topicos ?? item.topics)
                .map((t: string) => `${t}`.trim())
                .filter(Boolean)
            : undefined,
        };
      }
      return null;
    })
    .filter((section): section is CourseProgramItem => Boolean(section && (section.title || section.description)));
}

function normalizeSpeakers(value?: any[] | CourseSpeaker[] | null): CourseSpeaker[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(item => {
      if (typeof item === 'string') {
        return { name: item };
      }
      if (item && typeof item === 'object') {
        return {
          name: item.name ?? item.nome ?? '',
          role: item.role ?? item.cargo ?? item.funcao ?? undefined,
          company: item.company ?? item.empresa ?? undefined,
          bio: item.bio ?? item.descricao ?? undefined,
          avatar: item.avatar ?? item.foto ?? undefined,
        };
      }
      return null;
    })
    .filter((speaker): speaker is CourseSpeaker => Boolean(speaker && speaker.name.trim().length > 0));
}

function normalizeInvestment(value?: any | null): CourseInvestment | undefined {
  if (!value) return undefined;
  if (typeof value !== 'object') {
    return { summary: String(value) };
  }
  const options = Array.isArray(value.options ?? value.opcoes)
    ? (value.options ?? value.opcoes).map((opt: any) => ({
        title: opt.title ?? opt.nome ?? undefined,
        price: opt.price ?? opt.valor ?? undefined,
        includes: Array.isArray(opt.includes ?? opt.inclui)
          ? (opt.includes ?? opt.inclui).map((entry: string) => `${entry}`.trim()).filter(Boolean)
          : undefined,
      }))
    : undefined;
  return {
    summary: value.summary ?? value.resumo ?? undefined,
    options,
    notes: value.notes ?? value.observacoes ?? undefined,
  };
}

function normalizeContacts(value?: any | null): CourseContacts | undefined {
  if (!value || typeof value !== 'object') return undefined;
  return {
    email: value.email ?? value.contato_email ?? undefined,
    phone: value.phone ?? value.telefone ?? undefined,
    whatsapp: value.whatsapp ?? value.whats ?? undefined,
    website: value.website ?? value.site ?? undefined,
    hours: value.hours ?? value.horario ?? undefined,
  };
}

function normalizeArray(value?: string | string[] | null): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(v => v.trim()).filter(Boolean);
  return value
    .split(/[,|]/)
    .map(part => part.trim())
    .filter(Boolean);
}

function mapLegacyCourse(course: LegacyCourse): Course {
  const fallbackProgram = course.description ? course.description.split('|').map(section => ({ titulo: section })) : [];
  const programSections = course.program_sections ?? normalizeProgramacao(fallbackProgram);
  return {
    id: String(course.id),
    title: course.title,
    subtitle: course.subtitle,
    slug: course.slug,
    area: course.segment,
    category: course.category ?? course.segment,
    company: course.company,
    course_type: course.course_type,
    segment: course.segment,
    segments: course.segments ?? (course.segment ? [course.segment] : []),
    modality: course.modality ?? [],
    tags: course.tags ?? [],
    badges: course.badges ?? [],
    summary: course.summary ?? '',
    description: course.description ?? '',
    duration_hours: course.duration_hours,
    level: course.level,
    startDate: course.startDate ?? null,
    endDate: course.endDate ?? null,
    location: course.location ?? null,
    address: course.address ?? null,
    schedule_details: course.schedule_details ?? null,
    price_summary: course.price_summary ?? null,
    target_audience: normalizeArray(course.target_audience),
    deliverables: course.deliverables ?? [],
    learning_points: course.learning_points ?? [],
    objectives: [],
    program_sections: programSections,
    methodology: course.methodology ?? undefined,
    speakers: normalizeSpeakers(course.speakers),
    investment_details: course.investment_details,
    payment_methods: course.payment_methods ?? [],
    reasons_to_attend: course.reasons_to_attend ?? [],
    registration_guidelines: course.registration_guidelines ?? [],
    contacts: course.contacts,
    links: {
      landing: course.links?.landing ?? '',
      pdf: course.links?.pdf ?? '',
    },
    related_ids: (course.related_ids ?? []).map(id => String(id)),
    status: undefined,
    destaque: undefined,
    novo: undefined,
    imagem_capa: undefined,
    cor_categoria: undefined,
  };
}

function mapApiCourse(course: ApiCourse): Course {
  return {
    id: course.id,
    title: course.titulo ?? course.slug ?? 'Curso sem título',
    subtitle: course.titulo_complemento ?? undefined,
    slug: course.slug ?? course.id,
    area: course.categoria ?? course.segmento ?? undefined,
    category: course.categoria ?? undefined,
    company: course.empresa ?? 'JML',
    course_type: course.tipo ?? 'aberto',
    segment: course.segmento ?? course.categoria ?? 'Geral',
    segments: course.segmentos_adicionais ?? (course.segmento ? [course.segmento] : []),
    modality: course.modalidade ?? [],
    tags: course.tags ?? [],
    badges: course.badges ?? [],
    summary: course.summary ?? '',
    description: course.description ?? '',
    duration_hours: course.carga_horaria ?? 0,
    level: course.nivel ?? 'Básico',
    startDate: course.data_inicio ?? null,
    endDate: course.data_fim ?? null,
    location: course.local ?? null,
    address: course.endereco_completo ?? null,
    schedule_details: course.logistica_detalhes ?? null,
    price_summary: course.preco_resumido ?? null,
    target_audience: toArray(course.publico_alvo),
    deliverables: course.deliverables ?? [],
    learning_points: course.aprendizados ?? [],
    objectives: course.objetivos ?? [],
    program_sections: normalizeProgramacao(course.programacao),
    methodology: course.metodologia ?? undefined,
    speakers: normalizeSpeakers(course.professores),
    investment_details: normalizeInvestment(course.investimento),
    payment_methods: course.forma_pagamento ?? [],
    reasons_to_attend: course.motivos_participar ?? [],
    registration_guidelines: course.orientacoes_inscricao ?? [],
    contacts: normalizeContacts(course.contatos),
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
type UseSearchOptions = {
  status?: 'published' | 'draft' | 'all';
};

export function useSearch(options: UseSearchOptions = {}) {
  const legacyCourses = coursesData as LegacyCourse[];
  const statusFilter = options.status ?? 'published';

  const {
    data: remoteCourses,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['courses', statusFilter],
    queryFn: async () => {
      const statusQuery = statusFilter === 'all' ? '' : `&status=${statusFilter}`;
      const response = await apiGet<CoursesApiPayload>(
        `/api/courses?limit=500${statusQuery}`
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
              ? `TÃ­tulo relacionado`
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

  const allowedCompanies = ['JML', 'Conecta'];
  const allowedSegments = ['Estatais', 'Judiciário', 'Sistema S'];

  const getUniqueCompanies = useCallback(
    () =>
      [...new Set(courses.map(c => c.company).filter(Boolean))].filter(c =>
        allowedCompanies.includes(c)
      ),
    [courses]
  );

  const getUniqueCourseTypes = useCallback(
    () => [...new Set(courses.map(c => c.course_type).filter(Boolean))],
    [courses]
  );

  const getUniqueSegments = useCallback(
    () =>
      [...new Set(courses.map(c => c.segment).filter(Boolean))].filter(s =>
        allowedSegments.includes(s)
      ),
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
