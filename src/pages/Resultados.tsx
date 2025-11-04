import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, SlidersHorizontal } from 'lucide-react';
import { SearchBar } from '@/components/SearchBar';
import { ChipsFiltro } from '@/components/ChipsFiltro';
import { CourseCard } from '@/components/CourseCard';
import { CourseDrawer } from '@/components/CourseDrawer';
import { EmptyState } from '@/components/EmptyState';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useSearch, Course, FilterOptions } from '@/hooks/useSearch';
import { useSearchHistory } from '@/hooks/useSearchHistory';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

const MODALITIES = ['EAD', 'Presencial', 'Conecta', 'In Company'];
const AREAS = ['Agenda JML', 'Setorial', 'Soft Skills', 'Corporativo'];
const LEVELS = ['Básico', 'Intermediário', 'Avançado'];

export default function Resultados() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { search, getCourseById, getRelatedCourses } = useSearch();
  const { addToHistory } = useSearchHistory();

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [filters, setFilters] = useState<FilterOptions>({
    modalities: [],
    areas: searchParams.get('area') ? [searchParams.get('area')!] : [],
    levels: [],
  });
  const [results, setResults] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const q = searchParams.get('q') || '';
    const area = searchParams.get('area');
    setQuery(q);
    if (area && !filters.areas.includes(area)) {
      setFilters(prev => ({ ...prev, areas: [area] }));
    }
  }, [searchParams]);

  useEffect(() => {
    const newResults = search(query, filters);
    setResults(newResults);
    if (query.trim()) {
      addToHistory(query, filters);
    }
  }, [query, filters]);

  const handleSearch = (newQuery: string) => {
    setQuery(newQuery);
    navigate(`/resultados?q=${encodeURIComponent(newQuery)}`);
  };

  const handleCourseClick = (course: Course) => {
    setSelectedCourse(course);
    setDrawerOpen(true);
  };

  const relatedCourses = selectedCourse
    ? getRelatedCourses(selectedCourse.related_ids)
    : [];

  const FiltersPanel = () => (
    <div className="space-y-6">
      <ChipsFiltro
        label="Modalidade"
        options={MODALITIES}
        selected={filters.modalities}
        onChange={modalities => setFilters({ ...filters, modalities })}
      />
      <Separator />
      <ChipsFiltro
        label="Área"
        options={AREAS}
        selected={filters.areas}
        onChange={areas => setFilters({ ...filters, areas })}
      />
      <Separator />
      <ChipsFiltro
        label="Nível"
        options={LEVELS}
        selected={filters.levels}
        onChange={levels => setFilters({ ...filters, levels })}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="rounded-xl">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <ThemeToggle />
        </header>

        {/* Search */}
        <div className="mb-8 flex justify-center">
          <SearchBar onSearch={handleSearch} initialValue={query} />
        </div>

        <div className="flex gap-6">
          {/* Desktop Filters Sidebar */}
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-6 p-6 rounded-2xl border border-border bg-card">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5" />
                Filtros
              </h3>
              <FiltersPanel />
            </div>
          </aside>

          {/* Mobile Filters Sheet */}
          <div className="lg:hidden fixed bottom-6 right-6 z-50">
            <Sheet>
              <SheetTrigger asChild>
                <Button size="lg" className="rounded-full shadow-lg h-14 px-6">
                  <SlidersHorizontal className="w-5 h-5 mr-2" />
                  Filtros
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[80vh]">
                <SheetHeader className="mb-6">
                  <SheetTitle>Filtros</SheetTitle>
                </SheetHeader>
                <div className="overflow-y-auto h-[calc(80vh-80px)] px-1">
                  <FiltersPanel />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Results */}
          <main className="flex-1">
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                {results.length > 0 ? (
                  <>
                    <span className="font-semibold text-foreground">{results.length}</span>{' '}
                    {results.length === 1 ? 'curso encontrado' : 'cursos encontrados'}
                    {query && <> para "{query}"</>}
                  </>
                ) : (
                  'Nenhum resultado'
                )}
              </p>
            </div>

            {results.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {results.map(course => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    onClick={() => handleCourseClick(course)}
                    matchReason={(course as any).matchReason}
                  />
                ))}
              </div>
            ) : (
              <EmptyState query={query} onSuggestionClick={handleSearch} />
            )}
          </main>
        </div>
      </div>

      <CourseDrawer
        course={selectedCourse}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        relatedCourses={relatedCourses}
        onCourseClick={handleCourseClick}
      />
    </div>
  );
}
