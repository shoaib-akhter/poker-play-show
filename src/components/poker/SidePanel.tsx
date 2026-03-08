import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ReplayStep, ActionType, Street } from '@/types/poker';


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
}

export function SidePanel({ steps, currentStep, currentStepData }: SidePanelProps) {
  const equities = estimateEquity(
    currentStepData.players,
    currentStepData.communityCards,
    currentStepData.street,
  );

  const completedStreetIndex = STREETS.indexOf(currentStepData.street);

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
