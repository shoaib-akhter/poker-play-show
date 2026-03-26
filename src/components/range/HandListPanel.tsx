import { useNavigate } from 'react-router-dom';
import { HandStats } from '@/types/poker';
import { getRawText } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Play } from 'lucide-react';

interface HandListPanelProps {
  comboKey: string | null;
  hands: HandStats[];
  onClose: () => void;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatPnl(pnl: number): string {
  const sign = pnl > 0 ? '+' : '';
  return `${sign}$${pnl.toFixed(2)}`;
}

export function HandListPanel({ comboKey, hands, onClose }: HandListPanelProps) {
  const navigate = useNavigate();

  const sorted = [...hands].sort((a, b) => b.playedAt - a.playedAt);

  async function handleReplay(handId: string) {
    const raw = await getRawText(handId);
    if (!raw) return;
    sessionStorage.setItem('poker_hand', raw);
    navigate('/replay');
  }

  const netPnl = hands.reduce((sum, h) => sum + h.heroResult, 0);
  const sign = netPnl >= 0 ? '+' : '';

  return (
    <Sheet open={comboKey !== null} onOpenChange={open => { if (!open) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {comboKey}
            <span className="text-sm font-normal text-muted-foreground">
              {hands.length} hand{hands.length !== 1 ? 's' : ''}
              {' · '}
              <span className={netPnl >= 0 ? 'text-green-500' : 'text-red-500'}>
                {sign}${Math.abs(netPnl).toFixed(2)}
              </span>
            </span>
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 mt-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border">
                <th className="pb-2 font-medium">Date</th>
                <th className="pb-2 font-medium">Stakes</th>
                <th className="pb-2 font-medium text-right">P&L</th>
                <th className="pb-2 w-8" />
              </tr>
            </thead>
            <tbody>
              {sorted.map(h => (
                <tr key={h.handId} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="py-2 text-muted-foreground">{formatDate(h.playedAt)}</td>
                  <td className="py-2 text-muted-foreground">
                    {h.stakes.replace(/\s*USD\s*$/i, '')}
                  </td>
                  <td className={`py-2 text-right font-medium tabular-nums ${h.heroResult >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatPnl(h.heroResult)}
                  </td>
                  <td className="py-2 pl-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => void handleReplay(h.handId)}
                      title="Replay hand"
                    >
                      <Play className="w-3.5 h-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
