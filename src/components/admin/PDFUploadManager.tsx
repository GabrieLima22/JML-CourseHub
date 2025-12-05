import { useState, useCallback, useRef, useEffect } from "react";
import type { ReactNode, ElementType } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input"; // Adicionado
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
  Plus,
  LayoutGrid,
  BookOpen,
  GraduationCap,
  DollarSign,
  Calendar,
  MapPin,
  Tag,
  Save,
  Pencil
} from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadPdf, API_BASE_URL, apiPatch } from "@/services/api"; // Adicionado apiPatch
import { useToast } from "@/hooks/use-toast";
import type { Course } from "@/hooks/useSearch";

interface PDFUploadManagerProps {
  open: boolean;
  onClose: () => void;
}

// Tipagem flexível para garantir que a UI não quebre
type ExtractedCourseData = {
  title: string;
  subtitle?: string;
  area?: string;
  categoria?: string;
  company?: string;
  empresa?: string;
  tipo?: string;
  segmento?: string;
  segments?: string[];
  segmentos_adicionais?: string[];
  modalidade?: string[];
  summary: string;
  description: string;
  duration_hours: number;
  level: string;
  tags: string[];
  badges?: string[];
  price_summary?: string;
  schedule_details?: string;
  target_audience: string[];
  deliverables: string[];
  learning_points?: string[];
  objetivos?: string[];
  programacao?: Array<{ titulo?: string; descricao?: string }>;
  metodologia?: string;
  motivos_participar?: string[];
  orientacoes_inscricao?: string[];
  payment_methods?: string[];
  contacts?: {
    email?: string;
    phone?: string;
    whatsapp?: string;
    website?: string;
    hours?: string;
  };
  confidence: number;
  extraction_method?: 'ai' | 'gemini' | 'heuristic';
};

const isAIExtraction = (method?: string | null) => method === 'ai' || method === 'gemini';
const getExtractionLabel = (method?: string | null) => {
  if (method === 'gemini') return 'IA Gemini';
  if (method === 'ai') return 'IA Assistida';
  return 'Heurística';
};

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
  extractedData?: ExtractedCourseData;
  courseId?: string | null;
  error?: string;
  previewUrl?: string;
}

type CreatedCourseSummary = {
  course: Course;
  fileName: string;
  backendCourseId: string | null;
  confidence: number;
  downloadUrl: string;
};

// --- FUNÇÕES AUXILIARES DE NORMALIZAÇÃO ---
// (Mantidas iguais para garantir compatibilidade com seu backend)
const FALLBACK_MODALITIES = ['Curso EAD JML'];
const UI_UPLOAD_DEFAULT_STATUS = ((import.meta.env.VITE_UPLOAD_DEFAULT_STATUS as string | undefined) ?? 'draft').toLowerCase();

const stripAccents = (value?: string) => value ? value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase() : '';

const canonicalizeModalidade = (value?: string | null) => {
  if (!value) return null;
  const normalized = stripAccents(value);
  if (normalized.includes('hibrid')) return 'Curso Híbrido JML';
  if (normalized.includes('conecta') && normalized.includes('abert')) return 'Curso aberto Conecta';
  if (normalized.includes('abert') && normalized.includes('jml')) return 'Curso aberto JML';
  if (normalized.includes('in company') && normalized.includes('conecta')) return 'Curso InCompany Conecta';
  if (normalized.includes('in company') || normalized.includes('incompany')) return 'Curso InCompany JML';
  if (normalized.includes('ead') || normalized.includes('online')) return 'Curso EAD JML';
  return value.trim();
};

const detectModalidadeFromText = (text?: string | null) => {
  const normalized = stripAccents(text);
  const detected: string[] = [];
  if (!normalized) return detected;
  if (normalized.includes('hibrid')) detected.push('Curso Híbrido JML');
  if (normalized.includes('in company') || normalized.includes('incompany')) detected.push('Curso InCompany JML');
  if (normalized.includes('conecta') && normalized.includes('abert')) detected.push('Curso aberto Conecta');
  if (normalized.includes('abert') && !detected.includes('Curso aberto JML')) detected.push('Curso aberto JML');
  if (normalized.includes('ead') || normalized.includes('online') || normalized.includes('virtual')) {
    detected.push('Curso EAD JML');
  }
  return detected;
};

const resolveModalidades = (data?: Partial<ExtractedCourseData>) => {
  const incoming = Array.isArray(data?.modalidade) ? data?.modalidade : [];
  const normalized = (incoming ?? []).map(canonicalizeModalidade).filter((modal): modal is string => Boolean(modal));
  if (normalized.length > 0) return Array.from(new Set(normalized));
  const searchSpace = [data?.summary, data?.description, data?.area, data?.segmento].filter(Boolean);
  const derived = searchSpace.flatMap(detectModalidadeFromText).filter(Boolean);
  return derived.length > 0 ? Array.from(new Set(derived)) : FALLBACK_MODALITIES;
};

const inferTipo = (data: Partial<ExtractedCourseData> | undefined, modalidades: string[]) => {
  const inferFromValue = (value?: string | null) => {
    const normalized = stripAccents(value);
    if (!normalized) return null;
    if (normalized.includes('hibrid')) return 'hibrido';
    if (normalized.includes('in company') || normalized.includes('incompany')) return 'incompany';
    if (normalized.includes('ead') || normalized.includes('online')) return 'ead';
    if (normalized.includes('abert')) return 'aberto';
    return null;
  };
  const fromField = inferFromValue(data?.tipo);
  if (fromField) return fromField;
  for (const modalidade of modalidades) {
    const fromModalidade = inferFromValue(modalidade);
    if (fromModalidade) return fromModalidade;
  }
  return 'aberto';
};

const inferEmpresa = (data: Partial<ExtractedCourseData> | undefined, modalidades: string[]) => {
  if (data?.empresa?.trim()) return data.empresa.trim();
  const combined = [data?.summary, data?.description, ...modalidades].filter(Boolean).join(' ');
  return stripAccents(combined).includes('conecta') ? 'Conecta' : 'JML';
};

const normalizeExtractionData = (data?: Partial<ExtractedCourseData>): ExtractedCourseData => {
  const modalidade = resolveModalidades(data);
  const tipo = inferTipo(data, modalidade);
  const empresa = inferEmpresa(data, modalidade);
  const segmento = data?.segmento || data?.area || data?.categoria || 'Estatais';
  const segments = data?.segments?.length ? data.segments : (data?.segmentos_adicionais && data.segmentos_adicionais.length ? data.segmentos_adicionais : [segmento]);

  return {
    title: data?.title?.trim() || 'Curso analisado',
    subtitle: data?.subtitle?.trim(),
    area: data?.area || data?.categoria || 'Estatais',
    categoria: data?.categoria || data?.area || 'Estatais',
    company: data?.company || empresa,
    empresa,
    tipo,
    segmento,
    segments,
    segmentos_adicionais: data?.segmentos_adicionais ?? segments,
    modalidade,
    summary: data?.summary?.trim() || 'Resumo não identificado no PDF',
    description: data?.description?.trim() || 'Descrição não identificada no PDF',
    duration_hours: data?.duration_hours && data.duration_hours > 0 ? data.duration_hours : 8,
    level: data?.level || 'Intermediário',
    tags: data?.tags && data.tags.length ? data.tags : ['capacitacao', 'pdf'],
    badges: data?.badges && data.badges.length ? data.badges : (data?.tags?.slice(0, 3) ?? []),
    price_summary: data?.price_summary || data?.preco_resumido || 'Sob consulta',
    schedule_details: data?.schedule_details || undefined,
    target_audience: data?.target_audience && data.target_audience.length ? data.target_audience : ['Profissionais do setor Público'],
    deliverables: data?.deliverables && data.deliverables.length ? data.deliverables : ['Certificado'],
    learning_points: data?.learning_points && data.learning_points.length ? data.learning_points : data?.objetivos?.slice(0, 3),
    confidence: typeof data?.confidence === 'number' ? data.confidence : 0.6,
    objetivos: data?.objetivos && data.objetivos.length ? data.objetivos : ['Capacitar profissionais'],
    programacao: (Array.isArray(data?.programacao) && data.programacao.length ? data.programacao : []) as Array<{ titulo?: string; descricao?: string }>,
    metodologia: data?.metodologia,
    motivos_participar: data?.motivos_participar ?? [],
    orientacoes_inscricao: data?.orientacoes_inscricao ?? [],
    payment_methods: data?.payment_methods ?? (data?.payment_methods ?? ['PIX', 'Boleto', 'Cartão']),
    contacts: data?.contacts,
    extraction_method: data?.extraction_method,
  };
};

const STATUS_META: Record<string, { label: string; chipClass: string; helper: string; }> = {
  published: { label: 'Publicado', chipClass: 'bg-emerald-100 text-emerald-700', helper: 'Curso já está na plataforma.' },
  draft: { label: 'Rascunho', chipClass: 'bg-amber-100 text-amber-800', helper: 'Revise e publique quando pronto.' },
};
const getStatusMeta = (status?: string) => STATUS_META[status ?? 'draft'] ?? STATUS_META.draft;

const COURSE_TYPE_LABELS: Record<string, string> = { aberto: 'Aberto', ead: 'EAD', incompany: 'InCompany', hibrido: 'Híbrido' };
const formatCourseTypeLabel = (value?: string | null) => !value ? 'Aberto' : (COURSE_TYPE_LABELS[value.toLowerCase()] ?? value);

// --- COMPONENTES DE UI AUXILIARES ---
const EditableSection = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="space-y-3 pt-2">
    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
      {title}
    </h4>
    <div className="space-y-3">
      {children}
    </div>
  </section>
);

const ListEditor = ({ value, onChange, placeholder }: { value?: string[], onChange: (val: string[]) => void, placeholder: string }) => {
  const items = value || [];
  
  const handleAdd = () => onChange([...items, ""]);
  const handleChange = (index: number, val: string) => {
    const newItems = [...items];
    newItems[index] = val;
    onChange(newItems);
  };
  const handleRemove = (index: number) => onChange(items.filter((_, i) => i !== index));

  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div key={idx} className="flex gap-2">
          <Input 
            value={item} 
            onChange={(e) => handleChange(idx, e.target.value)} 
            placeholder={placeholder}
            className="h-9 text-sm bg-white dark:bg-gray-900/50"
          />
          <Button variant="ghost" size="icon" onClick={() => handleRemove(idx)} className="h-9 w-9 text-red-500 hover:bg-red-50 hover:text-red-700">
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={handleAdd} className="w-full text-xs h-8 border-dashed text-muted-foreground hover:text-primary hover:border-primary/50">
        <Plus className="h-3 w-3 mr-2" /> Adicionar Item
      </Button>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---
export function PDFUploadManager({ open, onClose }: PDFUploadManagerProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewFile, setPreviewFile] = useState<UploadFile | null>(null);
  const [lastCreatedCourse, setLastCreatedCourse] = useState<CreatedCourseSummary | null>(null);
  
  // Estado para edição
  const [editingData, setEditingData] = useState<ExtractedCourseData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const useSplit = uploadedFiles.length > 0;

  // Sync editing data when preview opens
  useEffect(() => {
    if (previewFile?.extractedData) {
      setEditingData(JSON.parse(JSON.stringify(previewFile.extractedData))); // Deep copy
    } else {
      setEditingData(null);
    }
  }, [previewFile]);

  const getDownloadHref = (file: UploadFile) => file.backendFile?.url ? `${API_BASE_URL}${file.backendFile.url}` : file.previewUrl ?? '';

  const handleUpdateField = (field: keyof ExtractedCourseData, value: any) => {
    if (!editingData) return;
    setEditingData(prev => prev ? { ...prev, [field]: value } : null);
  };

  // --- LÓGICA DE UPLOAD ---
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
    newFiles.forEach(uploadFile => simulateUpload(uploadFile));
  }, []);

  const simulateUpload = async (uploadFile: UploadFile) => {
    const backendUploadPromise = uploadPdf(uploadFile.file);

    // Simulação de progresso inicial
    for (let i = 0; i <= 60; i += Math.random() * 10) {
      await new Promise(resolve => setTimeout(resolve, 60));
      setUploadedFiles(prev => prev.map(f => f.id === uploadFile.id ? { ...f, progress: Math.min(60, i) } : f));
    }

    try {
      const response = await backendUploadPromise;
      // PROTEÇÃO CONTRA UNDEFINED
      const payload = response?.data;
      
      if (!payload || !payload.processingSuccess) {
         throw new Error(payload?.error || 'Erro desconhecido no processamento');
      }

      // Se extraction falhar mas tivermos o arquivo, usamos dados parciais ou vazios
      const extraction = payload.extractedData ? normalizeExtractionData(payload.extractedData) : undefined;

      setUploadedFiles(prev => prev.map(f =>
        f.id === uploadFile.id
          ? {
              ...f,
              backendFile: payload.file,
              storedInDatabase: payload.storedInDatabase,
              extractedData: extraction,
              courseId: payload.createdCourseId ?? payload.courseId ?? null,
              status: 'completed', // Forçamos completed se chegou até aqui
              error: undefined,
              progress: 100,
            }
          : f
      ));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao processar';
      setUploadedFiles(prev => prev.map(f =>
        f.id === uploadFile.id ? { ...f, status: 'error', error: message, progress: 100 } : f
      ));
    }
  };

  const saveChangesAndContinue = async () => {
    if (!previewFile || !editingData || !previewFile.courseId) return;
    setIsSaving(true);

    try {
        // 1. Atualizar o curso no backend com os dados editados
        // Mapeia os dados do formato de extração para o formato do backend se necessário
        // Aqui assumimos que o backend aceita o shape parecido com o extraction
        await apiPatch(`/courses/${previewFile.courseId}`, {
            titulo: editingData.title,
            summary: editingData.summary,
            description: editingData.description,
            carga_horaria: Number(editingData.duration_hours),
            nivel: editingData.level,
            categoria: editingData.area,
            segmento: editingData.segmento,
            modalidade: editingData.modalidade,
            objetivos: editingData.objetivos,
            publico_alvo: editingData.target_audience,
            deliverables: editingData.deliverables,
            motivos_participar: editingData.motivos_participar,
            programacao: editingData.programacao,
            status: 'draft' // Mantém como rascunho para revisão final ou muda para published se quiser
        });

        // 2. Finalizar o fluxo na UI
        createCourseFromExtraction(previewFile, editingData);
        setPreviewFile(null); // Fecha modal
        toast({ title: "Curso Salvo!", description: "Dados atualizados com sucesso." });

    } catch (error) {
        console.error("Erro ao salvar edição", error);
        toast({ title: "Erro ao salvar", description: "Não foi possível atualizar o curso.", variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  };

  const createCourseFromExtraction = async (fileData: UploadFile, finalData: ExtractedCourseData) => {
    const slug = finalData.title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
    
    // Objeto local apenas para feedback visual
    const newCourse: Course = {
      id: fileData.courseId ?? Date.now().toString(),
      title: finalData.title,
      slug: slug,
      area: finalData.area,
      company: finalData.company || 'JML',
      course_type: 'aberto', // simplificação
      segment: finalData.segmento || 'Estatais',
      modality: finalData.modalidade ?? ['EAD'],
      tags: finalData.tags,
      summary: finalData.summary,
      description: finalData.description,
      duration_hours: finalData.duration_hours,
      level: finalData.level,
      target_audience: finalData.target_audience,
      deliverables: finalData.deliverables,
      links: { landing: '#', pdf: getDownloadHref(fileData) },
      related_ids: [],
      status: 'draft',
    };

    setUploadedFiles(prev => prev.filter(f => f.id !== fileData.id));
    setLastCreatedCourse({
      course: newCourse,
      fileName: fileData.file.name,
      backendCourseId: fileData.courseId ?? null,
      confidence: finalData.confidence,
      downloadUrl: getDownloadHref(fileData),
    });

    try {
      await queryClient.invalidateQueries({ queryKey: ['courses'], exact: false });
    } catch (error) { console.error(error); }
  };

  // Funções de Drag & Drop UI (Mantidas)
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); onDrop(Array.from(e.dataTransfer.files)); };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) onDrop(Array.from(e.target.files)); };

  const renderStatus = (file: UploadFile) => {
      // Helper simplificado de renderização
      if(file.status === 'processing') return <span className="text-purple-600 flex items-center gap-1"><Zap className="w-3 h-3 animate-pulse"/> Processando IA...</span>;
      if(file.status === 'error') return <span className="text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {file.error || 'Erro'}</span>;
      if(file.status === 'completed') return <span className="text-green-600 flex items-center gap-1"><Check className="w-3 h-3"/> Concluído</span>;
      return <span className="text-blue-600">Enviando...</span>;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[95vh] p-0 flex flex-col bg-slate-50 dark:bg-slate-900">
       <DialogHeader className="p-6 pb-4 border-b bg-white dark:bg-slate-950 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg shadow-purple-500/20">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">Upload Inteligente</DialogTitle>
                <p className="text-sm text-muted-foreground">Arraste seus PDFs para processamento automático via IA.</p>
              </div>
            </div>
            <Button variant="ghost" onClick={onClose} size="icon"><X className="h-4 w-4" /></Button>
          </div>
        </DialogHeader>

        <div className={cn("flex-1 overflow-hidden", useSplit ? "grid grid-cols-1 md:grid-cols-2 gap-0" : "flex flex-col") }>
          
          {/* PAINEL ESQUERDO: LISTA E DROPZONE */}
          <div className="flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
             {/* Dropzone */}
             <div className="p-6 border-b border-slate-100 dark:border-slate-800/50">
                <div
                  className={cn(
                    "border-2 border-dashed rounded-2xl text-center transition-all duration-300 p-8", 
                    isDragging ? "border-purple-500 bg-purple-50 dark:bg-purple-900/10 scale-[1.02]" : "border-slate-200 dark:border-slate-800 hover:border-purple-400 hover:bg-slate-50 dark:hover:bg-slate-900"
                  )}
                  onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                >
                   <div className="flex flex-col items-center gap-3">
                      <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full text-purple-600"><Upload className="h-6 w-6"/></div>
                      <div>
                         <p className="font-semibold text-slate-700 dark:text-slate-300">Arraste PDFs aqui</p>
                         <p className="text-xs text-slate-500">ou clique para selecionar</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>Selecionar</Button>
                      <input ref={fileInputRef} type="file" accept=".pdf" multiple onChange={handleFileSelect} className="hidden" />
                   </div>
                </div>
             </div>

             {/* Lista de Arquivos */}
             <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 dark:bg-slate-950">
                {uploadedFiles.map((file) => (
                   <Card key={file.id} className="p-3 border shadow-sm hover:shadow-md transition-all group">
                      <div className="flex justify-between items-start mb-2">
                         <div className="flex items-center gap-3 overflow-hidden">
                            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg"><FileText className="w-5 h-5 text-slate-500"/></div>
                            <div className="min-w-0">
                               <p className="text-sm font-semibold truncate">{file.file.name}</p>
                               <p className="text-xs text-slate-500">{renderStatus(file)}</p>
                            </div>
                         </div>
                         {file.status === 'completed' && !file.courseId && (
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500" onClick={() => setUploadedFiles(prev => prev.filter(f => f.id !== file.id))}><X className="w-4 h-4"/></Button>
                         )}
                      </div>
                      
                      <Progress value={file.progress} className="h-1.5 mb-2" />
                      
                      {file.status === 'completed' && file.extractedData && (
                         <div className="flex gap-2 mt-2">
                            <Button size="sm" className="w-full bg-slate-900 text-white hover:bg-slate-800 text-xs h-8" onClick={() => setPreviewFile(file)}>
                               <Pencil className="w-3 h-3 mr-2" /> Revisar & Salvar
                            </Button>
                         </div>
                      )}
                      {file.error && (
                         <p className="text-xs text-red-500 bg-red-50 p-2 rounded mt-2">{file.error}</p>
                      )}
                   </Card>
                ))}
                {uploadedFiles.length === 0 && (
                   <div className="text-center py-10 text-slate-400">
                      <p className="text-sm">Nenhum arquivo na fila.</p>
                   </div>
                )}
             </div>
          </div>

          {/* PAINEL DIREITO: SUCESSO OU ESPAÇO VAZIO (O Preview agora é um Modal sobreposto) */}
          <div className="flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-900/50">
             {lastCreatedCourse ? (
                <div className="text-center max-w-md animate-in zoom-in-95 duration-300">
                   <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
                      <Check className="w-10 h-10" />
                   </div>
                   <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Curso Criado!</h2>
                   <p className="text-slate-600 dark:text-slate-400 mb-6">
                      O curso <strong>"{lastCreatedCourse.course.title}"</strong> foi salvo com sucesso.
                   </p>
                   <div className="flex gap-3 justify-center">
                      <Button variant="outline" onClick={() => setLastCreatedCourse(null)}>Novo Upload</Button>
                      <Button onClick={onClose} className="bg-green-600 hover:bg-green-700 text-white">Fechar</Button>
                   </div>
                </div>
             ) : (
                <div className="text-center text-slate-400 max-w-xs">
                   <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <LayoutGrid className="w-8 h-8 text-slate-400" />
                   </div>
                   <h3 className="font-semibold text-slate-600 dark:text-slate-300">Área de Processamento</h3>
                   <p className="text-sm mt-2">Selecione um arquivo e clique em "Revisar" para ver os dados extraídos aqui.</p>
                </div>
             )}
          </div>

        </div>
      </DialogContent>

      {/* MODAL DE EDIÇÃO / REVIEW (SUBSTITUI O PREVIEW READ-ONLY) */}
      {previewFile && editingData && (
        <Dialog open={Boolean(previewFile)} onOpenChange={(isOpen) => !isOpen && !isSaving && setPreviewFile(null)}>
          <DialogContent className="max-w-5xl h-[90vh] p-0 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
            {/* Header do Editor */}
            <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-900 border-b shrink-0">
               <div>
                  <DialogTitle className="text-lg font-bold flex items-center gap-2">
                     <Pencil className="w-5 h-5 text-purple-600" /> Revisar Conteúdo Extraído
                  </DialogTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Edite os campos antes de confirmar a criação.</p>
               </div>
               <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn("text-xs", editingData.confidence > 0.8 ? "text-green-600 bg-green-50 border-green-200" : "text-amber-600 bg-amber-50 border-amber-200")}>
                     IA Confidence: {Math.round(editingData.confidence * 100)}%
                  </Badge>
                  <Button variant="ghost" size="icon" onClick={() => setPreviewFile(null)} disabled={isSaving}><X className="w-5 h-5"/></Button>
               </div>
            </div>

            {/* Corpo do Editor (Scrollável) */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-slate-50/50 dark:bg-slate-950/50">
               
               {/* Bloco Principal */}
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                     <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Título do Curso</label>
                        <Input 
                           value={editingData.title} 
                           onChange={(e) => handleUpdateField('title', e.target.value)} 
                           className="text-lg font-bold h-12 bg-white dark:bg-slate-900"
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Resumo / Subtítulo</label>
                        <textarea 
                           className="w-full min-h-[80px] p-3 rounded-md border border-input bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-ring"
                           value={editingData.summary}
                           onChange={(e) => handleUpdateField('summary', e.target.value)}
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Descrição Completa</label>
                        <textarea 
                           className="w-full min-h-[200px] p-3 rounded-md border border-input bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-ring font-mono"
                           value={editingData.description}
                           onChange={(e) => handleUpdateField('description', e.target.value)}
                        />
                     </div>
                  </div>

                  {/* Sidebar de Meta-dados */}
                  <div className="space-y-5">
                     <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <h4 className="font-bold text-sm mb-4 text-slate-800 dark:text-white flex items-center gap-2"><Tag className="w-4 h-4"/> Classificação</h4>
                        <div className="space-y-3">
                           <div>
                              <label className="text-xs text-muted-foreground uppercase font-bold">Carga Horária (h)</label>
                              <Input type="number" value={editingData.duration_hours} onChange={(e) => handleUpdateField('duration_hours', e.target.value)} className="h-9"/>
                           </div>
                           <div>
                              <label className="text-xs text-muted-foreground uppercase font-bold">Categoria</label>
                              <Input value={editingData.area} onChange={(e) => handleUpdateField('area', e.target.value)} className="h-9"/>
                           </div>
                           <div>
                              <label className="text-xs text-muted-foreground uppercase font-bold">Segmento</label>
                              <Input value={editingData.segmento} onChange={(e) => handleUpdateField('segmento', e.target.value)} className="h-9"/>
                           </div>
                        </div>
                     </Card>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <EditableSection title="O que você vai aprender">
                     <ListEditor value={editingData.objetivos} onChange={(val) => handleUpdateField('objetivos', val)} placeholder="Adicionar objetivo..." />
                  </EditableSection>
                  
                  <EditableSection title="Público-Alvo">
                     <ListEditor value={editingData.target_audience} onChange={(val) => handleUpdateField('target_audience', val)} placeholder="Adicionar público..." />
                  </EditableSection>
                  
                  <EditableSection title="Entregáveis">
                     <ListEditor value={editingData.deliverables} onChange={(val) => handleUpdateField('deliverables', val)} placeholder="Adicionar entregável..." />
                  </EditableSection>

                  <EditableSection title="Motivos para Participar">
                     <ListEditor value={editingData.motivos_participar} onChange={(val) => handleUpdateField('motivos_participar', val)} placeholder="Adicionar motivo..." />
                  </EditableSection>
               </div>

            </div>

            {/* Footer de Ação */}
            <div className="p-4 bg-white dark:bg-slate-900 border-t flex justify-end gap-3 shrink-0">
               <Button variant="outline" onClick={() => setPreviewFile(null)} disabled={isSaving}>Cancelar</Button>
               <Button 
                  onClick={saveChangesAndContinue} 
                  disabled={isSaving}
                  className="bg-purple-600 hover:bg-purple-700 text-white min-w-[180px]"
               >
                  {isSaving ? <><Zap className="w-4 h-4 mr-2 animate-spin"/> Salvando...</> : <><Save className="w-4 h-4 mr-2"/> Salvar e Confirmar</>}
               </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}