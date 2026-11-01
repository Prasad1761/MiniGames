'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Flame, Play, Clock, Sparkles } from 'lucide-react';
import { GAMES_CATALOG } from '@/lib/games/registry';

export default function AllGamesPage() {
  const [filter, setFilter] = useState<'all' | 'reflex' | 'precision' | 'speed' | 'puzzle'>('all');

  const filtered = filter === 'all'
    ? GAMES_CATALOG
    : GAMES_CATALOG.filter((g) => g.category === filter);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl sm:text-4xl font-black text-white flex items-center gap-2">
          <Flame className="w-8 h-8 text-orange-400" />
          Mini-Games Arcade
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Pick any game and start playing in under 3 seconds.
        </p>
      </div>

      {/* Category Filter Chips */}
      <div className="flex flex-wrap items-center gap-2">
        {(['all', 'reflex', 'precision', 'speed', 'puzzle'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              filter === cat
                ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
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
          const isPlayable = ['perfect-stack', 'reaction-test', 'gravity-flip'].includes(g.id);

          return (
            <div
              key={g.id}
              className="group rounded-3xl bg-[#121622] border border-white/10 hover:border-cyan-500/40 p-6 flex flex-col justify-between transition-all hover:-translate-y-1 shadow-xl"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider text-black"
                    style={{ backgroundColor: g.accentColor }}
                  >
                    {g.badge || g.category}
                  </span>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
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
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
                    HOW TO PLAY
                  </span>
                  <p className="text-[11px] text-gray-300 mt-0.5 font-medium">
                    {g.instructions[0]}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500">
                  Unit: {g.scoreUnit}
                </span>

                <Link
                  href={`/games/${g.id}`}
                  className="px-5 py-2.5 rounded-xl bg-white/10 group-hover:bg-cyan-500 text-white group-hover:text-black font-black text-xs tracking-wider uppercase transition-all flex items-center gap-1.5"
                >
                  {isPlayable ? 'Play Now' : 'Preview'} <Play className="w-3 h-3 fill-current" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
