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
} from 'lucide-react';

type LucideIcon = typeof GraduationCap;

import { SearchBar } from '@/components/SearchBar';
import { CourseCard } from '@/components/CourseCard';
import { HistoryPopover } from '@/components/HistoryPopover';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useSearch, type Course, type FilterOptions } from '@/hooks/useSearch';
import { useSearchHistory, type HistoryEntry } from '@/hooks/useSearchHistory';
import { Card } from '@/components/ui/card';

const normalizeText = (value: string) =>
  value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

const categoryColorVars = {
  primary: '--category-primary',
  secondary: '--category-secondary',
  tertiary: '--category-tertiary',
  quaternary: '--category-quaternary',
  quinary: '--category-quinary',
  senary: '--category-senary',
  septenary: '--category-septenary',
  octonary: '--category-octonary',
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
    name: 'EAD',
    icon: MonitorPlay,
    color: 'primary',
    match: (course) => course.modality.some((m) => normalizeText(m) === 'ead'),
    buildParams: () => ({ modalidade: 'EAD' }),
  },
  {
    name: 'Presencial',
    icon: Users,
    color: 'secondary',
    match: (course) => course.modality.some((m) => normalizeText(m) === 'presencial'),
    buildParams: () => ({ modalidade: 'Presencial' }),
  },
  {
    name: 'Conecta',
    icon: Share2,
    color: 'tertiary',
    match: (course) => course.modality.some((m) => normalizeText(m) === 'conecta'),
    buildParams: () => ({ modalidade: 'Conecta' }),
  },
  {
    name: 'In Company',
    icon: BriefcaseBusiness,
    color: 'quaternary',
    match: (course) => course.modality.some((m) => normalizeText(m) === 'in company'),
    buildParams: () => ({ modalidade: 'In Company' }),
  },
  {
    name: 'Sistema S',
    icon: Building2,
    color: 'quinary',
    match: (course) => course.tags.some((t) => normalizeText(t) === normalizeText('Sistema S')),
    buildParams: () => ({ segmento: 'Sistema S' }),
  },
  {
    name: 'Estatais',
    icon: Landmark,
    color: 'senary',
    match: (course) => course.tags.some((t) => normalizeText(t) === normalizeText('Estatais')),
    buildParams: () => ({ segmento: 'Estatais' }),
  },
  {
    name: 'Judiciário',
    icon: Gavel,
    color: 'octonary',
    match: (course) =>
      course.tags.some((t) => normalizeText(t).includes('judici')) ||
      (!!(course as any).target_audience &&
        normalizeText((course as any).target_audience).includes('jurid')),
    buildParams: () => ({ segmento: 'Judiciário' }),
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

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(80,56,237,0.12),_transparent_55%)] dark:bg-[radial-gradient(circle_at_top,_rgba(80,56,237,0.22),_transparent_60%)]" />
      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
          <div className="container flex items-center justify-between gap-4 px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-aurora shadow-sm">
                <GraduationCap className="h-7 w-7 text-white" />
              </div>
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
          <section className="relative overflow-hidden rounded-[32px] border border-border/60 bg-card/80 px-6 py-12 shadow-[0_32px_120px_-70px_rgba(15,23,42,0.6)] transition-colors dark:bg-card/60">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(80,56,237,0.18),_transparent_65%)] dark:bg-[radial-gradient(circle_at_top,_rgba(80,56,237,0.28),_transparent_70%)]" />
            <div className="relative mx-auto flex max-w-4xl flex-col items-center gap-8 text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-4 py-1 text-xs font-medium uppercase tracking-[0.22em] text-primary">
                <Sparkles className="h-4 w-4" />
                Descubra o próximo passo
              </span>
              <div className="space-y-4">
                <h2 className="bg-gradient-aurora bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-5xl">
                  Encontre o curso ideal para cada oportunidade
                </h2>
                <p className="mx-auto max-w-2xl text-base text-muted-foreground sm:text-lg">
                  Digite a necessidade do cliente e navegue por recomendações preparadas para acelerar suas vendas consultivas.
                </p>
              </div>
              <div className="w-full max-w-2xl">
                <SearchBar onSearch={handleSearch} />
              </div>
            </div>
          </section>

          <section className="space-y-10">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="space-y-3">
                <span className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">Explorar</span>
                <h3 className="text-3xl font-semibold leading-tight">Personalize a jornada de descoberta</h3>
                <p className="max-w-2xl text-sm text-muted-foreground">
                  Navegue por segmentos estratégicos ou visualize todos os cursos disponíveis para responder rapidamente ao cliente.
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
                          ? 'bg-gradient-aurora text-white shadow-[0_12px_30px_-18px_rgba(80,56,237,0.55)]'
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
                className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
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
                  const cardStyle: CSSProperties = {
                    boxShadow: accentShadow,
                    background: `linear-gradient(140deg, ${getAccent(category.color, 0.12)}, transparent 70%)`,
                  };

                  return (
                    <Card
                      key={category.name}
                      onClick={() => handleCategoryClick(category)}
                      role="button"
                      style={cardStyle}
                      className="group relative flex h-full cursor-pointer flex-col gap-6 overflow-hidden rounded-3xl border border-border/70 bg-card/80 p-8 transition-all duration-200 hover:-translate-y-1 hover:border-transparent dark:bg-card/60"
                    >
                      <div
                        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                        style={{ background: accentOverlay }}
                        aria-hidden
                      />
                      <div className="relative z-10 space-y-5">
                        <div
                          className="flex h-14 w-14 items-center justify-center rounded-2xl border border-transparent shadow-sm transition-transform duration-200 group-hover:scale-110"
                          style={{
                            background: `linear-gradient(135deg, ${accentSoft}, ${accentSoftHover})`,
                            color: accent,
                          }}
                        >
                          <Icon className="h-7 w-7" />
                        </div>
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h4 className="text-xl font-semibold">{category.name}</h4>
                            <p className="mt-2 text-sm text-muted-foreground">
                              Explore conteúdos selecionados e encontre rapidamente o que melhor atende o cliente.
                            </p>
                          </div>
                          <span className="rounded-full bg-background/90 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
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
                <div className="flex flex-col gap-3 rounded-3xl border border-border/60 bg-background/80 p-6 shadow-inner backdrop-blur">
                  <h4 className="text-lg font-semibold text-foreground">Todos os cursos</h4>
                  <p className="text-sm text-muted-foreground">
                    Visualize rapidamente as opções completas e clique para abrir a página de resultados já filtrada.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
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
          </section>

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
                    onClick={() => navigate(`/resultados?q=${encodeURIComponent(course.title)}`)}
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
                Destaques recém-chegados para manter o portfólio sempre atualizado.
              </p>
              <div className="grid grid-cols-1 gap-4">
                {newCourses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    onClick={() => navigate(`/resultados?q=${encodeURIComponent(course.title)}`)}
                  />
                ))}
              </div>
            </div>
          </section>
        </main>

        <footer className="border-t border-border/60 bg-background/70 py-8 backdrop-blur-sm">
          <div className="container px-4 text-center text-sm text-muted-foreground">
            <p>© 2024 JML Cursos. Todos os direitos reservados.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
