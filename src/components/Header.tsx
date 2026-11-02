'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Volume2,
  VolumeX,
  Flame,
  Trophy,
  Calendar,
  User,
  Gamepad2,
  Award,
  Menu,
  X
} from 'lucide-react';
import { sound } from '@/lib/audio';
import { getPlayerName, setPlayerName, getOrCreatePlayerId } from '@/lib/player';

export default function Header() {
  const [muted, setMuted] = useState(false);
  const [username, setUsername] = useState('ArcadePlayer');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMuted(sound.isMuted());
    setUsername(getPlayerName());
  }, []);

  const handleToggleSound = () => {
    const next = sound.toggleMute();
    setMuted(next);
    if (!next) sound.playTap();
  };

  const navItems = [
    { href: '/games', label: 'All Games', icon: Flame, color: 'text-orange-400' },
    { href: '/daily', label: 'Daily Challenge', icon: Calendar, color: 'text-pink-400' },
    { href: '/leaderboards', label: 'Leaderboards', icon: Trophy, color: 'text-amber-400' },
    { href: '/profile', label: 'Profile', icon: Award, color: 'text-purple-400' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-black/80 border-b border-white/10 px-4 py-2 sm:py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-pink-500 p-0.5 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#0B0E14] rounded-[10px] flex items-center justify-center">
                <Gamepad2 className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400 group-hover:text-pink-400 transition-colors" />
              </div>
            </div>
            <div>
              <span className="font-black text-lg sm:text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-pink-400 to-amber-300">
                PULSE
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-cyan-400 block -mt-1 font-mono">
                ARCADE V2
              </span>
            </div>
          </Link>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-5 xl:gap-7 text-sm font-semibold">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all ${
                  isActive(item.href)
                    ? 'bg-white/10 text-white shadow-md'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon className={`w-4 h-4 ${item.color}`} />
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
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

            {/* Profile Link */}
            <Link
              href="/profile"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-white/10 to-white/5 hover:from-white/15 hover:to-white/10 border border-white/10 text-xs font-bold text-gray-200 transition-all active:scale-95"
            >
              <User className="w-3.5 h-3.5 text-pink-400" />
              <span className="max-w-[80px] sm:max-w-[120px] truncate">{username}</span>
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle Menu"
              className="lg:hidden p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all active:scale-95 border border-white/5"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-black/95 backdrop-blur-lg border-b border-white/10">
            <nav className="max-w-7xl mx-auto px-4 py-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    isActive(item.href)
                      ? 'bg-white/10 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                  <span className="font-semibold">{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0B0E14]/98 backdrop-blur-lg border-t border-white/10 px-1 py-1.5 flex items-center justify-around safe-bottom">
        <Link
          href="/"
          className={`flex flex-col items-center gap-0.5 text-[9px] font-bold p-1.5 rounded-lg transition-colors ${
            pathname === '/' ? 'text-cyan-400' : 'text-gray-400 hover:text-cyan-400'
          }`}
        >
          <Gamepad2 className="w-4 h-4" />
          <span>Home</span>
        </Link>
        <Link
          href="/games"
          className={`flex flex-col items-center gap-0.5 text-[9px] font-bold p-1.5 rounded-lg transition-colors ${
            isActive('/games') ? 'text-orange-400' : 'text-gray-400 hover:text-orange-400'
          }`}
        >
          <Flame className="w-4 h-4 text-orange-400" />
          <span>Games</span>
        </Link>
        <Link
          href="/daily"
          className={`flex flex-col items-center gap-0.5 text-[9px] font-bold p-1.5 rounded-lg transition-colors ${
            isActive('/daily') ? 'text-pink-400' : 'text-gray-400 hover:text-pink-400'
          }`}
        >
          <Calendar className="w-4 h-4 text-pink-400" />
          <span>Daily</span>
        </Link>
        <Link
          href="/leaderboards"
          className={`flex flex-col items-center gap-0.5 text-[9px] font-bold p-1.5 rounded-lg transition-colors ${
            isActive('/leaderboards') ? 'text-amber-400' : 'text-gray-400 hover:text-amber-400'
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>Ranks</span>
        </Link>
        <Link
          href="/profile"
          className={`flex flex-col items-center gap-0.5 text-[9px] font-bold p-1.5 rounded-lg transition-colors ${
            isActive('/profile') ? 'text-purple-400' : 'text-gray-400 hover:text-purple-400'
          }`}
        >
          <User className="w-4 h-4 text-purple-400" />
          <span>Profile</span>
        </Link>
      </nav>
    </>
  );
}
