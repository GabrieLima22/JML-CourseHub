import { Clock, GraduationCap } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Course } from '@/hooks/useSearch';

type CourseCardProps = {
  course: Course;
  onClick: () => void;
  matchReason?: string;
};

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

export function CourseCard({ course, onClick, matchReason }: CourseCardProps) {
  return (
    <Card
      onClick={onClick}
      className="group cursor-pointer p-6 rounded-2xl border border-border hover:border-primary/50 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] bg-card"
    >
      <div className="flex flex-col gap-3">
        {matchReason && (
          <Badge variant="outline" className="self-start text-xs font-normal">
            {matchReason}
          </Badge>
        )}
        
        <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors">
          {course.title}
        </h3>
        
        <p className="text-sm text-muted-foreground line-clamp-2">
          {course.summary}
        </p>

        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="outline" className="text-xs font-medium">
            {companyLabels[course.company] || course.company}
          </Badge>
          <Badge variant="outline" className="text-xs font-medium">
            {courseTypeLabels[course.course_type] || course.course_type}
          </Badge>
          {course.segment && (
            <Badge variant="secondary" className="text-xs font-medium">
              {course.segment}
            </Badge>
          )}
          {course.modality.slice(0, 2).map(mod => (
            <Badge key={mod} variant="secondary" className="text-xs">
              {mod}
            </Badge>
          ))}
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {course.duration_hours}h
          </span>
        </div>
      </div>
    </Card>
  );
}
