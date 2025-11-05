import { useMemo, useState } from 'react';
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
} from 'lucide-react';

type LucideIcon = typeof GraduationCap;
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
    match: (course) => course.modality.some((mod) => normalizeText(mod) === 'ead'),
    buildParams: () => ({ modalidade: 'EAD' }),
  },
  {
    name: 'Presencial',
    icon: Users,
    color: 'category-presencial',
    match: (course) => course.modality.some((mod) => normalizeText(mod) === 'presencial'),
    buildParams: () => ({ modalidade: 'Presencial' }),
  },
  {
    name: 'Conecta',
    icon: Share2,
    color: 'category-conecta',
    match: (course) => course.modality.some((mod) => normalizeText(mod) === 'conecta'),
    buildParams: () => ({ modalidade: 'Conecta' }),
  },
  {
    name: 'In Company',
    icon: BriefcaseBusiness,
    color: 'category-incompany',
    match: (course) => course.modality.some((mod) => normalizeText(mod) === 'in company'),
    buildParams: () => ({ modalidade: 'In Company' }),
  },
  {
    name: 'Sistema S',
    icon: Building2,
    color: 'category-sistema',
    match: (course) => course.tags.some((tag) => normalizeText(tag) === normalizeText('Sistema S')),
    buildParams: () => ({ segmento: 'Sistema S' }),
  },
  {
    name: 'Estatais',
    icon: Landmark,
    color: 'category-estatais',
    match: (course) => course.tags.some((tag) => normalizeText(tag) === normalizeText('Estatais')),
    buildParams: () => ({ segmento: 'Estatais' }),
  },
  {
    name: 'Judiciário',
    icon: Gavel,
    color: 'category-judiciario',
    match: (course) =>
      course.tags.some((tag) => normalizeText(tag).includes('judici')) ||
      (!!course.target_audience && normalizeText(course.target_audience).includes('jurid')),
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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-background via-primary/[0.03] to-background">
      {/* Blobs sutis de fundo */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-24 h-[400px] w-[400px] rounded-full blur-3xl opacity-30 dark:opacity-20"
        style={{
          background: 'radial-gradient(circle at center, rgba(99, 102, 241, 0.4), transparent 70%)',
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute top-1/3 -right-20 h-[450px] w-[450px] rounded-full blur-3xl opacity-25 dark:opacity-15"
        style={{
          background: 'radial-gradient(circle at center, rgba(56, 189, 248, 0.35), transparent 70%)',
        }}
      />

      {/* Header fixo e clean */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">JML Cursos</h1>
                <p className="text-xs text-muted-foreground">Apoio à Venda Inteligente</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <HistoryPopover onSelectHistory={handleHistorySelect} />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <div className="container relative z-10 mx-auto px-4">
        {/* Hero Section - Com glassmorphism sutil */}
        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-3xl">
            <div className="rounded-3xl border border-white/10 bg-white/40 p-10 shadow-xl backdrop-blur-md dark:border-white/5 dark:bg-white/5">
              <div className="text-center">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary backdrop-blur-sm">
                  <Sparkles className="h-3.5 w-3.5" />
                  Busca Inteligente
                </div>
                <h2 className="mb-4 bg-gradient-to-br from-primary via-primary to-blue-600 bg-clip-text text-4xl font-bold tracking-tight text-transparent md:text-5xl lg:text-6xl">
                  Encontre o curso perfeito
                </h2>
                <p className="mb-10 text-lg text-muted-foreground md:text-xl">
                  Digite o que o cliente perguntou e descubra os cursos mais relevantes
                </p>
                <SearchBar onSearch={handleSearch} />
              </div>
            </div>
          </div>
        </section>

        {/* Explore Section */}
        <section className="py-12">
          <div className="relative overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-br from-primary/5 via-background/80 to-blue-500/5 p-8 shadow-lg backdrop-blur-sm">
            <div className="absolute inset-0 pointer-events-none opacity-40 [background:radial-gradient(circle_at_top_left,hsl(var(--primary)/0.15),transparent_60%)]" />
            
            <div className="relative z-10">
              <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="mb-1 text-sm font-medium text-primary">Explorar</p>
                  <h3 className="text-2xl font-semibold text-foreground">Navegue pelo catálogo</h3>
                </div>
                <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-background/60 p-1 backdrop-blur-sm">
                  {exploreModeOptions.map(({ id, label, icon: Icon }) => {
                    const isActive = exploreMode === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setExploreMode(id as ExploreMode)}
                        className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${
                          isActive
                            ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground shadow-md'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                        aria-pressed={isActive}
                        aria-controls={explorePanelIds[id as ExploreMode]}
                      >
                        <Icon className="h-4 w-4" />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {exploreMode === 'category' ? (
                <div
                  id={explorePanelIds.category}
                  className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
                  role="region"
                  aria-label="Explorar por categoria"
                >
                  {categories.map((cat) => {
                    const Icon = cat.icon;
                    const coursesInCategory = allCourses.filter(cat.match);
                    const colorVar = categoryColorVars[cat.color];
                    const accentOverlay = `radial-gradient(circle at top, hsl(var(${colorVar}) / 0.15), transparent 70%)`;

                    return (
                      <Card
                        key={cat.name}
                        onClick={() => handleCategoryClick(cat)}
                        className="group relative cursor-pointer overflow-hidden border border-border/50 bg-card/80 p-6 backdrop-blur-sm transition-all duration-300 hover:border-border hover:shadow-lg"
                      >
                        <div
                          className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                          style={{ background: accentOverlay }}
                        />
                        <div className="relative">
                          <div
                            className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg text-white transition-transform duration-300 group-hover:scale-110"
                            style={{
                              background: `linear-gradient(135deg, hsl(var(${colorVar})), hsl(var(${colorVar}) / 0.8))`,
                            }}
                          >
                            <Icon className="h-6 w-6" />
                          </div>
                          <h4 className="mb-1 text-lg font-semibold">{cat.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {coursesInCategory.length} cursos disponíveis
                          </p>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div id={explorePanelIds.course} role="region" aria-label="Explorar por curso">
                  <div className="mb-6 rounded-lg border border-border/50 bg-muted/50 p-4 backdrop-blur-sm">
                    <h4 className="mb-1 font-semibold">Todos os cursos</h4>
                    <p className="text-sm text-muted-foreground">
                      Clique em um curso para ver detalhes e opções de matrícula
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {sortedCourses.map((course) => (
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
        <section className="py-12">
          <div className="relative overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-br from-background/80 via-blue-500/5 to-background/80 p-8 backdrop-blur-sm">
            <div className="absolute inset-0 pointer-events-none opacity-30 [background:radial-gradient(circle_at_top_right,hsl(var(--primary)/0.2),transparent_60%)]" />
            <div className="relative z-10">
              <div className="mb-6 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h3 className="text-2xl font-semibold">Mais Buscados</h3>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {mostSearched.map((course) => (
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
        <section className="pb-16 pt-12">
          <div className="relative overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-br from-primary/5 via-background/80 to-background/80 p-8 backdrop-blur-sm">
            <div className="absolute inset-0 pointer-events-none opacity-30 [background:radial-gradient(circle_at_bottom_left,hsl(var(--primary)/0.2),transparent_60%)]" />
            <div className="relative z-10">
              <div className="mb-6 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="text-2xl font-semibold">Novos Cursos</h3>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {newCourses.map((course) => (
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

      {/* Footer simples */}
      <footer className="relative z-10 border-t border-border/40 bg-background/60 py-8 backdrop-blur-sm">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 JML Cursos. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
