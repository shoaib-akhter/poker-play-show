import { ParsedHand, HandStats, Action, ActionType } from '@/types/poker';
import { extractHeroResult } from '@/lib/heroResult';

export function parseBBSize(stakes: string): number {
  const m = stakes.match(/\$?([\d.]+)\s*\/\s*\$?([\d.]+)/);
  return m ? parseFloat(m[2]) : 1;
}

function detectAllPositions(parsed: ParsedHand): Record<string, string> {
  const positions: Record<string, string> = {};

  const btnPlayer = parsed.players.find(p => p.isDealer);
  if (btnPlayer) positions[btnPlayer.name] = 'BTN';

  const preflopActions = parsed.steps
    .filter(s => s.street === 'preflop' && s.action != null)
    .map(s => s.action!);

  const blindPosts = preflopActions.filter(a => a.type === 'post_blind');
  if (blindPosts[0]) positions[blindPosts[0].playerName] = 'SB';
  if (blindPosts[1]) positions[blindPosts[1].playerName] = 'BB';

  const assignedPlayers = new Set(Object.keys(positions));
  const remainingInOrder: string[] = [];
  for (const action of preflopActions) {
    if (!assignedPlayers.has(action.playerName) && !remainingInOrder.includes(action.playerName)) {
      remainingInOrder.push(action.playerName);
      assignedPlayers.add(action.playerName);
    }
  }

  const labelsByCount: Record<number, string[]> = {
    3: ['UTG', 'HJ', 'CO'],
    2: ['UTG', 'CO'],
    1: ['CO'],
    0: [],
  };
  const labels = labelsByCount[remainingInOrder.length] ?? [];
  remainingInOrder.forEach((name, i) => {
    if (labels[i]) positions[name] = labels[i];
  });

  return positions;
}

function getActionsForStreet(parsed: ParsedHand, street: string): Action[] {
  return parsed.steps
    .filter(s => s.street === street && s.action != null)
    .map(s => s.action!);
}

function countBetsRaises(actions: Action[], playerName: string): number {
  return actions.filter(
    a => a.playerName === playerName && (a.type === 'bet' || a.type === 'raise')
  ).length;
}

function countCalls(actions: Action[], playerName: string): number {
  return actions.filter(a => a.playerName === playerName && a.type === 'call').length;
}

export function computeHandStats(
  parsed: ParsedHand,
  stakes: string,
  playedAt: number
): HandStats | null {
  const heroName = parsed.heroName;
  if (!heroName) return null;

  const bbSize = parseBBSize(stakes);
  const { heroResult } = extractHeroResult(parsed);
  const allPositions = detectAllPositions(parsed);
  const heroPosition = allPositions[heroName] ?? 'CO';

  const preflopActions = getActionsForStreet(parsed, 'preflop');
  const flopActions = getActionsForStreet(parsed, 'flop');
  const turnActions = getActionsForStreet(parsed, 'turn');
  const riverActions = getActionsForStreet(parsed, 'river');

  // --- Preflop analysis ---
  let raiseCount = 0;
  let heroMadeRaise = false;
  let heroHadVoluntaryInvestment = false;
  let heroActedVoluntarily = false;

  let vpip = false, pfr = false, rfi = false, limp = false, coldCall = false;
  let threeBet = false;
  let facedPFRaise = false;
  let facedThreeBet = false;
  let foldTo3Bet = false;
  let call3Bet = false;

  // State machine for 3-bet interaction
  let heroRaisedIdx = -1;
  let threeBetIdx = -1;

  for (let i = 0; i < preflopActions.length; i++) {
    const action = preflopActions[i];
    if (action.type === 'post_blind') continue;

    if (action.playerName === heroName) {
      heroActedVoluntarily = true;
      if (action.type === 'raise') {
        vpip = true;
        pfr = true;
        if (raiseCount === 0) rfi = true;
        if (raiseCount === 1) threeBet = true;
        heroMadeRaise = true;
        heroHadVoluntaryInvestment = true;
        if (heroRaisedIdx === -1) heroRaisedIdx = i;
      } else if (action.type === 'call') {
        vpip = true;
        if (raiseCount === 0) limp = true;
        else if (!heroHadVoluntaryInvestment) coldCall = true;
        // Call after facing 3-bet
        if (heroMadeRaise && threeBetIdx >= 0 && i > threeBetIdx) call3Bet = true;
        heroHadVoluntaryInvestment = true;
      } else if (action.type === 'fold') {
        // Fold after facing 3-bet
        if (heroMadeRaise && threeBetIdx >= 0 && i > threeBetIdx) foldTo3Bet = true;
      }
    } else {
      if (action.type === 'raise') {
        raiseCount++;
        // Someone raised before hero's first raise → hero faces a PF raise (3-bet opportunity)
        // Includes limp-then-face-raise scenarios (UTG limp → squeeze)
        if (!heroMadeRaise) facedPFRaise = true;
        // Someone re-raised after hero's raise → hero faces a 3-bet
        if (heroRaisedIdx >= 0 && i > heroRaisedIdx && threeBetIdx === -1) {
          facedThreeBet = true;
          threeBetIdx = i;
        }
      }
    }
  }

  // Steal positions
  const stealPositions = ['CO', 'BTN', 'SB'];
  const stealAttempt = rfi && stealPositions.includes(heroPosition);

  // Faced steal: hero in BB or SB, and the first raiser is in steal position
  let facedSteal = false;
  let foldedToSteal = false;
  let threeBetVsSteal = false;
  if (['BB', 'SB'].includes(heroPosition)) {
    const firstRaise = preflopActions.find(
      a => a.type === 'raise' && a.playerName !== heroName
    );
    if (firstRaise && stealPositions.includes(allPositions[firstRaise.playerName] ?? '')) {
      facedSteal = true;
      // Was hero's response fold or 3-bet?
      const heroResponseAfterSteal = preflopActions.find(
        a => a.playerName === heroName &&
          preflopActions.indexOf(a) > preflopActions.indexOf(firstRaise) &&
          a.type !== 'post_blind'
      );
      if (heroResponseAfterSteal?.type === 'fold') foldedToSteal = true;
      if (heroResponseAfterSteal?.type === 'raise') threeBetVsSteal = true;
    }
  }

  // --- Postflop analysis ---
  const flopStart = parsed.steps.find(s => s.street === 'flop' && s.action == null);
  const turnStart = parsed.steps.find(s => s.street === 'turn' && s.action == null);
  const riverStart = parsed.steps.find(s => s.street === 'river' && s.action == null);
  const showdownSteps = parsed.steps.filter(s => s.street === 'showdown');

  const sawFlop = flopStart != null &&
    !(flopStart.players.find(p => p.name === heroName)?.isFolded ?? true);
  const sawTurn = turnStart != null &&
    !(turnStart.players.find(p => p.name === heroName)?.isFolded ?? true);
  const sawRiver = riverStart != null &&
    !(riverStart.players.find(p => p.name === heroName)?.isFolded ?? true);
  // True showdown = PokerStars wrote a *** SHOW DOWN *** section AND hero wasn't folded.
  const sawShowdown = parsed.hadShowdown &&
    !(showdownSteps[0]?.players.find(p => p.name === heroName)?.isFolded ?? true);
  const wonAtShowdown = sawShowdown && parsed.winners.some(w => w.playerName === heroName);
  const wonMoneyWhenSawFlop = sawFlop && heroResult > 0;

  // C-bet
  const lastPFRaiser = [...preflopActions]
    .reverse()
    .find(a => a.type === 'raise')?.playerName ?? null;

  const heroWasPFRaiser = lastPFRaiser === heroName;

  let cbetFlop: boolean | null = null;
  let facedCbetFlop = false;
  let foldedToCbetFlop = false;
  let calledCbetFlop = false;
  let raisedCbetFlop = false;

  if (heroWasPFRaiser && sawFlop) {
    const heroFirstFlopAction = flopActions.find(a => a.playerName === heroName);
    cbetFlop = heroFirstFlopAction?.type === 'bet' ?? false;
  }

  if (sawFlop && lastPFRaiser && lastPFRaiser !== heroName) {
    const firstFlopAction = flopActions[0];
    if (firstFlopAction?.playerName === lastPFRaiser && firstFlopAction.type === 'bet') {
      facedCbetFlop = true;
      const firstFlopIdx = 0;
      const heroFlopResponse = flopActions.find(
        (a, idx) => a.playerName === heroName && idx > firstFlopIdx
      );
      if (heroFlopResponse) {
        foldedToCbetFlop = heroFlopResponse.type === 'fold';
        calledCbetFlop = heroFlopResponse.type === 'call';
        raisedCbetFlop = heroFlopResponse.type === 'raise';
      }
    }
  }

  // Per-street aggression (preflop: exclude blind posts)
  const preflopVoluntary = preflopActions.filter(a => a.type !== ('post_blind' as ActionType));
  const preflopBetsRaises = countBetsRaises(preflopVoluntary, heroName);
  const preflopCalls = countCalls(preflopVoluntary, heroName);
  const flopBetsRaises = countBetsRaises(flopActions, heroName);
  const flopCalls = countCalls(flopActions, heroName);
  const turnBetsRaises = countBetsRaises(turnActions, heroName);
  const turnCalls = countCalls(turnActions, heroName);
  const riverBetsRaises = countBetsRaises(riverActions, heroName);
  const riverCalls = countCalls(riverActions, heroName);

  return {
    handId: parsed.handId,
    stakes,
    bbSize,
    playedAt,
    heroResult,
    heroPosition,
    playerCount: parsed.players.length,

    vpip, pfr, rfi, limp, coldCall,
    threeBet, facedPFRaise, facedThreeBet, foldTo3Bet, call3Bet,
    stealAttempt, facedSteal, foldedToSteal, threeBetVsSteal,

    sawFlop, sawTurn, sawRiver, sawShowdown,
    wonAtShowdown, wonMoneyWhenSawFlop,

    cbetFlop, facedCbetFlop, foldedToCbetFlop, calledCbetFlop, raisedCbetFlop,

    preflopBetsRaises, preflopCalls,
    flopBetsRaises, flopCalls,
    turnBetsRaises, turnCalls,
    riverBetsRaises, riverCalls,
  };
}
