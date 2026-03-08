import { ParsedHand } from '@/types/poker';

export function extractHeroResult(parsed: ParsedHand): { heroName: string; heroResult: number } {
  const heroName = parsed.heroName;
  if (!heroName) return { heroName: '', heroResult: 0 };

  const hero = parsed.steps[0]?.players.find(p => p.name === heroName);
  if (!hero) return { heroName, heroResult: 0 };

  const initialStack = hero.stackSize;

  const lastActionStep = [...parsed.steps].reverse().find(s => s.street !== 'showdown')
    ?? parsed.steps[parsed.steps.length - 1];
  const stackAfterBetting = lastActionStep.players.find(p => p.name === heroName)?.stackSize ?? 0;

  const heroWinnings = parsed.winners
    .filter(w => w.playerName === heroName)
    .reduce((sum, w) => sum + w.amount, 0);

  const uncalledReturn = parsed.uncalledReturns[heroName] ?? 0;

  return { heroName, heroResult: (stackAfterBetting + uncalledReturn + heroWinnings) - initialStack };
}
