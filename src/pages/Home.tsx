import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BriefcaseBusiness,
  Building2,
  Gavel,
  GraduationCap,
  Landmark,
  MonitorPlay,
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
import { useSearch, type Course, type FilterOptions } from '@/hooks/useSearch';
import { useSearchHistory, type HistoryEntry } from '@/hooks/useSearchHistory';
import { Card } from '@/components/ui/card';

const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

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
    match: course => course.modality.some(mod => normalizeText(mod) === 'ead'),
    buildParams: () => ({ modalidade: 'EAD' }),
  },
  {
    name: 'Presencial',
    icon: Users,
    color: 'presencial',
    match: course => course.modality.some(mod => normalizeText(mod) === 'presencial'),
    buildParams: () => ({ modalidade: 'Presencial' }),
  },
  {
    name: 'Conecta',
    icon: Share2,
    color: 'conecta',
    match: course => course.modality.some(mod => normalizeText(mod) === 'conecta'),
    buildParams: () => ({ modalidade: 'Conecta' }),
  },
  {
    name: 'In Company',
    icon: BriefcaseBusiness,
    color: 'incompany',
    match: course => course.modality.some(mod => normalizeText(mod) === 'in company'),
    buildParams: () => ({ modalidade: 'In Company' }),
  },
  {
    name: 'Sistema S',
    icon: Building2,
    color: 'sistema',
    match: course => course.tags.some(tag => normalizeText(tag) === normalizeText('Sistema S')),
    buildParams: () => ({ segmento: 'Sistema S' }),
  },
  {
    name: 'Estatais',
    icon: Landmark,
    color: 'estatais',
    match: course => course.tags.some(tag => normalizeText(tag) === 'estatais'),
    buildParams: () => ({ segmento: 'Estatais' }),
  },
  {
    name: 'Educação',
    icon: GraduationCap,
    color: 'educacao',
    match: course => course.tags.some(tag => normalizeText(tag).includes('educa')),
    buildParams: () => ({ segmento: 'Educação' }),
  },
  {
    name: 'Judiciário',
    icon: Gavel,
    color: 'judiciario',
    match: course =>
      course.tags.some(tag => normalizeText(tag).includes('judici')) ||
      normalizeText(course.target_audience).includes('jurid'),
    buildParams: () => ({ segmento: 'Judiciário' }),
  },
];

const getAccent = (color: CategoryColor, alpha = 1) =>
  alpha === 1
    ? `hsl(var(${categoryColorVars[color]}))`
    : `hsl(var(${categoryColorVars[color]}) / ${alpha})`;

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

  const mostSearched = useMemo(() => allCourses.slice(0, 3), [allCourses]);
  const newCourses = useMemo(() => allCourses.slice(-3), [allCourses]);

  return (
    <div className="min-h-screen bg-[linear-gradient(160deg,#f8faff_0%,#eef1fb_45%,#ffffff_100%)] text-foreground transition-colors dark:bg-[linear-gradient(160deg,#050813_0%,#0b1322_55%,#101c31_100%)]">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-aurora shadow-sm">
              <GraduationCap className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">JML Cursos</h1>
              <p className="text-sm text-muted-foreground">Apoio à venda inteligente</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <HistoryPopover onSelectHistory={handleHistorySelect} />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto space-y-16 px-4 py-12">
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

        <section>
          <div className="mb-8 flex flex-col gap-2">
            <span className="text-sm font-medium text-primary">Explorar</span>
            <h3 className="text-2xl font-semibold">Explorar por Categoria</h3>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Visualize rapidamente as modalidades de destaque e acesse os cursos mais relevantes em cada categoria.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categories.map(category => {
              const Icon = category.icon;
              const coursesInCategory = allCourses.filter(category.match);
              const accent = getAccent(category.color);

              return (
                <Card
                  key={category.name}
                  onClick={() => handleCategoryClick(category)}
                  className="group relative cursor-pointer overflow-hidden rounded-3xl border border-border/60 bg-card/80 p-8 shadow-[0_18px_55px_-50px_rgba(15,23,42,0.55)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_28px_65px_-48px_rgba(37,99,235,0.5)] dark:bg-card/60"
                >
                  <div
                    className="absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                    style={{ background: `linear-gradient(135deg, ${getAccent(category.color, 0.12)}, transparent 70%)` }}
                    aria-hidden
                  />
                  <div className="relative z-10 space-y-4">
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm transition-transform duration-200 group-hover:scale-110"
                      style={{
                        backgroundColor: getAccent(category.color, 0.12),
                        color: accent,
                      }}
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
        </section>

        <section className="space-y-12">
          <div className="overflow-hidden rounded-3xl border border-border/60 bg-card/80 p-8 shadow-[0_30px_95px_-82px_rgba(15,23,42,0.5)] transition-colors dark:bg-card/60 dark:shadow-[0_30px_95px_-76px_rgba(37,99,235,0.45)]">
            <h3 className="mb-6 flex items-center gap-2 text-2xl font-semibold">
              <TrendingUp className="h-6 w-6 text-primary" />
              Mais Buscados
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {mostSearched.map(course => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onClick={() => navigate(`/resultados?q=${encodeURIComponent(course.title)}`)}
                />
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-border/60 bg-card/80 p-8 shadow-[0_30px_95px_-82px_rgba(15,23,42,0.5)] transition-colors dark:bg-card/60 dark:shadow-[0_30px_95px_-76px_rgba(80,56,237,0.45)]">
            <h3 className="mb-6 flex items-center gap-2 text-2xl font-semibold">
              <Sparkles className="h-6 w-6 text-secondary" />
              Novos Cursos
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {newCourses.map(course => (
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
    </div>
  );
}
