import { useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import Fuse from 'fuse.js';
import { apiGet, apiPost } from '@/services/api';

// --- TIPAGENS ---

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
  apresentacao?: string;
  duration_hours: number;
  startDate?: string | null;
  endDate?: string | null;
  location?: string | null;
  address?: string | null;
  price_summary?: string | null;
  preco_resumido?: string | null;
  preco_online?: number | null;
  preco_presencial?: number | null;
  preco_incompany?: number | null;
  target_audience: string[];
  deliverables: string[];
  learning_points: string[];
  objectives?: string[];
  program_sections: CourseProgramItem[];
  programacao?: any[];
  methodology?: string | null;
  speakers: CourseSpeaker[];
  palestrantes?: any[];
  convidados?: any[];
  investment_details?: CourseInvestment;
  payment_methods: string[];
  reasons_to_attend: string[];
  vantagens?: string[];
  vantagens_ead?: string[];
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
  custom_schema?: any[];
  custom_fields?: Record<string, any>;
  _searchableText?: string;
};

export type FilterOptions = {
  companies: string[];
  course_types: string[];
  segments: string[];
};

export type SearchResult = Course & {
  matchReason?: string;
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
  apresentacao?: string | null;
  carga_horaria?: number | null;
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
  palestrantes?: any[] | null;
  professores?: any[] | null;
  convidados?: any[] | null;
  metodologia?: string | null;
  preco_resumido?: string | null;
  preco_online?: number | null;
  preco_presencial?: number | null;
  preco_incompany?: number | null;
  badges?: string[] | null;
  motivos_participar?: string[] | null;
  vantagens?: string[] | null;
  vantagens_ead?: string[] | null;
  orientacoes_inscricao?: string[] | null;
  contatos?: any | null;
  investimento?: any | null;
  forma_pagamento?: string[] | null;
  related_ids?: string[] | null;
  status?: string | null;
  destaque?: boolean | null;
  novo?: boolean | null;
  cor_categoria?: string | null;
  imagem_capa?: string | null;
  custom_fields?: Record<string, any> | null;
  custom_schema?: any[] | null;
};

type CoursesApiPayload = {
  courses: ApiCourse[];
};

// --- UTILITÁRIOS (Mantidos) ---

const extractCustomFieldsText = (course: Course): string => {
  if (!course.custom_fields || typeof course.custom_fields !== 'object') return '';
  const values: string[] = [];
  Object.values(course.custom_fields).forEach(value => {
    if (typeof value === 'string') values.push(value);
    else if (Array.isArray(value)) values.push(...value.filter(v => typeof v === 'string'));
    else if (typeof value === 'number' || typeof value === 'boolean') values.push(String(value));
  });
  return values.join(' ');
};

const extractProgramText = (course: Course): string => {
  if (!Array.isArray(course.program_sections)) return '';
  return course.program_sections
    .map(section => {
      const parts: string[] = [];
      if (section.title) parts.push(section.title);
      if (section.description) parts.push(section.description);
      if (Array.isArray(section.topics)) parts.push(...section.topics);
      return parts.join(' ');
    })
    .join(' ');
};

const generateSearchableText = (course: Course): string => {
  const parts: string[] = [
    course.title,
    course.subtitle || '',
    course.summary,
    course.description,
    course.area || '',
    course.segment,
    course.segments.join(' '),
    course.tags.join(' '),
    course.badges.join(' '),
    course.objectives?.join(' ') || '',
    course.target_audience.join(' '),
    course.learning_points.join(' '),
    course.deliverables.join(' '),
    course.reasons_to_attend.join(' '),
    course.vantagens?.join(' ') || '',
    course.vantagens_ead?.join(' ') || '',
    course.methodology || '',
    extractProgramText(course),
    extractCustomFieldsText(course),
    course.speakers.map(s => `${s.name} ${s.role || ''} ${s.bio || ''}`).join(' '),
  ];

  return parts.filter(Boolean).join(' ').toLowerCase().replace(/\s+/g, ' ').trim();
};

const fuseOptions = {
  keys: [
    { name: '_searchableText', weight: 10 },
    { name: 'title', weight: 5 },
    { name: 'subtitle', weight: 4 },
    { name: 'summary', weight: 4 },
    { name: 'tags', weight: 4 },
    { name: 'segment', weight: 3 },
    { name: 'description', weight: 3 },
    { name: 'objectives', weight: 3 },
    { name: 'target_audience', weight: 3 },
    { name: 'program_sections.title', weight: 2.5 },
    { name: 'speakers.name', weight: 2 },
    { name: 'company', weight: 1 },
    { name: 'course_type', weight: 1 },
  ],
  threshold: 0.4,
  includeScore: true,
  includeMatches: true,
  ignoreLocation: true,
  useExtendedSearch: true,
};

const toArray = (value?: string | string[] | null) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return value.split(/[,|]/).map(v => v.trim()).filter(Boolean);
};

// Normalizadores
function normalizeProgramacao(value?: any[] | null): CourseProgramItem[] {
  if (!Array.isArray(value)) return [];
  return value.map(item => {
    if (typeof item === 'string') return { title: item };
    if (item && typeof item === 'object') {
      return {
        title: item.titulo ?? item.title ?? '',
        description: item.descricao ?? item.description ?? undefined,
        topics: Array.isArray(item.topicos ?? item.topics) ? item.topicos ?? item.topics : undefined,
      };
    }
    return null;
  }).filter(Boolean) as CourseProgramItem[];
}

function normalizeSpeakers(value?: any[] | null): CourseSpeaker[] {
  if (!Array.isArray(value)) return [];
  return value.map(item => {
    if (typeof item === 'string') return { name: item };
    if (item && typeof item === 'object') {
      return {
        name: item.name ?? item.nome ?? '',
        role: item.role ?? item.cargo ?? item.funcao ?? undefined,
        company: item.company ?? item.empresa ?? undefined,
        bio: item.bio ?? item.curriculo ?? item.descricao ?? undefined,
        avatar: item.avatar ?? item.foto ?? item.imagem ?? undefined,
      };
    }
    return null;
  }).filter((s): s is CourseSpeaker => !!s && !!s.name);
}

// Mapeamento
function mapApiCourse(course: ApiCourse): Course {
  const mapped: Course = {
    id: course.id,
    title: course.titulo ?? course.slug ?? 'Curso sem título',
    subtitle: course.titulo_complemento ?? undefined,
    slug: course.slug ?? course.id,
    area: course.categoria ?? course.segmento ?? undefined,
    company: course.empresa ?? 'JML',
    course_type: course.tipo ?? 'aberto',
    segment: course.segmento ?? course.categoria ?? 'Geral',
    segments: course.segmentos_adicionais ?? (course.segmento ? [course.segmento] : []),
    modality: course.modalidade ?? [],
    tags: course.tags ?? [],
    badges: course.badges ?? [],
    summary: course.summary ?? '',
    description: course.apresentacao || course.description || '',
    apresentacao: course.apresentacao ?? undefined,
    duration_hours: course.carga_horaria ?? 0,
    startDate: course.data_inicio ?? null,
    endDate: course.data_fim ?? null,
    location: course.local ?? null,
    address: course.endereco_completo ?? null,
    price_summary: course.preco_resumido ?? null,
    preco_resumido: course.preco_resumido ?? null,
    preco_online: course.preco_online ?? null,
    preco_presencial: course.preco_presencial ?? null,
    preco_incompany: course.preco_incompany ?? null,
    target_audience: toArray(course.publico_alvo),
    deliverables: toArray(course.deliverables),
    learning_points: toArray(course.aprendizados),
    objectives: toArray(course.objetivos),
    program_sections: normalizeProgramacao(course.programacao),
    programacao: course.programacao ?? [],
    methodology: course.metodologia ?? undefined,
    speakers: normalizeSpeakers(course.palestrantes || course.professores),
    palestrantes: course.palestrantes ?? [],
    convidados: course.convidados ?? [],
    payment_methods: course.forma_pagamento ?? [],
    reasons_to_attend: toArray(course.motivos_participar || course.vantagens),
    vantagens: toArray(course.vantagens),
    vantagens_ead: toArray(course.vantagens_ead),
    registration_guidelines: toArray(course.orientacoes_inscricao),
    contacts: course.contatos || undefined,
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
    custom_schema: course.custom_schema ?? [],
    custom_fields: course.custom_fields ?? {},
  };

  mapped._searchableText = generateSearchableText(mapped);
  return mapped;
}

type UseSearchOptions = {
  status?: 'published' | 'draft' | 'all';
};

export function useSearch(options: UseSearchOptions = {}) {
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
      const response = await apiGet<CoursesApiPayload>(`/api/courses?limit=500${statusQuery}`);
      return response.data?.courses?.map(mapApiCourse) ?? [];
    },
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  // --- CORREÇÃO DO LOOP INFINITO AQUI ---
  // Usamos useMemo para garantir que se remoteCourses não mudar, a referência do array é a mesma.
  // Se for null/undefined, retorna um array vazio estático (mas o useMemo já resolve a recriação).
  const courses = useMemo(() => remoteCourses ?? [], [remoteCourses]);

  const fuse = useMemo(() => new Fuse(courses, fuseOptions), [courses]);

  // BUSCA LOCAL
  const search = useCallback(
    (query: string, filters: FilterOptions): SearchResult[] => {
      let results: SearchResult[] = [];

      if (query.trim()) {
        const fuseResults = fuse.search(query);
        results = fuseResults.map(({ item, matches }) => {
          const matchedField = matches?.[0]?.key || 'tags';
          const matchReason =
            matchedField === 'title' ? `Título relacionado` : matchedField === 'tags' ? `Tag: "${matches?.[0]?.value}"` : `Relacionado a "${query}"`;
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

      return results;
    },
    [courses, fuse]
  );

  // BUSCA INTELIGENTE (IA)
  const aiSearch = useCallback(
    async (query: string, filters: FilterOptions): Promise<{
      results: SearchResult[];
      query: { original: string; expanded: string[]; intent: string; categories: string[]; };
      meta: { totalFound: number; totalSearched: number; avgScore: number; hasHighRelevance: boolean; };
      usedAI: boolean;
    }> => {
      try {
        const payload = {
          q: query,
          empresa: filters.companies[0],
          tipo: filters.course_types[0],
          segmento: filters.segments[0],
        };

        const response = await apiPost<any>('/api/courses/ai-search', payload);
        const data = response.data;

        const aiResults: SearchResult[] = data.results.map((course: any) => ({
          ...mapApiCourse(course),
          matchReason: `IA: ${course._matchedTerms?.slice(0, 3).join(', ') || 'relevante'}`,
        }));

        return {
          results: aiResults,
          query: data.query,
          meta: data.meta,
          usedAI: true,
        };
      } catch (error) {
        console.error('Erro na busca com IA, usando fallback local:', error);
        const fallbackResults = search(query, filters);
        return {
          results: fallbackResults,
          query: { original: query, expanded: [query], intent: query, categories: [] },
          meta: { totalFound: fallbackResults.length, totalSearched: courses.length, avgScore: 0, hasHighRelevance: false },
          usedAI: false,
        };
      }
    },
    [courses, search]
  );

  const getCourseById = useCallback((id: string): Course | undefined => courses.find(c => c.id === id), [courses]);

  const getRelatedCourses = useCallback((ids: string[] = []): Course[] => {
    if (!ids.length) return [];
    return courses.filter(c => ids.includes(c.id));
  }, [courses]);

  const allowedCompanies = ['JML', 'Conecta'];
  const allowedSegments = ['Estatais', 'Judiciário', 'Sistema S', 'Municípios', 'Empresas Privadas', 'Administração Pública'];

  const getUniqueCompanies = useCallback(() => 
    [...new Set(courses.map(c => c.company).filter(Boolean))].filter(c => allowedCompanies.includes(c)).sort(), 
  [courses]);

  const getUniqueCourseTypes = useCallback(() => 
    [...new Set(courses.map(c => c.course_type).filter(Boolean))].sort(), 
  [courses]);

  const getUniqueSegments = useCallback(() => 
    [...new Set(courses.map(c => c.segment).filter(Boolean))].filter(s => allowedSegments.includes(s)).sort(), 
  [courses]);

  return {
    search,
    aiSearch,
    getCourseById,
    getRelatedCourses,
    allCourses: courses,
    getUniqueCompanies,
    getUniqueCourseTypes,
    getUniqueSegments,
    isLoading,
    isFetching,
    isError,
    errorMessage: error instanceof Error ? error.message : null,
    refetch,
  };
}