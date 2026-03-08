import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ReplayStep, Street } from '@/types/poker';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

const STREETS: Street[] = ['preflop', 'flop', 'turn', 'river', 'showdown'];

interface ControlsBarProps {
  currentStep: number;
  totalSteps: number;
  currentStreet: Street;
  steps: ReplayStep[];
  onStepChange: (step: number) => void;
  onReset: () => void;
}

export function ControlsBar({
  currentStep,
  totalSteps,
  currentStreet,
  steps,
  onStepChange,
  onReset,
}: ControlsBarProps) {
  const jumpToStreet = (street: Street) => {
    const idx = steps.findIndex(s => s.street === street);
    if (idx !== -1) onStepChange(idx);
  };

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      {/* Street indicators */}
      <div className="flex gap-1">
        {STREETS.map((street) => {
          const hasStreet = steps.some(s => s.street === street);
          return (
            <button
              key={street}
              onClick={() => hasStreet && jumpToStreet(street)}
              disabled={!hasStreet}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider transition-all',
                currentStreet === street
                  ? 'bg-[hsl(var(--gold))] text-[hsl(var(--primary-foreground))] shadow-md'
                  : hasStreet
                    ? 'bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] hover:bg-[hsl(var(--accent))]'
                    : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] opacity-40 cursor-not-allowed',
              )}
            >
              {street}
            </button>
          );
        })}
      </div>

      {/* Step controls */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={onReset}
          className="rounded-full"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={() => onStepChange(currentStep - 1)}
          disabled={currentStep <= 0}
          className="rounded-full"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <span className="mono text-sm text-[hsl(var(--muted-foreground))] min-w-[100px] text-center">
          Step {currentStep + 1} / {totalSteps}
        </span>

        <Button
          variant="outline"
          size="icon"
          onClick={() => onStepChange(currentStep + 1)}
          disabled={currentStep >= totalSteps - 1}
          className="rounded-full"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
