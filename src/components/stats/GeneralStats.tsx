import { AggregatedStats } from '@/lib/statsAggregator';

interface GeneralStatsProps {
  stats: AggregatedStats;
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-card border border-border text-center">
      <span className="text-xs text-muted-foreground mb-1">{label}</span>
      <span className="text-lg font-bold text-foreground">{value}</span>
    </div>
  );
}

export function GeneralStats({ stats }: GeneralStatsProps) {
  const netSign = stats.netWon >= 0 ? '+' : '';
  const bb100Sign = stats.bb100 >= 0 ? '+' : '';

  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold">General Stats</h2>
      <div className="grid grid-cols-3 gap-2">
        <StatCell label="Hands" value={stats.hands.toLocaleString()} />
        <StatCell label="Net Won" value={`${netSign}$${stats.netWon.toFixed(2)}`} />
        <StatCell label="BB/100" value={`${bb100Sign}${stats.bb100.toFixed(1)}`} />

        <StatCell label="VPIP" value={`${stats.vpip.toFixed(1)}%`} />
        <StatCell label="PFR" value={`${stats.pfr.toFixed(1)}%`} />
        <StatCell label="3-Bet" value={`${stats.threeBetPct.toFixed(1)}%`} />

        <StatCell label="C-bet" value={`${stats.cbetFlop.toFixed(1)}%`} />
        <StatCell label="Fold/3Bt" value={`${stats.foldTo3BetPct.toFixed(1)}%`} />
        <StatCell label="WTSD" value={`${stats.wtsd.toFixed(1)}%`} />

        <StatCell label="W$SD" value={`${stats.wsd.toFixed(1)}%`} />
        <StatCell label="W$WSF" value={`${stats.wwsf.toFixed(1)}%`} />
        <StatCell label="AF" value={stats.af.toFixed(2)} />
      </div>
    </div>
  );
}
