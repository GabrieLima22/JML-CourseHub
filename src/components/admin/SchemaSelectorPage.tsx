// src/components/admin/SchemaSelectorPage.tsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Crown,
  Zap,
  ChevronRight,
  Settings2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { apiGet } from "@/services/api";
import { cn } from "@/lib/utils";

export function SchemaSelectorPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Busca simples de cursos (apenas ID, título, empresa e status)
    const fetchCourses = async () => {
      try {
        const res: any = await apiGet("/api/courses?limit=100");
        const list =
          res?.data?.courses ??
          res?.courses ??
          res?.data ??
          [];
        setCourses(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error(err);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const filtered = courses.filter((c) => {
    const term = searchTerm.toLowerCase();
    const title = (c.title || c.titulo || "").toLowerCase();
    const company = (c.empresa || "").toLowerCase();
    return title.includes(term) || company.includes(term);
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090b] p-8 animate-in fade-in duration-300">
      {/* Header da Página */}
      <div className="max-w-5xl mx-auto mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/admin/config")}
          className="mb-4 pl-0 hover:bg-transparent hover:text-violet-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para Configurações
        </Button>

        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <Settings2 className="w-8 h-8 text-violet-600" />
              Gestor de Estruturas
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
              Selecione um curso abaixo para editar seus{" "}
              <strong>campos personalizados</strong> e layout.
            </p>
          </div>
        </div>
      </div>

      {/* Área de Busca e Lista */}
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Barra de Busca */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <Input
            className="h-14 pl-12 text-lg bg-white dark:bg-[#111623] border-slate-200 dark:border-slate-800 shadow-sm rounded-xl"
            placeholder="Buscar curso por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Grid de Cursos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            // Skeleton loading
            [1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"
              />
            ))
          ) : (
            filtered.map((course) => (
              <Card
                key={course.id}
                onClick={() => navigate(`/admin/fields/${course.id}`)}
                className="group relative p-6 cursor-pointer hover:border-violet-500/50 hover:shadow-lg transition-all duration-300 bg-white dark:bg-[#111623] border-slate-200 dark:border-slate-800 overflow-hidden"
              >
                {/* Efeito Hover Fundo */}
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="flex items-start justify-between mb-4 relative z-10">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center shadow-inner",
                      course.empresa === "JML"
                        ? "bg-violet-100 text-violet-600"
                        : "bg-emerald-100 text-emerald-600"
                    )}
                  >
                    {course.empresa === "JML" ? (
                      <Crown size={20} />
                    ) : (
                      <Zap size={20} />
                    )}
                  </div>
                  {/* Indicador se já tem campos customizados */}
                  {Array.isArray(course.custom_fields) &&
                    course.custom_fields.length > 0 && (
                      <Badge
                        variant="secondary"
                        className="bg-violet-50 text-violet-700 border-violet-100"
                      >
                        <Sparkles className="w-3 h-3 mr-1" /> Personalizado
                      </Badge>
                    )}
                </div>

                <div className="relative z-10">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1 line-clamp-1 group-hover:text-violet-600 transition-colors">
                    {course.title || course.titulo}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    {course.empresa} ·{" "}
                    {course.modality?.[0] || course.tipo || "Geral"}
                  </p>

                  <div className="flex items-center text-sm font-medium text-violet-600 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                    Editar Estrutura <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
