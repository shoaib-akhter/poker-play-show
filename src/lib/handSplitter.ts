export function splitHandFile(text: string): string[] {
  return text
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map(s => s.trim())
    .filter(s => s.startsWith('PokerStars Hand #'));
}

export function parseDateFromHeader(firstLine: string): number {
  const m = firstLine.match(/(\d{4})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
  if (!m) return Date.now();
  return Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
}
