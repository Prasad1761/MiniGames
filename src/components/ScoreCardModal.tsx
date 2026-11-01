'use client';

import React, { useRef, useState } from 'react';
import { Share2, Download, Copy, Check, Sparkles, X, Trophy } from 'lucide-react';
import { GameMetadata } from '@/lib/types';
import { sound } from '@/lib/audio';

interface ScoreCardModalProps {
  game: GameMetadata;
  score: number;
  isNewRecord: boolean;
  username: string;
  onClose: () => void;
  onChallengeCreated?: (url: string) => void;
}

export default function ScoreCardModal({
  game,
  score,
  isNewRecord,
  username,
  onClose,
}: ScoreCardModalProps) {
  const [copied, setCopied] = useState(false);
  const [creatingChallenge, setCreatingChallenge] = useState(false);
  const [challengeUrl, setChallengeUrl] = useState<string | null>(null);

  const displayScore = game.scoreFormat ? game.scoreFormat(score) : `${score} ${game.scoreUnit}`;

  const handleCopyLink = async () => {
    sound.playTap();
    const url = window.location.href;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCreateChallenge = async () => {
    sound.playTap();
    setCreatingChallenge(true);
    try {
      const res = await fetch('/api/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: game.id,
          targetScore: score,
          anonymousId: localStorage.getItem('arcade_pulse_player_id') || 'guest',
          username,
        }),
      });
      const data = await res.json();
      if (data.url) {
        const fullUrl = `${window.location.origin}${data.url}`;
        setChallengeUrl(fullUrl);
        await navigator.clipboard.writeText(fullUrl);
        setCopied(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreatingChallenge(false);
    }
  };

  const handleNativeShare = async () => {
    sound.playTap();
    const shareData = {
      title: `${username}'s ${game.title} Score on Arcade Pulse!`,
      text: `I scored ${displayScore} on ${game.title}! Can you beat my record? Play instantly here:`,
      url: challengeUrl || window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled share
      }
    } else {
      handleCopyLink();
    }
  };

  const handleDownloadCard = () => {
    sound.playTap();
    // Render high-res 1200x630 share card via offscreen canvas
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, 1200, 630);
    bg.addColorStop(0, '#090C12');
    bg.addColorStop(0.5, '#121722');
    bg.addColorStop(1, '#090C12');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1200, 630);

    // Glowing border
    ctx.strokeStyle = game.accentColor;
    ctx.lineWidth = 12;
    ctx.strokeRect(30, 30, 1140, 570);

    // Header branding
    ctx.fillStyle = '#00F0FF';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText('⚡ ARCADE PULSE', 80, 110);

    // Game Title
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 64px Impact, sans-serif';
    ctx.fillText(game.title.toUpperCase(), 80, 200);

    // Gamer Tag
    ctx.fillStyle = '#FF007A';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText(`PLAYER: ${username.toUpperCase()}`, 80, 260);

    // Score Callout Box
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fillRect(80, 310, 600, 190);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.strokeRect(80, 310, 600, 190);

    ctx.fillStyle = '#9CA3AF';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('FINAL SCORE', 110, 360);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 80px Impact, sans-serif';
    ctx.fillText(displayScore, 110, 455);

    // Personal Best badge
    if (isNewRecord) {
      ctx.fillStyle = '#FFE600';
      ctx.font = '900 28px sans-serif';
      ctx.fillText('🏆 NEW PERSONAL BEST!', 720, 360);
    }

    // Call to action
    ctx.fillStyle = '#00FFA3';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('👉 CAN YOU BEAT MY SCORE?', 720, 440);

    ctx.fillStyle = '#6B7280';
    ctx.font = '22px sans-serif';
    ctx.fillText('Play instantly without installing an app', 720, 480);

    // Trigger download
    const link = document.createElement('a');
    link.download = `arcadepulse-${game.id}-${score}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-[#121620] border border-cyan-500/30 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Card Header Preview */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-black tracking-wider uppercase mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Viral Scorecard
          </div>
          <h3 className="text-2xl font-black text-white">{game.title}</h3>
          <p className="text-sm text-gray-400">Played by {username}</p>
        </div>

        {/* Visual Score Badge */}
        <div className="p-6 rounded-2xl bg-gradient-to-b from-white/5 to-transparent border border-white/10 text-center mb-6 relative overflow-hidden">
          <div
            className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full opacity-15 blur-2xl"
            style={{ backgroundColor: game.accentColor }}
          />

          <span className="text-xs font-bold uppercase tracking-widest text-gray-400 block mb-1">
            Achieved Score
          </span>
          <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-100 to-gray-400 block tracking-tight">
            {displayScore}
          </span>

          {isNewRecord && (
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-extrabold border border-amber-400/30">
              <Trophy className="w-3.5 h-3.5" />
              NEW PERSONAL BEST!
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleCreateChallenge}
            disabled={creatingChallenge}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 hover:brightness-110 text-white font-black text-sm tracking-wide shadow-lg shadow-pink-500/25 flex items-center justify-center gap-2 transition-all active:scale-98"
          >
            <Share2 className="w-4 h-4" />
            {challengeUrl ? (copied ? 'Challenge Link Copied!' : 'Copy Challenge Link') : 'Generate Friend Challenge'}
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleNativeShare}
              className="py-3 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-2 border border-white/5 transition-colors"
            >
              <Share2 className="w-4 h-4 text-cyan-400" />
              Share via App
            </button>
            <button
              onClick={handleDownloadCard}
              className="py-3 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-2 border border-white/5 transition-colors"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              Save Image
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
