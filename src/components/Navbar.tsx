'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Volume2, VolumeX, Flame, Trophy, Calendar, User, Sparkles, Gamepad2, Award } from 'lucide-react';
import { sound } from '@/lib/audio';
import { getPlayerName, setPlayerName, getOrCreatePlayerId } from '@/lib/player';

export default function Navbar() {
  const [muted, setMuted] = useState(false);
  const [username, setUsername] = useState('ArcadePlayer');
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [achievementCount, setAchievementCount] = useState(0);

  useEffect(() => {
    setMuted(sound.isMuted());
    setUsername(getPlayerName());

    // Load achievement count
    const loadAchievementCount = () => {
      const unlocked = JSON.parse(localStorage.getItem('arcade_pulse_unlocked_achievements') || '[]');
      setAchievementCount(unlocked.length);
    };

    loadAchievementCount();

    // Listen for achievement unlock events
    const handleAchievementUnlock = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.length) {
        setAchievementCount(prev => prev + customEvent.detail.length);
      }
    };

    window.addEventListener('achievementsUnlocked', handleAchievementUnlock);
    return () => window.removeEventListener('achievementsUnlocked', handleAchievementUnlock);
  }, []);

  const handleToggleSound = () => {
    const next = sound.toggleMute();
    setMuted(next);
    if (!next) sound.playTap();
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = nameInput.trim();
    if (clean) {
      setPlayerName(clean);
      setUsername(clean);
      try {
        const id = getOrCreatePlayerId();
        await fetch('/api/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ anonymousId: id, username: clean }),
        });
      } catch (e) {
        // Local name is already set
      }
    }
    setIsEditingName(false);
  };

  return (
    <>
      <header className="sticky top-0 z-50 backdrop-blur-md bg-black/70 border-b border-white/10 px-4 py-3 hidden md:block">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-pink-500 p-0.5 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#0B0E14] rounded-[10px] flex items-center justify-center">
                <Gamepad2 className="w-5 h-5 text-cyan-400 group-hover:text-pink-400 transition-colors" />
              </div>
            </div>
            <div>
              <span className="font-black text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-pink-400 to-amber-300">
                PULSE
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 block -mt-1 font-mono">
                ARCADE V2
              </span>
            </div>
          </Link>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold">
            <Link
              href="/games"
              className="text-gray-300 hover:text-cyan-400 transition-colors flex items-center gap-1.5"
            >
              <Flame className="w-4 h-4 text-orange-400" />
              All Games
            </Link>
            <Link
              href="/daily"
              className="text-gray-300 hover:text-pink-400 transition-colors flex items-center gap-1.5"
            >
              <Calendar className="w-4 h-4 text-pink-400" />
              Daily Challenge
            </Link>
            <Link
              href="/leaderboards"
              className="text-gray-300 hover:text-amber-400 transition-colors flex items-center gap-1.5"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              Leaderboards
            </Link>
            <Link
              href="/profile"
              className="text-gray-300 hover:text-purple-400 transition-colors flex items-center gap-1.5"
            >
              <Award className="w-4 h-4 text-purple-400" />
              Profile
            </Link>
          </nav>

          {/* Right Actions: Sound & Profile */}
          <div className="flex items-center gap-2">
            {/* Audio Toggle */}
            <button
              onClick={handleToggleSound}
              aria-label="Toggle Audio"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all active:scale-95 border border-white/5"
            >
              {muted ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-cyan-400" />
              )}
            </button>

            {/* Link to Profile Page */}
            <Link
              href="/profile"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-white/10 to-white/5 hover:from-white/15 hover:to-white/10 border border-white/10 text-xs font-bold text-gray-200 transition-all active:scale-95 relative"
            >
              <User className="w-3.5 h-3.5 text-pink-400" />
              <span className="max-w-[110px] truncate">{username}</span>
              {achievementCount > 0 && (
                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-gradient-to-r from-pink-500 to-amber-500 flex items-center justify-center shadow-lg shadow-pink-500/50">
                  <span className="text-[8px] font-black text-white">{Math.min(achievementCount, 99)}</span>
                </div>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0B0E14]/95 backdrop-blur-lg border-t border-white/10 px-2 py-2 flex items-center justify-around">
        <Link
          href="/"
          className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-cyan-400 text-[10px] font-bold p-1"
        >
          <Gamepad2 className="w-4 h-4" />
          <span>Home</span>
        </Link>
        <Link
          href="/games"
          className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-orange-400 text-[10px] font-bold p-1"
        >
          <Flame className="w-4 h-4 text-orange-400" />
          <span>Games</span>
        </Link>
        <Link
          href="/daily"
          className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-pink-400 text-[10px] font-bold p-1"
        >
          <Calendar className="w-4 h-4 text-pink-400" />
          <span>Daily</span>
        </Link>
        <Link
          href="/leaderboards"
          className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-amber-400 text-[10px] font-bold p-1"
        >
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>Ranks</span>
        </Link>
        <Link
          href="/profile"
          className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-purple-400 text-[10px] font-bold p-1"
        >
          <User className="w-4 h-4 text-purple-400" />
          <span>Profile</span>
        </Link>
      </nav>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0B0E14]/95 backdrop-blur-lg border-t border-white/10 px-2 py-2 flex items-center justify-around">
        <Link
          href="/"
          className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-cyan-400 text-[10px] font-bold p-1"
        >
          <Gamepad2 className="w-4 h-4" />
          <span>Home</span>
        </Link>
        <Link
          href="/games"
          className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-orange-400 text-[10px] font-bold p-1"
        >
          <Flame className="w-4 h-4 text-orange-400" />
          <span>Games</span>
        </Link>
        <Link
          href="/daily"
          className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-pink-400 text-[10px] font-bold p-1"
        >
          <Calendar className="w-4 h-4 text-pink-400" />
          <span>Daily</span>
        </Link>
        <Link
          href="/leaderboards"
          className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-amber-400 text-[10px] font-bold p-1"
        >
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>Ranks</span>
        </Link>
        <Link
          href="/profile"
          className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-purple-400 text-[10px] font-bold p-1"
        >
          <User className="w-4 h-4 text-purple-400" />
          <span>Profile</span>
        </Link>
      </nav>

      {/* Edit Username Modal */}
      {isEditingName && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#151A23] border border-cyan-500/30 rounded-2xl p-6 w-full max-w-sm shadow-2xl relative">
            <h3 className="text-lg font-black tracking-wide text-white mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              Customize Gamer Tag
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Your name appears on global leaderboards and challenge cards.
            </p>
            <form onSubmit={handleSaveName} className="space-y-4">
              <input
                type="text"
                maxLength={16}
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Enter gamer tag..."
                className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white font-bold focus:outline-none focus:border-cyan-400"
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsEditingName(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-white shadow-lg shadow-cyan-500/25"
                >
                  Save Tag
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
