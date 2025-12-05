import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X, ArrowRight, ChevronRight, Clock, BarChart, Sparkles, Loader2 } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useSearch, type Course } from "@/hooks/useSearch";
import { Card } from "./ui/card";
import { cn } from "@/lib/utils";

type SearchBarProps = {
  onSearch: (query: string) => void;
  placeholder?: string;
  initialValue?: string;
};

type CategorizedResults = Record<string, Course[]>;

// Configuração de cores
const categoryStyles: Record<string, { light: string; dark: string; border: string; text: string; icon: string }> = {
  "Curso aberto JML": {
    light: "bg-violet-50/80 hover:bg-violet-100/80",
    dark: "dark:bg-violet-900/20 dark:hover:bg-violet-900/30",
    border: "border-violet-200 dark:border-violet-700/50",
    text: "text-violet-700 dark:text-violet-300",
    icon: "text-violet-500",
  },
  "Curso aberto Conecta": {
    light: "bg-cyan-50/80 hover:bg-cyan-100/80",
    dark: "dark:bg-cyan-900/20 dark:hover:bg-cyan-900/30",
    border: "border-cyan-200 dark:border-cyan-700/50",
    text: "text-cyan-700 dark:text-cyan-300",
    icon: "text-cyan-500",
  },
  "Curso InCompany JML": {
    light: "bg-purple-50/80 hover:bg-purple-100/80",
    dark: "dark:bg-purple-900/20 dark:hover:bg-purple-900/30",
    border: "border-purple-200 dark:border-purple-700/50",
    text: "text-purple-700 dark:text-purple-300",
    icon: "text-purple-500",
  },
  "Curso InCompany Conecta": {
    light: "bg-indigo-50/80 hover:bg-indigo-100/80",
    dark: "dark:bg-indigo-900/20 dark:hover:bg-indigo-900/30",
    border: "border-indigo-200 dark:border-indigo-700/50",
    text: "text-indigo-700 dark:text-indigo-300",
    icon: "text-indigo-500",
  },
  "Curso EAD JML": {
    light: "bg-emerald-50/80 hover:bg-emerald-100/80",
    dark: "dark:bg-emerald-900/20 dark:hover:bg-emerald-900/30",
    border: "border-emerald-200 dark:border-emerald-700/50",
    text: "text-emerald-700 dark:text-emerald-300",
    icon: "text-emerald-500",
  },
  "Curso Híbrido JML": {
    light: "bg-amber-50/80 hover:bg-amber-100/80",
    dark: "dark:bg-amber-900/20 dark:hover:bg-amber-900/30",
    border: "border-amber-200 dark:border-amber-700/50",
    text: "text-amber-700 dark:text-amber-300",
    icon: "text-amber-500",
  },
};

// Helper para normalizar comparações
const normalize = (str: string) => str?.toLowerCase().trim() || "";

export function SearchBar({ onSearch, placeholder, initialValue = "" }: SearchBarProps) {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSearching, setIsSearching] = useState(false); // Novo estado de loading
  const [searchResults, setSearchResults] = useState<CategorizedResults>({});
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Pegamos a função aiSearch agora!
  const { allCourses, aiSearch } = useSearch({ status: 'published' });

  const allTitles = useMemo(() => allCourses.map((c) => c.title), [allCourses]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const filtered = allTitles
      .filter((t) => t.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 5);
    setSuggestions(filtered);
  }, [query, allTitles]);

  const categoryOrder = Object.keys(categoryStyles);

  const categorize = (results: Course[]): CategorizedResults => {
    const base: CategorizedResults = {
      "Curso aberto JML": [],
      "Curso aberto Conecta": [],
      "Curso InCompany JML": [],
      "Curso InCompany Conecta": [],
      "Curso EAD JML": [],
      "Curso Híbrido JML": [],
    };

    results.forEach((c) => {
      const empresa = normalize(c.company);
      const tipo = normalize(c.course_type);
      
      // JML
      if (empresa === 'jml') {
        if (tipo.includes('aberto')) base["Curso aberto JML"].push(c);
        else if (tipo.includes('company')) base["Curso InCompany JML"].push(c);
        else if (tipo.includes('ead') || tipo.includes('online')) base["Curso EAD JML"].push(c);
        else if (tipo.includes('hibrido') || tipo.includes('híbrido')) base["Curso Híbrido JML"].push(c);
      } 
      // CONECTA
      else if (empresa === 'conecta') {
        if (tipo.includes('aberto')) base["Curso aberto Conecta"].push(c);
        else if (tipo.includes('company')) base["Curso InCompany Conecta"].push(c);
      }
    });

    return base;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanQuery = query.trim();

    // TRAVA DE SEGURANÇA: Mínimo 2 caracteres
    if (!cleanQuery || cleanQuery.length < 2) return;

    setIsExpanded(true);
    setShowSuggestions(false);
    setIsSearching(true); // Ativa loading

    try {
      // CHAMADA PARA IA (Backend)
      const aiResponse = await aiSearch(cleanQuery, {
        companies: [],
        course_types: [],
        segments: []
      });
      
      const resultsToUse = aiResponse.results.length > 0 ? aiResponse.results : []; 
      setSearchResults(categorize(resultsToUse));
    } catch (error) {
      console.error("Erro na busca", error);
      setSearchResults({});
    } finally {
      setIsSearching(false); // Desativa loading
    }
  };

  const handleClear = () => {
    setQuery("");
    setIsExpanded(false);
    setSearchResults({});
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    setTimeout(() => {
        const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
        handleSubmit(fakeEvent);
    }, 0);
  };

  const totalResults = Object.values(searchResults).flat().length;

  return (
    <div className="w-full max-w-full mx-auto relative z-50">
      
      <div className={cn(
        "relative transition-all duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]",
        isExpanded ? "-translate-y-4" : "translate-y-0"
      )}>
        <form onSubmit={handleSubmit} className="relative max-w-3xl mx-auto z-50">
          
          <div className={cn(
            "absolute -inset-1 rounded-full opacity-0 transition-opacity duration-500 blur-xl bg-gradient-to-r from-violet-500/30 via-cyan-500/30 to-emerald-500/30",
            (isFocused || isExpanded) && "opacity-100"
          )} />

          <div className={cn(
            "relative flex items-center p-1.5 rounded-full transition-all duration-300 border",
            "bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl",
            "border-slate-200 dark:border-slate-800",
            "shadow-lg dark:shadow-slate-950/50",
            isFocused ? "ring-2 ring-violet-500/20 border-violet-500/30 scale-[1.01]" : "hover:border-slate-300 dark:hover:border-slate-700"
          )}>
            
            <div className="pl-4 pr-3 text-slate-400 dark:text-slate-500">
              <Search className={cn("w-5 h-5 transition-colors", isFocused && "text-violet-500")} />
            </div>

            <Input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                setShowSuggestions(true);
                setIsFocused(true);
              }}
              onBlur={() => {
                setIsFocused(false);
                setTimeout(() => setShowSuggestions(false), 200);
              }}
              placeholder={placeholder || "O que você está procurando hoje?"}
              className="flex-1 border-none shadow-none text-base h-11 bg-transparent text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
            />

            {query && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleClear}
                className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-full w-8 h-8 mr-1 transition-colors"
              >
                <X className="h-4 w-4" />
              </Button>
            )}

            <Button
              type="submit"
              disabled={isSearching}
              className={cn(
                "rounded-full px-6 h-10 transition-all duration-300 shadow-md font-medium min-w-[80px]",
                "bg-slate-900 text-white hover:bg-slate-800",
                "dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
              )}
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : (isExpanded ? <Sparkles className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />)}
            </Button>
          </div>

          {showSuggestions && suggestions.length > 0 && !isExpanded && (
            <div className="absolute top-full left-4 right-4 mt-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  type="button" 
                  onMouseDown={(e) => e.preventDefault()} 
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-200 flex items-center justify-between group border-b border-slate-100 dark:border-slate-800 last:border-0"
                >
                  <span className="flex items-center gap-2">
                    <Search className="w-3.5 h-3.5 text-slate-400" />
                    {suggestion}
                  </span>
                  <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-violet-500" />
                </button>
              ))}
            </div>
          )}
        </form>
      </div>

      <div 
        className={cn(
          "transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden",
          isExpanded ? "opacity-100 max-h-[5000px] mt-8" : "opacity-0 max-h-0 mt-0"
        )}
      >
        <div className="space-y-12 pb-20">
          {categoryOrder.map((category, sectionIndex) => {
            const courses = searchResults[category] || [];
            if (courses.length === 0) return null;

            const style = categoryStyles[category];

            return (
              <div 
                key={category}
                className="space-y-4"
                style={{
                  animation: isExpanded
                    ? `fadeSlideRight 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) backwards ${sectionIndex * 0.1}s`
                    : "none",
                }}
              >
                <div className="flex items-center gap-3 px-2">
                   <div className={cn("w-1 h-6 rounded-full bg-current", style.text)} />
                   <h3 className={cn("text-lg font-bold tracking-tight", "text-slate-900 dark:text-white")}>
                     {category}
                   </h3>
                   <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full border bg-opacity-10 backdrop-blur-sm", style.text, style.border, style.dark)}>
                      {courses.length}
                   </span>
                </div>

                <div className="relative group/scroll">
                    <div className="flex gap-4 overflow-x-auto pb-6 px-2 snap-x snap-mandatory scrollbar-hide mask-fade-sides">
                        {courses.map((course, itemIndex) => (
                            <div 
                                key={course.id} 
                                className="snap-center shrink-0 w-[280px] md:w-[320px]"
                                style={{
                                    animation: isExpanded
                                      ? `popIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) backwards ${sectionIndex * 0.1 + itemIndex * 0.05 + 0.3}s`
                                      : "none",
                                }}
                            >
                                <Card
                                  onClick={() => onSearch(course.title)}
                                  className={cn(
                                    "h-full relative bg-white dark:bg-slate-900 border transition-all duration-500 cursor-pointer overflow-hidden isolate hover:-translate-y-2 group/card",
                                    style.border,
                                    "shadow-sm hover:shadow-xl dark:shadow-none"
                                  )}
                                >
                                    <div className={cn("absolute inset-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-transparent to-current/5", style.text)} />
                                    
                                    <div className="p-5 flex flex-col gap-3 h-full">
                                        <div className="flex justify-between items-start gap-2">
                                            <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-snug group-hover/card:text-violet-600 dark:group-hover/card:text-violet-400 transition-colors line-clamp-2">
                                                {course.title}
                                            </h4>
                                        </div>

                                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-auto">
                                            {course.summary || "Sem descrição disponível para este curso."}
                                        </p>

                                        {/* Match Reason (IA) */}
                                        {course.matchReason && course.matchReason.includes('IA') && (
                                            <div className="mt-2 px-2 py-1 rounded bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800 w-fit">
                                                <p className="text-[10px] text-violet-600 dark:text-violet-300 font-medium flex items-center gap-1">
                                                    <Sparkles className="w-3 h-3" />
                                                    Recomendação Inteligente
                                                </p>
                                            </div>
                                        )}

                                        <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400 uppercase">
                                                    <Clock className="w-3 h-3" />
                                                    {course.duration_hours}h
                                                </div>
                                            </div>
                                            <div className={cn("w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-all -translate-x-2 group-hover/card:translate-x-0 bg-slate-100 dark:bg-slate-800", style.text)}>
                                                <ArrowRight className="w-3 h-3" />
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        ))}
                         
                         {courses.length > 5 && (
                             <div className="snap-center shrink-0 w-[150px] flex items-center justify-center">
                                 <button onClick={() => onSearch(query)} className="group flex flex-col items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                                     <div className="w-12 h-12 rounded-full border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center group-hover:border-slate-900 dark:group-hover:border-white transition-colors">
                                         <ArrowRight className="w-5 h-5" />
                                     </div>
                                     Ver tudo
                                 </button>
                             </div>
                         )}
                    </div>
                </div>
              </div>
            );
          })}
        </div>

        {totalResults === 0 && isExpanded && !isSearching && (
             <div className="text-center py-20 animate-in fade-in zoom-in-95 duration-500">
                 <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                     <Search className="w-8 h-8 text-slate-400" />
                 </div>
                 <h3 className="text-lg font-medium text-slate-900 dark:text-white">Nenhum resultado encontrado</h3>
                 <p className="text-slate-500 dark:text-slate-400">Tente buscar por outros termos ou categorias.</p>
             </div>
        )}
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
        @keyframes fadeSlideRight {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes popIn {
          0% { opacity: 0; transform: scale(0.9); }
          60% { transform: scale(1.02); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}