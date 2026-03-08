import { describe, it, expect } from 'vitest';
import { evaluate7 } from '../lib/handEvaluator';
import { parseCard } from '../lib/cards';

function cards(...strs: string[]): number[] {
  return strs.map(s => parseCard(s));
}

describe('Hand evaluator — hand class ordering', () => {
  it('royal flush beats straight flush', () => {
    // Royal: Ac Kc Qc Jc Tc + 2h 3d
    const royal = evaluate7(cards('Ac', 'Kc', 'Qc', 'Jc', 'Tc', '2h', '3d'));
    // Straight flush: 9c 8c 7c 6c 5c + 2h 3d
    const sf = evaluate7(cards('9c', '8c', '7c', '6c', '5c', '2h', '3d'));
    expect(royal).toBeGreaterThan(sf);
  });

  it('straight flush beats quads', () => {
    const sf = evaluate7(cards('9c', '8c', '7c', '6c', '5c', '2h', '3d'));
    const quads = evaluate7(cards('Ac', 'Ah', 'Ad', 'As', 'Kc', '2h', '3d'));
    expect(sf).toBeGreaterThan(quads);
  });

  it('quads beats full house', () => {
    const quads = evaluate7(cards('Ac', 'Ah', 'Ad', 'As', 'Kc', '2h', '3d'));
    const fh = evaluate7(cards('Ac', 'Ah', 'Ad', 'Kc', 'Kh', '2h', '3d'));
    expect(quads).toBeGreaterThan(fh);
  });

  it('full house beats flush', () => {
    const fh = evaluate7(cards('Ac', 'Ah', 'Ad', 'Kc', 'Kh', '2h', '3d'));
    const flush = evaluate7(cards('Ac', 'Kc', 'Qc', 'Jc', '9c', '2h', '3d'));
    expect(fh).toBeGreaterThan(flush);
  });

  it('flush beats straight', () => {
    const flush = evaluate7(cards('Ac', 'Kc', 'Qc', 'Jc', '9c', '2h', '3d'));
    const straight = evaluate7(cards('Ac', 'Kh', 'Qd', 'Js', 'Tc', '2h', '3d'));
    expect(flush).toBeGreaterThan(straight);
  });

  it('straight beats trips', () => {
    const straight = evaluate7(cards('Ac', 'Kh', 'Qd', 'Js', 'Tc', '2h', '3d'));
    const trips = evaluate7(cards('Ac', 'Ah', 'Ad', 'Kc', 'Qh', '2h', '3d'));
    expect(straight).toBeGreaterThan(trips);
  });

  it('trips beats two pair', () => {
    const trips = evaluate7(cards('Ac', 'Ah', 'Ad', 'Kc', 'Qh', '2h', '3d'));
    const twoPair = evaluate7(cards('Ac', 'Ah', 'Kc', 'Kh', 'Qh', '2h', '3d'));
    expect(trips).toBeGreaterThan(twoPair);
  });

  it('two pair beats one pair', () => {
    const twoPair = evaluate7(cards('Ac', 'Ah', 'Kc', 'Kh', 'Qh', '2h', '3d'));
    const onePair = evaluate7(cards('Ac', 'Ah', 'Kc', 'Qh', 'Jc', '2h', '3d'));
    expect(twoPair).toBeGreaterThan(onePair);
  });

  it('one pair beats high card', () => {
    const onePair = evaluate7(cards('Ac', 'Ah', 'Kc', 'Qh', 'Jc', '2h', '3d'));
    const highCard = evaluate7(cards('Ac', 'Kh', 'Qd', 'Jc', '9s', '7h', '5d'));
    expect(onePair).toBeGreaterThan(highCard);
  });
});

describe('Hand evaluator — within-class tiebreaks', () => {
  it('higher pair wins over lower pair', () => {
    const aces = evaluate7(cards('Ac', 'Ah', 'Kc', 'Qh', 'Jc', '2h', '3d'));
    const kings = evaluate7(cards('Kc', 'Kh', 'Ac', 'Qh', 'Jc', '2h', '3d'));
    expect(aces).toBeGreaterThan(kings);
  });

  it('higher kicker wins between equal pairs', () => {
    const aceKicker = evaluate7(cards('Qc', 'Qh', 'Ac', 'Jc', '9h', '2h', '3d'));
    const kingKicker = evaluate7(cards('Qc', 'Qh', 'Kc', 'Jc', '9h', '2h', '3d'));
    expect(aceKicker).toBeGreaterThan(kingKicker);
  });

  it('higher straight wins', () => {
    const aceHigh = evaluate7(cards('Ac', 'Kh', 'Qd', 'Js', 'Tc', '2h', '3d'));
    const kingHigh = evaluate7(cards('Kc', 'Qh', 'Jd', 'Ts', '9c', '2h', '3d'));
    expect(aceHigh).toBeGreaterThan(kingHigh);
  });

  it('higher full house (trips) wins', () => {
    const aceFull = evaluate7(cards('Ac', 'Ah', 'Ad', 'Kc', 'Kh', '2h', '3d'));
    const kingFull = evaluate7(cards('Kc', 'Kh', 'Kd', 'Ac', 'Ah', '2h', '3d'));
    expect(aceFull).toBeGreaterThan(kingFull);
  });
});

describe('Hand evaluator — wheel straight (A-2-3-4-5)', () => {
  it('wheel is a straight', () => {
    const wheel = evaluate7(cards('Ac', '2h', '3d', '4s', '5c', 'Kh', 'Qd'));
    const trips = evaluate7(cards('Ac', 'Ah', 'Ad', 'Kc', 'Qh', '2h', '3d'));
    // Wheel (straight) should beat trips
    expect(wheel).toBeGreaterThan(trips);
  });

  it('wheel is the lowest straight', () => {
    const wheel = evaluate7(cards('Ac', '2h', '3d', '4s', '5c', 'Kh', 'Qd'));
    const sixHigh = evaluate7(cards('2c', '3h', '4d', '5s', '6c', 'Kh', 'Qd'));
    expect(sixHigh).toBeGreaterThan(wheel);
  });
});

describe('Hand evaluator — 7-card best-5 selection', () => {
  it('selects best 5 from 7 (ignores weaker cards)', () => {
    // 7 cards with a flush available but also a straight
    // Ac Kc Qc Jc Tc (royal flush) with 2h 3d — should pick royal
    const score = evaluate7(cards('Ac', 'Kc', 'Qc', 'Jc', 'Tc', '2h', '3d'));
    // Royal flush class = STRAIGHT_FLUSH (9) * 10^10 + highRank(12) * 10^8
    const rfThreshold = 9 * 10_000_000_000;
    expect(score).toBeGreaterThanOrEqual(rfThreshold);
  });

  it('uses all 7 cards to find best combination', () => {
    // Two pair among 7 but best 5 could be one pair with better kicker
    // Actually give it a flush buried in 7 cards
    // 5 clubs: 2c 5c 8c Jc Ac + unrelated 3h 7d → flush
    const withFlush = evaluate7(cards('2c', '5c', '8c', 'Jc', 'Ac', '3h', '7d'));
    const noFlush = evaluate7(cards('2c', '5c', '8c', 'Jh', 'Ac', '3h', '7d'));
    expect(withFlush).toBeGreaterThan(noFlush);
  });
});
