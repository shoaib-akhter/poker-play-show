# Hand Replay — Project Progress

## What This Project Is

A single-page web application for replaying PokerStars cash-game hand histories. Users paste a raw hand history text, then step through the hand action-by-action on an animated poker table. A Monte Carlo equity engine (running off the main thread in a Web Worker) computes win/tie/loss probabilities at every street based on the hero's hole cards and visible board.

**Stack:** React 18, TypeScript 5, Vite 5, Tailwind CSS, shadcn/ui (Radix UI), React Router, Vitest.

---

## Current State (as of 2026-03-26 — updated)

### Implemented and Working

#### Infrastructure
| Item | Status | Notes |
|------|--------|-------|
| Repository cloned and `npm install` working | ✅ Done | All dependencies resolved |
| Dev server on port 8080 | ✅ Done | `npm run dev` |
| LAN-accessible dev server | ✅ Done | `host: '0.0.0.0'` in vite.config.ts |
| Production build | ✅ Done | `npm run build` → `dist/` |
| `npm run typecheck` script | ✅ Done | `tsc --noEmit` |
| `npm test` | ✅ Done | 48 tests, all passing |

#### TypeScript Code Quality
| Flag | Status |
|------|--------|
| `noUnusedLocals: true` | ✅ Enabled |
| `noUnusedParameters: true` | ✅ Enabled |
| `noImplicitAny: true` | ✅ Enabled |
| `strict: true` | ✅ Enabled (bundles strictNullChecks, strictFunctionTypes, etc.) |

Both `tsconfig.json` (root) and `tsconfig.app.json` (app compilation unit) reflect these settings. Zero type errors.

#### Range Analysis + Copy Hand (new — 2026-03-26)
| Component | Status | Notes |
|-----------|--------|-------|
| `src/pages/Range.tsx` | ✅ Done | `/range`: 13×13 hand matrix heatmap, stakes + lastN filters, heatmap toggle |
| `src/components/range/HandMatrix.tsx` | ✅ Done | 13×13 CSS grid; aggregates HandStats by combo key; P&L/Win%/Frequency heatmap modes |
| `src/components/range/HandListPanel.tsx` | ✅ Done | shadcn Sheet; lists hands for a combo newest-first; ▶ replay button |
| `src/lib/handStats.ts` — combo utils | ✅ Done | `getHandComboKey(c1,c2)` → "AKs"/"AA"/"72o"; `getMatrixPosition(key)` → `{row,col}` |
| `HandStats.heroHoleCards` | ✅ Done | `heroHoleCards?: [Card, Card]` field added; populated in `computeHandStats()` |
| Copy Hand button (Replay) | ✅ Done | Top bar button copies `sessionStorage['poker_hand']` to clipboard; Check icon 2s feedback |
| IDB v5 upgrade | ✅ Done | Bumped from v4→v5; clears `hand_stats` to backfill `heroHoleCards` on next recalc |
| Range nav links | ✅ Done | Grid2x2 icon link added to Index, Library, and Stats top bars |

#### Hand Library (new — 2026-03-08)
| Component | Status | Notes |
|-----------|--------|-------|
| `src/lib/handSplitter.ts` | ✅ Done | `splitHandFile()` splits multi-hand .txt; `parseDateFromHeader()` extracts UTC ms |
| `src/lib/heroResult.ts` | ✅ Done | `extractHeroResult()` computes net P&L from `ParsedHand.winners` + final stack |
| `src/lib/db.ts` | ✅ Done | IndexedDB via `idb`: two stores (`hand_meta`, `hand_raw`), `putHandBatch`, `getAllMeta`, `getRawText`, `getHandCount` |
| `src/workers/importWorker.ts` | ✅ Done | Web Worker: parses hands in batches of 100, posts `progress` + `done` messages |
| `src/hooks/useImport.ts` | ✅ Done | Reads files, splits hands, drives importWorker, writes IDB per batch, sonner toast on completion |
| `src/hooks/useHandLibrary.ts` | ✅ Done | Loads `hand_meta` from IDB, in-memory filter (all/won/lost) and sort (date/P&L, asc/desc) |
| `src/components/library/ImportZone.tsx` | ✅ Done | Drag-drop + file picker + folder picker + progress bar |
| `src/components/library/HandTable.tsx` | ✅ Done | Sortable table with P&L colour, ▶ replay button (IDB → sessionStorage → navigate) |
| `src/pages/Library.tsx` | ✅ Done | Route `/library`: import zone, stats bar (total/won/lost/net), filter toggles, hand table |
| IndexedDB schema | ✅ Done | `poker-replay-db` v1; `hand_meta` indexed by `by_date`, `by_result`; `put()` = silent upsert (dedup) |
| `src/types/poker.ts` | ✅ Done | Added `HandMeta`, `HandRaw` interfaces |
| `idb` dependency | ✅ Done | v8.0.3 installed |

#### Core Application
| Component | Status | Notes |
|-----------|--------|-------|
| Landing page (`Index.tsx`) | ✅ Done | Textarea input, Load Hand, Load Sample Hand, **My Library** button |
| `parseHandHistory()` | ✅ Done | Parses PokerStars cash-game hand format |
| `buildReplaySteps()` | ✅ Done | Converts parsed hand into step-by-step replay |
| Poker table visual (`PokerTable.tsx`) | ✅ Done | 6-max oval table with felt/rail rendering |
| Player seats (`PlayerSeat.tsx`) | ✅ Done | Stack, hole cards, action label, dealer button, winner highlight |
| Playing cards (`PlayingCard.tsx`) | ✅ Done | Face-up/face-down, red/black suits |
| Controls (`ControlsBar.tsx`) | ✅ Done | Prev/next step, jump-to-street, reset |
| Side panel (`SidePanel.tsx`) | ✅ Done | Street progress, equity panel, pot/stacks, action history |
| Replay page (`Replay.tsx`) | ✅ Done | Keyboard nav (←/→/Space), hero card extraction per step |

#### Equity Engine (Monte Carlo)
| Module | Status | Notes |
|--------|--------|-------|
| `src/lib/cards.ts` | ✅ Done | Integer card encoding (rank×4+suit, 0–51) |
| `src/lib/handEvaluator.ts` | ✅ Done | `evaluate7()` — exhaustive C(7,5)=21 combos, sortable score |
| `src/lib/monteCarlo.ts` | ✅ Done | `runMonteCarlo()` — Fisher-Yates shuffle, 5k sims default |
| `src/workers/equityWorker.ts` | ✅ Done | Web Worker wrapper — runs off main thread |
| `src/hooks/useEquity.ts` | ✅ Done | React hook, 200ms debounce, worker lifecycle |
| Equity displayed in SidePanel | ✅ Done | Win/Tie/Loss %, spinner while computing |

#### Test Coverage
| Test file | Tests | Status |
|-----------|-------|--------|
| `handHistoryParser.test.ts` | 27 | ✅ All passing |
| `handEvaluator.test.ts` | 17 | ✅ All passing |
| `monteCarlo.test.ts` | 7 | ✅ All passing |
| `example.test.ts` | 1 | ✅ Passing |
| **Total** | **52** | **✅ 52/52** |

---

## Known Bugs

| # | Bug | Location | Severity |
|---|-----|----------|----------|
| 1 | `handId` includes trailing colon — regex `Hand #(\S+)` captures `RC827364510:` instead of `RC827364510` | `handHistoryParser.ts:39` | Low (display only) |
| 2 | Worker errors are silently swallowed — `useEquity` sets no error state if the worker throws | `useEquity.ts` | Low |
| 3 | `equityCalculator.ts` still exports the old heuristic function — it is unused but not formally deprecated/stubbed | `equityCalculator.ts` | Low |

---

## What Remains To Be Done

### Short-term (code changes)

| Task | Priority | Notes |
|------|----------|-------|
| Fix `handId` trailing colon bug | High | Change regex to `/Hand #(\S+?):/` or strip colon post-match |
| Formally deprecate `equityCalculator.ts` | Medium | Replace body with a re-export or `@deprecated` JSDoc + stub |
| Add `onerror` handler in `useEquity` | Medium | Set `loading: false` and optionally surface error to UI |
| Support player "sitting out" in seat parsing | Low | Parser currently skips seats with "sitting out" suffix |
| All-in blind edge case | Low | `posts the blind $X and is all-in` not handled as `post_blind` |
| Muck line parsing | Low | `player: mucks hand` lines are silently skipped |
| Library: delete individual hands | Low | Add per-row delete (IDB `delete` on both stores) |
| Library: search/filter by table name | Low | Text input filter applied client-side in `useHandLibrary` |

### Medium-term (features)

| Task | Notes |
|------|-------|
| Adjustable simulation count | Add UI slider in SidePanel (1k / 5k / 50k) — higher sims for publication-quality equity |
| Range vs. range equity | Currently hero cards only; extend `MonteCarloInput` to accept opponent ranges |
| Tournament hand history support | PokerStars tournament headers use different format; currently silently misparses |
| PLO (Omaha) support | Requires 4-hole-card evaluation (C(6,4)×C(4,2) combos) |
| Hand notes / annotation | Allow users to type notes per step, saved to localStorage |
| Export to GIF / video | Step-through animation export |
| ~~Library: P&L over time chart~~ | ✅ Done — P&L chart on Stats page |
| Library: IDB clear / reset | Button to wipe the database and start fresh |

### Deployment (optional)

| Task | Notes |
|------|-------|
| Vercel deployment | Push repo → connect to Vercel → build cmd: `npm run build`, publish dir: `dist` |
| Netlify deployment | Same build settings as Vercel |
| ngrok ephemeral URL | `ngrok http 8080` — no code changes needed, just run locally |

---

## File Inventory

```
hand-replay/
├── index.html                        # Entry HTML, OG tags (title placeholder not updated)
├── package.json                      # Scripts: dev, build, test, typecheck
├── tsconfig.json                     # Root TS config (strict mode, noUnused*, noImplicitAny)
├── tsconfig.app.json                 # App compilation config (strict: true)
├── tsconfig.node.json                # Node/Vite config compilation
├── vite.config.ts                    # Vite: port 8080, host 0.0.0.0, SWC, lovable-tagger
├── vitest.config.ts                  # Vitest: jsdom, globals, @/ alias
├── tailwind.config.ts                # Poker-themed design tokens (felt, rail, gold, suits)
├── postcss.config.js
├── eslint.config.js
├── components.json                   # shadcn/ui config
├── project-progress.md               # ← THIS FILE
├── project-architecture.md          # Architecture diagrams
│
└── src/
    ├── main.tsx                      # React root mount
    ├── App.tsx                       # Router + providers
    ├── index.css                     # Tailwind + CSS variables (dark poker theme)
    ├── vite-env.d.ts
    │
    ├── types/
    │   └── poker.ts                  # Suit, Rank, Card, Street, ActionType, Action,
    │                                 # Player, ReplayStep, ParsedHand
    │
    ├── lib/
    │   ├── handHistoryParser.ts      # parseHandHistory() + buildReplaySteps() + SAMPLE_HAND_HISTORY
    │   ├── equityCalculator.ts       # DEPRECATED — heuristic estimateEquity() (replaced by monteCarlo.ts)
    │   ├── cards.ts                  # parseCard(), cardToString(), FULL_DECK, remainingDeck()
    │   ├── handEvaluator.ts          # evaluate7() — 7-card best-hand evaluator
    │   ├── monteCarlo.ts             # runMonteCarlo() — MonteCarloInput/Result types
    │   ├── handSplitter.ts           # splitHandFile(), parseDateFromHeader()
    │   ├── heroResult.ts             # extractHeroResult() → {heroName, heroResult}
    │   ├── db.ts                     # IndexedDB (idb): openDB, putHandBatch, getAllMeta, getRawText
    │   └── utils.ts                  # cn() — clsx + tailwind-merge
    │
    ├── hooks/
    │   ├── useEquity.ts              # useEquity(heroCards, boardCards, numOpponents) → {result, loading}
    │   ├── useImport.ts              # File import orchestration → importWorker → IDB writes
    │   ├── useHandLibrary.ts         # IDB read + in-memory filter/sort for Library page
    │   ├── use-mobile.tsx            # useIsMobile() — 768px breakpoint
    │   └── use-toast.ts              # useToast() — reducer-based toast notifications
    │
    ├── workers/
    │   ├── equityWorker.ts           # Web Worker: receives MonteCarloInput, posts MonteCarloResult
    │   ├── importWorker.ts           # Web Worker: batch-parses hands, posts progress+done messages
    │   └── statsWorker.ts            # Web Worker: recomputes HandStats from raw; posts progress+metaCorrections+done
    │
    ├── pages/
    │   ├── Index.tsx                 # Landing page — hand history input + Library/Stats/Range links
    │   ├── Replay.tsx                # Replay page — step nav, equity inputs, Copy Hand button, navigate(-1) back
    │   ├── Library.tsx               # /library — import zone, stats, filter, hand table; URL params ?position=&stakes=&last=
    │   ├── Stats.tsx                 # /stats — stakes+lastN filters, P&L chart, GeneralStats, PositionStats, recalc banner
    │   ├── Range.tsx                 # /range — stakes+lastN filters, heatmap toggle, HandMatrix, HandListPanel
    │   └── NotFound.tsx              # 404 fallback
    │
    ├── components/
    │   ├── library/
    │   │   ├── ImportZone.tsx        # Drag-drop + file/folder pickers + progress bar
    │   │   └── HandTable.tsx         # Sortable table + P&L colours + replay button
    │   ├── poker/
    │   │   ├── PokerTable.tsx        # Oval table, community cards, player seats
    │   │   ├── PlayerSeat.tsx        # Individual player: name, stack, cards, action, dealer btn
    │   │   ├── PlayingCard.tsx       # Single card: face-up or face-down, two sizes
    │   │   ├── ControlsBar.tsx       # Step prev/next, street jump buttons, reset
    │   │   └── SidePanel.tsx         # Street progress, equity panel, pot/stacks, action history
    │   ├── stats/
    │   │   ├── PnlChart.tsx          # Recharts cumulative P&L line ($/BB toggle)
    │   │   ├── GeneralStats.tsx      # 4×3 grid of VPIP/PFR/3-Bet/WTSD/AF/etc
    │   │   └── PositionStats.tsx     # Per-position table; clickable rows → Library filtered by position
    │   ├── range/
    │   │   ├── HandMatrix.tsx        # 13×13 CSS grid; P&L/Win%/Frequency heatmap; cell click
    │   │   └── HandListPanel.tsx     # shadcn Sheet; hand list for a combo; ▶ replay button
    │   └── ui/                       # ~40 shadcn/ui components (Button, ScrollArea, Sheet, etc.)
    │
    └── test/
        ├── setup.ts                  # matchMedia polyfill for jsdom
        ├── example.test.ts           # Placeholder test
        ├── handHistoryParser.test.ts # 23 tests: header, seats, blinds, hole cards, streets, actions, showdown
        ├── handEvaluator.test.ts     # 17 tests: hand class ordering, tiebreaks, wheel, 7-card selection
        ├── monteCarlo.test.ts        # 7 tests: near-certain outcomes, coin-flip, multi-opp, sims count
        └── fixtures/
            ├── full_hand.txt         # Complete cash game hand (AcHunter AhKd, all streets)
            ├── showdown_hand.txt     # Two-player showdown hand
            └── preflop_only.txt      # Fold-preflop hand, no community cards
```
