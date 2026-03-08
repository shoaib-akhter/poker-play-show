import { remainingDeck } from './cards';
import { evaluate7 } from './handEvaluator';

export interface MonteCarloInput {
  heroCards: number[];    // exactly 2 card integers
  boardCards: number[];   // 0, 3, 4, or 5 card integers
  numOpponents: number;   // 1–8
  simulations?: number;   // default 5000
}

export interface MonteCarloResult {
  winProbability: number;
  tieProbability: number;
  lossProbability: number;
  simsRun: number;
}

/** Fisher-Yates shuffle in place. */
function shuffle(arr: number[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
}

export function runMonteCarlo(input: MonteCarloInput): MonteCarloResult {
  const { heroCards, boardCards, numOpponents } = input;
  const simulations = input.simulations ?? 5000;

  const boardNeeded = 5 - boardCards.length;
  const cardsPerOpponent = 2;
  const totalCardsDraw = numOpponents * cardsPerOpponent + boardNeeded;

  let wins = 0;
  let ties = 0;
  let losses = 0;
  let simsRun = 0;

  const pool = remainingDeck([...heroCards, ...boardCards]);

  if (pool.length < totalCardsDraw) {
    // Not enough cards (shouldn't happen with valid input)
    return { winProbability: 0, tieProbability: 0, lossProbability: 0, simsRun: 0 };
  }

  const poolCopy = pool.slice();

  for (let sim = 0; sim < simulations; sim++) {
    shuffle(poolCopy);

    // Deal opponent hole cards
    const opponentHands: number[][] = [];
    for (let o = 0; o < numOpponents; o++) {
      opponentHands.push([poolCopy[o * 2], poolCopy[o * 2 + 1]]);
    }

    // Complete board
    const completedBoard = [
      ...boardCards,
      ...poolCopy.slice(numOpponents * 2, numOpponents * 2 + boardNeeded),
    ];

    // Evaluate hero
    const heroScore = evaluate7([...heroCards, ...completedBoard]);

    // Compare against each opponent
    let heroWinsAll = true;
    let heroTiesAll = true;

    for (const oppHand of opponentHands) {
      const oppScore = evaluate7([...oppHand, ...completedBoard]);
      if (heroScore < oppScore) {
        heroWinsAll = false;
        heroTiesAll = false;
        break;
      }
      if (heroScore > oppScore) {
        heroTiesAll = false;
      }
    }

    if (!heroWinsAll) {
      losses++;
    } else if (heroTiesAll) {
      // heroWinsAll=true, heroTiesAll=true → hero never beat anyone → all tied
      ties++;
    } else {
      // heroWinsAll=true, heroTiesAll=false → hero beat at least one, nobody beat hero
      wins++;
    }

    simsRun++;
  }

  return {
    winProbability: wins / simsRun,
    tieProbability: ties / simsRun,
    lossProbability: losses / simsRun,
    simsRun,
  };
}
