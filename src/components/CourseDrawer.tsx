import { useState } from 'react';
import { X, Copy, FileText, Link as LinkIcon, Clock, GraduationCap, Users } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { Course } from '@/hooks/useSearch';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type CourseDrawerProps = {
  course: Course | null;
  open: boolean;
  onClose: () => void;
  relatedCourses: Course[];
  onCourseClick: (course: Course) => void;
};

const areaColors: Record<string, string> = {
  'Agenda JML': 'bg-category-agenda/10 text-category-agenda border-category-agenda/20',
  'Setorial': 'bg-category-setorial/10 text-category-setorial border-category-setorial/20',
  'Soft Skills': 'bg-category-soft/10 text-category-soft border-category-soft/20',
  'Corporativo': 'bg-category-corporativo/10 text-category-corporativo border-category-corporativo/20',
};

export function CourseDrawer({ course, open, onClose, relatedCourses, onCourseClick }: CourseDrawerProps) {
  const [activeTab, setActiveTab] = useState('breve');
  const { toast } = useToast();

  if (!course) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copiado!',
      description: `${label} copiado para a área de transferência.`,
    });
  };

  const pitchText = `${course.title}\n\n${course.summary}\n\nDuração: ${course.duration_hours}h | Nível: ${course.level} | Modalidades: ${course.modality.join(', ')}`;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto p-0">
        <SheetHeader className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 p-6 pb-4 border-b">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <SheetTitle className="text-2xl font-semibold leading-tight mb-3">
                {course.title}
              </SheetTitle>
              <div className="flex flex-wrap gap-2">
                <Badge className={cn('text-xs', areaColors[course.area] || '')}>
                  {course.area}
                </Badge>
                {course.modality.map(mod => (
                  <Badge key={mod} variant="secondary" className="text-xs">
                    {mod}
                  </Badge>
                ))}
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </SheetHeader>

        <div className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="breve">Visão Breve</TabsTrigger>
              <TabsTrigger value="detalhada">Visão Detalhada</TabsTrigger>
            </TabsList>

            <TabsContent value="breve" className="space-y-6">
              <div className="bg-muted/30 rounded-xl p-5 border border-border">
                <p className="text-base leading-relaxed">{course.summary}</p>
              </div>

              <div>
                <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">
                  Principais Benefícios
                </h4>
                <ul className="space-y-2">
                  {course.deliverables.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-primary mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Duração
                  </span>
                  <span className="font-semibold">{course.duration_hours}h</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5" />
                    Nível
                  </span>
                  <span className="font-semibold">{course.level}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    Modalidades
                  </span>
                  <span className="font-semibold text-xs">{course.modality.length}</span>
                </div>
              </div>

              <Separator />

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => copyToClipboard(pitchText, 'Pitch')}
                  className="flex-1"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar Pitch
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(course.summary, 'Resumo')}
                  className="flex-1"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Copiar Resumo
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="detalhada" className="space-y-6">
              <div>
                <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">
                  Ementa Completa
                </h4>
                <div className="bg-muted/30 rounded-xl p-5 border border-border">
                  <p className="text-sm leading-relaxed whitespace-pre-line">
                    {course.description}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">
                  Público-Alvo
                </h4>
                <p className="text-sm text-muted-foreground">{course.target_audience}</p>
              </div>

              <div>
                <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">
                  Entregáveis
                </h4>
                <ul className="space-y-2">
                  {course.deliverables.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-primary mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Separator />

              <div className="flex flex-col gap-2">
                {course.links.landing && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={course.links.landing} target="_blank" rel="noopener noreferrer">
                      <LinkIcon className="w-4 h-4 mr-2" />
                      Ver Landing Page
                    </a>
                  </Button>
                )}
                {course.links.pdf && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={course.links.pdf} target="_blank" rel="noopener noreferrer">
                      <FileText className="w-4 h-4 mr-2" />
                      Download PDF
                    </a>
                  </Button>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {relatedCourses.length > 0 && (
            <>
              <Separator className="my-6" />
              <div>
                <h4 className="font-semibold mb-4 text-sm uppercase tracking-wide text-muted-foreground">
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
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
