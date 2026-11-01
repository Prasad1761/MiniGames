'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  RotateCcw,
  Volume2,
  VolumeX,
  Share2,
  Trophy,
  Sparkles,
  Maximize2,
  Flame,
  HelpCircle,
  Play,
} from 'lucide-react';
import { GameMetadata, GameInstance } from '@/lib/types';
import { sound } from '@/lib/audio';
import {
  getOrCreatePlayerId,
  getPlayerName,
  getPersonalBest,
  recordScore,
  triggerHaptic,
} from '@/lib/player';
import ScoreCardModal from './ScoreCardModal';
import { GAMES_CATALOG } from '@/lib/games/registry';

interface GameShellProps {
  game: GameMetadata;
  instanceFactory: () => GameInstance | null;
  seed?: number;
  challengeTarget?: number;
  challengeCreator?: string;
}

export default function GameShell({
  game,
  instanceFactory,
  seed,
  challengeTarget,
  challengeCreator,
}: GameShellProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameInstanceRef = useRef<GameInstance | null>(null);

  const [currentScore, setCurrentScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [personalBest, setPersonalBest] = useState<number | null>(null);
  const [muted, setMuted] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [targetBeaten, setTargetBeaten] = useState(false);

  // Initialize audio and personal best
  useEffect(() => {
    setMuted(sound.isMuted());
    const pb = getPersonalBest(game.id, game.lowerIsBetter);
    setPersonalBest(pb);
  }, [game.id, game.lowerIsBetter]);

  const handleGameOver = useCallback(
    (score: number, meta?: Record<string, any>) => {
      setGameOver(true);
      setFinalScore(score);

      const pbResult = recordScore(game.id, score, game.lowerIsBetter);
      setIsNewRecord(pbResult.isNewRecord);
      setPersonalBest(getPersonalBest(game.id, game.lowerIsBetter));

      // Check if challenge target beaten
      if (challengeTarget !== undefined) {
        const beaten = game.lowerIsBetter ? score < challengeTarget : score > challengeTarget;
        setTargetBeaten(beaten);
      }

      // If new high score, trigger confetti
      if (pbResult.isNewRecord) {
        sound.playScorePing();
        confetti({
          particleCount: 75,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#00F0FF', '#FF007A', '#FFE600', '#00FFA3'],
        });
      }

      // Submit score to database API
      const anonId = getOrCreatePlayerId();
      const username = getPlayerName();
      fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: game.id,
          score,
          anonymousId: anonId,
          username,
          meta,
        }),
      }).catch((err) => console.error('Score submit error:', err));
    },
    [game.id, game.lowerIsBetter, challengeTarget]
  );

  const initGame = useCallback(() => {
    if (!canvasRef.current) return;
    if (gameInstanceRef.current) {
      gameInstanceRef.current.destroy();
    }

    const instance = instanceFactory();
    if (!instance) return;

    gameInstanceRef.current = instance;
    instance.init(canvasRef.current, {
      onScoreUpdate: (s) => setCurrentScore(s),
      onGameOver: handleGameOver,
    });
    instance.start(seed);
    setGameOver(false);
    setCurrentScore(0);
  }, [instanceFactory, handleGameOver, seed]);

  // Mount game
  useEffect(() => {
    initGame();
    return () => {
      if (gameInstanceRef.current) {
        gameInstanceRef.current.destroy();
      }
    };
  }, [initGame]);

  // Restart
  const handleRestart = () => {
    sound.playTap();
    setGameOver(false);
    if (gameInstanceRef.current) {
      gameInstanceRef.current.restart(seed);
    }
  };

  // Keyboard spacebar listener
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (gameOver) {
          handleRestart();
        } else if (gameInstanceRef.current?.handleInput) {
          gameInstanceRef.current.handleInput('press');
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [gameOver]);

  // Pointer / Touch handler
  const handlePointerDown = (e: React.PointerEvent) => {
    if (gameOver) return;
    if (showTutorial) setShowTutorial(false);
    if (gameInstanceRef.current?.handleInput) {
      gameInstanceRef.current.handleInput('tap', e.clientX, e.clientY);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (gameOver) return;
    if (gameInstanceRef.current?.handleInput) {
      gameInstanceRef.current.handleInput('move', e.clientX, e.clientY);
    }
  };

  const handleToggleSound = () => {
    const next = sound.toggleMute();
    setMuted(next);
  };

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  // Find next game recommendation
  const otherGames = GAMES_CATALOG.filter((g) => g.id !== game.id);
  const nextGame = otherGames[Math.floor(Math.random() * otherGames.length)];

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col items-center justify-center min-h-[calc(100vh-65px)] w-full p-2 sm:p-4 select-none"
    >
      {/* Top Header Bar */}
      <div className="w-full max-w-[420px] flex items-center justify-between py-2 px-3 mb-2 bg-[#121622]/90 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg">
        <Link
          href="/"
          className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
          title="Back to Arcade"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>

        {/* Game Title & PB */}
        <div className="text-center">
          <h2 className="text-xs font-black tracking-wider text-white uppercase">{game.title}</h2>
          {personalBest !== null && (
            <span className="text-[10px] font-bold text-amber-400 flex items-center justify-center gap-1">
              <Trophy className="w-3 h-3" /> BEST: {personalBest} {game.scoreUnit}
            </span>
          )}
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleToggleSound}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
          >
            {muted ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-cyan-400" />
            )}
          </button>
          <button
            onClick={handleFullscreen}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Target Challenge Banner if present */}
      {challengeTarget !== undefined && challengeCreator && (
        <div className="w-full max-w-[420px] mb-2 px-3 py-1.5 rounded-xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-between text-xs font-bold text-pink-300">
          <span>🎯 BEAT {challengeCreator.toUpperCase()}:</span>
          <span className="text-white font-black">{challengeTarget} {game.scoreUnit}</span>
        </div>
      )}

      {/* Main Responsive Canvas Viewport */}
      <div className="relative w-full max-w-[420px] h-[580px] sm:h-[620px] rounded-3xl overflow-hidden shadow-2xl border-2 border-white/10 bg-[#090C12] game-canvas-container">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          className="w-full h-full block cursor-pointer"
        />

        {/* Scanline CRT overlay */}
        <div className="absolute inset-0 scanlines opacity-40 pointer-events-none" />

        {/* Interactive 3-Second Quick Tutorial Overlay on First Tap */}
        {showTutorial && (
          <div
            onPointerDown={() => setShowTutorial(false)}
            className="absolute inset-x-4 bottom-6 p-4 rounded-2xl bg-black/80 backdrop-blur-md border border-cyan-500/40 shadow-xl flex items-center justify-between gap-3 animate-bounce-slight cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Play className="w-4 h-4 fill-cyan-400" />
              </div>
              <div>
                <p className="text-xs font-black text-white">{game.instructions[0]}</p>
                <p className="text-[10px] text-cyan-300">{game.controls.mobile}</p>
              </div>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-cyan-500 text-black">
              TAP
            </span>
          </div>
        )}

        {/* Game Over Screen Overlay */}
        {gameOver && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 bg-black/85 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
            {/* Target Beaten Alert */}
            {challengeTarget !== undefined && targetBeaten && (
              <div className="mb-3 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                CHALLENGE BEATEN!
              </div>
            )}

            <span className="text-xs font-extrabold uppercase tracking-widest text-gray-400 mb-1">
              GAME OVER
            </span>

            {/* Final Score */}
            <div className="text-center mb-4">
              <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-400 font-display">
                {game.scoreFormat ? game.scoreFormat(finalScore) : finalScore}
              </span>
              <span className="text-xs font-bold text-gray-400 block mt-1">
                {game.scoreUnit}
              </span>

              {isNewRecord && (
                <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-black border border-amber-400/30">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  NEW RECORD!
                </div>
              )}
            </div>

            {/* Instant Retry Button */}
            <button
              onClick={handleRestart}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 hover:brightness-110 text-black font-black text-base tracking-wider uppercase shadow-xl shadow-cyan-500/30 flex items-center justify-center gap-2 transition-all active:scale-95 mb-3"
            >
              <RotateCcw className="w-5 h-5 stroke-[2.5]" />
              PLAY AGAIN (SPACE)
            </button>

            {/* Viral Social Share / Challenge Button */}
            <button
              onClick={() => setShowShareModal(true)}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 hover:brightness-110 text-white font-extrabold text-xs tracking-wider uppercase shadow-lg shadow-pink-500/25 flex items-center justify-center gap-2 transition-all active:scale-95 mb-4"
            >
              <Share2 className="w-4 h-4" />
              Challenge Friends & Scorecard
            </button>

            {/* Next Game Recommendation */}
            {nextGame && (
              <Link
                href={`/games/${nextGame.id}`}
                className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-300 hover:text-white flex items-center justify-between transition-colors"
              >
                <span className="text-gray-400">Up Next:</span>
                <span className="text-cyan-400 flex items-center gap-1 font-extrabold">
                  {nextGame.title} →
                </span>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Share & Scorecard Modal */}
      {showShareModal && (
        <ScoreCardModal
          game={game}
          score={finalScore}
          isNewRecord={isNewRecord}
          username={getPlayerName()}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}
