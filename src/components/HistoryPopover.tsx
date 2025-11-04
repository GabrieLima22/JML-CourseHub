import { History, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { useSearchHistory, HistoryEntry } from '@/hooks/useSearchHistory';

type HistoryPopoverProps = {
  onSelectHistory: (entry: HistoryEntry) => void;
};

export function HistoryPopover({ onSelectHistory }: HistoryPopoverProps) {
  const { history, clearHistory } = useSearchHistory();

  if (history.length === 0) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-xl">
          <History className="w-4 h-4 mr-2" />
          Histórico
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 pb-2">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-sm">Buscas Recentes</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearHistory}
              className="h-7 text-xs text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Limpar
            </Button>
          </div>
        </div>
        <Separator />
        <div className="max-h-64 overflow-y-auto">
          {history.map((entry, idx) => (
            <button
              key={idx}
              onClick={() => onSelectHistory(entry)}
              className="w-full text-left px-4 py-3 hover:bg-muted transition-colors border-b border-border last:border-b-0"
            >
              <div className="text-sm font-medium mb-1">{entry.query}</div>
              {(entry.filters.modalities.length > 0 || entry.filters.areas.length > 0) && (
                <div className="text-xs text-muted-foreground">
                  Filtros: {[...entry.filters.modalities, ...entry.filters.areas].join(', ')}
                </div>
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
