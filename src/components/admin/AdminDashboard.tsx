import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  X,
  Settings,
  FileText,
  BarChart3,
  Upload,
  Users,
  Clock,
  Shield,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  RefreshCw,
  Sparkles,
  Zap,
  Brain,
  Target,
  TrendingUp,
  Rocket,
  Star,
  Crown,
  Gem,
  Wand2,
  Activity,
  Calendar,
  Database,
  Workflow,
  Bell,
  Search,
  Filter,
  MoreHorizontal,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Info,
  Loader2
} from "lucide-react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useDashboardStats, useRecentActivities } from "@/hooks/useAdminStats";
import { CourseManager } from "@/components/admin/CourseManager";
import { PDFUploadManager } from "@/components/admin/PDFUploadManager";
import { AnalyticsDashboard } from "@/components/admin/AnalyticsDashboard";
import { AIImpactWidget } from "@/components/admin/AIImpactWidget";
import { cn } from "@/lib/utils";

interface AdminDashboardProps {
  open: boolean;
  onClose: () => void;
}

export function AdminDashboard({ open, onClose }: AdminDashboardProps) {
  const { user, logout, getTimeRemainingFormatted, extendSession } = useAdminAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [showCourseManager, setShowCourseManager] = useState(false);
  const [showPDFUploader, setShowPDFUploader] = useState(false);

  // Buscar dados reais via React Query
  const { data: dashboardStats, isLoading: statsLoading, refetch: refetchStats } = useDashboardStats();
  const { data: activitiesData, isLoading: activitiesLoading, refetch: refetchActivities } = useRecentActivities(5);

  // Auto-close se não estiver autenticado
  useEffect(() => {
    if (open && !user) {
      onClose();
    }
  }, [user, open, onClose]);

  const handleLogout = () => {
    logout();
    onClose();
  };

  const handleRefreshData = async () => {
    await Promise.all([
      refetchStats(),
      refetchActivities()
    ]);
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
      lastBackup: `${system.recentUploads} uploads nas �?ltimas horas`,
      activeSessions: system.totalUploads ?? 0,
      aiProcessing: system.aiProcessing ?? 0,
      systemLoad: Math.min(100, Math.round((system.memoryUsage ?? 0) * 100))
    };
  }, [dashboardStats]);

  // Calcular health status baseado nos dados reais
  const getSystemHealth = () => {
    if (!dashboardStats) return 'unknown';
    const { system } = dashboardStats;
    if (system.aiProcessing > 5) return 'warning';
    return 'excellent';
  };

  // Formatar uptime
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Formatar tempo relativo
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[95vh] p-0 overflow-hidden" aria-describedby="admin-dashboard-description">
        {/* HEADER PREMIUM */}
        <div className="relative overflow-hidden bg-gradient-to-r from-violet-600 via-purple-600 to-blue-600 text-white">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,...')] opacity-10"></div>
          <div className="relative flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm border border-white/20">
                <Crown className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  JML Admin Pro
                  <Gem className="h-5 w-5 text-yellow-300" />
                </h2>
                <p id="admin-dashboard-description" className="text-white/80 text-sm">
                  Bem-vindo de volta, {user?.username} • Sistema operacional
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden lg:flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20">
                  <Clock className="h-4 w-4" />
                  <span>Sessão: {getTimeRemainingFormatted()}</span>
                </div>
                <div className={cn(
                  "flex items-center gap-2 px-3 py-1 rounded-full border",
                  getHealthColor(getSystemHealth())
                )}>
                  <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
                  <span className="capitalize text-xs font-medium">{getSystemHealth()}</span>
                </div>
              </div>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={extendSession}
                className="text-white hover:bg-white/10 border border-white/20"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Estender
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                className="text-white hover:bg-white/10 border border-white/20"
              >
                Sair
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onClose}
                className="text-white hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-950">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            {/* NAVIGATION TABS */}
            <div className="bg-white dark:bg-gray-900 border-b px-6 pt-4">
              <TabsList className="grid w-full grid-cols-5 bg-gray-100 dark:bg-gray-800">
                <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
                  <Sparkles className="h-4 w-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </TabsTrigger>
                <TabsTrigger value="courses" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Cursos</span>
                </TabsTrigger>
                <TabsTrigger value="uploads" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
                  <Brain className="h-4 w-4" />
                  <span className="hidden sm:inline">IA Upload</span>
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Analytics</span>
                </TabsTrigger>
                <TabsTrigger value="system" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Sistema</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* OVERVIEW TAB */}
              <TabsContent value="overview" className="m-0 p-6 space-y-6">
                {/* QUICK STATS CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Cursos Totais</p>
                        {statsLoading ? (
                          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                        ) : (
                          <>
                            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{dashboardStats?.overview.totalCourses || 0}</p>
                            <p className="text-xs text-blue-600 dark:text-blue-400">{dashboardStats?.overview.publishedCourses || 0} publicados</p>
                          </>
                        )}
                      </div>
                      <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl">
                        <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-purple-600 dark:text-purple-400">IA Gerados</p>
                        {statsLoading ? (
                          <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                        ) : (
                          <>
                            <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{dashboardStats?.overview.coursesWithAI || 0}</p>
                            <p className="text-xs text-purple-600 dark:text-purple-400">{dashboardStats?.system.aiProcessing || 0} processando</p>
                          </>
                        )}
                      </div>
                      <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-xl">
                        <Brain className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-600 dark:text-green-400">Visualizações</p>
                        {statsLoading ? (
                          <Loader2 className="h-6 w-6 animate-spin text-green-600" />
                        ) : (
                          <>
                            <p className="text-2xl font-bold text-green-900 dark:text-green-100">{(dashboardStats?.overview.totalViews || 0).toLocaleString()}</p>
                            <p className="text-xs text-green-600 dark:text-green-400">{(dashboardStats?.overview.totalClicks || 0).toLocaleString()} cliques</p>
                          </>
                        )}
                      </div>
                      <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-xl">
                        <Eye className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border-orange-200 dark:border-orange-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Conversão</p>
                        {statsLoading ? (
                          <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
                        ) : (
                          <>
                            <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{dashboardStats?.overview.conversionRate.toFixed(1) || 0}%</p>
                            <p className="text-xs text-orange-600 dark:text-orange-400">{dashboardStats?.overview.totalConversions || 0} conversões</p>
                          </>
                        )}
                      </div>
                      <div className="p-3 bg-orange-100 dark:bg-orange-900/50 rounded-xl">
                        <Target className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                      </div>
                    </div>
                  </Card>
                </div>

                {/* MAIN CONTENT GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* AÇÕES RÁPIDAS */}
                  <Card className="p-6 bg-white dark:bg-gray-900">
                    <div className="flex items-center gap-2 mb-4">
                      <Rocket className="h-5 w-5 text-violet-600" />
                      <h3 className="font-semibold">Ações Rápidas</h3>
                    </div>
                    <div className="space-y-3">
                      <Button 
                        className="w-full justify-start bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700" 
                        onClick={() => setShowCourseManager(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Criar Novo Curso
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start border-purple-200 hover:bg-purple-50 dark:border-purple-800 dark:hover:bg-purple-950/20" 
                        onClick={() => setShowPDFUploader(true)}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Inteligente (IA)
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-950/20" 
                        onClick={() => setActiveTab("analytics")}
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Ver Analytics Avançado
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                        onClick={handleRefreshData}
                        disabled={statsLoading || activitiesLoading}
                      >
                        <RefreshCw className={cn("h-4 w-4 mr-2", (statsLoading || activitiesLoading) && "animate-spin")} />
                        Atualizar Dados
                      </Button>
                    </div>
                  </Card>

                  {/* STATUS DO SISTEMA */}
                  <Card className="p-6 bg-white dark:bg-gray-900">
                    <div className="flex items-center gap-2 mb-4">
                      <Activity className="h-5 w-5 text-green-600" />
                      <h3 className="font-semibold">Status do Sistema</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Uptime</span>
                        <Badge className="bg-green-100 text-green-700 border-green-200">{systemStats.uptime}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Último Backup</span>
                        <span className="text-sm text-muted-foreground">{systemStats.lastBackup}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Sessões Ativas</span>
                        <Badge variant="secondary">{systemStats.activeSessions}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">IA Processando</span>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                          <span className="text-sm">{systemStats.aiProcessing} PDFs</span>
                        </div>
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Carga do Sistema</span>
                          <span>{systemStats.systemLoad}%</span>
                        </div>
                        <Progress value={systemStats.systemLoad} className="h-2" />
                      </div>
                    </div>
                  </Card>
                </div>

                {/* ATIVIDADE RECENTE */}
                <Card className="p-6 bg-white dark:bg-gray-900">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Bell className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold">Atividade Recente</h3>
                    </div>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {activitiesLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : activitiesData?.activities && activitiesData.activities.length > 0 ? (
                      activitiesData.activities.map((activity, index) => {
                        const Icon = getActivityIcon(activity.type);
                        return (
                          <div key={index} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            <div className={cn(
                              "p-2 rounded-full",
                              getActivityStatusColor(activity.status)
                            )}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{activity.action}: {activity.title}</p>
                              <p className="text-xs text-muted-foreground">{formatRelativeTime(activity.timestamp)} atrás</p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">Nenhuma atividade recente</p>
                    )}
                  </div>
                </Card>

                {/* AI IMPACT WIDGET */}
                <AIImpactWidget />
              </TabsContent>

              {/* OUTRAS TABS */}
              <TabsContent value="courses" className="space-y-6 mt-0 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold">Gerenciador de Cursos</h3>
                    <p className="text-muted-foreground">Sistema completo de CRUD para todos os cursos</p>
                  </div>
                  <Button onClick={() => setShowCourseManager(true)} className="bg-gradient-to-r from-violet-600 to-blue-600">
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Curso
                  </Button>
                </div>
                <Card className="p-8 text-center bg-gradient-to-br from-violet-50 to-blue-50 dark:from-violet-950/20 dark:to-blue-950/20">
                  <FileText className="h-16 w-16 mx-auto text-violet-600 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Sistema de Cursos Premium</h3>
                  <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                    Interface completa para criar, editar e gerenciar todos os cursos. 
                    Formulários inteligentes, busca avançada, filtros dinâmicos e muito mais.
                  </p>
                  <Button onClick={() => setShowCourseManager(true)} size="lg" className="bg-gradient-to-r from-violet-600 to-blue-600">
                    <Wand2 className="h-5 w-5 mr-2" />
                    Abrir Gerenciador
                  </Button>
                </Card>
              </TabsContent>

              <TabsContent value="uploads" className="space-y-6 mt-0 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold">Upload Inteligente com IA</h3>
                    <p className="text-muted-foreground">Processamento automático de PDFs com 85%+ de precisão</p>
                  </div>
                  <Button onClick={() => setShowPDFUploader(true)} className="bg-gradient-to-r from-purple-600 to-pink-600">
                    <Upload className="h-4 w-4 mr-2" />
                    Novo Upload
                  </Button>
                </div>
                <Card className="p-8 text-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
                  <Brain className="h-16 w-16 mx-auto text-purple-600 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Processamento com IA Avançada</h3>
                  <p className="text-muted-foreground mb-4 max-w-2xl mx-auto">
                    Faça upload de PDFs e nossa inteligência artificial extrai automaticamente:
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg border">
                      <Sparkles className="h-6 w-6 mx-auto text-purple-600 mb-2" />
                      <p className="text-sm font-medium">Título & Resumo</p>
                    </div>
                    <div className="p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg border">
                      <Target className="h-6 w-6 mx-auto text-purple-600 mb-2" />
                      <p className="text-sm font-medium">Área & Nível</p>
                    </div>
                    <div className="p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg border">
                      <Users className="h-6 w-6 mx-auto text-purple-600 mb-2" />
                      <p className="text-sm font-medium">Público-alvo</p>
                    </div>
                    <div className="p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg border">
                      <FileText className="h-6 w-6 mx-auto text-purple-600 mb-2" />
                      <p className="text-sm font-medium">Tags & Módulos</p>
                    </div>
                  </div>
                  <Button onClick={() => setShowPDFUploader(true)} size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600">
                    <Zap className="h-5 w-5 mr-2" />
                    Iniciar Upload Inteligente
                  </Button>
                </Card>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6 mt-0 p-6">
                <AnalyticsDashboard />
              </TabsContent>

              <TabsContent value="system" className="space-y-6 mt-0 p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="p-6">
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Configurações do Sistema
                    </h4>
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full justify-start">
                        <Database className="h-4 w-4 mr-2" />
                        Gerenciar Base de Dados
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Workflow className="h-4 w-4 mr-2" />
                        Configurar Workflows
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Bell className="h-4 w-4 mr-2" />
                        Notificações & Alertas
                      </Button>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Backup & Segurança
                    </h4>
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full justify-start">
                        <Download className="h-4 w-4 mr-2" />
                        Download Backup Completo
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Activity className="h-4 w-4 mr-2" />
                        Logs de Auditoria
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Relatórios de Segurança
                      </Button>
                    </div>
                  </Card>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>

      {/* MODAIS DOS SUBSISTEMAS */}
      <CourseManager 
        open={showCourseManager} 
        onClose={() => setShowCourseManager(false)} 
      />
      
      <PDFUploadManager 
        open={showPDFUploader} 
        onClose={() => setShowPDFUploader(false)} 
      />
    </Dialog>
  );
}
