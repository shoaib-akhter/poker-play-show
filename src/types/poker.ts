export type Suit = 'h' | 'd' | 'c' | 's';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  rank: Rank;
  suit: Suit;
}

export type Street = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';

export type ActionType = 'post_blind' | 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'all_in';

export interface Action {
  playerName: string;
  type: ActionType;
  amount?: number;
  street: Street;
}

export interface Player {
  name: string;
  seatIndex: number; // 0-5
  stackSize: number;
  holeCards?: [Card, Card];
  isDealer: boolean;
  isFolded: boolean;
  currentBet: number;
  hasActed: boolean;
}

export interface ReplayStep {
  stepIndex: number;
  street: Street;
  action?: Action;
  players: Player[];
  communityCards: Card[];
  potSize: number;
  activePlayerName?: string;
  description: string;
}

export interface ParsedHand {
  handId: string;
  tableName: string;
  stakes: string;
  heroName: string;
  players: Player[];
  steps: ReplayStep[];
  communityCards: Card[];
  winners: { playerName: string; amount: number; hand?: string }[];
  uncalledReturns: Record<string, number>;
  hadShowdown: boolean;
}

export interface HandMeta {
  handId: string;
  tableName: string;
  stakes: string;
  playedAt: number;
  heroName: string;
  heroResult: number;
  playerCount: number;
}

export interface HandRaw {
  handId: string;
  rawText: string;
}

export interface HandStats {
  handId: string;
  stakes: string;
  bbSize: number;
  playedAt: number;
  heroResult: number;
  heroPosition: string;
  playerCount: number;

  // Preflop booleans
  vpip: boolean;
  pfr: boolean;
  rfi: boolean;
  limp: boolean;
  coldCall: boolean;
  threeBet: boolean;
  facedPFRaise: boolean;
  facedThreeBet: boolean;
  foldTo3Bet: boolean;
  call3Bet: boolean;
  stealAttempt: boolean;
  facedSteal: boolean;
  foldedToSteal: boolean;
  threeBetVsSteal: boolean;

  // Postflop booleans
  sawFlop: boolean;
  sawTurn: boolean;
  sawRiver: boolean;
  sawShowdown: boolean;
  wonAtShowdown: boolean;
  wonMoneyWhenSawFlop: boolean;

  // C-bet (null = not applicable)
  cbetFlop: boolean | null;
  facedCbetFlop: boolean;
  foldedToCbetFlop: boolean;
  calledCbetFlop: boolean;
  raisedCbetFlop: boolean;

  // Per-street aggression counts
  preflopBetsRaises: number;
  preflopCalls: number;
  flopBetsRaises: number;
  flopCalls: number;
  turnBetsRaises: number;
  turnCalls: number;
  riverBetsRaises: number;
  riverCalls: number;

  // Hero hole cards (for range analysis)
  heroHoleCards?: [Card, Card];
}
