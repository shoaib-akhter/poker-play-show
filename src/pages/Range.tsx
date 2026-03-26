import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Spade, BarChart2, Library } from 'lucide-react';
import { getAllHandStats } from '@/lib/db';
import { HandStats } from '@/types/poker';
import { HandMatrix, HeatmapMode } from '@/components/range/HandMatrix';
import { HandListPanel } from '@/components/range/HandListPanel';

export default function Range() {
  const navigate = useNavigate();
  const [allStats, setAllStats] = useState<HandStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStakes, setSelectedStakes] = useState<string>('All');
  const [lastN, setLastN] = useState<number | null>(null);
  const [heatmapMode, setHeatmapMode] = useState<HeatmapMode>('pnl');
  const [selectedCombo, setSelectedCombo] = useState<string | null>(null);
  const [selectedHands, setSelectedHands] = useState<HandStats[]>([]);

  const load = useCallback(async () => {
    setIsLoading(true);
    const stats = await getAllHandStats();
    setAllStats(stats);
    setIsLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const stakesOptions = useMemo(() => {
    const set = new Set(allStats.map(h => h.stakes));
    return ['All', ...Array.from(set).sort()];
  }, [allStats]);

  const filtered = useMemo(() => {
    let result = selectedStakes === 'All' ? allStats : allStats.filter(h => h.stakes === selectedStakes);
    if (lastN) result = [...result].sort((a, b) => b.playedAt - a.playedAt).slice(0, lastN);
    return result;
  }, [allStats, selectedStakes, lastN]);

  const handsWithCards = useMemo(() => filtered.filter(h => h.heroHoleCards), [filtered]);

  function handleCellClick(key: string, hands: HandStats[]) {
    setSelectedCombo(key);
    setSelectedHands(hands);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <Spade className="w-5 h-5 text-[hsl(var(--gold))]" />
        <h1 className="text-lg font-bold flex-1">Range Analysis</h1>
        <Link to="/library">
          <Button variant="ghost" size="sm" className="gap-2">
            <Library className="w-4 h-4" />
            Library
          </Button>
        </Link>
        <Link to="/stats">
          <Button variant="ghost" size="sm" className="gap-2">
            <BarChart2 className="w-4 h-4" />
            Statistics
          </Button>
        </Link>
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

      <div className="flex-1 p-6 max-w-5xl mx-auto w-full space-y-4">
        {isLoading ? (
          <div className="text-center text-muted-foreground py-20">Loading…</div>
        ) : allStats.length === 0 ? (
          <div className="text-center text-muted-foreground py-20 space-y-2">
            <p>No hand data found.</p>
            <p className="text-sm">
              Import hand histories in the{' '}
              <Link to="/library" className="underline">Library</Link> first.
            </p>
          </div>
        ) : handsWithCards.length === 0 ? (
          <div className="text-center text-muted-foreground py-20 space-y-2">
            <p>No hole card data available.</p>
            <p className="text-sm">
              Recalculate stats in{' '}
              <Link to="/stats" className="underline">Statistics</Link> to populate range data.
            </p>
          </div>
        ) : (
          <>
            {/* Heatmap toggle + summary */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <p className="text-sm text-muted-foreground">
                {handsWithCards.length.toLocaleString()} hands with hole card data
              </p>
              <div className="flex items-center gap-1 p-1 rounded-lg bg-muted">
                {(['pnl', 'winrate', 'frequency'] as HeatmapMode[]).map(mode => (
                  <Button
                    key={mode}
                    variant={heatmapMode === mode ? 'default' : 'ghost'}
                    size="sm"
                    className="h-7 px-3 text-xs"
                    onClick={() => setHeatmapMode(mode)}
                  >
                    {mode === 'pnl' ? 'P&L' : mode === 'winrate' ? 'Win%' : 'Frequency'}
                  </Button>
                ))}
              </div>
            </div>

            <HandMatrix
              stats={handsWithCards}
              heatmapMode={heatmapMode}
              onCellClick={handleCellClick}
            />

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
              {heatmapMode === 'pnl' && (
                <>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm" style={{ background: 'rgba(34,197,94,0.7)' }} />
                    Profitable
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm" style={{ background: 'rgba(239,68,68,0.7)' }} />
                    Losing
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-muted border border-border/30" />
                    No data
                  </span>
                </>
              )}
              {heatmapMode === 'winrate' && (
                <>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm" style={{ background: 'rgba(34,197,94,0.7)' }} />
                    High win%
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm" style={{ background: 'rgba(239,68,68,0.7)' }} />
                    Low win%
                  </span>
                </>
              )}
              {heatmapMode === 'frequency' && (
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm" style={{ background: 'rgba(59,130,246,0.7)' }} />
                  Darker = played more often
                </span>
              )}
              <span className="ml-auto">Hover a cell for details · Click to view hands</span>
            </div>
          </>
        )}
      </div>

      <HandListPanel
        comboKey={selectedCombo}
        hands={selectedHands}
        onClose={() => setSelectedCombo(null)}
      />
    </div>
  );
}
