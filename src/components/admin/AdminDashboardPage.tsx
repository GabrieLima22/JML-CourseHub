import { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation, Routes, Route } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createPortal } from "react-dom";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  FileText, BarChart3, Upload, Users, Clock, Plus, Eye, RefreshCw,
  Brain, Target, Rocket, Crown, Activity,
  Bell, Loader2, LogOut, Layout,
  LayoutDashboard, Settings, Layers, Building2, Zap,
  ChevronRight, CheckCircle, BookOpenCheck, CreditCard, Gift,
  Calendar, MapPin, Presentation, Search, X, Save,
  ArrowLeft, Globe, Video, Laptop, DollarSign, CheckSquare, ListChecks, List,
  AlignLeft, Type, Sparkles, Trash2, AlertTriangle, Hash, MonitorPlay, HelpCircle, Edit
} from "lucide-react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useDashboardStats, useRecentActivities } from "@/hooks/useAdminStats";
import { useToast } from "@/hooks/use-toast";
import { useCustomFields } from "@/hooks/useCustomFields";
import { useTaxonomies } from "@/hooks/useTaxonomies";
import { PDFUploadManager } from "@/components/admin/PDFUploadManager";
import { AnalyticsDashboard } from "@/components/admin/AnalyticsDashboard";
import { TaxonomyManager } from "@/components/admin/TaxonomyManager";
import { cn } from "@/lib/utils";
import { apiPost, apiPatch, apiDelete } from "@/services/api";
import { SchemaSelectorPage } from "./SchemaSelectorPage";
import { CourseBuilderPage } from "./CourseBuilderPage";

// --- CONSTANTES ---
const HEADER_HEIGHT = 64;
const SIDEBAR_WIDTH_EXPANDED = 260;
const SIDEBAR_WIDTH_COLLAPSED = 72;



// Adicione isso antes do return principal
  const animationStyles = `
    @keyframes move-slow {
      0% { transform: translate(0, 0) scale(1); }
      33% { transform: translate(30px, -50px) scale(1.1); }
      66% { transform: translate(-20px, 20px) scale(0.9); }
      100% { transform: translate(0, 0) scale(1); }
    }
    @keyframes slide-gradient {
      0% { background-position: 0% 50%; }
      100% { background-position: 100% 50%; }
    }
    .animate-blob {
      animation: move-slow 10s infinite alternate cubic-bezier(0.4, 0, 0.2, 1);
    }
    .animate-gradient-slide {
      background-size: 200% auto;
      animation: slide-gradient 4s linear infinite;
    }
    .delay-2000 { animation-delay: 2s; }
    .delay-4000 { animation-delay: 4s; }
  `;

// Componente utilitário para envolver páginas que precisam de scroll e padding padrão
const PageWrapper = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("h-full overflow-y-auto custom-scrollbar p-6 lg:p-8 w-full", className)}>
    {children}
  </div>
);

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAdminAuth();
  const [showPDFUploader, setShowPDFUploader] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Hooks de Dados
  const { data: dashboardStats } = useDashboardStats();
  const { data: activitiesData } = useRecentActivities(5);

  const currentPath = location.pathname.split('/').pop() || 'dashboard';
  const isBuilderMode = location.pathname.startsWith("/admin/fields");
  const activePage = ['dashboard', 'courses', 'analytics', 'config'].includes(currentPath) ? currentPath : 'dashboard';
  const contentMarginLeft = isBuilderMode ? 0 : (sidebarCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED);

  const handleLogout = () => { logout(); navigate('/'); };
  const handleNavigate = (page: string) => navigate(`/admin/${page}`);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "courses", label: "Meus Cursos", icon: FileText },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "config", label: "Configurações", icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] dark:from-slate-950 dark:via-indigo-950/40 dark:to-slate-950 font-sans selection:bg-violet-200 dark:selection:bg-violet-900/60 transition-colors duration-500 overflow-hidden">
      
      {/* ========== HEADER FIXO ========== */}
    <style>{animationStyles}</style>

      {/* ========== HEADER ANIMADO ========== */}
     <style>{animationStyles}</style>

    {/* ========== HEADER ANIMADO ========== */}
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300 overflow-hidden",
          "border-b border-slate-200/80 dark:border-slate-800/60 shadow-sm"
        )}
        style={{ height: `${HEADER_HEIGHT}px` }}
      >
        {/* --- 1. BACKGROUND VIVO (Bolhas dentro da barra) --- */}
        <div className="absolute inset-0 bg-white/90 dark:bg-[#02040a]/90 z-0" /> 
        
        <div className="absolute top-[-50%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/20 dark:bg-emerald-500/10 rounded-full blur-[80px] animate-blob z-0 mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute top-[-50%] right-[20%] w-[400px] h-[400px] bg-violet-500/20 dark:bg-violet-500/10 rounded-full blur-[80px] animate-blob delay-2000 z-0 mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute bottom-[-50%] right-[-10%] w-[600px] h-[600px] bg-blue-500/20 dark:bg-blue-500/10 rounded-full blur-[80px] animate-blob delay-4000 z-0 mix-blend-multiply dark:mix-blend-screen" />

        {/* --- 2. LINHA DE GRADIENTE SUPERIOR (ANIMADA) --- */}
        <div 
          className="absolute top-0 left-0 right-0 h-[3px] opacity-90 z-20 shadow-[0_0_10px_rgba(139,92,246,0.5)] animate-gradient-slide"
          style={{ backgroundImage: 'linear-gradient(to right, #8b5cf6, #06b6d4, #10b981, #8b5cf6)' }}
        />

        {/* --- 3. CONTEÚDO DO HEADER --- */}
        <div className="relative z-10 h-full flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="relative group cursor-pointer">
                <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-lg blur opacity-30 dark:opacity-50 group-hover:opacity-60 transition duration-500" />
                <div className="relative bg-gradient-to-br from-violet-600 to-indigo-700 p-2 rounded-lg shadow-lg">
                  <Crown className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="hidden sm:block">
                <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">JML</span>
                <span className="font-light text-lg text-slate-500 dark:text-slate-400 ml-1">Admin</span>
              </div>
            </div>

            {!isBuilderMode && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="text-slate-500 hover:text-violet-600 hover:bg-violet-50/50 dark:hover:bg-violet-950/20 dark:hover:text-violet-400 rounded-xl transition-all ml-2"
              >
                {sidebarCollapsed ? <ChevronRight size={18} /> : <LayoutDashboard size={18} />}
              </Button>
            )}
          </div>

          <div className="flex items-center gap-4">
            {isBuilderMode ? (
              <Button
                variant="ghost"
                onClick={() => navigate("/admin/config")}
                className="rounded-full bg-slate-100/80 text-slate-700 hover:bg-slate-200 dark:bg-slate-800/50 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar às Configurações
              </Button>
            ) : (
              <>
                <div className="hidden md:flex items-center gap-2.5 px-4 py-2 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-full border border-emerald-200/50 dark:border-emerald-800/30 shadow-sm backdrop-blur-sm">
                  <div className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                  </div>
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Sistema Online</span>
                </div>

                <Separator orientation="vertical" className="h-8 bg-slate-200/60 dark:bg-slate-700/60 hidden md:block" />

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-slate-500 hover:text-rose-600 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 dark:hover:text-rose-400 rounded-xl transition-all font-medium"
                >
                  <LogOut className="w-4 h-4 mr-2" /> Sair
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ========== SIDEBAR ========== */}
     {/* ========== SIDEBAR ANIMADA ========== */}
      <aside
        className={cn(
          "fixed left-0 z-40 transition-all duration-300 ease-in-out flex flex-col overflow-hidden",
          "border-r border-slate-200/80 dark:border-slate-800/60 shadow-xl shadow-slate-200/20 dark:shadow-none",
          sidebarCollapsed ? "items-center" : "",
          isBuilderMode ? "-translate-x-full opacity-0 pointer-events-none" : "translate-x-0 opacity-100"
        )}
        style={{
          top: `${HEADER_HEIGHT}px`,
          height: `calc(100vh - ${HEADER_HEIGHT}px)`,
          width: sidebarCollapsed ? `${SIDEBAR_WIDTH_COLLAPSED}px` : `${SIDEBAR_WIDTH_EXPANDED}px`
        }}
      >
        {/* --- BACKGROUND VIVO (Bolhas Verticais) --- */}
        <div className="absolute inset-0 bg-white/90 dark:bg-[#02040a]/90 z-0" />
        
        {/* Bolhas se movendo verticalmente */}
        <div className="absolute top-[-10%] left-[-50%] w-[300px] h-[300px] bg-violet-500/15 dark:bg-violet-500/10 rounded-full blur-[60px] animate-blob z-0" />
        <div className="absolute top-[40%] right-[-50%] w-[300px] h-[300px] bg-blue-500/15 dark:bg-blue-500/10 rounded-full blur-[60px] animate-blob delay-2000 z-0" />
        <div className="absolute bottom-[-10%] left-[-50%] w-[300px] h-[300px] bg-emerald-500/15 dark:bg-emerald-500/10 rounded-full blur-[60px] animate-blob delay-4000 z-0" />

        {/* --- CONTEÚDO DA SIDEBAR --- */}
        <nav className="p-4 space-y-2 w-full relative z-10 mt-2">
         {/* ... dentro do <aside> ... */}
          
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={cn(
                  "flex items-center relative group overflow-hidden transition-all duration-300",
                  // LAYOUT: Se expandido (largura total), se colapsado (quadrado centralizado)
                  !sidebarCollapsed 
                    ? "w-full gap-3 px-3 py-3 rounded-xl justify-start" 
                    : "w-11 h-11 rounded-2xl justify-center mx-auto mb-2", // Quadrado perfeito no modo fechado
                  
                  // CORES E ESTILO ATIVO
                  isActive 
                    ? (!sidebarCollapsed
                        ? "bg-violet-50/80 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 border border-violet-200/50 dark:border-violet-700/30 shadow-sm" // Estilo Expandido
                        : "bg-transparent text-violet-700 dark:text-violet-300" // Estilo Colapsado (Sem fundo, clean)
                      )
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/30 hover:text-slate-900 dark:hover:text-slate-200"
                )}
              >
                {/* Indicador Lateral (Apenas visível quando expandido) */}
                {isActive && !sidebarCollapsed && (
                   <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-violet-600 rounded-r-full animate-in fade-in slide-in-from-left-1" />
                )}

                {/* Ícone (Container com gradiente) */}
                <div className={cn(
                  "flex items-center justify-center transition-all duration-300",
                  // No modo colapsado, aumentamos um pouquinho o container do ícone para preencher o botão
                  !sidebarCollapsed ? "p-1.5 rounded-lg" : "p-2.5 rounded-xl",
                  isActive 
                    ? "bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-md shadow-violet-500/30" 
                    : "bg-white/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 group-hover:bg-white group-hover:shadow-sm dark:group-hover:bg-slate-700"
                )}>
                  <Icon size={!sidebarCollapsed ? 18 : 20} />
                </div>
                
                {/* Texto (Apenas expandido) */}
                {!sidebarCollapsed && (
                  <span className="font-medium truncate animate-in fade-in slide-in-from-left-2 duration-300">
                    {item.label}
                  </span>
                )}

                {/* Tooltip flutuante (Apenas colapsado) */}
                {sidebarCollapsed && (
                   <div className="absolute left-full ml-4 px-3 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-50 shadow-xl translate-x-[-10px] group-hover:translate-x-0">
                      {item.label}
                      {/* Setinha do tooltip */}
                      <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-slate-900 dark:bg-white rotate-45" />
                   </div>
                )}
              </button>
            )
          })}
        </nav>

        {!sidebarCollapsed && (
          <div className="mt-auto p-4 w-full relative z-10">
            <div className="p-4 rounded-xl bg-white/40 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-700/30 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/20">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">JML CourseHub</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-500">v2.5.0 Pro</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>
      
      {/* Styles para Scrollbar */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(139, 92, 246, 0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(139, 92, 246, 0.5); }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(139, 92, 246, 0.2); }
      `}</style>

      {/* ========== MAIN MODIFICADO (Sem overflow-y-auto global) ========== */}
      <main
        className="transition-all duration-300 ease-in-out relative z-10 flex flex-col overflow-hidden"
        style={{
          marginLeft: `${contentMarginLeft}px`,
          marginTop: `${HEADER_HEIGHT}px`,
          height: `calc(100vh - ${HEADER_HEIGHT}px)`,
        }}
      >
        {/* Removemos o padding global e o overflow daqui para controlar individualmente nas views */}
        <Routes>
           <Route index element={<PageWrapper><DashboardView stats={dashboardStats} activities={activitiesData} navigate={handleNavigate} /></PageWrapper>} />
           <Route path="dashboard" element={<PageWrapper><DashboardView stats={dashboardStats} activities={activitiesData} navigate={handleNavigate} /></PageWrapper>} />
           
           {/* Rota de Cursos e Editor não usa PageWrapper aqui, pois controla seu próprio layout */}
           <Route path="courses" element={<CoursesView onClose={() => navigate('/admin/dashboard')} />} />
           
           <Route path="fields" element={<PageWrapper><SchemaSelectorPage /></PageWrapper>} />
           <Route path="fields/:id" element={<PageWrapper><CourseBuilderPage /></PageWrapper>} /> 

           <Route path="analytics" element={<PageWrapper><AnalyticsDashboard /></PageWrapper>} />
           <Route path="config" element={<PageWrapper><ConfigView navigate={handleNavigate} /></PageWrapper>} />
        </Routes>
      </main>

      {/* Modais */}
      <PDFUploadManager
        open={showPDFUploader}
        onClose={() => setShowPDFUploader(false)}
      />
    </div>
  );
}

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

const DashboardView = ({ stats, activities, navigate }: any) => {
  const loading = !stats;
  
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Visão Geral
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-lg">Resumo de desempenho do hub educacional.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
            <FileText className="w-32 h-32 text-blue-600" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                 <FileText className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total de Cursos</span>
            </div>
            {loading ? <Loader2 className="animate-spin text-blue-600"/> : (
              <div>
                <span className="text-4xl font-extrabold text-slate-900 dark:text-white block tracking-tight">{stats?.overview.totalCourses || 0}</span>
                <div className="mt-2"><Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-0">{stats?.overview.publishedCourses || 0} Ativos</Badge></div>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
            <Brain className="w-32 h-32 text-violet-600" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
               <div className="p-2.5 rounded-xl bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400">
                 <Brain className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Processados por IA</span>
            </div>
            {loading ? <Loader2 className="animate-spin text-violet-600"/> : (
              <div>
                 <span className="text-4xl font-extrabold text-slate-900 dark:text-white block tracking-tight">{stats?.overview.coursesWithAI || 0}</span>
                  <span className="text-sm text-slate-400 mt-2 inline-block font-medium">Conteúdos automatizados</span>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
            <Target className="w-32 h-32 text-emerald-600" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
               <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                 <Target className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Interações</span>
            </div>
            {loading ? <Loader2 className="animate-spin text-emerald-600"/> : (
              <div>
                <span className="text-4xl font-extrabold text-slate-900 dark:text-white block tracking-tight">{(stats?.overview.totalViews || 0).toLocaleString()}</span>
                <span className="text-sm text-emerald-600 dark:text-emerald-400 mt-2 inline-block font-medium">Visualizações totais</span>
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
           <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg"><Rocket className="w-5 h-5 text-slate-700 dark:text-slate-300" /></div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Ações Rápidas</h3>
           </div>
           <div className="space-y-4">
              <Button onClick={() => navigate("courses")} className="w-full justify-between h-14 px-6 bg-slate-900 hover:bg-slate-800 text-white dark:bg-violet-600 dark:hover:bg-violet-700 shadow-lg group transition-all">
                 <span className="flex items-center gap-3 font-semibold text-base"><Plus className="w-5 h-5 bg-white/20 rounded-full p-0.5" /> Criar Novo Curso</span>
                 <ChevronRight className="w-5 h-5 opacity-70 group-hover:translate-x-1 transition-transform" />
              </Button>
              <div className="grid grid-cols-2 gap-4">
                 <Button variant="outline" onClick={() => navigate("analytics")} className="h-12 justify-start hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                    <BarChart3 className="w-4 h-4 mr-2 text-blue-500" /> Analytics
                 </Button>
                 <Button variant="outline" onClick={() => navigate("config")} className="h-12 justify-start hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                    <Settings className="w-4 h-4 mr-2 text-slate-500" /> Ajustes
                 </Button>
              </div>
           </div>
        </Card>

        <Card className="p-6 border-slate-200 dark:border-slate-800 shadow-sm flex flex-col bg-white dark:bg-slate-900">
           <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg"><Bell className="w-5 h-5 text-slate-700 dark:text-slate-300" /></div>
                 <h3 className="text-lg font-bold text-slate-900 dark:text-white">Feed de Atividade</h3>
              </div>
           </div>
           <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 max-h-[220px]">
              {!activities ? <div className="flex justify-center py-10"><Loader2 className="animate-spin text-slate-400"/></div> : (
                <div className="relative border-l-2 border-slate-100 dark:border-slate-800 ml-3 space-y-6 pb-2">
                  {activities.activities?.map((act: any, i: number) => (
                    <div key={i} className="ml-6 relative group">
                       <div className="absolute -left-[31px] top-0 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-full p-1 group-hover:border-violet-400 transition-colors">
                          <Activity className="w-3 h-3 text-slate-400 group-hover:text-violet-500" />
                       </div>
                       <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{act.action}</p>
                          <p className="text-xs text-slate-500">{act.title}</p>
                       </div>
                    </div>
                  ))}
                </div>
              )}
           </div>
        </Card>
      </div>
    </div>
  );
};

const ConfigView = ({ navigate }: { navigate: (path: string) => void }) => {
  const [showTaxonomy, setShowTaxonomy] = useState(false);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-5xl mx-auto">
      <TaxonomyManager open={showTaxonomy} onClose={() => setShowTaxonomy(false)} />
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
           <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              <div className="p-2.5 bg-slate-900 dark:bg-slate-800 rounded-xl text-white shadow-lg shadow-slate-900/20">
                 <Settings className="w-6 h-6" />
              </div>
              Configurações
           </h2>
           <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
              Central de personalização da estrutura de dados.
           </p>
        </div>
      </div>
      
      {/* --- GRID DE OPÇÕES --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card 1: Campos Personalizados */}
        <div 
           onClick={() => navigate('fields')}
           className="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111623] p-8 cursor-pointer hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300 hover:-translate-y-1"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="flex items-start justify-between mb-6">
               <div className="p-3.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-sm">
                  <Type className="w-8 h-8" />
               </div>
               <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400 group-hover:text-emerald-500 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/20 transition-all">
                  <ChevronRight className="w-5 h-5" />
               </div>
            </div>
            
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
               Campos Personalizados
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
               Crie e gerencie campos dinâmicos para seus cursos (textos, datas, números) que aparecerão no formulário de criação.
            </p>
        </div>

        {/* Card 2: Taxonomias */}
        <div 
           onClick={() => setShowTaxonomy(true)}
           className="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111623] p-8 cursor-pointer hover:shadow-2xl hover:shadow-violet-500/10 transition-all duration-300 hover:-translate-y-1"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="flex items-start justify-between mb-6">
               <div className="p-3.5 bg-violet-50 dark:bg-violet-900/20 text-violet-600 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-sm">
                  <Layers className="w-8 h-8" />
               </div>
               <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400 group-hover:text-violet-500 group-hover:bg-violet-50 dark:group-hover:bg-violet-900/20 transition-all">
                  <ChevronRight className="w-5 h-5" />
               </div>
            </div>
            
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
               Gerenciador de Taxonomias
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
               Edite as listas globais do sistema: Nomes de Empresas, Tipos de Cursos (Modalidades) e Segmentos de Mercado.
            </p>
        </div>

      </div>

      {/* --- RODAPÉ VISUAL DE STATUS (Decorativo) --- */}
      <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
         <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Status do Sistema</h4>
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
               <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">API Conectada</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-blue-500" />
               <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">v2.5.0 Pro</span>
            </div>
             <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 flex items-center gap-3 opacity-60">
               <div className="w-2 h-2 rounded-full bg-amber-500" />
               <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Backup Diário</span>
            </div>
         </div>
      </div>
    </div>
  );
};

function CoursesView({ onClose }: { onClose: () => void }) {
  const apiBase = (import.meta as any).env?.VITE_API_URL || "http://localhost:3001/api";
  const [showNewCourseModal, setShowNewCourseModal] = useState(false);
  const [showPDFUpload, setShowPDFUpload] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("basic");
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [filters, setFilters] = useState({ search: "", empresas: [] as string[], tipos: [] as string[], segmentos: [] as string[] });
  const { data: taxonomies } = useTaxonomies();
  const { data: customFieldsData } = useCustomFields();

  const companyOptions = taxonomies?.companies ?? [{ id: "JML", label: "JML" }, { id: "Conecta", label: "Conecta" }];
  
  const courseTypeOptions = taxonomies?.courseTypes ?? [
    { id: "ead", label: "EAD/Online" },
    { id: "presencial", label: "Presencial" },
    { id: "incompany", label: "In Company" },
    { id: "hibrido", label: "Híbrido" }
  ];

  const segmentOptions = taxonomies?.segments ?? [{ id: "Estatais", label: "Estatais" }, { id: "Judiciário", label: "Judiciário" }, { id: "Sistema S", label: "Sistema S" }];

  const modalityColorMap: Record<string, string> = {
    ead: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
    presencial: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
    incompany: "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800",
    hibrido: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800"
  };

  const getModalityColor = (mod: string) => {
    const normalized = (mod || "").toLowerCase();
    if (normalized.includes("ead") || normalized.includes("online")) return modalityColorMap.ead;
    if (normalized.includes("presencial")) return modalityColorMap.presencial;
    if (normalized.includes("company")) return modalityColorMap.incompany;
    if (normalized.includes("híbrido") || normalized.includes("hibrido")) return modalityColorMap.hibrido;
    return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300";
  };

  const getSegmentLabel = (segment: string) => {
    const option = segmentOptions.find(opt => opt.id.toLowerCase() === segment?.toLowerCase());
    return option?.label || segment;
  };

  const getUniqueSegments = (course: any) => {
    const rawSegments = Array.isArray(course.segmentos) && course.segmentos.length
      ? course.segmentos
      : course.segmento
        ? [course.segmento]
        : [];
    const seen = new Set<string>();
    return rawSegments.reduce<string[]>((acc, seg) => {
      const normalized = (seg || "").trim();
      if (!normalized) return acc;
      const key = normalized.toLowerCase();
      if (seen.has(key)) return acc;
      seen.add(key);
      acc.push(normalized);
      return acc;
    }, []);
  };

  const getCompanyColor = (comp: string) => {
     return comp === 'JML' 
       ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-md shadow-violet-500/20" 
       : "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/20";
  };

  const getCompanyTagColor = (comp: string) => {
    return comp === 'JML'
      ? "bg-violet-50 border-violet-200 text-violet-700 dark:bg-violet-900/20 dark:border-violet-800 dark:text-violet-200"
      : "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-200";
  };

  const normalizeTipo = (t: string) => t?.toLowerCase().includes('ead') ? 'ead' : 'aberto';
  const mapStatus = (s: string) => s === 'published' ? 'Publicado' : 'Rascunho';
  const mapStatusToBackend = (s?: string) => {
    if (!s) return undefined;
    if (s === 'Publicado') return 'published';
    if (s === 'Rascunho') return 'draft';
    return s.toLowerCase();
  };

  const toggleFilter = (field: "empresas" | "tipos" | "segmentos", value: string) => {
    setFilters(prev => {
      const exists = prev[field].includes(value);
      const nextValues = exists ? prev[field].filter(v => v !== value) : [...prev[field], value];
      return { ...prev, [field]: nextValues };
    });
  };

  const fetchCourses = async () => {
    setLoadingCourses(true);
    try {
      const res = await fetch(`${apiBase}/courses?status=all&limit=200`);
      const json = await res.json();
      const apiCourses = json?.data?.courses || json?.courses || [];
      setCourses(apiCourses.map((c: any) => {
        const publicoAlvoArray = Array.isArray(c.publico_alvo) ? c.publico_alvo : [];
        const publicoAlvoText = publicoAlvoArray.join("\n");
        const segmentosArray = [
          ...(Array.isArray(c.segmentos_adicionais) ? c.segmentos_adicionais : []),
        ];
        if (c.segmento) segmentosArray.unshift(c.segmento);
        const speakers = Array.isArray(c.professores)
          ? c.professores.map((p: any) => ({
              name: p.nome || "",
              role: p.cargo || "",
              company: p.empresa || "",
              bio: p.bio || "",
              photo: p.foto || "",
              curriculum: p.curriculo || ""
            }))
          : [];
        return {
          ...c,
          title: c.titulo || c.title || "",
          summary: c.summary || "",
          description: c.description || "",
          apresentacao: c.apresentacao || "",
          modality: Array.isArray(c.modalidade) ? c.modalidade : [c.tipo || 'Aberto'],
          status: mapStatus(c.status),
          visualizacoes: c.views_count || 0,
          duration_hours: c.carga_horaria || 0,
          preco_online: c.preco_online ?? "",
          preco_presencial: c.preco_presencial ?? "",
          preco_incompany: c.preco_incompany ?? "",
          preco_resumido: c.preco_resumido ?? "",
          investimento: c.investimento ?? null,
          forma_pagamento: Array.isArray(c.forma_pagamento) ? c.forma_pagamento : [],
          data_inicio: c.data_inicio ? c.data_inicio.split('T')[0] : "",
          data_fim: c.data_fim ? c.data_fim.split('T')[0] : "",
          local: c.local || "",
          custom_fields: c.custom_fields || {},
          speakers,
          palestrantes: Array.isArray(c.palestrantes) ? c.palestrantes : speakers,
          segmento: c.segmento || segmentosArray[0] || "Estatais",
          segmentos: segmentosArray.length ? segmentosArray : ["Estatais"],
          publico_alvo: publicoAlvoArray,
          target_audience: publicoAlvoText,
          vantagens: Array.isArray(c.vantagens) ? c.vantagens : [],
          vantagens_ead: Array.isArray(c.vantagens_ead) ? c.vantagens_ead : [],
          objetivos: Array.isArray(c.objetivos) ? c.objetivos : [],
          deliverables: Array.isArray(c.deliverables) ? c.deliverables : [],
        };
      }));
    } catch (err) { console.error(err); setCourses([]); }
    finally { setLoadingCourses(false); }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const { toast } = useToast();

  const handleSaveCourse = async (courseToSave: any) => {
    try {
        const normalizeDate = (value?: string | null) => {
            if (!value || value.trim() === '') return null;
            // Se já está no formato ISO, retornar como está
            if (value.includes('T') && value.includes('Z')) return value;
            // Se está no formato YYYY-MM-DD, adicionar tempo UTC
            if (/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
                return `${value.trim()}T00:00:00.000Z`;
            }
            // Tentar parsear como data
            const d = new Date(value);
            return isNaN(d.getTime()) ? null : d.toISOString();
        };

        // Remove campos undefined do payload para não sobrescrever valores existentes
        const cleanPayload = (obj: any) => {
            const cleaned: any = {};
            Object.keys(obj).forEach(key => {
                if (obj[key] !== undefined) {
                    cleaned[key] = obj[key];
                }
            });
            return cleaned;
        };

        const payload = cleanPayload({
            titulo: courseToSave.title || courseToSave.titulo,
            summary: courseToSave.summary,
            apresentacao: courseToSave.apresentacao,
            description: courseToSave.description,
            empresa: courseToSave.empresa,
            status: mapStatusToBackend(courseToSave.status),
            data_inicio: normalizeDate(courseToSave.data_inicio),
            data_fim: normalizeDate(courseToSave.data_fim),
            local: courseToSave.local,
            carga_horaria: Number(courseToSave.duration_hours) || 0,
            preco_online: courseToSave.preco_online && courseToSave.preco_online !== '' ? Number(courseToSave.preco_online) : undefined,
            preco_presencial: courseToSave.preco_presencial && courseToSave.preco_presencial !== '' ? Number(courseToSave.preco_presencial) : undefined,
            preco_incompany: courseToSave.preco_incompany && courseToSave.preco_incompany !== '' ? Number(courseToSave.preco_incompany) : undefined,
            preco_resumido: courseToSave.preco_resumido,
            publico_alvo: courseToSave.target_audience ? String(courseToSave.target_audience).split('\n').filter(Boolean) : [],
            palestrantes: (courseToSave.palestrantes || []).map((s: any) => ({
                nome: s.nome || '',
                curriculo: s.curriculo || '',
                imagem: s.imagem || s.photo || s.foto || '',
            })),
            objetivos: courseToSave.objetivos || [],
            aprendizados: courseToSave.aprendizados || [],
            vantagens: courseToSave.vantagens || [],
            vantagens_ead: courseToSave.vantagens_ead || [],
            deliverables: Array.isArray(courseToSave.deliverables) ? courseToSave.deliverables : (courseToSave.deliverables ? String(courseToSave.deliverables).split('\n').filter(Boolean) : []),
            forma_pagamento: courseToSave.forma_pagamento || [],
            tags: courseToSave.tags || [],
            badges: courseToSave.badges || [],
            related_ids: courseToSave.related_ids || [],
            motivos_participar: courseToSave.motivos_participar || [],
            orientacoes_inscricao: courseToSave.orientacoes_inscricao || [],
            modalidade: courseToSave.modality || [],
            segmentos: courseToSave.segmentos || [],
            segmento: courseToSave.segmentos?.[0] || 'Estatais',
            categoria: courseToSave.categoria || courseToSave.segmentos?.[0] || 'Geral',
            segmentos_adicionais: (courseToSave.segmentos || []).slice(1),
            tipo: normalizeTipo(courseToSave.modality?.[0] || courseToSave.tipo || ""),
            coordenacao: courseToSave.coordenacao || null,
            contatos: courseToSave.contatos || null,
            custom_fields: courseToSave.custom_fields || {},
            custom_schema: courseToSave.custom_schema || [],
            investimento: courseToSave.investimento ?? {},
            programacao: courseToSave.programacao || [],
        });

        if (courseToSave.id) {
            await apiPatch(`/api/courses/${courseToSave.id}`, payload);
            toast({ title: "Curso atualizado", description: "As alterações foram salvas com sucesso." });
        } else {
            const res = await apiPost(`/api/courses`, payload);
            toast({ title: "Curso criado", description: "O novo curso foi salvo com sucesso." });
        }

        await fetchCourses();
        setEditingCourse(null);
    } catch (error: any) {
        console.error("Erro ao salvar curso:", error);
        toast({ title: "Erro ao salvar", description: error?.message || "Ocorreu um erro.", variant: "destructive" });
    }
  };

  const filteredCourses = courses.filter(c => {
     return (!filters.search || c.title?.toLowerCase().includes(filters.search.toLowerCase())) &&
            (filters.empresas.length === 0 || filters.empresas.includes(c.empresa));
  });

  const getStatusColor = (s: string) => s === 'Publicado' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200";

  // --- MODO EDIÇÃO ---
  if (editingCourse) {
     return <CourseEditForm
        course={editingCourse}
        setCourse={setEditingCourse}
        onSave={handleSaveCourse}
        onCancel={() => { setEditingCourse(null); setActiveTab('basic'); fetchCourses(); }}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        options={{ segmentos: segmentOptions, empresas: companyOptions }}
        customFields={customFieldsData || []}
     />;
  }

  // --- MODO LISTA ---
  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
       
     {/* --- MODAL NOVO CURSO --- */}
       {showNewCourseModal && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 transition-all">
           <div className="bg-white dark:bg-[#111623] rounded-2xl shadow-2xl max-w-2xl w-full p-0 border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200 relative">
              <div className="p-8 text-center bg-slate-50 dark:bg-[#151b2b] border-b border-slate-100 dark:border-slate-800/50 relative">
                 <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-600 via-blue-600 to-emerald-500" />
                 <div className="w-16 h-16 bg-white dark:bg-[#1E2536] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700">
                    <Plus size={32} className="text-violet-600 dark:text-violet-400" />
                 </div>
                 <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Criar Novo Curso</h3>
                 <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">Selecione o método de criação. Você pode usar nossa IA para estruturar o conteúdo ou começar do zero.</p>
              </div>
              <div className="p-8 grid md:grid-cols-2 gap-4">
                 <button onClick={() => { setShowNewCourseModal(false); setShowPDFUpload(true); }} className="group relative p-6 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-violet-500/50 bg-white dark:bg-[#1E2536] text-left transition-all hover:shadow-lg hover:-translate-y-0.5">
                    <div className="w-12 h-12 bg-violet-50 dark:bg-violet-900/20 rounded-lg flex items-center justify-center text-violet-600 dark:text-violet-400 mb-4 group-hover:scale-110 transition-transform"><Brain size={24} /></div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-1 group-hover:text-violet-600 transition-colors">Via IA (PDF)</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Extração e estruturação automática.</p>
                 </button>
                 <button
                    onClick={() => {
                      setShowNewCourseModal(false);
                      setActiveTab("basic");
                      setEditingCourse({
                        id: null,
                        title: "",
                        empresa: "JML",
                        modality: [],
                        duration_hours: 8,
                        segmentos: [],
                        segmento: "Estatais",
                        summary: "",
                        description: "",
                        custom_fields: {},
                        status: "Rascunho",
                      });
                    }}
                    className="group relative p-6 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 bg-white dark:bg-[#1E2536] text-left transition-all hover:shadow-lg hover:-translate-y-0.5">
                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4 group-hover:scale-110 transition-transform"><FileText size={24} /></div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-1 group-hover:text-blue-600 transition-colors">Manual</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Controle total desde o início.</p>
                 </button>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-[#151b2b] border-t border-slate-100 dark:border-slate-800 flex justify-center">
                 <Button variant="ghost" onClick={() => setShowNewCourseModal(false)} className="text-slate-500 hover:text-slate-900">Cancelar</Button>
              </div>
           </div>
        </div>,
        document.body
       )}

       {/* HEADER LISTA */}
       <div className="flex justify-between items-center">
          <div>
             <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Catálogo</h2>
             <p className="text-slate-500 dark:text-slate-400 text-sm">Gerenciamento de conteúdo.</p>
          </div>
          <Button onClick={() => setShowNewCourseModal(true)} className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-violet-600 dark:hover:bg-violet-700 shadow-md">
             <Plus className="w-4 h-4 mr-2" /> Novo Curso
          </Button>
       </div>

       {/* BARRA DE FILTROS E BUSCA */}
       <Card className="p-1.5 bg-white dark:bg-[#111623] border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl">
          <div className="flex flex-col lg:flex-row gap-4 items-center p-2">
             <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                   type="text" 
                   placeholder="Buscar por título, tag ou palavra-chave..." 
                   value={filters.search} 
                   onChange={e => setFilters(prev => ({...prev, search: e.target.value}))} 
                   className="w-full pl-10 h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-sm focus:ring-2 focus:ring-violet-500 outline-none transition-all" 
                />
             </div>
             
             <div className="flex items-center gap-3 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0 no-scrollbar">
                <div className="flex gap-1">
                   {companyOptions.map(opt => (
                      <button 
                        key={opt.id} 
                        onClick={() => setFilters(prev => ({...prev, empresas: prev.empresas.includes(opt.id) ? [] : [opt.id]}))} 
                        className={cn(
                           "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all", 
                           filters.empresas.includes(opt.id) 
                              ? "bg-slate-800 text-white border-slate-800 dark:bg-white dark:text-slate-900" 
                              : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50"
                        )}
                      >
                         {opt.label}
                      </button>
                   ))}
                </div>

                <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1 shrink-0" />

                <div className="flex gap-1">
                   {courseTypeOptions.map(opt => (
                      <button 
                        key={opt.id} 
                        onClick={() => toggleFilter("tipos", opt.id)} 
                        className={cn(
                           "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all whitespace-nowrap", 
                           filters.tipos.includes(opt.id) 
                              ? "bg-violet-100 border-violet-200 text-violet-700 dark:bg-violet-900/30 dark:border-violet-800 dark:text-violet-300" 
                              : "bg-transparent border-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                        )}
                      >
                         {opt.label}
                      </button>
                   ))}
                </div>
             </div>
          </div>
       </Card>

      {/* LISTA DE CURSOS */}
      <div className="space-y-4 pb-20">
         {loadingCourses && <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-violet-500"/></div>}
         
         {!loadingCourses && filteredCourses.map((course) => {
            const isJML = course.empresa === 'JML';
            const iconGradient = isJML 
              ? "from-violet-500 to-indigo-600 shadow-violet-500/20" 
              : "from-emerald-400 to-teal-600 shadow-emerald-500/20";
            
            return (
              <div 
                 key={course.id} 
                 onClick={() => { setEditingCourse(course); setActiveTab("basic"); }} 
                 className="group relative flex flex-col sm:flex-row items-start sm:items-center gap-5 p-5 bg-white dark:bg-[#111623] rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-lg transition-all duration-300 cursor-pointer"
              >
                 <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-gradient-to-br shadow-lg text-white transition-transform group-hover:scale-105", iconGradient)}>
                    {isJML ? <Crown size={24} strokeWidth={2} /> : <Zap size={24} strokeWidth={2} />}
                 </div>

                 <div className="flex-1 min-w-0 w-full">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 mb-2">
                       <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors line-clamp-1">
                          {course.title}
                       </h3>
                       <Badge className={cn("w-fit px-2.5 py-0.5 text-[10px] uppercase tracking-wider font-bold border", getStatusColor(course.status))}>
                          {course.status}
                       </Badge>
                    </div>

                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1 mb-3 font-medium">
                       {course.summary || course.descricao || "Sem descrição disponível para este curso."}
                    </p>

                    <div className="flex flex-wrap items-center gap-2">
                       <span className={cn("text-[10px] font-bold px-2 py-1 rounded-md border", getCompanyTagColor(course.empresa))}>
                          {course.empresa}
                       </span>
                       {(() => {
                         const tipo = course.modality?.[0] || course.tipo || "N/A";
                         return (
                           <span className={cn("text-[10px] font-bold px-2 py-1 rounded-md border", getModalityColor(tipo))}>
                             {tipo}
                           </span>
                         );
                       })()}
                       {getUniqueSegments(course)
                         .slice(0, 4)
                         .map((segmento: string, idx: number) => (
                           <span
                             key={`${segmento}-${idx}`}
                             className="text-[10px] font-bold px-2 py-1 rounded-md border bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                           >
                             {getSegmentLabel(segmento)}
                           </span>
                         ))}
                    </div>
                 </div>

                 <div className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:bg-violet-100 group-hover:text-violet-600 dark:group-hover:bg-violet-900/30 dark:group-hover:text-violet-400 transition-colors">
                    <ChevronRight size={18} />
                 </div>
              </div>
            );
         })}
         
         {!loadingCourses && filteredCourses.length === 0 && (
            <div className="py-20 text-center flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
               <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4 text-slate-400">
                  <Search size={32} />
               </div>
               <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Nenhum curso encontrado</h3>
               <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-1">Tente ajustar seus filtros ou busque por outro termo.</p>
               <Button variant="link" onClick={() => setFilters({search: "", empresas: [], tipos: [], segmentos: []})} className="mt-2 text-violet-600">Limpar filtros</Button>
            </div>
         )}
      </div>
      {showPDFUpload && <PDFUploadManager open={showPDFUpload} onClose={() => setShowPDFUpload(false)} />}
    </div>
  );
}

// Componente de Lista (Adicionar/Remover itens)
const ListInput = ({ value, onChange, placeholder, icon: Icon }: any) => {
  const [inputValue, setInputValue] = useState("");

  // Normaliza o valor de entrada para ser sempre um array
  const items = Array.isArray(value) ? value : (typeof value === 'string' && value.trim().length > 0 ? value.split('\n') : []);

  const handleAdd = () => {
    if (!inputValue.trim()) return;
    const newItems = [...items, inputValue.trim()];
    onChange(newItems); // Retorna array para o pai
    setInputValue("");
  };

  const handleRemove = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    onChange(newItems);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
             {Icon && <Icon className="w-4 h-4" />}
          </div>
          <Input 
            value={inputValue} 
            onChange={(e) => setInputValue(e.target.value)} 
            onKeyDown={handleKeyDown}
            placeholder={placeholder} 
            className="pl-10 bg-white dark:bg-[#151b2b] border-slate-200 dark:border-slate-800" 
          />
        </div>
        <Button 
          type="button" // Importante para não submeter forms
          onClick={handleAdd} 
          disabled={!inputValue.trim()}
          className="bg-slate-900 dark:bg-slate-700 text-white"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {items.length === 0 && <p className="text-xs text-slate-400 italic py-2">Nenhum item adicionado.</p>}
        {items.map((item: string, idx: number) => (
          <div key={idx} className="group flex items-center gap-2 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg animate-in fade-in zoom-in-95 duration-200">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{item}</span>
            <button 
              onClick={() => handleRemove(idx)}
              className="text-slate-400 hover:text-red-500 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// EDITOR DE CURSO - ATUALIZADO (NOVOS CAMPOS + LÓGICA EAD + DESIGN PALESTRANTES)
// ============================================================================

function CourseEditForm({ course, setCourse, onSave, onCancel, activeTab, setActiveTab, options, customFields = [] }: any) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  // --- LÓGICA DE MODALIDADE ---
  const currentModality = course.modality?.[0] || "";
  const isEAD = currentModality === 'EAD';
  const isHibrido = currentModality === 'Híbrido';
  
  const showDateAndLocal = !isEAD;
  const showOnlinePrice = isEAD || isHibrido;
  const showPresencialPrice = !isEAD || isHibrido;
  const showInCompanyPrice = currentModality === 'In Company';

  const customIconMap: Record<string, any> = {
    Type, AlignLeft, Hash, Calendar, List, CheckSquare,
    MonitorPlay, CreditCard, Eye, HelpCircle, Settings,
  };

  const tabs = [
    { id: 'basic', label: 'Visão Geral', icon: FileText },
    { id: 'content', label: 'Conteúdo & Vantagens', icon: Brain },
    { id: 'speakers', label: 'Corpo Docente', icon: Users },
    { id: 'pricing', label: isEAD ? 'Investimento' : 'Agenda & Investimento', icon: DollarSign },
    { id: 'delivery', label: 'Entregáveis', icon: Gift }
  ];

  const updateCustomFieldValue = (fieldId: string, value: any) => {
    setCourse({
      ...course,
      custom_fields: {
        ...(course.custom_fields || {}),
        [fieldId]: value,
      },
    });
  };

  const handleDeleteCourse = async () => {
    if (!course.id) {
      toast({ title: "Erro", description: "Não é possível deletar um curso não salvo.", variant: "destructive" });
      return;
    }
    setIsDeleting(true);
    try {
      await apiDelete(`/api/courses/${course.id}`);
      toast({ title: "Curso deletado", description: "O curso foi removido com sucesso." });
      onCancel();
    } catch (error: any) {
      console.error("Erro ao deletar curso:", error);
      toast({ title: "Erro ao deletar", description: error?.message || "Ocorreu um erro.", variant: "destructive" });
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  // Helper para renderizar card de palestrante
  const renderSpeakerCard = (speaker: any, index: number, type: 'palestrantes' | 'convidados') => (
    <div key={index} className="group relative bg-white dark:bg-[#151b2b] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-violet-300 dark:hover:border-violet-700 transition-all">
       <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 text-red-500 hover:bg-red-50 hover:text-red-600"
            onClick={() => {
               const list = type === 'palestrantes' ? (course.palestrantes || []) : (course.convidados || []);
               const updated = list.filter((_: any, i: number) => i !== index);
               setCourse({ ...course, [type]: updated });
            }}
          >
             <X size={14} />
          </Button>
       </div>
       
       <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200 dark:border-slate-700">
             {speaker.imagem ? (
                <img src={speaker.imagem} alt={speaker.nome} className="w-full h-full object-cover" />
             ) : (
                <Users className="w-5 h-5 text-slate-400" />
             )}
          </div>
          <div className="flex-1 min-w-0 space-y-2">
             <Input 
                value={speaker.nome || ""} 
                onChange={e => { 
                   const list = [...(type === 'palestrantes' ? (course.palestrantes || []) : (course.convidados || []))]; 
                   list[index] = { ...list[index], nome: e.target.value }; 
                   setCourse({ ...course, [type]: list }); 
                }} 
                placeholder="Nome..." 
                className="h-8 text-sm font-semibold border-transparent hover:border-slate-200 focus:border-violet-500 px-2 -ml-2 bg-transparent"
             />
             <textarea 
                value={speaker.curriculo || ""} 
                onChange={e => { 
                   const list = [...(type === 'palestrantes' ? (course.palestrantes || []) : (course.convidados || []))]; 
                   list[index] = { ...list[index], curriculo: e.target.value }; 
                   setCourse({ ...course, [type]: list }); 
                }} 
                rows={2} 
                placeholder="Cargo ou mini-bio..." 
                className="w-full text-xs text-slate-500 dark:text-slate-400 bg-transparent resize-none border-transparent hover:border-slate-200 focus:border-violet-500 rounded p-1 -ml-1 focus:outline-none focus:ring-1 focus:ring-violet-500"
             />
          </div>
       </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950/20 overflow-hidden animate-in slide-in-from-bottom-4 duration-300 w-full">
       
       {/* 1. HEADER FIXO */}
       <div className="flex-none px-6 pt-6 pb-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B0F19] z-20">
          <div className="flex items-center justify-between mb-6">
             <div className="flex items-center gap-4">
                 <Button variant="outline" size="icon" onClick={onCancel} className="rounded-full w-10 h-10 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111623] hover:bg-slate-50">
                    <ArrowLeft className="w-5 h-5 text-slate-500" />
                 </Button>
                 <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white line-clamp-1 flex items-center gap-2">
                       {course.title || "Novo Curso"} 
                       {course.empresa && (
                          <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide border", course.empresa === 'JML' ? "bg-blue-50 border-blue-100 text-blue-600 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400" : "bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400")}>
                             {course.empresa}
                          </span>
                       )}
                    </h2>
                    <div className="flex items-center gap-2 mt-0.5">
                       <div className={cn("w-2 h-2 rounded-full", currentModality ? "bg-emerald-500" : "bg-slate-300")} />
                       <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          {currentModality ? `${currentModality}` : 'Modalidade não definida'}
                       </p>
                    </div>
                 </div>
             </div>
             <div className="flex gap-3">
                 <Button variant="ghost" onClick={onCancel} className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">Cancelar</Button>
                 <Button onClick={() => onSave(course)} className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-violet-600 dark:hover:bg-violet-700 min-w-[120px] shadow-sm font-medium">
                    <Save className="w-4 h-4 mr-2" /> Salvar
                 </Button>
             </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                 {tabs.map(tab => {
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                         key={tab.id}
                         onClick={() => setActiveTab(tab.id)}
                         className={cn(
                            "relative flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all rounded-t-lg border-b-2",
                            isActive
                              ? "border-violet-600 text-violet-700 dark:text-violet-400 bg-violet-50/50 dark:bg-violet-900/10"
                              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                         )}
                      >
                         <tab.icon className={cn("w-4 h-4", isActive ? "text-violet-600 dark:text-violet-400" : "text-slate-400")} />
                         {tab.label}
                      </button>
                    )
                 })}
              </div>
              {course.id && (
                 <Button
                    variant="outline"
                    onClick={() => setShowDeleteModal(true)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-900 mb-1"
                 >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Deletar
                 </Button>
              )}
          </div>
       </div>

       {/* 3. CONTEÚDO SCROLLABLE */}
       <div className="flex-1 overflow-y-auto p-6 lg:p-8 custom-scrollbar pb-32">
          
             {/* --- ABA 1: VISÃO GERAL + OBJETIVOS --- */}
             {activeTab === 'basic' && (
                <div className="space-y-8 animate-in fade-in duration-300">
                   <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"> 
                      {/* ^ Adicionado items-start para alinhar topo */}

                      {/* COLUNA ESQUERDA - INFOS PRINCIPAIS */}
                      <div className="lg:col-span-8 space-y-6">
                         
                         <Card className="p-8 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111623] shadow-sm">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                               <FileText className="w-4 h-4 text-violet-500" /> Informações Básicas
                            </h3>
                            <div className="space-y-6">
                               <div className="space-y-2">
                                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Título do Curso</label>
                                  <Input value={course.title ?? ""} onChange={e => setCourse({...course, title: e.target.value})} className="h-12 text-lg bg-white dark:bg-[#151b2b] border-slate-200 dark:border-slate-800 focus:ring-violet-500 font-medium" placeholder="Ex: Nova Lei de Licitações 2025"/>
                               </div>
                               <div className="grid grid-cols-2 gap-6">
                                  <div className="space-y-2">
                                     <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Empresa Responsável</label>
                                     <select value={course.empresa} onChange={e => setCourse({...course, empresa: e.target.value})} className="w-full h-11 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151b2b] text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                                        {options.empresas.map((op:any) => <option key={op.id} value={op.id}>{op.label}</option>)}
                                     </select>
                                  </div>
                                  <div className="space-y-2">
                                     <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Carga Horária (h)</label>
                                     <Input type="number" value={course.duration_hours ?? ""} onChange={e => setCourse({...course, duration_hours: e.target.value ? Number(e.target.value) : 0})} className="h-11 bg-white dark:bg-[#151b2b] border-slate-200 dark:border-slate-800"/>
                                  </div>
                               </div>
                               <div className="space-y-2">
                                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Resumo Executivo</label>
                                  <textarea rows={3} value={course.summary} onChange={e => setCourse({...course, summary: e.target.value})} className="w-full p-4 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151b2b] text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none leading-relaxed" placeholder="Breve descrição que aparecerá nos cards..."/>
                               </div>
                            </div>
                         </Card>

                         {/* OBJETIVOS (LIST BUILDER) */}
                         <Card className="p-8 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111623] shadow-sm">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                               <Target className="w-4 h-4 text-red-500" /> Objetivos do Curso
                            </h3>
                            <ListInput 
                               value={course.objetivos} 
                               onChange={(newVal: string[]) => setCourse({...course, objetivos: newVal})}
                               placeholder="Digite um objetivo e pressione Enter..."
                               icon={CheckCircle}
                            />
                         </Card>
                         
                         {/* PÚBLICO ALVO (LIST BUILDER) */}
                         <Card className="p-8 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111623] shadow-sm">
                             <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <Users className="w-4 h-4 text-indigo-500" /> Público-Alvo
                             </h3>
                             <p className="text-xs text-slate-500 mb-2">Liste os perfis profissionais ideais para este curso.</p>
                             <ListInput 
                               value={typeof course.target_audience === 'string' ? course.target_audience.split('\n') : course.target_audience || []}
                               // Aqui garantimos compatibilidade: convertemos de volta para string com \n se o backend precisar, ou mantemos array
                               onChange={(newVal: string[]) => setCourse({...course, target_audience: newVal.join('\n')})} 
                               placeholder="Ex: Advogados, Gestores de Contratos..."
                               icon={Users}
                            />
                         </Card>

                         {customFields.length > 0 && (
                           <Card className="p-8 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111623] shadow-sm">
                             <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <Settings className="w-4 h-4 text-slate-500" /> Campos Personalizados
                             </h3>
                             <div className="space-y-4">
                               {customFields.map((field: any) => {
                                 const value = course.custom_fields?.[field.id] ?? (field.type === 'boolean' ? false : '');
                                 const Icon = field.icon && customIconMap[field.icon] ? customIconMap[field.icon] : Settings;
                                 return (
                                   <div key={field.id} className="space-y-2">
                                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        <Icon className="w-4 h-4 text-slate-400" /> {field.label} {field.required && <span className="text-red-500">*</span>}
                                      </label>
                                      {field.type === 'text' && <Input value={value} onChange={e => updateCustomFieldValue(field.id, e.target.value)} placeholder={field.placeholder || ''} className="bg-white dark:bg-[#151b2b] border-slate-200 dark:border-slate-800" />}
                                      {field.type === 'number' && <Input type="number" value={value} onChange={e => updateCustomFieldValue(field.id, e.target.value)} className="bg-white dark:bg-[#151b2b] border-slate-200 dark:border-slate-800" />}
                                      {field.type === 'date' && <Input type="date" value={value} onChange={e => updateCustomFieldValue(field.id, e.target.value)} className="bg-white dark:bg-[#151b2b] border-slate-200 dark:border-slate-800" />}
                                      {field.type === 'textarea' && <textarea rows={4} value={value} onChange={e => updateCustomFieldValue(field.id, e.target.value)} placeholder={field.placeholder || ''} className="w-full p-4 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151b2b] text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 leading-relaxed" />}
                                      {field.type === 'select' && (
                                         <select value={value} onChange={e => updateCustomFieldValue(field.id, e.target.value)} className="w-full h-11 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151b2b] text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                                           <option value="">Selecione...</option>
                                           {(field.options || []).map((opt: string, idx: number) => <option key={`${field.id}-${idx}`} value={opt}>{opt}</option>)}
                                         </select>
                                      )}
                                      {field.type === 'boolean' && (
                                         <div className="flex items-center gap-2"><Switch checked={!!value} onCheckedChange={(val) => updateCustomFieldValue(field.id, val)} /><span className="text-sm text-slate-600 dark:text-slate-400">Ativar</span></div>
                                      )}
                                   </div>
                                 );
                               })}
                             </div>
                           </Card>
                         )}
                      </div>

                      {/* COLUNA DIREITA - CLASSIFICAÇÃO (SEM STICKY PARA ROLAR JUNTO) */}
                      <div className="lg:col-span-4 space-y-6">
                         <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111623] shadow-sm">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                               <Settings className="w-4 h-4 text-emerald-500" /> Classificação
                            </h3>
                            <div className="space-y-6">
                               <div className="space-y-3">
                                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block">Modalidade</label>
                                  <div className="grid grid-cols-2 gap-3">
                                     {[{ id: "EAD", icon: Video }, { id: "Aberto", icon: Globe }, { id: "In Company", icon: Building2 }, { id: "Híbrido", icon: Laptop }].map(m => (
                                        <div key={m.id} onClick={() => setCourse({...course, modality: [m.id]})} className={cn("cursor-pointer border rounded-lg p-3 flex flex-col items-center justify-center gap-2 text-xs font-medium transition-all hover:bg-slate-50 dark:hover:bg-slate-800", course.modality?.[0] === m.id ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800" : "border-slate-200 dark:border-slate-800 text-slate-500")}>
                                           <m.icon className="w-4 h-4" /> {m.id}
                                        </div>
                                     ))}
                                  </div>
                               </div>
                               <Separator className="bg-slate-100 dark:bg-slate-800" />
                               <div className="space-y-3">
                                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block">Segmentos</label>
                                  <div className="flex flex-wrap gap-2">
                                     {options.segmentos.map((seg:any) => (
                                        <Badge key={seg.id} variant={course.segmentos?.includes(seg.id) ? "default" : "outline"} onClick={() => { const current = course.segmentos || []; const newVal = current.includes(seg.id) ? current.filter((s:string) => s !== seg.id) : [...current, seg.id]; setCourse({...course, segmentos: newVal, segmento: newVal[0] || seg.id }); }} className={cn("cursor-pointer py-1.5 px-3 transition-all border", course.segmentos?.includes(seg.id) ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 dark:bg-transparent dark:text-slate-400 dark:border-slate-700")}>
                                           {seg.label}
                                        </Badge>
                                     ))}
                                  </div>
                               </div>
                               <Separator className="bg-slate-100 dark:bg-slate-800" />
                               <div className="space-y-3">
                                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block">Status</label>
                                  <div className="grid grid-cols-2 gap-3">
                                     {[{ id: "Rascunho", icon: Edit }, { id: "Publicado", icon: CheckCircle }].map(s => (
                                        <div key={s.id} onClick={() => setCourse({...course, status: s.id})} className={cn("cursor-pointer border rounded-lg p-3 flex flex-col items-center justify-center gap-2 text-xs font-medium transition-all hover:bg-slate-50 dark:hover:bg-slate-800", course.status === s.id ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800" : "border-slate-200 dark:border-slate-800 text-slate-500")}>
                                           <s.icon className="w-4 h-4" /> {s.id}
                                        </div>
                                     ))}
                                  </div>
                               </div>
                            </div>
                         </Card>
                      </div>
                   </div>
                </div>
             )}

             {/* --- ABA 2: CONTEÚDO & VANTAGENS --- */}
             {activeTab === 'content' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                   <Card className="p-8 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111623] shadow-sm">
                      <div className="space-y-8">
                         <div className="space-y-2">
                            <label className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                               <Presentation className="w-4 h-4 text-blue-500" /> Apresentação do Curso
                            </label>
                            <p className="text-xs text-slate-500">Texto introdutório que vende o curso.</p>
                            <textarea rows={5} value={course.apresentacao} onChange={e => setCourse({...course, apresentacao: e.target.value})} className="w-full p-4 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151b2b] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed" placeholder="Escreva uma introdução cativante..."/>
                         </div>

                         {/* VANTAGENS DO CURSO (LIST BUILDER) */}
                         <div className="space-y-2">
                            <label className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                               <Sparkles className="w-4 h-4 text-amber-500" /> Vantagens do Curso
                            </label>
                            <ListInput 
                               value={course.vantagens} 
                               onChange={(newVal: string[]) => setCourse({...course, vantagens: newVal})}
                               placeholder="Digite um diferencial e pressione Enter..."
                               icon={Sparkles}
                            />
                         </div>

                         {/* VANTAGENS EAD JML (LIST BUILDER - CONDICIONAL) */}
                         {isEAD && (
                           <div className="space-y-2 animate-in fade-in slide-in-from-left-2">
                              <label className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                 <MonitorPlay className="w-4 h-4 text-violet-500" /> Vantagens da Plataforma EAD Grupo JML
                              </label>
                              <ListInput 
                                 value={course.vantagens_ead} 
                                 onChange={(newVal: string[]) => setCourse({...course, vantagens_ead: newVal})}
                                 placeholder="Digite uma vantagem da plataforma..."
                                 icon={MonitorPlay}
                              />
                           </div>
                         )}

                         <Separator className="bg-slate-100 dark:bg-slate-800" />
                         <div className="space-y-2">
                            <label className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                               <BookOpenCheck className="w-4 h-4 text-indigo-500" /> Conteúdo Programático
                            </label>
                             <p className="text-xs text-slate-500">Estrutura de módulos e aulas.</p>
                            <textarea rows={15} value={course.description} onChange={e => setCourse({...course, description: e.target.value})} className="w-full p-5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151b2b] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed custom-scrollbar" placeholder="Módulo 1: Introdução... &#10; - Aula 1.1... &#10; - Aula 1.2..."/>
                         </div>
                      </div>
                   </Card>
                </div>
             )}

             {/* --- ABA 3: PREÇOS E DATAS (CONDICIONAL) --- */}
             {activeTab === 'pricing' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-300">
                   {/* Se for EAD, esconde o card de Agenda e Local */}
                   {showDateAndLocal && (
                     <Card className="p-8 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111623] shadow-sm">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                           <Calendar className="w-4 h-4 text-emerald-500" /> Agenda
                        </h3>
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                               <div className="space-y-2">
                                  <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Início</label>
                                  <Input type="date" value={course.data_inicio || ''} onChange={e => setCourse({...course, data_inicio: e.target.value})} className="bg-white dark:bg-[#151b2b] border-slate-200 dark:border-slate-800"/>
                               </div>
                               <div className="space-y-2">
                                  <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Término</label>
                                  <Input type="date" value={course.data_fim || ''} onChange={e => setCourse({...course, data_fim: e.target.value})} className="bg-white dark:bg-[#151b2b] border-slate-200 dark:border-slate-800"/>
                               </div>
                            </div>
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                  <MapPin className="w-4 h-4 text-slate-400" /> Local
                              </label>
                              <Input value={course.local || ''} onChange={e => setCourse({...course, local: e.target.value})} className="bg-white dark:bg-[#151b2b]" placeholder="Ex: Auditório JML, Brasília - DF"/>
                            </div>
                        </div>
                     </Card>
                   )}

                   <Card className={cn("p-8 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111623] shadow-sm", !showDateAndLocal && "col-span-2 lg:col-span-1")}>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                         <DollarSign className="w-4 h-4 text-amber-500" /> Valores de Investimento
                      </h3>
                      {!currentModality && <p className="text-sm text-slate-500 italic">Selecione uma modalidade na aba "Visão Geral" primeiro.</p>}
                      <div className="space-y-5">
                         {showOnlinePrice && (
                            <div className="group animate-in fade-in slide-in-from-left-2">
                               <label className="text-xs font-semibold text-slate-500 mb-1.5 block">ONLINE (EAD)</label>
                               <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">R$</span><Input type="number" value={course.preco_online || ''} onChange={e => setCourse({...course, preco_online: e.target.value})} className="pl-10 h-11 bg-white dark:bg-[#151b2b]" placeholder="0,00"/></div>
                            </div>
                         )}
                         {showPresencialPrice && (
                            <div className="group animate-in fade-in slide-in-from-left-2">
                               <label className="text-xs font-semibold text-slate-500 mb-1.5 block">PRESENCIAL</label>
                               <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">R$</span><Input type="number" value={course.preco_presencial || ''} onChange={e => setCourse({...course, preco_presencial: e.target.value})} className="pl-10 h-11 bg-white dark:bg-[#151b2b]" placeholder="0,00"/></div>
                            </div>
                         )}
                         {showInCompanyPrice && (
                            <div className="group animate-in fade-in slide-in-from-left-2">
                               <label className="text-xs font-semibold text-slate-500 mb-1.5 block">PROJETO IN COMPANY</label>
                               <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">R$</span><Input type="number" value={course.preco_incompany || ''} onChange={e => setCourse({...course, preco_incompany: e.target.value})} className="pl-10 h-11 bg-white dark:bg-[#151b2b]" placeholder="0,00"/></div>
                            </div>
                         )}
                      </div>
                   </Card>
                </div>
             )}

             {/* --- ABA 4: PALESTRANTES --- */}
             {activeTab === 'speakers' && (
                <div className="space-y-8 animate-in fade-in duration-300">
                   
                   {/* SEÇÃO 1: CORPO DOCENTE PRINCIPAL */}
                   <Card className="p-8 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111623] shadow-sm">
                      <div className="flex items-center justify-between mb-6">
                         <div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2"><Users className="w-4 h-4 text-indigo-500" /> Professores / Palestrantes</h3>
                            <p className="text-xs text-slate-500 mt-1">Equipe principal do curso.</p>
                         </div>
                         <Button size="sm" onClick={() => { setCourse({ ...course, palestrantes: [...(course.palestrantes || []), { nome: "", curriculo: "", imagem: "" }] }); }} className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                            <Plus className="w-3 h-3 mr-2" /> Adicionar Professor
                         </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                         {(course.palestrantes || []).map((p: any, i: number) => renderSpeakerCard(p, i, 'palestrantes'))}
                         {(!course.palestrantes || course.palestrantes.length === 0) && (
                            <div className="col-span-full text-center py-8 text-slate-400 text-sm italic border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">Nenhum professor adicionado.</div>
                         )}
                      </div>
                   </Card>

                   {/* SEÇÃO 2: CONVIDADOS ESPECIAIS */}
                   <Card className="p-8 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111623] shadow-sm">
                      <div className="flex items-center justify-between mb-6">
                         <div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2"><Globe className="w-4 h-4 text-violet-500" /> Convidados Especiais</h3>
                            <p className="text-xs text-slate-500 mt-1">Participações especiais e conferencistas.</p>
                         </div>
                         <Button size="sm" onClick={() => { setCourse({ ...course, convidados: [...(course.convidados || []), { nome: "", curriculo: "", imagem: "" }] }); }} className="bg-violet-50 text-violet-600 hover:bg-violet-100 dark:bg-violet-900/20 dark:text-violet-400 border border-violet-200 dark:border-violet-800">
                            <Plus className="w-3 h-3 mr-2" /> Adicionar Convidado
                         </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                         {(course.convidados || []).map((p: any, i: number) => renderSpeakerCard(p, i, 'convidados'))}
                         {(!course.convidados || course.convidados.length === 0) && (
                            <div className="col-span-full text-center py-8 text-slate-400 text-sm italic border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">Nenhum convidado especial.</div>
                         )}
                      </div>
                   </Card>
                </div>
             )}

             {/* --- ABA 5: ENTREGÁVEIS (LIST BUILDER) --- */}
             {activeTab === 'delivery' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-300">
                   <Card className="p-8 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111623] shadow-sm">
                       <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                          <ListChecks className="w-4 h-4 text-pink-500" /> Lista de Entregáveis
                       </h3>
                       <p className="text-xs text-slate-500 mb-3">O que o aluno recebe?</p>
                       <ListInput 
                          value={typeof course.deliverables === 'string' ? course.deliverables.split('\n') : course.deliverables || []}
                          onChange={(newVal: string[]) => setCourse({...course, deliverables: newVal.join('\n')})}
                          placeholder="Ex: Certificado Digital"
                          icon={Gift}
                       />
                   </Card>
                   
                   <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Preview</h3>
                      <div className="bg-white dark:bg-[#151b2b] p-6 rounded-xl border border-pink-100 dark:border-pink-900/10 shadow-sm">
                         {course.deliverables?.length > 0 ? (
                            <ul className="space-y-3">
                               {(Array.isArray(course.deliverables) ? course.deliverables : course.deliverables.split('\n')).map((d:string, i:number) => d && (
                                  <li key={i} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300"><div className="mt-0.5 bg-pink-50 dark:bg-pink-900/30 p-1 rounded-full text-pink-600 dark:text-pink-400"><CheckSquare className="w-3.5 h-3.5" /></div><span className="flex-1">{d}</span></li>
                               ))}
                            </ul>
                         ) : (
                            <div className="text-center py-8 text-slate-400 text-sm italic">Nenhum item adicionado.</div>
                         )}
                      </div>
                   </div>
                </div>
             )}
       </div>

       {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
       {showDeleteModal && createPortal(
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
             <div className="bg-white dark:bg-[#111623] rounded-2xl shadow-2xl max-w-md w-full p-0 border border-red-200 dark:border-red-900/50 overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 text-center bg-red-50 dark:bg-red-950/30 border-b border-red-100 dark:border-red-900/30">
                   <div className="w-16 h-16 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" /></div>
                   <h3 className="text-xl font-bold text-slate-900 dark:text-white">Confirmar Exclusão</h3>
                   <p className="text-slate-600 dark:text-slate-400 mt-2">Esta ação não pode ser desfeita.</p>
                </div>
                <div className="p-6">
                   <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">Você está prestes a deletar o curso:</p>
                   <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800 mb-4">
                      <p className="font-bold text-slate-900 dark:text-white">{course.title || "Sem título"}</p>
                      {course.empresa && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Empresa: {course.empresa}</p>}
                   </div>
                   <p className="text-sm text-red-600 dark:text-red-400 font-medium">⚠️ Todos os dados relacionados serão permanentemente removidos.</p>
                </div>
                <div className="p-6 bg-slate-50 dark:bg-[#151b2b] border-t border-slate-200 dark:border-slate-800 flex gap-3 justify-end">
                   <Button variant="outline" onClick={() => setShowDeleteModal(false)} disabled={isDeleting} className="min-w-[100px]">Cancelar</Button>
                   <Button onClick={handleDeleteCourse} disabled={isDeleting} className="min-w-[100px] bg-red-600 hover:bg-red-700 text-white">
                      {isDeleting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Deletando...</> : <><Trash2 className="w-4 h-4 mr-2" />Deletar</>}
                   </Button>
                </div>
             </div>
          </div>,
          document.body
       )}
    </div>
  );
}
