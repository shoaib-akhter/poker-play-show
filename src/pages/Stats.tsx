import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Spade, BarChart2, Library, Grid2x2, RefreshCw } from 'lucide-react';
import { getAllHandStats, getHandCount, getHandStatsCount } from '@/lib/db';
import { aggregateStats, aggregateByPosition } from '@/lib/statsAggregator';
import { useRecalcStats } from '@/hooks/useRecalcStats';
import { PnlChart } from '@/components/stats/PnlChart';
import { GeneralStats } from '@/components/stats/GeneralStats';
import { PositionStats } from '@/components/stats/PositionStats';
import { HandStats } from '@/types/poker';

export default function Stats() {
  const navigate = useNavigate();
  const [allStats, setAllStats] = useState<HandStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mismatch, setMismatch] = useState(0); // how many hands missing stats
  const [selectedStakes, setSelectedStakes] = useState<string>('All');
  const [lastN, setLastN] = useState<number | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    const [stats, handCount, statsCount] = await Promise.all([
      getAllHandStats(),
      getHandCount(),
      getHandStatsCount(),
    ]);
    setAllStats(stats);
    setMismatch(Math.max(0, handCount - statsCount));
    setIsLoading(false);
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const { state: recalcState, runRecalc } = useRecalcStats(reload);

  // Available stakes options
  const stakesOptions = useMemo(() => {
    const set = new Set(allStats.map(h => h.stakes));
    return ['All', ...Array.from(set).sort()];
  }, [allStats]);

  // Filter by stakes then last N
  const filtered = useMemo(() => {
    let result = selectedStakes === 'All' ? allStats : allStats.filter(h => h.stakes === selectedStakes);
    if (lastN) result = [...result].sort((a, b) => b.playedAt - a.playedAt).slice(0, lastN);
    return result;
  }, [allStats, selectedStakes, lastN]);

  const general = useMemo(() => aggregateStats(filtered), [filtered]);
  const byPosition = useMemo(() => aggregateByPosition(filtered), [filtered]);

  const recalcProgress = recalcState.total > 0
    ? Math.round((recalcState.processed / recalcState.total) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <Spade className="w-5 h-5 text-[hsl(var(--gold))]" />
        <h1 className="text-lg font-bold flex-1">Statistics</h1>
        <Link to="/library">
          <Button variant="ghost" size="sm" className="gap-2">
            <Library className="w-4 h-4" />
            Library
          </Button>
        </Link>
        <Link to="/range">
          <Button variant="ghost" size="sm" className="gap-2">
            <Grid2x2 className="w-4 h-4" />
            Range
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          disabled={recalcState.isRunning}
          onClick={() => void runRecalc()}
          title="Recalculate all stats"
        >
          <RefreshCw className={`w-4 h-4 ${recalcState.isRunning ? 'animate-spin' : ''}`} />
          Recalculate
        </Button>
      </div>

      {/* Stakes filter bar */}
      {stakesOptions.length > 1 && (
        <div className="flex items-center gap-2 px-6 py-2 border-b border-border bg-muted/20">
          <span className="text-xs text-muted-foreground mr-1">Stakes:</span>
          {stakesOptions.map(s => (
            <Button
              key={s}
              variant={selectedStakes === s ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedStakes(s)}
            >
              {s === 'All' ? 'All Stakes' : s.replace(/\s*USD\s*$/i, '')}
            </Button>
          ))}
        </div>
      )}

      {/* Last N hands filter bar */}
      <div className="flex items-center gap-2 px-6 py-2 border-b border-border bg-muted/20">
        <span className="text-xs text-muted-foreground mr-1">Last:</span>
        {([null, 500, 1000, 3000, 5000, 10000] as (number | null)[]).map(n => (
          <Button
            key={n ?? 'all'}
            variant={lastN === n ? 'default' : 'outline'}
            size="sm"
            onClick={() => setLastN(n)}
          >
            {n === null ? 'All' : n >= 1000 ? `${n / 1000}k` : String(n)}
          </Button>
        ))}
      </div>

      <div className="flex-1 p-6 max-w-5xl mx-auto w-full space-y-8">
        {/* Recalc banner */}
        {mismatch > 0 && !recalcState.isRunning && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-sm">
            <BarChart2 className="w-4 h-4 text-yellow-500 flex-shrink-0" />
            <span className="text-yellow-600 dark:text-yellow-400 flex-1">
              Stats need to be built for {mismatch.toLocaleString()} hand{mismatch !== 1 ? 's' : ''}.
            </span>
            <Button size="sm" onClick={() => void runRecalc()}>Build Now</Button>
          </div>
        )}

        {/* Recalc progress */}
        {recalcState.isRunning && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Building stats…</span>
              <span>{recalcState.processed.toLocaleString()} / {recalcState.total.toLocaleString()}</span>
            </div>
            <Progress value={recalcProgress} className="h-2" />
          </div>
        )}

        {isLoading ? (
          <div className="text-center text-muted-foreground py-20">Loading stats…</div>
        ) : allStats.length === 0 ? (
          <div className="text-center text-muted-foreground py-20 space-y-2">
            <BarChart2 className="w-12 h-12 mx-auto opacity-30" />
            <p>No hand data found.</p>
            <p className="text-sm">Import hand histories in the <Link to="/library" className="underline">Library</Link> first.</p>
          </div>
        ) : (
          <>
            <PnlChart hands={filtered} />
            <GeneralStats stats={general} />
            <PositionStats
              rows={byPosition}
              onPositionClick={pos => {
                const params = new URLSearchParams();
                params.set('position', pos);
                if (selectedStakes !== 'All') params.set('stakes', selectedStakes);
                navigate(`/library?${params.toString()}`);
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
