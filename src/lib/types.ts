export interface GameMetadata {
  id: string;
  title: string;
  tagline: string;
  category: 'reflex' | 'precision' | 'puzzle' | 'speed';
  accentColor: string; // Tailwind / Hex for styling
  gradient: string;
  instructions: string[];
  controls: {
    mobile: string;
    desktop: string;
  };
  scoreUnit: string;
  scoreFormat?: (score: number) => string;
  lowerIsBetter?: boolean; // For Reaction Test
  badge?: string;
  description: string;
}

export interface GameInstance {
  init: (canvas: HTMLCanvasElement, callbacks: GameCallbacks) => void;
  start: (seed?: number) => void;
  pause?: () => void;
  resume?: () => void;
  restart: (seed?: number) => void;
  destroy: () => void;
  handleInput?: (type: 'tap' | 'press' | 'release' | 'move', x?: number, y?: number) => void;
}

export interface GameCallbacks {
  onScoreUpdate: (score: number) => void;
  onGameOver: (finalScore: number, meta?: Record<string, any>) => void;
  onCombo?: (combo: number) => void;
  onMilestone?: (milestone: string) => void;
}

export interface PlayerProfile {
  id: string;
  username: string;
  highScores: Record<string, number>;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
}
