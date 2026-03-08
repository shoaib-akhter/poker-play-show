// Cards are encoded as integers 0–51: cardIndex = rank * 4 + suit
// Ranks: 0=2, 1=3, ..., 8=T, 9=J, 10=Q, 11=K, 12=A
// Suits: 0=c, 1=d, 2=h, 3=s

const RANK_CHARS = '23456789TJQKA';
const SUIT_CHARS = 'cdhs';

/** Parse a 2-char card string (e.g. "Ah", "2c") into a 0–51 integer. Returns -1 on invalid input. */
export function parseCard(str: string): number {
  if (!str || str.length < 2) return -1;
  const rank = RANK_CHARS.indexOf(str[0].toUpperCase() === 'T' ? 'T' : str[0].toUpperCase());
  if (rank === -1) return -1;
  const suit = SUIT_CHARS.indexOf(str[1].toLowerCase());
  if (suit === -1) return -1;
  return rank * 4 + suit;
}

/** Convert a 0–51 card integer back to a 2-char string like "Ah". */
export function cardToString(card: number): string {
  const rank = Math.floor(card / 4);
  const suit = card % 4;
  return RANK_CHARS[rank] + SUIT_CHARS[suit];
}

/** All 52 cards as integers 0–51. */
export const FULL_DECK: readonly number[] = Array.from({ length: 52 }, (_, i) => i);

/** Return the deck minus the given excluded cards. */
export function remainingDeck(excluded: number[]): number[] {
  const set = new Set(excluded);
  return FULL_DECK.filter(c => !set.has(c));
}
