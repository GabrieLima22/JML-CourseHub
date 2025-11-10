import { useState, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Upload, 
  FileText, 
  X, 
  Check, 
  AlertCircle, 
  Brain, 
  Sparkles, 
  Eye, 
  Download,
  RefreshCw,
  Zap,
  FileCheck,
  Clock,
  Bot,
  ChevronDown,
  ChevronUp,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadPdf, API_BASE_URL } from "@/services/api";

interface PDFUploadManagerProps {
  open: boolean;
  onClose: () => void;
}

interface UploadFile {
  id: string;
  file: File;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  backendFile?: {
    id: string | null;
    name: string;
    filename: string;
    size: number;
    url: string;
  };
  storedInDatabase?: boolean;
  extractedData?: {
    title: string;
    area: string;
    summary: string;
    description: string;
    duration_hours: number;
    level: string;
    tags: string[];
    target_audience: string[];
    deliverables: string[];
    confidence: number;
  };
  error?: string;
  previewUrl?: string;
}

const mockAIExtraction = async (file: File): Promise<UploadFile['extractedData']> => {
  // Simular processamento IA
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
  
  // Dados simulados baseados no nome do arquivo
  const fileName = file.name.toLowerCase();
  
  let mockData = {
    title: "Curso Extraído por IA",
    area: "Agenda JML",
    summary: "Resumo extraído automaticamente do PDF usando inteligência artificial.",
    description: "Descrição detalhada do curso identificada através de processamento de texto avançado.",
    duration_hours: 8,
    level: "Intermediário",
    tags: ["extraido", "ia", "automatico"],
    target_audience: ["Gestores", "Servidores públicos"],
    deliverables: ["Certificado", "Material didático"],
    confidence: 0.85
  };

  // Personalizar dados baseado no nome do arquivo
  if (fileName.includes('licitacao') || fileName.includes('pregao')) {
    mockData = {
      ...mockData,
      title: "Licitações e Contratos Públicos",
      area: "Agenda JML",
      summary: "Curso abrangente sobre o processo licitatório e gestão de contratos na administração pública.",
      description: "Módulo 1: Princípios das licitações | Módulo 2: Modalidades licitatórias | Módulo 3: Pregão eletrônico | Módulo 4: Gestão contratual | Módulo 5: Fiscalização e compliance",
      duration_hours: 16,
      level: "Intermediário",
      tags: ["licitacao", "contratos", "pregao", "administracao publica"],
      target_audience: ["Pregoeiros", "Gestores de contratos", "Servidores públicos"],
      deliverables: ["Certificado digital", "Apostila completa", "Modelos de documentos"],
      confidence: 0.92
    };
  } else if (fileName.includes('compliance') || fileName.includes('auditoria')) {
    mockData = {
      ...mockData,
      title: "Compliance e Controle Interno",
      area: "Setorial",
      summary: "Implementação de programas de integridade e sistemas de controle interno eficazes.",
      description: "Módulo 1: Fundamentos do compliance | Módulo 2: Lei Anticorrupção | Módulo 3: Controles internos | Módulo 4: Auditoria | Módulo 5: Gestão de riscos",
      duration_hours: 12,
      level: "Avançado",
      tags: ["compliance", "auditoria", "controle interno", "integridade"],
      target_audience: ["Auditores", "Controladores", "Gestores de compliance"],
      deliverables: ["Certificado", "Toolkit de compliance", "Matriz de riscos"],
      confidence: 0.89
    };
  } else if (fileName.includes('gestao') || fileName.includes('lideranca')) {
    mockData = {
      ...mockData,
      title: "Gestão e Liderança no Setor Público",
      area: "Soft Skills",
      summary: "Desenvolvimento de competências de liderança e gestão de equipes no ambiente público.",
      description: "Módulo 1: Estilos de liderança | Módulo 2: Gestão de equipes | Módulo 3: Comunicação eficaz | Módulo 4: Tomada de decisão | Módulo 5: Gestão de conflitos",
      duration_hours: 10,
      level: "Básico",
      tags: ["gestao", "lideranca", "soft skills", "equipes"],
      target_audience: ["Gestores", "Líderes", "Coordenadores"],
      deliverables: ["Certificado", "Ferramentas de gestão", "Plano de desenvolvimento"],
      confidence: 0.87
    };
  }

  return mockData;
};

export function PDFUploadManager({ open, onClose }: PDFUploadManagerProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

  const getDownloadHref = (file: UploadFile) => {
    if (file.backendFile?.url) {
      return `${API_BASE_URL}${file.backendFile.url}`;
    }
    return file.previewUrl ?? '';
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadFile[] = acceptedFiles
      .filter(file => file.type === 'application/pdf')
      .map(file => ({
        id: Date.now().toString() + Math.random(),
        file,
        status: 'uploading',
        progress: 0,
        storedInDatabase: false,
        previewUrl: URL.createObjectURL(file)
      }));

    setUploadedFiles(prev => [...prev, ...newFiles]);

    // Simular upload e processamento
    newFiles.forEach(uploadFile => {
      simulateUpload(uploadFile);
    });
  }, []);

  const simulateUpload = async (uploadFile: UploadFile) => {
    const backendUploadPromise = uploadPdf(uploadFile.file);

    for (let i = 0; i <= 85; i += Math.random() * 15) {
      await new Promise(resolve => setTimeout(resolve, 50));
      setUploadedFiles(prev => prev.map(f =>
        f.id === uploadFile.id
          ? { ...f, progress: Math.min(85, i) }
          : f
      ));
    }

    try {
      const response = await backendUploadPromise;
      setUploadedFiles(prev => prev.map(f =>
        f.id === uploadFile.id
          ? {
              ...f,
              backendFile: response.data.file,
              storedInDatabase: response.data.storedInDatabase,
              progress: 100,
            }
          : f
      ));
    } catch (error) {
      setUploadedFiles(prev => prev.map(f =>
        f.id === uploadFile.id
          ? {
              ...f,
              status: 'error',
              error:
                error instanceof Error
                  ? error.message
                  : 'Falha ao enviar para o backend',
            }
          : f
      ));
      return;
    }

    setUploadedFiles(prev => prev.map(f =>
      f.id === uploadFile.id
        ? { ...f, status: 'processing', progress: 0 }
        : f
    ));

    try {
      const extractedData = await mockAIExtraction(uploadFile.file);

      for (let i = 0; i <= 100; i += Math.random() * 20) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setUploadedFiles(prev => prev.map(f =>
          f.id === uploadFile.id
            ? { ...f, progress: Math.min(100, i) }
            : f
        ));
      }

      setUploadedFiles(prev => prev.map(f =>
        f.id === uploadFile.id
          ? { ...f, status: 'completed', progress: 100, extractedData }
          : f
      ));
    } catch (error) {
      setUploadedFiles(prev => prev.map(f =>
        f.id === uploadFile.id
          ? {
              ...f,
              status: 'error',
              error:
                error instanceof Error
                  ? error.message
                  : 'Erro no processamento IA',
            }
          : f
      ));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    onDrop(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      onDrop(files);
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const retryProcessing = (fileId: string) => {
    const file = uploadedFiles.find(f => f.id === fileId);
    if (file) {
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, status: 'processing', progress: 0, error: undefined }
          : f
      ));
      simulateUpload(file);
    }
  };

  const toggleFileDetails = (fileId: string) => {
    setExpandedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  };

  const createCourseFromExtraction = (fileData: UploadFile) => {
    if (!fileData.extractedData) return;

    // Criar objeto do curso baseado nos dados extraídos
    const newCourse = {
      id: Date.now().toString(),
      title: fileData.extractedData.title,
      slug: fileData.extractedData.title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-'),
      area: fileData.extractedData.area,
      company: "JML",
      course_type: "ead",
      segment: fileData.extractedData.area,
      modality: ["Curso EAD JML"],
      tags: fileData.extractedData.tags,
      summary: fileData.extractedData.summary,
      description: fileData.extractedData.description,
      duration_hours: fileData.extractedData.duration_hours,
      level: fileData.extractedData.level,
      target_audience: fileData.extractedData.target_audience,
      deliverables: fileData.extractedData.deliverables,
      links: {
        landing: `https://jml.com.br/cursos/${fileData.extractedData.title.toLowerCase().replace(/\s+/g, '-')}`,
        pdf: URL.createObjectURL(fileData.file) // URL temporária do PDF
      },
      related_ids: [],
      status: 'draft'
    };

    // Simular salvamento do curso
    console.log('Curso criado automaticamente:', newCourse);
    
    // Remover o arquivo da lista após criar o curso
    setUploadedFiles(prev => prev.filter(f => f.id !== fileData.id));
    
    // Feedback visual
    alert(`✅ Curso "${newCourse.title}" criado com sucesso!\n\n📊 Precisão da IA: ${Math.round((fileData.extractedData?.confidence || 0) * 100)}%\n🎯 Status: Rascunho\n📝 Pronto para revisão e publicação`);
    
    // Em uma implementação real, aqui você faria:
    // 1. POST para API backend
    // 2. Salvar no banco de dados
    // 3. Upload real do PDF para storage
    // 4. Atualizar estado global dos cursos
    // 5. Redirecionar para edição do curso se necessário
  };

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'uploading': return <Upload className="h-4 w-4 text-blue-500" />;
      case 'processing': return <Brain className="h-4 w-4 text-purple-500 animate-pulse" />;
      case 'completed': return <Check className="h-4 w-4 text-green-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusText = (status: UploadFile['status']) => {
    switch (status) {
      case 'uploading': return 'Enviando...';
      case 'processing': return 'Processando com IA...';
      case 'completed': return 'Concluído';
      case 'error': return 'Erro';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600 bg-green-50 border-green-200';
    if (confidence >= 0.7) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[90vh] p-0" aria-describedby="pdf-upload-description">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 to-pink-600">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl">Upload Inteligente de PDFs</DialogTitle>
                <p id="pdf-upload-description" className="text-sm text-muted-foreground">
                  IA extrai automaticamente dados dos cursos
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Área de Upload */}
          <div className="p-6 border-b">
            <div
              className={cn(
                "border-2 border-dashed rounded-xl p-8 text-center transition-colors",
                isDragging 
                  ? "border-primary bg-primary/5" 
                  : "border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5"
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600">
                  <Upload className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    Arraste seus PDFs aqui ou clique para selecionar
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Nossa IA irá extrair automaticamente os dados dos cursos
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Bot className="h-4 w-4" />
                  <span>Processamento inteligente com 85%+ de precisão</span>
                </div>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Selecionar Arquivos
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Lista de Arquivos */}
          <div className="flex-1 overflow-y-auto p-6">
            {uploadedFiles.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum PDF carregado</h3>
                <p className="text-muted-foreground">
                  Faça upload de PDFs para começar a extrair dados automaticamente
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {uploadedFiles.map((file) => (
                  <Card key={file.id} className="overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 border border-red-200">
                            <FileText className="h-6 w-6 text-red-600" />
                          </div>
                          
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{file.file.name}</h3>
                              <Badge variant="outline" className="text-xs">
                                {(file.file.size / 1024 / 1024).toFixed(1)} MB
                              </Badge>
                              {getStatusIcon(file.status)}
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">
                                  {getStatusText(file.status)}
                                </span>
                                <span className="text-muted-foreground">
                                  {file.progress}%
                                </span>
                              </div>
                              <Progress value={file.progress} className="h-2" />
                            </div>

                            {file.backendFile && (
                              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                <FileCheck className="h-3 w-3 text-green-600" />
                                <span>
                                  {file.backendFile.filename}
                                  {file.storedInDatabase ? ' • registrado no banco' : ''}
                                </span>
                                {getDownloadHref(file) && (
                                  <a
                                    href={getDownloadHref(file)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-primary hover:underline"
                                  >
                                    <Download className="h-3 w-3" />
                                    Abrir PDF
                                  </a>
                                )}
                              </div>
                            )}

                            {file.status === 'completed' && file.extractedData && (
                              <div className="flex items-center gap-2 mt-2">
                                <Badge className={cn("text-xs", getConfidenceColor(file.extractedData.confidence))}>
                                  <Sparkles className="h-3 w-3 mr-1" />
                                  {Math.round(file.extractedData.confidence * 100)}% precisão
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleFileDetails(file.id)}
                                  className="text-xs p-1 h-auto"
                                >
                                  {expandedFiles.has(file.id) ? (
                                    <><ChevronUp className="h-3 w-3 mr-1" />Ocultar</>
                                  ) : (
                                    <><ChevronDown className="h-3 w-3 mr-1" />Detalhes</>
                                  )}
                                </Button>
                              </div>
                            )}

                            {file.error && (
                              <p className="text-sm text-red-600">{file.error}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          {file.status === 'error' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => retryProcessing(file.id)}
                              title="Tentar novamente"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {file.status === 'completed' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => createCourseFromExtraction(file)}
                              title="Criar curso"
                              className="text-green-600 hover:text-green-700"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFile(file.id)}
                            title="Remover"
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Dados Extraídos */}
                    {file.status === 'completed' && file.extractedData && expandedFiles.has(file.id) && (
                      <>
                        <Separator />
                        <div className="p-4 bg-muted/30 space-y-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Brain className="h-4 w-4 text-purple-600" />
                            <span className="text-sm font-medium">Dados Extraídos pela IA</span>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Título:</span>
                              <p className="font-medium">{file.extractedData.title}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Área:</span>
                              <p className="font-medium">{file.extractedData.area}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Nível:</span>
                              <p className="font-medium">{file.extractedData.level}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Duração:</span>
                              <p className="font-medium">{file.extractedData.duration_hours}h</p>
                            </div>
                          </div>

                          <div>
                            <span className="text-muted-foreground text-sm">Resumo:</span>
                            <p className="text-sm mt-1">{file.extractedData.summary}</p>
                          </div>

                          <div className="flex flex-wrap gap-1">
                            <span className="text-muted-foreground text-sm mr-2">Tags:</span>
                            {file.extractedData.tags.map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>

                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              onClick={() => createCourseFromExtraction(file)}
                              className="flex-1"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Criar Curso
                            </Button>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              Preview PDF
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
