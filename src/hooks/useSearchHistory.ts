import { useState, useEffect } from 'react';
import { FilterOptions } from './useSearch';

export type HistoryEntry = {
  query: string;
  filters: FilterOptions;
  timestamp: number;
};

const STORAGE_KEY = 'jml_search_history';
const MAX_HISTORY = 5;

export function useSearchHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    try {
      const parsed = JSON.parse(stored) as HistoryEntry[];
      return parsed.map(entry => ({
        ...entry,
        filters: {
          // Migração da estrutura antiga para nova
          companies: entry.filters.companies || [],
          course_types: entry.filters.course_types || [],
          segments: entry.filters.segments || [],
          levels: entry.filters.levels || [],
        },
      }));
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  const addToHistory = (query: string, filters: FilterOptions) => {
    if (!query.trim()) return;
    
    setHistory(prev => {
      const newEntry: HistoryEntry = { query, filters, timestamp: Date.now() };
      const filtered = prev.filter(e => e.query !== query);
      return [newEntry, ...filtered].slice(0, MAX_HISTORY);
    });
  };

  const clearHistory = () => setHistory([]);

  return { history, addToHistory, clearHistory };
}
