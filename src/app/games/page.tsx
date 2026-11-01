'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Flame, Play, Clock, Sparkles, Search, Trophy } from 'lucide-react';
import { GAMES_CATALOG } from '@/lib/games/registry';
import { getHighScores } from '@/lib/player';

export default function AllGamesPage() {
  const [filter, setFilter] = useState<'all' | 'reflex' | 'precision' | 'speed' | 'puzzle'>('all');
  const [search, setSearch] = useState('');
  const [highScores, setHighScores] = useState<Record<string, number>>({});

  useEffect(() => {
    setHighScores(getHighScores());
  }, []);

  const filtered = GAMES_CATALOG.filter((g) => {
    const matchesCategory = filter === 'all' || g.category === filter;
    const matchesSearch =
      search === '' ||
      g.title.toLowerCase().includes(search.toLowerCase()) ||
      g.description.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fade-in pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-black uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            10 Original Mini-Games
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white font-display">
            ARCADE DIRECTORY
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Zero load time, zero sign-up. Tap any game and play in under 3 seconds.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search mini-games..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-xs font-bold focus:outline-none focus:border-cyan-400 transition-colors"
          />
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="flex flex-wrap items-center gap-2">
        {(['all', 'reflex', 'precision', 'speed', 'puzzle'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              filter === cat
                ? 'bg-gradient-to-r from-cyan-400 to-blue-600 text-black shadow-lg shadow-cyan-500/20'
                : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((g) => {
          const pb = highScores[g.id];

          return (
            <div
              key={g.id}
              className="group rounded-3xl bg-[#121622] border border-white/10 hover:border-cyan-500/40 p-6 flex flex-col justify-between transition-all hover:-translate-y-1 shadow-xl relative overflow-hidden"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider text-black font-mono"
                    style={{ backgroundColor: g.accentColor }}
                  >
                    {g.badge || g.category}
                  </span>
                  <span className="text-xs text-gray-400 flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5" /> 10-60s
                  </span>
                </div>

                <h3 className="text-xl font-black text-white group-hover:text-cyan-400 transition-colors">
                  {g.title}
                </h3>
                <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                  {g.description}
                </p>

                <div className="mt-4 p-3 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block font-mono">
                    MECHANIC
                  </span>
                  <p className="text-[11px] text-gray-300 mt-0.5 font-medium">
                    {g.instructions[0]}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                <div>
                  {pb !== undefined ? (
                    <div className="flex items-center gap-1 text-xs">
                      <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-gray-400 text-[11px]">Best:</span>
                      <span className="font-mono font-black text-amber-400">
                        {pb} {g.scoreUnit}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[11px] font-bold text-gray-500 font-mono">
                      Unit: {g.scoreUnit}
                    </span>
                  )}
                </div>

                <Link
                  href={`/games/${g.id}`}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 group-hover:brightness-110 text-black font-black text-xs tracking-wider uppercase transition-all flex items-center gap-1.5 shadow-md shadow-cyan-500/20 active:scale-95"
                >
                  Play Now <Play className="w-3 h-3 fill-current" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center text-gray-400 space-y-2">
          <p className="text-base font-bold">No mini-games found matching "{search}"</p>
          <button
            onClick={() => {
              setSearch('');
              setFilter('all');
            }}
            className="text-xs text-cyan-400 underline font-bold"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
