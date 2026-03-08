import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Spade } from 'lucide-react';
import { ImportZone } from '@/components/library/ImportZone';
import { HandTable } from '@/components/library/HandTable';
import { useImport } from '@/hooks/useImport';
import { useHandLibrary, FilterMode } from '@/hooks/useHandLibrary';

const FILTERS: { label: string; value: FilterMode }[] = [
  { label: 'All', value: 'all' },
  { label: 'Won', value: 'won' },
  { label: 'Lost', value: 'lost' },
];

export default function Library() {
  const navigate = useNavigate();
  const library = useHandLibrary();
  const { state: importState, handleFiles } = useImport(library.reload);

  const netSign = library.totalNet >= 0 ? '+' : '';
  const netColor = library.totalNet >= 0 ? 'text-green-500' : 'text-red-500';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <Spade className="w-5 h-5 text-[hsl(var(--gold))]" />
        <h1 className="text-lg font-bold">Hand Library</h1>
      </div>

      <div className="flex-1 p-6 max-w-5xl mx-auto w-full space-y-6">
        {/* Import zone */}
        <ImportZone
          isImporting={importState.isImporting}
          processed={importState.processed}
          total={importState.total}
          onFiles={handleFiles}
        />

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

        {/* Filter + sort controls */}
        {library.totalCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
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
          </div>
        )}

        {/* Table */}
        {library.isLoading ? (
          <div className="text-center text-muted-foreground py-12">Loading library…</div>
        ) : library.totalCount === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            Import some hand history files to get started.
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
