import { PositionRow } from '@/lib/statsAggregator';

interface PositionStatsProps {
  rows: PositionRow[];
  onPositionClick?: (position: string) => void;
}

export function PositionStats({ rows, onPositionClick }: PositionStatsProps) {
  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold">By Position</h2>
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 text-muted-foreground text-xs">
              <th className="text-left px-3 py-2 font-medium">Pos</th>
              <th className="text-right px-3 py-2 font-medium">Hands</th>
              <th className="text-right px-3 py-2 font-medium">VPIP</th>
              <th className="text-right px-3 py-2 font-medium">PFR</th>
              <th className="text-right px-3 py-2 font-medium">RFI</th>
              <th className="text-right px-3 py-2 font-medium">3-Bet</th>
              <th className="text-right px-3 py-2 font-medium">Net</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const netSign = row.netWon >= 0 ? '+' : '';
              const netColor = row.netWon >= 0 ? 'text-green-500' : 'text-red-500';
              return (
                <tr
                  key={row.position}
                  className={`${i % 2 === 0 ? 'bg-background' : 'bg-muted/20'} ${onPositionClick ? 'cursor-pointer hover:bg-muted/40 transition-colors' : ''}`}
                  onClick={() => onPositionClick?.(row.position)}
                  title={onPositionClick ? `View ${row.position} hands in Library` : undefined}
                >
                  <td className="px-3 py-2 font-medium">{row.position}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">
                    {row.hands === 0 ? '—' : row.hands.toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {row.hands === 0 ? '—' : `${row.vpip.toFixed(0)}%`}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {row.hands === 0 ? '—' : `${row.pfr.toFixed(0)}%`}
                  </td>
                  <td className="px-3 py-2 text-right text-muted-foreground">
                    {row.position === 'BB'
                      ? '—'
                      : row.hands === 0
                      ? '—'
                      : `${row.rfi.toFixed(0)}%`}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {row.hands === 0 ? '—' : `${row.threeBetPct.toFixed(1)}%`}
                  </td>
                  <td className={`px-3 py-2 text-right font-medium ${row.hands === 0 ? 'text-muted-foreground' : netColor}`}>
                    {row.hands === 0 ? '—' : `${netSign}$${row.netWon.toFixed(2)}`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
