# Hand Replay — Architecture

## Overview

A client-only SPA. No backend, no database, no authentication. All processing happens in the browser — parsing in the main thread, equity simulation in a dedicated Web Worker.

---

## Application Flow

```
User pastes hand history text
         │
         ▼
   [ Index.tsx ]
   Landing page with <textarea>
   "Load Hand" button
         │
         │  sessionStorage.setItem('poker_hand', text)
         │  navigate('/replay')
         ▼
   [ Replay.tsx ]
   Reads sessionStorage on mount
         │
         │  parseHandHistory(text)
         ▼
   [ handHistoryParser.ts ]
   Returns ParsedHand:
     • handId, tableName, stakes
     • players[]  (name, seat, stack, holeCards, isDealer)
     • communityCards[]
     • winners[]
     • steps[]  (ReplayStep[])
         │
         ▼
   useState<ParsedHand>
   useState<currentStep: number>
         │
         ├──── step = hand.steps[currentStep]
         │
         ├──── getEquityInputs(hand, step)
         │       ├── heroCards: number[]   (card integers)
         │       ├── boardCards: number[]  (card integers)
         │       └── numOpponents: number
         │
         ▼
   Renders layout:
   ┌──────────────────────┬──────────────┐
   │   PokerTable.tsx     │ SidePanel.tsx│
   │   ControlsBar.tsx    │              │
   └──────────────────────┴──────────────┘
```

---

## Component Tree

```
App.tsx
├── QueryClientProvider         (react-query)
├── TooltipProvider             (radix)
├── Toaster                     (shadcn toast)
├── Sonner                      (sonner toast)
└── BrowserRouter
    ├── Route "/"       → Index.tsx
    ├── Route "/replay" → Replay.tsx
    │   ├── <PokerTable>
    │   │   ├── <PlayerSeat>  ×6  (one per seat position)
    │   │   │   └── <PlayingCard>  ×2  (hole cards)
    │   │   └── <PlayingCard>  ×5  (community cards)
    │   ├── <ControlsBar>
    │   └── <SidePanel>
    │       └── useEquity()  ──► Web Worker
    └── Route "*"       → NotFound.tsx
```

---

## Data Flow: Replay Steps

```
ParsedHand.steps: ReplayStep[]
  │
  │  Each ReplayStep contains a full snapshot:
  │    stepIndex: number
  │    street: Street           ('preflop'|'flop'|'turn'|'river'|'showdown')
  │    action?: Action          (the action that caused this step)
  │    players: Player[]        (full player state AT this step)
  │    communityCards: Card[]   (visible board cards AT this step)
  │    potSize: number
  │    activePlayerName?: string
  │    description: string
  │
  ▼
currentStep index (useState)
  │
  ├──► PokerTable     renders step.players, step.communityCards
  ├──► ControlsBar    displays step counter, highlights current street
  └──► SidePanel      reads step.potSize, step.players for stacks
                      triggers equity recalculation on step change
```

---

## Equity Calculation Pipeline

```
Main Thread                          Worker Thread
──────────────────────────────────   ────────────────────────────────
Replay.tsx
  getEquityInputs(hand, step)
    → heroCards: number[]
    → boardCards: number[]
    → numOpponents: number
         │
         ▼
  useEquity(heroCards, boardCards, numOpponents)
    │
    │  200ms debounce
    │
    │  worker.postMessage(MonteCarloInput)
    │ ─────────────────────────────────►  equityWorker.ts
    │                                       │
    │                                       ▼
    │                                     runMonteCarlo(input)
    │                                       │
    │                                       ▼
    │                                     remainingDeck(heroCards ∪ boardCards)
    │                                       │
    │                                       ▼  × simulations (default 5000)
    │                                     shuffle(pool)          [Fisher-Yates]
    │                                     deal 2 cards × numOpponents
    │                                     complete board to 5 cards
    │                                     evaluate7([heroCards, board])   [best of C(7,5)=21 combos]
    │                                     evaluate7([oppCards,  board])   per opponent
    │                                     tally win / tie / loss
    │                                       │
    │  worker.onmessage(MonteCarloResult) ◄─┘
    │    winProbability: number
    │    tieProbability: number
    │    lossProbability: number
    │    simsRun: number
    │
    ▼
  SidePanel.tsx
    renders Win / Tie / Loss %
    shows spinner while loading: true
```

---

## Card Encoding

```
Cards are integers 0–51:
  cardIndex = rank * 4 + suit

Rank (0–12):  2  3  4  5  6  7  8  9  T  J  Q  K  A
              0  1  2  3  4  5  6  7  8  9  10 11 12

Suit (0–3):   c  d  h  s
              0  1  2  3

Examples:
  2c = 0*4+0 = 0
  Ah = 12*4+2 = 50
  As = 12*4+3 = 51

Functions:
  parseCard("Ah")  → 50
  cardToString(50) → "Ah"
  FULL_DECK        → [0, 1, 2, ..., 51]
  remainingDeck([50, 51]) → [0..49]  (deck minus Ah, As)
```

---

## Hand Evaluator

```
evaluate7(cards: number[])  →  score: number

  For each of C(7,5) = 21 five-card combinations:
    evaluate5(five) → class_score
  Return max(class_score)

Score encoding (sortable integer):
  handClass  × 10_000_000_000   ← dominant: determines hand category
  + primary  × 100_000_000      ← e.g. pair rank, straight high, trips rank
  + secondary× 1_000_000        ← e.g. second pair, full-house pair rank
  + kicker1  × 10_000
  + kicker2  × 100
  + kicker3

Hand classes (highest → lowest):
  9  Straight Flush  (includes Royal Flush — highest SF wins)
  8  Four of a Kind
  7  Full House
  6  Flush
  5  Straight        (wheel A-2-3-4-5 = straightHigh 3 = lowest)
  4  Three of a Kind
  3  Two Pair
  2  One Pair
  1  High Card

Straight detection:
  rankBits = bitmask of the five card ranks (bit 0 = rank 2, bit 12 = Ace)
  Test masks 0x1F<<(high-4) for high = 12 down to 4
  Wheel: special case mask = 0b1_0000_0000_1111 (A + 2+3+4+5)
```

---

## Parser State Machine

```
parseHandHistory(text: string)

Input: raw PokerStars hand history (newline-separated)
Output: ParsedHand

Lines are processed sequentially. State variables accumulate:

  handId         ← /Hand #(\S+)/
  tableName      ← /Table '([^']+)'/
  stakes         ← /\(([^)]*\$[^)]+)\)/  (first match)
  dealerSeat     ← /Seat #(\d+) is the button/
  players[]      ← /^Seat (\d+): (.+?) \(\$?([\d,.]+)/
  holeCards{}    ← /Dealt to (.+?) \[(.+?)\]/
                   /(.+?): shows \[(.+?)\]/
  currentStreet  ← transitions on:
                   "*** FLOP ***"     → 'flop',   pushes 3 community cards
                   "*** TURN ***"     → 'turn',   pushes 1 card (last in line)
                   "*** RIVER ***"    → 'river',  pushes 1 card
                   "*** SHOW DOWN ***"→ 'showdown'
                   "*** SUMMARY ***"  → 'showdown'
  actions[]      ← matches player name prefix, then:
                   "posts small/big blind" → post_blind + amount
                   "folds"                 → fold
                   "checks"               → check
                   "calls"                → call + amount
                   "bets"                 → bet + amount
                   "raises ... to Y"      → raise + amount Y
  winners[]      ← /(.+?) collected \$?([\d,.]+)/

→ buildReplaySteps(players, actions, communityCards, winners)
    Creates one ReplayStep per action (plus street-transition steps and showdown step)
    Each step is a full immutable snapshot of game state
```

---

## Key Type Definitions

```typescript
// src/types/poker.ts

type Suit = 'h' | 'd' | 'c' | 's'
type Rank = '2'|'3'|'4'|'5'|'6'|'7'|'8'|'9'|'T'|'J'|'Q'|'K'|'A'
type Street = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown'
type ActionType = 'post_blind' | 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'all_in'

interface Card       { rank: Rank; suit: Suit }
interface Action     { playerName: string; type: ActionType; amount?: number; street: Street }
interface Player     { name: string; seatIndex: number; stackSize: number;
                       holeCards?: [Card, Card]; isDealer: boolean;
                       isFolded: boolean; currentBet: number; hasActed: boolean }
interface ReplayStep { stepIndex: number; street: Street; action?: Action;
                       players: Player[]; communityCards: Card[];
                       potSize: number; activePlayerName?: string; description: string }
interface ParsedHand { handId: string; tableName: string; stakes: string;
                       players: Player[]; steps: ReplayStep[];
                       communityCards: Card[];
                       winners: { playerName: string; amount: number; hand?: string }[] }

// src/lib/monteCarlo.ts

interface MonteCarloInput  { heroCards: number[]; boardCards: number[];
                             numOpponents: number; simulations?: number }
interface MonteCarloResult { winProbability: number; tieProbability: number;
                             lossProbability: number; simsRun: number }
```

---

## Module Dependency Graph

```
main.tsx
  └── App.tsx
        └── pages/
              ├── Index.tsx
              │     └── lib/handHistoryParser.ts  (SAMPLE_HAND_HISTORY)
              │
              ├── Replay.tsx
              │     ├── lib/handHistoryParser.ts   (parseHandHistory)
              │     ├── lib/cards.ts               (parseCard → toCardInt)
              │     ├── components/poker/PokerTable.tsx
              │     │     ├── components/poker/PlayerSeat.tsx
              │     │     │     └── components/poker/PlayingCard.tsx
              │     │     └── components/poker/PlayingCard.tsx
              │     ├── components/poker/ControlsBar.tsx
              │     └── components/poker/SidePanel.tsx
              │           └── hooks/useEquity.ts
              │                 └── [Web Worker] workers/equityWorker.ts
              │                       └── lib/monteCarlo.ts
              │                             ├── lib/cards.ts        (remainingDeck)
              │                             └── lib/handEvaluator.ts (evaluate7)
              │
              └── Library.tsx
                    ├── hooks/useImport.ts
                    │     ├── lib/handSplitter.ts   (splitHandFile, parseDateFromHeader)
                    │     ├── lib/db.ts             (putHandBatch)
                    │     └── [Web Worker] workers/importWorker.ts
                    │           ├── lib/handHistoryParser.ts  (parseHandHistory)
                    │           ├── lib/handSplitter.ts
                    │           └── lib/heroResult.ts         (extractHeroResult)
                    ├── hooks/useHandLibrary.ts
                    │     └── lib/db.ts             (getAllMeta)
                    ├── components/library/ImportZone.tsx
                    └── components/library/HandTable.tsx
                          └── lib/db.ts             (getRawText)

lib/cards.ts           (no local imports)
lib/handEvaluator.ts   (no local imports)
lib/handSplitter.ts    (no local imports)
lib/heroResult.ts      → types/poker.ts
lib/monteCarlo.ts      → lib/cards.ts, lib/handEvaluator.ts
lib/db.ts              → types/poker.ts, idb
lib/equityCalculator.ts  ← DEPRECATED, not imported by any live code
```

---

## IndexedDB Schema

```
Database: poker-replay-db  v1

hand_meta  (keyPath: handId)
  ├── handId: string         ← primary key; put() = upsert → safe re-import
  ├── tableName: string
  ├── stakes: string
  ├── playedAt: number       ← UTC ms; index: by_date
  ├── heroName: string
  ├── heroResult: number     ← net P&L $; index: by_result
  └── playerCount: number

hand_raw   (keyPath: handId)
  ├── handId: string
  └── rawText: string        ← single hand raw text (~3 KB each)

Library table queries hand_meta only.
Replay button does a point lookup on hand_raw.
```

---

## Import Pipeline

```
User drops / picks .txt files
         │
         ▼
useImport.ts (main thread)
  file.text() → splitHandFile()     (normalize CRLF, split on blank lines)
         │
         │  allHandTexts: string[]
         │
         ▼  worker.postMessage({ handTexts, batchIndex: 0 })
[Web Worker] importWorker.ts
  for each batch of 100:
    parseHandHistory(rawText)        → ParsedHand
    extractHeroResult(parsed)        → { heroName, heroResult }
    parseDateFromHeader(firstLine)   → playedAt (UTC ms)
    build HandMeta + HandRaw
    postMessage({ type: 'progress', metas, raws })
         │
         ▼  onmessage (main thread)
useImport.ts
  putHandBatch(metas, raws)          → one IDB transaction per batch
  setState({ processed })            → progress bar updates
         │
  postMessage({ type: 'done' })
         │
         ▼
  sonner toast("Import complete — N hands imported")
  onComplete() → useHandLibrary.reload()
```

---

## Routing

```
/          → Index.tsx    (landing page, hand input)
/replay    → Replay.tsx   (replay viewer)
/library   → Library.tsx  (hand library — bulk import, browse, filter, replay)
*          → NotFound.tsx (404)
```

Data is passed between pages via `sessionStorage` (key: `'poker_hand'`).
There is no URL-based state — refreshing `/replay` redirects back to `/`.
The back button in Replay uses `navigate(-1)` so it returns to Library or Index correctly.

---

## Design System

```
Theme: dark poker table aesthetic

Fonts:
  Playfair Display  →  headings (display font)
  Inter             →  body text
  IBM Plex Mono     →  monospace (stacks, amounts, card values)

Core CSS variables (HSL):
  --background      150 10% 10%     dark greenish black
  --foreground      45 20% 90%      warm cream
  --primary         45 70% 55%      gold
  --gold            45 70% 55%      gold accent
  --felt            150 30% 22%     poker felt green
  --felt-dark       150 25% 14%     darker felt
  --felt-light      150 30% 28%     lighter felt
  --rail            25 40% 28%      wooden rail brown
  --rail-light      25 50% 35%      lighter rail

Action colors:
  --action-fold     0   60% 50%     red
  --action-call     210 60% 55%     blue
  --action-bet      45  70% 55%     gold
  --action-raise    30  80% 55%     orange
  --suit-red        0   80% 50%     hearts / diamonds
  --suit-black      220 10% 20%     clubs / spades
```

---

## Build & Dev Commands

```bash
npm run dev        # Vite dev server → http://localhost:8080  (also http://<LAN-IP>:8080)
npm run build      # Production build → dist/
npm run preview    # Preview production build locally
npm run typecheck  # tsc --noEmit (zero errors required)
npm test           # vitest run (48 tests)
npm run test:watch # vitest (watch mode)
npm run lint       # eslint
```

---

## Web Worker Lifecycle

```
SidePanel mounts
    │
    ▼
useEquity() effect runs once
    │
    new Worker(equityWorker.ts, { type: 'module' })
    │
    worker.onmessage = setResult + setLoading(false)
    │
    [heroCards / boardCards / numOpponents change]
    │
    200ms debounce fires
    │
    setLoading(true)
    worker.postMessage({ heroCards, boardCards, numOpponents, simulations: 5000 })
    │                           ↓  (Worker thread)
    │                         runMonteCarlo()  ~50ms at 5k sims
    │                           ↓
    worker.onmessage fires  ←── postMessage(result)
    │
    setResult(result)
    setLoading(false)
    │
SidePanel unmounts
    │
    worker.terminate()
```
