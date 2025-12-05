import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  Eye,
  MousePointer,
  Search,
  TrendingUp,
  Users,
  Loader2,
  Building,
  Layers,
  Zap,
  Filter,
  Download
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, Tooltip, YAxis } from "recharts";
import { useDetailedAnalytics } from "@/hooks/useAdminStats";
import { cn } from "@/lib/utils";

// --- TIPAGENS & MOCKS ---
type Trend = { value: number; isPositive: boolean };

interface AnalyticsDashboardProps {
  className?: string;
}

const fallbackAnalytics = {
  topCourses: [] as Array<any>,
  eventsByType: [] as Array<{ type: string; count: number }>,
  dailyStats: [] as Array<{ date: string; total: number; views: number; clicks: number; searches: number }>,
  bySegment: [] as Array<any>,
  byCompany: [] as Array<any>
};

// --- UTILITÁRIOS ---
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

// --- COMPONENTES VISUAIS ---

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <p className="font-bold text-slate-700 dark:text-slate-200 mb-2">{label}</p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-xs font-medium">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-slate-500 dark:text-slate-400 capitalize">{entry.name}:</span>
              <span className="text-slate-900 dark:text-white font-bold">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const TrendBadge = ({ trend }: { trend: Trend }) => (
  <div className={cn(
    "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border",
    trend.isPositive 
      ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" 
      : "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20"
  )}>
    {trend.isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
    {trend.value}%
  </div>
);

const StatCard = ({ title, value, icon: Icon, trend, colorClass, delay = 0 }: any) => (
  <div 
    className={cn(
      "relative overflow-hidden rounded-2xl border bg-white dark:bg-[#111623] p-6 shadow-sm transition-all hover:shadow-md animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both",
      "border-slate-200 dark:border-slate-800"
    )}
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className={cn("absolute top-0 right-0 p-3 opacity-[0.08] dark:opacity-[0.05] transform scale-150", colorClass)}>
       <Icon className="w-24 h-24" />
    </div>
    
    <div className="relative z-10 flex flex-col justify-between h-full">
      <div className="flex items-start justify-between mb-4">
        <div className={cn("p-2.5 rounded-xl bg-opacity-10 dark:bg-opacity-20", colorClass.replace('text-', 'bg-'))}>
           <Icon className={cn("w-5 h-5", colorClass)} />
        </div>
        <TrendBadge trend={trend} />
      </div>
      
      <div>
        <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{value}</h3>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wide">{title}</p>
      </div>
    </div>
  </div>
);

// --- COMPONENTE PRINCIPAL ---

export function AnalyticsDashboard({ className }: AnalyticsDashboardProps) {
  const [days, setDays] = useState(30);
  const [refreshing, setRefreshing] = useState(false);
  const { data: analyticsData, isLoading, refetch } = useDetailedAnalytics(days);

  const data = analyticsData ?? fallbackAnalytics;

  // Processamento de Dados (Memoizado)
  const sortedDailyStats = useMemo(() => {
    const stats = data.dailyStats ?? [];
    return [...stats].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [data.dailyStats]);

  const totals = useMemo(() => {
    const totalViews = data.topCourses.reduce((sum, course) => sum + (course.views_count || 0), 0);
    const totalClicks = data.topCourses.reduce((sum, course) => sum + (course.clicks_count || 0), 0);
    const totalConversions = data.topCourses.reduce((sum, course) => sum + (course.conversions_count || 0), 0);
    const totalSearches = sortedDailyStats.reduce((sum, day) => sum + (day.searches || 0), 0);
    const totalInteractions = sortedDailyStats.reduce((sum, day) => sum + (day.total || 0), 0);
    const conversionRate = totalClicks > 0 ? Number(((totalConversions / totalClicks) * 100).toFixed(1)) : 0;
    const ctr = totalViews > 0 ? Number(((totalClicks / totalViews) * 100).toFixed(1)) : 0;

    return { totalViews, totalClicks, totalConversions, totalSearches, totalInteractions, conversionRate, ctr };
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
  const bestSegments = [...data.bySegment].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);
  const bestCompanies = [...data.byCompany].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setTimeout(() => setRefreshing(false), 800); // Visual delay
  };

  if (isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4 animate-pulse">
        <Loader2 className="h-12 w-12 animate-spin text-violet-600" />
        <p className="text-slate-400 font-medium">Carregando inteligência de dados...</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-8 pb-20 max-w-[1600px] mx-auto", className)}>
      
      {/* 1. HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
             <div className="p-2 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg shadow-lg shadow-violet-500/20">
                <BarChart3 className="w-6 h-6 text-white" />
             </div>
             Analytics Center
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
            Visão estratégica de engajamento e performance.
          </p>
        </div>
        
        <div className="flex items-center bg-white dark:bg-[#111623] p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
           <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 mr-3">
              {[7, 30].map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={cn(
                    "px-4 py-1.5 text-sm font-semibold rounded-md transition-all",
                    days === d 
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" 
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                  )}
                >
                  {d} dias
                </button>
              ))}
           </div>
           
           <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1" />
           
           <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={refreshing} className={cn("text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg", refreshing && "animate-spin")}>
              <TrendingUp className="w-4 h-4" />
           </Button>
           <Button variant="ghost" size="icon" className="text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg">
              <Download className="w-4 h-4" />
           </Button>
        </div>
      </div>

      {/* 2. KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
         <StatCard 
            title="Visualizações Totais" 
            value={totals.totalViews.toLocaleString()} 
            icon={Eye} 
            trend={trends.views} 
            colorClass="text-violet-600" 
            delay={0}
         />
         <StatCard 
            title="Cliques de Interesse" 
            value={totals.totalClicks.toLocaleString()} 
            icon={MousePointer} 
            trend={trends.clicks} 
            colorClass="text-emerald-500" 
            delay={100}
         />
         <StatCard 
            title="Taxa de Cliques (CTR)" 
            value={`${totals.ctr}%`} 
            icon={Activity} 
            trend={trends.clicks} 
            colorClass="text-blue-500" 
            delay={200}
         />
         <StatCard 
            title="Buscas Realizadas" 
            value={totals.totalSearches.toLocaleString()} 
            icon={Search} 
            trend={trends.searches} 
            colorClass="text-amber-500" 
            delay={300}
         />
      </div>

      {/* 3. CHART SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
         
         {/* MAIN CHART */}
         <Card className="lg:col-span-2 p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111623] shadow-sm flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between mb-8">
               <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Tendência de Tráfego</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Evolução comparativa de visualizações vs. interações</p>
               </div>
               <div className="flex gap-2">
                  <Badge variant="outline" className="gap-1.5 py-1 bg-violet-50 text-violet-700 border-violet-100 dark:bg-violet-900/10 dark:text-violet-400 dark:border-violet-900/30">
                     <span className="w-2 h-2 rounded-full bg-violet-500"/> Visualizações
                  </Badge>
                  <Badge variant="outline" className="gap-1.5 py-1 bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/10 dark:text-emerald-400 dark:border-emerald-900/30">
                     <span className="w-2 h-2 rounded-full bg-emerald-500"/> Cliques
                  </Badge>
               </div>
            </div>
            
            <div className="flex-1 w-full min-h-[300px]">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                     <defs>
                        <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                           <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                           <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                     <XAxis 
                        dataKey="label" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 12 }} 
                        dy={10} 
                        minTickGap={30}
                     />
                     <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 12 }} 
                     />
                     <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }} />
                     <Area 
                        type="monotone" 
                        dataKey="views" 
                        name="Visualizações"
                        stroke="#8b5cf6" 
                        strokeWidth={3} 
                        fillOpacity={1} 
                        fill="url(#colorViews)" 
                        activeDot={{ r: 6, strokeWidth: 0 }}
                     />
                     <Area 
                        type="monotone" 
                        dataKey="clicks" 
                        name="Cliques"
                        stroke="#10b981" 
                        strokeWidth={3} 
                        fillOpacity={1} 
                        fill="url(#colorClicks)" 
                        activeDot={{ r: 6, strokeWidth: 0 }}
                     />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </Card>

         {/* EVENT DISTRIBUTION */}
         <Card className="p-0 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111623] shadow-sm overflow-hidden flex flex-col">
             <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                   <Zap className="w-5 h-5 text-amber-500" /> Distribuição
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Volume por tipo de interação</p>
             </div>
             <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
                {data.eventsByType.map((event, idx) => {
                   const percentage = eventsTotal > 0 ? Number(((event.count / eventsTotal) * 100).toFixed(1)) : 0;
                   const isTop = idx === 0;
                   
                   const config: any = {
                      view: { label: "Visualizações", color: "bg-violet-500", text: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-900/20" },
                      click: { label: "Cliques", color: "bg-emerald-500", text: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
                      search: { label: "Buscas", color: "bg-amber-500", text: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20" },
                      conversion: { label: "Conversões", color: "bg-blue-500", text: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" }
                   };
                   
                   const style = config[event.type] || { label: event.type, color: "bg-slate-500", text: "text-slate-600", bg: "bg-slate-50" };

                   return (
                      <div key={event.type} className="group">
                         <div className="flex justify-between items-end mb-2">
                            <span className={cn("font-semibold text-sm flex items-center gap-2", style.text)}>
                               <span className={cn("w-2 h-2 rounded-full", style.color)} />
                               {style.label}
                            </span>
                            <div className="text-right">
                               <span className="text-sm font-bold text-slate-900 dark:text-white">{event.count}</span>
                               <span className="text-xs text-slate-400 ml-1">({percentage}%)</span>
                            </div>
                         </div>
                         <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div 
                               className={cn("h-full rounded-full transition-all duration-1000 ease-out", style.color)} 
                               style={{ width: `${percentage}%` }}
                            />
                         </div>
                      </div>
                   );
                })}
             </div>
             <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 text-center">
                 <p className="text-xs text-slate-500">Total de {eventsTotal.toLocaleString()} eventos processados</p>
             </div>
         </Card>
      </div>

      {/* 4. DETAILED TABS */}
      <div className="space-y-4">
         <Tabs defaultValue="courses" className="w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
               <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Detalhamento</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Análise granular por dimensão.</p>
               </div>
               <TabsList className="bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl w-full sm:w-auto self-start">
                  <TabsTrigger value="courses" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-violet-600 dark:data-[state=active]:text-white shadow-none px-4">Cursos</TabsTrigger>
                  <TabsTrigger value="segments" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-violet-600 dark:data-[state=active]:text-white shadow-none px-4">Segmentos</TabsTrigger>
                  <TabsTrigger value="companies" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-violet-600 dark:data-[state=active]:text-white shadow-none px-4">Empresas</TabsTrigger>
               </TabsList>
            </div>

            {/* TAB: CURSOS */}
            <TabsContent value="courses" className="animate-in fade-in slide-in-from-left-4 duration-300">
               <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111623] shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                     <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-100 dark:border-slate-800">
                           <tr>
                              <th className="px-6 py-4">Curso</th>
                              <th className="px-6 py-4">Categoria</th>
                              <th className="px-6 py-4 text-center">Views</th>
                              <th className="px-6 py-4 text-center">Cliques</th>
                              <th className="px-6 py-4 text-right">Conversão</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                           {data.topCourses.length === 0 ? (
                              <tr><td colSpan={5} className="p-8 text-center text-slate-400">Nenhum dado disponível.</td></tr>
                           ) : data.topCourses.map((course) => {
                              const conversion = course.clicks_count > 0 ? ((course.conversions_count / course.clicks_count) * 100).toFixed(1) : 0;
                              return (
                                 <tr key={course.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4">
                                       <div className="flex flex-col">
                                          <span className="font-bold text-slate-900 dark:text-white group-hover:text-violet-600 transition-colors line-clamp-1">{course.titulo}</span>
                                          <span className="text-xs text-slate-500">{course.empresa || "JML"}</span>
                                       </div>
                                    </td>
                                    <td className="px-6 py-4">
                                       <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-normal">
                                          {course.categoria || course.tipo || "Geral"}
                                       </Badge>
                                    </td>
                                    <td className="px-6 py-4 text-center font-medium text-slate-700 dark:text-slate-300">
                                       {course.views_count}
                                    </td>
                                    <td className="px-6 py-4 text-center font-medium text-slate-700 dark:text-slate-300">
                                       {course.clicks_count}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                       <div className="flex items-center justify-end gap-2">
                                          <span className="font-bold text-slate-900 dark:text-white">{conversion}%</span>
                                          <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                             <div className="h-full bg-emerald-500" style={{ width: `${Math.min(Number(conversion), 100)}%` }} />
                                          </div>
                                       </div>
                                    </td>
                                 </tr>
                              )
                           })}
                        </tbody>
                     </table>
                  </div>
               </Card>
            </TabsContent>

            {/* TAB: SEGMENTOS */}
            <TabsContent value="segments" className="animate-in fade-in slide-in-from-left-4 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                   {bestSegments.length === 0 ? <p className="col-span-3 text-center text-slate-400 py-10">Sem dados de segmentos.</p> : 
                      bestSegments.map((seg) => (
                        <Card key={seg.segmento} className="p-5 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111623] shadow-sm hover:border-violet-300 transition-all group">
                           <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                 <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                    <Layers className="w-5 h-5" />
                                 </div>
                                 <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white">{seg.segmento}</h4>
                                    <p className="text-xs text-slate-500">{seg.courses} Cursos</p>
                                 </div>
                              </div>
                           </div>
                           <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-50 dark:border-slate-800">
                               <div>
                                  <p className="text-xs text-slate-400 mb-0.5">Views</p>
                                  <p className="text-lg font-bold text-slate-700 dark:text-slate-200">{seg.views}</p>
                               </div>
                               <div>
                                  <p className="text-xs text-slate-400 mb-0.5">Cliques</p>
                                  <p className="text-lg font-bold text-emerald-600">{seg.clicks}</p>
                               </div>
                           </div>
                        </Card>
                      ))
                   }
                </div>
            </TabsContent>

            {/* TAB: EMPRESAS */}
            <TabsContent value="companies" className="animate-in fade-in slide-in-from-left-4 duration-300">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {bestCompanies.map((comp) => (
                     <Card key={comp.empresa} className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111623] flex items-center gap-6">
                        <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-700">
                           <Building className="w-8 h-8 text-slate-400" />
                        </div>
                        <div className="flex-1">
                           <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{comp.empresa}</h4>
                           <div className="flex gap-4 text-sm">
                              <span className="text-slate-500"><strong>{comp.courses}</strong> Cursos Ativos</span>
                              <span className="text-slate-300">|</span>
                              <span className="text-slate-500"><strong>{comp.views.toLocaleString()}</strong> Views</span>
                           </div>
                           <div className="mt-3 h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-violet-500" style={{ width: `${Math.min((comp.clicks / comp.views) * 100 * 5, 100)}%` }} /> 
                           </div>
                           <p className="text-[10px] text-right text-slate-400 mt-1">Índice de interesse relativo</p>
                        </div>
                     </Card>
                  ))}
               </div>
            </TabsContent>
         </Tabs>
      </div>

    </div>
  );
}