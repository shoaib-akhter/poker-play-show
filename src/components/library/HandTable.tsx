import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ChevronUp, ChevronDown, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HandMeta } from '@/types/poker';
import { getRawText } from '@/lib/db';
import { SortField, SortDir } from '@/hooks/useHandLibrary';

interface HandTableProps {
  hands: HandMeta[];
  sortField: SortField;
  sortDir: SortDir;
  onToggleSort: (field: SortField) => void;
}

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) {
  if (sortField !== field) return <ChevronDown className="w-3 h-3 opacity-30" />;
  return sortDir === 'asc'
    ? <ChevronUp className="w-3 h-3" />
    : <ChevronDown className="w-3 h-3" />;
}

function formatPnl(amount: number) {
  const sign = amount >= 0 ? '+' : '';
  return `${sign}$${amount.toFixed(2)}`;
}

export function HandTable({ hands, sortField, sortDir, onToggleSort }: HandTableProps) {
  const navigate = useNavigate();

  async function handleReplay(handId: string) {
    const raw = await getRawText(handId);
    if (!raw) return;
    sessionStorage.setItem('poker_hand', raw);
    navigate('/replay');
  }

  return (
    <div className="rounded-md border border-border overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[1fr_1.5fr_0.8fr_0.8fr_auto] gap-0 bg-muted/50 text-xs font-semibold text-muted-foreground">
        <button
          className="flex items-center gap-1 px-4 py-3 hover:text-foreground text-left"
          onClick={() => onToggleSort('playedAt')}
        >
          Date <SortIcon field="playedAt" sortField={sortField} sortDir={sortDir} />
        </button>
        <div className="px-4 py-3">Table</div>
        <div className="px-4 py-3">Stakes</div>
        <button
          className="flex items-center gap-1 px-4 py-3 hover:text-foreground text-left"
          onClick={() => onToggleSort('heroResult')}
        >
          P&amp;L <SortIcon field="heroResult" sortField={sortField} sortDir={sortDir} />
        </button>
        <div className="px-4 py-3" />
      </div>

      {/* Body */}
      <ScrollArea className="h-[500px]">
        {hands.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-16">
            No hands to display
          </div>
        ) : (
          hands.map(hand => (
            <div
              key={hand.handId}
              className="grid grid-cols-[1fr_1.5fr_0.8fr_0.8fr_auto] gap-0 border-t border-border hover:bg-muted/30 transition-colors text-sm"
            >
              <div className="px-4 py-3 text-muted-foreground">
                {format(new Date(hand.playedAt), 'MMM d yyyy')}
              </div>
              <div className="px-4 py-3 truncate">{hand.tableName}</div>
              <div className="px-4 py-3 text-muted-foreground">{hand.stakes}</div>
              <div className={`px-4 py-3 font-medium ${hand.heroResult >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatPnl(hand.heroResult)}
              </div>
              <div className="px-3 py-2 flex items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => void handleReplay(hand.handId)}
                  title="Replay this hand"
                >
                  <Play className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </ScrollArea>
    </div>
  );
}
