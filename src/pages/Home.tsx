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
  ead: '--cat-ead',
  presencial: '--cat-presencial',
  conecta: '--cat-conecta',
  incompany: '--cat-incompany',
  sistema: '--cat-sistema',
  estatais: '--cat-estatais',
  educacao: '--cat-soft',
  judiciario: '--cat-judiciario',
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
    color: 'ead',
    match: (course) => course.modality.some((m) => normalizeText(m) === 'ead'),
    buildParams: () => ({ modalidade: 'EAD' }),
  },
  {
    name: 'Presencial',
    icon: Users,
    color: 'presencial',
    match: (course) => course.modality.some((m) => normalizeText(m) === 'presencial'),
    buildParams: () => ({ modalidade: 'Presencial' }),
  },
  {
    name: 'Conecta',
    icon: Share2,
    color: 'conecta',
    match: (course) => course.modality.some((m) => normalizeText(m) === 'conecta'),
    buildParams: () => ({ modalidade: 'Conecta' }),
  },
  {
    name: 'In Company',
    icon: BriefcaseBusiness,
    color: 'incompany',
    match: (course) => course.modality.some((m) => normalizeText(m) === 'in company'),
    buildParams: () => ({ modalidade: 'In Company' }),
  },
  {
    name: 'Sistema S',
    icon: Building2,
    color: 'sistema',
    match: (course) => course.tags.some((t) => normalizeText(t) === normalizeText('Sistema S')),
    buildParams: () => ({ segmento: 'Sistema S' }),
  },
  {
    name: 'Estatais',
    icon: Landmark,
    color: 'estatais',
    match: (course) => course.tags.some((t) => normalizeText(t) === normalizeText('Estatais')),
    buildParams: () => ({ segmento: 'Estatais' }),
  },
  {
    name: 'Educação',
    icon: GraduationCap,
    color: 'educacao',
    match: (course) => course.tags.some((t) => normalizeText(t).includes('educa')),
    buildParams: () => ({ segmento: 'Educação' }),
  },
  {
    name: 'Judiciário',
    icon: Gavel,
    color: 'judiciario',
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
    <div className="min-h-screen bg-[linear-gradient(160deg,#f8faff_0%,#eef1fb_45%,#ffffff_100%)] text-foreground transition-colors dark:bg-[linear-gradient(160deg,#050813_0%,#0b1322_55%,#101c31_100%)]">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-aurora shadow-sm">
              <GraduationCap className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">JML Cursos</h1>
              <p className="text-sm text-muted-foreground">Apoio à Venda Inteligente</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <HistoryPopover onSelectHistory={handleHistorySelect} />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto space-y-16 px-4 py-12">
        {/* Hero */}
        <section className="overflow-hidden rounded-3xl border border-border/60 bg-card/80 px-6 py-12 shadow-[0_28px_90px_-65px_rgba(15,23,42,0.38)] backdrop-blur-xl transition-colors dark:bg-card/60 dark:shadow-[0_28px_90px_-68px_rgba(15,23,42,0.55)]">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-4 py-1 text-xs font-medium uppercase tracking-[0.18em] text-primary">
              <Sparkles className="h-4 w-4" />
              Descubra o próximo passo
            </span>
            <div className="space-y-4">
              <h2 className="bg-gradient-aurora bg-clip-text text-4xl font-bold text-transparent lg:text-5xl">
                Encontre o curso perfeito
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                Digite o que o cliente perguntou e descubra os cursos mais relevantes para sua necessidade.
              </p>
            </div>
            <div className="w-full max-w-2xl">
              <SearchBar onSearch={handleSearch} />
            </div>
          </div>
        </section>

        {/* Explore */}
        <section>
          <div className="mb-8 flex flex-col gap-2">
            <span className="text-sm font-medium text-primary">Explorar</span>
            <h3 className="text-2xl font-semibold">Personalize a jornada de descoberta</h3>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Navegue pelas modalidades ou visualize todos os cursos disponíveis.
            </p>
          </div>

          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 p-1 shadow-sm backdrop-blur">
            {exploreModeOptions.map(({ id, label, icon: Icon }) => {
              const isActive = exploreMode === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setExploreMode(id as ExploreMode)}
                  className={`group flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-aurora text-white shadow-[0_10px_28px_-18px_rgba(80,56,237,0.55)]'
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

          {exploreMode === 'category' ? (
            <div
              id={explorePanelIds.category}
              className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
              role="region"
              aria-label="Explorar por categoria"
            >
              {categories.map((category) => {
                const Icon = category.icon;
                const coursesInCategory = allCourses.filter(category.match);
                const accent = getAccent(category.color);
                const accentSoft = getAccent(category.color, 0.12);
                const accentSoftHover = getAccent(category.color, 0.2);
                const accentOverlay = `linear-gradient(160deg, ${getAccent(category.color, 0.22)}, transparent 70%)`;
                const accentShadow = `0 22px 55px -36px ${getAccent(category.color, 0.45)}`;
                const badgeStyle: CSSProperties = {
                  background: `linear-gradient(135deg, ${accentSoft}, ${accentSoftHover})`,
                  color: accent,
                  boxShadow: `0 12px 30px -18px ${accent}`,
                };

                return (
                  <Card
                    key={category.name}
                    onClick={() => handleCategoryClick(category)}
                    style={{
                      boxShadow: accentShadow,
                      background: `linear-gradient(135deg, ${accentSoft}, transparent 65%)`,
                    }}
                    className="group relative cursor-pointer overflow-hidden rounded-3xl border border-border/60 bg-card/80 p-8 shadow-[0_18px_55px_-50px_rgba(15,23,42,0.55)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_28px_65px_-48px_rgba(37,99,235,0.5)] dark:bg-card/60"
                  >
                    <div
                      className="absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                      style={{ background: accentOverlay }}
                      aria-hidden
                    />
                    <div className="relative z-10 space-y-4">
                      <div
                        className="flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm transition-transform duration-200 group-hover:scale-110"
                        style={{ backgroundColor: accentSoft, color: accent }}
                      >
                        <Icon className="h-7 w-7" />
                      </div>
                      <div className="flex items-start justify-between gap-4">
                        <h4 className="text-xl font-semibold">{category.name}</h4>
                        <span className="rounded-full bg-background/90 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
                          {coursesInCategory.length} cursos
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Explore conteúdos selecionados e encontre rapidamente o que melhor atende o cliente.
                      </p>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div id={explorePanelIds.course} className="space-y-6" role="region" aria-label="Explorar por curso">
              <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-background/70 p-5 shadow-inner backdrop-blur">
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

        {/* Mais Buscados */}
        <section className="space-y-12">
          <div className="overflow-hidden rounded-3xl border border-border/60 bg-card/80 p-8 shadow-[0_30px_95px_-82px_rgba(15,23,42,0.5)] transition-colors dark:bg-card/60 dark:shadow-[0_30px_95px_-76px_rgba(37,99,235,0.45)]">
            <h3 className="mb-6 flex items-center gap-2 text-2xl font-semibold">
              <TrendingUp className="h-6 w-6 text-primary" />
              Mais Buscados
            </h3>
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

          {/* Novos Cursos */}
          <div className="overflow-hidden rounded-3xl border border-border/60 bg-card/80 p-8 shadow-[0_30px_95px_-82px_rgba(15,23,42,0.5)] transition-colors dark:bg-card/60 dark:shadow-[0_30px_95px_-76px_rgba(80,56,237,0.45)]">
            <h3 className="mb-6 flex items-center gap-2 text-2xl font-semibold">
              <Sparkles className="h-6 w-6 text-secondary" />
              Novos Cursos
            </h3>
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
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-background/60 py-8 backdrop-blur-sm">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 JML Cursos. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
