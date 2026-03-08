/**
 * 7-card hand evaluator using exhaustive 5-card combination scoring.
 *
 * Score encoding (sortable integer):
 *   handClass * 10_000_000_000
 *   + primary   * 100_000_000
 *   + secondary * 1_000_000
 *   + kicker1   * 10_000
 *   + kicker2   * 100
 *   + kicker3
 *
 * Hand classes (highest = best):
 *   8 = Royal Flush (special case of Straight Flush)
 *   7 = Straight Flush
 *   6 = Four of a Kind
 *   5 = Full House
 *   4 = Flush
 *   3 = Straight
 *   2 = Three of a Kind
 *   1 = Two Pair
 *   0 = High Card / Pair (pair uses class = 0 with a secondary rank)
 *
 * Actually for simplicity we use:
 *   9 = Straight Flush (including Royal)
 *   8 = Four of a Kind
 *   7 = Full House
 *   6 = Flush
 *   5 = Straight
 *   4 = Three of a Kind
 *   3 = Two Pair
 *   2 = One Pair
 *   1 = High Card
 */

const HC = 1;
const PAIR = 2;
const TWO_PAIR = 3;
const TRIPS = 4;
const STRAIGHT = 5;
const FLUSH = 6;
const FULL_HOUSE = 7;
const QUADS = 8;
const STRAIGHT_FLUSH = 9;

// Rank of a card integer (0=2 … 12=A)
function cardRank(c: number): number { return Math.floor(c / 4); }
// Suit of a card integer (0–3)
function cardSuit(c: number): number { return c % 4; }

/** Evaluate the best 5-card hand out of 5 specific cards. Returns a sortable score. */
function evaluate5(cards: number[]): number {
  const ranks = cards.map(cardRank).sort((a, b) => b - a); // descending
  const suits = cards.map(cardSuit);

  const isFlush = suits.every(s => s === suits[0]);

  // Rank bitmask for straight detection (rank 0=2 … 12=A)
  let rankBits = 0;
  for (const r of ranks) rankBits |= 1 << r;
  // Wheel: A-2-3-4-5 => bits for A(12),4,3,2,1,0 => 0x1F | (1<<12)
  const WHEEL = (1 << 12) | (1 << 3) | (1 << 2) | (1 << 1) | (1 << 0);
  let isStraight = false;
  let straightHigh = 0;
  // Normal straights
  for (let high = 12; high >= 4; high--) {
    const mask = 0x1F << (high - 4);
    if ((rankBits & mask) === mask) {
      isStraight = true;
      straightHigh = high;
      break;
    }
  }
  // Wheel
  if (!isStraight && (rankBits & WHEEL) === WHEEL) {
    isStraight = true;
    straightHigh = 3; // 5-high straight
  }

  if (isStraight && isFlush) {
    return STRAIGHT_FLUSH * 10_000_000_000 + straightHigh * 100_000_000;
  }

  // Count rank frequencies
  const freq: number[] = new Array(13).fill(0);
  for (const r of ranks) freq[r]++;

  const groups: Array<[number, number]> = []; // [count, rank]
  for (let r = 12; r >= 0; r--) {
    if (freq[r] > 0) groups.push([freq[r], r]);
  }
  // Sort by count desc, then rank desc
  groups.sort((a, b) => b[0] - a[0] || b[1] - a[1]);

  const [topCount, topRank] = groups[0];
  const [secCount, secRank] = groups.length > 1 ? groups[1] : [0, 0];

  if (topCount === 4) {
    const kicker = groups.find(g => g[0] === 1)?.[1] ?? 0;
    return QUADS * 10_000_000_000 + topRank * 100_000_000 + kicker * 1_000_000;
  }
  if (topCount === 3 && secCount === 2) {
    return FULL_HOUSE * 10_000_000_000 + topRank * 100_000_000 + secRank * 1_000_000;
  }
  if (isFlush) {
    return (
      FLUSH * 10_000_000_000 +
      ranks[0] * 100_000_000 +
      ranks[1] * 1_000_000 +
      ranks[2] * 10_000 +
      ranks[3] * 100 +
      ranks[4]
    );
  }
  if (isStraight) {
    return STRAIGHT * 10_000_000_000 + straightHigh * 100_000_000;
  }
  if (topCount === 3) {
    const kickers = groups.filter(g => g[0] === 1).map(g => g[1]);
    return (
      TRIPS * 10_000_000_000 +
      topRank * 100_000_000 +
      (kickers[0] ?? 0) * 1_000_000 +
      (kickers[1] ?? 0) * 10_000
    );
  }
  if (topCount === 2 && secCount === 2) {
    const kicker = groups.find(g => g[0] === 1)?.[1] ?? 0;
    return (
      TWO_PAIR * 10_000_000_000 +
      topRank * 100_000_000 +
      secRank * 1_000_000 +
      kicker * 10_000
    );
  }
  if (topCount === 2) {
    const kickers = groups.filter(g => g[0] === 1).map(g => g[1]);
    return (
      PAIR * 10_000_000_000 +
      topRank * 100_000_000 +
      (kickers[0] ?? 0) * 1_000_000 +
      (kickers[1] ?? 0) * 10_000 +
      (kickers[2] ?? 0) * 100
    );
  }
  // High card
  return (
    HC * 10_000_000_000 +
    ranks[0] * 100_000_000 +
    ranks[1] * 1_000_000 +
    ranks[2] * 10_000 +
    ranks[3] * 100 +
    ranks[4]
  );
}

/** Evaluate best 5-card hand from 7 cards. Returns a sortable score (higher = better). */
export function evaluate7(cards: number[]): number {
  let best = 0;
  // C(7,5) = 21 combinations
  for (let a = 0; a < 7; a++) {
    for (let b = a + 1; b < 7; b++) {
      const five: number[] = [];
      for (let i = 0; i < 7; i++) {
        if (i !== a && i !== b) five.push(cards[i]);
      }
      const score = evaluate5(five);
      if (score > best) best = score;
    }
  }
  return best;
}
