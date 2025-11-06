import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Filter, X } from 'lucide-react';
import { SearchBar } from '@/components/SearchBar';
import { CourseCard } from '@/components/CourseCard';
import { CourseDrawer } from '@/components/CourseDrawer';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useSearch, type Course, type FilterOptions } from '@/hooks/useSearch';

export default function Resultados() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { search, getCourseById, getRelatedCourses, getUniqueCompanies, getUniqueCourseTypes, getUniqueSegments, getUniqueLevels } = useSearch();

  // Estado dos filtros atualizado para nova estrutura
  const [filters, setFilters] = useState<FilterOptions>({
    companies: [],
    course_types: [],
    segments: [],
    levels: [],
  });

  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Inicialização baseada nos parâmetros da URL
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);

  // Parse inicial dos filtros da URL
  useEffect(() => {
    const newFilters: FilterOptions = {
      companies: searchParams.get('empresa')?.split(',').filter(Boolean) || [],
      course_types: searchParams.get('tipo')?.split(',').filter(Boolean) || [],
      segments: searchParams.get('segmento')?.split(',').filter(Boolean) || [],
      levels: searchParams.get('nivel')?.split(',').filter(Boolean) || [],
    };
    setFilters(newFilters);
  }, [searchParams]);

  // Execução da busca
  const results = useMemo(() => {
    return search(query, filters);
  }, [query, filters, search]);

  // Cursos relacionados para o drawer
  const relatedCourses = useMemo(() => {
    if (!selectedCourse) return [];
    return getRelatedCourses(selectedCourse.related_ids);
  }, [selectedCourse, getRelatedCourses]);

  // Handlers para filtros
  const toggleFilter = (category: keyof FilterOptions, value: string) => {
    setFilters(prev => ({
      ...prev,
      [category]: prev[category].includes(value)
        ? prev[category].filter(v => v !== value)
        : [...prev[category], value]
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      companies: [],
      course_types: [],
      segments: [],
      levels: [],
    });
  };

  const activeFilterCount = Object.values(filters).flat().length;

  // Mapeamento para labels amigáveis
  const typeLabels: Record<string, string> = {
    'aberto': 'Aberto',
    'incompany': 'InCompany', 
    'ead': 'EAD'
  };

  const companyLabels: Record<string, string> = {
    'JML': 'JML',
    'Conecta': 'Conecta'
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header FIXO com gradiente */}
      <header className="header-fixed">
        <div className="container flex items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Resultados da Busca</h1>
              <p className="text-sm text-muted-foreground">
                {results.length} curso{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Conteúdo principal com padding para header fixo */}
      <div className="main-content container px-4 py-6">
        {/* Barra de busca */}
        <div className="mb-6">
          <SearchBar
            onSearch={setQuery}
            initialValue={query}
            placeholder="Refinar busca..."
          />
        </div>

        <div className="flex gap-6">
          {/* Sidebar de Filtros */}
          <aside className="w-80 shrink-0">
            <Card className="sticky top-24 p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <h2 className="font-semibold">Filtros</h2>
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="h-5 text-xs">
                      {activeFilterCount}
                    </Badge>
                  )}
                </div>
                {activeFilterCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="h-7 text-xs"
                  >
                    Limpar
                  </Button>
                )}
              </div>

              <div className="space-y-6">
                {/* Filtro por Empresa */}
                <div>
                  <h3 className="mb-3 text-sm font-medium">Empresa</h3>
                  <div className="space-y-2">
                    {getUniqueCompanies().map(company => (
                      <label key={company} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.companies.includes(company)}
                          onChange={() => toggleFilter('companies', company)}
                          className="rounded border-border"
                        />
                        <span className="text-sm">{companyLabels[company] || company}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Filtro por Tipo de Curso */}
                <div>
                  <h3 className="mb-3 text-sm font-medium">Tipo de Curso</h3>
                  <div className="space-y-2">
                    {getUniqueCourseTypes().map(type => (
                      <label key={type} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.course_types.includes(type)}
                          onChange={() => toggleFilter('course_types', type)}
                          className="rounded border-border"
                        />
                        <span className="text-sm">{typeLabels[type] || type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Filtro por Segmento */}
                <div>
                  <h3 className="mb-3 text-sm font-medium">Segmento</h3>
                  <div className="space-y-2">
                    {getUniqueSegments().map(segment => (
                      <label key={segment} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.segments.includes(segment)}
                          onChange={() => toggleFilter('segments', segment)}
                          className="rounded border-border"
                        />
                        <span className="text-sm">{segment}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Filtro por Nível */}
                <div>
                  <h3 className="mb-3 text-sm font-medium">Nível</h3>
                  <div className="space-y-2">
                    {getUniqueLevels().map(level => (
                      <label key={level} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.levels.includes(level)}
                          onChange={() => toggleFilter('levels', level)}
                          className="rounded border-border"
                        />
                        <span className="text-sm">{level}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </aside>

          {/* Resultados */}
          <main className="flex-1">
            {results.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <Filter className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">Nenhum curso encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  Tente ajustar sua busca ou filtros para encontrar cursos relevantes.
                </p>
                <Button onClick={clearAllFilters} variant="outline">
                  Limpar Filtros
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
                {results.map(course => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    onClick={() => setSelectedCourse(course)}
                    matchReason={course.matchReason}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
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
