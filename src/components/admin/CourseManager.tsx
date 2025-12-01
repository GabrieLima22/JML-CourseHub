import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Copy,
  Save,
  X,
  FileText,
  Eye,
  Clock,
  Users,
  Tag,
  Calendar,
  DollarSign,
  BookOpen,
  Target,
  CheckCircle,
  AlertCircle,
  Upload,
  Star,
  Link as LinkIcon,
  Sparkles
} from "lucide-react";
import { useSearch, Course } from "@/hooks/useSearch";
import { cn } from "@/lib/utils";
import { apiPost, apiPatch, apiDelete } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { useTaxonomies } from "@/hooks/useTaxonomies";

interface CourseManagerProps {
  open: boolean;
  onClose: () => void;
  inline?: boolean; // Se true, renderiza sem Dialog (modo página completa)
  focusCourseId?: string | null;
  focusCourseTitle?: string | null;
}

type CourseFormData = Omit<Course, 'id' | 'duration_hours'> & { id?: string; duration_hours: number | ''; };

const emptyFormData: CourseFormData = {
  title: "",
  subtitle: "",
  slug: "",
  area: "Estatais",
  company: "JML",
  course_type: "",
  segment: "Estatais",
  segments: ["Estatais"],
  modality: ["Curso EAD JML"],
  tags: [],
  badges: [],
  summary: "",
  description: "",
  duration_hours: 8,
  startDate: null,
  endDate: null,
  location: null,
  address: null,
  schedule_details: null,
  price_summary: null,
  target_audience: [],
  deliverables: [],
  learning_points: [],
  objectives: [],
  program_sections: [],
  methodology: null,
  speakers: [],
  investment_details: undefined,
  payment_methods: [],
  reasons_to_attend: [],
  registration_guidelines: [],
  contacts: undefined,
  links: {
    landing: "",
    pdf: ""
  },
  related_ids: [],
  status: undefined,
  destaque: undefined,
  novo: undefined,
  imagem_capa: undefined,
  cor_categoria: undefined
};
const defaultSegments = ["Estatais", "Judiciário", "Sistema S"];
const getStatusColor = (status: string) => {
  switch (status) {
    case 'published': return 'bg-green-100 text-green-700 border-green-200';
    case 'draft': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'archived': return 'bg-gray-100 text-gray-700 border-gray-200';
    default: return 'bg-blue-100 text-blue-700 border-blue-200';
  }
};

// ✅ CORREÇÃO: Exportação como default
const CourseManager: React.FC<CourseManagerProps> = ({ 
  open, 
  onClose, 
  inline = false, 
  focusCourseId, 
  focusCourseTitle 
}) => {
  const { allCourses, isLoading: isLoadingCourses, refetch } = useSearch({ status: 'all' });
  const [courses, setCourses] = useState<(Course & { status?: string })[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterArea, setFilterArea] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState<CourseFormData>(emptyFormData);
  const [activeFormTab, setActiveFormTab] = useState("basic");
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();
  const { data: taxonomies } = useTaxonomies();

  const companyOptions = useMemo(
    () =>
      taxonomies?.companies ?? [
        { id: "JML", label: "JML" },
        { id: "Conecta", label: "Conecta" },
      ],
    [taxonomies]
  );

  const courseTypeOptions = useMemo(
    () =>
      taxonomies?.courseTypes ?? [
        { id: "aberto", label: "Aberto" },
        { id: "incompany", label: "InCompany" },
        { id: "ead", label: "EAD" },
        { id: "hibrido", label: "Híbrido" },
      ],
    [taxonomies]
  );

  const segmentOptions = useMemo(
    () =>
      (taxonomies?.segments ?? defaultSegments.map((label) => ({ id: label, label }))).map(
        (s) => s.label
      ),
    [taxonomies]
  );

  useEffect(() => {
    const coursesWithStatus = allCourses.map(course => ({
      ...course,
      status: course.status ?? 'draft'
    }));
    setCourses(coursesWithStatus);
  }, [allCourses]);

  const filteredCourses = courses.filter(course => {
    const normalizedSearch = searchQuery.toLowerCase();
    const matchesSearch =
      course.title.toLowerCase().includes(normalizedSearch) ||
      course.summary.toLowerCase().includes(normalizedSearch) ||
      course.tags.some(tag => tag.toLowerCase().includes(normalizedSearch));

    const courseArea = course.area || course.segment;
    const matchesArea = filterArea === "all" || courseArea === filterArea;
    const matchesStatus = statusFilter === "all" || (course.status ?? 'draft') === statusFilter;

    return matchesSearch && matchesArea && matchesStatus;
  });

  const handleCreateCourse = () => {
    setEditingCourse(null);
    setFormData(emptyFormData);
    setActiveFormTab("basic");
    setShowForm(true);
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
    setFormData(course);
    setActiveFormTab("basic");
    setShowForm(true);
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm("Tem certeza que deseja excluir este curso? Esta ação não pode ser desfeita.")) {
      return;
    }

    try {
      await apiDelete(`/api/courses/${courseId}`);
      toast({
        title: "Curso deletado!",
        description: "O curso foi removido com sucesso.",
      });
      await refetch();
    } catch (error) {
      console.error('Erro ao deletar curso:', error);
      toast({
        title: "Erro ao deletar",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao deletar o curso.",
        variant: "destructive",
      });
    }
  };

  const handleDuplicateCourse = (course: Course) => {
    const duplicated = {
      ...course,
      id: Date.now().toString(),
      title: `${course.title} (Cópia)`,
      slug: `${course.slug}-copy`,
      status: 'draft'
    };
    setCourses(prev => [...prev, duplicated]);
  };

  const handleSaveCourse = async () => {
    setIsSaving(true);
    try {
      const normalizeDate = (value?: string | null) => {
        if (!value) return null;
        const trimmed = value.trim();
        const isoParts = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (isoParts) {
          const [, y, m, d] = isoParts;
          return `${y}-${m}-${d}T00:00:00.000Z`;
        }
        const brParts = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (brParts) {
          const [, d, m, y] = brParts;
          return `${y}-${m}-${d}T00:00:00.000Z`;
        }
        const parsed = new Date(trimmed);
        return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
      };

      // Mapear campos do frontend para o backend
      const backendPayload: any = {
        titulo: formData.title,
        titulo_complemento: formData.subtitle || null,
        categoria: formData.segments?.[0] || formData.area || 'Estatais',
        empresa: formData.company,
        tipo: formData.course_type || formData.modality?.[0] || 'aberto',
        modalidade: formData.modality || [],
        segmento: formData.segments?.[0] || formData.area || 'Estatais',
        segmentos_adicionais: formData.segments?.slice(1) || [],
        data_inicio: normalizeDate(formData.startDate),
        data_fim: normalizeDate(formData.endDate),
        local: formData.location || null,
        endereco_completo: formData.address || null,
        carga_horaria: Number.isFinite(formData.duration_hours)
          ? formData.duration_hours
          : emptyFormData.duration_hours,
        summary: formData.summary || '',
        description: formData.description || '',
        objetivos: formData.objectives || [],
        publico_alvo: formData.target_audience || [],
        aprendizados: formData.learning_points || [],
        professores: (formData.speakers || []).map(s => ({
          nome: s.name,
          cargo: s.role || null,
          empresa: s.company || null,
          bio: s.bio || null
        })),
        investimento: formData.investment_details || { summary: formData.price_summary || null },
        preco_resumido: formData.price_summary || null,
        forma_pagamento: formData.payment_methods || [],
        programacao: (formData.program_sections || []).map(p => ({
          titulo: p.title || '',
          descricao: p.description || null,
          topicos: p.topics || []
        })),
        metodologia: formData.methodology || null,
        logistica_detalhes: formData.schedule_details || null,
        landing_page: formData.links?.landing || null,
        pdf_url: formData.links?.pdf || null,
        tags: formData.tags || [],
        badges: formData.badges || [],
        deliverables: formData.deliverables || [],
        related_ids: formData.related_ids || [],
        motivos_participar: formData.reasons_to_attend || [],
        orientacoes_inscricao: formData.registration_guidelines || [],
        contatos: formData.contacts || null,
        cor_categoria: formData.cor_categoria || null,
        imagem_capa: formData.imagem_capa || null,
        status: formData.status || 'draft',
        destaque: formData.destaque || false,
        novo: formData.novo || false
      };

      // Para criação, incluir slug
      if (!editingCourse) {
        backendPayload.slug = '';
      }

      if (editingCourse) {
        // Atualizar curso existente
        await apiPatch(`/api/courses/${editingCourse.id}`, backendPayload);
        toast({
          title: "Curso atualizado!",
          description: "As alterações foram salvas com sucesso.",
        });
      } else {
        // Criar novo curso
        await apiPost('/api/courses', backendPayload);
        toast({
          title: "Curso criado!",
          description: "O novo curso foi adicionado com sucesso.",
        });
      }

      // Recarregar a lista de cursos
      await refetch();
      setShowForm(false);
      setEditingCourse(null);
      setFormData(emptyFormData);
    } catch (error) {
      console.error('Erro ao salvar curso:', error);
      toast({
        title: "Erro ao salvar",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao salvar o curso.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateFormData = (field: keyof CourseFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addArrayItem = (field: keyof CourseFormData, item: string) => {
    if (item.trim()) {
      updateFormData(field, [...(formData[field] as string[]), item.trim()]);
    }
  };

  const removeArrayItem = (field: keyof CourseFormData, index: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    updateFormData(field, (formData[field] as string[]).filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (companyOptions.length && !companyOptions.some((opt) => opt.id === formData.company)) {
      updateFormData('company', companyOptions[0].id);
    }

    if (
      courseTypeOptions.length &&
      (!formData.course_type || !courseTypeOptions.some((opt) => opt.id === formData.course_type))
    ) {
      updateFormData('course_type', courseTypeOptions[0].id);
    }

    if (segmentOptions.length && (!formData.segment || !segmentOptions.includes(formData.segment))) {
      updateFormData('segment', segmentOptions[0]);
      updateFormData('segments', [segmentOptions[0]]);
      updateFormData('area', segmentOptions[0]);
    }
  }, [companyOptions, courseTypeOptions, segmentOptions]);

  // ✅ CORREÇÃO: Conteúdo principal completo
  const mainContent = (
    <div className={cn("flex flex-col", inline ? "h-full" : "h-[90vh]")}>
      {/* Header */}
      <div className="p-6 pb-4 border-b bg-white dark:bg-slate-900 dark:border-slate-700">
        {!showForm ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-blue-600">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Gerenciar Cursos</h2>
                <p className="text-sm text-muted-foreground">
                  {courses.length} cursos • {courses.filter(c => c.status === 'published').length} publicados
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={(e) => { e.stopPropagation(); handleCreateCourse(); }} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Novo Curso
              </Button>
              {inline && (
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onClose(); }}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {editingCourse ? 'Editar Curso' : 'Novo Curso'}
              </h3>
              <p className="text-sm text-muted-foreground">
                Preencha os dados do curso e salve para publicar ou revisar.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={(e) => { e.stopPropagation(); setShowPreview(true); }}>
                <Eye className="h-4 w-4 mr-2" />
                Pré-visualizar
              </Button>
              <Button variant="outline" onClick={(e) => { e.stopPropagation(); setShowForm(false); setEditingCourse(null); }}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={(e) => { e.stopPropagation(); handleSaveCourse(); }} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div className="flex-1 overflow-hidden">
        {!showForm ? (
          <div className="h-full flex flex-col">
            {/* Filtros */}
            <div className="p-6 pb-4 border-b dark:border-slate-700 bg-white dark:bg-slate-900">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar cursos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterArea} onValueChange={setFilterArea}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrar por área" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as áreas</SelectItem>
                    {segmentOptions.map(area => (
                      <SelectItem key={area} value={area}>{area}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Lista de Cursos */}
            <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-slate-900">
              <div className="space-y-4">
                {filteredCourses.map((course) => (
                  <Card key={course.id} className="p-6 hover:shadow-lg transition-shadow dark:bg-slate-800 dark:border-slate-700">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start gap-3">
                          <div>
                            <h3 className="font-semibold text-lg">{course.title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {course.summary}
                            </p>
                          </div>
                          <Badge className={cn("text-xs", getStatusColor(course.status))}>
                            {course.status === 'published' ? 'Publicado' : 'Rascunho'}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {[course.company, course.course_type || course.modality?.[0], course.area || course.segment]
                            .filter(Boolean)
                            .map((label, idx) => {
                              const gradients = [
                                "bg-gradient-to-r from-sky-100 to-indigo-100 text-slate-800 dark:from-sky-900/40 dark:to-indigo-900/40 dark:text-slate-100 border-0",
                                "bg-gradient-to-r from-emerald-100 to-teal-100 text-slate-800 dark:from-emerald-900/40 dark:to-teal-900/40 dark:text-slate-100 border-0",
                                "bg-gradient-to-r from-amber-100 to-orange-100 text-slate-800 dark:from-amber-900/40 dark:to-orange-900/40 dark:text-slate-100 border-0",
                                "bg-gradient-to-r from-purple-100 to-pink-100 text-slate-800 dark:from-purple-900/40 dark:to-pink-900/40 dark:text-slate-100 border-0",
                              ];
                              const gradient = gradients[idx % gradients.length];
                              return (
                                <Badge key={`${label}-${idx}`} className={cn("text-xs font-medium", gradient)}>
                                  {label}
                                </Badge>
                              );
                            })}
                        </div>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {course.duration_hours}h
                          </span>
                          <span className="flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            {course.tags.length} tags
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 ml-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => { e.stopPropagation(); handleEditCourse(course); }}
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => { e.stopPropagation(); handleDuplicateCourse(course); }}
                          title="Duplicar"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => { e.stopPropagation(); handleDeleteCourse(course.id); }}
                          title="Excluir"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}

                {filteredCourses.length === 0 && (
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum curso encontrado</h3>
                    <p className="text-muted-foreground mb-4">
                      Tente ajustar seus filtros ou criar um novo curso
                    </p>
                    <Button onClick={handleCreateCourse}>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Primeiro Curso
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Formulário de Curso */
          <div className="h-full flex flex-col bg-white dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
            <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-gray-50/50 to-purple-50/30 dark:from-slate-900 dark:to-slate-800">
              <Tabs value={activeFormTab} onValueChange={setActiveFormTab}>
                <TabsList className="grid w-full grid-cols-4 p-1 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 border-2 border-purple-200 dark:border-purple-800">
                  <TabsTrigger value="basic" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-md">
                    <BookOpen className="h-4 w-4" />
                    <span className="font-medium">Básico</span>
                  </TabsTrigger>
                  <TabsTrigger value="content" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md">
                    <FileText className="h-4 w-4" />
                    <span className="font-medium">Conteúdo</span>
                  </TabsTrigger>
                  <TabsTrigger value="details" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md">
                    <Target className="h-4 w-4" />
                    <span className="font-medium">Detalhes</span>
                  </TabsTrigger>
                  <TabsTrigger value="config" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-red-600 data-[state=active]:text-white data-[state=active]:shadow-md">
                    <Upload className="h-4 w-4" />
                    <span className="font-medium">Configuração</span>
                  </TabsTrigger>
                </TabsList>

                {/* Aba Básico */}
                <TabsContent value="basic" className="space-y-6">
                  <Card className="p-6 bg-gradient-to-br from-white to-purple-50/30 dark:from-slate-800 dark:to-purple-950/20 border-2 border-purple-100 dark:border-purple-900/50">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <BookOpen className="h-4 w-4 text-white" />
                      </div>
                      <h4 className="font-semibold text-lg text-foreground">Informações Principais</h4>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="title" className="text-sm font-semibold text-purple-900 dark:text-purple-300 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Título do Curso *
                        </Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => updateFormData('title', e.target.value)}
                          placeholder="Ex: Nova Lei de Licitações"
                          className="border-2 border-purple-200 dark:border-purple-800 focus:border-purple-500 bg-white dark:bg-slate-900 text-base"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="duration" className="text-sm font-semibold text-purple-900 dark:text-purple-300 flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Carga Horária (horas) *
                        </Label>
                        <Input
                          id="duration"
                          type="number"
                          value={formData.duration_hours}
                          onChange={(e) =>
                            updateFormData(
                              'duration_hours',
                              e.target.value === "" ? "" : Number(e.target.value)
                            )
                          }
                          placeholder="8"
                          className="border-2 border-purple-200 dark:border-purple-800 focus:border-purple-500 bg-white dark:bg-slate-900 text-base"
                        />
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 bg-gradient-to-br from-white to-blue-50/30 dark:from-slate-800 dark:to-blue-950/20 border-2 border-blue-100 dark:border-blue-900/50">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-white" />
                      </div>
                      <h4 className="font-semibold text-lg text-foreground">Descrição</h4>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="summary" className="text-sm font-semibold text-blue-900 dark:text-blue-300 flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Resumo Executivo *
                      </Label>
                      <Textarea
                        id="summary"
                        value={formData.summary}
                        onChange={(e) => updateFormData('summary', e.target.value)}
                        placeholder="Descrição breve e atrativa do curso..."
                        rows={4}
                        className="border-2 border-blue-200 dark:border-blue-800 focus:border-blue-500 bg-white dark:bg-slate-900"
                      />
                    </div>
                  </Card>

                  {/* Modalidade - Seleção Visual Rica */}
                  <Card className="p-6 bg-gradient-to-br from-white to-emerald-50/30 dark:from-slate-800 dark:to-emerald-950/20 border-2 border-emerald-100 dark:border-emerald-900/50">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                        <Target className="h-4 w-4 text-white" />
                      </div>
                      <h4 className="font-semibold text-lg text-foreground">Modalidade do Curso</h4>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { id: "EAD", label: "EAD", icon: "💻", gradient: { from: "from-blue-100", to: "to-cyan-100", border: "border-blue-500", darkFrom: "dark:from-blue-900/30", darkTo: "dark:to-cyan-900/30" } },
                        { id: "Aberto", label: "Aberto", icon: "🌐", gradient: { from: "from-emerald-100", to: "to-green-100", border: "border-emerald-500", darkFrom: "dark:from-emerald-900/30", darkTo: "dark:to-green-900/30" } },
                        { id: "In Company", label: "In Company", icon: "🏢", gradient: { from: "from-purple-100", to: "to-pink-100", border: "border-purple-500", darkFrom: "dark:from-purple-900/30", darkTo: "dark:to-pink-900/30" } },
                        { id: "Híbrido", label: "Híbrido", icon: "🔄", gradient: { from: "from-amber-100", to: "to-orange-100", border: "border-amber-500", darkFrom: "dark:from-amber-900/30", darkTo: "dark:to-orange-900/30" } },
                      ].map((modality) => {
                        const isSelected = formData.modality?.[0] === modality.id;
                        return (
                          <button
                            key={modality.id}
                            type="button"
                            onClick={() => updateFormData('modality', [modality.id])}
                            className={cn(
                              "p-4 rounded-xl border-2 transition-all text-center font-medium relative group hover:scale-105",
                              isSelected
                                ? `${modality.gradient.border} bg-gradient-to-br ${modality.gradient.from} ${modality.gradient.to} ${modality.gradient.darkFrom} ${modality.gradient.darkTo} text-slate-900 dark:text-slate-100 shadow-lg scale-105`
                                : "border-emerald-200 dark:border-emerald-700 hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/10"
                            )}
                          >
                            <div className="text-2xl mb-1">{modality.icon}</div>
                            <div className="text-sm font-semibold">{modality.label}</div>
                            {isSelected && (
                              <div className="absolute top-2 right-2">
                                <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </Card>
                </TabsContent>

                {/* Aba Conteúdo - Rica e detalhada */}
                <TabsContent value="content" className="space-y-6">
                  {/* Descrição Completa */}
                  <Card className="p-6 bg-gradient-to-br from-white to-indigo-50/30 dark:from-slate-800 dark:to-indigo-950/20 border-2 border-indigo-100 dark:border-indigo-900/50">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-white" />
                      </div>
                      <h4 className="font-semibold text-lg text-foreground">Descrição Completa</h4>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-sm font-semibold text-indigo-900 dark:text-indigo-300">Conteúdo Programático</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => updateFormData('description', e.target.value)}
                        placeholder="Descreva detalhadamente o programa do curso, módulos, tópicos..."
                        rows={8}
                        className="border-2 border-indigo-200 dark:border-indigo-800 focus:border-indigo-500 bg-white dark:bg-slate-900 font-mono text-sm"
                      />
                    </div>
                  </Card>

                  {/* Objetivos de Aprendizagem */}
                  <Card className="p-6 bg-gradient-to-br from-white to-cyan-50/30 dark:from-slate-800 dark:to-cyan-950/20 border-2 border-cyan-100 dark:border-cyan-900/50">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center">
                        <Target className="h-4 w-4 text-white" />
                      </div>
                      <h4 className="font-semibold text-lg text-foreground">Objetivos de Aprendizagem</h4>
                    </div>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Adicionar objetivo..."
                          className="border-2 border-cyan-200 dark:border-cyan-800 focus:border-cyan-500"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              addArrayItem('objectives', e.currentTarget.value);
                              e.currentTarget.value = '';
                            }
                          }}
                        />
                        <Button type="button" size="sm" className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white hover:from-cyan-700 hover:to-teal-700">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {formData.objectives?.map((obj, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-3 bg-cyan-50 dark:bg-cyan-950/20 rounded-lg border border-cyan-200 dark:border-cyan-800 group hover:border-cyan-400 transition-colors">
                            <CheckCircle className="h-4 w-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                            <span className="flex-1 text-sm text-slate-700 dark:text-slate-300">{obj}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => removeArrayItem('objectives', idx, e)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 dark:hover:bg-red-900/20"
                            >
                              <X className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>

                  {/* Pontos de Aprendizado */}
                  <Card className="p-6 bg-gradient-to-br from-white to-violet-50/30 dark:from-slate-800 dark:to-violet-950/20 border-2 border-violet-100 dark:border-violet-900/50">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                        <Star className="h-4 w-4 text-white" />
                      </div>
                      <h4 className="font-semibold text-lg text-foreground">Principais Aprendizados</h4>
                    </div>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Adicionar ponto de aprendizado..."
                          className="border-2 border-violet-200 dark:border-violet-800 focus:border-violet-500"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              addArrayItem('learning_points', e.currentTarget.value);
                              e.currentTarget.value = '';
                            }
                          }}
                        />
                        <Button type="button" size="sm" className="bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {formData.learning_points?.map((point, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-3 bg-violet-50 dark:bg-violet-950/20 rounded-lg border border-violet-200 dark:border-violet-800 group hover:border-violet-400 transition-colors">
                            <Star className="h-4 w-4 text-violet-600 dark:text-violet-400 shrink-0 fill-current" />
                            <span className="flex-1 text-sm text-slate-700 dark:text-slate-300">{point}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => removeArrayItem('learning_points', idx, e)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 dark:hover:bg-red-900/20"
                            >
                              <X className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                </TabsContent>

                {/* Aba Detalhes - Configurações avançadas */}
                <TabsContent value="details" className="space-y-6">
                  {/* Público-Alvo */}
                  <Card className="p-6 bg-gradient-to-br from-white to-pink-50/30 dark:from-slate-800 dark:to-pink-950/20 border-2 border-pink-100 dark:border-pink-900/50">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                        <Users className="h-4 w-4 text-white" />
                      </div>
                      <h4 className="font-semibold text-lg text-foreground">Público-Alvo</h4>
                    </div>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Adicionar perfil de público..."
                          className="border-2 border-pink-200 dark:border-pink-800 focus:border-pink-500"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              addArrayItem('target_audience', e.currentTarget.value);
                              e.currentTarget.value = '';
                            }
                          }}
                        />
                        <Button type="button" size="sm" className="bg-gradient-to-r from-pink-600 to-rose-600 text-white hover:from-pink-700 hover:to-rose-700">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {formData.target_audience?.map((audience, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-3 bg-pink-50 dark:bg-pink-950/20 rounded-lg border border-pink-200 dark:border-pink-800 group hover:border-pink-400 transition-colors">
                            <Users className="h-4 w-4 text-pink-600 dark:text-pink-400 shrink-0" />
                            <span className="flex-1 text-sm text-slate-700 dark:text-slate-300 truncate">{audience}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => removeArrayItem('target_audience', idx, e)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 dark:hover:bg-red-900/20"
                            >
                              <X className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>

                  {/* Datas e Local */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="p-6 bg-gradient-to-br from-white to-amber-50/30 dark:from-slate-800 dark:to-amber-950/20 border-2 border-amber-100 dark:border-amber-900/50">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                          <Calendar className="h-4 w-4 text-white" />
                        </div>
                        <h4 className="font-semibold text-lg text-foreground">Período</h4>
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-amber-900 dark:text-amber-300">Data de Início</Label>
                          <Input
                            type="date"
                            value={formData.startDate || ''}
                            onChange={(e) => updateFormData('startDate', e.target.value)}
                            className="border-2 border-amber-200 dark:border-amber-800 focus:border-amber-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-amber-900 dark:text-amber-300">Data de Término</Label>
                          <Input
                            type="date"
                            value={formData.endDate || ''}
                            onChange={(e) => updateFormData('endDate', e.target.value)}
                            className="border-2 border-amber-200 dark:border-amber-800 focus:border-amber-500"
                          />
                        </div>
                      </div>
                    </Card>

                    <Card className="p-6 bg-gradient-to-br from-white to-green-50/30 dark:from-slate-800 dark:to-green-950/20 border-2 border-green-100 dark:border-green-900/50">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                          <Target className="h-4 w-4 text-white" />
                        </div>
                        <h4 className="font-semibold text-lg text-foreground">Localização</h4>
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-green-900 dark:text-green-300">Local do Curso</Label>
                          <Input
                            value={formData.location || ''}
                            onChange={(e) => updateFormData('location', e.target.value)}
                            placeholder="Ex: Auditório JML, Online, Híbrido..."
                            className="border-2 border-green-200 dark:border-green-800 focus:border-green-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-green-900 dark:text-green-300">Endereço Completo</Label>
                          <Input
                            value={formData.address || ''}
                            onChange={(e) => updateFormData('address', e.target.value)}
                            placeholder="Rua, número, bairro, cidade..."
                            className="border-2 border-green-200 dark:border-green-800 focus:border-green-500"
                          />
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* Tags */}
                  <Card className="p-6 bg-gradient-to-br from-white to-teal-50/30 dark:from-slate-800 dark:to-teal-950/20 border-2 border-teal-100 dark:border-teal-900/50">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                        <Tag className="h-4 w-4 text-white" />
                      </div>
                      <h4 className="font-semibold text-lg text-foreground">Tags e Palavras-chave</h4>
                    </div>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Adicionar tag (ex: licitações, compliance...)"
                          className="border-2 border-teal-200 dark:border-teal-800 focus:border-teal-500"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              addArrayItem('tags', e.currentTarget.value);
                              e.currentTarget.value = '';
                            }
                          }}
                        />
                        <Button type="button" size="sm" className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white hover:from-teal-700 hover:to-cyan-700">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.tags?.map((tag, idx) => (
                          <Badge key={idx} className="bg-gradient-to-r from-teal-100 to-cyan-100 text-teal-900 dark:from-teal-900/40 dark:to-cyan-900/40 dark:text-teal-100 border-0 px-3 py-1.5 text-sm font-medium group hover:from-teal-200 hover:to-cyan-200 transition-all">
                            {tag}
                            <button
                              onClick={(e) => removeArrayItem('tags', idx, e)}
                              className="ml-2 hover:text-red-600 transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </Card>
                </TabsContent>

                {/* Aba Config - Taxonomia e Status */}
                <TabsContent value="config" className="space-y-6">
                  {/* Empresa e Tipo */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="p-6 bg-gradient-to-br from-white to-orange-50/30 dark:from-slate-800 dark:to-orange-950/20 border-2 border-orange-100 dark:border-orange-900/50">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                          <Upload className="h-4 w-4 text-white" />
                        </div>
                        <h4 className="font-semibold text-lg text-foreground">Empresa</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {companyOptions.map((company) => (
                          <button
                            key={company.id}
                            type="button"
                            onClick={() => updateFormData('company', company.id)}
                            className={cn(
                              "p-4 rounded-xl border-2 transition-all text-center font-medium",
                              formData.company === company.id
                                ? "border-orange-500 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 text-orange-900 dark:text-orange-100 shadow-lg scale-105"
                                : "border-orange-200 dark:border-orange-800 hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/10"
                            )}
                          >
                            {company.label}
                          </button>
                        ))}
                      </div>
                    </Card>

                    <Card className="p-6 bg-gradient-to-br from-white to-red-50/30 dark:from-slate-800 dark:to-red-950/20 border-2 border-red-100 dark:border-red-900/50">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center">
                          <FileText className="h-4 w-4 text-white" />
                        </div>
                        <h4 className="font-semibold text-lg text-foreground">Tipo de Curso</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {courseTypeOptions.map((type) => (
                          <button
                            key={type.id}
                            type="button"
                            onClick={() => updateFormData('course_type', type.id)}
                            className={cn(
                              "p-4 rounded-xl border-2 transition-all text-center font-medium",
                              formData.course_type === type.id
                                ? "border-red-500 bg-gradient-to-br from-red-100 to-rose-100 dark:from-red-900/30 dark:to-rose-900/30 text-red-900 dark:text-red-100 shadow-lg scale-105"
                                : "border-red-200 dark:border-red-800 hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-900/10"
                            )}
                          >
                            {type.label}
                          </button>
                        ))}
                      </div>
                    </Card>
                  </div>

                  {/* Segmentos - Cards Coloridos */}
                  <Card className="p-6 bg-gradient-to-br from-white to-slate-50/30 dark:from-slate-800 dark:to-slate-950/20 border-2 border-slate-100 dark:border-slate-900/50">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-slate-500 to-gray-500 flex items-center justify-center">
                        <Tag className="h-4 w-4 text-white" />
                      </div>
                      <h4 className="font-semibold text-lg text-foreground">Segmentos</h4>
                      <p className="text-xs text-muted-foreground ml-auto">Selecione um ou mais</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {segmentOptions.map((segment, idx) => {
                        const isSelected = formData.segments?.includes(segment);
                        const gradients = [
                          { from: "from-blue-500", to: "to-indigo-500", bgFrom: "from-blue-100", bgTo: "to-indigo-100", darkBgFrom: "dark:from-blue-900/30", darkBgTo: "dark:to-indigo-900/30" },
                          { from: "from-emerald-500", to: "to-teal-500", bgFrom: "from-emerald-100", bgTo: "to-teal-100", darkBgFrom: "dark:from-emerald-900/30", darkBgTo: "dark:to-teal-900/30" },
                          { from: "from-purple-500", to: "to-pink-500", bgFrom: "from-purple-100", bgTo: "to-pink-100", darkBgFrom: "dark:from-purple-900/30", darkBgTo: "dark:to-pink-900/30" },
                        ];
                        const gradient = gradients[idx % gradients.length];

                        return (
                          <button
                            key={segment}
                            type="button"
                            onClick={() => {
                              const current = formData.segments || [];
                              const newSegments = current.includes(segment)
                                ? current.filter(s => s !== segment)
                                : [...current, segment];
                              updateFormData('segments', newSegments);
                              if (newSegments.length > 0) {
                                updateFormData('segment', newSegments[0]);
                                updateFormData('area', newSegments[0]);
                              }
                            }}
                            className={cn(
                              "p-4 rounded-xl border-2 transition-all text-center font-medium relative overflow-hidden group",
                              isSelected
                                ? `border-transparent bg-gradient-to-br ${gradient.bgFrom} ${gradient.bgTo} ${gradient.darkBgFrom} ${gradient.darkBgTo} text-slate-900 dark:text-slate-100 shadow-lg scale-105`
                                : "border-slate-200 dark:border-slate-700 hover:border-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                            )}
                          >
                            {isSelected && (
                              <div className={cn("absolute top-2 right-2 h-6 w-6 rounded-full bg-gradient-to-br", gradient.from, gradient.to, "flex items-center justify-center")}>
                                <CheckCircle className="h-4 w-4 text-white" />
                              </div>
                            )}
                            {segment}
                          </button>
                        );
                      })}
                    </div>
                  </Card>

                  {/* Status e Flags */}
                  <Card className="p-6 bg-gradient-to-br from-white to-emerald-50/30 dark:from-slate-800 dark:to-emerald-950/20 border-2 border-emerald-100 dark:border-emerald-900/50">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                      <h4 className="font-semibold text-lg text-foreground">Status e Destaques</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-emerald-900 dark:text-emerald-300">Status do Curso</Label>
                        <Select value={formData.status || 'draft'} onValueChange={(v) => updateFormData('status', v)}>
                          <SelectTrigger className="border-2 border-emerald-200 dark:border-emerald-800 focus:border-emerald-500">
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">📝 Rascunho</SelectItem>
                            <SelectItem value="published">✅ Publicado</SelectItem>
                            <SelectItem value="archived">📦 Arquivado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-sm font-semibold text-emerald-900 dark:text-emerald-300">Destaque</Label>
                        <button
                          type="button"
                          onClick={() => updateFormData('destaque', !formData.destaque)}
                          className={cn(
                            "w-full p-3 rounded-lg border-2 transition-all font-medium flex items-center justify-center gap-2",
                            formData.destaque
                              ? "border-yellow-500 bg-gradient-to-br from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30 text-yellow-900 dark:text-yellow-100"
                              : "border-emerald-200 dark:border-emerald-800 hover:border-emerald-400"
                          )}
                        >
                          <Star className={cn("h-4 w-4", formData.destaque && "fill-current")} />
                          {formData.destaque ? 'Em Destaque' : 'Sem Destaque'}
                        </button>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-sm font-semibold text-emerald-900 dark:text-emerald-300">Novidade</Label>
                        <button
                          type="button"
                          onClick={() => updateFormData('novo', !formData.novo)}
                          className={cn(
                            "w-full p-3 rounded-lg border-2 transition-all font-medium flex items-center justify-center gap-2",
                            formData.novo
                              ? "border-blue-500 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-900 dark:text-blue-100"
                              : "border-emerald-200 dark:border-emerald-800 hover:border-emerald-400"
                          )}
                        >
                          <Sparkles className="h-4 w-4" />
                          {formData.novo ? 'Curso Novo' : 'Curso Normal'}
                        </button>
                      </div>
                    </div>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ✅ CORREÇÃO: Retorno correto com lógica inline/modal
  if (inline) {
    return mainContent;
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-7xl h-[90vh] p-0">
          {mainContent}
        </DialogContent>
      </Dialog>

      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={() => setShowPreview(false)}>
          <div
            className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Pré-visualização</p>
                <h3 className="text-xl font-semibold">{formData.title || "Curso sem título"}</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)}>
                <X className="h-4 w-4 mr-1" /> Fechar
              </Button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground">{formData.summary || "Adicione um resumo para ver aqui."}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" /> {formData.duration_hours || 0}h
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> {formData.startDate || "Data inicial não definida"}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ✅ CORREÇÃO: Exportação default
export default CourseManager;