import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SAMPLE_HAND_HISTORY } from '@/lib/handHistoryParser';
import { Spade, Library, BarChart2 } from 'lucide-react';

const Index = () => {
  const [handText, setHandText] = useState('');
  const navigate = useNavigate();

  const handleLoad = () => {
    if (!handText.trim()) return;
    sessionStorage.setItem('poker_hand', handText);
    navigate('/replay');
  };

  const loadSample = () => {
    setHandText(SAMPLE_HAND_HISTORY);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <Spade className="w-10 h-10 text-[hsl(var(--gold))]" />
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
              Hand Replayer
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Paste a PokerStars hand history to replay it step-by-step
          </p>
          <div className="flex gap-2 justify-center mt-1">
            <Link to="/library">
              <Button variant="outline" size="sm" className="gap-2">
                <Library className="w-4 h-4" />
                My Library
              </Button>
            </Link>
            <Link to="/stats">
              <Button variant="outline" size="sm" className="gap-2">
                <BarChart2 className="w-4 h-4" />
                Statistics
              </Button>
            </Link>
          </div>
        </div>

        {/* Input area */}
        <div className="space-y-4">
          <Textarea
            value={handText}
            onChange={(e) => setHandText(e.target.value)}
            placeholder={`Paste your hand history here...\n\nPokerStars Hand #12345: Hold'em No Limit ($1/$2 USD)\nTable 'Example' 6-max Seat #1 is the button\n...`}
            className="min-h-[300px] bg-card border-border font-mono text-sm resize-none"
          />

          <div className="flex gap-3 justify-center">
            <Button
              onClick={handleLoad}
              disabled={!handText.trim()}
              className="px-8 bg-[hsl(var(--gold))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--gold-dim))] font-semibold"
            >
              Load Hand
            </Button>
            <Button
              variant="outline"
              onClick={loadSample}
            >
              Load Sample Hand
            </Button>
          </div>
        </div>

        {/* Info */}
        <p className="text-center text-xs text-muted-foreground">
          Supports PokerStars format • Texas Hold'em • Up to 6 players
        </p>
      </div>
    </div>
  );
};

export default Index;
