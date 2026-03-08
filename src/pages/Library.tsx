import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Spade, BarChart2, X } from 'lucide-react';
import { ImportZone } from '@/components/library/ImportZone';
import { HandTable } from '@/components/library/HandTable';
import { useImport } from '@/hooks/useImport';
import { useHandLibrary, FilterMode } from '@/hooks/useHandLibrary';

const FILTERS: { label: string; value: FilterMode }[] = [
  { label: 'All', value: 'all' },
  { label: 'Won', value: 'won' },
  { label: 'Lost', value: 'lost' },
];

function formatStakes(stakes: string): string {
  return stakes.replace(/\s*USD\s*$/i, '').trim();
}

export default function Library() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const positionFilter = searchParams.get('position');
  const stakesFilter = searchParams.get('stakes');
  const lastNParam = searchParams.get('last');
  const lastN = lastNParam ? parseInt(lastNParam, 10) : null;

  const library = useHandLibrary({ positionFilter, stakesFilter, lastN });
  const { state: importState, handleFiles } = useImport(library.reload);

  const netSign = library.totalNet >= 0 ? '+' : '';
  const netColor = library.totalNet >= 0 ? 'text-green-500' : 'text-red-500';

  function clearPosition() {
    const next = new URLSearchParams(searchParams);
    next.delete('position');
    setSearchParams(next);
  }

  function setStakes(stakes: string | null) {
    const next = new URLSearchParams(searchParams);
    if (stakes) next.set('stakes', stakes);
    else next.delete('stakes');
    setSearchParams(next);
  }

  function setLastN(n: number | null) {
    const next = new URLSearchParams(searchParams);
    if (n) next.set('last', String(n));
    else next.delete('last');
    setSearchParams(next);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <Spade className="w-5 h-5 text-[hsl(var(--gold))]" />
        <h1 className="text-lg font-bold flex-1">Hand Library</h1>
        <Link to="/stats">
          <Button variant="ghost" size="sm" className="gap-2">
            <BarChart2 className="w-4 h-4" />
            Statistics
          </Button>
        </Link>
      </div>

      <div className="flex-1 p-6 max-w-5xl mx-auto w-full space-y-6">
        {/* Import zone */}
        <ImportZone
          isImporting={importState.isImporting}
          processed={importState.processed}
          total={importState.total}
          onFiles={handleFiles}
        />

        {/* Active filter badges */}
        {(positionFilter || stakesFilter) && (
          <div className="flex items-center gap-2 flex-wrap text-sm">
            <span className="text-muted-foreground">Filtered by:</span>
            {positionFilter && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
                {positionFilter}
                <button onClick={clearPosition} className="hover:text-destructive">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {stakesFilter && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
                {formatStakes(stakesFilter)}
                <button onClick={() => setStakes(null)} className="hover:text-destructive">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}

        {/* Stats bar */}
        {library.totalCount > 0 && (
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="text-foreground font-medium">
              {library.totalCount.toLocaleString()} hands
            </span>
            <span>·</span>
            <span>Won: <span className="text-green-500">{library.wonCount.toLocaleString()}</span></span>
            <span>·</span>
            <span>Lost: <span className="text-red-500">{library.lostCount.toLocaleString()}</span></span>
            <span>·</span>
            <span>
              Net:{' '}
              <span className={netColor}>
                {netSign}${library.totalNet.toFixed(2)}
              </span>
            </span>
          </div>
        )}

        {/* Filters row */}
        {library.totalCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {/* Won/Lost filter */}
            {FILTERS.map(f => (
              <Button
                key={f.value}
                variant={library.filter === f.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => library.setFilter(f.value)}
              >
                {f.label}
              </Button>
            ))}

            {/* Stakes filter */}
            {library.availableStakes.length > 1 && (
              <>
                <div className="w-px h-5 bg-border mx-1" />
                <Button
                  variant={!stakesFilter ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => setStakes(null)}
                >
                  All Stakes
                </Button>
                {library.availableStakes.map(s => (
                  <Button
                    key={s}
                    variant={stakesFilter === s ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => setStakes(s)}
                  >
                    {formatStakes(s)}
                  </Button>
                ))}
              </>
            )}

            {/* Last N hands filter */}
            <div className="w-px h-5 bg-border mx-1" />
            {[null, 500, 1000, 3000, 5000, 10000].map(n => (
              <Button
                key={n ?? 'all'}
                variant={lastN === n ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setLastN(n)}
              >
                {n === null ? 'All' : n >= 1000 ? `${n / 1000}k` : String(n)}
              </Button>
            ))}
          </div>
        )}

        {/* Table */}
        {library.isLoading ? (
          <div className="text-center text-muted-foreground py-12">Loading library…</div>
        ) : library.totalCount === 0 && !positionFilter && !stakesFilter ? (
          <div className="text-center text-muted-foreground py-12">
            Import some hand history files to get started.
          </div>
        ) : library.filtered.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            No hands match the current filters.
          </div>
        ) : (
          <HandTable
            hands={library.filtered}
            sortField={library.sortField}
            sortDir={library.sortDir}
            onToggleSort={library.toggleSort}
          />
        )}
      </div>
    </div>
  );
}
