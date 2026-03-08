import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { parseHandHistory } from '@/lib/handHistoryParser';
import { ParsedHand, Card, ReplayStep } from '@/types/poker';
import { PokerTable } from '@/components/poker/PokerTable';
import { ControlsBar } from '@/components/poker/ControlsBar';
import { SidePanel } from '@/components/poker/SidePanel';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { parseCard } from '@/lib/cards';

function toCardInt(c: Card): number {
  return parseCard(c.rank + c.suit);
}

function getEquityInputs(hand: ParsedHand, step: ReplayStep) {
  const preflopStep = hand.steps.find(s => s.street === 'preflop');
  const heroPlayer = preflopStep?.players.find(p => p.holeCards);
  const heroCards = heroPlayer?.holeCards ? heroPlayer.holeCards.map(toCardInt) : [];
  const boardCards = step.communityCards.map(toCardInt);
  const activePlayers = step.players.filter(p => !p.isFolded);
  const numOpponents = Math.max(1, activePlayers.length - (heroPlayer ? 1 : 0));
  return { heroCards, boardCards, numOpponents };
}

const Replay = () => {
  const navigate = useNavigate();
  const [hand, setHand] = useState<ParsedHand | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const text = sessionStorage.getItem('poker_hand');
    if (!text) {
      navigate('/');
      return;
    }
    try {
      const parsed = parseHandHistory(text);
      setHand(parsed);
    } catch {
      navigate('/');
    }
  }, [navigate]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!hand) return;
    if (e.key === 'ArrowRight' || e.key === ' ') {
      e.preventDefault();
      setCurrentStep(s => Math.min(s + 1, hand.steps.length - 1));
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setCurrentStep(s => Math.max(s - 1, 0));
    }
  }, [hand]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const step = hand?.steps[currentStep];

  const equityInputs = useMemo(() => {
    if (!hand || !step) return { heroCards: [], boardCards: [], numOpponents: 1 };
    return getEquityInputs(hand, step);
  }, [hand, step]);

  if (!hand || !step) return null;

  const winnerNames = hand.winners.map(w => w.playerName);
  const isShowdown = step.street === 'showdown';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            {hand.tableName || 'Hand Replay'}
          </h2>
          <p className="text-xs text-muted-foreground">
            {hand.stakes} • Hand #{hand.handId}
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4">
        {/* Table area */}
        <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
          <PokerTable
            step={step}
            allSteps={hand.steps}
            winnerNames={isShowdown ? winnerNames : []}
            winners={isShowdown ? hand.winners : []}
          />
          <ControlsBar
            currentStep={currentStep}
            totalSteps={hand.steps.length}
            currentStreet={step.street}
            steps={hand.steps}
            onStepChange={setCurrentStep}
            onReset={() => setCurrentStep(0)}
          />
        </div>

        {/* Side panel */}
        <div className="w-full lg:w-[300px] shrink-0">
          <SidePanel
            steps={hand.steps}
            currentStep={currentStep}
            currentStepData={step}
            heroCards={equityInputs.heroCards}
            boardCards={equityInputs.boardCards}
            numOpponents={equityInputs.numOpponents}
          />
        </div>
      </div>
    </div>
  );
};

export default Replay;
