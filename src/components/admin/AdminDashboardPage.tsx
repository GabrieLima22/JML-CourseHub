import { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation, Routes, Route } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  FileText,
  BarChart3,
  Upload,
  Users,
  Clock,
  Plus,
  Eye,
  RefreshCw,
  Brain,
  Target,
  Rocket,
  Crown,
  Gem,
  Wand2,
  Activity,
  Workflow,
  Bell,
  MoreHorizontal,
  Loader2,
  Shield,
  Sparkles,
  LogOut,
  LayoutDashboard,
  Settings,
  Tag,
  Layers,
  Building2,
  Zap,
  ChevronRight,
  CheckCircle,
  BookOpenCheck,
  CreditCard,
  Gift,
  Calendar,
  MapPin,
  Presentation
} from "lucide-react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useDashboardStats, useRecentActivities } from "@/hooks/useAdminStats";
// ? CORREÇÃO: Importação como default
import CourseManager from "@/components/admin/CourseManager";
import { PDFUploadManager } from "@/components/admin/PDFUploadManager";
import { AnalyticsDashboard } from "@/components/admin/AnalyticsDashboard";
import { AIImpactWidget } from "@/components/admin/AIImpactWidget";
import { TaxonomyManager } from "@/components/admin/TaxonomyManager";
import { cn } from "@/lib/utils";

type CourseManagerEventDetail = {
  courseId?: string | null;
  title?: string | null;
};

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, getTimeRemainingFormatted, extendSession } = useAdminAuth();
  const [showCourseManager, setShowCourseManager] = useState(false);
  const [showPDFUploader, setShowPDFUploader] = useState(false);
  const [courseManagerFocus, setCourseManagerFocus] = useState<CourseManagerEventDetail | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Buscar dados reais via React Query com auto-refresh
  const { data: dashboardStats, isLoading: statsLoading } = useDashboardStats();
  const { data: activitiesData, isLoading: activitiesLoading } = useRecentActivities(5);

  // Determinar página ativa baseado na URL
  const currentPath = location.pathname.split('/').pop() || 'dashboard';
  const activePage = ['dashboard', 'courses', 'analytics', 'config'].includes(currentPath)
    ? currentPath
    : 'dashboard';

  const handleLogout = () => {
    // ? FASE 1: Logout simples e limpo
    logout();
    navigate('/');
  };

  const handleNavigate = (page: string) => {
    navigate(`/admin/${page}`);
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const systemStats = useMemo(() => {
    if (!dashboardStats?.system) {
      return {
        uptime: '—',
        lastBackup: 'Aguardando backup',
        activeSessions: 0,
        aiProcessing: 0,
        systemLoad: 0
      };
    }

    const { system } = dashboardStats;
    return {
      uptime: formatUptime(system.uptime ?? 0),
      lastBackup: `${system.recentUploads} uploads nas últimas horas`,
      activeSessions: system.totalUploads ?? 0,
      aiProcessing: system.aiProcessing ?? 0,
      systemLoad: Math.min(100, Math.round((system.memoryUsage ?? 0) * 100))
    };
  }, [dashboardStats]);

  const getSystemHealth = () => {
    if (!dashboardStats) return 'unknown';
    const { system } = dashboardStats;
    if (system.aiProcessing > 5) return 'warning';
    return 'excellent';
  };

  const formatRelativeTime = (timestamp: string) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "agora";
    if (diffMins < 60) return `${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} dia${diffDays > 1 ? 's' : ''}`;
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-green-600 bg-green-50 border-green-200';
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'upload': return Upload;
      case 'course': return FileText;
      case 'user': return Users;
      case 'system': return Settings;
      case 'ai': return Brain;
      default: return Activity;
    }
  };

  const getActivityStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50';
      case 'processing': return 'text-blue-600 bg-blue-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'error': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, color: "text-violet-600" },
    { id: "courses", label: "Cursos", icon: FileText, color: "text-blue-600" },
    { id: "analytics", label: "Analytics", icon: BarChart3, color: "text-green-600" },
    { id: "config", label: "Configurações", icon: Settings, color: "text-orange-600" }
  ];

  // Componente de Dashboard (Overview) - FASE 2 COMPLETA
  const DashboardView = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* STATS CARDS MODERNOS - APENAS 3 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {/* Card 1: Cursos Totais */}
        <Card className="p-6 bg-gradient-to-br from-blue-50 via-indigo-50/50 to-violet-50/30 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-violet-950/20 border border-blue-200/50 dark:border-blue-800/30 hover:shadow-2xl hover:shadow-blue-500/10 hover:scale-[1.02] transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
                <p className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">Cursos Totais</p>
              </div>
              {statsLoading ? (
                <div className="space-y-2">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <div className="h-3 w-20 bg-blue-200 dark:bg-blue-800 rounded animate-pulse"></div>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-4xl font-black text-blue-900 dark:text-blue-100 group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">
                    {dashboardStats?.overview.totalCourses || 97}
                  </p>
                  <p className="text-sm font-semibold text-blue-600/80 dark:text-blue-400/80">
                    {dashboardStats?.overview.publishedCourses || 50} publicados
                  </p>
                </div>
              )}
            </div>
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:shadow-xl group-hover:shadow-blue-500/30 transition-all duration-300">
              <FileText className="h-7 w-7 text-white" />
            </div>
          </div>
        </Card>

        {/* Card 2: IA Gerados */}
        <Card className="p-6 bg-gradient-to-br from-purple-50 via-violet-50/50 to-pink-50/30 dark:from-purple-950/40 dark:via-violet-950/30 dark:to-pink-950/20 border border-purple-200/50 dark:border-purple-800/30 hover:shadow-2xl hover:shadow-purple-500/10 hover:scale-[1.02] transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-purple-500 animate-pulse"></div>
                <p className="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider">IA Gerados</p>
              </div>
              {statsLoading ? (
                <div className="space-y-2">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                  <div className="h-3 w-24 bg-purple-200 dark:bg-purple-800 rounded animate-pulse"></div>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-4xl font-black text-purple-900 dark:text-purple-100 group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">
                    {dashboardStats?.overview.coursesWithAI || 75}
                  </p>
                  <p className="text-sm font-semibold text-purple-600/80 dark:text-purple-400/80">
                    {dashboardStats?.system.aiProcessing || 0} processando
                  </p>
                </div>
              )}
            </div>
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/25 group-hover:shadow-xl group-hover:shadow-purple-500/30 transition-all duration-300">
              <Brain className="h-7 w-7 text-white" />
            </div>
          </div>
        </Card>

        {/* Card 3: Visualizações */}
        <Card className="p-6 bg-gradient-to-br from-emerald-50 via-green-50/50 to-teal-50/30 dark:from-emerald-950/40 dark:via-green-950/30 dark:to-teal-950/20 border border-emerald-200/50 dark:border-emerald-800/30 hover:shadow-2xl hover:shadow-emerald-500/10 hover:scale-[1.02] transition-all duration-300 group xl:col-span-1 md:col-span-2 xl:col-span-1">
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">Visualizações</p>
              </div>
              {statsLoading ? (
                <div className="space-y-2">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                  <div className="h-3 w-16 bg-emerald-200 dark:bg-emerald-800 rounded animate-pulse"></div>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-4xl font-black text-emerald-900 dark:text-emerald-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">
                    {(dashboardStats?.overview.totalViews || 5535).toLocaleString()}
                  </p>
                  <p className="text-sm font-semibold text-emerald-600/80 dark:text-emerald-400/80">
                    {(dashboardStats?.overview.totalClicks || 1276).toLocaleString()} cliques
                  </p>
                </div>
              )}
            </div>
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:shadow-xl group-hover:shadow-emerald-500/30 transition-all duration-300">
              <Eye className="h-7 w-7 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* AÇÕES RÁPIDAS CONECTADAS */}
        <Card className="p-8 bg-gradient-to-br from-white via-violet-50/20 to-blue-50/20 dark:from-slate-900 dark:via-violet-950/10 dark:to-blue-950/10 border border-violet-200/30 dark:border-violet-800/20 shadow-xl shadow-violet-500/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <Rocket className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-slate-800 via-violet-600 to-blue-600 dark:from-slate-200 dark:via-violet-400 dark:to-blue-400 bg-clip-text text-transparent">
                Ações Rápidas
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Principais funcionalidades</p>
            </div>
          </div>
          <div className="space-y-4">
            <Button
              className="w-full justify-start h-14 text-base bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 text-white shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 transition-all duration-300"
              onClick={() => handleNavigate("courses")}
            >
              <Plus className="h-5 w-5 mr-3" />
              Criar Novo Curso
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start h-14 text-base border-blue-200 dark:border-blue-800 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-950/30 dark:hover:to-indigo-950/30 hover:border-blue-300 dark:hover:border-blue-700 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300"
              onClick={() => handleNavigate("analytics")}
            >
              <BarChart3 className="h-5 w-5 mr-3" />
              Ver Analytics Completo
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start h-14 text-base border-emerald-200 dark:border-emerald-800 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-green-50 dark:hover:from-emerald-950/30 dark:hover:to-green-950/30 hover:border-emerald-300 dark:hover:border-emerald-700 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all duration-300"
              onClick={() => handleNavigate("config")}
            >
              <Settings className="h-5 w-5 mr-3" />
              Configurações do Sistema
            </Button>
          </div>
        </Card>

        {/* ATIVIDADE RECENTE COM CARROSSEL */}
        <Card className="p-8 bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/20 dark:from-slate-900 dark:via-blue-950/10 dark:to-indigo-950/10 border border-blue-200/30 dark:border-blue-800/20 shadow-xl shadow-blue-500/5">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Bell className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-slate-800 via-blue-600 to-indigo-600 dark:from-slate-200 dark:via-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                  Atividade Recente
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Últimas atualizações</p>
              </div>
            </div>
          </div>
          
          {/* Carrossel de Atividades */}
          <div className="relative">
            {activitiesLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
              </div>
            ) : activitiesData?.activities && activitiesData.activities.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
                {activitiesData.activities.slice(0, 6).map((activity, index) => {
                  const Icon = getActivityIcon(activity.type);
                  const isEven = index % 2 === 0;
                  return (
                    <div 
                      key={index} 
                      className={cn(
                        "flex items-start gap-4 p-4 rounded-xl border-2 transition-all duration-200 hover:scale-[1.02] cursor-pointer",
                        isEven 
                          ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200/50 dark:border-blue-800/30 hover:border-blue-300 dark:hover:border-blue-700" 
                          : "bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20 border-violet-200/50 dark:border-violet-800/30 hover:border-violet-300 dark:hover:border-violet-700"
                      )}
                    >
                      <div className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center shadow-sm",
                        isEven 
                          ? "bg-gradient-to-br from-blue-500 to-indigo-500" 
                          : "bg-gradient-to-br from-violet-500 to-purple-500"
                      )}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                          {activity.action}: {activity.title}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {formatRelativeTime(activity.timestamp)} atrás
                        </p>
                      </div>
                      <div className={cn(
                        "h-2 w-2 rounded-full animate-pulse",
                        isEven ? "bg-blue-500" : "bg-violet-500"
                      )}></div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // Dados de exemplo quando não há atividades
              <div className="space-y-3">
                {[
                  { type: 'course', action: 'Curso publicado', title: 'Licitações Sustentáveis e Critérios ESG', time: '2 horas' },
                  { type: 'upload', action: 'Upload processado', title: '2026 OBRAS.pdf', time: '1 dia' },
                  { type: 'ai', action: 'IA processamento', title: 'Novo curso sobre contratos', time: '2 dias' },
                  { type: 'user', action: 'Usuário cadastrado', title: 'Admin sistema', time: '3 dias' },
                ].map((activity, index) => {
                  const Icon = getActivityIcon(activity.type);
                  const isEven = index % 2 === 0;
                  return (
                    <div 
                      key={index} 
                      className={cn(
                        "flex items-start gap-4 p-4 rounded-xl border-2 transition-all duration-200 hover:scale-[1.02] cursor-pointer",
                        isEven 
                          ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200/50 dark:border-blue-800/30 hover:border-blue-300 dark:hover:border-blue-700" 
                          : "bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20 border-violet-200/50 dark:border-violet-800/30 hover:border-violet-300 dark:hover:border-violet-700"
                      )}
                    >
                      <div className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center shadow-sm",
                        isEven 
                          ? "bg-gradient-to-br from-blue-500 to-indigo-500" 
                          : "bg-gradient-to-br from-violet-500 to-purple-500"
                      )}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                          {activity.action}: {activity.title}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {activity.time} atrás
                        </p>
                      </div>
                      <div className={cn(
                        "h-2 w-2 rounded-full animate-pulse",
                        isEven ? "bg-blue-500" : "bg-violet-500"
                      )}></div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );

  // --- NOVA VISUALIZAÇÃO DE CONFIGURAÇÕES ---
  const ConfigView = () => {
    const [showTaxonomy, setShowTaxonomy] = useState(false);

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <TaxonomyManager open={showTaxonomy} onClose={() => setShowTaxonomy(false)} />
        
        {/* Header de Configurações */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-800 via-violet-600 to-blue-600 dark:from-slate-200 dark:via-violet-400 dark:to-blue-400 bg-clip-text text-transparent">
              Configurações
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mt-1 text-lg">
              Gerencie tags, taxonomias e configurações do sistema.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Card Principal de Taxonomia */}
          <Card className="p-0 overflow-hidden border-slate-200/50 dark:border-slate-800/50 bg-gradient-to-br from-white to-violet-50/30 dark:from-slate-900 dark:to-violet-950/20 shadow-xl shadow-violet-500/5">
            <div className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div className="flex gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shadow-lg">
                    <Tag className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                      Gerenciar Taxonomias
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 max-w-md mt-2">
                      Configure segmentos, públicos-alvo, empresas e tipos de curso disponíveis no sistema.
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={() => setShowTaxonomy(true)}
                  className="bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 text-white shadow-lg shadow-violet-500/25 transition-all duration-200"
                  size="lg"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Gerenciar
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-violet-100 dark:border-violet-900/30 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <Layers className="h-5 w-5 text-blue-500" />
                    <span className="font-semibold text-sm text-slate-700 dark:text-slate-300">Áreas</span>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Agenda JML, Setorial, Soft Skills</span>
                </div>
                
                <div className="p-4 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-violet-100 dark:border-violet-900/30 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <Activity className="h-5 w-5 text-emerald-500" />
                    <span className="font-semibold text-sm text-slate-700 dark:text-slate-300">Modalidades</span>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">EAD, Presencial, In Company</span>
                </div>
                
                <div className="p-4 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-violet-100 dark:border-violet-900/30 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <Target className="h-5 w-5 text-amber-500" />
                    <span className="font-semibold text-sm text-slate-700 dark:text-slate-300">Níveis</span>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Básico, Intermediário, Avançado</span>
                </div>
                
                <div className="p-4 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-violet-100 dark:border-violet-900/30 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <Tag className="h-5 w-5 text-pink-500" />
                    <span className="font-semibold text-sm text-slate-700 dark:text-slate-300">Tags</span>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Sistema dinâmico</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-violet-50 to-blue-50 dark:from-violet-950/30 dark:to-blue-950/30 px-8 py-4 border-t border-violet-100 dark:border-violet-900/30">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600 dark:text-slate-400">Última sincronização</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">Atualizado</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Card de Status */}
          <Card className="p-8 bg-gradient-to-br from-white to-emerald-50/30 dark:from-slate-900 dark:to-emerald-950/20 border-emerald-100 dark:border-emerald-900/30">
            <div className="text-center">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/25">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">
                Sistema Configurado
              </h3>
              
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Todas as taxonomias estão sincronizadas e funcionando perfeitamente.
              </p>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">Áreas ativas</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">3</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">Modalidades</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">4</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">Níveis disponíveis</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">3</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col relative overflow-hidden">
      {/* Gradientes JML sutis e limpos */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Light mode - gradientes sutis */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50/40 via-blue-50/30 to-emerald-50/40 dark:hidden" />
        
        {/* Dark mode - gradientes JML mais suaves */}
        <div className="hidden dark:block absolute inset-0 bg-gradient-to-br from-violet-950/20 via-blue-950/15 to-emerald-950/20" />
        
        {/* Textura sutil apenas */}
        <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.025]" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(139, 92, 246, 0.1) 0%, transparent 50%), 
                           radial-gradient(circle at 75% 75%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
                           radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.05) 0%, transparent 50%)`
        }} />
      </div>
      
      {/* Estilos customizados */}
      <style>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(139, 92, 246, 0.3) transparent;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, rgba(139, 92, 246, 0.4), rgba(59, 130, 246, 0.4));
          border-radius: 3px;
          border: none;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, rgba(139, 92, 246, 0.6), rgba(59, 130, 246, 0.6));
        }
        .custom-scrollbar::-webkit-scrollbar-corner {
          background: transparent;
        }

        .jml-surface {
          position: relative;
          overflow: hidden;
        }
        .jml-surface::before {
          content: "";
          position: absolute;
          inset: -25%;
          background: linear-gradient(120deg, rgba(124, 58, 237, 0.14), rgba(59, 130, 246, 0.14), rgba(16, 185, 129, 0.10));
          background-size: 200% 200%;
          animation: jmlShift 12s ease-in-out infinite;
          z-index: 0;
        }
        .dark .jml-surface::before {
          background: linear-gradient(120deg, rgba(124, 58, 237, 0.22), rgba(59, 130, 246, 0.18), rgba(16, 185, 129, 0.16));
        }
        .jml-surface > * {
          position: relative;
          z-index: 1;
        }
        @keyframes jmlShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
      
      {/* HEADER PROFISSIONAL FIXO */}
      <header className="sticky top-0 z-50 border-b border-white/20 dark:border-slate-800/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-sm jml-surface">
        <div className="relative overflow-hidden">
          {/* Gradiente sutil JML */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-violet-500/5 to-transparent dark:via-violet-400/10"></div>
          
          <div className="relative flex items-center justify-between px-6 py-3">
            {/* Logo e Toggle Sidebar */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="h-10 w-10 rounded-xl hover:bg-violet-100 dark:hover:bg-violet-900/20 transition-all duration-200"
              >
                {sidebarCollapsed ? (
                  <ChevronRight className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                ) : (
                  <LayoutDashboard className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                )}
              </Button>
              
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 shadow-lg shadow-violet-500/25">
                  <Crown className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-slate-800 via-violet-600 to-blue-600 dark:from-slate-200 dark:via-violet-400 dark:to-blue-400 bg-clip-text text-transparent">
                    JML Admin Pro
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Bem-vindo, {user?.username || 'Admin'}
                  </p>
                </div>
              </div>
            </div>

            {/* Ações do Header */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-200"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* LAYOUT PRINCIPAL */}
      <div className="relative flex flex-1">
        {/* SIDEBAR FIXA */}
        <aside
          className={cn(
            "fixed top-[72px] left-0 h-[calc(100vh-72px)] border-r border-white/20 dark:border-slate-800/50 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl flex flex-col transition-all duration-300 ease-in-out shadow-lg jml-surface z-20",
            sidebarCollapsed ? "w-20" : "w-72"
          )}
          style={{ width: sidebarCollapsed ? "5rem" : "18rem" }}
        >
          {/* Navegação */}
          <div className="p-4 flex-1">
            {!sidebarCollapsed && (
              <h3 className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold mb-4 px-2 pt-4">
                Navegação
              </h3>
            )}
            
            <nav className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
                      isActive
                        ? "bg-gradient-to-r from-violet-500 to-blue-500 text-white shadow-lg shadow-violet-500/25"
                        : "hover:bg-gradient-to-r hover:from-violet-50 hover:to-blue-50 dark:hover:from-violet-950/30 dark:hover:to-blue-950/30 text-slate-600 dark:text-slate-300 hover:text-violet-600 dark:hover:text-violet-400"
                    )}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <Icon className={cn(
                      "h-5 w-5 flex-shrink-0", 
                      isActive ? "text-white" : "text-current"
                    )} />
                    {!sidebarCollapsed && (
                      <span className="font-medium text-sm">{item.label}</span>
                    )}
                    
                    {/* Tooltip para sidebar colapsada */}
                    {sidebarCollapsed && (
                      <div className="absolute left-full ml-2 px-3 py-1 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap">
                        {item.label}
                      </div>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
          
          {/* Rodapé da sidebar */}
          {!sidebarCollapsed && (
            <div className="p-4 border-t border-white/10 dark:border-slate-800/50">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Sistema Online
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* ÁREA DE CONTEÚDO PRINCIPAL COM SCROLL */}
        <main
          className="flex-1 overflow-y-auto"
          style={{
            marginLeft: sidebarCollapsed ? "5rem" : "18rem",
            paddingTop: "32px",
            minHeight: "calc(100vh - 72px)",
          }}
        >
          <div className="px-8 pb-12 max-w-[1600px] mx-auto">
            <Routes>
              <Route path="/" element={<DashboardView />} />
              <Route path="/dashboard" element={<DashboardView />} />
              <Route
                path="/courses"
                element={<CoursesView onClose={() => navigate('/admin/dashboard')} />}
              />
              <Route path="/analytics" element={<AnalyticsDashboard />} />
              <Route path="/config" element={<ConfigView />} />
            </Routes>
          </div>
        </main>
      </div>

      {/* MODAIS DOS SUBSISTEMAS */}
      {/* ? CORREÇÃO: Uso correto como componente default */}
      <CourseManager
        open={showCourseManager}
        onClose={() => {
          setShowCourseManager(false);
          setCourseManagerFocus(null);
        }}
        focusCourseId={courseManagerFocus?.courseId ?? null}
        focusCourseTitle={courseManagerFocus?.title ?? null}
      />

      <PDFUploadManager
        open={showPDFUploader}
        onClose={() => setShowPDFUploader(false)}
      />
    </div>
  );
}

type CoursesViewProps = {
  onClose: () => void;
};

function CoursesView({ onClose }: CoursesViewProps) {
  const apiBase = (import.meta as any).env?.VITE_API_URL || "http://localhost:3001/api";
  const [showNewCourseModal, setShowNewCourseModal] = useState(false);
  const [showCourseManager, setShowCourseManager] = useState(false);
  const [showPDFUpload, setShowPDFUpload] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("basic");
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    search: "",
    empresas: [] as string[],
    tipos: [] as string[],
    segmentos: [] as string[],
  });

  const companyOptions = [
    { id: "JML", label: "JML" },
    { id: "Conecta", label: "Conecta" },
  ];

  const courseTypeOptions = [
    { id: "hibrido", label: "Híbrido" },
    { id: "aberto", label: "Aberto" },
    { id: "incompany", label: "InCompany" },
    { id: "ead", label: "EAD" },
  ];

  const segmentOptions = [
    { id: "Estatais", label: "Estatais" },
    { id: "Judiciário", label: "Judiciário" },
    { id: "Sistema S", label: "Sistema S" },
  ];

  const normalizeTipo = (tipo?: string) => {
    const value = (tipo || "").toLowerCase();
    if (value.includes("hibrid")) return "hibrido";
    if (value.includes("abert")) return "aberto";
    if (value.includes("company")) return "incompany";
    if (value.includes("ead") || value.includes("online")) return "ead";
    return value || "aberto";
  };

  const normalizeModalidades = (modalidade?: string[] | string) => {
    if (!modalidade) return [];
    const list = Array.isArray(modalidade) ? modalidade : [modalidade];
    return list.map((m) => {
      const norm = m.toLowerCase();
      if (norm.includes("in company") || norm.includes("incompany")) return "InCompany";
      if (norm.includes("abert")) return "Aberto";
      if (norm.includes("hibrid")) return "Híbrido";
      if (norm.includes("ead") || norm.includes("online")) return "EAD";
      return m;
    });
  };

  const mapStatus = (status?: string) => {
    if (status === "published") return "Publicado";
    if (status === "archived") return "Arquivado";
    return "Rascunho";
  };

  const mapLevel = (nivel?: string) => {
    const value = (nivel || "").toLowerCase();
    if (value.includes("avan")) return "Avançado";
    if (value.includes("inter")) return "Intermediário";
    return "Básico";
  };

  useEffect(() => {
    const fetchCourses = async () => {
      setLoadingCourses(true);
      setCoursesError(null);
      try {
        const res = await fetch(`${apiBase}/courses?status=all&limit=200`);
        if (!res.ok) throw new Error(`Erro ao carregar cursos (${res.status})`);
        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          throw new Error("Resposta inesperada do backend (conteúdo não JSON)");
        }
        const json = await res.json();
        const apiCourses = json?.data?.courses || json?.courses || [];
        if (!Array.isArray(apiCourses)) throw new Error("Resposta inesperada da API");

        const mapped = apiCourses.map((c: any) => ({
          id: c.id,
          title: c.titulo || c.title || "Sem título",
          slug: c.slug,
          area: c.segmento || c.categoria || c.empresa || "JML",
          empresa: c.empresa || "JML",
          tipo: normalizeTipo(c.tipo),
          segmento: c.segmento || "",
          modality: normalizeModalidades(c.modalidade || c.tipo),
          tags: c.tags || [],
          summary: c.summary || "Sem descrição disponível",
          description: c.description || "",
          duration_hours: c.carga_horaria || c.duration_hours || 0,
          level: mapLevel(c.nivel || c.level),
          target_audience: c.publico_alvo || c.target_audience,
          deliverables: c.deliverables || [],
          visualizacoes: c.views_count || c.visualizacoes || 0,
          status: mapStatus(c.status),
        }));

        setCourses(mapped);
      } catch (err: any) {
        console.error(err);
        setCoursesError("Não foi possível carregar os cursos do backend. Exibindo dados locais.");
        setCourses([]);
      } finally {
        setLoadingCourses(false);
      }
    };

    fetchCourses();
  }, []);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesSearch =
        !filters.search ||
        course.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        (course.summary || "").toLowerCase().includes(filters.search.toLowerCase());

      const matchesEmpresa =
        filters.empresas.length === 0 || filters.empresas.includes(course.empresa);

      const matchesTipo =
        filters.tipos.length === 0 ||
        filters.tipos.includes(course.tipo) ||
        filters.tipos.some((t) =>
          (course.modality || []).some((m: string) => normalizeTipo(m).includes(t))
        );

      const matchesSegmento =
        filters.segmentos.length === 0 ||
        (course.segmento && filters.segmentos.includes(course.segmento));

      return matchesSearch && matchesEmpresa && matchesTipo && matchesSegmento;
    });
  }, [courses, filters]);

  const toggleFilter = (key: "empresas" | "tipos" | "segmentos", value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((v) => v !== value)
        : [...prev[key], value],
    }));
  };

  const activeFiltersCount =
    (filters.empresas?.length || 0) +
    (filters.tipos?.length || 0) +
    (filters.segmentos?.length || 0);

  const handleCourseClick = (course: any) => {
    setActiveTab("basic");
    setEditingCourse(course);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Publicado': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Rascunho': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Arquivado': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getAreaIcon = (area: string) => {
    switch (area) {
      case 'Agenda JML': return FileText;
      case 'Setorial': return Building2;
      case 'Soft Skills': return Users;
      default: return FileText;
    }
  };

  const getAreaColor = (area: string) => {
    switch (area) {
      case 'Agenda JML': return 'from-blue-500 to-indigo-600';
      case 'Setorial': return 'from-emerald-500 to-teal-600';
      case 'Soft Skills': return 'from-violet-500 to-purple-600';
      default: return 'from-slate-500 to-slate-600';
    }
  };

  const handleSaveCourse = () => {
    // Aqui implementaria a lógica de salvar
    console.log('Salvando curso:', editingCourse);
    setEditingCourse(null);
    setActiveTab("basic");
  };

  const handleCancelEdit = () => {
    setEditingCourse(null);
    setActiveTab("basic");
  };

  // Se está editando um curso, mostra o formulário de edição
  if (editingCourse) {
    const tabs = [
      { id: 'basic', label: 'Informações Básicas', icon: FileText },
      { id: 'content', label: 'Conteúdo', icon: BookOpenCheck },
      { id: 'pricing', label: 'Preços & Datas', icon: CreditCard },
      { id: 'delivery', label: 'Entregáveis', icon: Gift }
    ];

    const modalidades = ["EAD", "Aberto", "In Company", "Híbrido"];
    const segmentos = ["Estatais", "Judiciário", "Sistema S"];
    const empresas = ["JML", "Conecta"];
    const niveis = ["Básico", "Intermediário", "Avançado"];

    return (
      <div className="space-y-8 animate-in fade-in duration-500 relative z-10">
        {/* HEADER DE EDIÇÃO */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-800 via-violet-600 to-blue-600 dark:from-slate-200 dark:via-violet-400 dark:to-blue-400 bg-clip-text text-transparent">
              Editar Curso
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mt-2 text-lg">
              Modifique as informações do curso "{editingCourse.title}"
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleCancelEdit}
              className="h-12 px-6 rounded-xl border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-200"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveCourse}
              className="bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 text-white shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 transition-all duration-300 h-12 px-8 rounded-xl"
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Salvar Alterações
            </Button>
          </div>
        </div>

        {/* FORMULÁRIO COM ABAS */}
        <Card className="p-0 overflow-hidden bg-gradient-to-br from-white via-slate-50/50 to-violet-50/30 dark:from-slate-900 dark:via-slate-800/50 dark:to-violet-950/20 border border-slate-200/50 dark:border-slate-800/50 shadow-xl shadow-slate-500/5">
          {/* BARRA DE ABAS */}
          <div className="relative">
            {/* Gradiente de fundo */}
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-blue-500/10 to-emerald-500/10 dark:from-violet-400/20 dark:via-blue-400/20 dark:to-emerald-400/20"></div>
            
            <div className="relative flex border-b border-slate-200/50 dark:border-slate-800/50">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-3 px-6 py-4 font-semibold transition-all duration-300 relative",
                      isActive
                        ? "bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 border-b-2 border-violet-500"
                        : "text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-white/50 dark:hover:bg-slate-800/50"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-sm">{tab.label}</span>
                    {isActive && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-blue-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* CONTEÚDO DAS ABAS */}
          <div className="p-8">
            {/* ABA 1: INFORMAÇÕES BÁSICAS */}
            {activeTab === 'basic' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* COLUNA ESQUERDA */}
                  <div className="space-y-6">
                    {/* Título */}
                    <div>
                      <label className="flex items-center gap-3 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                          <FileText className="h-5 w-5 text-white" />
                        </div>
                        Título do Curso
                      </label>
                      <input
                        type="text"
                        value={editingCourse.title}
                        onChange={(e) => setEditingCourse(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full h-12 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>

                    {/* Empresa e Área */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="flex items-center gap-3 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                            <Building2 className="h-5 w-5 text-white" />
                          </div>
                          Empresa
                        </label>
                        <select
                          value={editingCourse.empresa || 'JML'}
                          onChange={(e) => setEditingCourse(prev => ({ ...prev, empresa: e.target.value }))}
                          className="w-full h-12 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200"
                        >
                          {empresas.map(empresa => (
                            <option key={empresa} value={empresa}>{empresa}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Carga Horária */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="flex items-center gap-3 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
                            <Clock className="h-5 w-5 text-white" />
                          </div>
                          Carga Horária
                        </label>
                        <input
                          type="number"
                          value={editingCourse.duration_hours}
                          onChange={(e) => setEditingCourse(prev => ({ ...prev, duration_hours: parseInt(e.target.value) }))}
                          className="w-full h-12 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200"
                          placeholder="Ex: 8"
                        />
                      </div>
                    </div>

                    {/* Modalidade (única escolha) */}
                    <div>
                      <label className="flex items-center gap-3 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                          <Activity className="h-5 w-5 text-white" />
                        </div>
                        Modalidade
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {["EAD", "Aberto", "In Company", "Híbrido"].map((modalidade) => (
                          <label
                            key={modalidade}
                            className="flex items-center gap-3 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-violet-300 dark:hover:border-violet-700 cursor-pointer transition-all duration-200"
                          >
                            <input
                              type="radio"
                              name="modalidade"
                              checked={editingCourse.modality?.[0] === modalidade}
                              onChange={() =>
                                setEditingCourse((prev: any) => ({ ...prev, modality: [modalidade] }))
                              }
                              className="w-4 h-4 text-violet-600 border-slate-300 dark:border-slate-600 rounded-full focus:ring-violet-500 focus:ring-2 bg-white dark:bg-slate-800"
                            />
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                              {modalidade}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* COLUNA DIREITA */}
                  <div className="space-y-6">
                    {/* Segmentos */}
                    <div>
                      <label className="flex items-center gap-3 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
                          <Users className="h-5 w-5 text-white" />
                        </div>
                        Segmentos
                      </label>
                      <div className="space-y-3">
                        {segmentos.map(segmento => (
                          <label key={segmento} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-violet-300 dark:hover:border-violet-700 cursor-pointer transition-colors">
                            <input
                              type="checkbox"
                              checked={editingCourse.segmentos?.includes(segmento) || false}
                              onChange={() => {
                                const currentSegmentos = editingCourse.segmentos || [];
                                const newSegmentos = currentSegmentos.includes(segmento)
                                  ? currentSegmentos.filter(s => s !== segmento)
                                  : [...currentSegmentos, segmento];
                                setEditingCourse(prev => ({ ...prev, segmentos: newSegmentos }));
                              }}
                              className="w-4 h-4 text-violet-600 border-slate-300 dark:border-slate-600 rounded focus:ring-violet-500 focus:ring-2"
                            />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              {segmento}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Resumo Executivo */}
                    <div>
                      <label className="flex items-center gap-3 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/25">
                          <Eye className="h-5 w-5 text-white" />
                        </div>
                        Resumo Executivo
                      </label>
                      <textarea
                        value={editingCourse.summary}
                        onChange={(e) => setEditingCourse(prev => ({ ...prev, summary: e.target.value }))}
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200 resize-none"
                        placeholder="Descrição curta e objetiva do curso..."
                      />
                    </div>

                    {/* Público-alvo */}
                    <div>
                      <label className="flex items-center gap-3 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/25">
                          <Users className="h-5 w-5 text-white" />
                        </div>
                        Público-alvo
                      </label>
                      <input
                        type="text"
                        value={editingCourse.target_audience}
                        onChange={(e) => setEditingCourse(prev => ({ ...prev, target_audience: e.target.value }))}
                        className="w-full h-12 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200"
                        placeholder="Ex: Gestores públicos, pregoeiros, advogados..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ABA 2: CONTEÚDO */}
            {activeTab === 'content' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                {/* Conteúdo Programático */}
                <div>
                  <label className="flex items-center gap-3 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                      <BookOpenCheck className="h-5 w-5 text-white" />
                    </div>
                    Conteúdo Programático (Módulos)
                  </label>
                  <textarea
                    value={editingCourse.description}
                    onChange={(e) => setEditingCourse(prev => ({ ...prev, description: e.target.value }))}
                    rows={8}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200 resize-none"
                    placeholder="Módulo 1: ... | Módulo 2: ... | Módulo 3: ..."
                  />
                </div>

                {/* Apresentação */}
                <div>
                  <label className="flex items-center gap-3 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
                      <Presentation className="h-5 w-5 text-white" />
                    </div>
                    Apresentação do Curso
                  </label>
                  <textarea
                    value={editingCourse.apresentacao || ''}
                    onChange={(e) => setEditingCourse(prev => ({ ...prev, apresentacao: e.target.value }))}
                    rows={6}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200 resize-none"
                    placeholder="Descreva como o curso será apresentado, metodologia, recursos utilizados..."
                  />
                </div>
              </div>
            )}

            {/* ABA 3: PREÇOS & DATAS */}
            {activeTab === 'pricing' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* COLUNA ESQUERDA - Datas */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-white" />
                      </div>
                      Período do Curso
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                          Data de Início
                        </label>
                        <input
                          type="date"
                          value={editingCourse.data_inicio || ''}
                          onChange={(e) => setEditingCourse(prev => ({ ...prev, data_inicio: e.target.value }))}
                          className="w-full h-12 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                          Data de Fim
                        </label>
                        <input
                          type="date"
                          value={editingCourse.data_fim || ''}
                          onChange={(e) => setEditingCourse(prev => ({ ...prev, data_fim: e.target.value }))}
                          className="w-full h-12 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>
                    </div>

                    {/* Local (se presencial) */}
                    {(editingCourse.modality?.includes('Aberto') || editingCourse.modality?.includes('In Company') || editingCourse.modality?.includes('Híbrido')) && (
                      <div>
                        <label className="flex items-center gap-3 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                            <MapPin className="h-4 w-4 text-white" />
                          </div>
                          Local
                        </label>
                        <input
                          type="text"
                          value={editingCourse.local || ''}
                          onChange={(e) => setEditingCourse(prev => ({ ...prev, local: e.target.value }))}
                          className="w-full h-12 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200"
                          placeholder="Ex: Auditório JML, Brasília - DF"
                        />
                      </div>
                    )}
                  </div>

                  {/* COLUNA DIREITA - Preços */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                        <CreditCard className="h-4 w-4 text-white" />
                      </div>
                      Precificação
                    </h3>

                    {/* Preço EAD/Online */}
                    {(editingCourse.modality?.includes('EAD') || editingCourse.modality?.includes('Híbrido')) && (
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                          Preço Online (EAD)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 dark:text-slate-400">R$</span>
                          <input
                            type="number"
                            value={editingCourse.preco_online || ''}
                            onChange={(e) => setEditingCourse(prev => ({ ...prev, preco_online: e.target.value }))}
                            className="w-full h-12 pl-10 pr-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200"
                            placeholder="0,00"
                          />
                        </div>
                      </div>
                    )}

                    {/* Preço Presencial */}
                    {(editingCourse.modality?.includes('Aberto') || editingCourse.modality?.includes('Híbrido')) && (
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                          Preço Presencial (Aberto)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 dark:text-slate-400">R$</span>
                          <input
                            type="number"
                            value={editingCourse.preco_presencial || ''}
                            onChange={(e) => setEditingCourse(prev => ({ ...prev, preco_presencial: e.target.value }))}
                            className="w-full h-12 pl-10 pr-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200"
                            placeholder="0,00"
                          />
                        </div>
                      </div>
                    )}

                    {/* Preço In Company */}
                    {editingCourse.modality?.includes('In Company') && (
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                          Preço In Company
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 dark:text-slate-400">R$</span>
                          <input
                            type="number"
                            value={editingCourse.preco_incompany || ''}
                            onChange={(e) => setEditingCourse(prev => ({ ...prev, preco_incompany: e.target.value }))}
                            className="w-full h-12 pl-10 pr-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200"
                            placeholder="0,00"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ABA 4: ENTREGÁVEIS */}
            {activeTab === 'delivery' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                {/* Entregáveis */}
                <div>
                  <label className="flex items-center gap-3 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/25">
                      <Gift className="h-5 w-5 text-white" />
                    </div>
                    Entregáveis
                  </label>
                  <textarea
                    value={editingCourse.deliverables?.join('\n') || ''}
                    onChange={(e) => setEditingCourse(prev => ({ 
                      ...prev, 
                      deliverables: e.target.value.split('\n').filter(item => item.trim() !== '')
                    }))}
                    rows={6}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200 resize-none"
                    placeholder="Digite cada entregável em uma linha separada&#10;Ex:&#10;Certificado digital&#10;Material didático em PDF&#10;Toolkit prático&#10;Acesso à plataforma por 6 meses"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    Digite cada entregável em uma linha separada
                  </p>
                </div>

                {/* Preview dos Entregáveis */}
                {editingCourse.deliverables && editingCourse.deliverables.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Preview:</h4>
                    <div className="space-y-2">
                      {editingCourse.deliverables.map((item, index) => (
                        <div key={index} className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30">
                          <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-sm text-emerald-700 dark:text-emerald-300">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }

  // View normal da lista de cursos
  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative z-10">
      {/* MODAL DE ESCOLHA - IA vs MANUAL */}
      {showNewCourseModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-2xl w-full p-8 border border-slate-200/50 dark:border-slate-800/50">
            <div className="text-center mb-8">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-500/25">
                <Plus className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-800 via-violet-600 to-blue-600 dark:from-slate-200 dark:via-violet-400 dark:to-blue-400 bg-clip-text text-transparent mb-2">
                Como deseja criar o curso?
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Escolha o método que melhor atende às suas necessidades
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* IA Upload */}
              <button
                onClick={() => {
                  setShowNewCourseModal(false);
                  setShowPDFUpload(true);
                }}
                className="group p-6 rounded-2xl border-2 border-purple-200 dark:border-purple-800/50 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20 hover:border-purple-300 dark:hover:border-purple-700 hover:scale-[1.02] transition-all duration-300"
              >
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/25 group-hover:shadow-xl group-hover:shadow-purple-500/30 transition-all duration-300">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <h4 className="font-bold text-lg text-slate-800 dark:text-slate-200 mb-2">Upload Inteligente (IA)</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
                  Envie um PDF e nossa IA extrairá automaticamente todo o conteúdo estruturado
                </p>
              </button>

              {/* Manual */}
              <button
                onClick={() => {
                  setShowNewCourseModal(false);
                  setShowCourseManager(true);
                }}
                className="group p-6 rounded-2xl border-2 border-blue-200 dark:border-blue-800/50 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 hover:border-blue-300 dark:hover:border-blue-700 hover:scale-[1.02] transition-all duration-300"
              >
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/25 group-hover:shadow-xl group-hover:shadow-blue-500/30 transition-all duration-300">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <h4 className="font-bold text-lg text-slate-800 dark:text-slate-200 mb-2">Criação Manual</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
                  Preencha os campos manualmente com controle total sobre o conteúdo
                </p>
              </button>
            </div>

            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => setShowNewCourseModal(false)}
                className="px-8 py-2 rounded-xl border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-200"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-800 via-blue-600 to-indigo-600 dark:from-slate-200 dark:via-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
            Gestão de Cursos
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-2 text-lg">
            Gerencie todo o catálogo de cursos JML e Conecta
          </p>
        </div>
        <Button
          onClick={() => setShowNewCourseModal(true)}
          className="bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 text-white shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 transition-all duration-300 h-12 px-8"
          size="lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          Novo Curso
        </Button>
      </div>

      {/* FILTROS */}
      <Card className="p-6 bg-gradient-to-br from-white via-slate-50/60 to-violet-50/30 dark:from-slate-900 dark:via-slate-800/60 dark:to-violet-950/30 border border-slate-200/60 dark:border-slate-800/60 shadow-xl shadow-slate-500/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-violet-500/20">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Filtros</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Refine por empresa, tipo e segmento</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {activeFiltersCount > 0 && (
              <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200 border border-blue-200 dark:border-blue-800">
                {activeFiltersCount}
              </Badge>
            )}
            {(activeFiltersCount > 0 || filters.search) && (
              <button
                onClick={() => setFilters({ search: "", empresas: [], tipos: [], segmentos: [] })}
                className="text-sm text-slate-600 dark:text-slate-300 hover:text-violet-600 dark:hover:text-violet-400 underline-offset-4 hover:underline"
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Busca */}
          <div className="lg:col-span-1">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
              Buscar curso
            </label>
            <Input
              type="text"
              placeholder="Digite o nome ou palavra-chave..."
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              className="h-11"
            />
          </div>

          {/* Empresa */}
          <div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Empresa</p>
            <div className="space-y-2">
              {companyOptions.map((opt) => (
                <label key={opt.id} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.empresas.includes(opt.id)}
                    onChange={() => toggleFilter("empresas", opt.id)}
                    className="w-4 h-4 text-violet-600 border-slate-300 dark:border-slate-600 rounded focus:ring-violet-500 focus:ring-2 bg-white dark:bg-slate-800"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {/* Tipo de Curso */}
          <div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Tipo de Curso</p>
            <div className="space-y-2">
              {courseTypeOptions.map((opt) => (
                <label key={opt.id} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.tipos.includes(opt.id)}
                    onChange={() => toggleFilter("tipos", opt.id)}
                    className="w-4 h-4 text-violet-600 border-slate-300 dark:border-slate-600 rounded focus:ring-violet-500 focus:ring-2 bg-white dark:bg-slate-800"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {/* Segmento */}
          <div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Segmento</p>
            <div className="space-y-2">
              {segmentOptions.map((opt) => (
                <label key={opt.id} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.segmentos.includes(opt.id)}
                    onChange={() => toggleFilter("segmentos", opt.id)}
                    className="w-4 h-4 text-violet-600 border-slate-300 dark:border-slate-600 rounded focus:ring-violet-500 focus:ring-2 bg-white dark:bg-slate-800"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
        </div>

        {coursesError && (
          <p className="mt-4 text-sm text-amber-600 dark:text-amber-300">{coursesError}</p>
        )}
      </Card>

      {/* LISTA DE CURSOS */}
      <div className="space-y-4">
        {loadingCourses && (
          <Card className="p-6 flex items-center gap-3 border-dashed border-2 border-slate-200 dark:border-slate-800">
            <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
            <span className="text-sm text-slate-600 dark:text-slate-300">Carregando cursos...</span>
          </Card>
        )}

        {!loadingCourses && filteredCourses.map((course) => {
          const segmentLabel = course.segmento || course.area || "Geral";
          const modalityLabel = course.modality?.[0] || "";
          const AreaIcon = getAreaIcon(course.area || "Setorial");
          const areaColor = getAreaColor(course.area || "Setorial");
          
          return (
            <Card 
              key={course.id}
              onClick={() => handleCourseClick(course)}
              className="p-6 transition-all duration-300 hover:scale-[1.01] cursor-pointer border bg-gradient-to-r from-white via-slate-50/60 to-violet-50/30 dark:from-slate-900 dark:via-slate-800/60 dark:to-violet-900/20 border-slate-200/70 dark:border-slate-800/50 shadow-md hover:shadow-2xl hover:shadow-violet-500/15 hover:border-violet-200/80 dark:hover:border-violet-700/60"
            >
              <div className="h-1 w-full bg-gradient-to-r from-violet-300/50 via-blue-300/50 to-emerald-300/50 rounded-full mb-4" />
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "h-12 w-12 rounded-xl flex items-center justify-center shadow-sm bg-gradient-to-br",
                      areaColor
                    )}>
                      <AreaIcon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 mb-2 line-clamp-1">
                        {course.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-sm mb-3">
                        <Badge variant="outline" className="text-xs">
                          {segmentLabel}
                        </Badge>
                        <span className="text-slate-600 dark:text-slate-400">{course.duration_hours}h</span>
                        {course.visualizacoes && course.visualizacoes > 0 && (
                          <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {course.visualizacoes}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-3">
                        {course.summary}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {modalityLabel && (
                          <span 
                            className="px-2 py-1 text-xs rounded-md bg-gradient-to-r from-violet-100 to-blue-100 dark:from-violet-900/40 dark:to-blue-900/40 text-violet-800 dark:text-violet-200 border border-violet-200/60 dark:border-violet-700/60"
                          >
                            {modalityLabel}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Badge className={cn("text-xs px-3 py-1 border", getStatusColor(course.status))}>
                    {course.status}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Pré-visualização
                    }}
                    className="h-8 w-8 p-0 rounded-lg"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}

        {!loadingCourses && filteredCourses.length === 0 && (
          <div className="text-center py-16">
            <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center mx-auto mb-6">
              <FileText className="h-12 w-12 text-slate-500 dark:text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Nenhum curso encontrado
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              Tente ajustar os filtros ou criar um novo curso.
            </p>
            <Button
              onClick={() => setShowNewCourseModal(true)}
              className="bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Curso
            </Button>
          </div>
        )}
      </div>

      {/* MODAIS */}
      {showCourseManager && (
        <CourseManager
          open={showCourseManager}
          onClose={() => setShowCourseManager(false)}
        />
      )}

      {showPDFUpload && (
        <PDFUploadManager
          open={showPDFUpload}
          onClose={() => setShowPDFUpload(false)}
        />
      )}
    </div>
  );
}

