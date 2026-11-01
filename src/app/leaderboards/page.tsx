'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Trophy, Flame, Medal, Calendar, Play, Filter, Clock, Sparkles } from 'lucide-react';
import { GAMES_CATALOG } from '@/lib/games/registry';
import { getPlayerName } from '@/lib/player';

interface LeaderboardEntry {
  rank: number;
  id: string;
  score: number;
  username: string;
  createdAt: string;
}

export default function LeaderboardsPage() {
  const [selectedGameId, setSelectedGameId] = useState('perfect-stack');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'reflex' | 'precision' | 'speed' | 'puzzle'>('all');
  const [isDaily, setIsDaily] = useState(false);
  const [scores, setScores] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUsername, setCurrentUsername] = useState('ArcadePlayer');

  const selectedGame = GAMES_CATALOG.find((g) => g.id === selectedGameId) || GAMES_CATALOG[0];

  const filteredGames = categoryFilter === 'all'
    ? GAMES_CATALOG
    : GAMES_CATALOG.filter((g) => g.category === categoryFilter);

  useEffect(() => {
    setCurrentUsername(getPlayerName());
  }, []);

  const fetchScores = () => {
    setLoading(true);
    const dateStr = new Date().toISOString().split('T')[0];
    const url = `/api/scores?gameId=${selectedGameId}${isDaily ? `&isDaily=true&dailyDate=${dateStr}` : ''}`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setScores(data.scores || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchScores();
  }, [selectedGameId, isDaily]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-black uppercase tracking-wider mb-2">
            <Trophy className="w-3.5 h-3.5" />
            Hall of Fame
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white font-display">
            GLOBAL LEADERBOARDS
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Real-time verified high scores from all 10 arcade challenges worldwide.
          </p>
        </div>

        {/* Daily vs All Time Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-white/5 border border-white/10 self-start sm:self-auto shrink-0">
          <button
            onClick={() => setIsDaily(false)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              !isDaily ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20 font-black' : 'text-gray-400 hover:text-white'
            }`}
          >
            All-Time
          </button>
          <button
            onClick={() => setIsDaily(true)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              isDaily ? 'bg-pink-500 text-white shadow-md shadow-pink-500/20 font-black' : 'text-gray-400 hover:text-white'
            }`}
          >
            Daily Only
          </button>
        </div>
      </div>

      {/* Category Pills & Game Selector */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-xs font-bold text-gray-400 flex items-center gap-1 mr-1">
              <Filter className="w-3 h-3" /> Category:
            </span>
            {(['all', 'reflex', 'precision', 'speed', 'puzzle'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setCategoryFilter(cat);
                  // Auto-select first game of category if current game isn't in it
                  if (cat !== 'all') {
                    const match = GAMES_CATALOG.find((g) => g.category === cat);
                    if (match && selectedGame.category !== cat) {
                      setSelectedGameId(match.id);
                    }
                  }
                }}
                className={`px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${
                  categoryFilter === cat
                    ? 'bg-white/20 text-white border border-white/30'
                    : 'bg-white/5 text-gray-400 hover:text-white border border-transparent'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <span className="text-[11px] font-mono text-gray-500 hidden sm:inline">
            Showing {filteredGames.length} of {GAMES_CATALOG.length} games
          </span>
        </div>

        {/* Game Selector Chips - ALL 10 Mini-Games */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {filteredGames.map((g) => (
            <button
              key={g.id}
              onClick={() => setSelectedGameId(g.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black tracking-wider whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedGameId === g.id
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 ring-2 ring-cyan-400/40'
                  : 'bg-[#121622] hover:bg-[#181E2E] text-gray-300 border border-white/5'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              {g.title}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard Table Card */}
      <div className="rounded-3xl bg-[#121622] border border-white/10 shadow-2xl overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">{selectedGame.title} Rankings</h2>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">
                {selectedGame.category}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Scored in <strong className="text-white">{selectedGame.scoreUnit}</strong>
              {selectedGame.lowerIsBetter && ' • (Lowest response time wins)'}
            </p>
          </div>

          <Link
            href={`/games/${selectedGame.id}`}
            className="self-start sm:self-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 hover:brightness-110 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-black" />
            Play This Game
          </Link>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <span className="text-xs text-gray-400 font-mono">Fetching verified leaderboard...</span>
          </div>
        ) : scores.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Trophy className="w-12 h-12 text-gray-600 mx-auto" />
            <p className="text-sm font-bold text-gray-300">No scores recorded yet for this game.</p>
            <p className="text-xs text-gray-500">Be the first to step into the arena and claim Rank #1!</p>
            <Link
              href={`/games/${selectedGame.id}`}
              className="inline-block mt-3 px-6 py-2.5 rounded-xl bg-cyan-500 text-black font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/25"
            >
              Play {selectedGame.title}
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {scores.map((entry) => {
              const isCurrentUser = entry.username.toLowerCase() === currentUsername.toLowerCase();
              const dateDisplay = entry.createdAt
                ? new Date(entry.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                : '';

              return (
                <div
                  key={entry.id || `${entry.rank}-${entry.username}`}
                  className={`py-3.5 px-4 sm:px-6 flex items-center justify-between transition-colors ${
                    isCurrentUser ? 'bg-cyan-500/10 border-l-4 border-cyan-400' : 'hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <span className="w-7 text-center font-black text-sm">
                      {entry.rank === 1 && <span className="text-amber-400 text-lg">🥇</span>}
                      {entry.rank === 2 && <span className="text-gray-300 text-lg">🥈</span>}
                      {entry.rank === 3 && <span className="text-amber-600 text-lg">🥉</span>}
                      {entry.rank > 3 && <span className="text-gray-500 font-mono">#{entry.rank}</span>}
                    </span>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-extrabold ${isCurrentUser ? 'text-cyan-300' : 'text-white'}`}>
                          {entry.username}
                        </span>
                        {isCurrentUser && (
                          <span className="text-[9px] font-black uppercase bg-cyan-400 text-black px-1.5 py-0.2 rounded font-mono">
                            YOU
                          </span>
                        )}
                      </div>
                      {dateDisplay && (
                        <span className="text-[10px] text-gray-500 flex items-center gap-1 font-mono">
                          <Clock className="w-2.5 h-2.5" /> {dateDisplay}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono text-base sm:text-lg font-black text-amber-400">
                      {entry.score}
                    </span>
                    <span className="text-[11px] text-gray-400 ml-1 font-semibold">
                      {selectedGame.scoreUnit}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
