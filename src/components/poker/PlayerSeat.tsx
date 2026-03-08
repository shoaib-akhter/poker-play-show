import { cn } from '@/lib/utils';
import { Player, ActionType } from '@/types/poker';
import { PlayingCard } from './PlayingCard';

interface PlayerSeatProps {
  player: Player;
  isActive: boolean;
  showCards: boolean;
  position: { top: string; left: string };
  isWinner?: boolean;
  winAmount?: number;
  lastAction?: { type: ActionType; amount?: number };
}

const actionLabels: Partial<Record<ActionType, { label: string; color: string }>> = {
  fold: { label: 'FOLD', color: 'bg-[hsl(var(--action-fold))]' },
  check: { label: 'CHECK', color: 'bg-[hsl(var(--action-check))]' },
  call: { label: 'CALL', color: 'bg-[hsl(var(--action-call))]' },
  bet: { label: 'BET', color: 'bg-[hsl(var(--action-bet))]' },
  raise: { label: 'RAISE', color: 'bg-[hsl(var(--action-raise))]' },
  post_blind: { label: 'BLIND', color: 'bg-[hsl(var(--action-check))]' },
};

export function PlayerSeat({ player, isActive, showCards, position, isWinner, winAmount, lastAction }: PlayerSeatProps) {
  const actionInfo = lastAction ? actionLabels[lastAction.type] : null;

  return (
    <div
      className="absolute flex flex-col items-center gap-1 -translate-x-1/2 -translate-y-1/2 z-10"
      style={{ top: position.top, left: position.left }}
    >
      {/* Cards */}
      <div className="flex gap-0.5 mb-1">
        {showCards && player.holeCards ? (
          <>
            <PlayingCard card={player.holeCards[0]} small />
            <PlayingCard card={player.holeCards[1]} small />
          </>
        ) : !player.isFolded ? (
          <>
            <PlayingCard faceDown small />
            <PlayingCard faceDown small />
          </>
        ) : null}
      </div>

      {/* Player info box */}
      <div className={cn(
        'rounded-lg px-3 py-1.5 min-w-[100px] text-center transition-all duration-300',
        'bg-[hsl(var(--card))] border-2 shadow-lg',
        isActive && !player.isFolded && 'border-[hsl(var(--gold))] shadow-[0_0_15px_hsl(var(--gold)/0.4)]',
        isWinner && 'border-[hsl(var(--gold))] shadow-[0_0_20px_hsl(var(--gold)/0.6)] bg-[hsl(var(--gold)/0.1)]',
        player.isFolded && 'opacity-40 border-[hsl(var(--border))]',
        !isActive && !player.isFolded && !isWinner && 'border-[hsl(var(--border))]',
      )}>
        <div className="font-semibold text-xs text-[hsl(var(--foreground))] truncate">{player.name}</div>
        <div className="mono text-xs text-[hsl(var(--muted-foreground))]">
          ${player.stackSize.toFixed(2)}
        </div>
        {isWinner && winAmount !== undefined && (
          <div className="text-xs font-bold text-green-400 mt-0.5">+${winAmount.toFixed(2)}</div>
        )}
      </div>

      {/* Action label */}
      {actionInfo && !player.isFolded && (
        <div className={cn(
          'rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide shadow-md',
          'text-[hsl(var(--foreground))]',
          actionInfo.color,
        )}>
          {actionInfo.label}{lastAction?.amount ? ` $${lastAction.amount.toFixed(2)}` : ''}
        </div>
      )}
      {player.isFolded && (
        <div className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide shadow-md bg-[hsl(var(--action-fold))] text-[hsl(var(--primary-foreground))]">
          FOLD
        </div>
      )}

      {/* Dealer button */}
      {player.isDealer && (
        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[hsl(var(--gold))] text-[hsl(var(--primary-foreground))] text-[10px] font-bold flex items-center justify-center shadow-md">
          D
        </div>
      )}
    </div>
  );
}
