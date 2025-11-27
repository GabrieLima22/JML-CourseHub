import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X, ArrowRight, Sparkles, ChevronRight, Clock, BarChart } from "lucide-react";
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

const categoryStyles: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  "Curso aberto JML": {
    bg: "bg-violet-50/50 hover:bg-violet-50",
    border: "border-violet-200",
    text: "text-violet-700",
    icon: "text-violet-500",
  },
  "Curso aberto Conecta": {
    bg: "bg-cyan-50/50 hover:bg-cyan-50",
    border: "border-cyan-200",
    text: "text-cyan-700",
    icon: "text-cyan-500",
  },
  "Curso InCompany JML": {
    bg: "bg-purple-50/50 hover:bg-purple-50",
    border: "border-purple-200",
    text: "text-purple-700",
    icon: "text-purple-500",
  },
  "Curso InCompany Conecta": {
    bg: "bg-indigo-50/50 hover:bg-indigo-50",
    border: "border-indigo-200",
    text: "text-indigo-700",
    icon: "text-indigo-500",
  },
  "Curso EAD JML": {
    bg: "bg-emerald-50/50 hover:bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    icon: "text-emerald-500",
  },
  "Curso Híbrido JML": {
    bg: "bg-amber-50/50 hover:bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    icon: "text-amber-500",
  },
};

export function SearchBar({ onSearch, placeholder, initialValue = "" }: SearchBarProps) {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchResults, setSearchResults] = useState<CategorizedResults>({});
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { allCourses, search } = useSearch();

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
      if (c.modality.includes("Curso aberto JML")) base["Curso aberto JML"].push(c);
      if (c.modality.includes("Curso aberto Conecta")) base["Curso aberto Conecta"].push(c);
      if (c.modality.includes("Curso InCompany JML")) base["Curso InCompany JML"].push(c);
      if (c.modality.includes("Curso InCompany Conecta")) base["Curso InCompany Conecta"].push(c);
      if (c.modality.includes("Curso EAD JML")) base["Curso EAD JML"].push(c);
      if (c.modality.includes("Curso Híbrido JML")) base["Curso Híbrido JML"].push(c);
    });
    return base;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsExpanded(true);
    setShowSuggestions(false);

    const results = search(query, {
      companies: [],
      course_types: [],
      segments: [],
      levels: [],
    });
    const resultsToUse = results.length > 0 ? results : allCourses;
    setSearchResults(categorize(resultsToUse));
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
    const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
    handleSubmit(fakeEvent);
  };

  const totalResults = Object.values(searchResults).flat().length;

  return (
    <div className="w-full max-w-full mx-auto px-6 py-4 relative z-50">
      {/* Área da barra de busca com glow e elasticidade */}
      <div className="relative transition-all duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]">

        <form onSubmit={handleSubmit} className="relative max-w-2xl mx-auto z-50">
          <div className="relative group">
            {/* Glow */}
            <div
              className={`pointer-events-none absolute -inset-1 bg-gradient-to-r from-violet-500 via-blue-500 to-emerald-500 rounded-2xl blur-md transition duration-400 ${
                isExpanded || isFocused ? "opacity-60" : "opacity-25"
              }`}
            />

            <div className="relative bg-white rounded-2xl shadow-xl border border-slate-100 flex items-center p-2">
              <div className="pl-4 pr-3 text-slate-400">
                <Search className="w-6 h-6" />
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
                placeholder={placeholder || "Digite um tema, ex: Licitação..."}
                className="flex-1 border-none shadow-none text-lg h-12 bg-transparent text-slate-800 placeholder:text-slate-500 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
              />

              {query && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleClear}
                  className="text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl mr-1"
                >
                  <X className="h-5 w-5" />
                </Button>
              )}

              <Button
                type="submit"
                className="rounded-xl px-6 h-12 bg-slate-900 text-white hover:bg-slate-800 transition-all duration-300 shadow-lg hover:shadow-slate-900/20 active:scale-95"
              >
                Buscar
              </Button>
            </div>
          </div>

          {showSuggestions && suggestions.length > 0 && !isExpanded && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white/90 backdrop-blur-xl rounded-xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-5 py-3 hover:bg-slate-50 transition-colors text-slate-700 flex items-center justify-between group"
                >
                  <span>{suggestion}</span>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-violet-500" />
                </button>
              ))}
            </div>
          )}
        </form>
      </div>

      {/* Resultados animados */}
      <div className={`grid transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${isExpanded ? "grid-rows-[1fr] opacity-100 mt-12" : "grid-rows-[0fr] opacity-0 mt-0"}`}>
        <div className="overflow-hidden min-h-0">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4 pb-12 w-full items-start">
            {categoryOrder.map((category, colIndex) => {
              const courses = searchResults[category] || [];
              const style = categoryStyles[category] || {
                bg: "bg-slate-50",
                border: "border-slate-200",
                text: "text-slate-700",
                icon: "text-slate-500",
              };

              return (
                <div
                  key={category}
                  className={`rounded-3xl border ${style.border} ${style.bg} p-1 backdrop-blur-sm`}
                  style={{
                    animation: isExpanded
                      ? `columnEnter 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) backwards ${colIndex * 0.1}s`
                      : "none",
                  }}
                >
                  <div className="px-5 py-4 flex items-center justify-between border-b border-white/40 mb-2">
                    <h3 className={cn("font-semibold text-base flex items-center gap-2", style.text)}>
                      <span className="w-2 h-2 rounded-full bg-current opacity-60" />
                      {category}
                    </h3>
                    <span className={cn("text-xs font-bold px-2 py-1 rounded-full bg-white/60", style.text)}>
                      {courses.length}
                    </span>
                  </div>

                  <div className="space-y-2 p-2 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
                    {courses.slice(0, 6).map((course, itemIndex) => (
                      <div
                        key={course.id}
                        style={{
                          animation: isExpanded
                            ? `cardElasticPop 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) backwards ${
                                colIndex * 0.15 + itemIndex * 0.1 + 0.3
                              }s`
                            : "none",
                        }}
                      >
                        <Card
                          onClick={() => onSearch(course.title)}
                          className="group relative bg-white rounded-2xl p-4 border border-transparent shadow-sm hover:shadow-lg hover:border-slate-200 transition-all duration-500 cursor-pointer overflow-hidden isolate hover:-translate-y-1"
                        >
                          <div className={cn("absolute left-0 top-0 bottom-0 w-1 bg-current opacity-0 group-hover:opacity-100 transition-opacity duration-300", style.text)} />

                          <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-start gap-3">
                              <h4 className="font-semibold text-slate-800 text-sm leading-snug group-hover:text-slate-900 line-clamp-2 transition-colors">
                                {course.title}
                              </h4>
                              <ChevronRight className={cn("w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300 shrink-0", style.text)} />
                            </div>

                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                              {course.summary || "Sem descrição disponível"}
                            </p>

                            <div className="flex items-center gap-3 mt-2 pt-2 border-t border-slate-50">
                              <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400 uppercase tracking-wide">
                                <Clock className="w-3 h-3" />
                                {course.duration_hours}h
                              </div>

                              {course.level && (
                                <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400 uppercase tracking-wide">
                                  <BarChart className="w-3 h-3" />
                                  {course.level}
                                </div>
                              )}

                              <span className="ml-auto text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                                {course.company}
                              </span>
                            </div>
                          </div>
                        </Card>
                      </div>
                    ))}

                    {courses.length === 0 && (
                      <div className="px-4 py-6 text-sm text-slate-500 text-center">
                        Nenhum curso nesta categoria.
                      </div>
                    )}

                    {courses.length > 6 && (
                      <button
                        onClick={() => onSearch(query)}
                        className={cn(
                          "w-full py-3 text-xs font-medium uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2 group",
                          style.text
                        )}
                        style={{
                          animation: isExpanded ? `fadeIn 0.5s backwards ${colIndex * 0.15 + 0.8}s` : "none",
                        }}
                      >
                        Ver mais {courses.length - 6} opções
                        <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {totalResults > 0 && (
            <div
              className="flex justify-center"
              style={{
                animation: isExpanded ? "floatUp 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) backwards 1.4s" : "none",
              }}
            >
              <Button
                onClick={() => onSearch(query)}
                size="lg"
                className="bg-slate-900 text-white hover:bg-slate-800 rounded-full px-8 shadow-2xl hover:scale-105 transition-transform duration-300"
              >
                Visualizar detalhamento completo
              </Button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes columnEnter {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes cardElasticPop {
          0% { opacity: 0; transform: translateY(40px) scale(0.9); filter: blur(8px); }
          60% { opacity: 1; filter: blur(0px); }
          100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }

        @keyframes floatUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
