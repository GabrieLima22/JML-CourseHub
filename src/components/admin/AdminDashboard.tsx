import { useState, useEffect } from "react";
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
  Info
} from "lucide-react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { CourseManager } from "@/components/admin/CourseManager";
import { PDFUploadManager } from "@/components/admin/PDFUploadManager";
import { AnalyticsDashboard } from "@/components/admin/AnalyticsDashboard";
import { AIImpactWidget } from "@/components/admin/AIImpactWidget";
import { cn } from "@/lib/utils";

interface AdminDashboardProps {
  open: boolean;
  onClose: () => void;
}

// Mock data para demonstrar funcionalidades
const mockSystemStatus = {
  health: "excellent",
  uptime: "99.9%",
  lastBackup: "2 horas atrás",
  activeSessions: 24,
  todayUploads: 8,
  pendingTasks: 3,
  aiProcessing: 2,
  systemLoad: 23
};

const mockRecentActivities = [
  { id: 1, type: "upload", message: "PDF 'Licitações 2024' processado com sucesso", time: "5 min", status: "success" },
  { id: 2, type: "course", message: "Curso 'Compliance Avançado' criado por IA", time: "12 min", status: "success" },
  { id: 3, type: "user", message: "15 novos acessos ao curso 'Pregão Eletrônico'", time: "23 min", status: "info" },
  { id: 4, type: "system", message: "Backup automático concluído", time: "1 hora", status: "success" },
  { id: 5, type: "ai", message: "Processamento de 3 PDFs em andamento", time: "2 horas", status: "processing" }
];

const mockQuickStats = {
  totalCourses: 847,
  aiGenerated: 234,
  totalViews: 127896,
  conversionRate: 23.4,
  growthRate: 15.8,
  satisfaction: 4.8
};

export function AdminDashboard({ open, onClose }: AdminDashboardProps) {
  const { user, logout, getTimeRemainingFormatted, extendSession } = useAdminAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [showCourseManager, setShowCourseManager] = useState(false);
  const [showPDFUploader, setShowPDFUploader] = useState(false);
  const [systemStats, setSystemStats] = useState(mockSystemStatus);
  const [recentActivities, setRecentActivities] = useState(mockRecentActivities);
  const [refreshing, setRefreshing] = useState(false);

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
    setRefreshing(true);
    // Simular refresh de dados
    await new Promise(resolve => setTimeout(resolve, 1500));
    setRefreshing(false);
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
                  getHealthColor(systemStats.health)
                )}>
                  <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
                  <span className="capitalize text-xs font-medium">{systemStats.health}</span>
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
                        <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{mockQuickStats.totalCourses}</p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">+{mockQuickStats.growthRate}% este mês</p>
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
                        <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{mockQuickStats.aiGenerated}</p>
                        <p className="text-xs text-purple-600 dark:text-purple-400">Automação 85%+</p>
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
                        <p className="text-2xl font-bold text-green-900 dark:text-green-100">{mockQuickStats.totalViews.toLocaleString()}</p>
                        <p className="text-xs text-green-600 dark:text-green-400">Crescimento orgânico</p>
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
                        <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{mockQuickStats.conversionRate}%</p>
                        <p className="text-xs text-orange-600 dark:text-orange-400">Meta: 25%</p>
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
                        disabled={refreshing}
                      >
                        <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
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
                    {recentActivities.map((activity) => {
                      const Icon = getActivityIcon(activity.type);
                      return (
                        <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                          <div className={cn(
                            "p-2 rounded-full",
                            getActivityStatusColor(activity.status)
                          )}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{activity.message}</p>
                            <p className="text-xs text-muted-foreground">{activity.time} atrás</p>
                          </div>
                        </div>
                      );
                    })}
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
