import { useState, useRef, useEffect } from 'react';
import { Search, X, ArrowUpRight, Plus, GraduationCap, Clock } from 'lucide-react';
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
      'Curso Híbrido JML': results.filter(c => c.modality.includes('Curso Híbrido JML')),
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
    'Curso Híbrido JML': 'from-orange-500 to-amber-600',
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
          <div className="mt-8 space-y-8">
            {/* Header com background consistente */}
            <div className="text-center mb-10 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-border/40 to-transparent h-px top-1/2" />
              <div className="relative px-6 py-4 rounded-2xl bg-card/60 backdrop-blur-sm border border-border/40 shadow-lg">
                <h3 className="text-3xl font-bold bg-gradient-to-r from-violet-600 via-blue-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                  Painel Interativo de Apoio à Venda de Cursos
                </h3>
                <p className="text-muted-foreground">
                  Cursos organizados por categoria para acelerar suas vendas
                </p>
              </div>
            </div>

            {/* Grid melhorado com espaçamento e bordas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                  <Card className={`group relative p-6 bg-gradient-to-br ${categoryColors[category]} text-white overflow-hidden h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}>
                    {/* Background overlay sutil e consistente */}
                    <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-black/5 to-black/15 rounded-xl" />
                    
                    {/* Efeito de brilho sutil no hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-800 ease-out" />
                    
                    <div className="relative z-10 h-full flex flex-col">
                      {/* Header da categoria limpo */}
                      <div className="mb-4 pb-4 border-b border-white/25">
                        <h4 className="text-xl font-bold mb-2 text-white">{category}</h4>
                        <div className="flex items-center justify-between">
                          <p className="text-white/90 text-sm">
                            {courses.length} curso{courses.length !== 1 ? 's' : ''} disponível{courses.length !== 1 ? 'is' : ''}
                          </p>
                          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center border border-white/30">
                            <span className="text-sm font-bold text-white">{courses.length}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Lista de cursos com layout profissional */}
                      <div className="flex-1 space-y-3 max-h-64">
                        <div className="space-y-3 overflow-y-auto scrollbar-none" style={{ maxHeight: '15rem' }}>
                          {courses.slice(0, 3).map((course: any, courseIndex) => (
                            <div 
                              key={course.id}
                              className="group/course bg-white/10 backdrop-blur-sm rounded-lg p-3 hover:bg-white/15 transition-all duration-200 cursor-pointer border border-white/10 hover:border-white/20"
                              onClick={() => onSearch(course.title)}
                              style={{
                                animationDelay: `${(index * 100) + (courseIndex * 50)}ms`
                              }}
                            >
                              <div className="flex items-start gap-3">
                                {/* Conteúdo principal */}
                                <div className="flex-1 min-w-0">
                                  <h5 className="font-medium text-sm text-white mb-1 line-clamp-1 group-hover/course:text-white/90 transition-colors">
                                    {course.title}
                                  </h5>
                                  <p className="text-white/80 text-xs leading-relaxed line-clamp-2 mb-2">
                                    {course.summary}
                                  </p>
                                  
                                  {/* Meta info */}
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs bg-white/15 px-2 py-0.5 rounded-md text-white/90">
                                      {course.level}
                                    </span>
                                    <span className="text-xs text-white/70 flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {course.duration_hours}h
                                    </span>
                                  </div>
                                </div>

                                {/* Ícone de ação sutil */}
                                <div className="shrink-0 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center group-hover/course:bg-white/20 transition-colors">
                                  <ArrowUpRight className="h-3 w-3 text-white/60 group-hover/course:text-white transition-colors" />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {courses.length > 3 && (
                          <button 
                            className="w-full text-center text-white/80 hover:text-white text-sm transition-colors py-2 rounded-lg hover:bg-white/10 border border-white/20 border-dashed hover:border-white/30"
                            onClick={() => onSearch(query)}
                          >
                            + {courses.length - 3} curso{courses.length - 3 !== 1 ? 's' : ''} adicional{courses.length - 3 !== 1 ? 'is' : ''}
                          </button>
                        )}
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
            </div>

            {/* Botão final melhorado */}
            <div className="text-center mt-10 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent h-px top-1/2" />
              <div className="relative bg-background px-6">
                <Button
                  onClick={() => onSearch(query)}
                  size="lg"
                  className="px-8 py-4 text-lg font-semibold bg-gradient-to-r from-violet-600 via-blue-600 to-emerald-600 hover:from-violet-700 hover:via-blue-700 hover:to-emerald-700 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-200"
                >
                  🚀 Ver todos os {Object.values(searchResults).flat().length} resultados detalhados
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
