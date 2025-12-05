import { useMemo, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminIcon } from '@/components/admin/AdminIcon';
import {
  BriefcaseBusiness,
  Building2,
  GraduationCap,
  MonitorPlay,
  LayoutGrid,
  BookOpenCheck,
  Share2,
  Sparkles,
  TrendingUp,
  Blend, // Novo ícone para Híbrido
} from 'lucide-react';

type LucideIcon = typeof GraduationCap;

import { SearchBar } from '@/components/SearchBar';
import { CourseCard } from '@/components/CourseCard';
import { CourseDrawer } from '@/components/CourseDrawer';
import { HistoryPopover } from '@/components/HistoryPopover';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useSearch, type Course, type FilterOptions } from '@/hooks/useSearch';
import { useSearchHistory, type HistoryEntry } from '@/hooks/useSearchHistory';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const normalizeText = (value: string) =>
  value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

const categoryColorVars = {
  primary: '--category-primary',
  secondary: '--category-secondary',
  tertiary: '--category-tertiary',
  quaternary: '--category-quaternary',
  quinary: '--category-quinary',
  senary: '--category-senary', // Nova cor para Híbrido
} as const;
type CategoryColor = keyof typeof categoryColorVars;

type CategoryConfig = {
  name: string;
  icon: LucideIcon;
  color: CategoryColor;
  match: (course: Course) => boolean;
  buildParams: () => Record<string, string>;
};

const categories: CategoryConfig[] = [
  {
    name: 'Curso aberto JML',
    icon: GraduationCap,
    color: 'primary',
    match: (course) => normalizeText(course.company) === normalizeText('JML') && normalizeText(course.course_type) === normalizeText('aberto'),
    buildParams: () => ({ empresa: 'JML', tipo: 'aberto' }),
  },
  {
    name: 'Curso aberto Conecta',
    icon: Share2,
    color: 'secondary',
    match: (course) => normalizeText(course.company) === normalizeText('Conecta') && normalizeText(course.course_type) === normalizeText('aberto'),
    buildParams: () => ({ empresa: 'Conecta', tipo: 'aberto' }),
  },
  {
    name: 'Curso InCompany JML',
    icon: BriefcaseBusiness,
    color: 'tertiary',
    match: (course) => normalizeText(course.company) === normalizeText('JML') && normalizeText(course.course_type) === normalizeText('incompany'),
    buildParams: () => ({ empresa: 'JML', tipo: 'incompany' }),
  },
  {
    name: 'Curso InCompany Conecta',
    icon: Building2,
    color: 'quaternary',
    match: (course) => normalizeText(course.company) === normalizeText('Conecta') && normalizeText(course.course_type) === normalizeText('incompany'),
    buildParams: () => ({ empresa: 'Conecta', tipo: 'incompany' }),
  },
  {
    name: 'Curso EAD JML',
    icon: MonitorPlay,
    color: 'quinary',
    match: (course) => normalizeText(course.company) === normalizeText('JML') && normalizeText(course.course_type) === normalizeText('ead'),
    buildParams: () => ({ empresa: 'JML', tipo: 'ead' }),
  },
  {
    name: 'Curso Híbrido JML',
    icon: Blend,
    color: 'senary',
    match: (course) => normalizeText(course.company) === normalizeText('JML') && normalizeText(course.course_type) === normalizeText('hibrido'),
    buildParams: () => ({ empresa: 'JML', tipo: 'hibrido' }),
  },
];

type ExploreMode = 'category' | 'course';
const exploreModeOptions: ReadonlyArray<{ id: ExploreMode; label: string; icon: LucideIcon }> = [
  { id: 'category', label: 'Categoria', icon: LayoutGrid },
  { id: 'course', label: 'Curso', icon: BookOpenCheck },
];
const explorePanelIds: Record<ExploreMode, string> = {
  category: 'explore-category-panel',
  course: 'explore-course-panel',
};

export default function Home() {
  const navigate = useNavigate();
  const { allCourses, getRelatedCourses } = useSearch();
  const { addToHistory } = useSearchHistory();

  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const [filters] = useState<FilterOptions>({
    companies: [],
    course_types: [],
    segments: [],
  });

  const handleSearch = (query: string) => {
    addToHistory(query, filters);
    navigate(`/resultados?q=${encodeURIComponent(query)}`);
  };

  const handleHistorySelect = (entry: HistoryEntry) => {
    navigate(`/resultados?q=${encodeURIComponent(entry.query)}`);
  };

  const handleCategoryClick = (category: CategoryConfig) => {
    const params = new URLSearchParams(category.buildParams());
    navigate(`/resultados?${params.toString()}`);
  };

  const mostSearched = allCourses.slice(0, 3);
  const newCourses = allCourses.slice(-3);
  const [exploreMode, setExploreMode] = useState<ExploreMode>('category');

  

  
  const sortedCourses = useMemo(
    () =>
      [...allCourses].sort((a, b) =>
        a.title.localeCompare(b.title, 'pt-BR', { sensitivity: 'base' }),
      ),
    [allCourses],
  );

  const getAccent = (color: CategoryColor, alpha = 1) =>
    alpha === 1
      ? `hsl(var(${categoryColorVars[color]}))`
      : `hsl(var(${categoryColorVars[color]}) / ${alpha})`;

  // Cursos relacionados para o drawer
  const relatedCourses = useMemo(() => {
    if (!selectedCourse) return [];
    return getRelatedCourses(selectedCourse.related_ids);
  }, [selectedCourse, getRelatedCourses]);

  
  // Estados para os filtros locais
  const [localFilters, setLocalFilters] = useState({
    search: '',
    company: '',
    courseType: '',
    segment: ''
  });

  // Lógica para extrair opções únicas (para os selects)
  const filterOptions = useMemo(() => {
    const companies = Array.from(new Set(allCourses.map(c => c.company))).filter(Boolean).sort();
    const segments = Array.from(new Set(allCourses.map(c => c.segment))).filter(Boolean).sort();
    const courseTypes = Array.from(new Set(allCourses.map(c => c.course_type))).filter(Boolean).sort();
    return { companies, segments, courseTypes };
  }, [allCourses]);

  // Lista Filtrada
  const filteredExploreCourses = useMemo(() => {
    return sortedCourses.filter(course => {
      const matchSearch = course.title.toLowerCase().includes(localFilters.search.toLowerCase());
      const matchCompany = localFilters.company ? course.company === localFilters.company : true;
      const matchSegment = localFilters.segment ? course.segment === localFilters.segment : true;
      const matchCourseType = localFilters.courseType ? course.course_type === localFilters.courseType : true;

      return matchSearch && matchCompany && matchSegment && matchCourseType;
    });
  }, [sortedCourses, localFilters]);
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#F8F9FC] dark:bg-[#050505] text-foreground selection:bg-violet-500/30">
      
     {/* Container das Bolhas */}
          <div className="absolute inset-0 w-full h-full">
            
            {/* BOLHA 1 (Topo Esquerda) */}
            <div className="absolute top-[-10%] left-[-5%] w-[40rem] h-[40rem] 
                            bg-violet-400/30 dark:bg-violet-600/20  
                            rounded-full mix-blend-multiply dark:mix-blend-screen 
                            filter blur-[100px] opacity-70 animate-blob" />
            {/* ^ MUDE O 'bg-violet-400/30' PARA OUTRA COR. Ex: 'bg-red-500/30' */}
            
            {/* BOLHA 2 (Topo Direita) */}
            <div className="absolute top-[-10%] right-[10%] w-[35rem] h-[35rem] 
                            bg-cyan-400/30 dark:bg-blue-600/20 
                            rounded-full mix-blend-multiply dark:mix-blend-screen 
                            filter blur-[100px] opacity-70 animate-blob animation-delay-2000" />
            {/* ^ MUDE O 'bg-cyan-400/30' PARA OUTRA COR. Ex: 'bg-orange-400/30' */}

            {/* BOLHA 3 (Baixo) */}
            <div className="absolute top-[20%] left-[20%] w-[45rem] h-[45rem] 
                            bg-pink-300/30 dark:bg-emerald-600/10 
                            rounded-full mix-blend-multiply dark:mix-blend-screen 
                            filter blur-[120px] opacity-60 animate-blob animation-delay-4000" />
            {/* ^ MUDE O 'bg-pink-300/30' PARA OUTRA COR. Ex: 'bg-yellow-300/30' */}
                            
             {/* Fundo Base (Opcional, cor bem fraquinha que preenche tudo) */}
             <div className="absolute bottom-[-20%] right-[-10%] w-[60rem] h-[60rem] 
                            bg-blue-100/40 dark:bg-indigo-900/10 
                            rounded-full mix-blend-multiply dark:mix-blend-screen 
                            filter blur-[150px] opacity-50" />
          </div>
      <div className="main-content relative z-10 flex min-h-screen flex-col">
        
        {/* === HEADER (EXATAMENTE O SEU CÓDIGO ORIGINAL) === */}
        <header className="header-fixed">
          <div className="container flex items-center justify-between gap-4 px-4 py-4">
            <div className="flex items-center gap-3">
              <AdminIcon /> 
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground">Plataforma JML</p>
                <h1 className="text-xl font-semibold sm:text-2xl">Centro de Cursos</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <HistoryPopover onSelectHistory={handleHistorySelect} />
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="container relative z-10 flex-1 space-y-16 px-4 py-12 lg:space-y-20 lg:py-20">
          
          {/* === NOVA HERO SECTION (DESIGN "WOW" + SEARCHBAR) === */}
          <section className="relative flex flex-col items-center gap-8 text-center pt-8 pb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="space-y-4 max-w-4xl mx-auto">
                {/* Badge Clean */}
                <span className="inline-flex items-center gap-2 rounded-full border border-violet-200/50 bg-white/60 dark:bg-white/5 dark:border-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-300 backdrop-blur-md shadow-sm">
                  <Sparkles className="h-3 w-3" />
                  Descubra o próximo passo
                </span>
                
                {/* Título com Gradiente JML */}
                <h2 className="text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl text-slate-900 dark:text-white">
                  Encontre a Solução <br className="hidden sm:block" />
                  <span className="bg-gradient-to-r from-violet-600 via-blue-600 to-emerald-500 bg-clip-text text-transparent">
                    perfeita.
                  </span>
                </h2>
                
                <p className="mx-auto max-w-2xl text-lg text-slate-600 dark:text-slate-300">
                  Digite a necessidade do cliente e navegue por recomendações preparadas para acelerar suas vendas.
                </p>
              </div>

              {/* Barra de Pesquisa */}
              <div className="w-full mt-4 max-w-3xl">
                <SearchBar onSearch={handleSearch} />
              </div>
          </section>

          {/* === RESTANTE DO CÓDIGO (EXATAMENTE O SEU ORIGINAL) === */}
          
          {/* Seção de exploração */}
          <section className="space-y-10">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="space-y-3">
                <span className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">Explorar</span>
                <h3 className="text-3xl font-semibold leading-tight">Personalize a jornada de descoberta</h3>
                <p className="max-w-2xl text-sm text-muted-foreground">
                  Navegue pelos cursos JML e Conecta organizados por tipo e segmento.
                </p>
              </div>
              <div className="inline-flex gap-2 rounded-full border border-border/60 bg-background/80 p-1 shadow-sm backdrop-blur">
                {exploreModeOptions.map(({ id, label, icon: Icon }) => {
                  const isActive = exploreMode === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setExploreMode(id as ExploreMode)}
                      className={`group flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-[0_12px_30px_-18px_rgba(80,56,237,0.55)]'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                      aria-pressed={isActive}
                      aria-controls={explorePanelIds[id as ExploreMode]}
                      aria-label={`Explorar por ${label}`}
                    >
                      <Icon className={`h-4 w-4 transition-transform ${isActive ? 'scale-110' : ''}`} />
                      {`Explorar por ${label}`}
                    </button>
                  );
                })}
              </div>
            </div>

            {exploreMode === 'category' ? (
              <div
                id={explorePanelIds.category}
                className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3"
                role="region"
                aria-label="Explorar por categoria"
              >
                {categories.map((category) => {
                  const Icon = category.icon;
                  const coursesInCategory = allCourses.filter(category.match);
                  const accent = getAccent(category.color);
                  const accentSoft = getAccent(category.color, 0.16);
                  const accentSoftHover = getAccent(category.color, 0.26);
                  const accentOverlay = `radial-gradient(circle at top, ${getAccent(category.color, 0.28)}, transparent 70%)`;
                  const accentShadow = `0 30px 70px -58px ${getAccent(category.color, 0.65)}`;

                  return (
                    <Card
                      key={category.name}
                      onClick={() => handleCategoryClick(category)}
                      role="button"
                      className="category-card group relative flex h-full cursor-pointer flex-col gap-6 overflow-hidden rounded-3xl border border-border/70 bg-white dark:bg-card p-8 transition-all duration-300 ease-out hover:-translate-y-2 hover:border-transparent hover:shadow-xl"
                      style={{
                        boxShadow: accentShadow,
                        backgroundImage: `linear-gradient(140deg, ${getAccent(category.color, 0.12)}, transparent 70%)`,
                        '--accent-overlay-color': accentOverlay,
                        '--accent-shadow-color': getAccent(category.color, 0.15),
                      } as CSSProperties}
                    >
                      <div
                        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                        style={{ background: accentOverlay }}
                        aria-hidden
                      />
                      <div className="relative z-10 space-y-5">
                        <div
                          className="category-icon flex h-16 w-16 items-center justify-center rounded-2xl border border-transparent shadow-lg transition-all duration-300 ease-out group-hover:scale-110"
                          style={{
                            background: `linear-gradient(135deg, ${accentSoft}, ${accentSoftHover})`,
                            color: accent,
                          }}
                        >
                          <Icon className="h-8 w-8" />
                        </div>
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h4 className="text-xl font-semibold">{category.name}</h4>
                            <p className="mt-2 text-sm text-muted-foreground">
                              {category.name.includes('Híbrido') 
                                ? 'Formato exclusivo JML combinando presencial e EAD para máxima flexibilidade.'
                                : 'Cursos especializados por empresa e modalidade para atender diferentes perfis de cliente.'
                              }
                            </p>
                          </div>
                          <span className="rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 shadow-sm whitespace-nowrap">
                            {coursesInCategory.length} cursos
                          </span>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div
                id={explorePanelIds.course}
                className="space-y-6"
                role="region"
                aria-label="Explorar por curso"
              >
                {/* Barra de Filtros Modernizada */}
<div className="sticky top-20 z-30 mb-6 rounded-2xl border border-border/40 bg-gradient-to-r from-white/95 to-white/90 dark:from-slate-900/95 dark:to-slate-800/95 p-4 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] backdrop-blur-xl transition-all">
  <div className="flex flex-col md:flex-row gap-3">

    {/* Campo de Busca Rápida */}
    <div className="relative flex-1 group">
      <input
        type="text"
        placeholder="Buscar curso por nome..."
        value={localFilters.search}
        onChange={(e) => setLocalFilters(prev => ({...prev, search: e.target.value}))}
        className="h-11 w-full rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 px-4 pl-10 text-sm shadow-sm outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-violet-500 dark:focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
      />
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-violet-500 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
      </div>
    </div>

    {/* Separador visual (apenas desktop) */}
    <div className="hidden md:block w-px bg-gradient-to-b from-transparent via-border/60 to-transparent my-1"></div>

    {/* Selects Customizados */}
    <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
      <Select value={localFilters.company || undefined} onValueChange={(value) => setLocalFilters(prev => ({...prev, company: value}))}>
        <SelectTrigger className="min-w-[140px]">
          <SelectValue placeholder="Todas Empresas" />
        </SelectTrigger>
        <SelectContent>
          {filterOptions.companies.map(c => (
            <SelectItem key={c} value={c}>{c}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={localFilters.courseType || undefined} onValueChange={(value) => setLocalFilters(prev => ({...prev, courseType: value}))}>
        <SelectTrigger className="min-w-[160px]">
          <SelectValue placeholder="Todos Tipos" />
        </SelectTrigger>
        <SelectContent>
          {filterOptions.courseTypes.map(t => (
            <SelectItem key={t} value={t}>{t}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={localFilters.segment || undefined} onValueChange={(value) => setLocalFilters(prev => ({...prev, segment: value}))}>
        <SelectTrigger className="min-w-[150px]">
          <SelectValue placeholder="Todos Segmentos" />
        </SelectTrigger>
        <SelectContent>
          {filterOptions.segments.map(s => (
            <SelectItem key={s} value={s}>{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {(localFilters.search || localFilters.company || localFilters.courseType || localFilters.segment) && (
         <button
           onClick={() => setLocalFilters({ search: '', company: '', courseType: '', segment: '' })}
           className="h-11 px-4 rounded-xl text-sm font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 border border-red-200/60 dark:border-red-800/60 shadow-sm transition-all whitespace-nowrap"
         >
           Limpar
         </button>
      )}
    </div>
  </div>
</div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {filteredExploreCourses.map((course) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      onClick={() => setSelectedCourse(course)}
                    />
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Seção de cursos em destaque */}
          <section className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-6 rounded-[28px] border border-border/60 bg-card/80 p-8 shadow-[0_30px_95px_-82px_rgba(15,23,42,0.55)] transition-colors dark:bg-card/60">
              <h3 className="flex items-center gap-2 text-2xl font-semibold">
                <TrendingUp className="h-6 w-6 text-primary" />
                Mais buscados
              </h3>
              <p className="text-sm text-muted-foreground">
                Os cursos que mais aparecem nas pesquisas recentes da equipe comercial.
              </p>  
              <div className="grid grid-cols-1 gap-4">
                {mostSearched.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    onClick={() => setSelectedCourse(course)}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-6 rounded-[28px] border border-border/60 bg-card/80 p-8 shadow-[0_30px_95px_-82px_rgba(15,23,42,0.55)] transition-colors dark:bg-card/60">
              <h3 className="flex items-center gap-2 text-2xl font-semibold">
                <Sparkles className="h-6 w-6 text-secondary" />
                Novos cursos
              </h3>
              <p className="text-sm text-muted-foreground">
                Destaques recém-chegados.
              </p>
              <div className="grid grid-cols-1 gap-4">
                {newCourses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    onClick={() => setSelectedCourse(course)}
                  />
                ))}
              </div>
            </div>
          </section>
        </main>

        <footer className="border-t border-border/60 bg-background/70 py-8 backdrop-blur-sm">
          <div className="container px-4 text-center text-sm text-muted-foreground">
            <p>© 2026 JML Cursos. Todos os direitos reservados.</p>
          </div>
        </footer>
      </div>

      {/* Course Drawer */}
      <CourseDrawer
        course={selectedCourse}
        open={!!selectedCourse}
        onClose={() => setSelectedCourse(null)}
        relatedCourses={relatedCourses}
        onCourseClick={setSelectedCourse}
      />
    </div>
  );
}