import { HandStats } from '@/types/poker';

export interface AggregatedStats {
  hands: number;
  netWon: number;
  bb100: number;
  vpip: number;
  pfr: number;
  rfi: number;
  threeBetPct: number;
  foldTo3BetPct: number;
  cbetFlop: number;
  wtsd: number;
  wsd: number;
  wwsf: number;
  af: number;
}

export interface PositionRow extends AggregatedStats {
  position: string;
}

function pct(num: number, den: number): number {
  if (den === 0) return 0;
  return (num / den) * 100;
}

export function aggregateStats(hands: HandStats[]): AggregatedStats {
  const total = hands.length;
  if (total === 0) {
    return { hands: 0, netWon: 0, bb100: 0, vpip: 0, pfr: 0, rfi: 0, threeBetPct: 0,
      foldTo3BetPct: 0, cbetFlop: 0, wtsd: 0, wsd: 0, wwsf: 0, af: 0 };
  }

  let vpipCount = 0, pfrCount = 0, rfiCount = 0;
  let threeBetCount = 0, facedPFCount = 0;
  let foldTo3Count = 0, facedThreeBetCount = 0;
  let cbetTrue = 0, cbetApplicable = 0;
  let sawFlopCount = 0, sawShowdownCount = 0;
  let wonAtSDCount = 0, wonMoneyFlop = 0;
  let totalBetsRaises = 0, totalCalls = 0;
  let netWon = 0;
  let totalBBs = 0;

  for (const h of hands) {
    netWon += h.heroResult;
    totalBBs += h.heroResult / h.bbSize;
    if (h.vpip) vpipCount++;
    if (h.pfr) pfrCount++;
    if (h.rfi) rfiCount++;
    if (h.threeBet) threeBetCount++;
    if (h.facedPFRaise) facedPFCount++;
    if (h.foldTo3Bet) foldTo3Count++;
    if (h.facedThreeBet) facedThreeBetCount++;
    if (h.cbetFlop !== null) {
      cbetApplicable++;
      if (h.cbetFlop) cbetTrue++;
    }
    if (h.sawFlop) sawFlopCount++;
    if (h.sawShowdown) sawShowdownCount++;
    if (h.wonAtShowdown) wonAtSDCount++;
    if (h.wonMoneyWhenSawFlop) wonMoneyFlop++;
    totalBetsRaises += h.preflopBetsRaises + h.flopBetsRaises + h.turnBetsRaises + h.riverBetsRaises;
    totalCalls += h.preflopCalls + h.flopCalls + h.turnCalls + h.riverCalls;
  }

  return {
    hands: total,
    netWon,
    bb100: (totalBBs / total) * 100,
    vpip: pct(vpipCount, total),
    pfr: pct(pfrCount, total),
    rfi: pct(rfiCount, total),
    threeBetPct: pct(threeBetCount, facedPFCount),
    foldTo3BetPct: pct(foldTo3Count, facedThreeBetCount),
    cbetFlop: pct(cbetTrue, cbetApplicable),
    wtsd: pct(sawShowdownCount, sawFlopCount),
    wsd: pct(wonAtSDCount, sawShowdownCount),
    wwsf: pct(wonMoneyFlop, sawFlopCount),
    af: totalCalls === 0 ? totalBetsRaises : totalBetsRaises / totalCalls,
  };
}

const POSITION_ORDER = ['BTN', 'CO', 'HJ', 'UTG', 'SB', 'BB'];

export function aggregateByPosition(hands: HandStats[]): PositionRow[] {
  return POSITION_ORDER.map(pos => {
    const filtered = hands.filter(h => h.heroPosition === pos);
    return { position: pos, ...aggregateStats(filtered) };
  });
}
