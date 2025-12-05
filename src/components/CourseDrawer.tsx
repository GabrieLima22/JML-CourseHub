import { useMemo, useState, ReactNode } from 'react';
import {
  X, Copy, FileText, Link as LinkIcon, Clock, GraduationCap, MapPin,
  Calendar, DollarSign, Users, BookOpen, Target, Award, Sparkles,
  ListChecks, Settings2, CheckCircle2, ArrowRight, Share2, Briefcase,
  MonitorPlay, Phone, Mail, ChevronRight, Download
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from './ui/sheet';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// --- CONFIGURAÇÃO DE TEMA (JML vs CONECTA) ---
const getTheme = (company: string) => {
  if (company === 'Conecta') {
    return {
      gradient: "from-cyan-500 to-emerald-500",
      bgLight: "bg-cyan-50/50 dark:bg-cyan-950/10",
      border: "border-cyan-100 dark:border-cyan-900/30",
      text: "text-cyan-700 dark:text-cyan-400",
      iconBg: "bg-cyan-100 dark:bg-cyan-900/30",
      marker: "bg-cyan-500",
    };
  }
  // Default JML
  return {
    gradient: "from-violet-600 to-indigo-600",
    bgLight: "bg-violet-50/50 dark:bg-violet-950/10",
    border: "border-violet-100 dark:border-violet-900/30",
    text: "text-violet-700 dark:text-violet-400",
    iconBg: "bg-violet-100 dark:bg-violet-900/30",
    marker: "bg-violet-500",
  };
};

const formatDate = (dateString?: string | null) => {
  if (!dateString) return null;
  try {
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(dateString));
  } catch { return dateString; }
};

// --- COMPONENTES VISUAIS ---

const SectionTitle = ({ icon: Icon, title, className }: { icon: any, title: string, className?: string }) => (
  <div className={cn("flex items-center gap-3 mb-6 pb-2 border-b border-border/40", className)}>
    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
      <Icon className="w-5 h-5" />
    </div>
    <h3 className="font-bold text-lg text-foreground tracking-tight">{title}</h3>
  </div>
);

const HighlightCard = ({ children, className }: { children: ReactNode, className?: string }) => (
  <div className={cn("rounded-2xl border bg-card/50 backdrop-blur-sm p-6 shadow-sm transition-all hover:shadow-md", className)}>
    {children}
  </div>
);

const SpeakerCard = ({ speaker, theme }: { speaker: any, theme: any }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const bio = speaker.bio || speaker.curriculo || '';
  const needsExpansion = bio.length > 200;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-white/50 dark:bg-slate-900/50 p-6 hover:border-border transition-all hover:shadow-md">
      <div className="flex gap-5">
        <Avatar className="h-20 w-20 border-2 border-background shadow-lg shrink-0">
          <AvatarImage src={speaker.foto || speaker.imagem || speaker.photo} className="object-cover" />
          <AvatarFallback className={cn("font-bold text-2xl", theme.text, theme.bgLight)}>
            {(speaker.name || speaker.nome)?.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors mb-1">
            {speaker.name || speaker.nome}
          </h4>
          <p className={cn("text-sm font-medium mb-3", theme.text)}>
            {speaker.role || speaker.cargo}
          </p>
          {bio && (
            <>
              <p className={cn(
                "text-sm text-muted-foreground leading-relaxed whitespace-pre-line",
                !isExpanded && needsExpansion && "line-clamp-4"
              )}>
                {bio}
              </p>
              {needsExpansion && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className={cn("text-xs font-semibold mt-2 hover:underline", theme.text)}
                >
                  {isExpanded ? 'Ver menos' : 'Ver mais'}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---

export function CourseDrawer({ course, open, onClose, relatedCourses, onCourseClick }: any) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("visão-geral");

  if (!course) return null;

  const theme = getTheme(course.empresa);
  
  // Normalização de Dados
  const dateStart = formatDate(course.data_inicio || course.startDate);
  const dateEnd = formatDate(course.data_fim || course.endDate);
  const dateDisplay = dateStart ? (dateEnd && dateStart !== dateEnd ? `${dateStart} até ${dateEnd}` : dateStart) : "A definir";
  
  const segments = course.segmentos || (course.segmento ? [course.segmento] : []);
  const customSchema = course.custom_schema || [];
  const customValues = course.custom_fields || {};

  // Formatação de Preço
  const formatPrice = (value?: number | null) => {
    if (!value) return null;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getPriceDisplay = () => {
    console.log('🔍 Debug Preço:', {
      preco_resumido: course.preco_resumido,
      preco_online: course.preco_online,
      preco_presencial: course.preco_presencial,
      preco_incompany: course.preco_incompany,
      modalidade: course.modalidade,
      modality: course.modality
    });

    if (course.preco_resumido) return course.preco_resumido;

    // Determinar qual preço mostrar baseado na modalidade
    const modality = course.modality?.[0] || course.modalidade?.[0] || '';
    const isEAD = modality.toLowerCase().includes('ead');
    const isPresencial = modality.toLowerCase().includes('aberto') || modality.toLowerCase().includes('presencial');
    const isInCompany = modality.toLowerCase().includes('incompany');

    console.log('🎯 Modalidade detectada:', { modality, isEAD, isPresencial, isInCompany });

    if (isEAD && course.preco_online) return formatPrice(course.preco_online);
    if (isPresencial && course.preco_presencial) return formatPrice(course.preco_presencial);
    if (isInCompany && course.preco_incompany) return formatPrice(course.preco_incompany);

    // Fallback: mostrar o primeiro disponível
    if (course.preco_online) return formatPrice(course.preco_online);
    if (course.preco_presencial) return formatPrice(course.preco_presencial);
    if (course.preco_incompany) return formatPrice(course.preco_incompany);

    return "Sob Consulta";
  };

  const getAvailablePrices = () => {
    const prices = [];
    if (course.preco_online) prices.push({ label: 'EAD', value: formatPrice(course.preco_online) });
    if (course.preco_presencial) prices.push({ label: 'Presencial', value: formatPrice(course.preco_presencial) });
    if (course.preco_incompany) prices.push({ label: 'In Company', value: formatPrice(course.preco_incompany) });
    return prices;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: "Link copiado", description: "Compartilhe este curso com sua equipe." });
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-[900px] p-0 border-l border-border/40 shadow-2xl bg-[#F8F9FC] dark:bg-[#09090b] overflow-hidden flex flex-col">
        
        {/* --- HEADER: HERO SECTION --- */}
        <div className="relative shrink-0">
          {/* Background com Gradiente */}
          <div className={cn("absolute inset-0 bg-gradient-to-br opacity-10 dark:opacity-20", theme.gradient)} />
          
          <div className="relative z-10 p-6 sm:p-8 flex flex-col gap-5 border-b border-border/40 bg-white/70 dark:bg-black/40 backdrop-blur-xl">
            {/* Top Bar */}
            <div className="flex items-start justify-between">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className={cn("bg-white/80 dark:bg-white/10 backdrop-blur-md border-0 font-bold px-3", theme.text)}>
                  {course.empresa || "JML"}
                </Badge>
                <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3">
                  {course.modality?.[0] || course.tipo || "Curso"}
                </Badge>
                {segments.slice(0, 2).map((seg: string) => (
                  <Badge key={seg} variant="outline" className="border-slate-200 dark:border-slate-700 text-slate-500">
                    {seg}
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 transition-colors" onClick={handleCopyLink}>
                   <Share2 className="w-4 h-4" />
                </Button>
                <SheetClose asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 transition-colors">
                    <X className="w-4 h-4" />
                  </Button>
                </SheetClose>
              </div>
            </div>

            {/* Title & Subtitle */}
            <div className="space-y-3">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
                {course.title}
              </h1>
              {course.subtitle && (
                <p className="text-lg text-muted-foreground font-medium line-clamp-2 max-w-3xl">{course.subtitle}</p>
              )}
            </div>

            {/* Quick Info Bar */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium text-slate-600 dark:text-slate-400 mt-2">
               <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>{course.duration_hours || 0}h de conteúdo</span>
               </div>
               <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>{dateDisplay}</span>
               </div>
               {course.local && (
                 <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>{course.local}</span>
                 </div>
               )}
            </div>
          </div>
        </div>

        {/* --- MAIN CONTENT --- */}
        <ScrollArea className="flex-1 w-full">
          <div className="p-6 sm:p-8 pb-32">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              
              {/* COLUNA ESQUERDA: CONTEÚDO PRINCIPAL (8 cols) */}
              <div className="lg:col-span-8 space-y-10">
                
                {/* Abas */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="w-full justify-start h-auto p-0 bg-transparent border-b border-border/50 rounded-none gap-8">
                    {["visão-geral", "programação", "palestrantes"].map((tab) => (
                      <TabsTrigger 
                        key={tab} 
                        value={tab} 
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 text-sm font-bold text-muted-foreground data-[state=active]:text-foreground uppercase tracking-wide transition-all hover:text-foreground"
                      >
                        {tab.replace('-', ' ')}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {/* ABA: VISÃO GERAL */}
                  <TabsContent value="visão-geral" className="space-y-10 mt-8 animate-in fade-in slide-in-from-left-2 duration-300">
                    
                    {/* Apresentação */}
                    <div className="prose prose-slate dark:prose-invert max-w-none">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                         <FileText className="w-5 h-5 text-muted-foreground"/> Sobre o Curso
                      </h3>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line text-base">
                        {course.apresentacao || course.summary || course.description}
                      </p>
                    </div>

                    {/* Objetivos (Grid) */}
                    {course.objectives?.length > 0 && (
                      <HighlightCard className={theme.bgLight}>
                        <SectionTitle icon={Target} title="Objetivos de Aprendizagem" className="border-border/20 mb-4" />
                        <ul className="grid sm:grid-cols-2 gap-4">
                          {course.objectives.map((obj: string, i: number) => (
                            <li key={i} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-200">
                              <div className={cn("mt-1 w-1.5 h-1.5 rounded-full shrink-0", theme.marker)} />
                              <span className="leading-relaxed">{obj}</span>
                            </li>
                          ))}
                        </ul>
                      </HighlightCard>
                    )}

                    {/* Público Alvo */}
                    <div className="space-y-4">
                       <SectionTitle icon={Users} title="Público-Alvo" />
                       <p className="text-sm text-muted-foreground mb-3">Este treinamento foi desenhado especificamente para:</p>
                       <div className="flex flex-wrap gap-2">
                          {(course.target_audience || course.publico_alvo || []).map((target: string, i: number) => (
                             <span key={i} className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700 uppercase tracking-wide">
                                {target}
                             </span>
                          ))}
                       </div>
                    </div>

                    {/* Entregáveis */}
                    {course.deliverables?.length > 0 && (
                       <div className="space-y-4">
                          <SectionTitle icon={Award} title="O que está incluso" />
                          <div className="grid sm:grid-cols-2 gap-4">
                             {course.deliverables.map((item: string, i: number) => (
                                <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card/40">
                                   <div className={cn("p-1.5 rounded-full bg-opacity-10", theme.iconBg)}>
                                      <Sparkles className={cn("w-3.5 h-3.5", theme.text)} />
                                   </div>
                                   <span className="text-sm font-medium">{item}</span>
                                </div>
                             ))}
                          </div>
                       </div>
                    )}

                    {/* Campos Personalizados */}
                    {customSchema.length > 0 && (
                      <div className="space-y-4">
                        <SectionTitle icon={Settings2} title="Informações Adicionais" />
                        <div className="grid sm:grid-cols-2 gap-4">
                          {customSchema
                            .filter((f: any) => f.visibility?.page !== false)
                            .map((field: any) => {
                              const val = customValues[field.id];
                              if (!val) return null;
                              return (
                                <div key={field.id} className="p-4 rounded-xl border bg-card/30">
                                  <p className="text-xs uppercase font-bold text-muted-foreground mb-1">{field.label}</p>
                                  <p className="text-sm font-medium">{String(val)}</p>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* ABA: PROGRAMAÇÃO (TIMELINE VISUAL) */}
                  <TabsContent value="programação" className="space-y-8 mt-8 animate-in fade-in slide-in-from-right-2 duration-300">
                     <SectionTitle icon={ListChecks} title="Conteúdo Programático" />

                     {((course.program_sections || course.programacao)?.length > 0) ? (
                        <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-3 space-y-8 pb-4">
                           {(course.program_sections || course.programacao || []).map((section: any, idx: number) => (
                              <div key={idx} className="relative pl-8 group">
                                 {/* Marcador da Timeline */}
                                 <div className={cn(
                                    "absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-background ring-2 ring-slate-200 dark:ring-slate-800 transition-colors", 
                                    theme.marker
                                 )} />
                                 
                                 <div className="rounded-xl border border-border/60 bg-card/60 p-5 transition-all hover:border-primary/30 hover:shadow-sm">
                                    <h4 className={cn("font-bold text-base mb-2", theme.text)}>
                                       Módulo {idx + 1}: {section.title}
                                    </h4>
                                    {section.description && (
                                       <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{section.description}</p>
                                    )}
                                    
                                    {section.topics?.length > 0 && (
                                       <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
                                          <ul className="grid gap-2">
                                             {section.topics.map((t: string, i: number) => (
                                                <li key={i} className="text-sm text-slate-600 dark:text-slate-300 flex items-start gap-2.5">
                                                   <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 mt-1.5 shrink-0" />
                                                   {t}
                                                </li>
                                             ))}
                                          </ul>
                                       </div>
                                    )}
                                 </div>
                              </div>
                           ))}
                        </div>
                     ) : (
                        <div className="text-center py-12 text-muted-foreground bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed">
                           <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
                           <p>Conteúdo programático detalhado será disponibilizado em breve.</p>
                        </div>
                     )}
                  </TabsContent>

                  {/* ABA: PALESTRANTES (CARDS) */}
                  <TabsContent value="palestrantes" className="space-y-8 mt-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                     <SectionTitle icon={Users} title="Corpo Docente" />

                     <div className="grid gap-4">
                        {((course.speakers && course.speakers.length > 0) || (course.palestrantes && course.palestrantes.length > 0)) ? (
                           (course.speakers || course.palestrantes || []).map((speaker: any, idx: number) => (
                              <SpeakerCard key={idx} speaker={speaker} theme={theme} />
                           ))
                        ) : (
                           <div className="text-center py-12 text-muted-foreground bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed">
                              <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                              <p>Palestrantes a serem confirmados.</p>
                           </div>
                        )}
                     </div>
                  </TabsContent>
                </Tabs>

                {/* Seção Cursos Relacionados (Dentro do conteúdo principal) */}
                {relatedCourses?.length > 0 && (
                   <div className="pt-10 border-t border-dashed mt-12">
                      <div className="flex items-center gap-2 mb-4">
                         <Sparkles className="w-4 h-4 text-amber-500" />
                         <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Você também pode se interessar</h4>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                         {relatedCourses.map((rel: any) => (
                            <div 
                               key={rel.id} 
                               onClick={() => onCourseClick(rel)}
                               className="group cursor-pointer p-4 rounded-xl border border-border hover:border-primary/50 hover:shadow-md transition-all bg-card flex flex-col justify-between h-full"
                            >
                               <div>
                                  <h5 className="font-bold text-sm group-hover:text-primary transition-colors line-clamp-2">{rel.title}</h5>
                               </div>
                               <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                                  <Badge variant="secondary" className="text-[10px] h-5 px-1.5">{rel.empresa}</Badge>
                                  <span>{rel.tipo}</span>
                                  <ArrowRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                               </div>
                            </div>
                         ))}
                      </div>
                   </div>
                )}
              </div>

              {/* COLUNA DIREITA: SIDEBAR (4 cols) */}
              <div className="lg:col-span-4 space-y-6">
                 
                 {/* Card de Informações/Preço (Sticky) */}
                 <div className="sticky top-6 space-y-6">
                    <div className="rounded-2xl border border-border/60 bg-white dark:bg-[#111623] shadow-xl p-6 overflow-hidden relative">
                        {/* Faixa decorativa topo */}
                        <div className={cn("absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r", theme.gradient)} />
                        
                        {/* Preço / Investimento */}
                        <div className="mb-6 pb-6 border-b border-border/50">
                           <p className="text-sm text-muted-foreground font-medium mb-2 uppercase tracking-wide">Investimento</p>
                           <div className="flex flex-col gap-2">
                              <span className={cn("text-3xl font-extrabold tracking-tight", theme.text)}>
                                 {getPriceDisplay()}
                              </span>
                              {getAvailablePrices().length > 1 && (
                                 <div className="flex flex-wrap gap-2 mt-2">
                                    {getAvailablePrices().map((price, idx) => (
                                       <div key={idx} className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                          <span className="text-slate-500">{price.label}:</span>{' '}
                                          <span className="font-semibold">{price.value}</span>
                                       </div>
                                    ))}
                                 </div>
                              )}
                              {(course.investment_details?.notes) && (
                                 <p className="text-xs text-muted-foreground mt-1 italic">{course.investment_details.notes}</p>
                              )}
                           </div>
                        </div>

                        {/* Detalhes Rápidos (Checklist) */}
                        <div className="space-y-4 mb-6">
                           <div className="flex items-start gap-3">
                              <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0">
                                 <Briefcase className="w-4 h-4 text-slate-500" />
                              </div>
                              <div>
                                 <p className="text-xs font-bold uppercase text-muted-foreground mb-0.5">Instituição</p>
                                 <p className="text-sm font-medium">{course.empresa || course.company || "JML"}</p>
                              </div>
                           </div>

                           {dateDisplay !== "A definir" && (
                              <div className="flex items-start gap-3">
                                 <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0">
                                    <Calendar className="w-4 h-4 text-slate-500" />
                                 </div>
                                 <div>
                                    <p className="text-xs font-bold uppercase text-muted-foreground mb-0.5">Período</p>
                                    <p className="text-sm font-medium">{dateDisplay}</p>
                                 </div>
                              </div>
                           )}

                           {course.local && course.local.trim() !== '' && (
                              <div className="flex items-start gap-3">
                                 <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0">
                                    <MapPin className="w-4 h-4 text-slate-500" />
                                 </div>
                                 <div>
                                    <p className="text-xs font-bold uppercase text-muted-foreground mb-0.5">Localização</p>
                                    <p className="text-sm font-medium">{course.local}</p>
                                 </div>
                              </div>
                           )}

                           <div className="flex items-start gap-3">
                              <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0">
                                 <MonitorPlay className="w-4 h-4 text-slate-500" />
                              </div>
                              <div>
                                 <p className="text-xs font-bold uppercase text-muted-foreground mb-0.5">Modalidade</p>
                                 <p className="text-sm font-medium">{course.modality?.join(', ') || course.modalidade?.join(', ') || "A definir"}</p>
                              </div>
                           </div>
                        </div>

                        {/* Botões Secundários */}
                        {course.links?.pdf && (
                           <Button variant="outline" className="w-full h-11 border-dashed gap-2 group hover:border-primary hover:text-primary transition-colors" asChild>
                              <a href={course.links.pdf} target="_blank">
                                 <FileText className="w-4 h-4" /> 
                                 <span>Baixar Programa (PDF)</span>
                                 <Download className="w-3 h-3 ml-auto opacity-50 group-hover:opacity-100" />
                              </a>
                           </Button>
                        )}
                        
                        {/* Contatos */}
                        {course.contacts && (
                           <div className="mt-6 pt-4 border-t border-border/50">
                              <p className="text-xs font-bold text-center text-muted-foreground mb-3 uppercase">Precisa de ajuda?</p>
                              <div className="flex justify-center gap-4">
                                 {course.contacts.whatsapp && (
                                    <Button size="sm" variant="ghost" className="h-9 w-9 rounded-full bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700">
                                       <Phone className="w-4 h-4" />
                                    </Button>
                                 )}
                                 {course.contacts.email && (
                                    <Button size="sm" variant="ghost" className="h-9 w-9 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700">
                                       <Mail className="w-4 h-4" />
                                    </Button>
                                 )}
                              </div>
                           </div>
                        )}
                    </div>

                    {/* Card de Metodologia/Vantagens (Compacto) */}
                    {course.reasons_to_attend?.length > 0 && (
                       <div className="rounded-xl border bg-card/30 p-5 backdrop-blur-sm">
                          <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                             <Target className="w-4 h-4" /> Por que participar?
                          </h4>
                          <ul className="space-y-3">
                             {course.reasons_to_attend.slice(0, 4).map((reason: string, i: number) => (
                                <li key={i} className="flex gap-2.5 text-sm leading-snug text-slate-600 dark:text-slate-300">
                                   <CheckCircle2 className={cn("w-4 h-4 shrink-0 mt-0.5", theme.text)} />
                                   <span>{reason}</span>
                                </li>
                             ))}
                          </ul>
                       </div>
                    )}
                 </div>

              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}