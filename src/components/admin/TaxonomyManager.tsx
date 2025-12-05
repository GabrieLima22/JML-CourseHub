import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { TaxonomyData, TaxonomyOption, useSaveTaxonomies, useTaxonomies } from "@/hooks/useTaxonomies";
import { 
  Loader2, 
  Plus, 
  Sparkles, 
  Trash2, 
  Building2, 
  Target, 
  Layers, 
  Tag, 
  Search, 
  Check,
  LayoutGrid,
  X,
  ArrowRight,
  Palette
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

type TaxonomyManagerProps = {
  open: boolean;
  onClose: () => void;
};

type DraftState = TaxonomyData;

const DEFAULT_STATE: DraftState = {
  companies: [],
  courseTypes: [],
  segments: [],
  audiences: [],
  levels: [],
  tags: [],
};

// Cores pré-definidas para manter a consistência visual do sistema
const PRESET_COLORS = [
  "#64748b", // Slate
  "#ef4444", // Red
  "#f97316", // Orange
  "#eab308", // Yellow
  "#22c55e", // Green
  "#06b6d4", // Cyan
  "#3b82f6", // Blue
  "#6366f1", // Indigo
  "#8b5cf6", // Violet
  "#d946ef", // Fuchsia
  "#f43f5e", // Rose
  "#111827", // Black/Gray
];

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

// --- Card Visual Melhorado ---
const OptionCard = ({
  option,
  onDelete,
}: {
  option: TaxonomyOption;
  onDelete: () => void;
}) => (
  <div className="group relative flex flex-col gap-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-violet-200 dark:hover:border-violet-800/50 overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-violet-50/50 dark:to-violet-900/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

    <div className="absolute right-2 top-2 opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 z-10">
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={(e) => { e.stopPropagation(); onDelete(); }} 
        className="h-8 w-8 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
    
    <div className="flex items-center gap-4 relative z-0">
      <div 
        className="h-12 w-12 rounded-xl flex items-center justify-center text-lg font-bold shadow-inner ring-1 ring-inset ring-black/5 dark:ring-white/10 transition-colors"
        style={{ 
          background: option.color ? `linear-gradient(135deg, ${option.color}20, ${option.color}05)` : 'linear-gradient(135deg, #f4f4f5, #ffffff)',
          color: option.color || '#71717a',
        }}
      >
        {option.label.charAt(0).toUpperCase()}
      </div>
      <div className="flex flex-col min-w-0">
        <span className="font-bold text-base text-zinc-900 dark:text-zinc-100 leading-tight truncate pr-6">{option.label}</span>
        <span className="text-[10px] text-zinc-400 font-mono mt-0.5 truncate bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-md w-fit">
            #{option.id}
        </span>
      </div>
    </div>
    
    <div className="mt-auto pt-2 relative z-0">
       <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
         {option.description || <span className="italic opacity-40">Sem descrição definida.</span>}
       </p>
    </div>
  </div>
);

export function TaxonomyManager({ open, onClose }: TaxonomyManagerProps) {
  const { data, isLoading } = useTaxonomies();
  const { mutateAsync: saveTaxonomies, isPending } = useSaveTaxonomies();
  const [draft, setDraft] = useState<DraftState>(DEFAULT_STATE);
  const [activeTab, setActiveTab] = useState("companies");

  const [searchFilter, setSearchFilter] = useState("");
  const [newOption, setNewOption] = useState({
    label: "",
    description: "",
    color: "#6366f1", // Cor padrão (Indigo)
  });
  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    if (data) {
      setDraft({
        companies: data.companies ?? [],
        courseTypes: data.courseTypes ?? [],
        segments: data.segments ?? [],
        audiences: data.audiences ?? [],
        levels: data.levels ?? [],
        tags: data.tags ?? [],
      });
    }
  }, [data]);

  const tabs = useMemo(
    () => [
      { id: "companies", title: "Empresas", icon: Building2, desc: "Marcas e Identidade" },
      { id: "courseTypes", title: "Tipos", icon: Target, desc: "Modalidades de Ensino" },
      { id: "segments", title: "Segmentos", icon: Layers, desc: "Áreas de Conhecimento" },
      { id: "tags", title: "Tags Globais", icon: Tag, desc: "Etiquetas do Sistema" },
    ],
    []
  );

  const activeTabData = tabs.find(t => t.id === activeTab);

  const handleAddOption = () => {
    const label = newOption.label.trim();
    if (!label) {
      toast({ title: "Informe um nome", description: "O campo nome é obrigatório.", variant: "destructive" });
      return;
    }

    const id = slugify(label);
    const option: TaxonomyOption = {
      id,
      label,
      description: newOption.description.trim() || undefined,
      color: newOption.color.trim() || undefined,
    };

    setDraft((prev) => {
      const group = prev[activeTab as keyof DraftState] as TaxonomyOption[];
      if (group.some((item) => item.id === id)) {
        toast({ title: "Item duplicado", description: "Já existe um item com este identificador.", variant: "destructive" });
        return prev;
      }
      return { ...prev, [activeTab]: [option, ...group] };
    });

    setNewOption({ label: "", description: "", color: "#6366f1" });
  };

  const handleRemoveOption = (id: string) => {
    setDraft((prev) => ({
      ...prev,
      [activeTab]: (prev[activeTab as keyof DraftState] as TaxonomyOption[]).filter((item) => item.id !== id),
    }));
  };

  const handleAddTag = () => {
    const value = newTag.trim();
    if (!value) return;
    const tagId = slugify(value);
    
    setDraft((prev) => {
      if (prev.tags.includes(value) || prev.tags.includes(tagId)) return prev;
      return { ...prev, tags: [value, ...prev.tags] };
    });
    setNewTag("");
  };

  const handleRemoveTag = (tag: string) => {
    setDraft((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  };

  const handleSave = async () => {
    try {
      await saveTaxonomies(draft);
      toast({ title: "Salvo com sucesso!", description: "As configurações foram atualizadas." });
      onClose();
    } catch (error: any) {
      toast({ title: "Erro", description: "Falha ao salvar alterações.", variant: "destructive" });
    }
  };

  const currentList = activeTab === 'tags' ? [] : ((draft[activeTab as keyof DraftState] as TaxonomyOption[]) ?? []);
  const filteredList = currentList.filter(item => 
    item.label.toLowerCase().includes(searchFilter.toLowerCase()) || 
    item.id.includes(searchFilter.toLowerCase())
  );
  const filteredTags = draft.tags.filter(t => t.toLowerCase().includes(searchFilter.toLowerCase()));

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-[1100px] w-[95vw] h-[90vh] p-0 gap-0 border-none bg-zinc-50/95 dark:bg-zinc-950/95 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col sm:rounded-3xl ring-1 ring-zinc-200 dark:ring-zinc-800">
        
        {/* Barra de Gradiente Superior (CORRIGIDO: Agora é um bloco fixo, não absoluto) */}
        <div className="w-full h-2 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-indigo-500 shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 bg-white/50 dark:bg-zinc-900/50 border-b border-zinc-200/50 dark:border-zinc-800/50 z-10 shrink-0 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">Taxonomias do Sistema</DialogTitle>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Gerencie as categorias globais da plataforma</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={onClose} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded-full">
                Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isPending || isLoading} className="bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-violet-600 dark:hover:bg-violet-700 rounded-full px-6 shadow-lg shadow-zinc-900/10 dark:shadow-violet-600/20 transition-all hover:scale-105 active:scale-95">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
              Salvar Alterações
            </Button>
          </div>
        </div>

        {/* Layout Dividido */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* Sidebar de Navegação */}
          <div className="w-[260px] border-r border-zinc-200/50 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-900/30 flex flex-col py-6 gap-2 overflow-y-auto shrink-0 hidden md:flex">
            <div className="px-6 mb-2">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Categorias</h4>
            </div>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const count = tab.id === 'tags' ? draft.tags.length : (draft[tab.id as keyof DraftState] as any[]).length;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setSearchFilter(""); }}
                  className={cn(
                    "relative w-full px-6 py-3 flex items-center justify-between gap-3 text-sm transition-all group",
                    isActive 
                      ? "bg-violet-50 dark:bg-violet-900/10 text-violet-700 dark:text-violet-300 font-semibold" 
                      : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200"
                  )}
                >
                  {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-violet-600 rounded-r-full" />}
                  
                  <div className="flex items-center gap-3">
                    <div className={cn("p-1.5 rounded-md transition-colors", isActive ? "bg-white dark:bg-violet-900/40 shadow-sm" : "bg-zinc-100 dark:bg-zinc-800 group-hover:bg-white dark:group-hover:bg-zinc-700")}>
                        <Icon className={cn("h-4 w-4", isActive ? "text-violet-600 dark:text-violet-400" : "text-zinc-400 group-hover:text-zinc-600")} />
                    </div>
                    <span>{tab.title}</span>
                  </div>
                  <Badge variant="secondary" className={cn("text-[10px] h-5 px-1.5 min-w-[20px] justify-center", isActive ? "bg-white text-violet-600 shadow-sm" : "bg-zinc-100 text-zinc-500")}>
                    {count}
                  </Badge>
                </button>
              );
            })}
          </div>

          {/* Área Principal de Conteúdo */}
          <div className="flex-1 flex flex-col bg-zinc-50/50 dark:bg-black/20 overflow-hidden relative">
            
            <div className="md:hidden flex overflow-x-auto border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 gap-2 shrink-0">
               {tabs.map(t => (
                 <Button 
                   key={t.id} 
                   variant={activeTab === t.id ? "default" : "ghost"} 
                   size="sm"
                   onClick={() => setActiveTab(t.id)}
                   className={cn("whitespace-nowrap rounded-full text-xs", activeTab === t.id && "bg-zinc-900 text-white dark:bg-violet-600")}
                 >
                   {t.title}
                 </Button>
               ))}
            </div>

            <ScrollArea className="flex-1">
              <div className="p-6 md:p-10 space-y-8 max-w-6xl mx-auto">
                
                {/* Header da Seção */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-zinc-200 dark:border-zinc-800">
                  <div className="space-y-1">
                    <h3 className="text-3xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
                      {activeTabData?.title}
                    </h3>
                    <p className="text-zinc-500 dark:text-zinc-400 text-base">{activeTabData?.desc}</p>
                  </div>
                  
                  <div className="relative w-full sm:w-72 group">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-violet-500 transition-colors" />
                     <Input 
                       placeholder={`Buscar em ${activeTabData?.title}...`} 
                       value={searchFilter}
                       onChange={(e) => setSearchFilter(e.target.value)}
                       className="pl-10 h-11 bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 focus:ring-violet-500 focus:border-violet-500 rounded-xl shadow-sm transition-all"
                     />
                  </div>
                </div>

                {activeTab === 'tags' ? (
                  /* --- LAYOUT DE TAGS --- */
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-6 items-end md:items-center relative overflow-hidden">
                        <div className="absolute -right-10 -top-10 w-40 h-40 bg-amber-100 dark:bg-amber-900/10 rounded-full blur-3xl pointer-events-none" />
                        
                        <div className="flex-1 w-full space-y-3 relative z-10">
                          <Label className="text-base font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                             <Tag className="w-4 h-4 text-amber-500" /> Adicionar Nova Tag
                          </Label>
                          <div className="flex gap-3">
                            <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">#</span>
                                <Input 
                                placeholder="Digite a tag e pressione enter..." 
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                                className="pl-7 h-11 bg-zinc-50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 focus:ring-amber-500"
                                />
                            </div>
                            <Button onClick={handleAddTag} size="icon" className="h-11 w-11 shrink-0 bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow-md shadow-amber-500/20">
                              <Plus className="h-5 w-5" />
                            </Button>
                          </div>
                          <p className="text-xs text-zinc-500">
                             Tags são usadas para filtragem rápida e sugestões em buscas.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Tags Ativas ({filteredTags.length})</h4>
                        </div>
                        <div className="flex flex-wrap gap-2 min-h-[100px] content-start">
                            {filteredTags.length === 0 && (
                            <div className="w-full text-center py-10 text-zinc-400 italic border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                                Nenhuma tag encontrada com este filtro.
                            </div>
                            )}
                            {filteredTags.map(tag => (
                            <Badge 
                                key={tag} 
                                variant="secondary" 
                                className="pl-3 pr-1 py-1.5 gap-2 text-sm border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all hover:shadow-sm group"
                            >
                                <span className="opacity-50 mr-0.5">#</span>{tag}
                                <button 
                                    onClick={() => handleRemoveTag(tag)} 
                                    className="h-5 w-5 rounded-full hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/50 flex items-center justify-center transition-colors opacity-50 group-hover:opacity-100"
                                >
                                <X className="h-3 w-3" />
                                </button>
                            </Badge>
                            ))}
                        </div>
                      </div>
                  </div>
                ) : (
                  /* --- LAYOUT DE OPÇÕES PADRÃO --- */
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Formulário de Adição */}
                    <Card className="p-1 rounded-2xl border-0 shadow-lg bg-gradient-to-br from-violet-500 via-fuchsia-500 to-indigo-500">
                        <div className="bg-white dark:bg-zinc-950 rounded-xl p-6">
                            <div className="flex flex-col gap-5">
                                <div className="flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 font-bold text-sm uppercase tracking-wider">
                                <Plus className="h-4 w-4 text-violet-600" />
                                Adicionar {activeTabData?.title.slice(0, -1) || 'Item'}
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                                <div className="md:col-span-5 space-y-2">
                                    <Label className="text-xs font-semibold text-zinc-500 uppercase">Nome *</Label>
                                    <Input 
                                    placeholder="Ex: Consultoria Premium" 
                                    className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:ring-violet-500 h-10"
                                    value={newOption.label}
                                    onChange={e => setNewOption(p => ({...p, label: e.target.value}))}
                                    />
                                </div>
                                <div className="md:col-span-5 space-y-2">
                                    <Label className="text-xs font-semibold text-zinc-500 uppercase">Descrição</Label>
                                    <Input 
                                    placeholder="Breve explicação..." 
                                    className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:ring-violet-500 h-10"
                                    value={newOption.description}
                                    onChange={e => setNewOption(p => ({...p, description: e.target.value}))}
                                    />
                                </div>

                                {/* Seletor de Cores (Swatches) */}
                                <div className="md:col-span-2 space-y-2">
                                    <div className="flex items-center gap-2">
                                      <Label className="text-xs font-semibold text-zinc-500 uppercase">Cor</Label>
                                      {/* Preview da cor selecionada */}
                                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: newOption.color }} />
                                    </div>
                                    
                                    <div className="relative">
                                      <div className="absolute z-10 mt-1 bg-white dark:bg-zinc-800 rounded-lg p-2 shadow-xl border border-zinc-200 dark:border-zinc-700 grid grid-cols-4 gap-1 w-[140px]">
                                        {PRESET_COLORS.map((color) => (
                                          <button
                                            key={color}
                                            onClick={() => setNewOption(p => ({ ...p, color }))}
                                            className={cn(
                                              "w-6 h-6 rounded-full transition-all hover:scale-110 border border-transparent",
                                              newOption.color === color ? "ring-2 ring-violet-500 ring-offset-2 dark:ring-offset-zinc-800 scale-110" : "hover:border-zinc-300"
                                            )}
                                            style={{ backgroundColor: color }}
                                            title={color}
                                          />
                                        ))}
                                      </div>
                                      {/* Botão Fake para manter o layout grid alinhado */}
                                      <div className="h-10 w-full" /> 
                                    </div>
                                </div>

                                <div className="md:col-span-12 flex justify-end">
                                    <Button 
                                        className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 h-10 rounded-lg shadow-md transition-all active:scale-95 px-6" 
                                        onClick={handleAddOption}
                                    >
                                    <ArrowRight className="h-5 w-5 mr-2" /> Adicionar
                                    </Button>
                                </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Grid de Cards */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                             <h4 className="text-sm font-semibold text-zinc-500">Itens Cadastrados ({filteredList.length})</h4>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-10">
                        {filteredList.length === 0 && (
                            <div className="col-span-full flex flex-col items-center justify-center py-20 text-zinc-400 gap-4 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-zinc-50/50 dark:bg-zinc-900/30">
                            <div className="h-16 w-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center">
                                <LayoutGrid className="h-8 w-8 opacity-20" />
                            </div>
                            <p className="font-medium">Nenhum item encontrado.</p>
                            </div>
                        )}
                        {filteredList.map((item) => (
                            <OptionCard 
                            key={item.id} 
                            option={item} 
                            onDelete={() => handleRemoveOption(item.id)} 
                            />
                        ))}
                        </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}