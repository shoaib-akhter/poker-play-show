import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ReplayStep, ActionType, Street } from '@/types/poker';
import { useEquity } from '@/hooks/useEquity';


const STREETS: Street[] = ['preflop', 'flop', 'turn', 'river', 'showdown'];

const actionColors: Partial<Record<ActionType, string>> = {
  fold: 'text-[hsl(var(--action-fold))]',
  call: 'text-[hsl(var(--action-call))]',
  check: 'text-[hsl(var(--muted-foreground))]',
  bet: 'text-[hsl(var(--action-bet))]',
  raise: 'text-[hsl(var(--action-raise))]',
  post_blind: 'text-[hsl(var(--muted-foreground))]',
};

interface SidePanelProps {
  steps: ReplayStep[];
  currentStep: number;
  currentStepData: ReplayStep;
  heroCards: number[];
  boardCards: number[];
  numOpponents: number;
}

export function SidePanel({ steps, currentStep, currentStepData, heroCards, boardCards, numOpponents }: SidePanelProps) {
  const completedStreetIndex = STREETS.indexOf(currentStepData.street);
  const { result, loading } = useEquity(heroCards, boardCards, numOpponents);

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Street Progress */}
      <div className="bg-[hsl(var(--card))] rounded-lg p-4 border border-[hsl(var(--border))]">
        <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-3">Street Progress</h3>
        <div className="flex items-center gap-1">
          {STREETS.map((street, i) => (
            <div key={street} className="flex items-center flex-1">
              <div className={cn(
                'h-2 w-full rounded-full transition-all',
                i <= completedStreetIndex
                  ? 'bg-[hsl(var(--gold))]'
                  : 'bg-[hsl(var(--muted))]',
              )} />
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-1">
          {STREETS.map((street) => (
            <span key={street} className="text-[10px] text-[hsl(var(--muted-foreground))] capitalize">
              {street === 'preflop' ? 'Pre' : street.slice(0, 1).toUpperCase()}
            </span>
          ))}
        </div>
      </div>

      {/* Equity */}
      <div className="bg-[hsl(var(--card))] rounded-lg p-4 border border-[hsl(var(--border))]">
        <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
          Equity
          <span className="text-[10px] font-normal text-[hsl(var(--muted-foreground))] ml-1">
            Monte Carlo (5k sims)
          </span>
        </h3>
        {heroCards.length !== 2 ? (
          <p className="text-xs text-[hsl(var(--muted-foreground))]">No hero cards</p>
        ) : loading || !result ? (
          <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
            <span className="inline-block w-3 h-3 border-2 border-[hsl(var(--gold))] border-t-transparent rounded-full animate-spin" />
            Calculating…
          </div>
        ) : (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-green-400">Win</span>
              <span className="mono font-semibold text-green-400">
                {(result.winProbability * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-yellow-400">Tie</span>
              <span className="mono font-semibold text-yellow-400">
                {(result.tieProbability * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-red-400">Loss</span>
              <span className="mono font-semibold text-red-400">
                {(result.lossProbability * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Pot & Stacks */}
      <div className="bg-[hsl(var(--card))] rounded-lg p-4 border border-[hsl(var(--border))]">
        <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-2">Pot & Stacks</h3>
        <div className="mono text-lg font-bold text-[hsl(var(--gold))] mb-3">
          Pot: ${currentStepData.potSize.toFixed(2)}
        </div>
        <div className="space-y-1.5">
          {currentStepData.players.map(p => (
            <div key={p.name} className={cn(
              'flex justify-between text-xs',
              p.isFolded && 'opacity-40',
            )}>
              <span className="text-[hsl(var(--foreground))]">{p.name}</span>
              <span className="mono text-[hsl(var(--muted-foreground))]">${p.stackSize.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action History */}
      <div className="bg-[hsl(var(--card))] rounded-lg p-4 border border-[hsl(var(--border))] flex-1 min-h-0">
        <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-2">Action History</h3>
        <ScrollArea className="h-[200px]">
          <div className="space-y-1 pr-2">
            {steps.slice(0, currentStep + 1).map((s, i) => (
              <div
                key={i}
                className={cn(
                  'text-xs mono py-0.5',
                  i === currentStep && 'font-bold',
                  s.action ? actionColors[s.action.type] : 'text-[hsl(var(--muted-foreground))]',
                )}
              >
                {s.description}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
