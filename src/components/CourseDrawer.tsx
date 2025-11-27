import { useMemo, useState } from 'react';
import {
  X,
  Copy,
  FileText,
  Link as LinkIcon,
  Clock,
  GraduationCap,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  BookOpen,
  Star,
  Target,
  Award,
  Sparkles,
  ListChecks,
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { Course, CourseProgramItem, CourseSpeaker, CourseInvestment } from '@/hooks/useSearch';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const companyLabels: Record<string, string> = {
  JML: 'JML',
  Conecta: 'Conecta',
};

const courseTypeLabels: Record<string, string> = {
  aberto: 'Aberto',
  incompany: 'InCompany',
  ead: 'EAD',
  hibrido: 'Híbrido',
};

type CourseDrawerProps = {
  course: Course | null;
  open: boolean;
  onClose: () => void;
  relatedCourses: Course[];
  onCourseClick: (course: Course) => void;
};

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const formatDateRange = (start?: string | null, end?: string | null) => {
  if (!start && !end) return null;
  if (start && end) {
    return `${dateFormatter.format(new Date(start))} - ${dateFormatter.format(new Date(end))}`;
  }
  const date = start || end;
  return date ? dateFormatter.format(new Date(date)) : null;
};

const InfoPill = ({ label, value }: { label: string; value?: string | null }) => {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground flex items-center gap-1">{label}</span>
      <span className="font-semibold text-sm leading-tight">{value}</span>
    </div>
  );
};

const DrawerSection = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section className="space-y-3">
    <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">{title}</h4>
    <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
      {children}
    </div>
  </section>
);

const List = ({ items }: { items: string[] }) => (
  <ul className="space-y-2">
    {items.map((item, index) => (
      <li key={`${item}-${index}`} className="flex items-start gap-2 text-sm text-foreground">
        <span className="text-primary mt-1">•</span>
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

const ProgramList = ({ sections }: { sections: CourseProgramItem[] }) => (
  <div className="space-y-4">
    {sections.map((section, index) => (
      <div key={`${section.title}-${index}`} className="rounded-xl border border-border p-4">
        {section.title && <h5 className="font-semibold text-sm mb-1">{section.title}</h5>}
        {section.description && <p className="text-sm text-muted-foreground leading-relaxed">{section.description}</p>}
        {section.topics && section.topics.length > 0 && (
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {section.topics.map((topic, topicIdx) => (
              <li key={`${topic}-${topicIdx}`} className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>{topic}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    ))}
  </div>
);

const Speakers = ({ speakers }: { speakers: CourseSpeaker[] }) => (
  <div className="grid gap-4 sm:grid-cols-2">
    {speakers.map((speaker) => (
      <div
        key={speaker.name}
        className="rounded-xl border border-border p-4 flex flex-col gap-1"
      >
        <span className="font-semibold">{speaker.name}</span>
        {speaker.role && (
          <span className="text-sm text-muted-foreground">{speaker.role}</span>
        )}
        {speaker.company && (
          <span className="text-sm text-muted-foreground">{speaker.company}</span>
        )}
        {speaker.bio && (
          <p className="text-sm text-muted-foreground mt-2">{speaker.bio}</p>
        )}
      </div>
    ))}
  </div>
);

const Investment = ({ investment }: { investment?: CourseInvestment }) => {
  if (!investment) return null;
  return (
    <div className="space-y-3">
      {investment.summary && (
        <p className="text-sm text-muted-foreground leading-relaxed">{investment.summary}</p>
      )}
      {investment.options && investment.options.length > 0 && (
        <div className="grid gap-3">
          {investment.options.map((option, index) => (
            <div key={`${option.title}-${index}`} className="rounded-xl border border-border p-4">
              {option.title && <p className="font-semibold mb-1">{option.title}</p>}
              {option.price && (
                <p className="text-sm text-primary font-semibold mb-2">{option.price}</p>
              )}
              {option.includes && option.includes.length > 0 && (
                <List items={option.includes} />
              )}
            </div>
          ))}
        </div>
      )}
      {investment.notes && (
        <p className="text-xs text-muted-foreground italic">{investment.notes}</p>
      )}
    </div>
  );
};

export function CourseDrawer({ course, open, onClose, relatedCourses, onCourseClick }: CourseDrawerProps) {
  const [activeTab, setActiveTab] = useState('breve');
  const { toast } = useToast();

  const segments = useMemo(() => {
    if (!course) return [];
    if (course.segments && course.segments.length > 0) return course.segments;
    return course.segment ? [course.segment] : [];
  }, [course]);

  if (!course) return null;

  const priceSummary = course.price_summary || course.investment_details?.summary || course.investment_details?.options?.[0]?.price;
  const badges = course.badges.length > 0 ? course.badges : course.tags;
  const dateRange = formatDateRange(course.startDate, course.endDate);
  const pitchText = `${course.title}${course.subtitle ? ` - ${course.subtitle}` : ''}\n\n${course.summary}\n\nEmpresa: ${companyLabels[course.company] || course.company} | Tipo: ${courseTypeLabels[course.course_type] || course.course_type} | Segmentos: ${segments.join(', ')}\nCarga horária: ${course.duration_hours}h | Nível: ${course.level} | Modalidades: ${course.modality.join(', ')}`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copiado!',
      description: `${label} copiado para a área de transferência.`,
    });
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto p-0">
        <SheetHeader className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 p-6 pb-4 border-b">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
              <SheetTitle className="text-2xl font-semibold leading-tight">
                {course.title}
              </SheetTitle>
              {course.subtitle && (
                <p className="text-sm text-muted-foreground">{course.subtitle}</p>
              )}
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-xs font-medium">
                  {companyLabels[course.company] || course.company}
                </Badge>
                <Badge variant="outline" className="text-xs font-medium">
                  {courseTypeLabels[course.course_type] || course.course_type}
                </Badge>
                {segments.map(segment => (
                  <Badge key={segment} variant="secondary" className="text-xs font-medium">
                    {segment}
                  </Badge>
                ))}
                {course.category && (
                  <Badge variant="secondary" className="text-xs font-medium">
                    {course.category}
                  </Badge>
                )}
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </SheetHeader>

        <div className="p-6 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="breve">Visão Breve</TabsTrigger>
              <TabsTrigger value="detalhada">Visão Detalhada</TabsTrigger>
            </TabsList>

            <TabsContent value="breve" className="space-y-6">
              <div className="bg-gradient-to-br from-purple-50/50 to-blue-50/30 dark:from-purple-950/20 dark:to-blue-950/10 rounded-xl p-6 border-2 border-purple-100 dark:border-purple-900/30 shadow-sm">
                <div className="flex items-start gap-3 mb-3">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg text-foreground">Apresentação</h3>
                </div>
                <p className="text-base leading-relaxed text-muted-foreground pl-11">
                  {course.summary}
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-50/40 to-indigo-50/30 dark:from-blue-950/15 dark:to-indigo-950/10 rounded-xl p-5 border-2 border-blue-100 dark:border-blue-900/30">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-white" />
                  </div>
                  <h4 className="font-semibold text-foreground">Informações do Curso</h4>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <InfoPill label="Formato / Modalidade" value={`${course.modality.join(', ')}${course.location ? ` · ${course.location}` : ''}`} />
                  <InfoPill label="Segmentos" value={course.segments?.join(', ') || course.area || ''} />
                  <InfoPill label="Datas" value={dateRange ?? 'Sob consulta'} />
                  <InfoPill label="Local" value={course.address ?? course.location ?? 'Sob consulta'} />
                  <InfoPill label="Carga horária" value={`${course.duration_hours}h`} />
                  <InfoPill label="Investimento" value={priceSummary ?? 'Sob consulta'} />
                </div>
              </div>

              {badges.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {badges.map(badge => (
                    <Badge key={badge} variant="secondary" className="text-xs uppercase tracking-wide">
                      {badge}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <Button className="flex-1" onClick={() => copyToClipboard(pitchText, 'Pitch')}>
                  <Copy className="w-4 h-4 mr-2" /> Copiar Pitch
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => copyToClipboard(course.summary, 'Resumo')}
                >
                  <FileText className="w-4 h-4 mr-2" /> Copiar Resumo
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="detalhada" className="space-y-6">
              <div className="bg-gradient-to-br from-purple-50/50 to-pink-50/30 dark:from-purple-950/20 dark:to-pink-950/10 rounded-xl p-6 border-2 border-purple-100 dark:border-purple-900/30">
                <div className="flex items-start gap-3 mb-4">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg text-foreground">Apresentação</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed pl-11">{course.summary}</p>
              </div>

              {course.learning_points.length > 0 && (
                <div className="bg-gradient-to-br from-blue-50/50 to-cyan-50/30 dark:from-blue-950/20 dark:to-cyan-950/10 rounded-xl p-6 border-2 border-blue-100 dark:border-blue-900/30">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="font-semibold text-lg text-foreground">O que você vai aprender</h3>
                  </div>
                  <div className="pl-11">
                    <List items={course.learning_points} />
                  </div>
                </div>
              )}

              {course.objectives && course.objectives.length > 0 && (
                <div className="bg-gradient-to-br from-indigo-50/50 to-purple-50/30 dark:from-indigo-950/20 dark:to-purple-950/10 rounded-xl p-6 border-2 border-indigo-100 dark:border-indigo-900/30">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                      <Target className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="font-semibold text-lg text-foreground">Objetivos</h3>
                  </div>
                  <div className="pl-11">
                    <List items={course.objectives} />
                  </div>
                </div>
              )}

              {course.target_audience.length > 0 && (
                <div className="bg-gradient-to-br from-green-50/50 to-emerald-50/30 dark:from-green-950/20 dark:to-emerald-950/10 rounded-xl p-6 border-2 border-green-100 dark:border-green-900/30">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
                      <Users className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="font-semibold text-lg text-foreground">Público-alvo</h3>
                  </div>
                  <div className="pl-11">
                    <List items={course.target_audience} />
                  </div>
                </div>
              )}

              {course.program_sections.length > 0 && (
                <div className="bg-gradient-to-br from-amber-50/50 to-orange-50/30 dark:from-amber-950/20 dark:to-orange-950/10 rounded-xl p-6 border-2 border-amber-100 dark:border-amber-900/30">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                      <ListChecks className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="font-semibold text-lg text-foreground">Conteúdo Programático</h3>
                  </div>
                  <div className="pl-11">
                    <ProgramList sections={course.program_sections} />
                  </div>
                </div>
              )}

              {course.methodology && (
                <div className="bg-gradient-to-br from-teal-50/50 to-cyan-50/30 dark:from-teal-950/20 dark:to-cyan-950/10 rounded-xl p-6 border-2 border-teal-100 dark:border-teal-900/30">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="font-semibold text-lg text-foreground">Metodologia e Vantagens do Formato</h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed pl-11">{course.methodology}</p>
                </div>
              )}

              {course.deliverables.length > 0 && (
                <div className="bg-gradient-to-br from-emerald-50/50 to-teal-50/30 dark:from-emerald-950/20 dark:to-teal-950/10 rounded-xl p-6 border-2 border-emerald-100 dark:border-emerald-900/30">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0">
                      <Award className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="font-semibold text-lg text-foreground">Entregáveis / O que inclui</h3>
                  </div>
                  <div className="pl-11">
                    <List items={course.deliverables} />
                  </div>
                </div>
              )}

              {course.speakers.length > 0 && (
                <div className="bg-gradient-to-br from-violet-50/50 to-purple-50/30 dark:from-violet-950/20 dark:to-purple-950/10 rounded-xl p-6 border-2 border-violet-100 dark:border-violet-900/30">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                      <Users className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="font-semibold text-lg text-foreground">Palestrantes</h3>
                  </div>
                  <div className="pl-11">
                    <Speakers speakers={course.speakers} />
                  </div>
                </div>
              )}

              {(dateRange || course.schedule_details || course.address) && (
                <DrawerSection title="Datas, horários e local detalhados">
                  {dateRange && (
                    <p className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      {dateRange}
                    </p>
                  )}
                  {course.schedule_details && <p>{course.schedule_details}</p>}
                  {course.address && (
                    <p className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      {course.address}
                    </p>
                  )}
                </DrawerSection>
              )}

              <DrawerSection title="Investimento">
                <Investment investment={course.investment_details} />
              </DrawerSection>

              {course.reasons_to_attend.length > 0 && (
                <DrawerSection title="Por que participar do evento JML">
                  <List items={course.reasons_to_attend} />
                </DrawerSection>
              )}

              {(course.registration_guidelines.length > 0 || course.payment_methods.length > 0) && (
                <DrawerSection title="Orientações para inscrição e pagamento">
                  {course.registration_guidelines.length > 0 && (
                    <List items={course.registration_guidelines} />
                  )}
                  {course.registration_guidelines.length === 0 && course.payment_methods.length > 0 && (
                    <List items={course.payment_methods} />
                  )}
                </DrawerSection>
              )}

              {course.contacts && (
                <DrawerSection title="Central de relacionamento">
                  <div className="space-y-2">
                    {course.contacts.email && (
                      <p className="flex items-center gap-2 text-sm">
                        <LinkIcon className="w-4 h-4 text-primary" />
                        {course.contacts.email}
                      </p>
                    )}
                    {course.contacts.phone && <p>{course.contacts.phone}</p>}
                    {course.contacts.whatsapp && <p>WhatsApp: {course.contacts.whatsapp}</p>}
                    {course.contacts.website && (
                      <a
                        href={course.contacts.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline"
                      >
                        {course.contacts.website}
                      </a>
                    )}
                    {course.contacts.hours && <p>{course.contacts.hours}</p>}
                  </div>
                </DrawerSection>
              )}

              <Separator />

              <div className="flex flex-col gap-2">
                {course.links.landing && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={course.links.landing} target="_blank" rel="noopener noreferrer">
                      <LinkIcon className="w-4 h-4 mr-2" /> Ver Landing Page
                    </a>
                  </Button>
                )}
                {course.links.pdf && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={course.links.pdf} target="_blank" rel="noopener noreferrer">
                      <FileText className="w-4 h-4 mr-2" /> Download PDF
                    </a>
                  </Button>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {relatedCourses.length > 0 && (
            <div className="space-y-4">
              <Separator />
              <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                Cursos Relacionados
              </h4>
              <div className="space-y-2">
                {relatedCourses.map(related => (
                  <button
                    key={related.id}
                    onClick={() => onCourseClick(related)}
                    className="w-full text-left p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/30 transition-all group"
                  >
                    <h5 className="font-medium text-sm mb-1 group-hover:text-primary transition-colors">
                      {related.title}
                    </h5>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {related.summary}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
