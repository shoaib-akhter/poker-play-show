import { useMemo, useState } from 'react';
import { HandStats } from '@/types/poker';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Button } from '@/components/ui/button';

interface PnlChartProps {
  hands: HandStats[];
}

type YMode = '$' | 'BB';

interface DataPoint {
  index: number;
  cumulativeDollars: number;
  cumulativeBBs: number;
  date: string;
  result: number;
  resultBB: number;
}

export function PnlChart({ hands }: PnlChartProps) {
  const [mode, setMode] = useState<YMode>('$');

  const data = useMemo<DataPoint[]>(() => {
    const sorted = [...hands].sort((a, b) => a.playedAt - b.playedAt);
    let cumDollars = 0;
    let cumBBs = 0;
    return sorted.map((h, i) => {
      cumDollars += h.heroResult;
      cumBBs += h.heroResult / h.bbSize;
      return {
        index: i + 1,
        cumulativeDollars: Math.round(cumDollars * 100) / 100,
        cumulativeBBs: Math.round(cumBBs * 10) / 10,
        date: new Date(h.playedAt).toLocaleDateString(),
        result: h.heroResult,
        resultBB: Math.round((h.heroResult / h.bbSize) * 10) / 10,
      };
    });
  }, [hands]);

  if (data.length === 0) return null;

  const dataKey = mode === '$' ? 'cumulativeDollars' : 'cumulativeBBs';
  const yLabel = mode === '$' ? '$' : 'BB';
  const lastVal = data[data.length - 1];
  const isPositive = (mode === '$' ? lastVal.cumulativeDollars : lastVal.cumulativeBBs) >= 0;

  // X-axis: show ~10 ticks evenly spaced
  const tickCount = Math.min(10, data.length);
  const step = Math.max(1, Math.floor(data.length / tickCount));
  const ticks = data.filter((_, i) => i === 0 || i === data.length - 1 || i % step === 0).map(d => d.index);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Cumulative P&L</h2>
        <div className="flex gap-1">
          <Button size="sm" variant={mode === '$' ? 'default' : 'outline'} onClick={() => setMode('$')}>$</Button>
          <Button size="sm" variant={mode === 'BB' ? 'default' : 'outline'} onClick={() => setMode('BB')}>BB</Button>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="index"
              ticks={ticks}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              label={{ value: 'hands', position: 'insideBottomRight', offset: -5, fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={v => `${v}${mode === '$' ? '' : ''}`}
              label={{ value: yLabel, angle: -90, position: 'insideLeft', fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip
              contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 6, fontSize: 12 }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              formatter={(value: number, _name: string, props: { payload?: DataPoint }) => {
                const row = props.payload;
                if (!row) return [value, yLabel];
                const sign = value >= 0 ? '+' : '';
                const resultStr = mode === '$'
                  ? `${sign}$${row.result.toFixed(2)}`
                  : `${sign}${row.resultBB}BB`;
                return [`${sign}${mode === '$' ? '$' : ''}${value}${mode === 'BB' ? 'BB' : ''} (hand: ${resultStr})`, `Cumulative`];
              }}
              labelFormatter={(label: number, payload) => {
                const row = payload?.[0]?.payload as DataPoint | undefined;
                return `Hand #${label}${row ? ` · ${row.date}` : ''}`;
              }}
            />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={isPositive ? 'hsl(142 76% 45%)' : 'hsl(0 72% 51%)'}
              dot={false}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
