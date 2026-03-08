import { cn } from '@/lib/utils';
import { ReplayStep } from '@/types/poker';
import { PlayerSeat } from './PlayerSeat';
import { PlayingCard } from './PlayingCard';
import { estimateEquity } from '@/lib/equityCalculator';

// 6-max seat positions clockwise around the oval table
const SEAT_POSITIONS = [
  { top: '85%', left: '30%' },   // seat 0 - bottom left
  { top: '45%', left: '5%' },    // seat 1 - left
  { top: '8%', left: '30%' },    // seat 2 - top left
  { top: '8%', left: '70%' },    // seat 3 - top right
  { top: '45%', left: '95%' },   // seat 4 - right
  { top: '85%', left: '70%' },   // seat 5 - bottom right
];

interface PokerTableProps {
  step: ReplayStep;
  winnerNames?: string[];
  winners?: { playerName: string; amount: number; hand?: string }[];
}

export function PokerTable({ step, winnerNames = [], winners = [] }: PokerTableProps) {
  const equities = estimateEquity(step.players, step.communityCards, step.street);

  return (
    <div className="relative w-full aspect-[16/10] max-w-[800px] mx-auto">
      {/* Outer rail */}
      <div className={cn(
        'absolute inset-0 rounded-[50%] shadow-2xl',
        'bg-gradient-to-b from-[hsl(var(--rail-light))] to-[hsl(var(--rail))]',
        'border-4 border-[hsl(25,30%,18%)]',
      )} />

      {/* Felt surface */}
      <div className={cn(
        'absolute inset-[14px] rounded-[50%]',
        'bg-gradient-to-b from-[hsl(var(--felt-light))] to-[hsl(var(--felt-dark))]',
        'border-2 border-[hsl(var(--felt)/0.5)]',
        'shadow-inner',
      )}>
        {/* Felt texture overlay */}
        <div className="absolute inset-0 rounded-[50%] opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, transparent 0%, hsl(var(--felt-dark) / 0.3) 100%)`,
          }}
        />

        {/* Center line / branding */}
        <div className="absolute inset-[20%] rounded-[50%] border border-[hsl(var(--felt-light)/0.3)]" />
      </div>

      {/* Pot display */}
      {step.potSize > 0 && (
        <div className="absolute top-[38%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
          <div className="bg-[hsl(var(--card))/0.9] rounded-full px-4 py-1 shadow-lg border border-[hsl(var(--gold)/0.3)]">
            <span className="mono text-sm font-semibold text-[hsl(var(--gold))]">
              Pot: ${step.potSize.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* Community cards */}
      <div className="absolute top-[50%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-1.5 z-20">
        {step.communityCards.map((card, i) => (
          <PlayingCard key={`${card.rank}${card.suit}-${i}`} card={card} />
        ))}
        {/* Empty card slots */}
        {Array.from({ length: Math.max(0, 5 - step.communityCards.length) }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="w-12 h-[68px] rounded-md border border-[hsl(var(--felt-light)/0.2)] bg-[hsl(var(--felt-dark)/0.3)]"
          />
        ))}
      </div>

      {/* Player seats */}
      {Array.from({ length: 6 }).map((_, i) => {
        const player = step.players.find(p => p.seatIndex === i);
        if (!player) {
          return (
            <div
              key={`empty-seat-${i}`}
              className="absolute flex flex-col items-center gap-1 -translate-x-1/2 -translate-y-1/2 z-10"
              style={{ top: SEAT_POSITIONS[i].top, left: SEAT_POSITIONS[i].left }}
            >
              <div className="rounded-lg px-3 py-1.5 min-w-[100px] text-center bg-[hsl(var(--card))] border-2 border-[hsl(var(--border))] opacity-30 shadow-lg">
                <div className="font-semibold text-xs text-[hsl(var(--muted-foreground))]">Seat {i + 1}</div>
                <div className="text-[10px] text-[hsl(var(--muted-foreground))] italic">Sitting Out</div>
              </div>
            </div>
          );
        }
        const winInfo = winners.find(w => w.playerName === player.name);
        return (
          <PlayerSeat
            key={player.name}
            player={player}
            isActive={step.activePlayerName === player.name}
            showCards={
              step.street === 'showdown' && !!player.holeCards
              || (step.activePlayerName === player.name && !!player.holeCards)
              || !!player.holeCards
            }
            equity={equities[player.name]}
            position={SEAT_POSITIONS[player.seatIndex]}
            isWinner={winnerNames.includes(player.name)}
            winAmount={winInfo?.amount}
          />
        );
      })}
    </div>
  );
}
