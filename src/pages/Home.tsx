import { useState } from 'react';
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

type CategoryConfig = {
  name: string;
  icon: LucideIcon;
  color: string;
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-12">
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
        <section className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-aurora bg-clip-text text-transparent">
              Encontre o curso perfeito
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Digite o que o cliente perguntou e descubra os cursos mais relevantes para sua necessidade
            </p>
          </div>
          <div className="flex justify-center">
            <SearchBar onSearch={handleSearch} />
          </div>
        </section>

        {/* Categories */}
        <section className="mb-16">
          <h3 className="text-2xl font-semibold mb-6">Explorar por Categoria</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {categories.map(cat => {
              const Icon = cat.icon;
              const coursesInCategory = allCourses.filter(cat.match);
              return (
                <Card
                  key={cat.name}
                  onClick={() => handleCategoryClick(cat)}
                  className="group cursor-pointer p-8 rounded-2xl border-2 hover:border-primary/50 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] bg-card"
                >
                  <div className={`w-14 h-14 rounded-2xl bg-${cat.color}/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-7 h-7 text-${cat.color}`} />
                  </div>
                  <h4 className="text-xl font-semibold mb-2">{cat.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {coursesInCategory.length} cursos disponíveis
                  </p>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Most Searched */}
        <section className="mb-16">
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
        </section>

        {/* New Courses */}
        <section>
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
        </section>
      </div>
    </div>
  );
}
