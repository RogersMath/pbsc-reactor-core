// Card Types
export type CardType = 'matter' | 'antimatter';

export interface Card {
  id: string;
  type: CardType;
  value: number;
  symbol: string;
  name: string;
  ariaLabel: string;
}

// Game State Types
export type GameState = 'menu' | 'playing' | 'victory';

// Animation Types
export interface FallingCard {
  id: string;
  delay: number;
}

export interface StreamingUnit {
  id: string;
  side: 'left' | 'right';
  type: CardType;
  symbol: string;
  delay: number;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  symbol: string;
  color: string;
}

// Move History
export interface Move {
  type: CardType;
  value: number;
  name: string;
}

// Sound Engine Types
export type SoundType = 'sine' | 'sawtooth' | 'triangle' | 'square';

export interface SoundEffects {
  cardTap: () => void;
  stream: () => void;
  antimatterHit: () => void;
  matterHit: () => void;
  balance: () => void;
  victory: () => void;
  undo: () => void;
}
