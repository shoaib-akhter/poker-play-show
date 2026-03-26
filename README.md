# poker-play-show

A browser-based PokerStars hand history replayer and analytics tool. Import your hand histories, step through hands action-by-action, and analyse your play with stats, position breakdowns, and a hand range heatmap.

## Features

- **Hand Replay** — step through any hand action-by-action on a visual 6-max table. Keyboard navigation (←/→/Space). Copy the raw hand text to clipboard from the replay view.
- **Real-time Equity** — Monte Carlo simulation (5k runs, Web Worker) shows win/tie/loss % at every street based on hero hole cards and board.
- **Hand Library** — bulk import `.txt` files (drag-drop or folder picker). Hands are stored in IndexedDB and persist across sessions. Filter by stakes, position, last N hands, won/lost.
- **Statistics** — cumulative P&L chart ($ or BB), key metrics (VPIP, PFR, 3-Bet, C-Bet, WTSD, W$SD, AF, BB/100), and a position breakdown table. Click a position row to drill into those hands in the library.
- **Range Analysis** — 13×13 hand matrix heatmap. See your P&L, win rate, or frequency for every hand combo (AA, AKs, 72o, etc.). Click any cell to view and replay those specific hands.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI framework | React 18 + TypeScript 5 (strict) |
| Build tool | Vite 5 |
| Styling | Tailwind CSS + shadcn/ui (Radix primitives) |
| Routing | React Router v6 |
| Storage | IndexedDB via `idb` |
| Charts | Recharts |
| Background compute | Web Workers (equity, import, stats recalc) |
| Tests | Vitest (52 tests) |

## Getting Started

```bash
git clone git@github.com:shoaib-akhter/poker-play-show.git
cd poker-play-show
npm install
npm run dev        # http://localhost:8080
```

## Scripts

```bash
npm run dev        # Dev server (port 8080, LAN accessible)
npm run build      # Production build → dist/
npm run typecheck  # tsc --noEmit
npm test           # Vitest test suite
npm run lint       # ESLint
```

## Architecture

All processing happens client-side — no backend, no server, no auth.

- **Parsing** — `src/lib/handHistoryParser.ts` parses PokerStars cash-game format into a typed `ParsedHand` with full `ReplayStep[]` snapshots.
- **Storage** — IndexedDB (`poker-replay-db` v5) holds three stores: `hand_meta`, `hand_raw`, `hand_stats`. Re-importing the same files is always safe (upsert by `handId`).
- **Workers** — heavy work runs off the main thread: `importWorker` (batch parse + stats on import), `statsWorker` (recalculate stats from raw), `equityWorker` (Monte Carlo per step).
- **Hand evaluator** — exhaustive C(7,5)=21 combo evaluator with sortable integer scores. Used inside the Monte Carlo engine.

See [`project-architecture.md`](./project-architecture.md) for detailed data flow diagrams and [`project-progress.md`](./project-progress.md) for feature status and known issues.

## Supported Format

PokerStars cash game hand histories (Texas Hold'em, up to 6 players). Tournament format is not currently supported.
