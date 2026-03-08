import { cn } from '@/lib/utils';
import type { Card as CardType, Suit } from '@/types/poker';

const suitSymbols: Record<Suit, string> = {
  h: '♥', d: '♦', c: '♣', s: '♠',
};

const suitColors: Record<Suit, string> = {
  h: 'text-[hsl(var(--suit-red))]',
  d: 'text-[hsl(var(--suit-red))]',
  c: 'text-[hsl(var(--suit-black))]',
  s: 'text-[hsl(var(--suit-black))]',
};

interface PlayingCardProps {
  card?: CardType;
  faceDown?: boolean;
  small?: boolean;
  className?: string;
}

export function PlayingCard({ card, faceDown = false, small = false, className }: PlayingCardProps) {
  const size = small ? 'w-8 h-11 text-xs' : 'w-12 h-[68px] text-sm';

  if (faceDown || !card) {
    return (
      <div className={cn(
        size,
        'rounded-md shadow-md flex items-center justify-center',
        'bg-[hsl(var(--card-back))] border border-[hsl(var(--card-back))]',
        'bg-gradient-to-br from-[hsl(220,60%,40%)] to-[hsl(220,60%,28%)]',
        className
      )}>
        <div className="w-[70%] h-[75%] border border-white/20 rounded-sm" />
      </div>
    );
  }

  return (
    <div className={cn(
      size,
      'rounded-md shadow-md flex flex-col items-center justify-between p-1',
      'bg-[hsl(var(--card-white))] border border-gray-300',
      suitColors[card.suit],
      className
    )}>
      <span className="font-bold leading-none">{card.rank}</span>
      <span className={cn(small ? 'text-sm' : 'text-lg', 'leading-none')}>{suitSymbols[card.suit]}</span>
    </div>
  );
}
