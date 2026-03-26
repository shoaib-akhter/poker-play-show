import { useMemo } from 'react';
import { HandStats } from '@/types/poker';
import { getHandComboKey } from '@/lib/handStats';

export type HeatmapMode = 'pnl' | 'winrate' | 'frequency';

interface ComboData {
  key: string;
  count: number;
  netPnl: number;
  wins: number;
  bbSize: number;
}

interface HandMatrixProps {
  stats: HandStats[];
  heatmapMode: HeatmapMode;
  onCellClick: (key: string, hands: HandStats[]) => void;
}

const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'] as const;

// (row, col) → canonical hand label
// row < col: suited (e.g. row=0,col=1 → AKs)
// row === col: pair (e.g. row=0,col=0 → AA)
// row > col: offsuit (e.g. row=1,col=0 → AKo)
function cellLabel(row: number, col: number): string {
  if (row === col) return `${RANKS[row]}${RANKS[row]}`;
  if (row < col) return `${RANKS[row]}${RANKS[col]}s`;
  return `${RANKS[col]}${RANKS[row]}o`;
}

function getCellColor(
  data: ComboData | undefined,
  mode: HeatmapMode,
  maxAbsPnl: number,
  maxCount: number
): string {
  if (!data || data.count === 0) return 'hsl(var(--muted))';

  if (mode === 'pnl') {
    if (maxAbsPnl === 0) return 'hsl(var(--muted))';
    const intensity = Math.min(Math.abs(data.netPnl) / maxAbsPnl, 1) * 0.85;
    return data.netPnl >= 0
      ? `rgba(34, 197, 94, ${intensity})`
      : `rgba(239, 68, 68, ${intensity})`;
  }

  if (mode === 'winrate') {
    const rate = data.wins / data.count;
    if (rate >= 0.5) {
      const intensity = (rate - 0.5) * 2 * 0.85;
      return `rgba(34, 197, 94, ${intensity})`;
    }
    const intensity = (0.5 - rate) * 2 * 0.85;
    return `rgba(239, 68, 68, ${intensity})`;
  }

  // frequency
  if (maxCount === 0) return 'hsl(var(--muted))';
  const intensity = (data.count / maxCount) * 0.85;
  return `rgba(59, 130, 246, ${intensity})`;
}

function formatPnl(pnl: number): string {
  if (pnl === 0) return '$0';
  const sign = pnl > 0 ? '+' : '';
  if (Math.abs(pnl) >= 1000) return `${sign}$${(pnl / 1000).toFixed(1)}k`;
  return `${sign}$${pnl.toFixed(Math.abs(pnl) < 10 ? 1 : 0)}`;
}

export function HandMatrix({ stats, heatmapMode, onCellClick }: HandMatrixProps) {
  const { comboMap, handsByCombo } = useMemo(() => {
    const map = new Map<string, ComboData>();
    const byCombo = new Map<string, HandStats[]>();

    for (const h of stats) {
      if (!h.heroHoleCards) continue;
      const key = getHandComboKey(h.heroHoleCards[0], h.heroHoleCards[1]);
      const won = h.wonAtShowdown || (!h.sawShowdown && h.heroResult > 0);
      const existing = map.get(key);
      if (existing) {
        existing.count++;
        existing.netPnl += h.heroResult;
        if (won) existing.wins++;
      } else {
        map.set(key, { key, count: 1, netPnl: h.heroResult, wins: won ? 1 : 0, bbSize: h.bbSize });
      }
      const arr = byCombo.get(key) ?? [];
      arr.push(h);
      byCombo.set(key, arr);
    }
    return { comboMap: map, handsByCombo: byCombo };
  }, [stats]);

  const maxAbsPnl = useMemo(() => {
    let max = 0;
    for (const d of comboMap.values()) max = Math.max(max, Math.abs(d.netPnl));
    return max;
  }, [comboMap]);

  const maxCount = useMemo(() => {
    let max = 0;
    for (const d of comboMap.values()) max = Math.max(max, d.count);
    return max;
  }, [comboMap]);

  // Build flat array of 169 cells
  const cells = useMemo(() => {
    const result = [];
    for (let row = 0; row < 13; row++) {
      for (let col = 0; col < 13; col++) {
        const label = cellLabel(row, col);
        const data = comboMap.get(label);
        const bg = getCellColor(data, heatmapMode, maxAbsPnl, maxCount);
        const hasData = !!data && data.count > 0;

        let tooltipText = label;
        if (data && data.count > 0) {
          const winRate = ((data.wins / data.count) * 100).toFixed(1);
          const bb100 = data.bbSize > 0
            ? ((data.netPnl / data.bbSize / data.count) * 100).toFixed(1)
            : '—';
          tooltipText = `${label} · ${data.count} hand${data.count !== 1 ? 's' : ''} · ${winRate}% win · ${bb100} BB/100`;
        }

        result.push(
          <div
            key={label}
            title={tooltipText}
            onClick={hasData ? () => onCellClick(label, handsByCombo.get(label) ?? []) : undefined}
            className={[
              'relative flex flex-col items-center justify-center',
              'aspect-square rounded-sm border border-border/30',
              'leading-tight font-medium select-none',
              hasData
                ? 'cursor-pointer hover:brightness-125 hover:border-border/60 transition-all'
                : 'opacity-40',
            ].join(' ')}
            style={{ backgroundColor: bg }}
          >
            <span className="text-foreground/90 font-semibold" style={{ fontSize: '0.6rem' }}>
              {label}
            </span>
            {hasData && (
              <span
                className={data.netPnl >= 0 ? 'text-green-200' : 'text-red-200'}
                style={{ fontSize: '0.52rem' }}
              >
                {formatPnl(data.netPnl)}
              </span>
            )}
          </div>
        );
      }
    }
    return result;
  }, [comboMap, handsByCombo, heatmapMode, maxAbsPnl, maxCount, onCellClick]);

  return (
    <div
      className="grid gap-0.5"
      style={{ gridTemplateColumns: 'repeat(13, minmax(0, 1fr))' }}
    >
      {cells}
    </div>
  );
}
