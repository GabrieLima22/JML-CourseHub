import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useSearch } from '@/hooks/useSearch';
import { CourseCard } from './CourseCard';
import { Card } from './ui/card';

type SearchBarProps = {
  onSearch: (query: string) => void;
  placeholder?: string;
  initialValue?: string;
};

export function SearchBar({ onSearch, placeholder, initialValue = '' }: SearchBarProps) {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const { allCourses, search } = useSearch();

  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const allTitles = allCourses.map(c => c.title);
    const filtered = allTitles.filter(t =>
      t.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);
    setSuggestions(filtered);
  }, [query, allCourses]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    // TRANSFORMERS ANIMATION! 🤖
    setIsExpanded(true);
    setShowSuggestions(false);

    // Buscar e organizar resultados por categoria
    const results = search(query, {
      companies: [],
      course_types: [],
      segments: [],
      levels: [],
    });

    // Organizar por modalidade (categorias)
    const categorizedResults = {
      'Curso aberto JML': results.filter(c => c.modality.includes('Curso aberto JML')),
      'Curso aberto Conecta': results.filter(c => c.modality.includes('Curso aberto Conecta')),
      'Curso InCompany JML': results.filter(c => c.modality.includes('Curso InCompany JML')),
      'Curso InCompany Conecta': results.filter(c => c.modality.includes('Curso InCompany Conecta')),
      'Curso EAD JML': results.filter(c => c.modality.includes('Curso EAD JML')),
    };

    setSearchResults(categorizedResults);
  };

  const handleClear = () => {
    setQuery('');
    setIsExpanded(false);
    setSearchResults([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    // Simular submit com a sugestão
    const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
    handleSubmit(fakeEvent);
  };

  // Cores das categorias
  const categoryColors: Record<string, string> = {
    'Curso aberto JML': 'from-violet-500 to-purple-600',
    'Curso aberto Conecta': 'from-blue-500 to-cyan-600',
    'Curso InCompany JML': 'from-purple-500 to-blue-600',
    'Curso InCompany Conecta': 'from-indigo-500 to-purple-600',
    'Curso EAD JML': 'from-green-500 to-emerald-600',
  };

  return (
    <div className="relative w-full max-w-3xl mx-auto">
      {/* Barra de busca */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={placeholder || "O que o cliente perguntou?"}
            className="h-14 pl-12 pr-20 rounded-2xl border-2 text-lg font-medium transition-all duration-300 focus:border-primary/50 focus:ring-4 focus:ring-primary/20"
          />
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleClear}
              className="absolute right-12 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          <Button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-10 px-6 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 transition-all duration-200"
          >
            Buscar
          </Button>
        </div>

        {/* Sugestões */}
        {showSuggestions && suggestions.length > 0 && !isExpanded && (
          <Card className="absolute top-full left-0 right-0 mt-2 p-2 border shadow-lg z-50">
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm"
              >
                {suggestion}
              </button>
            ))}
          </Card>
        )}
      </form>

      {/* TRANSFORMERS EXPANSION! 🤖⚡ */}
      <div 
        className={`transition-all duration-1000 ease-in-out transform origin-top ${
          isExpanded 
            ? 'opacity-100 scale-100 translate-y-0' 
            : 'opacity-0 scale-95 -translate-y-4 pointer-events-none'
        }`}
      >
        {isExpanded && (
          <div className="mt-8 space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-violet-600 via-blue-600 to-emerald-600 bg-clip-text text-transparent">
                Painel Interativo de Apoio à Venda de Cursos
              </h3>
              <p className="text-muted-foreground mt-2">
                Cursos organizados por categoria para acelerar suas vendas
              </p>
            </div>

            {/* Grid de categorias com animação escalonada */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(searchResults).map(([category, courses], index) => (
                <div
                  key={category}
                  className={`transform transition-all duration-700 ease-out ${
                    isExpanded 
                      ? 'opacity-100 translate-y-0' 
                      : 'opacity-0 translate-y-8'
                  }`}
                  style={{ 
                    transitionDelay: `${index * 150}ms` // Animação escalonada
                  }}
                >
                  <Card className={`p-6 bg-gradient-to-br ${categoryColors[category]} text-white relative overflow-hidden`}>
                    {/* Efeito de brilho animado */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer" />
                    
                    <div className="relative z-10">
                      <h4 className="text-lg font-bold mb-2">{category}</h4>
                      <p className="text-white/90 text-sm mb-4">
                        {courses.length} curso{courses.length !== 1 ? 's' : ''} disponível{courses.length !== 1 ? 'is' : ''}
                      </p>
                      
                      {/* Cursos da categoria */}
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {courses.slice(0, 3).map((course: any) => (
                          <div 
                            key={course.id}
                            className="bg-white/10 backdrop-blur-sm rounded-lg p-3 hover:bg-white/20 transition-all duration-200 cursor-pointer transform hover:scale-105"
                            onClick={() => onSearch(course.title)}
                          >
                            <h5 className="font-medium text-sm">{course.title}</h5>
                            <p className="text-white/80 text-xs mt-1 line-clamp-2">
                              {course.summary}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs bg-white/20 px-2 py-1 rounded">
                                {course.level}
                              </span>
                              <span className="text-xs bg-white/20 px-2 py-1 rounded">
                                {course.duration_hours}h
                              </span>
                            </div>
                          </div>
                        ))}
                        
                        {courses.length > 3 && (
                          <button 
                            className="w-full text-center text-white/80 text-sm hover:text-white transition-colors py-2"
                            onClick={() => onSearch(query)}
                          >
                            Ver mais {courses.length - 3} curso{courses.length - 3 !== 1 ? 's' : ''}...
                          </button>
                        )}
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
            </div>

            {/* Botão para ver todos os resultados */}
            <div className="text-center mt-8">
              <Button
                onClick={() => onSearch(query)}
                variant="outline"
                size="lg"
                className="px-8 py-3 text-lg font-medium"
              >
                Ver todos os {Object.values(searchResults).flat().length} resultados
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
