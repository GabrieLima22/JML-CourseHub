import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Save, Settings2, Plus, Trash2, Type, AlignLeft, Hash, Box, Eye,
  Brain, Users, DollarSign, Gift, Settings, Edit, CheckCircle, Video, Globe, Building2, Laptop, Calendar, MapPin, Presentation, BookOpenCheck, ListChecks, CheckSquare, FileText, Monitor, Smartphone, Copy, Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { apiGet, apiPatch } from "@/services/api";

// --- Tipos ---

type FieldType = "text" | "textarea" | "number" | "date" | "select" | "boolean";

interface FormFieldSchema {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
  width?: "full" | "half";
  helpText?: string;
  visibility?: {
    card?: boolean;
    page?: boolean;
  };
  tab?: 'basic' | 'content' | 'speakers' | 'pricing' | 'delivery';
}

const DEFAULT_VISIBILITY = { card: false, page: true };

// --- Ícones e Configurações ---

const FIELD_ICONS = {
  text: Type,
  textarea: AlignLeft,
  number: Hash,
  date: Calendar,
  select: ListChecks,
  boolean: CheckSquare,
};

const FIELD_LABELS: Record<FieldType, string> = {
  text: "Texto Curto",
  textarea: "Texto Longo",
  number: "Número",
  date: "Data",
  select: "Lista de Opções",
  boolean: "Sim/Não (Switch)",
};

export function CourseBuilderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Estados
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [courseTitle, setCourseTitle] = useState("");
  const [courseData, setCourseData] = useState<any>(null);
  const [schema, setSchema] = useState<FormFieldSchema[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [activePreviewTab, setActivePreviewTab] = useState("basic");
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");

  // Carregar dados
  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const res = await apiGet(`/api/courses/${id}`);
        const course = (res as any).data || res;
        setCourseData(course);
        setCourseTitle(course?.titulo || course?.title || "");
        
        if (Array.isArray(course.custom_schema)) {
          setSchema(course.custom_schema);
        } else {
          setSchema([]);
        }
      } catch (error) {
        console.error(error);
        toast({ title: "Erro ao carregar curso", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, toast]);

  // --- Ações do Builder ---

  const addField = (type: FieldType) => {
    const field: FormFieldSchema = {
      id: `field_${Date.now()}`,
      type,
      label: `Novo ${type}`,
      required: false,
      width: "full",
      visibility: DEFAULT_VISIBILITY,
      tab: 'basic',
    };
    setSchema((prev) => [...prev, field]);
    setSelectedFieldId(field.id);
  };

  const updateField = (fieldId: string, updates: Partial<FormFieldSchema>) => {
    setSchema((prev) =>
      prev.map((field) => (field.id === fieldId ? { ...field, ...updates } : field))
    );
  };

  const removeField = (fieldId: string) => {
    setSchema((prev) => prev.filter((field) => field.id !== fieldId));
    if (selectedFieldId === fieldId) setSelectedFieldId(null);
  };

  const duplicateField = (field: FormFieldSchema) => {
    const newField = { ...field, id: `field_${Date.now()}`, label: `${field.label} (Cópia)` };
    setSchema((prev) => [...prev, newField]);
    setSelectedFieldId(newField.id);
  };

  const handleSave = async () => {
    if (!id) return;
    try {
      setSaving(true);
      await apiPatch(`/api/courses/${id}`, { custom_schema: schema });
      toast({ title: "Layout salvo", description: "O formulário do curso foi atualizado." });
    } catch (error: any) {
      console.error(error);
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const selectedField = schema.find((field) => field.id === selectedFieldId);

  const tabs = [
    { id: 'basic', label: 'Visão Geral', icon: FileText },
    { id: 'content', label: 'Conteúdo & IA', icon: Brain },
    { id: 'speakers', label: 'Palestrantes', icon: Users },
    { id: 'pricing', label: 'Preços & Datas', icon: DollarSign },
    { id: 'delivery', label: 'Entregáveis', icon: Gift }
  ];

  const renderFieldPreview = (field: FormFieldSchema) => (
    <div
      key={field.id}
      onClick={() => setSelectedFieldId(field.id)}
      className={cn(
        "group relative border-2 rounded-2xl bg-white dark:bg-[#111623] p-4 transition-all cursor-pointer",
        selectedFieldId === field.id
          ? "border-violet-500 shadow-xl ring-4 ring-violet-500/10"
          : "border-dashed border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700",
        field.width === 'half' ? 'w-1/2' : 'w-full'
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-900 dark:text-white">{field.label}</span>
          <Badge variant="secondary" className="text-[10px]">{field.type}</Badge>
        </div>
      </div>
      <div className="text-sm text-slate-500 dark:text-slate-400">
        {field.placeholder || "Campo personalizado sem descrição."}
      </div>
       {selectedFieldId === field.id && (
          <div className="absolute -right-3 -top-3 flex gap-1 animate-in zoom-in-95 duration-200">
              <Button size="icon" variant="secondary" className="h-7 w-7 rounded-full shadow-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-violet-600" onClick={(e) => { e.stopPropagation(); duplicateField(field); }}>
                  <Copy className="w-3 h-3" />
              </Button>
              <Button size="icon" variant="destructive" className="h-7 w-7 rounded-full shadow-md" onClick={(e) => { e.stopPropagation(); removeField(field.id); }}>
                  <Trash2 className="w-3 h-3" />
              </Button>
          </div>
      )}
    </div>
  );

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-gradient-to-b dark:from-[#020307] dark:via-[#060812] dark:to-[#090b14] text-slate-500">Carregando editor...</div>;

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-gradient-to-b dark:from-[#03040a] dark:via-[#060812] dark:to-[#090c15] overflow-hidden">
      {/* --- HEADER --- */}
      <header className="h-16 bg-gradient-to-r from-white via-white to-slate-100 dark:bg-gradient-to-r dark:from-[#04050c] dark:via-[#0b1020] dark:to-[#12172b] border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/courses")} className="rounded-full">
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </Button>
          <div>
            <h1 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Editor de Campos
              <Badge variant="outline" className="font-normal text-slate-500 hidden sm:inline-flex">
                {courseData?.title || "Curso sem título"}
              </Badge>
            </h1>
            <p className="text-xs text-slate-500">Personalize o formulário de edição deste curso específico.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg mr-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("desktop")}
              className={cn("h-7 px-3 text-xs rounded-md", viewMode === "desktop" ? "bg-white dark:bg-black shadow-sm" : "text-slate-500")}
            >
              <Monitor className="w-3.5 h-3.5 mr-2" /> Desktop
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("mobile")}
              className={cn("h-7 px-3 text-xs rounded-md", viewMode === "mobile" ? "bg-white dark:bg-black shadow-sm" : "text-slate-500")}
            >
              <Smartphone className="w-3.5 h-3.5 mr-2" /> Mobile
            </Button>
          </div>
          <Button onClick={handleSave} disabled={saving} className="bg-slate-900 text-white dark:bg-violet-600">
            {saving ? "Salvando..." : <><Save className="w-4 h-4 mr-2" /> Salvar Layout</>}
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        
        {/* --- LEFT SIDEBAR: TOOLBOX --- */}
        <aside className="w-[260px] bg-white dark:bg-[#070b14] border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 z-10">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">Adicionar Campo</h3>
            <p className="text-[10px] text-slate-500">Clique para incluir no formulário.</p>
          </div>
          <ScrollArea className="flex-1 p-4">
            <div className="grid grid-cols-1 gap-3">
              {(Object.keys(FIELD_LABELS) as FieldType[]).map((type) => {
                const Icon = FIELD_ICONS[type];
                return (
                  <button
                    key={type}
                    onClick={() => addField(type)}
                    className="group flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111623] hover:border-violet-500 hover:shadow-md transition-all text-left"
                  >
                    <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-violet-50 dark:group-hover:bg-violet-900/30 group-hover:text-violet-600 transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200 group-hover:text-violet-700 dark:group-hover:text-violet-400">
                        {FIELD_LABELS[type]}
                    </span>
                    <Plus className="w-4 h-4 ml-auto text-slate-300 group-hover:text-violet-500" />
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </aside>

                <main className="flex-1 bg-gradient-to-b from-slate-100/40 via-slate-100/10 to-transparent relative overflow-hidden flex flex-col items-center">

                  <div className="absolute inset-0 pointer-events-none opacity-[0.03]" 

                       style={{ backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', backgroundSize: '20px 20px' }} 

                  />

                  <ScrollArea className="flex-1 w-full h-full">

                    <div className={cn(

                      "mx-auto transition-all duration-300 ease-in-out pb-32 p-8",

                      viewMode === "mobile" ? "max-w-[420px]" : "max-w-4xl"

                    )}>

                      {/* --- RENDER CANVAS START --- */}

                      <div className="w-full max-w-full mx-auto">

                        <div className="flex items-center justify-between pb-4 mb-6 sticky top-0 bg-slate-100/80 dark:bg-[#05060c]/80 backdrop-blur-sm z-20 pt-1 shrink-0">

                            <div className="flex items-center gap-4">

                              <div>

                                  <h2 className="text-xl font-bold text-slate-900 dark:text-white line-clamp-1 flex items-center gap-2">

                                    Preview: {courseData?.title || "Novo Curso"}

                                  </h2>

                                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">

                                    Simulação do formulário de edição.

                                  </p>

                              </div>

                            </div>

                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 mb-8 shrink-0 border-b border-slate-200 dark:border-slate-800 pb-1">

                            <div className="flex flex-wrap gap-2">

                              {tabs.map(tab => {

                                  const isActive = activePreviewTab === tab.id;

                                  return (

                                    <button

                                      key={tab.id}

                                      onClick={() => setActivePreviewTab(tab.id)}

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

                        </div>

        

                        <div className="flex-1">

                            {/* Aba: Visão Geral */}

                            <div className={cn(activePreviewTab === 'basic' ? 'block' : 'hidden', "space-y-6 animate-in fade-in duration-300")}>

                                <Card className="p-6">

                                    <h3 className="font-bold mb-4">Informações Básicas</h3>

                                    <div className="space-y-4">

                                        <div className="space-y-2">

                                            <Label>Título do Curso</Label>

                                            <Input disabled value={courseData?.title || ""} />

                                        </div>

                                        <div className="space-y-2">

                                            <Label>Resumo Executivo</Label>

                                            <div className="h-20 w-full rounded-md border bg-slate-50 dark:bg-slate-800/50"/>

                                        </div>

                                    </div>

                                </Card>

                                {schema.filter(f => f.tab === 'basic').map(renderFieldPreview)}

                            </div>

                            {/* Aba: Conteúdo */}

                            <div className={cn(activePreviewTab === 'content' ? 'block' : 'hidden', "space-y-6 animate-in fade-in duration-300")}>

                                <Card className="p-6">

                                    <h3 className="font-bold mb-4">Conteúdo & IA</h3>

                                    <div className="space-y-4">

                                        <div className="space-y-2">

                                            <Label>Apresentação do Curso</Label>

                                            <div className="h-20 w-full rounded-md border bg-slate-50 dark:bg-slate-800/50"/>

                                        </div>

                                        <div className="space-y-2">

                                            <Label>Conteúdo Programático</Label>

                                            <div className="h-40 w-full rounded-md border bg-slate-50 dark:bg-slate-800/50"/>

                                        </div>

                                    </div>

                                </Card>

                                {schema.filter(f => f.tab === 'content').map(renderFieldPreview)}

                            </div>

                            {/* Outras Abas (Placeholder) */}

                            {['speakers', 'pricing', 'delivery'].map(tabId => (

                                <div key={tabId} className={cn(activePreviewTab === tabId ? 'block' : 'hidden', "space-y-6 animate-in fade-in duration-300")}>

                                    <Card className="p-6">

                                        <h3 className="font-bold mb-4">Campos de "{tabs.find(t=>t.id===tabId)?.label}"</h3>

                                        <div className="space-y-4">

                                          {schema.filter(f => f.tab === tabId).length > 0

                                            ? schema.filter(f => f.tab === tabId).map(renderFieldPreview)

                                            : <div className="text-center py-12 border-2 border-dashed rounded-lg bg-slate-50/50 dark:bg-slate-900/20"><p className="text-sm text-slate-500">Nenhum campo personalizado para esta aba.</p></div>

                                          }

                                        </div>

                                    </Card>

                                </div>

                            ))}

                        </div>

                      </div>

                    </div>

                  </ScrollArea>

                </main>

        {/* --- RIGHT SIDEBAR: PROPERTIES --- */}
        <aside className="w-[340px] bg-white dark:bg-[#09090b] border-l border-slate-200 dark:border-slate-800 flex flex-col shrink-0 z-10 shadow-xl">
          {selectedField ? (
            <>
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2 mb-1">
                    <Settings2 className="w-4 h-4 text-violet-600" />
                    <span className="text-xs font-bold text-violet-600 uppercase tracking-wider">Propriedades</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white truncate">
                  {selectedField.label}
                </h3>
              </div>

              <ScrollArea className="flex-1 p-5">
                <div className="space-y-6">
                  
                  {/* CONFIGURAÇÃO DE VISIBILIDADE (Solicitado pelo usuário) */}
                  <div className="space-y-3">
                    <Label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Visibilidade no Site</Label>
                    
                    {/* Card: Visão Detalhada */}
                    <div className={cn(
                        "flex items-center justify-between p-4 rounded-xl border transition-all",
                        selectedField.visibility?.page !== false 
                            ? "bg-violet-50 border-violet-200 dark:bg-violet-900/20 dark:border-violet-800" 
                            : "bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 opacity-70"
                    )}>
                        <div>
                            <p className={cn("text-sm font-semibold", selectedField.visibility?.page !== false ? "text-violet-900 dark:text-violet-300" : "text-slate-600 dark:text-slate-400")}>
                                Visão Detalhada
                            </p>
                            <p className={cn("text-[10px]", selectedField.visibility?.page !== false ? "text-violet-700 dark:text-violet-400" : "text-slate-500")}>
                                Sempre exibido na aba do curso.
                            </p>
                        </div>
                        <Switch 
                            checked={selectedField.visibility?.page !== false}
                            onCheckedChange={(checked) => updateField(selectedField.id, { visibility: { ...selectedField.visibility, page: checked } })}
                            className="data-[state=checked]:bg-violet-600"
                        />
                    </div>

                    {/* Card: Visão Breve */}
                    <div className={cn(
                        "flex items-center justify-between p-4 rounded-xl border transition-all",
                        selectedField.visibility?.card 
                            ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800" 
                            : "bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 opacity-70"
                    )}>
                        <div>
                            <p className={cn("text-sm font-semibold", selectedField.visibility?.card ? "text-emerald-900 dark:text-emerald-300" : "text-slate-600 dark:text-slate-400")}>
                                Visão Breve
                            </p>
                            <p className={cn("text-[10px]", selectedField.visibility?.card ? "text-emerald-700 dark:text-emerald-400" : "text-slate-500")}>
                                Aparece no card/preview do site.
                            </p>
                        </div>
                        <Switch 
                            checked={!!selectedField.visibility?.card}
                            onCheckedChange={(checked) => updateField(selectedField.id, { visibility: { ...selectedField.visibility, card: checked } })}
                            className="data-[state=checked]:bg-emerald-600"
                        />
                    </div>
                  </div>

                  <Separator />

                  {/* Grupo: Geral */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-xs text-slate-500 font-bold uppercase">Rótulo do Campo</Label>
                        <Input 
                            value={selectedField.label} 
                            onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
                            className="bg-white dark:bg-slate-900"
                        />
                    </div>
                    
                    {["text", "textarea", "number"].includes(selectedField.type) && (
                        <div className="space-y-2">
                            <Label className="text-xs text-slate-500 font-bold uppercase">Texto de Exemplo (Placeholder)</Label>
                            <Input 
                                value={selectedField.placeholder || ""} 
                                onChange={(e) => updateField(selectedField.id, { placeholder: e.target.value })}
                                className="bg-white dark:bg-slate-900"
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label className="text-xs text-slate-500 font-bold uppercase">Texto de Ajuda</Label>
                        <Input 
                            value={selectedField.helpText || ""} 
                            onChange={(e) => updateField(selectedField.id, { helpText: e.target.value })}
                            className="bg-white dark:bg-slate-900"
                        />
                    </div>
                  </div>

                  <Separator />

                  {/* Grupo: Configuração */}
                  <div className="space-y-4">
                     <Label className="text-xs text-slate-500 font-bold uppercase">Configurações</Label>
                     
                     <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium" htmlFor="req-switch">Obrigatório</Label>
                        <Switch 
                            id="req-switch"
                            checked={selectedField.required}
                            onCheckedChange={(checked) => updateField(selectedField.id, { required: checked })}
                        />
                     </div>

                  <div className="space-y-3">
                    <Label className="text-xs font-semibold text-slate-500 uppercase">Largura</Label>
                    <Select
                      value={selectedField.width || "full"}
                      onValueChange={(value) => updateField(selectedField.id, { width: value as "full" | "half" })}
                    >
                      <SelectTrigger className="bg-slate-50 dark:bg-[#111629] border-slate-200 dark:border-slate-800">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">100% (linha inteira)</SelectItem>
                        <SelectItem value="half">50% (lado a lado)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs font-semibold text-slate-500 uppercase">Aba de Destino</Label>
                    <Select
                      value={selectedField.tab || "basic"}
                      onValueChange={(value) => updateField(selectedField.id, { tab: value as any })}
                    >
                      <SelectTrigger className="bg-slate-50 dark:bg-[#111629] border-slate-200 dark:border-slate-800">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Visão Geral</SelectItem>
                        <SelectItem value="content">Conteúdo & IA</SelectItem>
                        <SelectItem value="speakers">Palestrantes</SelectItem>
                        <SelectItem value="pricing">Preços & Datas</SelectItem>
                        <SelectItem value="delivery">Entregáveis</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                    {selectedField.type === "select" && (
                        <div className="space-y-2">
                        <Label className="text-xs text-slate-500">Opções do Menu</Label>
                        <textarea
                            className="flex min-h-[100px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-50"
                            placeholder="Uma opção por linha..."
                            value={(selectedField.options || []).join("\n")}
                            onChange={(e) => updateField(selectedField.id, { options: e.target.value.split("\n") })}
                        />
                        </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-400">
                <Settings2 className="w-12 h-12 mb-4 text-slate-200 dark:text-slate-800" />
                <p className="text-sm font-medium text-slate-900 dark:text-slate-200">Nenhum campo selecionado</p>
                <p className="text-xs mt-1">Clique em um campo personalizado no centro para editar.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
