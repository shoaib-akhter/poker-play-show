import { useState, useEffect, useCallback } from 'react';
import { getAllMeta } from '@/lib/db';
import { HandMeta } from '@/types/poker';

export type FilterMode = 'all' | 'won' | 'lost';
export type SortField = 'playedAt' | 'heroResult';
export type SortDir = 'asc' | 'desc';

export interface LibraryState {
  hands: HandMeta[];
  filtered: HandMeta[];
  filter: FilterMode;
  sortField: SortField;
  sortDir: SortDir;
  isLoading: boolean;
  totalNet: number;
  wonCount: number;
  lostCount: number;
}

export function useHandLibrary() {
  const [all, setAll] = useState<HandMeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterMode>('all');
  const [sortField, setSortField] = useState<SortField>('playedAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const load = useCallback(async () => {
    setIsLoading(true);
    const metas = await getAllMeta();
    setAll(metas);
    setIsLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = all
    .filter(h => {
      if (filter === 'won') return h.heroResult > 0;
      if (filter === 'lost') return h.heroResult < 0;
      return true;
    })
    .sort((a, b) => {
      const diff = a[sortField] - b[sortField];
      return sortDir === 'asc' ? diff : -diff;
    });

  const totalNet = all.reduce((s, h) => s + h.heroResult, 0);
  const wonCount = all.filter(h => h.heroResult > 0).length;
  const lostCount = all.filter(h => h.heroResult < 0).length;

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  }

  return {
    filtered,
    filter,
    setFilter,
    sortField,
    sortDir,
    toggleSort,
    isLoading,
    reload: load,
    totalCount: all.length,
    wonCount,
    lostCount,
    totalNet,
  };
}
