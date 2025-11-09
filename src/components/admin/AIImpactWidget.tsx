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
  Sparkles,
  Timer,
  CheckCircle2,
  BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AIImpactWidgetProps {
  className?: string;
}

// Dados simulados de impacto da IA
const mockAIData = {
  coursesCreatedByAI: 234,
  totalCourses: 847,
  timesSaved: 2890, // minutos
  accuracyRate: 87.3,
  errorReduction: 94.2,
  productivityGain: 920, // percentual
  processingSpeed: 3.2, // segundos médios
  userSatisfaction: 4.8,
  trendsData: [
    { month: 'Jan', aiCourses: 12, manualCourses: 45, timeSaved: 180 },
    { month: 'Fev', aiCourses: 28, manualCourses: 38, timeSaved: 420 },
    { month: 'Mar', aiCourses: 45, manualCourses: 32, timeSaved: 675 },
    { month: 'Abr', aiCourses: 62, manualCourses: 28, timeSaved: 930 },
    { month: 'Mai', aiCourses: 87, manualCourses: 15, timeSaved: 1305 },
  ]
};

export function AIImpactWidget({ className }: AIImpactWidgetProps) {
  const [animatedValues, setAnimatedValues] = useState({
    courses: 0,
    timeSaved: 0,
    accuracy: 0,
    productivity: 0
  });

  // Animação dos números
  useEffect(() => {
    const intervals: NodeJS.Timeout[] = [];

    // Animar cursos criados
    let coursesCurrent = 0;
    const coursesInterval = setInterval(() => {
      coursesCurrent += Math.ceil(mockAIData.coursesCreatedByAI / 50);
      if (coursesCurrent >= mockAIData.coursesCreatedByAI) {
        coursesCurrent = mockAIData.coursesCreatedByAI;
        clearInterval(coursesInterval);
      }
      setAnimatedValues(prev => ({ ...prev, courses: coursesCurrent }));
    }, 50);
    intervals.push(coursesInterval);

    // Animar tempo economizado
    let timeCurrent = 0;
    const timeInterval = setInterval(() => {
      timeCurrent += Math.ceil(mockAIData.timesSaved / 30);
      if (timeCurrent >= mockAIData.timesSaved) {
        timeCurrent = mockAIData.timesSaved;
        clearInterval(timeInterval);
      }
      setAnimatedValues(prev => ({ ...prev, timeSaved: timeCurrent }));
    }, 80);
    intervals.push(timeInterval);

    // Animar accuracy
    let accuracyCurrent = 0;
    const accuracyInterval = setInterval(() => {
      accuracyCurrent += mockAIData.accuracyRate / 40;
      if (accuracyCurrent >= mockAIData.accuracyRate) {
        accuracyCurrent = mockAIData.accuracyRate;
        clearInterval(accuracyInterval);
      }
      setAnimatedValues(prev => ({ ...prev, accuracy: accuracyCurrent }));
    }, 60);
    intervals.push(accuracyInterval);

    // Animar produtividade
    let prodCurrent = 0;
    const prodInterval = setInterval(() => {
      prodCurrent += mockAIData.productivityGain / 35;
      if (prodCurrent >= mockAIData.productivityGain) {
        prodCurrent = mockAIData.productivityGain;
        clearInterval(prodInterval);
      }
      setAnimatedValues(prev => ({ ...prev, productivity: prodCurrent }));
    }, 70);
    intervals.push(prodInterval);

    return () => intervals.forEach(clearInterval);
  }, []);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const aiAdoptionRate = (mockAIData.coursesCreatedByAI / mockAIData.totalCourses) * 100;

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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-4 bg-white/50 dark:bg-gray-900/50 rounded-lg border">
          <div className="text-2xl font-bold text-purple-600 mb-1">
            {animatedValues.courses}
          </div>
          <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            <Brain className="h-3 w-3" />
            Cursos IA
          </div>
        </div>

        <div className="text-center p-4 bg-white/50 dark:bg-gray-900/50 rounded-lg border">
          <div className="text-2xl font-bold text-green-600 mb-1">
            {formatTime(animatedValues.timeSaved)}
          </div>
          <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            <Clock className="h-3 w-3" />
            Economizados
          </div>
        </div>

        <div className="text-center p-4 bg-white/50 dark:bg-gray-900/50 rounded-lg border">
          <div className="text-2xl font-bold text-blue-600 mb-1">
            {animatedValues.accuracy.toFixed(1)}%
          </div>
          <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            <Target className="h-3 w-3" />
            Precisão
          </div>
        </div>

        <div className="text-center p-4 bg-white/50 dark:bg-gray-900/50 rounded-lg border">
          <div className="text-2xl font-bold text-orange-600 mb-1">
            +{Math.round(animatedValues.productivity)}%
          </div>
          <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            <Zap className="h-3 w-3" />
            Produtividade
          </div>
        </div>
      </div>

      {/* Progress Indicators */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Adoção da IA
            </span>
            <span className="font-medium">{Math.round(aiAdoptionRate)}%</span>
          </div>
          <Progress value={aiAdoptionRate} className="h-2 bg-gray-200" />
        </div>

        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="flex items-center gap-2">
              <Award className="h-4 w-4 text-purple-600" />
              Qualidade dos Dados
            </span>
            <span className="font-medium">{mockAIData.accuracyRate}%</span>
          </div>
          <Progress value={mockAIData.accuracyRate} className="h-2 bg-gray-200" />
        </div>

        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-blue-600" />
              Redução de Erros
            </span>
            <span className="font-medium">{mockAIData.errorReduction}%</span>
          </div>
          <Progress value={mockAIData.errorReduction} className="h-2 bg-gray-200" />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-6 pt-4 border-t border-purple-200/50">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-purple-600">
              {mockAIData.processingSpeed}s
            </div>
            <div className="text-xs text-muted-foreground">Velocidade</div>
          </div>
          <div>
            <div className="text-lg font-bold text-green-600">
              {mockAIData.userSatisfaction}/5
            </div>
            <div className="text-xs text-muted-foreground">Satisfação</div>
          </div>
          <div>
            <div className="text-lg font-bold text-blue-600">
              24/7
            </div>
            <div className="text-xs text-muted-foreground">Disponível</div>
          </div>
        </div>
      </div>

      {/* Trend Mini Chart */}
      <div className="mt-6 pt-4 border-t border-purple-200/50">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="h-4 w-4 text-purple-600" />
          <span className="text-sm font-medium">Evolução Mensal</span>
        </div>
        <div className="flex items-end gap-2 h-16">
          {mockAIData.trendsData.map((month, index) => {
            const total = month.aiCourses + month.manualCourses;
            const aiPercentage = (month.aiCourses / total) * 100;
            const height = (aiPercentage / 100) * 100;
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-gray-200 rounded-sm h-12 flex flex-col justify-end overflow-hidden">
                  <div 
                    className="bg-gradient-to-t from-purple-600 to-pink-600 transition-all duration-1000"
                    style={{ height: `${height}%` }}
                  ></div>
                </div>
                <span className="text-xs text-muted-foreground">{month.month}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Call to Action */}
      <div className="mt-6 p-4 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg border border-purple-200 dark:border-purple-700">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-purple-900 dark:text-purple-100">
              🚀 Continue usando a IA!
            </div>
            <div className="text-xs text-purple-600 dark:text-purple-300">
              Cada PDF processado melhora ainda mais o sistema
            </div>
          </div>
          <div className="text-2xl">🎯</div>
        </div>
      </div>
    </Card>
  );
}
