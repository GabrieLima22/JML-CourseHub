import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  Eye,
  MousePointer,
  Search,
  Target,
  TrendingUp,
  Users,
  Loader2,
  Building,
  Layers
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, Tooltip } from "recharts";
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

const trendFromSeries = (series: Array<{ [key: string]: number }>, key: string): Trend => {
  if (!series || series.length < 2) return { value: 0, isPositive: true };
  const curr = series[series.length - 1][key] || 0;
  const prev = series[series.length - 2][key] || 0;
  if (prev === 0) {
    return { value: curr === 0 ? 0 : 100, isPositive: curr >= prev };
  }
  const percentage = ((curr - prev) / prev) * 100;
  return { value: Math.abs(Number(percentage.toFixed(1))), isPositive: percentage >= 0 };
};

const formatDateLabel = (value: string | Date) =>
  new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(value));

const EmptyState = ({ message }: { message: string }) => (
  <Card className="p-8 text-center text-muted-foreground">{message}</Card>
);

const TrendBadge = ({ trend }: { trend: Trend }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full",
      trend.isPositive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
    )}
  >
    {trend.isPositive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
    {trend.isPositive ? "+" : "-"}
    {trend.value}%
  </span>
);

export function AnalyticsDashboard({ className }: AnalyticsDashboardProps) {
  const [days, setDays] = useState(30);
  const [refreshing, setRefreshing] = useState(false);
  const { data: analyticsData, isLoading, refetch } = useDetailedAnalytics(days);

  const data = analyticsData ?? fallbackAnalytics;

  const sortedDailyStats = useMemo(() => {
    const stats = data.dailyStats ?? [];
    return [...stats].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [data.dailyStats]);

  const totals = useMemo(() => {
    const totalViews = data.topCourses.reduce((sum, course) => sum + (course.views_count || 0), 0);
    const totalClicks = data.topCourses.reduce((sum, course) => sum + (course.clicks_count || 0), 0);
    const totalConversions = data.topCourses.reduce((sum, course) => sum + (course.conversions_count || 0), 0);
    const totalSearches = sortedDailyStats.reduce((sum, day) => sum + (day.searches || 0), 0);
    const totalInteractions = sortedDailyStats.reduce((sum, day) => sum + (day.total || 0), 0);

    const conversionRate = totalClicks > 0 ? Number(((totalConversions / totalClicks) * 100).toFixed(1)) : 0;
    const engagementRate = totalViews > 0 ? Number(((totalClicks / totalViews) * 100).toFixed(1)) : 0;

    return {
      totalViews,
      totalClicks,
      totalConversions,
      totalSearches,
      totalInteractions,
      conversionRate,
      engagementRate,
      avgPerDay: sortedDailyStats.length > 0
        ? Math.round(totalInteractions / sortedDailyStats.length)
        : 0,
    };
  }, [data.topCourses, sortedDailyStats]);

  const trends = useMemo(() => ({
    interactions: trendFromSeries(sortedDailyStats, "total"),
    views: trendFromSeries(sortedDailyStats, "views"),
    clicks: trendFromSeries(sortedDailyStats, "clicks"),
    searches: trendFromSeries(sortedDailyStats, "searches"),
  }), [sortedDailyStats]);

  const chartData = sortedDailyStats.map(day => ({
    label: formatDateLabel(day.date),
    views: day.views || 0,
    clicks: day.clicks || 0,
    total: day.total || 0
  }));

  const eventsTotal = data.eventsByType.reduce((sum, event) => sum + (event.count || 0), 0);

  const bestSegments = [...data.bySegment].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 4);
  const bestCompanies = [...data.byCompany].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 4);
  const timeline = [...sortedDailyStats].slice(-10).reverse();

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const MetricCard = ({
    title,
    description,
    value,
    icon: Icon,
    trend,
    footnote,
  }: {
    title: string;
    description: string;
    value: string | number;
    icon: any;
    trend: Trend;
    footnote?: string;
  }) => (
    <Card className="p-6 bg-gradient-to-br from-white to-slate-50/50 border-slate-200">
      <div className="flex items-center justify-between mb-3">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{title}</p>
          <p className="text-3xl font-semibold">{value}</p>
        </div>
        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
      <p className="text-sm text-muted-foreground mb-3">{description}</p>
      <div className="flex items-center justify-between">
        <TrendBadge trend={trend} />
        {footnote && <p className="text-xs text-muted-foreground">{footnote}</p>}
      </div>
    </Card>
  );

  if (isLoading) {
    return (
      <Card className={cn("p-12 flex flex-col items-center justify-center gap-4", className)}>
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Carregando analytics...</p>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      <Card className="p-6 shadow-md border-none bg-gradient-to-r from-violet-600/10 via-indigo-600/5 to-blue-500/10">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-primary flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Insights em tempo real
              </p>
              <h2 className="text-3xl font-bold mt-1">Analytics</h2>
              <p className="text-muted-foreground max-w-xl">
                Entenda quais cursos geram mais interesse e como os usuários interagem com o hub ao longo do tempo.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant={days === 7 ? "default" : "outline"} onClick={() => setDays(7)}>
                7 dias
              </Button>
              <Button variant={days === 30 ? "default" : "outline"} onClick={() => setDays(30)}>
                30 dias
              </Button>
              <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
                <TrendingUp className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title="Interações totais"
              description="Eventos registrados no período selecionado"
              value={totals.totalInteractions}
              icon={Activity}
              trend={trends.interactions}
              footnote={`${totals.avgPerDay} por dia`}
            />
            <MetricCard
              title="Visualizações"
              description="Somatório das visualizações dos cursos monitorados"
              value={totals.totalViews}
              icon={Eye}
              trend={trends.views}
              footnote={`${totals.engagementRate}% de engajamento`}
            />
            <MetricCard
              title="Cliques"
              description="Cliques totais nos cards e ações de cursos"
              value={totals.totalClicks}
              icon={MousePointer}
              trend={trends.clicks}
              footnote={`${totals.conversionRate}% de conversão`}
            />
            <MetricCard
              title="Buscas"
              description="Consultas feitas na pesquisa interna"
              value={totals.totalSearches}
              icon={Search}
              trend={trends.searches}
              footnote="Reflete o interesse por temas específicos"
            />
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold">Tendência de tráfego</h3>
              <p className="text-sm text-muted-foreground">Comparativo diário de visualizações e cliques</p>
            </div>
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </div>
          {chartData.length ? (
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={chartData} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="views" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="clicks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <Tooltip
                    content={({ label, payload }) => (
                      <Card className="p-3 text-sm shadow-lg">
                        <p className="font-medium">{label}</p>
                        {payload?.map((item) => (
                          <p key={item.dataKey} className="flex items-center gap-2">
                            <span
                              className="inline-block h-2 w-2 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                            {item.dataKey === "views" ? "Visualizações" : "Cliques"}: {" "}
                            <strong>{item.value}</strong>
                          </p>
                        ))}
                      </Card>
                    )}
                  />
                  <Area
                    type="monotone"
                    dataKey="views"
                    stroke="#7c3aed"
                    fill="url(#views)"
                    strokeWidth={2}
                    name="Visualizações"
                  />
                  <Area
                    type="monotone"
                    dataKey="clicks"
                    stroke="#14b8a6"
                    fill="url(#clicks)"
                    strokeWidth={2}
                    name="Cliques"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState message="Ainda não há registros suficientes para desenhar a tendência." />
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Distribuição por evento</h3>
              <p className="text-sm text-muted-foreground">Participação de cada tipo de interação</p>
            </div>
            <Users className="h-5 w-5 text-muted-foreground" />
          </div>
          {data.eventsByType.length ? (
            <div className="space-y-4">
              {data.eventsByType.map((event) => {
                const percentage = eventsTotal > 0
                  ? Number(((event.count / eventsTotal) * 100).toFixed(1))
                  : 0;
                const labelMap: Record<string, string> = {
                  view: "Visualizações",
                  click: "Cliques",
                  search: "Buscas",
                  conversion: "Conversões"
                };
                const label = labelMap[event.type] ?? event.type;
                return (
                  <div key={event.type}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <p className="font-medium capitalize">{label}</p>
                      <span className="text-muted-foreground">{percentage}%</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">{event.count} eventos</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState message="Nenhum evento registrado neste período." />
          )}
        </Card>
      </div>

      <Card className="p-6">
        <Tabs defaultValue="courses">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="text-lg font-semibold">Detalhamento</h3>
              <p className="text-sm text-muted-foreground">Compare cursos, segmentos e empresas monitoradas</p>
            </div>
            <TabsList className="bg-transparent gap-2">
              <TabsTrigger value="courses" className="rounded-full px-4 py-1 data-[state=active]:bg-primary data-[state=active]:text-white">
                Cursos
              </TabsTrigger>
              <TabsTrigger value="segments" className="rounded-full px-4 py-1 data-[state=active]:bg-primary data-[state=active]:text-white">
                Segmentos
              </TabsTrigger>
              <TabsTrigger value="companies" className="rounded-full px-4 py-1 data-[state=active]:bg-primary data-[state=active]:text-white">
                Empresas
              </TabsTrigger>
              <TabsTrigger value="timeline" className="rounded-full px-4 py-1 data-[state=active]:bg-primary data-[state=active]:text-white">
                Linha do tempo
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="courses" className="space-y-4">
            {data.topCourses.length ? (
              data.topCourses.map((course) => (
                <Card key={course.id} className="p-4 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold">{course.titulo}</p>
                    <p className="text-sm text-muted-foreground">
                      {course.categoria || course.tipo || "Categoria não informada"} · {course.empresa || "JML"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-6 text-sm">
                    <div>
                      <p className="text-muted-foreground">Views</p>
                      <p className="text-lg font-semibold">{course.views_count}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Cliques</p>
                      <p className="text-lg font-semibold">{course.clicks_count}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Conversões</p>
                      <p className="text-lg font-semibold">{course.conversions_count}</p>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <EmptyState message="Nenhum curso coletado ainda. Assim que houver interações, os dados aparecerão aqui." />
            )}
          </TabsContent>

          <TabsContent value="segments" className="space-y-3">
            {bestSegments.length ? (
              bestSegments.map((segment) => (
                <Card key={segment.segmento || "desconhecido"} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Layers className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-semibold">{segment.segmento || "Segmento não informado"}</p>
                      <p className="text-xs text-muted-foreground">{segment.courses} cursos monitorados</p>
                    </div>
                  </div>
                  <div className="flex gap-6 text-sm">
                    <div>
                      <p className="text-muted-foreground">Views</p>
                      <p className="text-lg font-semibold">{segment.views}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Cliques</p>
                      <p className="text-lg font-semibold">{segment.clicks}</p>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <EmptyState message="Ainda não há dados por segmento." />
            )}
          </TabsContent>

          <TabsContent value="companies" className="space-y-3">
            {bestCompanies.length ? (
              bestCompanies.map((company) => (
                <Card key={company.empresa || "sem-empresa"} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-semibold">{company.empresa || "Empresa não informada"}</p>
                      <p className="text-xs text-muted-foreground">{company.courses} cursos ativos</p>
                    </div>
                  </div>
                  <div className="flex gap-6 text-sm">
                    <div>
                      <p className="text-muted-foreground">Views</p>
                      <p className="text-lg font-semibold">{company.views}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Cliques</p>
                      <p className="text-lg font-semibold">{company.clicks}</p>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <EmptyState message="Ainda não há dados consolidados por empresa." />
            )}
          </TabsContent>

          <TabsContent value="timeline" className="space-y-3">
            {timeline.length ? (
              timeline.map((day, index) => (
                <Card key={`${day.date}-${index}`} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{new Date(day.date).toLocaleDateString("pt-BR")}</p>
                      <p className="text-sm text-muted-foreground">Eventos do dia</p>
                    </div>
                  </div>
                  <div className="flex gap-6 text-sm">
                    <div className="text-center">
                      <p className="text-muted-foreground">Total</p>
                      <p className="text-lg font-semibold">{day.total}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground">Views</p>
                      <p className="text-lg font-semibold">{day.views}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground">Cliques</p>
                      <p className="text-lg font-semibold">{day.clicks}</p>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <EmptyState message="Sem eventos registrados para montar a linha do tempo." />
            )}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
