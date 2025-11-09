import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  RefreshCw
} from "lucide-react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { CourseManager } from "@/components/admin/CourseManager";
import { PDFUploadManager } from "@/components/admin/PDFUploadManager";
import { AnalyticsDashboard } from "@/components/admin/AnalyticsDashboard";
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

  const stats = {
    totalCourses: 20,
    publishedCourses: 18,
    draftCourses: 2,
    totalViews: 1248,
    pendingUploads: 3,
    lastUpdate: "Há 2 horas"
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] p-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-aurora/5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-aurora">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Painel Administrativo</h2>
              <p className="text-sm text-muted-foreground">
                Bem-vindo, {user?.username}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Sessão: {getTimeRemainingFormatted()}</span>
            </div>
            <Button variant="outline" size="sm" onClick={extendSession}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Estender
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Sair
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-5 mx-6 mt-4">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Visão Geral
              </TabsTrigger>
              <TabsTrigger value="courses" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Cursos
              </TabsTrigger>
              <TabsTrigger value="uploads" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Uploads
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Configurações
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6 mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total de Cursos</p>
                        <p className="text-2xl font-bold">{stats.totalCourses}</p>
                      </div>
                      <FileText className="h-8 w-8 text-primary" />
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Publicados</p>
                        <p className="text-2xl font-bold text-green-600">{stats.publishedCourses}</p>
                      </div>
                      <Eye className="h-8 w-8 text-green-600" />
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Rascunhos</p>
                        <p className="text-2xl font-bold text-orange-600">{stats.draftCourses}</p>
                      </div>
                      <Edit className="h-8 w-8 text-orange-600" />
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Visualizações</p>
                        <p className="text-2xl font-bold text-blue-600">{stats.totalViews}</p>
                      </div>
                      <BarChart3 className="h-8 w-8 text-blue-600" />
                    </div>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Ações Rápidas</h3>
                    <div className="space-y-3">
                      <Button className="w-full justify-start" onClick={() => setShowCourseManager(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Curso
                      </Button>
                      <Button variant="outline" className="w-full justify-start" onClick={() => setShowPDFUploader(true)}>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload de PDF
                      </Button>
                      <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab("users")}>
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Ver Analytics
                      </Button>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Status do Sistema</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Última atualização</span>
                        <Badge variant="outline">{stats.lastUpdate}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">PDFs pendentes</span>
                        <Badge variant="secondary">{stats.pendingUploads}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Sistema</span>
                        <Badge className="bg-green-100 text-green-700">Online</Badge>
                      </div>
                    </div>
                  </Card>
                </div>
              </TabsContent>

              {/* Courses Tab */}
              <TabsContent value="courses" className="space-y-6 mt-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">Gerenciar Cursos</h3>
                  <Button onClick={() => setShowCourseManager(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Curso
                  </Button>
                </div>

                <Card className="p-6">
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Sistema de Cursos</h3>
                    <p className="text-muted-foreground mb-4">
                      Interface completa para criar, editar e gerenciar todos os cursos
                    </p>
                    <Button onClick={() => setShowCourseManager(true)}>
                      <FileText className="h-4 w-4 mr-2" />
                      Abrir Gerenciador
                    </Button>
                  </div>
                </Card>
              </TabsContent>

              {/* Uploads Tab */}
              <TabsContent value="uploads" className="space-y-6 mt-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">Upload Inteligente</h3>
                  <Button onClick={() => setShowPDFUploader(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Novo Upload
                  </Button>
                </div>

                <Card className="p-6">
                  <div className="text-center py-12">
                    <Upload className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Upload com IA</h3>
                    <p className="text-muted-foreground mb-4">
                      Faça upload de PDFs e nossa IA extrai automaticamente os dados dos cursos
                    </p>
                    <div className="flex items-center justify-center gap-2 text-sm text-purple-600 mb-4">
                      <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse"></div>
                      <span>Processamento inteligente com 85%+ de precisão</span>
                    </div>
                    <Button onClick={() => setShowPDFUploader(true)}>
                      <Upload className="h-4 w-4 mr-2" />
                      Iniciar Upload
                    </Button>
                  </div>
                </Card>
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="users" className="space-y-6 mt-0">
                <AnalyticsDashboard />
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-6 mt-0">
                <h3 className="text-xl font-semibold">Configurações do Sistema</h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="p-6">
                    <h4 className="font-semibold mb-4">Configurações Gerais</h4>
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full justify-start">
                        <Settings className="h-4 w-4 mr-2" />
                        Preferências do Sistema
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Users className="h-4 w-4 mr-2" />
                        Gerenciar Usuários
                      </Button>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h4 className="font-semibold mb-4">Backup e Segurança</h4>
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full justify-start">
                        <Download className="h-4 w-4 mr-2" />
                        Backup dos Dados
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Shield className="h-4 w-4 mr-2" />
                        Logs de Segurança
                      </Button>
                    </div>
                  </Card>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>

      {/* Modais dos subsistemas */}
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
