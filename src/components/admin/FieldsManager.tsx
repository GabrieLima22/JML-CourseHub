import { useEffect, useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Type,
  AlignLeft,
  Hash,
  Calendar,
  List,
  CheckSquare,
  Settings2,
  Eye,
  Save,
  GripVertical,
  FileText,
  Users,
  DollarSign,
  Gift,
  ArrowLeft,
  Trash2,
  Plus,
  MonitorPlay,
  CreditCard,
  Lock,
  LayoutTemplate,
  Pencil
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useCustomFields, useSaveCustomFields } from "@/hooks/useCustomFields";

// --- TIPOS ---
type FieldType = 'text' | 'textarea' | 'number' | 'date' | 'select' | 'boolean' | 'system';

interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  section: 'basic' | 'content' | 'speakers' | 'pricing' | 'delivery'; // Abas do CourseEditForm
  isSystem?: boolean; // Se true, não pode deletar nem mudar ID (campos base)
  options?: string[]; // Para selects
  visibility: {
    admin: boolean; // Visível no formulário de edição?
    drawerBrief: boolean; // Visível na aba "Breve" do Drawer?
    drawerDetailed: boolean; // Visível na aba "Detalhada" do Drawer?
  };
  width?: 'full' | 'half'; // Layout Grid
}

// --- CONFIGURAÇÃO INICIAL (BASEADO NO SEU ADMIN DASHBOARD) ---
const INITIAL_SCHEMA: FormField[] = [
  // SEÇÃO: BÁSICO
  { id: 'title', type: 'text', label: 'Título do Curso', placeholder: 'Ex: Nova Lei de Licitações', required: true, section: 'basic', isSystem: true, width: 'full', visibility: { admin: true, drawerBrief: true, drawerDetailed: true } },
  { id: 'empresa', type: 'select', label: 'Empresa Responsável', options: ['JML', 'Conecta'], required: true, section: 'basic', isSystem: true, width: 'half', visibility: { admin: true, drawerBrief: true, drawerDetailed: true } },
  { id: 'duration_hours', type: 'number', label: 'Carga Horária (h)', placeholder: '0', required: true, section: 'basic', isSystem: true, width: 'half', visibility: { admin: true, drawerBrief: true, drawerDetailed: true } },
  { id: 'summary', type: 'textarea', label: 'Resumo Executivo', placeholder: 'Breve descrição...', required: true, section: 'basic', isSystem: true, width: 'full', visibility: { admin: true, drawerBrief: true, drawerDetailed: true } },
  { id: 'target_audience', type: 'textarea', label: 'Público-Alvo', placeholder: 'Quem deve fazer este curso...', required: false, section: 'basic', isSystem: true, width: 'full', visibility: { admin: true, drawerBrief: false, drawerDetailed: true } },
  
  // SEÇÃO: CONTEÚDO
  { id: 'apresentacao', type: 'textarea', label: 'Apresentação do Curso', required: false, section: 'content', isSystem: true, width: 'full', visibility: { admin: true, drawerBrief: true, drawerDetailed: true } },
  { id: 'description', type: 'textarea', label: 'Conteúdo Programático', required: false, section: 'content', isSystem: true, width: 'full', visibility: { admin: true, drawerBrief: false, drawerDetailed: true } },
  
  // SEÇÃO: PREÇOS
  { id: 'data_inicio', type: 'date', label: 'Início', required: false, section: 'pricing', isSystem: true, width: 'half', visibility: { admin: true, drawerBrief: true, drawerDetailed: true } },
  { id: 'data_fim', type: 'date', label: 'Término', required: false, section: 'pricing', isSystem: true, width: 'half', visibility: { admin: true, drawerBrief: true, drawerDetailed: true } },
  { id: 'local', type: 'text', label: 'Local', placeholder: 'Ex: Auditório JML', required: false, section: 'pricing', isSystem: true, width: 'full', visibility: { admin: true, drawerBrief: true, drawerDetailed: true } },
  
  // SEÇÃO: ENTREGÁVEIS
  { id: 'deliverables', type: 'textarea', label: 'Lista de Entregáveis', placeholder: 'Um por linha...', required: false, section: 'delivery', isSystem: true, width: 'full', visibility: { admin: true, drawerBrief: false, drawerDetailed: true } },
];

export function FieldBuilder({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: serverFields } = useCustomFields(); // Se você estiver salvando custom fields separadamente
  const { mutateAsync: saveFields, isPending } = useSaveCustomFields();
  
  const [schema, setSchema] = useState<FormField[]>(INITIAL_SCHEMA);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>('title');
  const [activeTab, setActiveTab] = useState<'basic' | 'content' | 'speakers' | 'pricing' | 'delivery'>('basic');

  // Mesclar campos do servidor com o schema inicial (Lógica Simplificada para Demo)
  // Em produção, você salvaria o SCHEMA INTEIRO no banco, não apenas os custom fields.
  useEffect(() => {
    if (serverFields && serverFields.length > 0) {
       // Lógica para mergear campos customizados salvos anteriormente
       const customMapped: FormField[] = serverFields.map((sf: any) => ({
          id: sf.id,
          type: sf.type,
          label: sf.label,
          placeholder: sf.placeholder,
          required: sf.required,
          section: 'basic', // Default fallback
          isSystem: false,
          width: 'full',
          visibility: {
             admin: true,
             drawerBrief: sf.visibility?.card || false,
             drawerDetailed: sf.visibility?.page || true
          }
       }));
       
       // Adiciona apenas se não existirem (evita duplicatas na demo)
       setSchema(prev => {
          const systemFields = prev.filter(f => f.isSystem);
          return [...systemFields, ...customMapped];
       });
    }
  }, [serverFields]);

  const selectedField = schema.find(f => f.id === selectedFieldId);

  // --- AÇÕES ---

  const addField = (type: FieldType) => {
    const newField: FormField = {
      id: `custom_${Date.now()}`,
      type,
      label: 'Novo Campo',
      placeholder: '',
      required: false,
      section: activeTab, // Adiciona na aba que o usuário está vendo!
      isSystem: false,
      width: 'full',
      visibility: { admin: true, drawerBrief: false, drawerDetailed: true }
    };
    setSchema([...schema, newField]);
    setSelectedFieldId(newField.id);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setSchema(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const removeField = (id: string) => {
    setSchema(prev => prev.filter(f => f.id !== id));
    if (selectedFieldId === id) setSelectedFieldId(null);
  };

  // --- RENDERIZADORES DO PREVIEW ---

  const renderPreviewField = (field: FormField) => {
    const isSelected = selectedFieldId === field.id;
    
    return (
      <div 
        key={field.id}
        onClick={(e) => { e.stopPropagation(); setSelectedFieldId(field.id); }}
        className={cn(
          "relative group p-4 rounded-xl border-2 transition-all cursor-pointer bg-white dark:bg-[#151b2b]",
          isSelected 
            ? "border-violet-500 ring-4 ring-violet-500/10 shadow-lg z-10" 
            : "border-transparent hover:border-violet-200 dark:hover:border-violet-800 hover:shadow-md"
        )}
        style={{ gridColumn: field.width === 'full' ? 'span 2' : 'span 1' }}
      >
        {/* Badges de Visibilidade (Flutuantes) */}
        <div className="absolute -top-3 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-all scale-90">
            {field.visibility.drawerBrief && <Badge className="h-5 bg-emerald-500 text-[9px] px-1">Breve</Badge>}
            {field.visibility.drawerDetailed && <Badge className="h-5 bg-blue-500 text-[9px] px-1">Detalhada</Badge>}
            {!field.visibility.admin && <Badge variant="destructive" className="h-5 text-[9px] px-1">Oculto Admin</Badge>}
        </div>

        {/* Botão Deletar (Só para Custom) */}
        {!field.isSystem && isSelected && (
           <Button 
              size="icon" 
              variant="destructive" 
              className="absolute -right-2 -top-2 h-6 w-6 rounded-full shadow-lg z-20"
              onClick={(e) => { e.stopPropagation(); removeField(field.id); }}
           >
              <Trash2 className="w-3 h-3" />
           </Button>
        )}

        <div className="space-y-2 pointer-events-none">
           <Label className={cn("text-sm font-medium flex items-center gap-2", isSelected ? "text-violet-600 dark:text-violet-400" : "text-slate-700 dark:text-slate-300")}>
              {field.isSystem && <Lock className="w-3 h-3 opacity-50" />}
              {field.label}
              {field.required && <span className="text-red-500">*</span>}
              {!field.isSystem && <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-50" />}
           </Label>

           {/* Simulação Visual dos Inputs */}
           {field.type === 'text' && <Input disabled placeholder={field.placeholder} className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800" />}
           {field.type === 'number' && <Input disabled type="number" placeholder="0" className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800" />}
           {field.type === 'date' && <Input disabled type="date" className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800" />}
           {(field.type === 'textarea') && <div className="h-24 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-3 text-sm text-muted-foreground">{field.placeholder}</div>}
           {field.type === 'select' && (
              <div className="h-10 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between px-3 text-sm text-muted-foreground">
                 <span>Selecione...</span>
                 <List className="w-4 h-4 opacity-50" />
              </div>
           )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-[1600px] w-[98vw] h-[95vh] p-0 gap-0 border-0 flex flex-col sm:rounded-3xl bg-white dark:bg-[#09090b] overflow-hidden shadow-2xl">
        
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#09090b] shrink-0">
          <div className="space-y-1">
            <DialogTitle className="text-xl font-bold flex items-center gap-3">
               Gerenciador de Formulários
               <Badge variant="outline" className="font-normal text-xs bg-violet-50 text-violet-700 border-violet-200">
                  Modo Avançado
               </Badge>
            </DialogTitle>
            <p className="text-xs text-slate-500">Defina a estrutura exata do formulário de administração e a visualização do aluno.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-violet-600" onClick={() => { toast({title: "Layout Salvo!"}); onClose(); }}>
              <Save className="w-4 h-4 mr-2" /> Salvar Estrutura
            </Button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          
          {/* ESQUERDA: TOOLBOX (Menor) */}
          <div className="w-[80px] lg:w-[240px] bg-slate-50 dark:bg-[#0c0f16] border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0">
            <div className="p-4 lg:p-5">
               <h3 className="hidden lg:block text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-4">Adicionar</h3>
               <div className="grid grid-cols-1 gap-2">
                  {[
                    { type: 'text', label: 'Texto', icon: Type },
                    { type: 'textarea', label: 'Área', icon: AlignLeft },
                    { type: 'number', label: 'Número', icon: Hash },
                    { type: 'date', label: 'Data', icon: Calendar },
                    { type: 'select', label: 'Lista', icon: List },
                  ].map((tool) => (
                    <button
                      key={tool.type}
                      onClick={() => addField(tool.type as FieldType)}
                      className="group flex lg:justify-start justify-center items-center gap-3 p-3 rounded-xl bg-white dark:bg-[#111623] border border-slate-200 dark:border-slate-800 hover:border-violet-500 hover:shadow-md transition-all"
                    >
                      <tool.icon className="w-5 h-5 text-slate-500 group-hover:text-violet-600" />
                      <span className="hidden lg:block text-sm font-medium text-slate-700 dark:text-slate-200">{tool.label}</span>
                    </button>
                  ))}
               </div>
            </div>
            
            <div className="mt-auto p-5 hidden lg:block">
               <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-xl p-3 text-xs text-blue-700 dark:text-blue-300">
                  Os campos adicionados irão automaticamente para a aba ativa no centro.
               </div>
            </div>
          </div>

          {/* CENTRO: PREVIEW FIEL (WYSIWYG) */}
          <div className="flex-1 bg-slate-100/50 dark:bg-black overflow-y-auto relative custom-scrollbar flex flex-col">
             
             {/* Header Falso (Identico ao Dashboard) */}
             <div className="sticky top-0 z-20 bg-slate-50/95 dark:bg-[#0B0F19]/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 px-8 py-4 flex justify-between items-center opacity-80 pointer-events-none grayscale">
                <div className="flex items-center gap-4">
                   <div className="rounded-full w-10 h-10 border bg-white flex items-center justify-center"><ArrowLeft className="w-5 h-5 text-slate-400" /></div>
                   <div>
                      <h2 className="text-xl font-bold">Editando Curso...</h2>
                      <div className="w-20 h-4 bg-slate-200 rounded mt-1" />
                   </div>
                </div>
                <div className="flex gap-2">
                    <div className="w-24 h-10 bg-slate-200 rounded" />
                    <div className="w-32 h-10 bg-slate-800 rounded" />
                </div>
             </div>

             <div className="p-8 max-w-5xl mx-auto w-full pb-32">
                
                {/* ABAS (INTERATIVAS NO BUILDER) */}
                <div className="flex flex-wrap gap-2 mb-8 border-b border-slate-200 dark:border-slate-800 pb-1">
                  {[
                    { id: 'basic', label: 'Visão Geral', icon: FileText },
                    { id: 'content', label: 'Conteúdo & IA', icon: MonitorPlay },
                    { id: 'speakers', label: 'Palestrantes', icon: Users },
                    { id: 'pricing', label: 'Preços & Datas', icon: DollarSign },
                    { id: 'delivery', label: 'Entregáveis', icon: Gift }
                  ].map(tab => (
                     <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={cn(
                           "flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all rounded-t-lg border-b-2",
                           activeTab === tab.id
                             ? "border-violet-600 text-violet-700 dark:text-violet-400 bg-violet-50/50 dark:bg-violet-900/10"
                             : "border-transparent text-slate-500 hover:text-slate-800"
                        )}
                     >
                        <tab.icon className="w-4 h-4" /> {tab.label}
                     </button>
                  ))}
                </div>

                {/* RENDERIZAÇÃO DOS CAMPOS DA ABA ATIVA */}
                <div className="space-y-6">
                    {/* Se não houver campos nesta aba */}
                    {schema.filter(f => f.section === activeTab).length === 0 && (
                        <div className="py-20 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                            <p className="text-slate-400">Esta aba está vazia.</p>
                            <Button variant="link" onClick={() => addField('text')}>+ Adicionar Campo Aqui</Button>
                        </div>
                    )}

                    {/* GRUPO DE CARDS (Simulando layout do admin) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 auto-rows-max">
                       {schema
                          .filter(f => f.section === activeTab)
                          .map(field => renderPreviewField(field))
                       }
                    </div>

                    {/* DICA VISUAL */}
                    <div className="mt-8 p-4 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg flex items-center justify-center gap-2 text-slate-400 text-sm">
                        <Plus className="w-4 h-4" />
                        Novos campos adicionados aparecerão aqui nesta aba.
                    </div>
                </div>

             </div>
          </div>

          {/* DIREITA: PROPRIEDADES AVANÇADAS */}
          <div className="w-[350px] bg-white dark:bg-[#09090b] border-l border-slate-200 dark:border-slate-800 flex flex-col shrink-0 z-30 shadow-2xl">
             {selectedField ? (
                <div className="flex flex-col h-full animate-in slide-in-from-right duration-300">
                   {/* Header Propriedades */}
                   <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-[#0c0f16]">
                      <div className="flex items-center justify-between mb-2">
                         <div className="flex items-center gap-2">
                             <Settings2 className="w-4 h-4 text-violet-500" />
                             <h4 className="font-bold text-slate-900 dark:text-white">Propriedades</h4>
                         </div>
                         {selectedField.isSystem && <Badge variant="secondary" className="text-[10px]">Sistema</Badge>}
                      </div>
                      <div className="relative">
                         <Input 
                            value={selectedField.label} 
                            onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
                            className="font-bold text-lg bg-transparent border-none px-0 shadow-none focus-visible:ring-0 text-violet-600 placeholder:text-slate-300"
                            placeholder="Nome do Campo"
                         />
                         <Pencil className="w-3 h-3 text-slate-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                   </div>
                   
                   <ScrollArea className="flex-1">
                      <div className="p-6 space-y-8">
                         
                         {/* Configurações Básicas */}
                         <div className="space-y-4">
                            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><LayoutTemplate className="w-3 h-3"/> Layout</h5>
                            
                            <div className="grid grid-cols-2 gap-3">
                               <div className="space-y-1.5">
                                  <Label className="text-xs">Largura</Label>
                                  <Select value={selectedField.width} onValueChange={(v: any) => updateField(selectedField.id, { width: v })}>
                                     <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                     <SelectContent>
                                        <SelectItem value="full">100% (Full)</SelectItem>
                                        <SelectItem value="half">50% (Metade)</SelectItem>
                                     </SelectContent>
                                  </Select>
                               </div>
                               <div className="space-y-1.5">
                                  <Label className="text-xs">Aba / Seção</Label>
                                  <Select value={selectedField.section} onValueChange={(v: any) => updateField(selectedField.id, { section: v })}>
                                     <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                     <SelectContent>
                                        <SelectItem value="basic">Visão Geral</SelectItem>
                                        <SelectItem value="content">Conteúdo</SelectItem>
                                        <SelectItem value="speakers">Palestrantes</SelectItem>
                                        <SelectItem value="pricing">Preços</SelectItem>
                                        <SelectItem value="delivery">Entregáveis</SelectItem>
                                     </SelectContent>
                                  </Select>
                               </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs">Placeholder (Texto de ajuda)</Label>
                                <Input 
                                    value={selectedField.placeholder || ''} 
                                    onChange={(e) => updateField(selectedField.id, { placeholder: e.target.value })}
                                    className="h-8 text-xs bg-slate-50"
                                    placeholder="Ex: Digite aqui..."
                                />
                            </div>
                         </div>

                         <Separator />

                         {/* MATRIZ DE VISIBILIDADE (O PULO DO GATO) */}
                         <div className="space-y-4">
                            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Eye className="w-3 h-3"/> Visibilidade & Uso</h5>
                            
                            <div className="bg-slate-50 dark:bg-[#111623] rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                               {/* Admin */}
                               <div className="flex items-center justify-between p-3 border-b border-slate-100 dark:border-slate-800">
                                  <div className="flex items-center gap-2">
                                     <Settings2 className="w-4 h-4 text-slate-500" />
                                     <div>
                                        <p className="text-xs font-semibold">Admin Editor</p>
                                        <p className="text-[10px] text-slate-400">Visível ao criar curso?</p>
                                     </div>
                                  </div>
                                  <Switch 
                                     checked={selectedField.visibility.admin} 
                                     onCheckedChange={(c) => updateField(selectedField.id, { visibility: { ...selectedField.visibility, admin: c } })}
                                     className="scale-75"
                                  />
                               </div>

                               {/* Drawer Breve */}
                               <div className="flex items-center justify-between p-3 border-b border-slate-100 dark:border-slate-800">
                                  <div className="flex items-center gap-2">
                                     <CreditCard className="w-4 h-4 text-emerald-500" />
                                     <div>
                                        <p className="text-xs font-semibold">Portal: Visão Breve</p>
                                        <p className="text-[10px] text-slate-400">Aparece no resumo?</p>
                                     </div>
                                  </div>
                                  <Switch 
                                     checked={selectedField.visibility.drawerBrief} 
                                     onCheckedChange={(c) => updateField(selectedField.id, { visibility: { ...selectedField.visibility, drawerBrief: c } })}
                                     className="scale-75 data-[state=checked]:bg-emerald-500"
                                  />
                               </div>

                               {/* Drawer Detalhada */}
                               <div className="flex items-center justify-between p-3">
                                  <div className="flex items-center gap-2">
                                     <FileText className="w-4 h-4 text-blue-500" />
                                     <div>
                                        <p className="text-xs font-semibold">Portal: Detalhada</p>
                                        <p className="text-[10px] text-slate-400">Aparece na aba completa?</p>
                                     </div>
                                  </div>
                                  <Switch 
                                     checked={selectedField.visibility.drawerDetailed} 
                                     onCheckedChange={(c) => updateField(selectedField.id, { visibility: { ...selectedField.visibility, drawerDetailed: c } })}
                                     className="scale-75 data-[state=checked]:bg-blue-500"
                                  />
                               </div>
                            </div>
                         </div>

                         <Separator />

                         <div className="flex items-center justify-between">
                            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Campo Obrigatório?</Label>
                            <Switch 
                               checked={selectedField.required} 
                               onCheckedChange={(c) => updateField(selectedField.id, { required: c })}
                            />
                         </div>

                         {/* Se for Select */}
                         {selectedField.type === 'select' && (
                            <div className="space-y-2 pt-4 border-t border-dashed border-slate-200">
                               <Label className="text-xs font-bold text-slate-500">Opções (uma por linha)</Label>
                               <textarea 
                                  className="w-full min-h-[100px] rounded-lg border border-slate-200 p-3 text-xs bg-slate-50 focus:ring-2 focus:ring-violet-500 focus:outline-none"
                                  value={selectedField.options?.join('\n')}
                                  onChange={(e) => updateField(selectedField.id, { options: e.target.value.split('\n') })}
                               />
                            </div>
                         )}
                      </div>
                   </ScrollArea>
                </div>
             ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-slate-50/30">
                   <Settings2 className="w-12 h-12 opacity-10 mb-2" />
                   <p className="text-sm">Selecione um campo no centro para editar.</p>
                </div>
             )}
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}