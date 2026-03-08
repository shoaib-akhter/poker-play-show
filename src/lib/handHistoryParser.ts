import { Card, Suit, Rank, Street, Action, ActionType, Player, ReplayStep, ParsedHand } from '@/types/poker';

function parseCard(str: string): Card | null {
  if (str.length < 2) return null;
  const rankMap: Record<string, Rank> = {
    '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7',
    '8': '8', '9': '9', 'T': 'T', 'J': 'J', 'Q': 'Q', 'K': 'K', 'A': 'A',
  };
  const suitMap: Record<string, Suit> = { 'h': 'h', 'd': 'd', 'c': 'c', 's': 's' };
  const r = rankMap[str[0].toUpperCase()];
  const s = suitMap[str[1].toLowerCase()];
  if (!r || !s) return null;
  return { rank: r, suit: s };
}

function parseCards(str: string): Card[] {
  const matches = str.match(/[2-9TJQKA][hdcs]/gi) || [];
  return matches.map(m => parseCard(m)).filter((c): c is Card => c !== null);
}

export function parseHandHistory(text: string): ParsedHand {
  const lines = text.trim().split('\n').map(l => l.trim()).filter(Boolean);

  let handId = '';
  let tableName = '';
  let stakes = '';
  let heroName = '';
  const players: Player[] = [];
  let dealerSeat = -1;
  const holeCards: Record<string, [Card, Card]> = {};
  const uncalledReturns: Record<string, number> = {};
  const communityCards: Card[] = [];
  const actions: Action[] = [];
  const winners: { playerName: string; amount: number; hand?: string }[] = [];

  let currentStreet: Street = 'preflop';
  let hadShowdown = false;

  for (const line of lines) {
    // Hand ID
    const handMatch = line.match(/Hand #(\S+)/);
    if (handMatch) handId = handMatch[1];

    // Table
    const tableMatch = line.match(/Table '([^']+)'/);
    if (tableMatch) tableName = tableMatch[1];

    // Stakes
    const stakesMatch = line.match(/\(([^)]*\$[^)]+)\)/);
    if (stakesMatch && !stakes) stakes = stakesMatch[1];

    // Button seat
    const buttonMatch = line.match(/Seat #(\d+) is the button/);
    if (buttonMatch) dealerSeat = parseInt(buttonMatch[1]);

    // Seat info
    const seatMatch = line.match(/^Seat (\d+): (.+?) \(\$?([\d,.]+)/);
    if (seatMatch) {
      const seatNum = parseInt(seatMatch[1]);
      players.push({
        name: seatMatch[2],
        seatIndex: seatNum - 1,
        stackSize: parseFloat(seatMatch[3].replace(',', '')),
        isDealer: seatNum === dealerSeat,
        isFolded: false,
        currentBet: 0,
        hasActed: false,
      });
    }

    // Dealt cards
    const dealtMatch = line.match(/Dealt to (.+?) \[(.+?)\]/);
    if (dealtMatch) {
      heroName = dealtMatch[1];
      const cards = parseCards(dealtMatch[2]);
      if (cards.length >= 2) {
        holeCards[dealtMatch[1]] = [cards[0], cards[1]];
      }
    }

    // Street markers
    if (line.startsWith('*** FLOP ***')) {
      currentStreet = 'flop';
      const cards = parseCards(line);
      communityCards.push(...cards.slice(0, 3));
    } else if (line.startsWith('*** TURN ***')) {
      currentStreet = 'turn';
      const cards = parseCards(line);
      if (cards.length > 0) communityCards.push(cards[cards.length - 1]);
    } else if (line.startsWith('*** RIVER ***')) {
      currentStreet = 'river';
      const cards = parseCards(line);
      if (cards.length > 0) communityCards.push(cards[cards.length - 1]);
    } else if (line.startsWith('*** SHOW DOWN ***')) {
      hadShowdown = true;
      currentStreet = 'showdown';
    } else if (line.startsWith('*** SUMMARY ***')) {
      currentStreet = 'showdown';
    }

    // Actions
    const playerNames = players.map(p => p.name);
    for (const pName of playerNames) {
      if (!line.startsWith(pName + ':') && !line.startsWith(pName + ' ')) continue;
      const actionPart = line.slice(pName.length + 1).trim().toLowerCase();

      let actionType: ActionType | null = null;
      let amount: number | undefined;

      if (actionPart.startsWith('posts small blind') || actionPart.startsWith('posts the small blind')) {
        actionType = 'post_blind';
        const amtMatch = actionPart.match(/\$?([\d,.]+)/);
        if (amtMatch) amount = parseFloat(amtMatch[1].replace(',', ''));
      } else if (actionPart.startsWith('posts big blind') || actionPart.startsWith('posts the big blind')) {
        actionType = 'post_blind';
        const amtMatch = actionPart.match(/\$?([\d,.]+)/);
        if (amtMatch) amount = parseFloat(amtMatch[1].replace(',', ''));
      } else if (actionPart.startsWith('folds')) {
        actionType = 'fold';
      } else if (actionPart.startsWith('checks')) {
        actionType = 'check';
      } else if (actionPart.startsWith('calls')) {
        actionType = 'call';
        const amtMatch = actionPart.match(/\$?([\d,.]+)/);
        if (amtMatch) amount = parseFloat(amtMatch[1].replace(',', ''));
      } else if (actionPart.startsWith('bets')) {
        actionType = 'bet';
        const amtMatch = actionPart.match(/\$?([\d,.]+)/);
        if (amtMatch) amount = parseFloat(amtMatch[1].replace(',', ''));
      } else if (actionPart.startsWith('raises')) {
        actionType = 'raise';
        const amtMatch = actionPart.match(/to \$?([\d,.]+)/);
        if (amtMatch) amount = parseFloat(amtMatch[1].replace(',', ''));
      }

      if (actionType) {
        actions.push({ playerName: pName, type: actionType, amount, street: currentStreet });
      }
      break;
    }

    // Uncalled bet returned
    const uncalledMatch = line.match(/Uncalled bet \(\$?([\d,.]+)\) returned to (.+)/);
    if (uncalledMatch) {
      const amount = parseFloat(uncalledMatch[1].replace(',', ''));
      const playerName = uncalledMatch[2].trim();
      uncalledReturns[playerName] = (uncalledReturns[playerName] ?? 0) + amount;
    }

    // Winners
    const winMatch = line.match(/(.+?) collected \$?([\d,.]+)/);
    if (winMatch) {
      winners.push({
        playerName: winMatch[1].trim(),
        amount: parseFloat(winMatch[2].replace(',', '')),
      });
    }

    // Show cards
    const showMatch = line.match(/(.+?): shows \[(.+?)\]/);
    if (showMatch) {
      const cards = parseCards(showMatch[2]);
      if (cards.length >= 2) {
        holeCards[showMatch[1]] = [cards[0], cards[1]];
      }
    }
  }

  // Assign hole cards & fix dealer
  for (const p of players) {
    if (holeCards[p.name]) p.holeCards = holeCards[p.name];
    p.isDealer = p.seatIndex === dealerSeat - 1;
  }

  // Build replay steps
  const steps = buildReplaySteps(players, actions, communityCards, winners);

  return { handId, tableName, stakes, heroName, players, steps, communityCards, winners, uncalledReturns, hadShowdown };
}

function buildReplaySteps(
  initialPlayers: Player[],
  actions: Action[],
  allCommunityCards: Card[],
  winners: { playerName: string; amount: number; hand?: string }[]
): ReplayStep[] {
  const steps: ReplayStep[] = [];
  let currentPlayers = initialPlayers.map(p => ({ ...p, isFolded: false, currentBet: 0, hasActed: false }));
  let pot = 0;
  let visibleCommunity: Card[] = [];
  let lastStreet: Street = 'preflop';

  // Initial state
  steps.push({
    stepIndex: 0,
    street: 'preflop',
    players: currentPlayers.map(p => ({ ...p })),
    communityCards: [],
    potSize: 0,
    description: 'Hand begins',
  });

  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];

    // Street transition
    if (action.street !== lastStreet) {
      if (action.street === 'flop') visibleCommunity = allCommunityCards.slice(0, 3);
      else if (action.street === 'turn') visibleCommunity = allCommunityCards.slice(0, 4);
      else if (action.street === 'river') visibleCommunity = allCommunityCards.slice(0, 5);

      currentPlayers = currentPlayers.map(p => ({ ...p, currentBet: 0 }));

      steps.push({
        stepIndex: steps.length,
        street: action.street,
        players: currentPlayers.map(p => ({ ...p })),
        communityCards: [...visibleCommunity],
        potSize: pot,
        description: `--- ${action.street.toUpperCase()} ---`,
      });
      lastStreet = action.street;
    }

    // Apply action
    currentPlayers = currentPlayers.map(p => {
      if (p.name !== action.playerName) return { ...p };
      const updated = { ...p, hasActed: true };
      if (action.type === 'fold') updated.isFolded = true;
      if (action.amount) {
        const addedToPot = action.type === 'raise'
          ? action.amount - updated.currentBet
          : action.amount;
        updated.stackSize -= addedToPot;
        pot += addedToPot;
        updated.currentBet = action.type === 'raise' ? action.amount : updated.currentBet + (action.amount || 0);
      }
      return updated;
    });

    let desc = `${action.playerName} `;
    switch (action.type) {
      case 'post_blind': desc += `posts blind $${action.amount}`; break;
      case 'fold': desc += 'folds'; break;
      case 'check': desc += 'checks'; break;
      case 'call': desc += `calls $${action.amount}`; break;
      case 'bet': desc += `bets $${action.amount}`; break;
      case 'raise': desc += `raises to $${action.amount}`; break;
      default: desc += action.type;
    }

    steps.push({
      stepIndex: steps.length,
      street: action.street,
      action,
      players: currentPlayers.map(p => ({ ...p })),
      communityCards: [...visibleCommunity],
      potSize: pot,
      activePlayerName: action.playerName,
      description: desc,
    });
  }

  // Showdown step
  if (winners.length > 0) {
    // Reveal all shown cards
    steps.push({
      stepIndex: steps.length,
      street: 'showdown',
      players: currentPlayers.map(p => ({ ...p })),
      communityCards: allCommunityCards.length > 0 ? [...allCommunityCards] : [...visibleCommunity],
      potSize: pot,
      description: `${winners.map(w => `${w.playerName} wins $${w.amount}`).join(', ')}`,
    });
  }

  return steps;
}

export const SAMPLE_HAND_HISTORY = `PokerStars Hand #RC827364510: Hold'em No Limit ($1/$2 USD) - 2024/01/15 20:30:00 ET
Table 'Andromeda IV' 6-max Seat #4 is the button
Seat 1: MikeTheGrinder ($200 in chips)
Seat 2: SarahBluffs ($185.50 in chips)
Seat 3: PokerJoe99 ($210 in chips)
Seat 4: AceHunter ($195 in chips)
Seat 5: CoolCat42 ($220 in chips)
Seat 6: LuckyDraw7 ($175 in chips)
CoolCat42: posts small blind $1
LuckyDraw7: posts big blind $2
*** HOLE CARDS ***
Dealt to AceHunter [Ah Kd]
MikeTheGrinder: folds
SarahBluffs: raises $6 to $6
PokerJoe99: folds
AceHunter: raises $18 to $18
CoolCat42: folds
LuckyDraw7: folds
SarahBluffs: calls $12
*** FLOP *** [Ks 7h 2d]
SarahBluffs: checks
AceHunter: bets $22
SarahBluffs: calls $22
*** TURN *** [Ks 7h 2d] [Td]
SarahBluffs: checks
AceHunter: bets $45
SarahBluffs: raises $90 to $90
AceHunter: calls $45
*** RIVER *** [Ks 7h 2d Td] [3c]
SarahBluffs: checks
AceHunter: bets $65
SarahBluffs: folds
AceHunter collected $261 from pot
*** SUMMARY ***
Total pot $261 | Rake $0`;
