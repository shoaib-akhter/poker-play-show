import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { parseHandHistory } from '../lib/handHistoryParser';
import { extractHeroResult } from '../lib/heroResult';

function fixture(name: string): string {
  return readFileSync(join(__dirname, 'fixtures', name), 'utf-8');
}

const FULL_HAND = fixture('full_hand.txt');
const SHOWDOWN_HAND = fixture('showdown_hand.txt');
const PREFLOP_ONLY = fixture('preflop_only.txt');
const UNCALLED_BET = fixture('uncalled_bet.txt');

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------
describe('Header parsing', () => {
  it('parses hand ID', () => {
    const hand = parseHandHistory(FULL_HAND);
    expect(hand.handId).toBe('RC827364510:');
  });

  it('parses table name', () => {
    const hand = parseHandHistory(FULL_HAND);
    expect(hand.tableName).toBe('Andromeda IV');
  });

  it('parses stakes', () => {
    const hand = parseHandHistory(FULL_HAND);
    expect(hand.stakes).toContain('$1/$2');
  });
});

// ---------------------------------------------------------------------------
// Seats & stacks
// ---------------------------------------------------------------------------
describe('Seats and stacks', () => {
  it('parses all six players', () => {
    const hand = parseHandHistory(FULL_HAND);
    expect(hand.players).toHaveLength(6);
  });

  it('parses player names and stacks', () => {
    const hand = parseHandHistory(FULL_HAND);
    const mike = hand.players.find(p => p.name === 'MikeTheGrinder');
    expect(mike).toBeDefined();
    expect(mike!.stackSize).toBe(200);

    const sarah = hand.players.find(p => p.name === 'SarahBluffs');
    expect(sarah).toBeDefined();
    expect(sarah!.stackSize).toBe(185.5);
  });

  it('marks the correct dealer seat', () => {
    const hand = parseHandHistory(FULL_HAND);
    const dealer = hand.players.find(p => p.isDealer);
    expect(dealer?.name).toBe('AceHunter');
  });
});

// ---------------------------------------------------------------------------
// Blinds
// ---------------------------------------------------------------------------
describe('Blinds', () => {
  it('parses small blind action', () => {
    const hand = parseHandHistory(FULL_HAND);
    const sbAction = hand.steps.find(
      s => s.action?.type === 'post_blind' && s.action.playerName === 'CoolCat42',
    );
    expect(sbAction).toBeDefined();
    expect(sbAction!.action!.amount).toBe(1);
  });

  it('parses big blind action', () => {
    const hand = parseHandHistory(FULL_HAND);
    const bbAction = hand.steps.find(
      s => s.action?.type === 'post_blind' && s.action.playerName === 'LuckyDraw7',
    );
    expect(bbAction).toBeDefined();
    expect(bbAction!.action!.amount).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Hole cards
// ---------------------------------------------------------------------------
describe('Hole cards', () => {
  it('parses hero hole cards from Dealt to line', () => {
    const hand = parseHandHistory(FULL_HAND);
    const hero = hand.players.find(p => p.name === 'AceHunter');
    expect(hero?.holeCards).toBeDefined();
    expect(hero!.holeCards![0]).toEqual({ rank: 'A', suit: 'h' });
    expect(hero!.holeCards![1]).toEqual({ rank: 'K', suit: 'd' });
  });

  it('handles hand with no hole cards section gracefully', () => {
    // preflop only hand - hero 2c7h
    const hand = parseHandHistory(PREFLOP_ONLY);
    const hero = hand.players.find(p => p.name === 'DealerDave');
    expect(hero?.holeCards).toBeDefined();
    expect(hero!.holeCards![0]).toEqual({ rank: '2', suit: 'c' });
  });
});

// ---------------------------------------------------------------------------
// Streets and community cards
// ---------------------------------------------------------------------------
describe('Street and board cards', () => {
  it('parses flop board cards', () => {
    const hand = parseHandHistory(FULL_HAND);
    const flopStep = hand.steps.find(s => s.street === 'flop' && s.communityCards.length === 3);
    expect(flopStep).toBeDefined();
    expect(flopStep!.communityCards[0]).toEqual({ rank: 'K', suit: 's' });
    expect(flopStep!.communityCards[1]).toEqual({ rank: '7', suit: 'h' });
    expect(flopStep!.communityCards[2]).toEqual({ rank: '2', suit: 'd' });
  });

  it('parses turn card (4th community card)', () => {
    const hand = parseHandHistory(FULL_HAND);
    const turnStep = hand.steps.find(s => s.street === 'turn' && s.communityCards.length === 4);
    expect(turnStep).toBeDefined();
    expect(turnStep!.communityCards[3]).toEqual({ rank: 'T', suit: 'd' });
  });

  it('parses river card (5th community card)', () => {
    const hand = parseHandHistory(FULL_HAND);
    const riverStep = hand.steps.find(s => s.street === 'river' && s.communityCards.length === 5);
    expect(riverStep).toBeDefined();
    expect(riverStep!.communityCards[4]).toEqual({ rank: '3', suit: 'c' });
  });
});

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------
describe('Actions', () => {
  it('parses fold', () => {
    const hand = parseHandHistory(FULL_HAND);
    const fold = hand.steps.find(s => s.action?.playerName === 'MikeTheGrinder' && s.action.type === 'fold');
    expect(fold).toBeDefined();
  });

  it('parses check', () => {
    const hand = parseHandHistory(FULL_HAND);
    const check = hand.steps.find(s => s.action?.type === 'check' && s.action.playerName === 'SarahBluffs');
    expect(check).toBeDefined();
  });

  it('parses call with amount', () => {
    const hand = parseHandHistory(FULL_HAND);
    const call = hand.steps.find(
      s => s.action?.type === 'call' && s.action.playerName === 'SarahBluffs' && s.action.street === 'preflop',
    );
    expect(call).toBeDefined();
    expect(call!.action!.amount).toBe(12);
  });

  it('parses bet with amount', () => {
    const hand = parseHandHistory(FULL_HAND);
    const bet = hand.steps.find(s => s.action?.type === 'bet' && s.action.playerName === 'AceHunter');
    expect(bet).toBeDefined();
    expect(bet!.action!.amount).toBeGreaterThan(0);
  });

  it('parses raise with "raises X to Y" format', () => {
    const hand = parseHandHistory(FULL_HAND);
    // SarahBluffs raises $90 to $90 on turn
    const raise = hand.steps.find(
      s => s.action?.type === 'raise' && s.action.playerName === 'SarahBluffs' && s.action.street === 'turn',
    );
    expect(raise).toBeDefined();
    expect(raise!.action!.amount).toBe(90);
  });
});

// ---------------------------------------------------------------------------
// Showdown
// ---------------------------------------------------------------------------
describe('Showdown', () => {
  it('parses winner and collected amount', () => {
    const hand = parseHandHistory(FULL_HAND);
    expect(hand.winners).toHaveLength(1);
    expect(hand.winners[0].playerName).toBe('AceHunter');
    expect(hand.winners[0].amount).toBe(261);
  });

  it('parses shown hole cards at showdown', () => {
    const hand = parseHandHistory(SHOWDOWN_HAND);
    const villain = hand.players.find(p => p.name === 'VillainX');
    expect(villain?.holeCards).toBeDefined();
    expect(villain!.holeCards![0]).toEqual({ rank: 'A', suit: 'h' });
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Uncalled bet / heroResult
// ---------------------------------------------------------------------------
describe('Uncalled bet and heroResult', () => {
  it('parses uncalled bet return', () => {
    const hand = parseHandHistory(UNCALLED_BET);
    expect(hand.uncalledReturns['HeroPlayer']).toBeCloseTo(0.04);
  });

  it('heroResult accounts for uncalled bet: raise + everyone folds = net blind steal', () => {
    // Hero raised to $0.06, stole SB($0.01)+BB($0.02), net = +$0.03 - $0.02(their own raise net) = +$0.01
    // Actually: hero raised $0.06, got $0.04 back (uncalled), won $0.05 pot
    // net = -$0.06 + $0.04 + $0.05 = +$0.03? No...
    // Hero's initial stack = $2.00, raised $0.06 from seat 1 (no blind to post, UTG position)
    // stackAfterBetting = $2.00 - $0.06 = $1.94
    // uncalledReturn = $0.04
    // heroWinnings = $0.05
    // heroResult = $1.94 + $0.04 + $0.05 - $2.00 = +$0.03
    const hand = parseHandHistory(UNCALLED_BET);
    const { heroResult } = extractHeroResult(hand);
    expect(heroResult).toBeCloseTo(0.03, 2);
  });

  it('without uncalled bet fix, heroResult would be wrong', () => {
    const hand = parseHandHistory(UNCALLED_BET);
    // Simulate the old (broken) calculation: ignore uncalledReturns
    const hero = hand.steps[0]?.players.find(p => p.name === hand.heroName)!;
    const lastStep = [...hand.steps].reverse().find(s => s.street !== 'showdown')!;
    const stackAfter = lastStep.players.find(p => p.name === hand.heroName)?.stackSize ?? 0;
    const winnings = hand.winners.filter(w => w.playerName === hand.heroName).reduce((s, w) => s + w.amount, 0);
    const brokenResult = (stackAfter + winnings) - hero.stackSize;
    // Without fix: $1.94 + $0.05 - $2.00 = -$0.01 (wrong — should be +$0.03)
    expect(brokenResult).toBeCloseTo(-0.01, 2);
  });

  it('heroName parsed from Dealt to line', () => {
    const hand = parseHandHistory(UNCALLED_BET);
    expect(hand.heroName).toBe('HeroPlayer');
  });
});

describe('Edge cases', () => {
  it('handles preflop-only hand (no community cards)', () => {
    const hand = parseHandHistory(PREFLOP_ONLY);
    expect(hand.communityCards).toHaveLength(0);
    expect(hand.steps.some(s => s.street === 'flop')).toBe(false);
  });

  it('builds replay steps with correct step indices', () => {
    const hand = parseHandHistory(FULL_HAND);
    hand.steps.forEach((s, i) => expect(s.stepIndex).toBe(i));
  });

  it('tracks pot size across streets', () => {
    const hand = parseHandHistory(FULL_HAND);
    const lastStep = hand.steps[hand.steps.length - 1];
    expect(lastStep.potSize).toBeGreaterThan(0);
  });
});
