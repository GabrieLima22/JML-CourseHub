import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, TrendingUp, Sparkles } from 'lucide-react';
import { SearchBar } from '@/components/SearchBar';
import { CourseCard } from '@/components/CourseCard';
import { HistoryPopover } from '@/components/HistoryPopover';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useSearch, Course } from '@/hooks/useSearch';
import { useSearchHistory } from '@/hooks/useSearchHistory';
import { Card } from '@/components/ui/card';

const categories = [
  { name: 'Agenda JML', icon: GraduationCap, color: 'category-agenda' },
  { name: 'Setorial', icon: TrendingUp, color: 'category-setorial' },
  { name: 'Soft Skills', icon: Sparkles, color: 'category-soft' },
];

export default function Home() {
  const navigate = useNavigate();
  const { allCourses } = useSearch();
  const { addToHistory } = useSearchHistory();
  const [filters] = useState({ modalities: [], areas: [], levels: [] });

  const handleSearch = (query: string) => {
    addToHistory(query, filters);
    navigate(`/resultados?q=${encodeURIComponent(query)}`);
  };

  const handleHistorySelect = (entry: any) => {
    navigate(`/resultados?q=${encodeURIComponent(entry.query)}`);
  };

  const handleCategoryClick = (categoryName: string) => {
    navigate(`/resultados?area=${encodeURIComponent(categoryName)}`);
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
              const coursesInCategory = allCourses.filter(c => c.area === cat.name);
              return (
                <Card
                  key={cat.name}
                  onClick={() => handleCategoryClick(cat.name)}
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
