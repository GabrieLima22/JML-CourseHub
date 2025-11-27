import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Brain,
  Clock,
  Zap,
  TrendingUp,
  Target,
  Award,
  FileText,
  Sparkles,
  Timer,
  CheckCircle2,
  BarChart3,
  Loader2
} from "lucide-react";
import { useAIMetrics } from "@/hooks/useAdminStats";
import { cn } from "@/lib/utils";

interface AIImpactWidgetProps {
  className?: string;
}

export function AIImpactWidget({ className }: AIImpactWidgetProps) {
  // Buscar dados REAIS da API
  const { data: aiMetrics, isLoading } = useAIMetrics();

  const [animatedValues, setAnimatedValues] = useState({
    courses: 0,
    uploads: 0,
    confidence: 0
  });

  // Animação dos números quando os dados forem carregados
  useEffect(() => {
    if (!aiMetrics) return;

    const intervals: NodeJS.Timeout[] = [];

    // Animar cursos criados
    let coursesCurrent = 0;
    const coursesTarget = aiMetrics.overview.coursesCreatedByAI;
    const coursesInterval = setInterval(() => {
      coursesCurrent += Math.ceil(coursesTarget / 50);
      if (coursesCurrent >= coursesTarget) {
        coursesCurrent = coursesTarget;
        clearInterval(coursesInterval);
      }
      setAnimatedValues(prev => ({ ...prev, courses: coursesCurrent }));
    }, 50);
    intervals.push(coursesInterval);

    // Animar uploads completados
    let uploadsCurrent = 0;
    const uploadsTarget = aiMetrics.overview.completedUploads;
    const uploadsInterval = setInterval(() => {
      uploadsCurrent += Math.ceil(uploadsTarget / 40);
      if (uploadsCurrent >= uploadsTarget) {
        uploadsCurrent = uploadsTarget;
        clearInterval(uploadsInterval);
      }
      setAnimatedValues(prev => ({ ...prev, uploads: uploadsCurrent }));
    }, 60);
    intervals.push(uploadsInterval);

    // Animar confiança média
    let confidenceCurrent = 0;
    const confidenceTarget = aiMetrics.performance.avgConfidence;
    const confidenceInterval = setInterval(() => {
      confidenceCurrent += confidenceTarget / 40;
      if (confidenceCurrent >= confidenceTarget) {
        confidenceCurrent = confidenceTarget;
        clearInterval(confidenceInterval);
      }
      setAnimatedValues(prev => ({ ...prev, confidence: confidenceCurrent }));
    }, 60);
    intervals.push(confidenceInterval);

    return () => intervals.forEach(clearInterval);
  }, [aiMetrics]);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Loading state
  if (isLoading || !aiMetrics) {
    return (
      <Card className={cn("p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800", className)}>
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            <p className="text-sm text-muted-foreground">Carregando métricas de IA...</p>
          </div>
        </div>
      </Card>
    );
  }

  const aiAdoptionRate = parseFloat(aiMetrics.overview.percentage);

  return (
    <Card className={cn("p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800", className)}>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl">
          <Brain className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-lg flex items-center gap-2">
            Impacto da IA
            <Sparkles className="h-4 w-4 text-purple-600" />
          </h3>
          <p className="text-sm text-muted-foreground">
            Transformação digital em números
          </p>
        </div>
        <div className="ml-auto">
          <Badge className="bg-purple-100 text-purple-700 border-purple-200">
            <TrendingUp className="h-3 w-3 mr-1" />
            +{Math.round(aiAdoptionRate)}% IA
          </Badge>
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 rounded-xl border-2 border-purple-200 dark:border-purple-800">
          <Brain className="h-8 w-8 mx-auto mb-3 text-purple-600" />
          <div className="text-4xl font-bold text-purple-700 dark:text-purple-300 mb-2">
            {animatedValues.courses}
          </div>
          <div className="text-sm font-medium text-purple-600 dark:text-purple-400">
            Cursos criados com IA
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            de {aiMetrics?.overview.totalCourses || 0} cursos totais
          </div>
        </div>

        <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 rounded-xl border-2 border-blue-200 dark:border-blue-800">
          <FileText className="h-8 w-8 mx-auto mb-3 text-blue-600" />
          <div className="text-4xl font-bold text-blue-700 dark:text-blue-300 mb-2">
            {animatedValues.uploads}
          </div>
          <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
            PDFs processados
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {aiMetrics?.overview.totalUploads || 0} uploads totais
          </div>
        </div>

        <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 rounded-xl border-2 border-green-200 dark:border-green-800">
          <Award className="h-8 w-8 mx-auto mb-3 text-green-600" />
          <div className="text-4xl font-bold text-green-700 dark:text-green-300 mb-2">
            {animatedValues.confidence.toFixed(1)}%
          </div>
          <div className="text-sm font-medium text-green-600 dark:text-green-400">
            Confiança média da IA
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Taxa de precisão na extração
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="mb-6">
        <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-xl border border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between mb-3">
            <span className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-purple-600" />
              Taxa de Adoção da IA
            </span>
            <span className="text-2xl font-bold text-purple-700 dark:text-purple-300">{Math.round(aiAdoptionRate)}%</span>
          </div>
          <Progress value={aiAdoptionRate} className="h-3 bg-purple-200/50" />
          <p className="text-xs text-muted-foreground mt-2">
            {animatedValues.courses} de {aiMetrics?.overview.totalCourses || 0} cursos foram criados com extração automática de PDFs
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-6 pt-6 border-t-2 border-purple-200/50">
        <h4 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Estatísticas Gerais
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-white/60 dark:bg-gray-900/60 rounded-lg border">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {aiMetrics.overview.totalUploads}
            </div>
            <div className="text-xs text-muted-foreground">Total de Uploads</div>
          </div>
          <div className="p-4 bg-white/60 dark:bg-gray-900/60 rounded-lg border">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {aiMetrics.overview.completedUploads}
            </div>
            <div className="text-xs text-muted-foreground">Processados</div>
          </div>
          <div className="p-4 bg-white/60 dark:bg-gray-900/60 rounded-lg border">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {aiMetrics.overview.pendingUploads}
            </div>
            <div className="text-xs text-muted-foreground">Pendentes</div>
          </div>
          <div className="p-4 bg-white/60 dark:bg-gray-900/60 rounded-lg border">
            <div className="text-2xl font-bold text-orange-600 mb-1">
              {aiMetrics.overview.processingUploads}
            </div>
            <div className="text-xs text-muted-foreground">Processando</div>
          </div>
        </div>
      </div>

      {/* Trend Mini Chart */}
      <div className="mt-6 pt-6 border-t-2 border-purple-200/50">
        <h4 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Evolução Mensal de Uploads
        </h4>
        <div className="flex items-end gap-3 h-32 px-2">
          {aiMetrics.trends && aiMetrics.trends.length > 0 ? (
            aiMetrics.trends.map((trend, index) => {
              const maxUploads = Math.max(...aiMetrics.trends.map(t => t.uploads), 1);
              const height = (trend.uploads / maxUploads) * 100;
              const monthName = new Date(trend.month).toLocaleDateString('pt-BR', { month: 'short' });

              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="w-full bg-gradient-to-t from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-t-lg h-24 flex flex-col justify-end overflow-hidden relative transition-all hover:shadow-lg">
                    <div
                      className="bg-gradient-to-t from-purple-600 via-purple-500 to-pink-500 transition-all duration-700 ease-out group-hover:from-purple-700 group-hover:to-pink-600"
                      style={{ height: `${Math.max(height, 5)}%` }}
                      title={`${trend.uploads} uploads`}
                    ></div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs font-bold text-white bg-black/50 px-2 py-1 rounded">
                        {trend.uploads}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground capitalize">{monthName}</span>
                </div>
              );
            })
          ) : (
            <div className="w-full text-center py-8">
              <BarChart3 className="h-12 w-12 mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-muted-foreground">Sem dados de tendências ainda</p>
            </div>
          )}
        </div>
      </div>

      {/* Call to Action */}
      <div className="mt-8 p-6 bg-gradient-to-r from-purple-100 via-pink-100 to-purple-100 dark:from-purple-900/40 dark:via-pink-900/40 dark:to-purple-900/40 rounded-xl border-2 border-purple-300 dark:border-purple-700 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="text-base font-bold text-purple-900 dark:text-purple-100 mb-1">
              Continue usando a IA para criar cursos!
            </div>
            <div className="text-sm text-purple-700 dark:text-purple-300">
              Cada PDF processado enriquece nossa base de conhecimento e melhora a precisão do sistema
            </div>
          </div>
          <div className="flex-shrink-0">
            <TrendingUp className="h-8 w-8 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
      </div>
    </Card>
  );
}
