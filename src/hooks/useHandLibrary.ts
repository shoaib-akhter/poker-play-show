import { useState, useEffect, useCallback, useMemo } from 'react';
import { getAllMeta, getAllHandStats } from '@/lib/db';
import { HandMeta } from '@/types/poker';

export type FilterMode = 'all' | 'won' | 'lost';
export type SortField = 'playedAt' | 'heroResult';
export type SortDir = 'asc' | 'desc';

export interface LibraryOptions {
  positionFilter?: string | null;
  stakesFilter?: string | null;
  lastN?: number | null;
}

export function useHandLibrary(options?: LibraryOptions) {
  const positionFilter = options?.positionFilter ?? null;
  const stakesFilter = options?.stakesFilter ?? null;
  const lastN = options?.lastN ?? null;

  const [all, setAll] = useState<HandMeta[]>([]);
  const [positionIds, setPositionIds] = useState<Set<string> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterMode>('all');
  const [sortField, setSortField] = useState<SortField>('playedAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const load = useCallback(async () => {
    setIsLoading(true);
    const metas = await getAllMeta();
    setAll(metas);

    if (positionFilter) {
      const stats = await getAllHandStats();
      const ids = new Set(
        stats.filter(s => s.heroPosition === positionFilter).map(s => s.handId)
      );
      setPositionIds(ids);
    } else {
      setPositionIds(null);
    }

    setIsLoading(false);
  }, [positionFilter]);

  useEffect(() => { void load(); }, [load]);

  // Base-filtered set: position + stakes + lastN (used for summary counts)
  const baseFiltered = useMemo(() => {
    let result = all;
    if (positionIds) result = result.filter(h => positionIds.has(h.handId));
    if (stakesFilter) result = result.filter(h => h.stakes === stakesFilter);
    if (lastN) result = [...result].sort((a, b) => b.playedAt - a.playedAt).slice(0, lastN);
    return result;
  }, [all, positionIds, stakesFilter, lastN]);

  // Summary stats over the base-filtered set
  const totalNet = useMemo(() => baseFiltered.reduce((s, h) => s + h.heroResult, 0), [baseFiltered]);
  const wonCount = useMemo(() => baseFiltered.filter(h => h.heroResult > 0).length, [baseFiltered]);
  const lostCount = useMemo(() => baseFiltered.filter(h => h.heroResult < 0).length, [baseFiltered]);

  // Available stakes from all hands
  const availableStakes = useMemo(() => {
    const set = new Set(all.map(h => h.stakes));
    return Array.from(set).sort();
  }, [all]);

  // Final filtered + sorted for table display
  const filtered = useMemo(() => {
    return baseFiltered
      .filter(h => {
        if (filter === 'won') return h.heroResult > 0;
        if (filter === 'lost') return h.heroResult < 0;
        return true;
      })
      .sort((a, b) => {
        const diff = a[sortField] - b[sortField];
        return sortDir === 'asc' ? diff : -diff;
      });
  }, [baseFiltered, filter, sortField, sortDir]);

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
    totalCount: baseFiltered.length,
    wonCount,
    lostCount,
    totalNet,
    availableStakes,
  };
}
