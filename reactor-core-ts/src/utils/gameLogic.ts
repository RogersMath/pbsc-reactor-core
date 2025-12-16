import { Card, CardType } from '../types/game.types';

export const generateDeck = (level: number): Card[] => {
  const maxVal = Math.min(Math.floor(level / 2) + 3, 5);
  
  const createCard = (val: number, type: CardType): Card => ({
    id: Math.random().toString(36),
    type,
    value: val,
    symbol: '⚛',
    name: `${val} ${type === 'matter' ? 'Matter' : 'Antimatter'}`,
    ariaLabel: val === 1 ? `1 unit of ${type}` : `${val} units of ${type}`
  });

  const cards: Card[] = [];

  // First card: random value, random type
  const val1 = Math.floor(Math.random() * maxVal) + 1;
  const type1: CardType = Math.random() > 0.5 ? 'matter' : 'antimatter';
  cards.push(createCard(val1, type1));

  // Second card: opposite type, ensure we have one odd and one even
  const type2: CardType = type1 === 'matter' ? 'antimatter' : 'matter';
  const isVal1Even = val1 % 2 === 0;
  let val2: number;
  
  if (isVal1Even) {
    // Need an odd value
    const oddVals: number[] = [];
    for (let i = 1; i <= maxVal; i += 2) oddVals.push(i);
    val2 = oddVals[Math.floor(Math.random() * oddVals.length)];
  } else {
    // Need an even value
    const evenVals: number[] = [];
    for (let i = 2; i <= maxVal; i += 2) evenVals.push(i);
    if (evenVals.length === 0) evenVals.push(2); // Fallback
    val2 = evenVals[Math.floor(Math.random() * evenVals.length)];
  }
  cards.push(createCard(val2, type2));

  // Third card: random value and type
  const val3 = Math.floor(Math.random() * maxVal) + 1;
  const type3: CardType = Math.random() > 0.5 ? 'matter' : 'antimatter';
  cards.push(createCard(val3, type3));

  return cards.sort(() => Math.random() - 0.5);
};

export const calculateMinMoves = (target: number, availableCards: Card[]): number => {
  interface QueueItem {
    current: number;
    moves: number;
  }

  const queue: QueueItem[] = [{ current: 0, moves: 0 }];
  const visited = new Set<string>(['0']);

  while (queue.length > 0) {
    const item = queue.shift();
    if (!item) break;

    const { current, moves } = item;
    if (current === target) return moves;

    for (const card of availableCards) {
      const delta = card.type === 'antimatter' ? -card.value : card.value;
      const next = current + delta;
      const key = `${next}`;

      if (!visited.has(key) && Math.abs(next) <= Math.abs(target) + 15 && moves < 8) {
        visited.add(key);
        queue.push({ current: next, moves: moves + 1 });
      }
    }
  }

  return 1;
};

export const getSymbolicEquation = (leftConstant: number, rightValue: number): string => {
  if (leftConstant === 0) return `E = ${rightValue}`;
  const sign = leftConstant > 0 ? '+' : '';
  return `E ${sign} (${leftConstant}) = ${rightValue}`;
};
