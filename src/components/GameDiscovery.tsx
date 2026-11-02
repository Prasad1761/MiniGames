'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Play, Clock, Trophy, Search, Filter, Flame, Star } from 'lucide-react';
import { GAMES_CATALOG } from '@/lib/games/registry';
import { getHighScores } from '@/lib/player';

interface GameDiscoveryProps {
  showSearch?: boolean;
  limit?: number;
  showFilters?: boolean;
}

export default function GameDiscovery({
  showSearch = true,
  limit = 10,
  showFilters = true
}: GameDiscoveryProps) {
  const [filter, setFilter] = useState<'all' | 'reflex' | 'precision' | 'speed' | 'puzzle'>('all');
  const [search, setSearch] = useState('');
  const [highScores] = useState<Record<string, number>>(getHighScores());

  const filtered = GAMES_CATALOG.filter((g) => {
    const matchesCategory = filter === 'all' || g.category === filter;
    const matchesSearch =
      search === '' ||
      g.title.toLowerCase().includes(search.toLowerCase()) ||
      g.tagline.toLowerCase().includes(search.toLowerCase()) ||
      g.description.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  }).slice(0, limit);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'reflex': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'precision': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'speed': return 'bg-pink-500/20 text-pink-400 border-pink-500/30';
      case 'puzzle': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default: return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      {(showSearch || showFilters) && (
        <div className="space-y-4">
          {showSearch && (
            <div className="relative w-full max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search games by name or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-cyan-400 focus:bg-white/10 transition-all"
              />
            </div>
          )}

          {showFilters && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-gray-400 mr-2">
                <Filter className="w-3.5 h-3.5" />
                <span className="font-semibold">Filter by:</span>
              </div>
              {(['all', 'reflex', 'precision', 'speed', 'puzzle'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                    filter === cat
                      ? 'bg-gradient-to-r from-cyan-400 to-blue-600 text-black shadow-lg shadow-cyan-500/20'
                      : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5'
                  }`}
                >
                  {cat === 'all' ? 'All Games' : cat}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Game Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filtered.map((g) => {
          const pb = highScores[g.id];
          const isNew = !pb;

          return (
            <Link
              key={g.id}
              href={`/games/${g.id}`}
              className="group relative rounded-3xl bg-gradient-to-br from-[#121622] to-[#0F131D] border border-white/10 hover:border-cyan-500/40 overflow-hidden transition-all duration-300 hover:-translate-y-1 shadow-xl hover:shadow-cyan-500/10"
            >
              {/* Accent glow */}
              <div
                className="absolute top-0 right-0 w-32 h-32 opacity-10 rounded-full blur-2xl transition-opacity group-hover:opacity-25"
                style={{ backgroundColor: g.accentColor }}
              />

              <div className="relative p-5 sm:p-6 flex flex-col h-full">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider text-black"
                      style={{ backgroundColor: g.accentColor }}
                    >
                      {g.badge?.split(' ')[0] || g.category}
                    </span>
                    {isNew ? (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <Star className="w-2.5 h-2.5" />
                        NEW
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-amber-400 flex items-center gap-1 font-mono">
                        <Trophy className="w-3.5 h-3.5" />
                        {pb} {g.scoreUnit}
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg sm:text-xl font-black text-white group-hover:text-cyan-400 transition-colors mb-2">
                    {g.title}
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed line-clamp-2 mb-3">
                    {g.tagline}
                  </p>

                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getCategoryColor(g.category)}`}>
                      {g.category.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-gray-500 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      10-45s
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-xs text-gray-400 font-medium">
                    {g.instructions[0].substring(0, 30)}...
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-500/20 group-hover:scale-110 transition-transform">
                    <Play className="w-3.5 h-3.5 fill-black text-black" />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="py-12 text-center text-gray-400 space-y-2">
          <Search className="w-12 h-12 mx-auto text-gray-600 mb-3" />
          <p className="text-base font-bold">No games found</p>
          <p className="text-xs">Try adjusting your search or filters</p>
          <button
            onClick={() => {
              setSearch('');
              setFilter('all');
            }}
            className="text-xs text-cyan-400 underline font-bold mt-2"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
