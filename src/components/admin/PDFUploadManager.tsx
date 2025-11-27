import { useState, useCallback, useRef } from "react";
import type { ReactNode, ElementType } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  Tag
} from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadPdf, API_BASE_URL } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import type { Course } from "@/hooks/useSearch";

interface PDFUploadManagerProps {
  open: boolean;
  onClose: () => void;
}

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
  return 'Heuristica';
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

const mockAIExtraction = async (file: File): Promise<ExtractedCourseData> => {
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

  const fileName = file.name.toLowerCase();

  let mockData: ExtractedCourseData = {
    title: 'Curso Extraido por IA',
    area: 'Agenda JML',
    summary: 'Resumo extraido automaticamente do PDF usando inteligencia artificial.',
    description: 'Descricao detalhada identificada por processamento de texto.',
    duration_hours: 8,
    level: 'Intermediario',
    tags: ['extraido', 'ia', 'automatico'],
    target_audience: ['Gestores', 'Servidores publicos'],
    deliverables: ['Certificado', 'Material didatico'],
    confidence: 0.85
  };

  if (fileName.includes('licitacao') || fileName.includes('pregao')) {
    mockData = {
      ...mockData,
      title: 'Licitacoes e Contratos Publicos',
      area: 'Agenda JML',
      summary: 'Curso sobre processo licitatorio e gestao de contratos na administracao publica.',
      description:
        'Modulo 1: Principios das licitacoes | Modulo 2: Modalidades | Modulo 3: Pregao eletronico | Modulo 4: Gestao contratual | Modulo 5: Fiscalizacao e compliance',
      duration_hours: 16,
      level: 'Intermediario',
      tags: ['licitacao', 'contratos', 'pregao', 'administracao publica'],
      target_audience: ['Pregoeiros', 'Gestores de contratos', 'Servidores publicos'],
      deliverables: ['Certificado digital', 'Apostila completa', 'Modelos de documentos'],
      confidence: 0.92
    };
  } else if (fileName.includes('compliance') || fileName.includes('auditoria')) {
    mockData = {
      ...mockData,
      title: 'Compliance e Controle Interno',
      area: 'Setorial',
      summary: 'Implementacao de programas de integridade e controles internos eficazes.',
      description:
        'Modulo 1: Fundamentos de compliance | Modulo 2: Lei anticorrupcao | Modulo 3: Controles internos | Modulo 4: Auditoria | Modulo 5: Gestao de riscos',
      duration_hours: 12,
      level: 'Avancado',
      tags: ['compliance', 'auditoria', 'controle interno', 'integridade'],
      target_audience: ['Auditores', 'Controladores', 'Gestores de compliance'],
      deliverables: ['Certificado', 'Toolkit de compliance', 'Matriz de riscos'],
      confidence: 0.89
    };
  } else if (fileName.includes('gestao') || fileName.includes('lideranca')) {
    mockData = {
      ...mockData,
      title: 'Gestao e Lideranca no Setor Publico',
      area: 'Soft Skills',
      summary: 'Desenvolvimento de competencias de lideranca e gestao de equipes.',
      description:
        'Modulo 1: Estilos de lideranca | Modulo 2: Gestao de equipes | Modulo 3: Comunicacao eficaz | Modulo 4: Tomada de decisao | Modulo 5: Gestao de conflitos',
      duration_hours: 10,
      level: 'Basico',
      tags: ['gestao', 'lideranca', 'soft skills', 'equipes'],
      target_audience: ['Gestores', 'Lideres', 'Coordenadores'],
      deliverables: ['Certificado', 'Ferramentas de gestao', 'Plano de desenvolvimento'],
      confidence: 0.87
    };
  }

  return mockData;
};

const FALLBACK_MODALITIES = ['Curso EAD JML'];
const UI_UPLOAD_DEFAULT_STATUS =
  ((import.meta.env.VITE_UPLOAD_DEFAULT_STATUS as string | undefined) ?? 'draft').toLowerCase();

const stripAccents = (value?: string) =>
  value
    ? value
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
    : '';

const canonicalizeModalidade = (value?: string | null) => {
  if (!value) return null;
  const normalized = stripAccents(value);
  if (normalized.includes('hibrid')) return 'Curso Hibrido JML';
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
  if (normalized.includes('hibrid')) detected.push('Curso Hibrido JML');
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
  const normalized = (incoming ?? [])
    .map(canonicalizeModalidade)
    .filter((modal): modal is string => Boolean(modal));
  if (normalized.length > 0) {
    return Array.from(new Set(normalized));
  }

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

  const haystack = [data?.summary, data?.description, data?.categoria].filter(Boolean);
  for (const fragment of haystack) {
    const inferred = inferFromValue(fragment);
    if (inferred) return inferred;
  }

  return 'aberto';
};

const inferEmpresa = (data: Partial<ExtractedCourseData> | undefined, modalidades: string[]) => {
  if (data?.empresa?.trim()) {
    return data.empresa.trim();
  }
  const combined = [data?.summary, data?.description, ...modalidades].filter(Boolean).join(' ');
  return stripAccents(combined).includes('conecta') ? 'Conecta' : 'JML';
};

const STATUS_META: Record<
  string,
  {
    label: string;
    chipClass: string;
    helper: string;
  }
> = {
  published: {
    label: 'Publicado',
    chipClass: 'bg-emerald-100 text-emerald-700',
    helper: 'Curso ja esta na plataforma. Ajuste textos no Gerenciador se precisar lapidar algo.',
  },
  draft: {
    label: 'Rascunho',
    chipClass: 'bg-amber-100 text-amber-800',
    helper: 'Abra o Gerenciador, filtre por Rascunhos e publique quando estiver revisado.',
  },
};

const getStatusMeta = (status?: string) => STATUS_META[status ?? 'draft'] ?? STATUS_META.draft;

const COURSE_TYPE_LABELS: Record<string, string> = {
  aberto: 'Aberto',
  ead: 'EAD',
  incompany: 'InCompany',
  hibrido: 'Hibrido',
};

const formatCourseTypeLabel = (value?: string | null) => {
  if (!value) return 'Aberto';
  return COURSE_TYPE_LABELS[value.toLowerCase()] ?? value;
};

export function PDFUploadManager({ open, onClose }: PDFUploadManagerProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewFile, setPreviewFile] = useState<UploadFile | null>(null);
  const [lastCreatedCourse, setLastCreatedCourse] = useState<CreatedCourseSummary | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const useSplit = uploadedFiles.length > 0;

  const getDownloadHref = (file: UploadFile) => {
    if (file.backendFile?.url) {
      return `${API_BASE_URL}${file.backendFile.url}`;
    }
    return file.previewUrl ?? '';
  };
  const renderPreviewContent = (data: ExtractedCourseData) => {
    const segments = data.segmentos_adicionais?.length
      ? data.segmentos_adicionais
      : data.segments?.length
        ? data.segments
        : data.segmento
          ? [data.segmento]
          : [];
    const modalityText = data.modalidade?.join(', ') || 'Nao identificado';
    const priceSummary = data.price_summary || 'Sob consulta';
    const scheduleDetails = data.schedule_details || 'Consulte agenda completa no PDF';
    const badges = data.badges?.length ? data.badges : data.tags;
    const learningPoints = data.learning_points && data.learning_points.length ? data.learning_points : data.objetivos;
    const programSections = data.programacao ?? [];
    const reasons = data.motivos_participar ?? [];
    const registrationGuidelines = data.orientacoes_inscricao ?? [];
    const paymentMethods = data.payment_methods ?? [];
    const contacts = data.contacts;

    const infoBlocks = [
      { icon: BookOpen, label: 'Formato / Modalidade', value: modalityText },
      { icon: Calendar, label: 'Datas / Agenda', value: scheduleDetails },
      { icon: MapPin, label: 'Local', value: data.address || data.location || undefined },
      { icon: Clock, label: 'Carga horaria', value: `${data.duration_hours}h` },
      { icon: GraduationCap, label: 'Nivel', value: data.level },
      { icon: DollarSign, label: 'Preco resumido', value: priceSummary },
      { icon: Tag, label: 'Categoria', value: data.categoria || data.area },
    ];

    return (
      <div className="space-y-5">
        <div className="rounded-2xl bg-white dark:bg-gray-800/95 border border-gray-200/60 dark:border-gray-700/60 p-5 shadow-sm space-y-3">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-2">
              <BookOpen className="h-3 w-3" />
              Curso analisado
            </span>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">{data.title}</h2>
            {data.subtitle && <p className="text-sm text-muted-foreground">{data.subtitle}</p>}
          </div>
          {badges && badges.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {badges.map((badge, idx) => (
                <Badge key={`${badge}-${idx}`} variant="secondary" className="text-[10px] uppercase tracking-wide">
                  {badge}
                </Badge>
              ))}
            </div>
          )}
          <p className="text-sm text-muted-foreground leading-relaxed">{data.summary}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {infoBlocks.map((block, idx) => (
            <InfoBlock key={`${block.label}-${idx}`} icon={block.icon} label={block.label} value={block.value} />
          ))}
        </div>

        <PreviewSection title="Segmentos">
          <div className="flex flex-wrap gap-2">
            {segments.length > 0 ? segments.map(segment => (
              <Badge key={segment} variant="secondary" className="text-xs">{segment}</Badge>
            )) : <span className="text-muted-foreground text-sm">Nao identificado</span>}
          </div>
        </PreviewSection>

        <PreviewSection title="O que voce vai aprender">
          <PreviewList items={learningPoints as string[] | undefined} emptyFallback="Sem itens identificados" />
        </PreviewSection>

        <PreviewSection title="Objetivos">
          <PreviewList items={data.objetivos} emptyFallback="Sem objetivos identificados" />
        </PreviewSection>

        <PreviewSection title="Publico-alvo">
          <PreviewList items={data.target_audience} emptyFallback="Nao identificado" />
        </PreviewSection>

        <PreviewSection title="Entregaveis / O que inclui">
          <PreviewList items={data.deliverables} emptyFallback="Sem beneficios identificados" />
        </PreviewSection>

        {programSections.length > 0 && (
          <PreviewSection title="Conteudo programatico">
            <div className="space-y-3">
              {programSections.map((section, idx) => (
                <div key={`${section?.titulo ?? 'item'}-${idx}`} className="rounded-xl border border-border p-3 bg-white/80 dark:bg-gray-900/40 space-y-1.5">
                  {section.titulo && <p className="font-semibold text-sm">{section.titulo}</p>}
                  {section.descricao && <p className="text-sm text-muted-foreground leading-relaxed">{section.descricao}</p>}
                </div>
              ))}
            </div>
          </PreviewSection>
        )}

        {data.metodologia && (
          <PreviewSection title="Metodologia e vantagens">
            <p>{data.metodologia}</p>
          </PreviewSection>
        )}

        {reasons.length > 0 && (
          <PreviewSection title="Por que participar">
            <PreviewList items={reasons} />
          </PreviewSection>
        )}

        {registrationGuidelines.length > 0 && (
          <PreviewSection title="Orientacoes para inscricao">
            <PreviewList items={registrationGuidelines} />
          </PreviewSection>
        )}

        {paymentMethods.length > 0 && (
          <PreviewSection title="Formas de pagamento">
            <PreviewList items={paymentMethods} />
          </PreviewSection>
        )}

        {contacts && (
          <PreviewSection title="Central de relacionamento">
            <div className="space-y-1 text-sm">
              {contacts.email && <p>Email: {contacts.email}</p>}
              {contacts.phone && <p>Telefone: {contacts.phone}</p>}
              {contacts.whatsapp && <p>WhatsApp: {contacts.whatsapp}</p>}
              {contacts.website && <p>Website: {contacts.website}</p>}
              {contacts.hours && <p>Horario: {contacts.hours}</p>}
            </div>
          </PreviewSection>
        )}
      </div>
    );
  };



const normalizeExtractionData = (data?: Partial<ExtractedCourseData>): ExtractedCourseData => {
  const modalidade = resolveModalidades(data);
  const tipo = inferTipo(data, modalidade);
  const empresa = inferEmpresa(data, modalidade);
  const segmento = data?.segmento || data?.area || data?.categoria || 'Estatais';
  const segments = data?.segments?.length ? data.segments : (data?.segmentos_adicionais && data.segmentos_adicionais.length ? data.segmentos_adicionais : [segmento]);
  const toArray = (value?: string[] | string) => Array.isArray(value) ? value : (value ? [value] : []);

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
    summary: data?.summary?.trim() || 'Resumo Nao identificado no PDF',
    description: data?.description?.trim() || 'Descricao Nao identificada no PDF',
    duration_hours: data?.duration_hours && data.duration_hours > 0 ? data.duration_hours : 8,
    level: data?.level || 'Intermediario',
    tags: data?.tags && data.tags.length ? data.tags : ['capacitacao', 'pdf'],
    badges: data?.badges && data.badges.length ? data.badges : (data?.tags?.slice(0, 3) ?? []),
    price_summary: data?.price_summary || data?.preco_resumido || 'Sob consulta',
    schedule_details: data?.schedule_details || data?.logistica_detalhes || undefined,
    target_audience:
      data?.target_audience && data.target_audience.length ? data.target_audience : ['Profissionais do setor Publico'],
    deliverables: data?.deliverables && data.deliverables.length ? data.deliverables : ['Certificado'],
    learning_points: data?.learning_points && data.learning_points.length ? data.learning_points : data?.objetivos?.slice(0, 3),
    confidence: typeof data?.confidence === 'number' ? data.confidence : 0.6,
    objetivos: data?.objetivos && data.objetivos.length ? data.objetivos : ['Capacitar profissionais'],
    programacao: (Array.isArray(data?.programacao) && data.programacao.length ? data.programacao : []) as Array<{ titulo?: string; descricao?: string }>,
    metodologia: data?.metodologia || data?.methodology,
    motivos_participar: data?.motivos_participar ?? data?.reasons_to_attend ?? [],
    orientacoes_inscricao: data?.orientacoes_inscricao ?? data?.registration_guidelines ?? [],
    payment_methods: data?.payment_methods ?? (data?.forma_pagamento ?? ['PIX', 'Boleto', 'Cartao']),
    contacts: data?.contacts ?? data?.contatos,
    extraction_method: data?.extraction_method,
  };
};

const PreviewSection = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="space-y-2">
    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
      {title}
    </h4>
    <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
      {children}
    </div>
  </section>
);

const PreviewList = ({ items, emptyFallback }: { items?: string[]; emptyFallback?: string }) => {
  if (!items || items.length === 0) {
    return emptyFallback ? <p>{emptyFallback}</p> : null;
  }
  return (
    <ul className="space-y-1.5">
      {items.map((item, idx) => (
        <li key={`${item}-${idx}`} className="flex items-start gap-2 text-sm">
          <span className="text-primary mt-1">{'•'}</span>
          <span className="text-muted-foreground leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  );
};

const internationalDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric'
});

const formatDateRangeValue = (start?: string | null, end?: string | null) => {
  if (!start && !end) return undefined;
  if (start && end) {
    return `${internationalDateFormatter.format(new Date(start))} - ${internationalDateFormatter.format(new Date(end))}`;
  }
  const single = start || end;
  return single ? internationalDateFormatter.format(new Date(single)) : undefined;
};

const InfoBlock = ({
  icon: Icon,
  label,
  value,
}: {
  icon: ElementType;
  label: string;
  value?: string | null;
}) => {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border/70 bg-white/70 dark:bg-gray-900/40 p-3">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      <span className="text-sm font-semibold text-foreground">
        {value}
      </span>
    </div>
  );
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

  newFiles.forEach(uploadFile => {
    simulateUpload(uploadFile);
  });
}, []);

const simulateUpload = async (uploadFile: UploadFile) => {
  const backendUploadPromise = uploadPdf(uploadFile.file);

  for (let i = 0; i <= 70; i += Math.random() * 12) {
    await new Promise(resolve => setTimeout(resolve, 60));
    setUploadedFiles(prev => prev.map(f =>
      f.id === uploadFile.id
        ? { ...f, progress: Math.min(70, i) }
        : f
    ));
  }

  try {
    const response = await backendUploadPromise;
    const payload = response.data;
    const extraction = payload.extractedData
      ? normalizeExtractionData(payload.extractedData)
      : undefined;

    if (!payload.processingSuccess || !extraction) {
      throw new Error(payload.error || 'Falha ao processar PDF');
    }

    setUploadedFiles(prev => prev.map(f =>
      f.id === uploadFile.id
        ? {
            ...f,
            backendFile: payload.file,
            storedInDatabase: payload.storedInDatabase,
            extractedData: extraction,
            courseId: payload.createdCourseId ?? payload.courseId ?? null,
            status: 'processing',
            error: undefined,
            progress: 90,
          }
        : f
    ));

    for (let i = 90; i <= 100; i += Math.random() * 5) {
      await new Promise(resolve => setTimeout(resolve, 80));
      setUploadedFiles(prev => prev.map(f =>
        f.id === uploadFile.id
          ? { ...f, progress: Math.min(100, i) }
          : f
      ));
    }

    setUploadedFiles(prev => prev.map(f =>
      f.id === uploadFile.id
        ? { ...f, status: 'completed', progress: 100 }
        : f
    ));
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Falha ao enviar para o backend';

    setUploadedFiles(prev => prev.map(f =>
      f.id === uploadFile.id
        ? {
            ...f,
            status: 'error',
            error: message,
            progress: 100
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

  const openPreview = (file: UploadFile) => {
    setPreviewFile(file);
  };

  const closePreview = () => {
    setPreviewFile(null);
  };

  const copyToClipboard = (value: string, label: string) => {
    if (!value) return;
    navigator.clipboard
      .writeText(value)
      .then(() => {
        toast({
          title: `${label} copiado`,
          description: `"${value}" esta na Area de transferencia.`,
        });
      })
      .catch(() => {
        toast({
          title: 'Nao foi possivel copiar',
          description: 'Copie manualmente e tente novamente.',
          variant: 'destructive',
        });
      });
  };

  const openCourseManager = (summary?: CreatedCourseSummary | null) => {
    if (typeof window === 'undefined' || !summary) return;
    window.dispatchEvent(
      new CustomEvent('open-course-manager', {
        detail: {
          courseId: summary.backendCourseId ?? summary.course.id,
          title: summary.course.title,
        },
      }),
    );
    onClose();
  };

  const createCourseFromExtraction = async (fileData: UploadFile) => {
    if (!fileData.extractedData) return;

    const normalized = normalizeExtractionData(fileData.extractedData);
    const slug = normalized.title
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
    const generatedId = fileData.courseId ?? Date.now().toString();

    const normalizedStatus = (UI_UPLOAD_DEFAULT_STATUS === 'published' ? 'published' : UI_UPLOAD_DEFAULT_STATUS) as
      | 'published'
      | 'draft'
      | string;

    const newCourse: Course = {
      id: generatedId,
      title: normalized.title,
      slug: slug || generatedId,
      area: normalized.area,
      company: normalized.empresa || 'JML',
      course_type: normalized.tipo || 'aberto',
      segment: normalized.segmento || normalized.area || 'Estatais',
      modality: normalized.modalidade ?? ['Curso EAD JML'],
      tags: normalized.tags,
      summary: normalized.summary,
      description: normalized.description,
      duration_hours: normalized.duration_hours,
      level: normalized.level,
      target_audience: normalized.target_audience,
      deliverables: normalized.deliverables,
      links: {
        landing: `https://jml.com.br/cursos/${slug || generatedId}`,
        pdf: getDownloadHref(fileData),
      },
      related_ids: [],
      status: normalizedStatus,
    };

    setUploadedFiles(prev => prev.filter(f => f.id !== fileData.id));
    setLastCreatedCourse({
      course: newCourse,
      fileName: fileData.file.name,
      backendCourseId: fileData.courseId ?? null,
      confidence: normalized.confidence,
      downloadUrl: getDownloadHref(fileData),
    });

    toast({
      title:
        normalizedStatus === 'published'
          ? 'Curso publicado automaticamente'
          : 'Curso criado como rascunho',
      description:
        normalizedStatus === 'published'
          ? `Confira "${newCourse.title}" na vitrine e ajuste no Gerenciador caso precise lapidar detalhes.`
          : `Revise "${newCourse.title}" no Gerenciador e publique quando estiver pronto.`,
    });

    try {
      await queryClient.invalidateQueries({ queryKey: ['courses'], exact: false });
      await queryClient.refetchQueries({ queryKey: ['courses'], type: 'active' });
    } catch (error) {
      console.error('Erro ao atualizar lista de cursos', error);
    }
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
      case 'completed': return 'Concluido';
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
      <DialogContent className="max-w-7xl h-[95vh] p-0" aria-describedby="pdf-upload-description">
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

        <div className={cn("flex-1 overflow-hidden", useSplit ? "grid grid-cols-1 md:grid-cols-2 gap-6 p-6 pt-2" : "flex flex-col") }>
          {lastCreatedCourse && (() => {
            const { course, confidence, downloadUrl, backendCourseId } = lastCreatedCourse;
            const confidencePercent = Math.round(confidence * 100);
            const statusMeta = getStatusMeta(course.status);
            const typeLabel = formatCourseTypeLabel(course.course_type);

            return (
              <section className="px-6 pt-4 pb-2">
                <div className="relative overflow-hidden rounded-3xl border border-emerald-100/80 bg-white shadow-[0_25px_60px_-40px_rgba(16,185,129,0.9)]">
                  <div className="absolute inset-0 opacity-80 bg-gradient-to-r from-emerald-50 via-white to-cyan-50" />
                  <div className="relative p-6 space-y-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                      <div className="flex flex-1 items-start gap-4">
                        <div className="rounded-2xl bg-emerald-500/90 p-3 text-white shadow-lg">
                          <Check className="h-6 w-6" />
                        </div>
                        <div className="space-y-2 min-w-0">
                          <p className="text-[11px] uppercase tracking-[0.4em] text-emerald-600 font-semibold">
                            Curso pronto com IA
                          </p>
                          <h3 className="text-xl md:text-2xl font-semibold leading-snug text-foreground">
                            {course.title}
                          </h3>
                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            <span>Disponivel no Gerenciador</span>
                            <span className={cn('inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-[11px] font-semibold uppercase', statusMeta.chipClass)}>
                              {statusMeta.label}
                            </span>
                            <span>ID #{backendCourseId ?? course.id}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setLastCreatedCourse(null)}
                        className="rounded-full hover:bg-emerald-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="rounded-2xl border border-emerald-100/80 bg-white/80 px-4 py-3">
                        <p className="text-[11px] uppercase text-muted-foreground tracking-wide">Empresa</p>
                        <p className="text-base font-semibold text-foreground">{course.company}</p>
                      </div>
                      <div className="rounded-2xl border border-emerald-100/80 bg-white/80 px-4 py-3">
                        <p className="text-[11px] uppercase text-muted-foreground tracking-wide">Tipo</p>
                        <p className="text-base font-semibold text-foreground">{typeLabel}</p>
                      </div>
                      <div className="rounded-2xl border border-emerald-100/80 bg-white/80 px-4 py-3">
                        <p className="text-[11px] uppercase text-muted-foreground tracking-wide">Carga horaria</p>
                        <p className="text-base font-semibold text-foreground">{course.duration_hours}h</p>
                      </div>
                      <div className="rounded-2xl border border-emerald-100/80 bg-white/80 px-4 py-3">
                        <p className="text-[11px] uppercase text-muted-foreground tracking-wide">Segmento</p>
                        <p className="text-base font-semibold text-foreground">{course.segment}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {course.modality.map(mod => (
                        <Badge
                          key={mod}
                          className="text-xs bg-emerald-100 text-emerald-700 border-emerald-200 px-3 py-1 rounded-full"
                        >
                          {mod}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {course.tags.length > 0 ? (
                        course.tags.slice(0, 8).map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs border-emerald-200">
                            #{tag}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Sem tags detectadas
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-3 pt-1">
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-md"
                        onClick={() => openCourseManager(lastCreatedCourse)}
                      >
                        <LayoutGrid className="h-4 w-4 mr-2" />
                        Abrir Gerenciador
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => copyToClipboard(course.slug, 'Slug do curso')}
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Copiar slug
                      </Button>
                      {downloadUrl && (
                        <Button variant="outline" size="sm" onClick={() => window.open(downloadUrl, '_blank')}>
                          <Download className="h-4 w-4 mr-2" />
                          PDF original
                        </Button>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-emerald-100 bg-white/80 px-4 py-3 text-xs text-muted-foreground">
                      <span className="flex-1 min-w-[200px]">
                        <strong>Dica rapida:</strong> {statusMeta.helper}
                      </span>
                      <div className="flex items-center gap-3 min-w-[160px]">
                        <div className="w-32">
                          <Progress value={confidencePercent} className="h-1.5" />
                        </div>
                        <span className="font-semibold text-emerald-700">{confidencePercent}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            );
          })()}
          {/* Area de Upload */}
          <div className={cn(useSplit ? "p-0 md:sticky md:top-4 self-start" : "p-6 border-b") }>
            <div
              className={cn(
                "border-2 border-dashed rounded-2xl text-center transition-all duration-500", useSplit ? "p-5 md:p-6 min-h-[180px]" : "p-8", isDragging ? "border-primary bg-primary/5 scale-[1.01]" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5")}
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
                    Nossa IA ira extrair automaticamente os dados dos cursos
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Bot className="h-4 w-4" />
                  <span>Processamento inteligente com 85%+ de precisao</span>
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
          <div className={cn("flex-1 overflow-y-auto", useSplit ? "p-0" : "p-6") }>
            {uploadedFiles.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum PDF carregado</h3>
                <p className="text-muted-foreground">
                  Faca upload de PDFs para comecar a extrair dados automaticamente
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {uploadedFiles.map((file) => (
                  <Card key={file.id} className="overflow-hidden border hover:shadow-md transition-all duration-200">
                    <div className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-lg border transition-all flex-shrink-0",
                            file.status === 'completed' && "bg-green-50 border-green-300",
                            file.status === 'processing' && "bg-purple-50 border-purple-300 animate-pulse",
                            file.status === 'uploading' && "bg-blue-50 border-blue-300",
                            file.status === 'error' && "bg-red-50 border-red-300"
                          )}>
                            <FileText className={cn(
                              "h-5 w-5",
                              file.status === 'completed' && "text-green-600",
                              file.status === 'processing' && "text-purple-600",
                              file.status === 'uploading' && "text-blue-600",
                              file.status === 'error' && "text-red-600"
                            )} />
                          </div>

                          <div className="flex-1 space-y-2 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-sm truncate">{file.file.name}</h3>
                              <Badge variant="secondary" className="text-xs font-medium shrink-0">
                                {(file.file.size / 1024 / 1024).toFixed(2)} MB
                              </Badge>
                              {getStatusIcon(file.status)}
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className={cn(
                                  "text-xs font-medium flex items-center gap-1.5",
                                  file.status === 'completed' && "text-green-600",
                                  file.status === 'processing' && "text-purple-600",
                                  file.status === 'uploading' && "text-blue-600",
                                  file.status === 'error' && "text-red-600"
                                )}>
                                  {file.status === 'processing' && <Zap className="h-3 w-3 animate-pulse" />}
                                  {file.status === 'uploading' && <Upload className="h-3 w-3" />}
                                  {file.status === 'completed' && <Check className="h-3 w-3" />}
                                  {file.status === 'error' && <AlertCircle className="h-3 w-3" />}
                                  {getStatusText(file.status)}
                                </span>
                                <span className="text-sm font-bold">
                                  {file.progress}%
                                </span>
                              </div>
                              <Progress value={file.progress} className={cn(
                                "h-2 transition-all",
                                file.status === 'completed' && "[&>*]:bg-gradient-to-r [&>*]:from-green-500 [&>*]:to-emerald-600",
                                file.status === 'processing' && "[&>*]:bg-gradient-to-r [&>*]:from-purple-500 [&>*]:to-pink-600",
                                file.status === 'uploading' && "[&>*]:bg-gradient-to-r [&>*]:from-blue-500 [&>*]:to-indigo-600",
                                file.status === 'error' && "[&>*]:bg-gradient-to-r [&>*]:from-red-500 [&>*]:to-red-700"
                              )} />
                            </div>

                            {file.backendFile && (
                              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                <FileCheck className="h-3 w-3 text-green-600" />
                                <span>
                                  {file.backendFile.filename}
                                  {file.storedInDatabase ? ' e registrado no banco' : ''}
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
                            {file.courseId && (
                              <Badge className="text-xs bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 px-2 py-0.5 shadow-sm">
                                <Check className="h-3 w-3 mr-1" />
                                Curso #{file.courseId.slice(-6)}
                              </Badge>
                            )}

                            {file.status === 'completed' && file.extractedData && (
                              <div className="flex flex-wrap items-center gap-2 mt-2">
                                {file.extractedData.extraction_method && (
                                  <Badge className={cn(
                                    "text-xs px-2 py-1 font-semibold shadow-sm",
                                    isAIExtraction(file.extractedData.extraction_method)
                                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0"
                                      : "bg-amber-100 text-amber-800 border-amber-300"
                                  )}>
                                    {isAIExtraction(file.extractedData.extraction_method) ? (
                                      <>
                                        <Sparkles className="h-3 w-3 mr-1" />
                                        {getExtractionLabel(file.extractedData.extraction_method)}
                                      </>
                                    ) : (
                                      <>
                                        <AlertCircle className="h-3 w-3 mr-1" />
                                        Heuristica
                                      </>
                                    )}
                                  </Badge>
                                )}
                                <Badge className={cn(
                                  "text-xs px-2 py-1 font-medium shadow-sm",
                                  file.extractedData.confidence >= 0.9 ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0" :
                                  file.extractedData.confidence >= 0.7 ? "bg-gradient-to-r from-yellow-500 to-orange-600 text-white border-0" :
                                  "bg-gradient-to-r from-red-500 to-red-700 text-white border-0"
                                )}>
                                  <Sparkles className="h-3 w-3 mr-1" />
                                  {Math.round(file.extractedData.confidence * 100)}%
                                </Badge>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openPreview(file)}
                                  className="text-xs h-7 gap-1.5 px-3 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300 transition-all"
                                >
                                  <Eye className="h-3 w-3" />
                                  Ver Detalhes
                                </Button>
                              </div>
                            )}

                            {file.error && (
                              <div className="p-2 bg-red-50 border border-red-200 rounded text-xs">
                                <div className="flex items-start gap-2">
                                  <AlertCircle className="h-3 w-3 text-red-600 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <p className="font-medium text-red-900">Erro no processamento</p>
                                    <p className="text-red-700">{file.error}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {file.status === 'error' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => retryProcessing(file.id)}
                              className="h-7 w-7 p-0 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                              title="Tentar novamente"
                            >
                              <RefreshCw className="h-3 w-3" />
                            </Button>
                          )}

                          {file.status === 'completed' && !file.courseId && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => void createCourseFromExtraction(file)}
                              className="h-7 w-7 p-0 bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 hover:from-green-600 hover:to-emerald-700 shadow-sm"
                              title="Criar curso automaticamente"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeFile(file.id)}
                            className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                            title="Remover arquivo"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>

      {/* Modal de Preview Separado - iOS Clean & Professional */}
      {previewFile && previewFile.extractedData && (
        <Dialog open={Boolean(previewFile)} onOpenChange={(isOpen) => !isOpen && closePreview()}>
          <DialogContent className="max-w-6xl h-[95vh] p-0 gap-0 overflow-hidden rounded-3xl border-2 border-purple-200/30 dark:border-purple-800/30 shadow-2xl flex flex-col" aria-describedby="preview-description">
            <DialogHeader className="flex-shrink-0 px-8 py-6 bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-950 dark:to-purple-950 border-b border-purple-100 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl blur-lg opacity-60"></div>
                    <div className="relative p-3 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl shadow-xl">
                      <Brain className="h-7 w-7 text-white" />
                    </div>
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
                      Analise Completa
                    </DialogTitle>
                    <p id="preview-description" className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {previewFile.file.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {previewFile.extractedData.extraction_method && (
                    <Badge
                      className={cn(
                        "text-sm font-bold px-4 py-2 rounded-full shadow-lg",
                        isAIExtraction(previewFile.extractedData.extraction_method)
                          ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0"
                          : "bg-gradient-to-r from-amber-400 to-orange-400 text-white border-0"
                      )}
                    >
                      {isAIExtraction(previewFile.extractedData.extraction_method) ? (
                        <>
                          <Sparkles className="h-4 w-4 mr-1.5" />
                          {getExtractionLabel(previewFile.extractedData.extraction_method)}
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 mr-1.5" />
                          Heuristica
                        </>
                      )}
                    </Badge>
                  )}
                  <Button variant="ghost" size="icon" onClick={closePreview} className="rounded-full hover:bg-purple-100 dark:hover:bg-gray-800">
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 bg-gradient-to-br from-gray-50/30 via-white to-blue-50/20 dark:from-gray-950 dark:via-black dark:to-blue-950/10">
              {renderPreviewContent(previewFile.extractedData)}
            </div>
            {/* Footer com Acoes - Fixo no Bottom */}
            <div className="flex-shrink-0 px-6 py-4 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  size="default"
                  onClick={() => {
                    void createCourseFromExtraction(previewFile);
                    closePreview();
                  }}
                  className="flex-1 h-11 text-sm font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-sm hover:shadow transition-all rounded-lg"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Curso Automaticamente
                </Button>
                <Button
                  variant="outline"
                  size="default"
                  onClick={closePreview}
                  className="h-11 px-6 text-sm font-medium border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 rounded-lg transition-all"
                >
                  <X className="h-4 w-4 mr-2" />
                  Fechar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}










