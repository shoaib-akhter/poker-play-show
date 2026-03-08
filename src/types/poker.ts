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
  players: Player[];
  steps: ReplayStep[];
  communityCards: Card[];
  winners: { playerName: string; amount: number; hand?: string }[];
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
