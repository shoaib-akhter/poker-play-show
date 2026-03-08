import { Player, Card, Street } from '@/types/poker';

// Simplified equity estimation based on hand strength heuristics
// (A real calculator would need Monte Carlo simulation)

function cardValue(rank: string): number {
  const vals: Record<string, number> = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
    '9': 9, 'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14,
  };
  return vals[rank] || 0;
}

function holeCardStrength(cards: [Card, Card]): number {
  const high = Math.max(cardValue(cards[0].rank), cardValue(cards[1].rank));
  const low = Math.min(cardValue(cards[0].rank), cardValue(cards[1].rank));
  const paired = cards[0].rank === cards[1].rank;
  const suited = cards[0].suit === cards[1].suit;

  let strength = (high + low) / 28; // normalize to ~0-1
  if (paired) strength += 0.15;
  if (suited) strength += 0.04;
  if (high - low <= 2 && !paired) strength += 0.03;

  return Math.min(strength, 1);
}

export function estimateEquity(
  players: Player[],
  communityCards: Card[],
  street: Street,
): Record<string, number> {
  const activePlayers = players.filter(p => !p.isFolded);
  const equities: Record<string, number> = {};

  if (activePlayers.length <= 1) {
    activePlayers.forEach(p => { equities[p.name] = 1; });
    players.filter(p => p.isFolded).forEach(p => { equities[p.name] = 0; });
    return equities;
  }

  const strengths: Record<string, number> = {};
  let totalStrength = 0;

  for (const p of activePlayers) {
    let s = 0.5; // default if no hole cards known
    if (p.holeCards) {
      s = holeCardStrength(p.holeCards);
      // Boost slightly if community cards help
      if (communityCards.length > 0 && p.holeCards) {
        const ranks = communityCards.map(c => c.rank);
        if (ranks.includes(p.holeCards[0].rank)) s += 0.12;
        if (ranks.includes(p.holeCards[1].rank)) s += 0.12;
      }
    }
    // Equity converges more as streets progress
    if (street === 'turn') s = s * 1.1;
    if (street === 'river' || street === 'showdown') s = s * 1.2;

    strengths[p.name] = s;
    totalStrength += s;
  }

  for (const p of activePlayers) {
    equities[p.name] = Math.round((strengths[p.name] / totalStrength) * 100);
  }
  players.filter(p => p.isFolded).forEach(p => { equities[p.name] = 0; });

  return equities;
}
