'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  User,
  Trophy,
  Award,
  Play,
  Edit2,
  Check,
  Flame,
  Sparkles,
  Lock,
  Unlock,
  RotateCcw,
  Clock,
  Zap,
} from 'lucide-react';
import { GAMES_CATALOG } from '@/lib/games/registry';
import { getOrCreatePlayerId, getPlayerName, setPlayerName, getHighScores } from '@/lib/player';
import { ACHIEVEMENTS_LIST, getUnlockedAchievements } from '@/lib/progression/achievements';

interface RecentScore {
  id: string;
  gameId: string;
  score: number;
  createdAt: string;
  isDaily: boolean;
}

export default function ProfilePage() {
  const [username, setUsernameState] = useState('ArcadePlayer');
  const [anonymousId, setAnonymousId] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editInput, setEditInput] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [localPBs, setLocalPBs] = useState<Record<string, number>>({});
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const [recentScores, setRecentScores] = useState<RecentScore[]>([]);
  const [totalRounds, setTotalRounds] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = getOrCreatePlayerId();
    const name = getPlayerName();
    const pbs = getHighScores();
    const achievements = getUnlockedAchievements();

    setAnonymousId(id);
    setUsernameState(name);
    setEditInput(name);
    setLocalPBs(pbs);
    setUnlockedAchievements(achievements);

    // Fetch synced stats from API
    fetch(`/api/profile?anonymousId=${encodeURIComponent(id)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.player) {
          if (data.player.username) {
            setUsernameState(data.player.username);
            setEditInput(data.player.username);
          }
          if (data.player.personalBests) {
            setLocalPBs((prev) => ({ ...prev, ...data.player.personalBests }));
          }
          if (data.player.totalScores !== undefined) {
            setTotalRounds(data.player.totalScores);
          }
          if (data.player.recentScores) {
            setRecentScores(data.player.recentScores);
          }
        }
      })
      .catch((err) => console.error('Failed to load profile', err))
      .finally(() => setLoading(false));
  }, []);

  const handleSaveUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editInput.trim()) return;
    setSavingName(true);

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          anonymousId,
          username: editInput.trim(),
        }),
      });
      const data = await res.json();
      if (data.success && data.username) {
        setPlayerName(data.username);
        setUsernameState(data.username);
        setIsEditing(false);
      }
    } catch (err) {
      console.error('Failed to update username', err);
    } finally {
      setSavingName(false);
    }
  };

  const unlockedCount = unlockedAchievements.length;
  const totalAchievements = ACHIEVEMENTS_LIST.length;
  const progressPercent = Math.round((unlockedCount / totalAchievements) * 100);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-10 animate-fade-in">
      {/* Player Identity Banner */}
      <section className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#161B26] via-[#10141E] to-[#0A0D14] border border-cyan-500/20 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-400 via-pink-500 to-amber-400 p-0.5 shadow-xl shadow-cyan-500/20">
              <div className="w-full h-full bg-[#0A0D14] rounded-[14px] flex items-center justify-center text-2xl font-black text-white">
                {username.charAt(0).toUpperCase()}
              </div>
            </div>

            <div>
              {isEditing ? (
                <form onSubmit={handleSaveUsername} className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={16}
                    value={editInput}
                    onChange={(e) => setEditInput(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-black/60 border border-cyan-400 text-white font-extrabold text-sm focus:outline-none"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={savingName}
                    className="p-2 rounded-xl bg-cyan-500 text-black font-bold hover:brightness-110"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 rounded-xl bg-white/5 text-gray-400 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-white font-display">
                    {username}
                  </h1>
                  <button
                    onClick={() => {
                      setEditInput(username);
                      setIsEditing(true);
                    }}
                    aria-label="Edit Gamer Tag"
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] font-mono text-gray-500">
                  ID: {anonymousId.slice(0, 16)}...
                </span>
                <span className="text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                  Verified Local Player
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="flex items-center gap-4 sm:gap-6 bg-black/30 border border-white/5 rounded-2xl p-4">
            <div className="text-center px-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                Total Plays
              </span>
              <span className="text-xl sm:text-2xl font-black text-cyan-400 font-mono">
                {totalRounds}
              </span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center px-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                Achievements
              </span>
              <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
                {unlockedCount} / {totalAchievements}
              </span>
            </div>
          </div>
        </div>

        {/* Achievement Progress Bar */}
        <div className="mt-6 pt-5 border-t border-white/5">
          <div className="flex items-center justify-between text-xs font-bold text-gray-400 mb-2">
            <span>Overall Arcade Completion</span>
            <span className="text-amber-400 font-mono">{progressPercent}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 via-pink-500 to-amber-400 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </section>

      {/* All 10 Mini-Games Personal Bests */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            Your Personal Bests (All 10 Games)
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Track your all-time highest scores across the entire game catalog.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {GAMES_CATALOG.map((g) => {
            const pb = localPBs[g.id];
            const hasPlayed = pb !== undefined && pb !== null;

            return (
              <div
                key={g.id}
                className="p-5 rounded-2xl bg-[#121622] border border-white/10 hover:border-cyan-500/30 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="text-[10px] font-black uppercase px-2 py-0.5 rounded text-black font-mono"
                      style={{ backgroundColor: g.accentColor }}
                    >
                      {g.category}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">
                      {g.scoreUnit}
                    </span>
                  </div>

                  <h3 className="text-base font-black text-white">{g.title}</h3>

                  <div className="mt-3 p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-semibold">Personal Best</span>
                    <span className={`font-mono font-black text-lg ${hasPlayed ? 'text-amber-400' : 'text-gray-600'}`}>
                      {hasPlayed ? `${pb} ${g.scoreUnit}` : 'Not Played'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex justify-end">
                  <Link
                    href={`/games/${g.id}`}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-cyan-500 text-gray-300 hover:text-black font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1"
                  >
                    Play <Play className="w-3 h-3 fill-current" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Achievements Showcase */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-pink-400" />
            Arcade Trophies & Milestones
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Earn badges through skill, persistence, and multiplayer rivalry.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ACHIEVEMENTS_LIST.map((ach) => {
            const isUnlocked = unlockedAchievements.includes(ach.id);

            return (
              <div
                key={ach.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isUnlocked
                    ? 'bg-gradient-to-b from-[#191F2D] to-[#121622] border-amber-500/40 shadow-lg shadow-amber-500/10'
                    : 'bg-[#0E121B]/60 border-white/5 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center text-xl">
                    {ach.icon}
                  </div>
                  {isUnlocked ? (
                    <span className="text-[10px] font-black uppercase text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Unlock className="w-2.5 h-2.5" /> Unlocked
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-gray-500 bg-white/5 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> Locked
                    </span>
                  )}
                </div>

                <h4 className={`text-sm font-black ${isUnlocked ? 'text-white' : 'text-gray-400'}`}>
                  {ach.title}
                </h4>
                <p className="text-[11px] text-gray-400 mt-1 leading-snug">
                  {ach.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Recent Scores */}
      {recentScores.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            Recent Verified Runs
          </h2>
          <div className="rounded-2xl bg-[#121622] border border-white/10 overflow-hidden divide-y divide-white/5">
            {recentScores.slice(0, 5).map((s) => {
              const game = GAMES_CATALOG.find((g) => g.id === s.gameId);
              return (
                <div key={s.id} className="p-3.5 px-4 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-bold text-white">
                      {game ? game.title : s.gameId}
                    </span>
                    {s.isDaily && (
                      <span className="ml-2 text-[9px] font-bold uppercase bg-pink-500/20 text-pink-300 px-1.5 py-0.5 rounded">
                        Daily
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-black text-amber-400 text-sm">
                      {s.score}
                    </span>
                    <span className="text-xs text-gray-400 ml-1">
                      {game?.scoreUnit || 'pts'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
