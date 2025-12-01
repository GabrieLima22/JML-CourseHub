import { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation, Routes, Route } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createPortal } from "react-dom";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  FileText, BarChart3, Upload, Users, Clock, Plus, Eye, RefreshCw,
  Brain, Target, Rocket, Crown, Activity,
  Bell, Loader2, LogOut,
  LayoutDashboard, Settings, Layers, Building2, Zap,
  ChevronRight, CheckCircle, BookOpenCheck, CreditCard, Gift,
  Calendar, MapPin, Presentation, Search, X, Save,
  ArrowLeft, Globe, Video, Laptop, DollarSign, CheckSquare, ListChecks,
  AlignLeft, Type, Sparkles
} from "lucide-react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useDashboardStats, useRecentActivities } from "@/hooks/useAdminStats";
import { useToast } from "@/hooks/use-toast";
import { PDFUploadManager } from "@/components/admin/PDFUploadManager";
import { AnalyticsDashboard } from "@/components/admin/AnalyticsDashboard";
import { TaxonomyManager } from "@/components/admin/TaxonomyManager";
import { cn } from "@/lib/utils";
import { apiPost, apiPatch } from "@/services/api";

// --- CONSTANTES ---
const HEADER_HEIGHT = 64;
const SIDEBAR_WIDTH_EXPANDED = 260;
const SIDEBAR_WIDTH_COLLAPSED = 72;

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
  const activePage = ['dashboard', 'courses', 'analytics', 'config'].includes(currentPath) ? currentPath : 'dashboard';

  const handleLogout = () => { logout(); navigate('/'); };
  const handleNavigate = (page: string) => navigate(`/admin/${page}`);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "courses", label: "Meus Cursos", icon: FileText },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "config", label: "Configurações", icon: Settings }
  ];

  return (
    // Background Sofisticado da versão Claude
    <div className="min-h-screen bg-slate-50 dark:bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] dark:from-slate-950 dark:via-indigo-950/40 dark:to-slate-950 font-sans selection:bg-violet-200 dark:selection:bg-violet-900/60 transition-colors duration-500 overflow-hidden">
      
      {/* ========== HEADER FIXO (Estilo JML com Gradiente Topo) ========== */}
      <header
        className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-white via-white to-slate-50/80 dark:from-slate-950 dark:via-slate-900/95 dark:to-indigo-950/80 border-b border-slate-200/80 dark:border-slate-800/60 backdrop-blur-xl transition-all duration-300"
        style={{ height: `${HEADER_HEIGHT}px` }}
      >
        {/* Linha decorativa no topo - Identidade Visual */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-600 via-cyan-500 to-emerald-500 opacity-80" />
        
        <div className="h-full flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            {/* Logo Area */}
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

            {/* Toggle Sidebar */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-slate-500 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/40 dark:hover:text-violet-400 rounded-xl transition-all ml-2"
            >
              {sidebarCollapsed ? <ChevronRight size={18} /> : <LayoutDashboard size={18} />}
            </Button>
          </div>

          <div className="flex items-center gap-4">
            {/* Status do Sistema (Pílula com Glow) */}
            <div className="hidden md:flex items-center gap-2.5 px-4 py-2 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-full border border-emerald-200/60 dark:border-emerald-800/40 shadow-sm">
              <div className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </div>
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Sistema Online</span>
            </div>

            <Separator orientation="vertical" className="h-8 bg-slate-200 dark:bg-slate-700 hidden md:block" />

            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout} 
              className="text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 dark:hover:text-rose-400 rounded-xl transition-all font-medium"
            >
              <LogOut className="w-4 h-4 mr-2" /> Sair
            </Button>
          </div>
        </div>
      </header>

      {/* ========== SIDEBAR (Design Rico do Claude) ========== */}
      <aside
        className={cn(
          "fixed left-0 z-40 transition-all duration-300 ease-in-out flex flex-col",
          "bg-gradient-to-b from-white via-white to-slate-50/50 dark:from-slate-950 dark:via-slate-900/95 dark:to-indigo-950/60",
          "border-r border-slate-200/80 dark:border-slate-800/60 shadow-xl shadow-slate-200/20 dark:shadow-none",
          sidebarCollapsed ? "items-center" : ""
        )}
        style={{
          top: `${HEADER_HEIGHT}px`,
          height: `calc(100vh - ${HEADER_HEIGHT}px)`,
          width: sidebarCollapsed ? `${SIDEBAR_WIDTH_COLLAPSED}px` : `${SIDEBAR_WIDTH_EXPANDED}px`
        }}
      >
        {/* Brilho Sutil de Fundo */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/[0.02] via-transparent to-emerald-600/[0.02] dark:from-violet-600/[0.05] dark:via-transparent dark:to-emerald-600/[0.03] pointer-events-none" />
        
        <nav className="p-4 space-y-2 w-full relative z-10 mt-2">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 w-full group relative overflow-hidden",
                  isActive 
                    ? "bg-gradient-to-r from-violet-500/10 via-violet-500/10 to-indigo-500/10 text-violet-700 dark:from-violet-600/20 dark:via-violet-600/15 dark:to-indigo-600/20 dark:text-violet-300 shadow-sm border border-violet-200/50 dark:border-violet-700/30" 
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200",
                  sidebarCollapsed ? "justify-center px-2" : ""
                )}
              >
                {/* Indicador Ativo Lateral */}
                {isActive && !sidebarCollapsed && (
                   <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-violet-600 rounded-r-full" />
                )}

                <div className={cn(
                  "p-1.5 rounded-lg transition-all duration-200",
                  isActive 
                    ? "bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-md shadow-violet-500/30" 
                    : "bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 group-hover:bg-white group-hover:shadow-sm dark:group-hover:bg-slate-700"
                )}>
                  <Icon size={18} />
                </div>
                
                {!sidebarCollapsed && <span>{item.label}</span>}

                {/* Tooltip p/ sidebar fechada */}
                {sidebarCollapsed && (
                   <div className="absolute left-full ml-4 px-3 py-1.5 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg">
                      {item.label}
                   </div>
                )}
              </button>
            )
          })}
        </nav>

        {/* Footer da Sidebar (Badge de Versão) */}
        {!sidebarCollapsed && (
          <div className="mt-auto p-4 w-full">
            <div className="p-4 rounded-xl bg-gradient-to-br from-violet-500/5 to-indigo-500/5 dark:from-violet-600/10 dark:to-indigo-600/10 border border-violet-200/30 dark:border-violet-700/20">
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
      {/* ========== ÁREA PRINCIPAL (Estilos CSS para scrollbar e background) ========== */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(139, 92, 246, 0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(139, 92, 246, 0.5); }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(139, 92, 246, 0.2); }
      `}</style>

      <main
        className="transition-all duration-300 ease-in-out relative z-10 overflow-y-auto custom-scrollbar"
        style={{
          marginLeft: sidebarCollapsed ? `${SIDEBAR_WIDTH_COLLAPSED}px` : `${SIDEBAR_WIDTH_EXPANDED}px`,
          marginTop: `${HEADER_HEIGHT}px`,
          height: `calc(100vh - ${HEADER_HEIGHT}px)`,
        }}
      >
         <div className="p-6 lg:p-8 max-w-[1600px] mx-auto w-full pb-20">
            <Routes>
               <Route index element={<DashboardView stats={dashboardStats} activities={activitiesData} navigate={handleNavigate} />} />
               <Route path="dashboard" element={<DashboardView stats={dashboardStats} activities={activitiesData} navigate={handleNavigate} />} />
               <Route path="courses" element={<CoursesView onClose={() => navigate('/admin/dashboard')} />} />
               <Route path="analytics" element={<AnalyticsDashboard />} />
               <Route path="config" element={<ConfigView />} />
               <Route path="*" element={<DashboardView stats={dashboardStats} activities={activitiesData} navigate={handleNavigate} />} />
            </Routes>
         </div>
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
// COMPONENTES AUXILIARES (Dashboard, Config)
// ============================================================================

const DashboardView = ({ stats, activities, navigate }: any) => {
  const loading = !stats;
  
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
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

const ConfigView = () => {
  const [showTaxonomy, setShowTaxonomy] = useState(false);
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <TaxonomyManager open={showTaxonomy} onClose={() => setShowTaxonomy(false)} />
      <div className="flex justify-between items-end pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
           <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Configurações</h2>
           <p className="text-slate-500 dark:text-slate-400 mt-1">Gerenciamento de taxonomias e sistema.</p>
        </div>
        <Button onClick={() => setShowTaxonomy(true)} className="bg-slate-900 text-white dark:bg-violet-600">
           <Settings className="w-4 h-4 mr-2" /> Gerenciar Taxonomias
        </Button>
      </div>
    </div>
  );
};

// ============================================================================
// 3. COURSES VIEW & EDITOR (LÓGICA ORIGINAL PRESERVADA)
// ============================================================================

function CoursesView({ onClose }: { onClose: () => void }) {
  const apiBase = (import.meta as any).env?.VITE_API_URL || "http://localhost:3001/api";
  const [showNewCourseModal, setShowNewCourseModal] = useState(false);
  const [showPDFUpload, setShowPDFUpload] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("basic");
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [filters, setFilters] = useState({ search: "", empresas: [] as string[], tipos: [] as string[], segmentos: [] as string[] });

  // Opções e cores dos filtros
  const companyOptions = [{ id: "JML", label: "JML" }, { id: "Conecta", label: "Conecta" }];
  
  // Voltando com os tipos para o filtro
  const courseTypeOptions = [
    { id: "ead", label: "EAD/Online" },
    { id: "presencial", label: "Presencial" },
    { id: "incompany", label: "In Company" },
    { id: "hibrido", label: "Híbrido" }
  ];

  const segmentOptions = [{ id: "Estatais", label: "Estatais" }, { id: "Judiciário", label: "Judiciário" }, { id: "Sistema S", label: "Sistema S" }];

  // Normalização mais robusta para as cores
  const getModalityColor = (mod: string) => {
    const m = mod?.toLowerCase() || "";
    if (m.includes("ead") || m.includes("online")) return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800";
    if (m.includes("presencial")) return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800";
    if (m.includes("company")) return "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800";
    return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300";
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

  // Normalização
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
        const segmentosArray = [
          ...(Array.isArray(c.segmentos_adicionais) ? c.segmentos_adicionais : []),
        ];
        if (c.segmento) segmentosArray.unshift(c.segmento);
        return {
          ...c,
          title: c.titulo || c.title || "",
          summary: c.summary || "",
          description: c.description || "",
          modality: Array.isArray(c.modalidade) ? c.modalidade : [c.tipo || 'Aberto'],
          status: mapStatus(c.status),
          visualizacoes: c.views_count || 0,
          duration_hours: c.carga_horaria || 0,
          segmento: c.segmento || segmentosArray[0] || "Estatais",
          segmentos: segmentosArray.length ? segmentosArray : ["Estatais"],
        };
      }));
    } catch (err) { console.error(err); setCourses([]); }
    finally { setLoadingCourses(false); }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const { toast } = useToast();

  const handleSaveCourse = async (course: any) => {
    try {
      const segmentosArray = Array.isArray(course.segmentos) && course.segmentos.length
        ? course.segmentos
        : (course.segmento ? [course.segmento] : ["Estatais"]);

      const payload: any = {
        titulo: course.title || course.titulo || "",
        empresa: course.empresa || "JML",
        tipo: normalizeTipo(course.modality?.[0] || course.tipo || ""),
        modalidade: course.modality || [],
        segmento: segmentosArray[0],
        segmentos_adicionais: segmentosArray.slice(1),
        summary: course.summary || "",
        description: course.description || "",
        carga_horaria: Number(course.duration_hours) || 0,
        status: mapStatusToBackend(course.status),
      };

      if (course.id) {
        await apiPatch(`/api/courses/${course.id}`, payload);
        toast({
          title: "Curso atualizado",
          description: "As alterações foram salvas com sucesso.",
        });
      } else {
        const res = await apiPost(`/api/courses`, payload);
        toast({
          title: "Curso criado",
          description: "O novo curso foi salvo com sucesso.",
        });
        course.id = (res as any)?.data?.id ?? course.id;
      }

      await fetchCourses();
      setEditingCourse(null);
      setActiveTab("basic");
    } catch (error: any) {
      console.error("Erro ao salvar curso:", error);
      toast({
        title: "Erro ao salvar",
        description: error?.message || "Ocorreu um erro ao salvar o curso.",
        variant: "destructive",
      });
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
        onCancel={() => { setEditingCourse(null); setActiveTab('basic'); }} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        options={{ segmentos: segmentOptions, empresas: companyOptions }} 
     />;
  }

  // --- MODO LISTA ---
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
       
     {/* --- MODAL NOVO CURSO (COM PORTAL PARA COBRIR TUDO) --- */}
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

       {/* BARRA DE FILTROS E BUSCA (Atualizada com separadores) */}
       <Card className="p-1.5 bg-white dark:bg-[#111623] border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl">
          <div className="flex flex-col lg:flex-row gap-4 items-center p-2">
             {/* Busca */}
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
             
             {/* Área de Filtros com Separador */}
             <div className="flex items-center gap-3 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0 no-scrollbar">
                {/* Filtro Empresa */}
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

                {/* A Barrinha Separadora */}
                <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1 shrink-0" />

                {/* Filtro Tipo */}
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

             {/* LISTA DE CURSOS (Visual Rico e Detalhado) */}
      <div className="space-y-4">
         {loadingCourses && <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-violet-500"/></div>}
         
         {!loadingCourses && filteredCourses.map((course) => {
            // Definir cores baseadas na empresa para o ícone
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
                 {/* Ícone de Identidade Visual (Maior e com Gradiente) */}
                 <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-gradient-to-br shadow-lg text-white transition-transform group-hover:scale-105", iconGradient)}>
                    {isJML ? <Crown size={24} strokeWidth={2} /> : <Zap size={24} strokeWidth={2} />}
                 </div>

                 {/* Conteúdo Principal */}
                 <div className="flex-1 min-w-0 w-full">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 mb-2">
                       <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors line-clamp-1">
                          {course.title}
                       </h3>
                       {/* Status Badge */}
                       <Badge className={cn("w-fit px-2.5 py-0.5 text-[10px] uppercase tracking-wider font-bold border", getStatusColor(course.status))}>
                          {course.status}
                       </Badge>
                    </div>

                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1 mb-3 font-medium">
                       {course.summary || course.descricao || "Sem descrição disponível para este curso."}
                    </p>

                    {/* Tags: Empresa, Tipo e Segmento */}
                    <div className="flex flex-wrap items-center gap-2">
                       {/* Empresa */}
                       <span className={cn("text-[10px] font-bold px-2 py-1 rounded-md border", getCompanyTagColor(course.empresa))}>
                          {course.empresa}
                       </span>

                       {/* Tipo / Modalidade */}
                       {(() => {
                         const tipo = course.modality?.[0] || course.tipo || "N/A";
                         return (
                           <span className={cn("text-[10px] font-bold px-2 py-1 rounded-md border", getModalityColor(tipo))}>
                             {tipo}
                           </span>
                         );
                       })()}

                       {/* Segmentos (vários) */}
                       {(Array.isArray(course.segmentos) ? course.segmentos : (course.segmento ? [course.segmento] : []))
                         .slice(0, 4)
                         .map((segmento: string, idx: number) => (
                           <span
                             key={`${segmento}-${idx}`}
                             className="text-[10px] font-bold px-2 py-1 rounded-md border bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                           >
                             {segmento}
                           </span>
                         ))}
                    </div>

                 </div>

                 {/* Seta de Ação */}
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

// ============================================================================
// 4. EDITOR DE CURSO (Mantendo a Lógica Inteligente Original)
// ============================================================================

function CourseEditForm({ course, setCourse, onSave, onCancel, activeTab, setActiveTab, options }: any) {
  
  const tabs = [
    { id: 'basic', label: 'Visão Geral', icon: FileText },
    { id: 'content', label: 'Conteúdo & IA', icon: Brain },
    { id: 'pricing', label: 'Preços & Datas', icon: DollarSign },
    { id: 'delivery', label: 'Entregáveis', icon: Gift }
  ];

  // Lógica Condicional de Exibição (Do seu código original, que é melhor)
  const currentModality = course.modality?.[0] || "";
  const showLocal = currentModality !== 'EAD'; 
  const showOnlinePrice = currentModality === 'EAD' || currentModality === 'Híbrido';
  const showPresencialPrice = currentModality === 'Aberto' || currentModality === 'Híbrido';
  const showInCompanyPrice = currentModality === 'In Company';

  return (
    <div className="flex flex-col h-[calc(100vh-90px)] animate-in slide-in-from-bottom-4 duration-300">
       
       {/* EDITOR HEADER */}
       <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-6 sticky top-0 bg-slate-50 dark:bg-[#0B0F19] z-20 pt-1 shrink-0">
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

       {/* ABAS DE NAVEGAÇÃO */}
       <div className="flex flex-wrap gap-2 mb-8 shrink-0 border-b border-slate-200 dark:border-slate-800 pb-1">
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

       {/* ÁREA DE CONTEÚDO */}
       <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-20">
          
             {/* --- ABA 1: VISÃO GERAL --- */}
             {activeTab === 'basic' && (
                <div className="space-y-8 animate-in fade-in duration-300">
                   <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      {/* Coluna Principal */}
                      <div className="lg:col-span-8 space-y-6">
                         <Card className="p-8 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111623] shadow-sm">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                               <FileText className="w-4 h-4 text-violet-500" /> Informações Básicas
                            </h3>
                            
                            <div className="space-y-6">
                               <div className="space-y-2">
                                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Título do Curso</label>
                                  <Input 
                                    value={course.title ?? ""} 
                                    onChange={e => setCourse({...course, title: e.target.value})} 
                                    className="h-12 text-lg bg-white dark:bg-[#151b2b] border-slate-200 dark:border-slate-800 focus:ring-violet-500 font-medium"
                                    placeholder="Ex: Nova Lei de Licitações 2025"
                                 />
                               </div>

                               <div className="grid grid-cols-2 gap-6">
                                  <div className="space-y-2">
                                     <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Empresa Responsável</label>
                                     <select 
                                        value={course.empresa} 
                                        onChange={e => setCourse({...course, empresa: e.target.value})}
                                        className="w-full h-11 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151b2b] text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                                     >
                                        {options.empresas.map((op:any) => <option key={op.id} value={op.id}>{op.label}</option>)}
                                     </select>
                                  </div>
                                  <div className="space-y-2">
                                     <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Carga Horária (h)</label>
                                     <Input 
                                        type="number" 
                                        value={course.duration_hours ?? ""} 
                                        onChange={e => setCourse({...course, duration_hours: e.target.value ? Number(e.target.value) : 0})} 
                                        className="h-11 bg-white dark:bg-[#151b2b] border-slate-200 dark:border-slate-800"
                                     />
                                  </div>
                               </div>

                               <div className="space-y-2">
                                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Resumo Executivo</label>
                                  <textarea 
                                    rows={4} 
                                    value={course.summary} 
                                    onChange={e => setCourse({...course, summary: e.target.value})}
                                    className="w-full p-4 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151b2b] text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none leading-relaxed"
                                    placeholder="Breve descrição que aparecerá nos cards..."
                                 />
                               </div>
                            </div>
                         </Card>
                         
                         {/* Público Alvo (Grande e Largo - Sua preferência) */}
                         <Card className="p-8 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111623] shadow-sm">
                             <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <Users className="w-4 h-4 text-indigo-500" /> Público-Alvo
                             </h3>
                             <div className="space-y-2">
                                <p className="text-xs text-slate-500">Defina quem são os profissionais ideais para este conteúdo.</p>
                                <textarea 
                                  rows={4}
                                  value={course.target_audience} 
                                  onChange={e => setCourse({...course, target_audience: e.target.value})} 
                                  className="w-full p-4 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151b2b] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                                  placeholder="Ex: Advogados, Gestores de Contratos, Pregoeiros, Equipes de Licitação..."
                                />
                             </div>
                         </Card>
                      </div>

                      {/* Coluna Lateral (Configurações) */}
                      <div className="lg:col-span-4 space-y-6">
                         <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111623] shadow-sm">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                               <Settings className="w-4 h-4 text-emerald-500" /> Classificação
                            </h3>
                            
                            <div className="space-y-6">
                               <div className="space-y-3">
                                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block">Modalidade</label>
                                  <div className="grid grid-cols-2 gap-3">
                                     {[
                                        { id: "EAD", icon: Video }, 
                                        { id: "Aberto", icon: Globe }, 
                                        { id: "In Company", icon: Building2 }, 
                                        { id: "Híbrido", icon: Laptop }
                                     ].map(m => (
                                        <div 
                                           key={m.id} 
                                           onClick={() => setCourse({...course, modality: [m.id]})}
                                           className={cn(
                                              "cursor-pointer border rounded-lg p-3 flex flex-col items-center justify-center gap-2 text-xs font-medium transition-all hover:bg-slate-50 dark:hover:bg-slate-800",
                                              course.modality?.[0] === m.id 
                                                 ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800" 
                                                 : "border-slate-200 dark:border-slate-800 text-slate-500"
                                           )}
                                        >
                                           <m.icon className="w-4 h-4" />
                                           {m.id}
                                        </div>
                                     ))}
                                  </div>
                               </div>

                               <Separator className="bg-slate-100 dark:bg-slate-800" />

                               <div className="space-y-3">
                                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block">Segmentos</label>
                                  <div className="flex flex-wrap gap-2">
                                     {options.segmentos.map((seg:any) => (
                                        <Badge 
                                           key={seg.id} 
                                           variant={course.segmentos?.includes(seg.id) ? "default" : "outline"}
                                           onClick={() => {
                                              const current = course.segmentos || [];
                                              const newVal = current.includes(seg.id)
                                                ? current.filter((s:string) => s !== seg.id)
                                                : [...current, seg.id];
                                              setCourse({...course, segmentos: newVal, segmento: newVal[0] || seg.id });
                                           }}
                                           className={cn(
                                             "cursor-pointer py-1.5 px-3 transition-all border",
                                             course.segmentos?.includes(seg.id)
                                               ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900"
                                               : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 dark:bg-transparent dark:text-slate-400 dark:border-slate-700"
                                           )}
                                        >
                                           {seg.label}
                                        </Badge>
                                     ))}
                                  </div>
                               </div>
                            </div>
                         </Card>
                      </div>
                   </div>
                </div>
             )}

             {/* --- ABA 2: CONTEÚDO --- */}
             {activeTab === 'content' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                   <Card className="p-8 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111623] shadow-sm">
                      <div className="space-y-8">
                         <div className="space-y-2">
                            <label className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                               <Presentation className="w-4 h-4 text-blue-500" /> Apresentação do Curso
                            </label>
                            <p className="text-xs text-slate-500">Texto introdutório que vende o curso.</p>
                            <textarea 
                              rows={5} 
                              value={course.apresentacao} 
                              onChange={e => setCourse({...course, apresentacao: e.target.value})}
                              className="w-full p-4 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151b2b] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
                              placeholder="Escreva uma introdução cativante..."
                           />
                         </div>
                         
                         <Separator className="bg-slate-100 dark:bg-slate-800" />

                         <div className="space-y-2">
                            <label className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                               <BookOpenCheck className="w-4 h-4 text-indigo-500" /> Conteúdo Programático
                            </label>
                             <p className="text-xs text-slate-500">Estrutura de módulos e aulas.</p>
                            <textarea 
                              rows={15} 
                              value={course.description} 
                              onChange={e => setCourse({...course, description: e.target.value})}
                              className="w-full p-5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151b2b] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed custom-scrollbar"
                              placeholder="Módulo 1: Introdução... &#10; - Aula 1.1... &#10; - Aula 1.2..."
                           />
                         </div>
                      </div>
                   </Card>
                </div>
             )}

             {/* --- ABA 3: PREÇOS E DATAS (Lógica Inteligente Preservada) --- */}
             {activeTab === 'pricing' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-300">
                   {/* DATAS & LOCAL */}
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

                          {showLocal ? (
                             <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                   <MapPin className="w-4 h-4 text-slate-400" /> Local
                                </label>
                                <Input value={course.local || ''} onChange={e => setCourse({...course, local: e.target.value})} className="bg-white dark:bg-[#151b2b]" placeholder="Ex: Auditório JML, Brasília - DF"/>
                             </div>
                          ) : (
                             <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-sm text-slate-500 italic text-center border border-slate-100 dark:border-slate-800">
                                Curso Online. Não requer local.
                             </div>
                          )}
                      </div>
                   </Card>

                   {/* PRECIFICAÇÃO (Condicional) */}
                   <Card className="p-8 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111623] shadow-sm">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                         <DollarSign className="w-4 h-4 text-amber-500" /> Valores de Investimento
                      </h3>
                      
                      {!currentModality && <p className="text-sm text-slate-500 italic">Selecione uma modalidade primeiro.</p>}

                      <div className="space-y-5">
                         {showOnlinePrice && (
                            <div className="group animate-in fade-in slide-in-from-left-2">
                               <label className="text-xs font-semibold text-slate-500 mb-1.5 block">ONLINE (EAD)</label>
                               <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">R$</span>
                                  <Input type="number" value={course.preco_online || ''} onChange={e => setCourse({...course, preco_online: e.target.value})} className="pl-10 h-11 bg-white dark:bg-[#151b2b]" placeholder="0,00"/>
                               </div>
                            </div>
                         )}

                         {showPresencialPrice && (
                            <div className="group animate-in fade-in slide-in-from-left-2">
                               <label className="text-xs font-semibold text-slate-500 mb-1.5 block">PRESENCIAL</label>
                               <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">R$</span>
                                  <Input type="number" value={course.preco_presencial || ''} onChange={e => setCourse({...course, preco_presencial: e.target.value})} className="pl-10 h-11 bg-white dark:bg-[#151b2b]" placeholder="0,00"/>
                               </div>
                            </div>
                         )}

                         {showInCompanyPrice && (
                            <div className="group animate-in fade-in slide-in-from-left-2">
                               <label className="text-xs font-semibold text-slate-500 mb-1.5 block">PROJETO IN COMPANY</label>
                               <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">R$</span>
                                  <Input type="number" value={course.preco_incompany || ''} onChange={e => setCourse({...course, preco_incompany: e.target.value})} className="pl-10 h-11 bg-white dark:bg-[#151b2b]" placeholder="0,00"/>
                               </div>
                            </div>
                         )}
                      </div>
                   </Card>
                </div>
             )}

             {/* --- ABA 4: ENTREGÁVEIS --- */}
             {activeTab === 'delivery' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-300">
                   <Card className="p-8 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111623] shadow-sm">
                       <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                          <ListChecks className="w-4 h-4 text-pink-500" /> Lista de Entregáveis
                       </h3>
                       <p className="text-xs text-slate-500 mb-3">Digite um item por linha.</p>
                       <textarea 
                        rows={10} 
                        value={Array.isArray(course.deliverables) ? course.deliverables.join('\n') : course.deliverables} 
                        onChange={e => setCourse({...course, deliverables: e.target.value.split('\n')})}
                        className="w-full p-4 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151b2b] text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 leading-relaxed custom-scrollbar"
                        placeholder="Certificado Digital&#10;Material de Apoio&#10;Acesso por 1 ano"
                     />
                   </Card>
                   
                   <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Preview</h3>
                      <div className="bg-white dark:bg-[#151b2b] p-6 rounded-xl border border-pink-100 dark:border-pink-900/10 shadow-sm">
                         {course.deliverables?.length > 0 ? (
                            <ul className="space-y-3">
                               {course.deliverables.map((d:string, i:number) => d && (
                                  <li key={i} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                                     <div className="mt-0.5 bg-pink-50 dark:bg-pink-900/30 p-1 rounded-full text-pink-600 dark:text-pink-400">
                                        <CheckSquare className="w-3.5 h-3.5" />
                                     </div>
                                     <span className="flex-1">{d}</span>
                                  </li>
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
    </div>
  );
}

