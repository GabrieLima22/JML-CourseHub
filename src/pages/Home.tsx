import { useState, type CSSProperties } from 'react';
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
import { useSearch, Course, FilterOptions } from '@/hooks/useSearch';
import { useSearchHistory } from '@/hooks/useSearchHistory';
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

  const handleHistorySelect = (entry: any) => {
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

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[hsl(var(--background))] via-[#e9edff] to-[#dff6ff] dark:from-[#080b1c] dark:via-[#0f1a2d] dark:to-[#16203b]">
      <span
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-24 h-[420px] w-[420px] rounded-full blur-3xl opacity-70 mix-blend-multiply dark:opacity-100 dark:mix-blend-screen"
        style={{
          background:
            'radial-gradient(circle at center, rgba(99, 102, 241, 0.55), transparent 62%)',
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute top-1/4 -right-20 h-[520px] w-[520px] rounded-full blur-3xl opacity-70 mix-blend-multiply dark:opacity-100 dark:mix-blend-screen"
        style={{
          background:
            'radial-gradient(circle at center, rgba(56, 189, 248, 0.45), transparent 68%)',
        }}
      />
      <div className="container relative z-10 mx-auto px-4 py-12">
        <div className="relative mb-16 overflow-hidden rounded-[2.5rem] border border-slate-200/60 bg-white/80 px-6 py-10 shadow-[0_45px_120px_-60px_rgba(80,56,237,0.25)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:shadow-[0_45px_120px_-60px_rgba(80,56,237,0.65)]">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              background:
                'radial-gradient(circle at top left, rgba(80, 56, 237, 0.35), transparent 55%), radial-gradient(circle at bottom right, rgba(56, 189, 248, 0.28), transparent 60%)',
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
                <p className="text-sm text-muted-foreground">Apoio Ã  Venda Inteligente</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <HistoryPopover onSelectHistory={handleHistorySelect} />
              <ThemeToggle />
            </div>
          </header>

          {/* Hero Search */}
          <section className="relative z-10 mt-10">
            <div className="mb-8 text-center">
              <h2 className="bg-gradient-aurora bg-clip-text text-4xl font-bold text-transparent lg:text-5xl">
                Encontre o curso perfeito
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                Digite o que o cliente perguntou e descubra os cursos mais relevantes para sua necessidade
              </p>
            </div>
            <div className="flex justify-center">
              <SearchBar onSearch={handleSearch} />
            </div>
          </section>
        </div>

        {/* Categories */}
        <section className="mb-16">
          <div className="relative rounded-3xl border border-border/60 bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-8 overflow-hidden">
            <div className="absolute inset-0 pointer-events-none opacity-60 mix-blend-screen [background:radial-gradient(circle_at_top_left,hsl(var(--gradient-from)/0.25),transparent_55%)]" />
            <div className="absolute inset-0 pointer-events-none opacity-50 mix-blend-screen [background:radial-gradient(circle_at_bottom_right,hsl(var(--gradient-to)/0.2),transparent_55%)]" />
            <div className="relative z-10">
              <h3 className="text-2xl font-semibold mb-6">Explorar por Categoria</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {categories.map(cat => {
                  const Icon = cat.icon;
                  const coursesInCategory = allCourses.filter(cat.match);
                  const colorVar = categoryColorVars[cat.color];
                  const accent = `hsl(var(${colorVar}))`;
                  const accentSoft = `hsl(var(${colorVar}) / 0.18)`;
                  const accentSoftHover = `hsl(var(${colorVar}) / 0.26)`;
                  const accentOverlay = `radial-gradient(circle at top, hsl(var(${colorVar}) / 0.4), transparent 60%)`;
                  const accentShadow = `0 24px 55px -32px hsl(var(${colorVar}) / 0.55)`;
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
                      className="group relative overflow-hidden cursor-pointer p-8 rounded-3xl border border-border/60 transition-all duration-300 hover:scale-[1.03] hover:border-transparent backdrop-blur-sm"
                    >
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{ background: accentOverlay }}
                      />
                      <div className="relative z-10">
                        <div
                          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform text-white"
                          style={badgeStyle}
                        >
                          <Icon className="w-7 h-7" />
                        </div>
                        <h4 className="text-xl font-semibold mb-2">{cat.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {coursesInCategory.length} cursos disponíveis
                        </p>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Most Searched */}
        <section className="mb-16">
          <div className="relative rounded-3xl border border-border/60 bg-gradient-to-br from-secondary/10 via-background to-primary/10 p-8 overflow-hidden">
            <div className="absolute inset-0 pointer-events-none opacity-60 mix-blend-screen [background:radial-gradient(circle_at_top_right,hsl(var(--gradient-via)/0.3),transparent_55%)]" />
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
          <div className="relative rounded-3xl border border-border/60 bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-8 overflow-hidden">
            <div className="absolute inset-0 pointer-events-none opacity-60 mix-blend-screen [background:radial-gradient(circle_at_bottom_left,hsl(var(--gradient-to)/0.28),transparent_55%)]" />
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
