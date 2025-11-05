import { useMemo, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BriefcaseBusiness,
  Building2,
  Gavel,
  GraduationCap,
  Landmark,
  MonitorPlay,
  LayoutGrid,
  BookOpenCheck,
  Share2,
  Sparkles,
  TrendingUp,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { SearchBar } from '@/components/SearchBar';
import { CourseCard } from '@/components/CourseCard';
import { HistoryPopover } from '@/components/HistoryPopover';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useSearch, Course, FilterOptions } from '@/hooks/useSearch';
import { useSearchHistory, type HistoryEntry } from '@/hooks/useSearchHistory';
import { Card } from '@/components/ui/card';

type CategoryColor =
  | 'category-ead'
  | 'category-presencial'
  | 'category-conecta'
  | 'category-incompany'
  | 'category-sistema'
  | 'category-estatais'
  | 'category-judiciario';

const categoryColorVars: Record<CategoryColor, string> = {
  'category-ead': '--cat-ead',
  'category-presencial': '--cat-presencial',
  'category-conecta': '--cat-conecta',
  'category-incompany': '--cat-incompany',
  'category-sistema': '--cat-sistema',
  'category-estatais': '--cat-estatais',
  'category-judiciario': '--cat-judiciario',
};

type CategoryConfig = {
  name: string;
  icon: LucideIcon;
  color: CategoryColor;
  match: (course: Course) => boolean;
  buildParams: () => Record<string, string>;
};

const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

const categories: CategoryConfig[] = [
  {
    name: 'EAD',
    icon: MonitorPlay,
    color: 'category-ead',
    match: course => course.modality.some(mod => normalizeText(mod) === 'ead'),
    buildParams: () => ({ modalidade: 'EAD' }),
  },
  {
    name: 'Presencial',
    icon: Users,
    color: 'category-presencial',
    match: course => course.modality.some(mod => normalizeText(mod) === 'presencial'),
    buildParams: () => ({ modalidade: 'Presencial' }),
  },
  {
    name: 'Conecta',
    icon: Share2,
    color: 'category-conecta',
    match: course => course.modality.some(mod => normalizeText(mod) === 'conecta'),
    buildParams: () => ({ modalidade: 'Conecta' }),
  },
  {
    name: 'In Company',
    icon: BriefcaseBusiness,
    color: 'category-incompany',
    match: course => course.modality.some(mod => normalizeText(mod) === 'in company'),
    buildParams: () => ({ modalidade: 'In Company' }),
  },
  {
    name: 'Sistema S',
    icon: Building2,
    color: 'category-sistema',
    match: course => course.tags.some(tag => normalizeText(tag) === normalizeText('Sistema S')),
    buildParams: () => ({ segmento: 'Sistema S' }),
  },
  {
    name: 'Estatais',
    icon: Landmark,
    color: 'category-estatais',
    match: course => course.tags.some(tag => normalizeText(tag) === normalizeText('Estatais')),
    buildParams: () => ({ segmento: 'Estatais' }),
  },
  {
    name: 'Judiciário',
    icon: Gavel,
    color: 'category-judiciario',
    match: course =>
      course.tags.some(tag => normalizeText(tag).includes('judici')) ||
      normalizeText(course.target_audience).includes('jurid'),
    buildParams: () => ({ segmento: 'Judiciário' }),
  },
];

type ExploreMode = 'category' | 'course';

const exploreModeOptions: ReadonlyArray<{
  id: ExploreMode;
  label: string;
  icon: LucideIcon;
}> = [
  { id: 'category', label: 'Categoria', icon: LayoutGrid },
  { id: 'course', label: 'Curso', icon: BookOpenCheck },
];

const explorePanelIds: Record<ExploreMode, string> = {
  category: 'explore-category-panel',
  course: 'explore-course-panel',
};

export default function Home() {
  const navigate = useNavigate();
  const { allCourses } = useSearch();
  const { addToHistory } = useSearchHistory();
  const [filters] = useState<FilterOptions>({
    modalities: [],
    areas: [],
    levels: [],
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
    const params = new URLSearchParams();
    const queryParams = category.buildParams();
    Object.entries(queryParams).forEach(([key, value]) => {
      params.set(key, value);
    });
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

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(155deg,#f7f8fe_0%,#eef2ff_48%,#f9fafc_100%)] dark:bg-[linear-gradient(155deg,#050813_0%,#0a1221_50%,#101c31_100%)]">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          className="absolute left-1/2 top-[-18%] h-[440px] w-[640px] -translate-x-1/2 rounded-full opacity-70 blur-[120px] dark:opacity-60"
          style={{
            background:
              'radial-gradient(circle at center, rgba(80, 56, 237, 0.25), transparent 65%)',
          }}
        />
        <div
          className="absolute left-[12%] top-[32%] h-[360px] w-[360px] rounded-full opacity-60 blur-[100px] dark:opacity-50"
          style={{
            background:
              'radial-gradient(circle at center, rgba(56, 189, 248, 0.18), transparent 70%)',
          }}
        />
      </div>
      <div className="container relative z-10 mx-auto px-4 py-12">
        <div className="relative mb-16 overflow-hidden rounded-[2.5rem] border border-border/40 bg-white/80 px-6 py-10 shadow-[0_28px_90px_-60px_rgba(15,23,42,0.25)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:shadow-[0_28px_90px_-55px_rgba(80,56,237,0.55)]">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              background:
                'radial-gradient(circle at top left, rgba(80, 56, 237, 0.18), transparent 60%), radial-gradient(circle at bottom right, rgba(56, 189, 248, 0.14), transparent 65%)',
            }}
          />
          {/* Header */}
          <header className="relative z-10 mb-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-aurora flex items-center justify-center">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">JML Cursos</h1>
                <p className="text-sm text-muted-foreground">Apoio à Venda Inteligente</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <HistoryPopover onSelectHistory={handleHistorySelect} />
              <ThemeToggle />
            </div>
          </header>

          {/* Hero Search */}
          <section className="relative z-10 mt-10">
            <div className="mb-8 flex flex-col items-center gap-6 text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/50 px-4 py-1 text-xs font-medium uppercase tracking-[0.2em] text-primary shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/10 dark:text-white">
                <Sparkles className="h-4 w-4" />
                Descubra o próximo passo
              </div>
              <div>
                <h2 className="bg-gradient-aurora bg-clip-text text-4xl font-bold text-transparent lg:text-5xl">
                  Encontre o curso perfeito
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                  Digite o que o cliente perguntou e descubra os cursos mais relevantes para sua necessidade
                </p>
              </div>
            </div>
            <div className="flex justify-center">
              <SearchBar onSearch={handleSearch} />
            </div>
          </section>
        </div>

        {/* Explore */}
        <section className="mb-16">
          <div className="relative overflow-hidden rounded-3xl border border-border/40 bg-white/80 p-8 shadow-[0_32px_110px_-85px_rgba(15,23,42,0.38)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:shadow-[0_32px_110px_-78px_rgba(37,99,235,0.55)]">
            <div
              className="absolute inset-x-0 top-0 pointer-events-none h-1/2 opacity-50"
              style={{
                background:
                  'radial-gradient(circle at top, rgba(80, 56, 237, 0.18), transparent 70%)',
              }}
            />
            <div className="relative z-10 flex flex-col gap-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-medium text-primary/80 dark:text-primary/70">Explorar</p>
                  <h3 className="text-2xl font-semibold text-foreground">Personalize a jornada de descoberta</h3>
                  <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                    Navegue pelas modalidades ou visualize todos os cursos disponíveis. Escolha a melhor forma de apresentar o portfólio ao cliente.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-white/80 p-1 shadow-sm backdrop-blur dark:bg-white/10">
                  {exploreModeOptions.map(({ id, label, icon: Icon }) => {
                    const isActive = exploreMode === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setExploreMode(id as ExploreMode)}
                        className={`group flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                          isActive
                            ? 'bg-gradient-aurora text-white shadow-[0_10px_28px_-18px_rgba(80,56,237,0.55)]'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                        aria-pressed={isActive}
                        aria-controls={explorePanelIds[id as ExploreMode]}
                        aria-label={`Explorar por ${label}`}
                      >
                        <Icon className={`h-4 w-4 transition-transform ${isActive ? 'scale-110' : 'scale-100'}`} />
                        {`Explorar por ${label}`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {exploreMode === 'category' ? (
                <div
                  id={explorePanelIds.category}
                  className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
                  role="region"
                  aria-label="Explorar por categoria"
                >
                  {categories.map(cat => {
                    const Icon = cat.icon;
                    const coursesInCategory = allCourses.filter(cat.match);
                    const colorVar = categoryColorVars[cat.color];
                    const accent = `hsl(var(${colorVar}))`;
                    const accentSoft = `hsl(var(${colorVar}) / 0.12)`;
                    const accentSoftHover = `hsl(var(${colorVar}) / 0.2)`;
                    const accentOverlay = `linear-gradient(160deg, hsl(var(${colorVar}) / 0.22), transparent 70%)`;
                    const accentShadow = `0 22px 55px -36px hsl(var(${colorVar}) / 0.45)`;
                    const badgeStyle: CSSProperties = {
                      background: `linear-gradient(135deg, ${accentSoft}, ${accentSoftHover})`,
                      color: accent,
                      boxShadow: `0 12px 30px -18px ${accent}`,
                    };

                    return (
                      <Card
                        key={cat.name}
                        onClick={() => handleCategoryClick(cat)}
                        style={{
                          boxShadow: accentShadow,
                          background: `linear-gradient(135deg, ${accentSoft}, transparent 65%)`,
                        }}
                        className="group relative cursor-pointer overflow-hidden rounded-3xl border border-border/50 bg-white/75 p-8 shadow-[0_22px_55px_-34px_rgba(15,23,42,0.18)] transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_30px_65px_-36px_rgba(15,23,42,0.28)] backdrop-blur dark:bg-white/10"
                      >
                        <div
                          className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-90"
                          style={{ background: accentOverlay }}
                        />
                        <div className="relative z-10">
                          <div
                            className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-[0_18px_35px_-22px_rgba(15,23,42,0.45)] transition-transform duration-300 group-hover:scale-110"
                            style={badgeStyle}
                          >
                            <Icon className="h-7 w-7" />
                          </div>
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-xl font-semibold">{cat.name}</h4>
                            <span className="rounded-full bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
                              {coursesInCategory.length} cursos
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">
                            Explore conteúdos selecionados e entenda rapidamente como apresentar essa modalidade ao cliente.
                          </p>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div id={explorePanelIds.course} className="space-y-6" role="region" aria-label="Explorar por curso">
                  <div className="flex flex-col gap-3 rounded-2xl border border-border/50 bg-white/70 p-5 shadow-inner backdrop-blur dark:bg-white/10">
                    <h4 className="text-lg font-semibold text-foreground">Todos os cursos</h4>
                    <p className="text-sm text-muted-foreground">
                      Visualize rapidamente as opções completas e clique para abrir a página de resultados já filtrada para o curso escolhido.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {sortedCourses.map(course => (
                      <CourseCard
                        key={course.id}
                        course={course}
                        onClick={() => navigate(`/resultados?q=${encodeURIComponent(course.title)}`)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Most Searched */}
        <section className="mb-16">
          <div className="relative overflow-hidden rounded-3xl border border-border/40 bg-white/80 p-8 shadow-[0_30px_95px_-80px_rgba(15,23,42,0.42)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:shadow-[0_30px_95px_-72px_rgba(37,99,235,0.5)]">
            <div className="relative z-10">
              <h3 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-primary" />
                Mais Buscados
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mostSearched.map(course => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    onClick={() => navigate(`/resultados?q=${encodeURIComponent(course.title)}`)}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* New Courses */}
        <section>
          <div className="relative overflow-hidden rounded-3xl border border-border/40 bg-white/80 p-8 shadow-[0_30px_95px_-80px_rgba(15,23,42,0.42)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:shadow-[0_30px_95px_-72px_rgba(80,56,237,0.5)]">
            <div className="relative z-10">
              <h3 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-secondary" />
                Novos Cursos
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {newCourses.map(course => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    onClick={() => navigate(`/resultados?q=${encodeURIComponent(course.title)}`)}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
