import { useState, useEffect } from "react";
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
  ArrowDownRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalyticsDashboardProps {
  className?: string;
}

const mockAnalyticsData = {
  overview: {
    totalViews: 12847,
    totalClicks: 3421,
    conversionRate: 26.6,
    avgTimeOnPage: "2:34",
    trends: {
      views: { value: 15.2, isPositive: true },
      clicks: { value: 8.4, isPositive: true },
      conversion: { value: -2.1, isPositive: false },
      time: { value: 12.3, isPositive: true }
    }
  },
  topCourses: [
    { id: 1, title: "Nova Lei de Licitações", views: 2341, clicks: 432, conversion: 18.5 },
    { id: 2, title: "Pregão Eletrônico", views: 1987, clicks: 398, conversion: 20.0 },
    { id: 3, title: "Compliance Público", views: 1654, clicks: 321, conversion: 19.4 },
    { id: 4, title: "Gestão de Contratos", views: 1432, clicks: 289, conversion: 20.2 },
    { id: 5, title: "Auditoria e Controle", views: 1287, clicks: 256, conversion: 19.9 }
  ],
  recentActivity: [
    { id: 1, action: "Visualização", course: "Nova Lei de Licitações", user: "Usuário anônimo", time: "2 min atrás" },
    { id: 2, action: "Download PDF", course: "Pregão Eletrônico", user: "João Silva", time: "5 min atrás" },
    { id: 3, action: "Pesquisa", query: "compliance", results: 8, time: "7 min atrás" },
    { id: 4, action: "Visualização", course: "Gestão de Contratos", user: "Usuário anônimo", time: "12 min atrás" },
    { id: 5, action: "Clique no WhatsApp", course: "Auditoria e Controle", user: "Maria Santos", time: "15 min atrás" }
  ],
  searchTerms: [
    { term: "licitação", count: 487, trend: 12.3 },
    { term: "pregão", count: 423, trend: 8.7 },
    { term: "compliance", count: 342, trend: -3.2 },
    { term: "contratos", count: 298, trend: 15.4 },
    { term: "auditoria", count: 234, trend: 5.9 }
  ],
  timeData: [
    { hour: "08:00", views: 45, clicks: 12 },
    { hour: "09:00", views: 78, clicks: 21 },
    { hour: "10:00", views: 123, clicks: 34 },
    { hour: "11:00", views: 156, clicks: 42 },
    { hour: "12:00", views: 89, clicks: 23 },
    { hour: "13:00", views: 67, clicks: 18 },
    { hour: "14:00", views: 134, clicks: 38 },
    { hour: "15:00", views: 189, clicks: 51 },
    { hour: "16:00", views: 167, clicks: 45 },
    { hour: "17:00", views: 145, clicks: 39 },
    { hour: "18:00", views: 98, clicks: 26 }
  ]
};

export function AnalyticsDashboard({ className }: AnalyticsDashboardProps) {
  const [data, setData] = useState(mockAnalyticsData);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simular refresh de dados
    await new Promise(resolve => setTimeout(resolve, 1500));
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
    trend: { value: number; isPositive: boolean };
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
          {trend.isPositive ? "+" : ""}{trend.value}%
        </span>
        <span className="text-sm text-muted-foreground">vs. mês passado</span>
      </div>
    </Card>
  );

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics</h2>
          <p className="text-muted-foreground">
            Métricas e insights sobre o uso da plataforma
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
          Atualizar
        </Button>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total de Visualizações"
          value={data.overview.totalViews.toLocaleString()}
          trend={data.overview.trends.views}
          icon={Eye}
        />
        <MetricCard
          title="Cliques Totais"
          value={data.overview.totalClicks.toLocaleString()}
          trend={data.overview.trends.clicks}
          icon={MousePointer}
        />
        <MetricCard
          title="Taxa de Conversão"
          value={data.overview.conversionRate}
          trend={data.overview.trends.conversion}
          icon={Target}
          suffix="%"
        />
        <MetricCard
          title="Tempo Médio"
          value={data.overview.avgTimeOnPage}
          trend={data.overview.trends.time}
          icon={Clock}
        />
      </div>

      <Tabs defaultValue="courses" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="courses">Cursos Populares</TabsTrigger>
          <TabsTrigger value="activity">Atividade Recente</TabsTrigger>
          <TabsTrigger value="search">Pesquisas</TabsTrigger>
          <TabsTrigger value="time">Horários</TabsTrigger>
        </TabsList>

        {/* Cursos Populares */}
        <TabsContent value="courses" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Cursos Mais Acessados</h3>
            <div className="space-y-3">
              {data.topCourses.map((course, index) => (
                <div key={course.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-medium">{course.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {course.views} visualizações • {course.clicks} cliques
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {course.conversion}% conversão
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Atividade Recente */}
        <TabsContent value="activity" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Atividade em Tempo Real</h3>
            <div className="space-y-3">
              {data.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                    <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{activity.action}</span>
                      {activity.action === "Pesquisa" && (
                        <Badge variant="outline" className="text-xs">
                          {activity.results} resultados
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {activity.course || `"${(activity as any).query}"`} • {activity.user}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Termos de Pesquisa */}
        <TabsContent value="search" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Termos Mais Pesquisados</h3>
            <div className="space-y-3">
              {data.searchTerms.map((term, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="font-medium">"{term.term}"</span>
                      <p className="text-sm text-muted-foreground">
                        {term.count} pesquisas
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {term.trend > 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                    <span className={cn(
                      "text-sm font-medium",
                      term.trend > 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {term.trend > 0 ? "+" : ""}{term.trend}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Análise por Horário */}
        <TabsContent value="time" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Atividade por Horário (Hoje)</h3>
            <div className="space-y-4">
              {data.timeData.map((hour) => (
                <div key={hour.hour} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{hour.hour}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground">
                        {hour.views} views • {hour.clicks} clicks
                      </span>
                      <span className="font-medium">
                        {Math.round((hour.clicks / hour.views) * 100)}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(hour.views / 200) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
