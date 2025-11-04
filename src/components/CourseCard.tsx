import { Clock, GraduationCap } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Course } from '@/hooks/useSearch';
import { cn } from '@/lib/utils';

type CourseCardProps = {
  course: Course;
  onClick: () => void;
  matchReason?: string;
};

const areaColors: Record<string, string> = {
  'Agenda JML': 'bg-category-agenda/10 text-category-agenda border-category-agenda/20',
  'Setorial': 'bg-category-setorial/10 text-category-setorial border-category-setorial/20',
  'Soft Skills': 'bg-category-soft/10 text-category-soft border-category-soft/20',
  'Corporativo': 'bg-category-corporativo/10 text-category-corporativo border-category-corporativo/20',
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
          <Badge className={cn('text-xs', areaColors[course.area] || '')}>
            {course.area}
          </Badge>
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
          <span className="flex items-center gap-1">
            <GraduationCap className="w-3.5 h-3.5" />
            {course.level}
          </span>
        </div>
      </div>
    </Card>
  );
}
