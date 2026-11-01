import { GameMetadata, GameInstance } from '../types';
import { PerfectStackGame } from './perfect-stack';
import { ReactionTestGame } from './reaction-test';
import { GravityFlipGame } from './gravity-flip';
import { ColorPanicGame } from './color-panic';
import { OneMoreJumpGame } from './one-more-jump';
import { DontTapRedGame } from './dont-tap-red';
import { MemoryFlashGame } from './memory-flash';
import { PerfectTimingGame } from './perfect-timing';
import { MergeRushGame } from './merge-rush';
import { ImpossibleMazeGame } from './impossible-maze';

export const GAMES_CATALOG: GameMetadata[] = [
  {
    id: 'perfect-stack',
    title: 'Perfect Stack',
    tagline: 'Slice & stack neon blocks to the sky!',
    category: 'precision',
    accentColor: '#00F0FF',
    gradient: 'from-cyan-500 to-blue-600',
    scoreUnit: 'Blocks',
    badge: 'VIRAL HIT 🔥',
    description: 'Tap precisely as blocks glide across the screen. Misaligned edges get sliced off! Nail perfect placements to trigger combo multipliers and recover block size.',
    instructions: [
      'Watch the block slide back and forth',
      'Tap anywhere to lock it in place',
      'Overhanging edges are cut off!',
      'Nail consecutive perfect hits to recover size',
    ],
    controls: {
      mobile: 'Tap anywhere on the screen to drop',
      desktop: 'Press Spacebar or Left Click',
    },
  },
  {
    id: 'reaction-test',
    title: 'Reaction Test',
    tagline: 'Measure your raw human reflex speed in milliseconds.',
    category: 'reflex',
    accentColor: '#00FFA3',
    gradient: 'from-emerald-400 to-green-600',
    scoreUnit: 'ms',
    lowerIsBetter: true,
    badge: 'BENCHMARK ⚡',
    description: 'Test your brain-to-finger reaction time. Wait for the crimson screen to flash electric green, then tap as fast as humanly possible.',
    instructions: [
      'Tap to arm the reflex timer',
      'Wait patiently while the screen is red',
      'The moment it turns GREEN, TAP!',
      'Tap too early and you must retry the round',
    ],
    controls: {
      mobile: 'Tap anywhere when screen turns green',
      desktop: 'Click or tap Spacebar instantly',
    },
  },
  {
    id: 'gravity-flip',
    title: 'Gravity Flip',
    tagline: 'Defy physics between floor and ceiling.',
    category: 'speed',
    accentColor: '#FF007A',
    gradient: 'from-pink-500 to-rose-600',
    scoreUnit: 'Meters',
    badge: 'ADDICTIVE 🚀',
    description: 'Sprint through a high-speed neon cyber corridor. Invert gravity on the fly to dodge floor spikes, ceiling hazards, and floating laser barriers.',
    instructions: [
      'Runner advances automatically at rising speeds',
      'Tap to reverse gravity between floor and ceiling',
      'Skim close to obstacles for near-miss bonus points!',
      'One hit with any spike means game over',
    ],
    controls: {
      mobile: 'Tap anywhere to invert gravity',
      desktop: 'Press Spacebar or Click',
    },
  },
  {
    id: 'color-panic',
    title: 'Color Panic',
    tagline: 'Beat the Stroop effect under extreme time pressure.',
    category: 'puzzle',
    accentColor: '#FFE600',
    gradient: 'from-amber-400 to-orange-500',
    scoreUnit: 'Matches',
    badge: 'BRAIN TEASER 🧠',
    description: 'Match colors against deceptive color names before the relentless fuse burns down. Your brain will trick you!',
    instructions: [
      'Read the target instruction (color of text vs word)',
      'Tap the matching colored tile before time runs out',
      'Each correct tap adds bonus time and raises multiplier',
    ],
    controls: {
      mobile: 'Tap the correct matching tile',
      desktop: 'Click on the matching tile',
    },
  },
  {
    id: 'one-more-jump',
    title: 'One More Jump',
    tagline: 'Precision leaps across neon abyss.',
    category: 'precision',
    accentColor: '#8A2BE2',
    gradient: 'from-purple-500 to-indigo-600',
    scoreUnit: 'Platforms',
    badge: 'POPULAR ⭐',
    description: 'Single-touch leap mechanics. Time your jumps between shifting platforms with variable gaps and moving hazards.',
    instructions: [
      'Tap to jump forward',
      'Platforms move and change sizes',
      'Land centered for combo points',
    ],
    controls: {
      mobile: 'Tap to jump',
      desktop: 'Spacebar or Click to jump',
    },
  },
  {
    id: 'dont-tap-red',
    title: "Don't Tap Red",
    tagline: 'Frenetic speed grid reflexes.',
    category: 'reflex',
    accentColor: '#FF3366',
    gradient: 'from-red-500 to-pink-600',
    scoreUnit: 'Tiles',
    badge: 'SPEED ⚡',
    description: 'Tap incoming safe tiles as fast as you can. Whatever you do, DO NOT tap the red tiles!',
    instructions: [
      'Safe tiles rapidly descend on the grid',
      'Tap every safe tile before it slips away',
      'Avoid red skulls and warning tiles at all costs',
    ],
    controls: {
      mobile: 'Tap safe tiles rapidly',
      desktop: 'Click safe tiles or use columns 1-4',
    },
  },
  {
    id: 'memory-flash',
    title: 'Memory Flash',
    tagline: 'Remember and replay glowing neon sequences.',
    category: 'puzzle',
    accentColor: '#3B82F6',
    gradient: 'from-blue-500 to-cyan-500',
    scoreUnit: 'Steps',
    badge: 'MIND 🔮',
    description: 'A futuristic spatial memory test. Memorize flashing tile patterns and repeat the sequence in exact order.',
    instructions: [
      'Watch the glowing sequence flash on the grid',
      'Wait for the signal to repeat',
      'Tap each tile in the exact order shown',
    ],
    controls: {
      mobile: 'Tap the grid tiles in order',
      desktop: 'Click grid tiles in order',
    },
  },
  {
    id: 'perfect-timing',
    title: 'Perfect Timing',
    tagline: 'Stop the sweeping needle in the dead center bullseye.',
    category: 'precision',
    accentColor: '#10B981',
    gradient: 'from-teal-400 to-emerald-600',
    scoreUnit: 'Accuracy',
    badge: 'PRECISION 🎯',
    description: 'A high-speed oscillator pendulum swings across the gauge. Tap when the needle enters the razor-thin target zone.',
    instructions: [
      'Watch the marker sweep across the arc',
      'Tap when it aligns inside the target zone',
      'Bullseye hits shrink the zone and multiply score',
    ],
    controls: {
      mobile: 'Tap anywhere to stop needle',
      desktop: 'Spacebar or Click',
    },
  },
  {
    id: 'merge-rush',
    title: 'Merge Rush',
    tagline: 'Fast-paced number merging blitz against the clock.',
    category: 'puzzle',
    accentColor: '#F59E0B',
    gradient: 'from-yellow-500 to-amber-600',
    scoreUnit: 'Points',
    badge: 'PUZZLE 🧩',
    description: 'Drop matching numbers to combine them into higher powers of 2 before the board overflows.',
    instructions: [
      'Aim and drop number tiles into columns',
      'Identical adjacent numbers merge together',
      'Clear combos to keep the board clean',
    ],
    controls: {
      mobile: 'Tap column to drop tile',
      desktop: 'Click column or keys 1-4',
    },
  },
  {
    id: 'impossible-maze',
    title: 'Impossible Maze',
    tagline: 'Navigate narrow neon corridors without touching the walls.',
    category: 'precision',
    accentColor: '#EC4899',
    gradient: 'from-fuchsia-500 to-pink-600',
    scoreUnit: 'Stages',
    badge: 'CHALLENGE 💀',
    description: 'Hold and guide your energy spark through razor-thin procedural mazes. Touch the wall and you instantly detonate!',
    instructions: [
      'Touch and drag the spark from START to FINISH',
      'Never touch the walls or moving lasers',
      'Reach the checkpoint portal to advance',
    ],
    controls: {
      mobile: 'Drag your finger along the path',
      desktop: 'Click and drag mouse cursor',
    },
  },
];

export function getGameById(id: string): GameMetadata | undefined {
  return GAMES_CATALOG.find((g) => g.id === id);
}

export function createGameInstance(id: string): GameInstance | null {
  switch (id) {
    case 'perfect-stack':
      return new PerfectStackGame();
    case 'reaction-test':
      return new ReactionTestGame();
    case 'gravity-flip':
      return new GravityFlipGame();
    case 'color-panic':
      return new ColorPanicGame();
    case 'one-more-jump':
      return new OneMoreJumpGame();
    case 'dont-tap-red':
      return new DontTapRedGame();
    case 'memory-flash':
      return new MemoryFlashGame();
    case 'perfect-timing':
      return new PerfectTimingGame();
    case 'merge-rush':
      return new MergeRushGame();
    case 'impossible-maze':
      return new ImpossibleMazeGame();
    default:
      return null;
  }
}
