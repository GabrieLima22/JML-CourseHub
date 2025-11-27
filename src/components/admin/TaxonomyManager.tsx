import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
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
  Palette, 
  Plus, 
  Sparkles, 
  Trash2, 
  Building2, 
  Target, 
  Layers, 
  Users, 
  TrendingUp, 
  Tag, 
  Search, 
  Check,
  LayoutGrid,
  X
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

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

// --- Card Visual Melhorado para cada Item ---
const OptionCard = ({
  option,
  onDelete,
}: {
  option: TaxonomyOption;
  onDelete: () => void;
}) => (
  <div className="group relative flex flex-col gap-2 rounded-xl border bg-card p-4 shadow-sm transition-all hover:shadow-md hover:border-violet-200 dark:hover:border-violet-800">
    <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={onDelete} 
        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
    
    <div className="flex items-center gap-3">
      <div 
        className="h-10 w-10 rounded-lg flex items-center justify-center text-xs font-bold shadow-sm border"
        style={{ 
          backgroundColor: option.color ? `${option.color}20` : undefined,
          color: option.color || undefined,
          borderColor: option.color ? `${option.color}40` : undefined
        }}
      >
        {option.label.charAt(0).toUpperCase()}
      </div>
      <div className="flex flex-col min-w-0">
        <span className="font-semibold text-sm leading-tight truncate">{option.label}</span>
        <span className="text-[10px] text-muted-foreground font-mono truncate">#{option.id}</span>
      </div>
    </div>
    
    <div className="mt-1 h-[2.5em] text-xs text-muted-foreground line-clamp-2 leading-relaxed bg-muted/50 p-2 rounded-lg">
       {option.description || <span className="italic opacity-50">Sem descrição</span>}
    </div>
  </div>
);

export function TaxonomyManager({ open, onClose }: TaxonomyManagerProps) {
  const { data, isLoading } = useTaxonomies();
  const { mutateAsync: saveTaxonomies, isPending } = useSaveTaxonomies();
  const [draft, setDraft] = useState<DraftState>(DEFAULT_STATE);
  const [activeTab, setActiveTab] = useState("companies");

  // Filtros e inputs
  const [searchFilter, setSearchFilter] = useState("");
  const [newOption, setNewOption] = useState({
    label: "",
    description: "",
    color: "",
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
      { id: "companies", title: "Empresas", icon: Building2, desc: "Marcas e branding" },
      { id: "courseTypes", title: "Tipos", icon: Target, desc: "Formatos de ensino" },
      { id: "segments", title: "Segmentos", icon: Layers, desc: "?reas de conhecimento" },
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

    setNewOption({ label: "", description: "", color: "" });
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
      toast({ title: "Salvo com sucesso!", description: "As taxonomias foram atualizadas." });
      onClose();
    } catch (error: any) {
      toast({ title: "Erro", description: "Falha ao salvar.", variant: "destructive" });
    }
  };

  // Listas filtradas
  const currentList = (draft[activeTab as keyof DraftState] as TaxonomyOption[]) ?? [];
  const filteredList = currentList.filter(item => 
    item.label.toLowerCase().includes(searchFilter.toLowerCase()) || 
    item.id.includes(searchFilter.toLowerCase())
  );
  const filteredTags = draft.tags.filter(t => t.toLowerCase().includes(searchFilter.toLowerCase()));

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-[1100px] w-[95vw] h-[85vh] p-0 gap-0 border-0 overflow-hidden flex flex-col sm:rounded-3xl">
        
        {/* Barra de Topo */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-background z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-900/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold leading-none">Taxonomias do Sistema</DialogTitle>
              <p className="text-xs text-muted-foreground mt-1">Gerencie categorizações globais</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onClose} className="text-muted-foreground">Cancelar</Button>
            <Button onClick={handleSave} disabled={isPending || isLoading} className="bg-violet-600 hover:bg-violet-700 min-w-[120px]">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
              Salvar
            </Button>
          </div>
        </div>

        {/* Layout Dividido */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* Sidebar de Navegação */}
          <div className="w-[240px] border-r bg-muted/30 flex flex-col py-4 gap-1 overflow-y-auto shrink-0 hidden md:flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const count = tab.id === 'tags' ? draft.tags.length : (draft[tab.id as keyof DraftState] as any[]).length;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setSearchFilter(""); }}
                  className={cn(
                    "w-full px-4 py-3 flex items-center justify-between gap-3 text-sm transition-all border-l-4",
                    isActive 
                      ? "bg-background border-violet-600 shadow-sm text-violet-600 dark:text-violet-400 font-medium" 
                      : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn("h-4 w-4", isActive ? "text-violet-600" : "text-slate-400")} />
                    <span>{tab.title}</span>
                  </div>
                  <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-muted text-muted-foreground">
                    {count}
                  </Badge>
                </button>
              );
            })}
          </div>

          {/* Área Principal de Conteúdo */}
          <div className="flex-1 flex flex-col bg-muted/10 overflow-hidden relative">
            
            {/* Tabs Mobile */}
            <div className="md:hidden flex overflow-x-auto border-b bg-background p-2 gap-2 shrink-0">
               {tabs.map(t => (
                 <Button 
                   key={t.id} 
                   variant={activeTab === t.id ? "default" : "ghost"} 
                   size="sm"
                   onClick={() => setActiveTab(t.id)}
                   className={cn("whitespace-nowrap", activeTab === t.id && "bg-violet-600")}
                 >
                   {t.title}
                 </Button>
               ))}
            </div>

            <ScrollArea className="flex-1">
              <div className="p-6 md:p-8 space-y-8">
                
                {/* Header da Seção */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-bold flex items-center gap-2">
                      {activeTabData?.title}
                    </h3>
                    <p className="text-muted-foreground mt-1">{activeTabData?.desc}</p>
                  </div>
                  
                  <div className="relative w-full sm:w-64">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                     <Input 
                       placeholder="Filtrar lista..." 
                       value={searchFilter}
                       onChange={(e) => setSearchFilter(e.target.value)}
                       className="pl-9 bg-background"
                     />
                  </div>
                </div>

                {activeTab === 'tags' ? (
                  /* --- LAYOUT DE TAGS --- */
                  <div className="space-y-6">
                     <Card className="p-4 bg-background border-dashed border-2 flex flex-col md:flex-row gap-4 items-end md:items-center">
                        <div className="flex-1 w-full space-y-2">
                          <span className="text-sm font-medium">Nova Tag</span>
                          <div className="flex gap-2">
                            <Input 
                              placeholder="Digite e pressione enter..." 
                              value={newTag}
                              onChange={(e) => setNewTag(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                              className="flex-1"
                            />
                            <Button onClick={handleAddTag} size="icon" className="shrink-0 bg-violet-600 hover:bg-violet-700">
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground md:max-w-xs leading-tight">
                          Tags são usadas para auto-complete e sugestões rápidas em formulários e buscas.
                        </div>
                     </Card>

                     <div className="flex flex-wrap gap-2 p-1">
                        {filteredTags.length === 0 && (
                          <div className="w-full text-center py-10 text-muted-foreground italic">
                             Nenhuma tag encontrada.
                          </div>
                        )}
                        {filteredTags.map(tag => (
                          <Badge key={tag} variant="secondary" className="pl-3 pr-1 py-1.5 gap-2 text-sm border bg-card hover:bg-muted transition-colors">
                            {tag}
                            <button onClick={() => handleRemoveTag(tag)} className="h-5 w-5 rounded-full hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/50 flex items-center justify-center transition-colors">
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                     </div>
                  </div>
                ) : (
                  /* --- LAYOUT DE OPÇÕES PADRÃO --- */
                  <div className="space-y-6">
                    {/* Formulário de Adição */}
                    <Card className="p-5 border-none shadow-md bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/20 dark:to-slate-900">
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2 text-violet-700 dark:text-violet-400 font-semibold text-sm uppercase tracking-wider">
                          <Plus className="h-4 w-4" />
                          Adicionar Novo Item
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                          <div className="md:col-span-4 space-y-1.5">
                            <Label className="text-xs">Nome *</Label>
                            <Input 
                              placeholder="Ex: Consultoria Premium" 
                              className="bg-background"
                              value={newOption.label}
                              onChange={e => setNewOption(p => ({...p, label: e.target.value}))}
                            />
                          </div>
                          <div className="md:col-span-5 space-y-1.5">
                            <Label className="text-xs">Descrição</Label>
                            <Input 
                              placeholder="Breve explicação..." 
                              className="bg-background"
                              value={newOption.description}
                              onChange={e => setNewOption(p => ({...p, description: e.target.value}))}
                            />
                          </div>
                          <div className="md:col-span-2 space-y-1.5">
                            <Label className="text-xs">Cor</Label>
                            <div className="relative">
                              <div 
                                className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full border shadow-sm"
                                style={{ backgroundColor: newOption.color || 'transparent' }}
                              />
                              <Input 
                                placeholder="#000000" 
                                className="bg-background pl-8"
                                value={newOption.color}
                                onChange={e => setNewOption(p => ({...p, color: e.target.value}))}
                              />
                            </div>
                          </div>
                          <div className="md:col-span-1 flex items-end">
                            <Button className="w-full bg-violet-600 hover:bg-violet-700" onClick={handleAddOption}>
                              <Plus className="h-5 w-5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>

                    {/* Grid de Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-10">
                      {filteredList.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground gap-4 border-2 border-dashed rounded-xl bg-muted/30">
                          <LayoutGrid className="h-10 w-10 opacity-20" />
                          <p>Nenhum item encontrado.</p>
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
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}