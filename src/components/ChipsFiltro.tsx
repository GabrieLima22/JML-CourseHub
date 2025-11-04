import { Badge } from './ui/badge';

type ChipsFiltroProps = {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  label?: string;
};

export function ChipsFiltro({ options, selected, onChange, label }: ChipsFiltroProps) {
  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(s => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {label && <span className="text-sm font-medium text-foreground">{label}</span>}
      <div className="flex flex-wrap gap-2">
        {options.map(option => {
          const isSelected = selected.includes(option);
          return (
            <Badge
              key={option}
              variant={isSelected ? 'default' : 'outline'}
              className="cursor-pointer select-none px-4 py-2 rounded-full transition-all hover:scale-105"
              onClick={() => toggleOption(option)}
            >
              {option}
            </Badge>
          );
        })}
      </div>
    </div>
  );
}
