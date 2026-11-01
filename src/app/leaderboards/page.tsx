'use client';

import React, { useEffect, useState } from 'react';
import { Trophy, Flame, Medal, RotateCcw, Calendar, Zap } from 'lucide-react';
import { GAMES_CATALOG } from '@/lib/games/registry';

interface LeaderboardEntry {
  rank: number;
  id: string;
  score: number;
  username: string;
  createdAt: string;
}

export default function LeaderboardsPage() {
  const [selectedGameId, setSelectedGameId] = useState('perfect-stack');
  const [isDaily, setIsDaily] = useState(false);
  const [scores, setScores] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const selectedGame = GAMES_CATALOG.find((g) => g.id === selectedGameId) || GAMES_CATALOG[0];

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
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-white flex items-center gap-2">
            <Trophy className="w-8 h-8 text-amber-400" />
            Global Hall of Fame
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Real-time verified high scores from players worldwide.
          </p>
        </div>

        {/* Daily vs All Time Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-white/5 border border-white/10 self-start sm:self-auto">
          <button
            onClick={() => setIsDaily(false)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              !isDaily ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20' : 'text-gray-400 hover:text-white'
            }`}
          >
            All-Time
          </button>
          <button
            onClick={() => setIsDaily(true)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              isDaily ? 'bg-pink-500 text-white shadow-md shadow-pink-500/20' : 'text-gray-400 hover:text-white'
            }`}
          >
            Daily Only
          </button>
        </div>
      </div>

      {/* Game Selector Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {GAMES_CATALOG.slice(0, 3).map((g) => (
          <button
            key={g.id}
            onClick={() => setSelectedGameId(g.id)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black tracking-wider whitespace-nowrap transition-all flex items-center gap-1.5 ${
              selectedGameId === g.id
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
                : 'bg-[#121622] hover:bg-[#181E2E] text-gray-300 border border-white/5'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            {g.title}
          </button>
        ))}
      </div>

      {/* Leaderboard Table Card */}
      <div className="rounded-3xl bg-[#121622] border border-white/10 shadow-2xl overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-white">{selectedGame.title} Rankings</h2>
            <span className="text-xs text-gray-400">
              Scored in {selectedGame.scoreUnit} {selectedGame.lowerIsBetter && '(Lowest time wins)'}
            </span>
          </div>

          <button
            onClick={fetchScores}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
            title="Refresh Leaderboard"
          >
            <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : scores.length === 0 ? (
          <div className="py-20 text-center text-gray-400 text-sm">
            <p>No scores submitted for this category yet.</p>
            <p className="text-xs text-gray-500 mt-1">Play a round to take the #1 spot!</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {scores.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-4 sm:px-6 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <span
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                      s.rank === 1
                        ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/25'
                        : s.rank === 2
                        ? 'bg-slate-300 text-black'
                        : s.rank === 3
                        ? 'bg-amber-700 text-white'
                        : 'bg-white/5 text-gray-400 border border-white/5'
                    }`}
                  >
                    {s.rank}
                  </span>
                  <div>
                    <span className="text-sm font-bold text-white block">
                      {s.username}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-base sm:text-lg font-black text-cyan-400 font-display block">
                    {selectedGame.scoreFormat ? selectedGame.scoreFormat(s.score) : s.score}
                  </span>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">
                    {selectedGame.scoreUnit}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
