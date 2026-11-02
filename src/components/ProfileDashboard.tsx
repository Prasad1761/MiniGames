'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  User,
  Trophy,
  Award,
  Play,
  Clock,
  TrendingUp,
  Target,
  Flame,
  Calendar,
  Check,
  Lock,
  Star,
  Award as StarIcon,
  Activity,
  Zap
} from 'lucide-react';
import { GAMES_CATALOG } from '@/lib/games/registry';
import {
  getOrCreatePlayerId,
  getPlayerName,
  getHighScores,
  setPlayerName,
  getPersonalBest,
  getTotalGamesPlayed
} from '@/lib/player';
import { getUnlockedAchievements, ACHIEVEMENTS_LIST } from '@/lib/progression/achievements';

interface ProfileData {
  username: string;
  anonymousId: string;
  totalGamesPlayed: number;
  achievements: {
    unlocked: string[];
    total: number;
    percent: number;
  };
  personalBests: Record<string, number>;
  recentActivity: Array<{
    gameId: string;
    score: number;
    createdAt: string;
    isDaily: boolean;
  }>;
}

interface ProfileDashboardProps {
  initialData?: ProfileData;
  isOwner?: boolean;
}

export default function ProfileDashboard({ initialData, isOwner = false }: ProfileDashboardProps) {
  const [profileData, setProfileData] = useState<ProfileData | null>(initialData || null);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAchievementDetails, setShowAchievementDetails] = useState(false);

  // Initial load
  useEffect(() => {
    if (!initialData) {
      loadProfileData();
    }
  }, [initialData]);

  const loadProfileData = async () => {
    setIsLoading(true);
    try {
      const id = getOrCreatePlayerId();
      const username = getPlayerName();
      const personalBests = getHighScores();
      const totalGames = getTotalGamesPlayed();
      const unlockedAchievements = getUnlockedAchievements();
      const unlockedCount = unlockedAchievements.length;
      const totalAchievements = ACHIEVEMENTS_LIST.length;
      const progressPercent = Math.round((unlockedCount / totalAchievements) * 100);

      // Fetch recent scores from API
      let recentActivity: ProfileData['recentActivity'] = [];
      try {
        const response = await fetch(`/api/profile?anonymousId=${id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.player?.recentScores) {
            recentActivity = data.player.recentScores.slice(0, 5);
          }
        }
      } catch (err) {
        console.error('Failed to fetch recent activity:', err);
      }

      const data: ProfileData = {
        username,
        anonymousId: id,
        totalGamesPlayed: totalGames,
        achievements: {
          unlocked: unlockedAchievements,
          total: totalAchievements,
          percent: progressPercent
        },
        personalBests,
        recentActivity
      };

      setProfileData(data);
      setEditUsername(data.username);
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUsernameUpdate = async () => {
    if (!editUsername.trim()) return;

    setIsLoading(true);
    try {
      await setPlayerName(editUsername.trim());

      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          anonymousId: profileData?.anonymousId,
          username: editUsername.trim()
        })
      });

      if (response.ok) {
        const updatedData = { ...profileData! };
        updatedData.username = editUsername.trim();
        setProfileData(updatedData);
        setIsEditingUsername(false);
      }
    } catch (err) {
      console.error('Failed to update username:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !profileData) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-white/10 rounded w-48" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-white/10 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 text-center">
        <div className="p-12 rounded-3xl bg-[#121622] border border-white/10 shadow-2xl">
          <User className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-white mb-2">Profile Not Found</h2>
          <p className="text-gray-400">Unable to load your profile data.</p>
        </div>
      </div>
    );
  }

  const unlockedAchievementsCount = profileData.achievements.unlocked.length;
  const completionRate = profileData.achievements.percent;
  const topPersonalBests = GAMES_CATALOG
    .slice()
    .sort((a, b) => {
      const pbA = profileData.personalBests[a.id] || 0;
      const pbB = profileData.personalBests[b.id] || 0;
      return pbB - pbA; // Sort by score descending
    })
    .slice(0, 3);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-10 animate-fade-in">
      {/* Profile Header */}
      <section className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#161B26] via-[#10141E] to-[#0A0D14] border border-cyan-500/20 shadow-2xl overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-cyan-400 via-pink-500 to-amber-400 p-0.5 shadow-xl shadow-cyan-500/20">
                <div className="w-full h-full bg-[#0A0D14] rounded-[14px] flex items-center justify-center text-xl sm:text-2xl font-black text-white">
                  {profileData.username.charAt(0).toUpperCase()}
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-white font-display">
                    {isOwner && isEditingUsername ? (
                      <input
                        type="text"
                        value={editUsername}
                        onChange={(e) => setEditUsername(e.target.value)}
                        maxLength={16}
                        className="px-3 py-1.5 rounded-xl bg-black/60 border border-cyan-400 text-white font-extrabold focus:outline-none"
                        autoFocus
                        onBlur={handleUsernameUpdate}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleUsernameUpdate();
                          }
                          if (e.key === 'Escape') {
                            setIsEditingUsername(false);
                          }
                        }}
                      />
                    ) : (
                      profileData.username
                    )}
                  </h1>
                  {isOwner && !isEditingUsername && (
                    <button
                      onClick={() => setIsEditingUsername(true)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    >
                      <User className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] font-mono text-gray-500">
                    ID: {profileData.anonymousId.slice(0, 16)}...
                  </span>
                  <span className="text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                    {isOwner ? 'Local Player' : 'Verified Player'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="flex items-center gap-3 sm:gap-4 bg-black/30 border border-white/5 rounded-2xl p-4">
              <div className="text-center px-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                  Total Plays
                </span>
                <span className="text-xl sm:text-2xl font-black text-cyan-400 font-mono">
                  {profileData.totalGamesPlayed}
                </span>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center px-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                  Completion
                </span>
                <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
                  {completionRate}%
                </span>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center px-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                  Achievements
                </span>
                <span className="text-xl sm:text-2xl font-black text-pink-400 font-mono">
                  {unlockedAchievementsCount}/{profileData.achievements.total}
                </span>
              </div>
            </div>
          </div>

          {/* Achievement Progress Bar */}
          <div className="mt-6 pt-5 border-t border-white/5">
            <div className="flex items-center justify-between text-xs font-bold text-gray-400 mb-2">
              <span>Overall Arcade Completion</span>
              <span className="text-amber-400 font-mono">{completionRate}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 via-pink-500 to-amber-400 transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Personal Bests */}
        <div className="lg:col-span-2 space-y-6">
          {/* Top 3 Personal Bests */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                Top Personal Bests
              </h2>
              <Link
                href="/profile"
                className="text-xs font-bold text-cyan-400 hover:underline flex items-center gap-1"
              >
                View All Games →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topPersonalBests.map((game, index) => {
                const pb = profileData.personalBests[game.id];
                return (
                  <Link
                    key={game.id}
                    href={`/games/${game.id}`}
                    className="p-5 rounded-2xl bg-[#121622] border border-white/10 hover:border-cyan-500/30 transition-all group"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 flex items-center justify-center text-black font-black text-sm">
                        {index + 1}
                      </div>
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: game.accentColor }}
                      />
                    </div>
                    <h3 className="text-base font-black text-white group-hover:text-cyan-400 transition-colors mb-2">
                      {game.title}
                    </h3>
                    <div className="flex items-end justify-between">
                      <div>
                        {pb !== undefined ? (
                          <span className="font-mono font-black text-xl text-amber-400">
                            {pb} {game.scoreUnit}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500 font-mono">Not Played</span>
                        )}
                      </div>
                      <Play className="w-3.5 h-3.5 text-cyan-400 group-hover:text-amber-400" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Recent Activity */}
          <section className="space-y-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-400" />
              Recent Activity
            </h2>

            {profileData.recentActivity.length > 0 ? (
              <div className="rounded-2xl bg-[#121622] border border-white/10 overflow-hidden divide-y divide-white/5">
                {profileData.recentActivity.map((activity) => {
                  const game = GAMES_CATALOG.find((g) => g.id === activity.gameId);
                  return (
                    <div
                      key={activity.gameId + activity.createdAt}
                      className="p-3.5 px-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                    >
                      <div>
                        <span className="text-sm font-bold text-white">
                          {game?.title || activity.gameId}
                        </span>
                        {activity.isDaily && (
                          <span className="ml-2 text-[9px] font-bold uppercase bg-pink-500/20 text-pink-300 px-1.5 py-0.5 rounded">
                            Daily
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-black text-amber-400 text-sm">
                          {activity.score}
                        </span>
                        <span className="text-xs text-gray-400 ml-1">
                          {game?.scoreUnit || 'pts'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl bg-[#121622] border border-white/10 p-8 text-center">
                <Clock className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-sm font-bold text-gray-300">No recent activity</p>
                <p className="text-xs text-gray-500">Play a game to see your scores here</p>
              </div>
            )}
          </section>
        </div>

        {/* Right Column - Achievements & Quick Actions */}
        <div className="space-y-6">
          {/* Achievements Summary */}
          <section className="rounded-2xl bg-[#121622] border border-white/10 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                Achievements
              </h2>
              <button
                onClick={() => setShowAchievementDetails(!showAchievementDetails)}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-bold"
              >
                {showAchievementDetails ? 'Show Less' : `View All (${unlockedAchievementsCount}/${profileData.achievements.total})`}
              </button>
            </div>

            <div className="space-y-3">
              {ACHIEVEMENTS_LIST.slice(0, showAchievementDetails ? undefined : 3).map((achievement) => {
                const isUnlocked = profileData.achievements.unlocked.includes(achievement.id);
                return (
                  <div
                    key={achievement.id}
                    className={`p-3 rounded-xl border transition-all ${
                      isUnlocked
                        ? 'bg-gradient-to-r from-amber-500/10 to-transparent border-amber-500/30'
                        : 'bg-white/5 border-white/10 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center text-lg">
                        {achievement.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className={`text-sm font-bold ${isUnlocked ? 'text-white' : 'text-gray-400'}`>
                            {achievement.title}
                          </h4>
                          {isUnlocked ? (
                            <Check className="w-4 h-4 text-amber-400" />
                          ) : (
                            <Lock className="w-4 h-4 text-gray-600" />
                          )}
                        </div>
                        <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2">
                          {achievement.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {profileData.achievements.total > 3 && !showAchievementDetails && (
              <div className="text-center pt-2">
                <span className="text-xs text-gray-500">
                  +{profileData.achievements.total - 3} more achievements
                </span>
              </div>
            )}
          </section>

          {/* Quick Actions */}
          <section className="rounded-2xl bg-[#121622] border border-white/10 p-5 space-y-4">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              Quick Actions
            </h2>

            <div className="space-y-3">
              <Link
                href="/games"
                className="w-full p-3.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 hover:brightness-110 text-black font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-3.5 h-3.5 fill-black" />
                Play Now
              </Link>

              <Link
                href="/daily"
                className="w-full p-3.5 rounded-xl bg-white/5 hover:bg-pink-500/10 border border-white/10 text-gray-300 hover:text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
              >
                <Calendar className="w-3.5 h-3.5 text-pink-400" />
                Daily Challenge
              </Link>

              {isOwner && (
                <button
                  onClick={() => setIsEditingUsername(true)}
                  className="w-full p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                >
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  Edit Username
                </button>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
