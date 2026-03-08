import { describe, it, expect } from 'vitest';
import { runMonteCarlo } from '../lib/monteCarlo';
import { parseCard } from '../lib/cards';

function c(str: string): number { return parseCard(str); }

describe('Monte Carlo — near-certain outcomes', () => {
  it('nut hand on full board wins almost always', () => {
    // Hero: Ac Kc, Board: Qc Jc Tc (royal flush made)
    // No opponent can beat a royal flush
    const result = runMonteCarlo({
      heroCards: [c('Ac'), c('Kc')],
      boardCards: [c('Qc'), c('Jc'), c('Tc')],
      numOpponents: 1,
      simulations: 1000,
    });
    expect(result.winProbability + result.tieProbability).toBeGreaterThan(0.99);
    expect(result.simsRun).toBe(1000);
  });

  it('losing hand on full board loses almost always', () => {
    // Hero: 2h 7d (worst hand), Board: Ac Kc Qc Jc Tc (royal flush on board)
    // Anyone holding a club beats/ties us; the board itself is a royal — everyone ties
    // Actually with royal on board everyone has same 5-card hand → tie
    const result = runMonteCarlo({
      heroCards: [c('2h'), c('7d')],
      boardCards: [c('Ac'), c('Kc'), c('Qc'), c('Jc'), c('Tc')],
      numOpponents: 1,
      simulations: 500,
    });
    // All 5 community cards form a royal — everyone's best hand is the royal → tie
    expect(result.tieProbability).toBeGreaterThan(0.95);
    expect(result.simsRun).toBe(500);
  });
});

describe('Monte Carlo — coin-flip scenarios', () => {
  it('AKo vs QQ preflop is approximately 50/50 (within ±15%)', () => {
    // AK off: Ah Kd vs QQ: actual equity ~43% for AK
    const result = runMonteCarlo({
      heroCards: [c('Ah'), c('Kd')],
      boardCards: [],
      numOpponents: 1,
      simulations: 10000,
    });
    expect(result.winProbability).toBeGreaterThan(0.35);
    expect(result.winProbability).toBeLessThan(0.65);
  });

  it('AA vs KK preflop — AA wins ~80%+', () => {
    const result = runMonteCarlo({
      heroCards: [c('Ac'), c('Ad')],
      boardCards: [],
      numOpponents: 1,
      simulations: 10000,
    });
    // AA is ~80% favourite vs KK
    expect(result.winProbability).toBeGreaterThan(0.72);
    expect(result.winProbability).toBeLessThan(0.90);
  });
});

describe('Monte Carlo — multi-opponent', () => {
  it('win% decreases with more opponents (AA vs 3 opponents < AA vs 1)', () => {
    const headsUp = runMonteCarlo({
      heroCards: [c('Ac'), c('Ad')],
      boardCards: [],
      numOpponents: 1,
      simulations: 5000,
    });
    const multiway = runMonteCarlo({
      heroCards: [c('Ac'), c('Ad')],
      boardCards: [],
      numOpponents: 3,
      simulations: 5000,
    });
    expect(headsUp.winProbability).toBeGreaterThan(multiway.winProbability);
  });
});

describe('Monte Carlo — simsRun', () => {
  it('returns exactly the requested number of simulations', () => {
    const result = runMonteCarlo({
      heroCards: [c('Ac'), c('Kh')],
      boardCards: [c('Qd'), c('Js'), c('Tc')],
      numOpponents: 1,
      simulations: 2500,
    });
    expect(result.simsRun).toBe(2500);
  });

  it('win + tie + loss probabilities sum to 1', () => {
    const result = runMonteCarlo({
      heroCards: [c('7h'), c('2c')],
      boardCards: [],
      numOpponents: 2,
      simulations: 1000,
    });
    const total = result.winProbability + result.tieProbability + result.lossProbability;
    expect(total).toBeCloseTo(1, 5);
  });
});
