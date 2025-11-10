import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  Eye, 
  Copy,
  Save,
  X,
  FileText,
  Clock,
  Users,
  Building,
  GraduationCap,
  Tag,
  Calendar,
  MapPin,
  DollarSign,
  BookOpen,
  Target,
  CheckCircle,
  AlertCircle,
  Upload
} from "lucide-react";
import { useSearch, Course } from "@/hooks/useSearch";
import { cn } from "@/lib/utils";

interface CourseManagerProps {
  open: boolean;
  onClose: () => void;
}

type CourseFormData = Omit<Course, 'id'> & { id?: string };

const emptyFormData: CourseFormData = {
  title: "",
  area: "Estatais",
  company: "JML",
  course_type: "aberto",
  segment: "Estatais",
  modality: ["Curso EAD JML"],
  tags: [],
  summary: "",
  description: "",
  duration_hours: 8,
  level: "Básico",
  target_audience: [],
  deliverables: [],
  links: {
    landing: "",
    pdf: ""
  },
  related_ids: []
};
const areaOptions = ["Estatais", "Judiciário", "Sistema S"];
const modalityOptions = ["Curso aberto JML", "Curso aberto Conecta", "Curso InCompany", "Curso EAD JML", "Curso Híbrido JML"];
const levelOptions = ["Básico", "Intermediário", "Avançado"];
const getStatusColor = (status: string) => {
  switch (status) {
    case 'published': return 'bg-green-100 text-green-700 border-green-200';
    case 'draft': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'archived': return 'bg-gray-100 text-gray-700 border-gray-200';
    default: return 'bg-blue-100 text-blue-700 border-blue-200';
  }
};

export function CourseManager({ open, onClose }: CourseManagerProps) {
  const { allCourses, isLoading: isLoadingCourses, refetch } = useSearch({ status: 'all' });
  const [courses, setCourses] = useState<(Course & { status?: string })[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterArea, setFilterArea] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState<CourseFormData>(emptyFormData);
  const [activeFormTab, setActiveFormTab] = useState("basic");

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

  const handleDeleteCourse = (courseId: string) => {
    if (confirm("Tem certeza que deseja excluir este curso?")) {
      setCourses(prev => prev.filter(course => course.id !== courseId));
    }
  };

  const handleDuplicateCourse = (course: Course) => {
    const duplicated = {
      ...course,
      id: Date.now(),
      title: `${course.title} (Cópia)`,
      slug: `${course.slug}-copy`,
      status: 'draft'
    };
    setCourses(prev => [...prev, duplicated]);
  };

  const handleSaveCourse = () => {
    if (editingCourse) {
      // Editar curso existente
      setCourses(prev => prev.map(course => 
        course.id === editingCourse.id ? { ...formData as Course, status: 'published' } : course
      ));
    } else {
      // Criar novo curso
      const newCourse = {
        ...(formData as Course),
        id: Date.now().toString(),
        status: 'draft'
      };
      setCourses(prev => [...prev, newCourse]);
    }
    setShowForm(false);
  };

  const updateFormData = (field: keyof CourseFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addArrayItem = (field: keyof CourseFormData, item: string) => {
    if (item.trim()) {
      updateFormData(field, [...(formData[field] as string[]), item.trim()]);
    }
  };

  const removeArrayItem = (field: keyof CourseFormData, index: number) => {
    updateFormData(field, (formData[field] as string[]).filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-blue-600">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl">Gerenciar Cursos</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {courses.length} cursos • {courses.filter(c => c.status === 'published').length} publicados
                </p>
              </div>
            </div>
            <Button onClick={handleCreateCourse} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Novo Curso
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {!showForm ? (
            <div className="h-full flex flex-col">
              {/* Filtros */}
              <div className="p-6 pb-4 border-b">
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
                      {areaOptions.map(area => (
                        <SelectItem key={area} value={area}>{area}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Lista de Cursos */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  {filteredCourses.map((course) => (
                    <Card key={course.id} className="p-6 hover:shadow-lg transition-shadow">
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
                            {course.company && (
                              <Badge variant="outline" className="text-xs">
                                {course.company}
                              </Badge>
                            )}
                            {course.course_type && (
                              <Badge variant="outline" className="text-xs">
                                {course.course_type}
                              </Badge>
                            )}
                            {(course.area || course.segment) && (
                              <Badge variant="outline" className="text-xs">
                                {course.area || course.segment}
                              </Badge>
                            )}
                            {course.modality.slice(0, 3).map(mod => (
                              <Badge key={mod} variant="secondary" className="text-xs">
                                {mod}
                              </Badge>
                            ))}
                          </div>

                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {course.duration_hours}h
                            </span>
                            <span className="flex items-center gap-1">
                              <GraduationCap className="w-3 h-3" />
                              {course.level}
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
                            onClick={() => handleEditCourse(course)}
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDuplicateCourse(course)}
                            title="Duplicar"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteCourse(course.id)}
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
            <div className="h-full flex flex-col">
              <div className="p-6 pb-4 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    {editingCourse ? 'Editar Curso' : 'Novo Curso'}
                  </h3>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowForm(false)}>
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                    <Button onClick={handleSaveCourse}>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <Tabs value={activeFormTab} onValueChange={setActiveFormTab}>
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="basic" className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Básico
                    </TabsTrigger>
                    <TabsTrigger value="content" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Conteúdo
                    </TabsTrigger>
                    <TabsTrigger value="details" className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Detalhes
                    </TabsTrigger>
                    <TabsTrigger value="config" className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Configuração
                    </TabsTrigger>
                  </TabsList>

                  {/* Aba Básico */}
                  <TabsContent value="basic" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="title">Título do Curso *</Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => updateFormData('title', e.target.value)}
                          placeholder="Ex: Nova Lei de Licitações"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="slug">Slug (URL) *</Label>
                        <Input
                          id="slug"
                          value={formData.slug}
                          onChange={(e) => updateFormData('slug', e.target.value)}
                          placeholder="nova-lei-licitacoes"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="area">Área *</Label>
                        <Select value={formData.area} onValueChange={(value) => updateFormData('area', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {areaOptions.map(area => (
                              <SelectItem key={area} value={area}>{area}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="level">Nível *</Label>
                        <Select value={formData.level} onValueChange={(value) => updateFormData('level', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {levelOptions.map(level => (
                              <SelectItem key={level} value={level}>{level}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="duration">Carga Horária (horas) *</Label>
                        <Input
                          id="duration"
                          type="number"
                          value={formData.duration_hours}
                          onChange={(e) => updateFormData('duration_hours', parseInt(e.target.value))}
                          placeholder="8"
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label htmlFor="summary">Resumo Executivo *</Label>
                      <Textarea
                        id="summary"
                        value={formData.summary}
                        onChange={(e) => updateFormData('summary', e.target.value)}
                        placeholder="Descrição breve e atrativa do curso..."
                        rows={3}
                      />
                    </div>
                  </TabsContent>

                  {/* Aba Conteúdo */}
                  <TabsContent value="content" className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="description">Descrição Detalhada *</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => updateFormData('description', e.target.value)}
                        placeholder="Módulo 1: ... | Módulo 2: ... | Módulo 3: ..."
                        rows={6}
                      />
                    </div>

                    {/* Tags */}
                    <div className="space-y-2">
                      <Label>Tags</Label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {formData.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1">
                            {tag}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 p-0 hover:bg-transparent"
                              onClick={() => removeArrayItem('tags', index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Nova tag..."
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              addArrayItem('tags', e.currentTarget.value);
                              e.currentTarget.value = '';
                            }
                          }}
                        />
                      </div>
                    </div>

                    {/* Modalidades */}
                    <div className="space-y-2">
                      <Label>Modalidades</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {modalityOptions.map(modality => (
                          <label key={modality} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.modality.includes(modality)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  updateFormData('modality', [...formData.modality, modality]);
                                } else {
                                  updateFormData('modality', formData.modality.filter(m => m !== modality));
                                }
                              }}
                              className="rounded"
                            />
                            <span className="text-sm">{modality}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  {/* Aba Detalhes */}
                  <TabsContent value="details" className="space-y-6">
                    {/* Público-alvo */}
                    <div className="space-y-2">
                      <Label>Público-alvo</Label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {formData.target_audience.map((item, index) => (
                          <Badge key={index} variant="outline" className="flex items-center gap-1">
                            {item}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 p-0 hover:bg-transparent"
                              onClick={() => removeArrayItem('target_audience', index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                      <Input
                        placeholder="Ex: Gestores públicos..."
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addArrayItem('target_audience', e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                    </div>

                    {/* Deliverables */}
                    <div className="space-y-2">
                      <Label>Principais Benefícios</Label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {formData.deliverables.map((item, index) => (
                          <Badge key={index} variant="outline" className="flex items-center gap-1">
                            {item}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 p-0 hover:bg-transparent"
                              onClick={() => removeArrayItem('deliverables', index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                      <Input
                        placeholder="Ex: Certificado digital..."
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addArrayItem('deliverables', e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                    </div>
                  </TabsContent>

                  {/* Aba Configuração */}
                  <TabsContent value="config" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="landing_url">URL Landing Page</Label>
                        <Input
                          id="landing_url"
                          value={formData.links.landing}
                          onChange={(e) => updateFormData('links', { ...formData.links, landing: e.target.value })}
                          placeholder="https://jml.com.br/cursos/..."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="pdf_url">URL do PDF</Label>
                        <Input
                          id="pdf_url"
                          value={formData.links.pdf}
                          onChange={(e) => updateFormData('links', { ...formData.links, pdf: e.target.value })}
                          placeholder="https://jml.com.br/ementas/..."
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

