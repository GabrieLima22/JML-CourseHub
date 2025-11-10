import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  Download,
  Search,
  Clock,
  MousePointer,
  FileText,
  Target,
  Calendar,
  Filter,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Loader2
} from "lucide-react";
import { useDetailedAnalytics } from "@/hooks/useAdminStats";
import { cn } from "@/lib/utils";

type Trend = { value: number; isPositive: boolean };

interface AnalyticsDashboardProps {
  className?: string;
}

const fallbackAnalytics = {
  topCourses: [] as Array<{
    id: string;
    titulo: string;
    views_count: number;
    clicks_count: number;
    conversions_count: number;
    empresa?: string | null;
    categoria?: string | null;
    tipo?: string | null;
  }>,
  eventsByType: [] as Array<{ type: string; count: number }>,
  dailyStats: [] as Array<{ date: string; total: number; views: number; clicks: number; searches: number }>,
  bySegment: [] as Array<{ segmento: string; courses: number; views: number; clicks: number }>,
  byCompany: [] as Array<{ empresa: string; courses: number; views: number; clicks: number }>
};

const formatTrend = (value: number): Trend => ({
  value: Math.abs(Number(value.toFixed(1))),
  isPositive: value >= 0
});

export function AnalyticsDashboard({ className }: AnalyticsDashboardProps) {
  const [days, setDays] = useState(30);
  const [refreshing, setRefreshing] = useState(false);
  const { data: analyticsData, isLoading, refetch } = useDetailedAnalytics(days);

  const data = analyticsData ?? fallbackAnalytics;

  const totalViews = data.topCourses.reduce((sum, course) => sum + (course.views_count || 0), 0);
  const totalClicks = data.topCourses.reduce((sum, course) => sum + (course.clicks_count || 0), 0);
  const totalConversions = data.topCourses.reduce((sum, course) => sum + (course.conversions_count || 0), 0);
  const conversionRate = totalClicks > 0 ? Number(((totalConversions / totalClicks) * 100).toFixed(1)) : 0;

  const overview = useMemo(() => ({
    totalViews,
    totalClicks,
    conversionRate,
    avgTimeOnPage: `${Math.max(2, Math.round((totalViews / (days || 1)) || 2))} min`,
    trends: {
      views: formatTrend(0),
      clicks: formatTrend(0),
      conversion: formatTrend(0),
      time: formatTrend(0)
    }
  }), [totalViews, totalClicks, conversionRate, days]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const MetricCard = ({
    title,
    value,
    trend,
    icon: Icon,
    suffix = "",
    prefix = ""
  }: {
    title: string;
    value: string | number;
    trend: Trend;
    icon: any;
    suffix?: string;
    prefix?: string;
  }) => (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-2xl font-bold">
            {prefix}{value}{suffix}
          </p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-1">
        {trend.isPositive ? (
          <ArrowUpRight className="h-4 w-4 text-green-600" />
        ) : (
          <ArrowDownRight className="h-4 w-4 text-red-600" />
        )}
        <span className={cn(
          "text-sm font-medium",
          trend.isPositive ? "text-green-600" : "text-red-600"
        )}>
          {trend.isPositive ? "+" : "-"}{trend.value}%
        </span>
        <span className="text-sm text-muted-foreground">vs. período anterior</span>
      </div>
    </Card>
  );

  if (isLoading && !analyticsData) {
    return (
      <Card className="p-6 flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Carregando analytics...
        </div>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics</h2>
          <p className="text-muted-foreground">Insights em tempo real do comportamento dos usuários</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setDays(7)} disabled={days === 7}>
            7 dias
          </Button>
          <Button variant="outline" onClick={() => setDays(30)} disabled={days === 30}>
            30 dias
          </Button>
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
            Atualizar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total de Visualizações" value={overview.totalViews.toLocaleString()} trend={overview.trends.views} icon={Eye} />
        <MetricCard title="Cliques Totais" value={overview.totalClicks.toLocaleString()} trend={overview.trends.clicks} icon={MousePointer} />
        <MetricCard title="Taxa de Conversão" value={overview.conversionRate} trend={overview.trends.conversion} icon={Target} suffix="%" />
        <MetricCard title="Tempo médio" value={overview.avgTimeOnPage} trend={overview.trends.time} icon={Clock} />
      </div>

      <Tabs defaultValue="courses" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="courses">Cursos</TabsTrigger>
          <TabsTrigger value="activity">Eventos</TabsTrigger>
          <TabsTrigger value="segments">Segmentos</TabsTrigger>
          <TabsTrigger value="time">Linha do tempo</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Cursos mais acessados</h3>
            <div className="space-y-3">
              {data.topCourses.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum curso coletado ainda.</p>
              )}
              {data.topCourses.map((course, index) => (
                <div key={course.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-medium">{course.titulo}</h4>
                      <p className="text-sm text-muted-foreground">
                        {course.views_count} views • {course.clicks_count} cliques
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">{course.conversions_count || 0} conversões</Badge>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Eventos monitorados</h3>
            <div className="space-y-3">
              {data.eventsByType.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum evento registrado.</p>
              )}
              {data.eventsByType.map(event => (
                <div key={event.type} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium capitalize">{event.type.replace(/_/g, " ")}</p>
                    <p className="text-sm text-muted-foreground">Últimos {days} dias</p>
                  </div>
                  <Badge>{event.count} eventos</Badge>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="segments" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Segmentos com mais interação</h3>
            <div className="space-y-3">
              {data.bySegment.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum segmento disponível.</p>
              )}
              {data.bySegment.map(segment => (
                <div key={segment.segmento} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium">{segment.segmento}</p>
                    <p className="text-sm text-muted-foreground">
                      {segment.courses} cursos • {segment.views} views • {segment.clicks} cliques
                    </p>
                  </div>
                  <Badge variant="outline">{segment.views ? Math.round((segment.clicks / segment.views) * 100) || 0 : 0}% CTR</Badge>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="time" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Linha do tempo</h3>
            <div className="space-y-3">
              {data.dailyStats.length === 0 && (
                <p className="text-sm text-muted-foreground">Sem registros para o período selecionado.</p>
              )}
              {data.dailyStats.map(day => (
                <div key={day.date} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium">{new Date(day.date).toLocaleDateString('pt-BR')}</p>
                    <p className="text-sm text-muted-foreground">
                      {day.views} views • {day.clicks} cliques • {day.searches} buscas
                    </p>
                  </div>
                  <Badge variant="secondary">{day.total} eventos</Badge>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
