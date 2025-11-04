import { SearchX } from 'lucide-react';
import { Button } from './ui/button';

type EmptyStateProps = {
  query?: string;
  onSuggestionClick?: (suggestion: string) => void;
};

const suggestions = [
  'contratação direta',
  'dispensa de licitação',
  'pregão eletrônico',
  'gestão de contratos',
  'licitações sustentáveis',
];

export function EmptyState({ query, onSuggestionClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <SearchX className="w-8 h-8 text-muted-foreground" />
      </div>
      
      <h3 className="text-xl font-semibold mb-2">Nenhum curso encontrado</h3>
      
      {query ? (
        <p className="text-muted-foreground text-center max-w-md mb-6">
          Não encontramos cursos para "{query}". Tente ajustar sua busca ou explore nossas sugestões.
        </p>
      ) : (
        <p className="text-muted-foreground text-center max-w-md mb-6">
          Use a barra de busca acima ou experimente uma das sugestões abaixo.
        </p>
      )}

      {onSuggestionClick && (
        <div className="flex flex-wrap gap-2 justify-center max-w-xl">
          {suggestions.map(suggestion => (
            <Button
              key={suggestion}
              variant="outline"
              size="sm"
              onClick={() => onSuggestionClick(suggestion)}
              className="rounded-full"
            >
              {suggestion}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
