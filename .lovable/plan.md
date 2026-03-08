

## Poker Hand Replay – Implementation Plan

### Overview
A realistic Texas Hold'em hand replayer with a green felt table, supporting up to 6 players. Users paste hand history text (PokerStars/GGPoker format) to replay hands step-by-step.

### Pages & Layout

**1. Home / Input Page**
- Large textarea to paste hand history text
- "Load Hand" button to parse and navigate to the replay view
- Sample hand history button for quick demo

**2. Replay Page** — Three sections:

#### A. Poker Table (center)
- Oval green felt table with realistic styling (shadows, wood rail border)
- 6 player seats positioned around the table
- Each seat shows: avatar placeholder, player name, stack size, current action label (fold/call/raise), and hole cards (face-down or revealed)
- Community cards displayed in the center of the table
- Pot size displayed prominently in the middle
- Dealer button (D) chip positioned at the correct seat
- Cards styled with realistic faces (suits & ranks using CSS/SVG)

#### B. Controls Bar (bottom)
- Previous / Next step buttons
- Street jump buttons: Preflop → Flop → Turn → River → Showdown
- Current street indicator (highlighted)
- Step counter (e.g., "Step 5 of 23")
- Reset button

#### C. Side Panel (right)
- **Action History**: Scrollable log of all actions up to current step, color-coded (green=call, red=fold, blue=raise)
- **Pot & Stacks**: Live pot total, each player's remaining stack
- **Hand Equity**: Show winning probability for remaining players at each street (calculated or approximate)
- **Street Indicators**: Visual progress bar showing Preflop → Flop → Turn → River → Showdown

### Hand History Parser
- Parse standard PokerStars-format hand histories
- Extract: player names, seat positions, stack sizes, hole cards, community cards, all actions (post blinds, fold, call, raise, bet), pot sizes, and showdown results

### Visual Details
- Green felt background with subtle texture
- Smooth card flip animations when cards are dealt/revealed
- Highlight active player with a glow effect
- Folded players are dimmed
- Winning hand highlighted at showdown

