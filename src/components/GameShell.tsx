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
  Pause,
  Play,
  Flame,
  Home,
} from 'lucide-react';
import { GameMetadata, GameInstance } from '@/lib/types';
import { sound } from '@/lib/audio';
import {
  getOrCreatePlayerId,
  getPlayerName,
  getPersonalBest,
  recordScore,
} from '@/lib/player';
import { incrementTotalGamesPlayed, unlockAchievement } from '@/lib/progression/achievements';
import ScoreCardModal from './ScoreCardModal';
import { GAMES_CATALOG } from '@/lib/games/registry';

interface GameShellProps {
  game: GameMetadata;
  instanceFactory: () => GameInstance | null;
  seed?: number;
  challengeTarget?: number;
  challengeCreator?: string;
  isDaily?: boolean;
  dailyDate?: string;
}

export default function GameShell({
  game,
  instanceFactory,
  seed,
  challengeTarget,
  challengeCreator,
  isDaily = false,
  dailyDate,
}: GameShellProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameInstanceRef = useRef<GameInstance | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const runSessionIdRef = useRef<string | null>(null);

  const [currentScore, setCurrentScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [personalBest, setPersonalBest] = useState<number | null>(null);
  const [muted, setMuted] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [targetBeaten, setTargetBeaten] = useState(false);
  const [scoreRank, setScoreRank] = useState<number | null>(null);

  useEffect(() => {
    setMuted(sound.isMuted());
    const pb = getPersonalBest(game.id, game.lowerIsBetter);
    setPersonalBest(pb);
  }, [game.id, game.lowerIsBetter]);

  const handleGameOver = useCallback(
    (score: number, meta?: Record<string, any>) => {
      setGameOver(true);
      setFinalScore(score);

      const durationMs = Date.now() - startTimeRef.current;

      // Track games played & check progression milestones
      incrementTotalGamesPlayed();

      // Check specific skill achievements
      if (game.id === 'perfect-stack' && score >= 20) unlockAchievement('stack_pro');
      if (game.id === 'reaction-test' && score < 220) unlockAchievement('reflex_fast');
      if (game.id === 'gravity-flip' && score >= 150) unlockAchievement('gravity_150');
      if (isDaily) unlockAchievement('daily_player');

      const pbResult = recordScore(game.id, score, game.lowerIsBetter);
      setIsNewRecord(pbResult.isNewRecord);
      setPersonalBest(getPersonalBest(game.id, game.lowerIsBetter));

      if (challengeTarget !== undefined) {
        const beaten = game.lowerIsBetter ? score < challengeTarget : score > challengeTarget;
        setTargetBeaten(beaten);
      }

      if (pbResult.isNewRecord) {
        sound.playScorePing();
        confetti({
          particleCount: 80,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#00F0FF', '#FF007A', '#FFE600', '#00FFA3'],
        });
      }

      // Submit score to database API with verified daily/session context
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
          durationMs,
          isDaily: Boolean(isDaily),
          dailyDate: isDaily && dailyDate ? dailyDate : undefined,
          runSessionId: runSessionIdRef.current,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.rank) setScoreRank(data.rank);
        })
        .catch((err) => console.error('Score submit error:', err));
    },
    [game.id, game.lowerIsBetter, challengeTarget, isDaily, dailyDate]
  );

  const initGame = useCallback(() => {
    if (!canvasRef.current) return;
    if (gameInstanceRef.current) {
      gameInstanceRef.current.destroy();
    }

    startTimeRef.current = Date.now();

    // Start a run session in background for anti-cheat verification
    const anonId = getOrCreatePlayerId();
    fetch('/api/runs/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameId: game.id, anonymousId: anonId, seed }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.runSessionId) runSessionIdRef.current = data.runSessionId;
      })
      .catch(() => {});

    const instance = instanceFactory();
    if (!instance) return;

    gameInstanceRef.current = instance;
    instance.init(canvasRef.current, {
      onScoreUpdate: (s) => setCurrentScore(s),
      onGameOver: handleGameOver,
      onPauseChange: (p) => setIsPaused(p),
    });
    instance.start(seed);
    setGameOver(false);
    setIsPaused(false);
    setCurrentScore(0);
    setScoreRank(null);
  }, [instanceFactory, handleGameOver, seed, game.id]);

  useEffect(() => {
    initGame();
    return () => {
      if (gameInstanceRef.current) {
        gameInstanceRef.current.destroy();
      }
    };
  }, [initGame]);

  const handleRestart = () => {
    sound.playTap();
    setGameOver(false);
    setIsPaused(false);
    startTimeRef.current = Date.now();
    if (gameInstanceRef.current) {
      gameInstanceRef.current.restart(seed);
    }
  };

  const handleTogglePause = () => {
    if (gameOver || !gameInstanceRef.current) return;
    sound.playTap();
    if (isPaused) {
      gameInstanceRef.current.resume?.();
      setIsPaused(false);
    } else {
      gameInstanceRef.current.pause?.();
      setIsPaused(true);
    }
  };

  // Keyboard navigation & controls
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (gameOver) {
          handleRestart();
        } else if (!isPaused && gameInstanceRef.current?.handleInput) {
          gameInstanceRef.current.handleInput('press');
        }
      } else if (e.code === 'Escape') {
        e.preventDefault();
        handleTogglePause();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [gameOver, isPaused]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (gameOver || isPaused) return;
    if (showTutorial) setShowTutorial(false);
    if (gameInstanceRef.current?.handleInput) {
      gameInstanceRef.current.handleInput('tap', e.clientX, e.clientY);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (gameOver || isPaused) return;
    if (gameInstanceRef.current?.handleInput) {
      gameInstanceRef.current.handleInput('move', e.clientX, e.clientY);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (gameOver || isPaused) return;
    if (gameInstanceRef.current?.handleInput) {
      gameInstanceRef.current.handleInput('release', e.clientX, e.clientY);
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

  const otherGames = GAMES_CATALOG.filter((g) => g.id !== game.id);
  const nextGame = otherGames[Math.floor(Math.random() * otherGames.length)];

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col items-center justify-center w-full px-2 py-2 sm:py-4 select-none min-h-[calc(100dvh-70px)]"
    >
      {/* Top Header HUD */}
      <div className="w-full max-w-[420px] flex items-center justify-between py-2 px-3 mb-2 bg-[#121622]/95 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg">
        <Link
          href="/"
          className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
          title="Back to Arcade"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1.5">
            <h2 className="text-xs font-black tracking-wider text-white uppercase">{game.title}</h2>
            {isDaily && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-400 font-extrabold uppercase">
                DAILY
              </span>
            )}
          </div>
          {personalBest !== null && (
            <span className="text-[10px] font-bold text-amber-400 flex items-center justify-center gap-1">
              <Trophy className="w-3 h-3" /> BEST: {personalBest} {game.scoreUnit}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleTogglePause}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
            title={isPaused ? 'Resume' : 'Pause'}
          >
            {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4" />}
          </button>
          <button
            onClick={handleToggleSound}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
            title="Toggle Sound"
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
            title="Toggle Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Target Challenge Banner if present */}
      {challengeTarget !== undefined && challengeCreator && (
        <div className="w-full max-w-[420px] mb-2 px-3 py-1.5 rounded-xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-between text-xs font-bold text-pink-300">
          <span>🎯 TARGET: BEAT {challengeCreator.toUpperCase()}</span>
          <span className="text-white font-black">{challengeTarget} {game.scoreUnit}</span>
        </div>
      )}

      {/* Main Responsive Canvas Viewport */}
      <div className="relative w-full max-w-[420px] h-[calc(100dvh-170px)] min-h-[500px] max-h-[640px] rounded-3xl overflow-hidden shadow-2xl border-2 border-white/10 bg-[#090C12] game-canvas-container">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="w-full h-full block cursor-pointer"
        />

        {/* Scanlines CRT overlay */}
        <div className="absolute inset-0 scanlines opacity-35 pointer-events-none" />

        {/* Interactive Quick Tutorial Overlay */}
        {showTutorial && !isPaused && (
          <div
            onPointerDown={() => setShowTutorial(false)}
            className="absolute inset-x-4 bottom-6 p-4 rounded-2xl bg-black/85 backdrop-blur-md border border-cyan-500/40 shadow-xl flex items-center justify-between gap-3 animate-bounce-slight cursor-pointer z-10"
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

        {/* Real Pause Screen Overlay */}
        {isPaused && !gameOver && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 bg-black/85 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
            <span className="text-xs font-black uppercase tracking-widest text-cyan-400 mb-1">
              GAME PAUSED
            </span>
            <h3 className="text-3xl font-black text-white font-display mb-6">TAKE A BREATH</h3>

            <div className="w-full max-w-xs space-y-3">
              <button
                onClick={handleTogglePause}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-black font-black text-sm tracking-wide uppercase shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Play className="w-4 h-4 fill-black" />
                Resume (ESC)
              </button>

              <button
                onClick={handleRestart}
                className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase flex items-center justify-center gap-2 transition-colors border border-white/5"
              >
                <RotateCcw className="w-4 h-4" />
                Restart Round
              </button>

              <Link
                href="/"
                className="w-full py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-bold text-xs uppercase flex items-center justify-center gap-2 transition-colors"
              >
                <Home className="w-4 h-4" />
                Quit to Arcade
              </Link>
            </div>
          </div>
        )}

        {/* Game Over Screen Overlay */}
        {gameOver && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 bg-black/85 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
            {challengeTarget !== undefined && targetBeaten && (
              <div className="mb-3 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                CHALLENGE BEATEN!
              </div>
            )}

            <span className="text-xs font-extrabold uppercase tracking-widest text-gray-400 mb-1">
              ROUND FINISHED
            </span>

            <div className="text-center mb-4">
              <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-400 font-display">
                {game.scoreFormat ? game.scoreFormat(finalScore) : finalScore}
              </span>
              <span className="text-xs font-bold text-gray-400 block mt-1">
                {game.scoreUnit}
              </span>

              {scoreRank && (
                <div className="mt-1 text-xs font-bold text-cyan-300">
                  Global Rank: #{scoreRank}
                </div>
              )}

              {isNewRecord && (
                <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-black border border-amber-400/30">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  NEW RECORD!
                </div>
              )}
            </div>

            <button
              onClick={handleRestart}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 hover:brightness-110 text-black font-black text-base tracking-wider uppercase shadow-xl shadow-cyan-500/30 flex items-center justify-center gap-2 transition-all active:scale-95 mb-3"
            >
              <RotateCcw className="w-5 h-5 stroke-[2.5]" />
              PLAY AGAIN (SPACE)
            </button>

            <button
              onClick={() => setShowShareModal(true)}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 hover:brightness-110 text-white font-extrabold text-xs tracking-wider uppercase shadow-lg shadow-pink-500/25 flex items-center justify-center gap-2 transition-all active:scale-95 mb-4"
            >
              <Share2 className="w-4 h-4" />
              Challenge Friends & Scorecard
            </button>

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
