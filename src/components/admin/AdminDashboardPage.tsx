import { useState, useMemo } from "react";
import { useNavigate, useLocation, Routes, Route } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
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
  CheckCircle
} from "lucide-react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useDashboardStats, useRecentActivities } from "@/hooks/useAdminStats";

import CourseManager from "@/components/admin/CourseManager";
import { PDFUploadManager } from "@/components/admin/PDFUploadManager";
import { AnalyticsDashboard } from "@/components/admin/AnalyticsDashboard";
import { AIImpactWidget } from "@/components/admin/AIImpactWidget";
import { TaxonomyManager } from "@/components/admin/TaxonomyManager";
import { cn } from "@/lib/utils";
import { useSearch, type Course } from "@/hooks/useSearch";
import { SearchBar } from "@/components/SearchBar";

// Correção: importação como default
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
    // FASE 1: Logout simples e limpo
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
        uptime: "—",
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
              // Dados de exemplo quando nÃ£o hÃ¡ atividades
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

  // --- NOVA VISUALIZAÃ‡ÃƒO DE CONFIGURAÃ‡Ã•ES ---
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
                      Configure segmentos, públicos-alvo, empresas e tipos de curso disponÃ­veis no sistema.
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
                    <span className="font-semibold text-sm text-slate-700 dark:text-slate-300">Segmentos</span>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Estatais, JudiciÃ¡rio, Sistema S</span>
                </div>
                
                <div className="p-4 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-violet-100 dark:border-violet-900/30 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <Building2 className="h-5 w-5 text-emerald-500" />
                    <span className="font-semibold text-sm text-slate-700 dark:text-slate-300">Empresas</span>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">JML, Conecta</span>
                </div>
                
                <div className="p-4 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-violet-100 dark:border-violet-900/30 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <Users className="h-5 w-5 text-amber-500" />
                    <span className="font-semibold text-sm text-slate-700 dark:text-slate-300">Tipos</span>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">EAD, Presencial, HÃ­brido</span>
                </div>
                
                <div className="p-4 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-violet-100 dark:border-violet-900/30 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <Tag className="h-5 w-5 text-pink-500" />
                    <span className="font-semibold text-sm text-slate-700 dark:text-slate-300">Tags</span>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Sistema dinÃ¢mico</span>
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
                  <span className="text-slate-600 dark:text-slate-400">Segmentos ativos</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">3</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">Empresas cadastradas</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">2</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">Tipos de curso</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">4</span>
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
      `}</style>
      
      {/* HEADER PROFISSIONAL FIXO */}
      <header className="sticky top-0 z-50 border-b border-white/20 dark:border-slate-800/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-sm">
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
      <div className="flex flex-1 overflow-hidden relative z-10">
        {/* SIDEBAR ELEGANTE E EXPANSÃVEL */}
        <aside className={cn(
          "border-r border-white/20 dark:border-slate-800/50 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl flex flex-col transition-all duration-300 ease-in-out shadow-lg",
          sidebarCollapsed ? "w-20" : "w-72"
        )}>
          {/* Navegação */}
          <div className="p-4 flex-1">
            {!sidebarCollapsed && (
              <h3 className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold mb-4 px-2">
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
          
          {/* RodapÃ© da sidebar */}
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

        {/* ÃREA DE CONTEÃšDO PRINCIPAL COM SCROLL */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-8 max-w-[1600px] mx-auto h-full">
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
      {/* âœ… CORREÃ‡ÃƒO: Uso correto como componente default */}
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
  const { allCourses, isLoading: loadingCourses, getUniqueCompanies, getUniqueCourseTypes, getUniqueSegments } = useSearch({ status: "all" });
  const [showNewCourseModal, setShowNewCourseModal] = useState(false);
  const [showCourseManager, setShowCourseManager] = useState(false);
  const [showPDFUpload, setShowPDFUpload] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [filters, setFilters] = useState({
    empresa: "all",
    segmentos: [] as string[],
    tipo: "all",
    search: ""
  });

  const empresas = getUniqueCompanies() ?? [];
  const segmentosDisponiveis = getUniqueSegments() ?? [];
  const tipos = getUniqueCourseTypes() ?? [];

  const handleSegmentToggle = (segmento: string) => {
    setFilters((prev) => ({
      ...prev,
      segmentos: prev.segmentos.includes(segmento)
        ? prev.segmentos.filter((s) => s !== segmento)
        : [...prev.segmentos, segmento]
    }));
  };

  const filteredCourses = useMemo(() => {
    return allCourses.filter((course) => {
      if (filters.empresa !== "all" && course.company !== filters.empresa) return false;
      if (filters.tipo !== "all" && course.course_type !== filters.tipo) return false;
      if (
        filters.segmentos.length > 0 &&
        !filters.segmentos.some(
          (s) =>
            course.segment === s ||
            (Array.isArray(course.segments) && course.segments.includes(s))
        )
      ) {
        return false;
      }
      if (
        filters.search &&
        !course.title.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [allCourses, filters]);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "published":
      case "Publicado":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "draft":
      case "Rascunho":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "archived":
      case "Arquivado":
        return "bg-slate-100 text-slate-700 border-slate-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case "published":
        return "Publicado";
      case "draft":
        return "Rascunho";
      case "archived":
        return "Arquivado";
      default:
        return "Publicado";
    }
  };

  const getAccentClass = (company?: string) => {
    switch (company) {
      case "JML":
        return "from-blue-500 to-indigo-600 border-blue-200/50 dark:border-blue-800/40";
      case "Conecta":
        return "from-emerald-500 to-teal-600 border-emerald-200/50 dark:border-emerald-800/40";
      default:
        return "from-violet-500 to-purple-600 border-violet-200/50 dark:border-violet-800/40";
    }
  };

  const getIconGradient = (company?: string) => {
    switch (company) {
      case "JML":
        return "from-blue-500 to-indigo-600";
      case "Conecta":
        return "from-emerald-500 to-teal-600";
      default:
        return "from-violet-500 to-purple-600";
    }
  };

  const openEditCourse = (course: Course) => {
    setSelectedCourse(course);
    setShowCourseManager(true);
  };

  const handleSearch = (query: string) => {
    console.log('Searching for:', query);
  };

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
      <Card className="p-6 bg-gradient-to-br from-white via-slate-50/50 to-violet-50/30 dark:from-slate-900 dark:via-slate-800/50 dark:to-violet-950/20 border border-slate-200/50 dark:border-slate-800/50 shadow-xl shadow-slate-500/5">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Buscar curso
            </label>
            <Input
              type="text"
              placeholder="Digite o nome do curso..."
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              className="h-11 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Empresa
            </label>
            <Select
              value={filters.empresa}
              onValueChange={(value) => setFilters((prev) => ({ ...prev, empresa: value }))}
            >
              <SelectTrigger className="h-11 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                <SelectValue placeholder="Todas as empresas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as empresas</SelectItem>
                {empresas.map((empresa) => (
                  <SelectItem key={empresa} value={empresa}>{empresa}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Tipo do curso
            </label>
            <Select
              value={filters.tipo}
              onValueChange={(value) => setFilters((prev) => ({ ...prev, tipo: value }))}
            >
              <SelectTrigger className="h-11 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {tipos.map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Segmentos
            </label>
            <div className="space-y-2">
              {segmentosDisponiveis.map((segmento) => (
                <label key={segmento} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={filters.segmentos.includes(segmento)}
                    onChange={() => handleSegmentToggle(segmento)}
                    className="w-4 h-4 text-violet-600 border-slate-300 dark:border-slate-600 rounded focus:ring-violet-500 focus:ring-2 bg-white dark:bg-slate-800"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                    {segmento}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {(filters.search || filters.empresa || filters.tipo || filters.segmentos.length > 0) && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {filteredCourses.length} curso(s) encontrado(s)
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilters({ empresa: "all", segmentos: [], tipo: "all", search: "" })}
              className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            >
              Limpar filtros
            </Button>
          </div>
        )}
      </Card>

      {/* LISTA DE CURSOS */}
      <div className="space-y-4">
        {loadingCourses && (
          <div className="flex justify-center py-12 text-muted-foreground">Carregando cursos...</div>
        )}

        {!loadingCourses && filteredCourses.map((course, index) => {
          const accent = getAccentClass(course.company);
          const statusColor = getStatusColor(course.status);
          const statusLabel = getStatusLabel(course.status);
          const primarySegment = course.segment ? [course.segment] : [];
          const extraSegments = Array.isArray(course.segments) ? course.segments : [];
          const segments = Array.from(new Set([...primarySegment, ...extraSegments].filter(Boolean)));
          const modality = Array.isArray(course.modality) && course.modality.length > 0 ? course.modality[0] : null;
          const views = (course as any).views_count ?? (course as any).views ?? null;

          return (
            <Card
              key={course.id}
              className={cn(
                "p-6 transition-all duration-300 hover:scale-[1.01] cursor-pointer border-2 bg-gradient-to-r",
                accent,
                index % 2 === 0
                  ? "from-white to-slate-50 dark:from-slate-900 dark:to-slate-950"
                  : "from-white to-violet-50/40 dark:from-slate-900 dark:to-violet-950/30"
              )}
              onClick={() => openEditCourse(course)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        "h-12 w-12 rounded-xl flex items-center justify-center shadow-sm bg-gradient-to-br text-white",
                        getIconGradient(course.company)
                      )}
                    >
                      {course.status === "draft" ? (
                        <Wand2 className="h-6 w-6" />
                      ) : (
                        <FileText className="h-6 w-6" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 mb-2 line-clamp-1">
                        {course.title}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-2">
                        {course.summary || "Sem descrição disponível"}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <Badge variant="secondary" className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                          {course.company || "Empresa"}
                        </Badge>
                        {course.course_type && (
                          <Badge variant="secondary" className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                            {course.course_type}
                          </Badge>
                        )}
                        {modality && (
                          <Badge variant="secondary" className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                            {modality}
                          </Badge>
                        )}
                        {course.duration_hours ? (
                          <span className="text-slate-600 dark:text-slate-400">
                            {course.duration_hours}h
                          </span>
                        ) : null}
                        {views ? (
                          <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {views}
                          </span>
                        ) : null}
                      </div>
                      {segments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {segments.map((segmento) => (
                            <span
                              key={segmento}
                              className="px-2 py-1 text-xs rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                            >
                              {segmento}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Badge className={cn("text-xs px-3 py-1 border", statusColor)}>
                    {statusLabel}
                  </Badge>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditCourse(course);
                      }}
                      className="h-9 w-9 rounded-lg"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowPDFUpload(true);
                      }}
                      className="h-9 w-9 rounded-lg"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
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
              Ajuste os filtros ou crie um novo curso.
            </p>
            <Button
              onClick={() => setShowNewCourseModal(true)}
              className="bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar curso
            </Button>
          </div>
        )}
      </div>

      {/* MODAIS */}
      {showCourseManager && (
        <CourseManager
          open={showCourseManager}
          onClose={() => {
            setShowCourseManager(false);
            setSelectedCourse(null);
          }}
          focusCourseId={selectedCourse?.id}
          focusCourseTitle={selectedCourse?.title}
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

