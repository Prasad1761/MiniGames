# ⚡ ArcadePulse — Viral Mini-Games Platform

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=flat&logo=tailwindcss)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2d3748?style=flat&logo=prisma)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A high-octane, mobile-first browser gaming platform featuring **10 original, highly addictive mini-games**. Built for instantaneous zero-signup play, 60 FPS mobile touch precision, procedural Web Audio sound effects, and organic viral friend challenges.

---

## 🎮 The 10 Mini-Games

| # | Game | Genre | Description |
|---|------|-------|-------------|
| 1 | **[Perfect Stack](src/lib/games/perfect-stack.ts)** | Precision / Timing | Horizontal slabs slide back and forth. Misaligned overhangs are sliced off with physics gravity. Nail consecutive perfect hits to trigger rising pentatonic combos and recover width! |
| 2 | **[Reaction Test](src/lib/games/reaction-test.ts)** | Raw Reflexes (ms) | Millisecond-accurate reflex test. Wait for the crimson screen to flash electric green. Calculates percentile ranking (*Godlike*, *Cybernetic*, *Lightning*). |
| 3 | **[Gravity Flip](src/lib/games/gravity-flip.ts)** | Physics Runner | Sprint through a neon cyber corridor. Invert gravity on the fly to dodge floor spikes, ceiling hazards, and floating laser barriers. Features near-miss bonus multipliers. |
| 4 | **[Color Panic](src/lib/games/color-panic.ts)** | Stroop Reflex | Match colors against deceptive text names before the accelerating fuse burns down. |
| 5 | **[One More Jump](src/lib/games/one-more-jump.ts)** | Platformer Leap | Single-touch leap physics between shifting platforms with bullseye center landings. |
| 6 | **[Don't Tap Red](src/lib/games/dont-tap-red.ts)** | Speed Grid | Rapid descending piano-tile grid. Tap safe tiles while dodging red skull bombs. |
| 7 | **[Memory Flash](src/lib/games/memory-flash.ts)** | Spatial Memory | Replay expanding audio-visual pad sequences with unique musical tones. |
| 8 | **[Perfect Timing](src/lib/games/perfect-timing.ts)** | Gauge Accuracy | High-speed oscillating gauge needle; stop it directly inside the razor-thin bullseye. |
| 9 | **[Merge Rush](src/lib/games/merge-rush.ts)** | Numerical Puzzle | Rapid column drop-merge numerical blitz (powers of 2) with cascading gravity fusions. |
| 10| **[Impossible Maze](src/lib/games/impossible-maze.ts)** | Precision Path | Guide a glowing plasma spark through narrow procedural neon corridors without touching the walls. |

---

## ✨ Key Features

- **🚀 Instant Play**: Zero friction, zero signups, loads and runs immediately.
- **⚡ 3-Second Comprehension**: Bite-sized 10–60 second rounds with interactive tutorials.
- **🔊 Procedural Web Audio API**: 100% synthesized retro bleeps, rising pentatonic arpeggios, whooshes, and crash sounds with 0 audio asset loading latency.
- **🤝 1-Tap Friend Challenge Links**: Generates `/challenge/[id]` links with exact target scores to beat and synchronized random seeds.
- **📸 Viral Scorecard Exporter**: Offscreen Canvas renders high-res 1200x630 share cards for Instagram, X, or WhatsApp with native `navigator.share` or direct PNG download.
- **📅 Synchronized Global Daily Challenges**: Mulberry32 PRNG seeded by `YYYYMMDD` ensures every player worldwide plays identical procedural layouts.
- **🏆 Persistent Global Leaderboards**: Prisma SQLite/PostgreSQL-backed leaderboards tracking all-time and daily records with anti-cheat validation.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, React 18, TypeScript)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with custom neon dark arcade theme
- **Game Engine**: Unified Canvas 2D engine running at smooth 60 FPS
- **Audio**: Web Audio API (real-time procedural oscillator synthesis)
- **Database / ORM**: [Prisma](https://www.prisma.io/) with SQLite (seamlessly portable to PostgreSQL)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Visual FX**: [canvas-confetti](https://www.npmjs.com/package/canvas-confetti)

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/arcade-pulse.git
cd arcade-pulse
```

### 2. Install dependencies
```bash
npm install
```

### 3. Initialize the database
```bash
npx prisma db push
```

### 4. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to start playing!

---

## 🧪 Production Build & Automated Testing

Build production bundle:
```bash
npm run build
```

Run automated browser tests & capture screenshots:
```bash
node scripts/test-and-capture.js
```

---

## 📄 License

MIT License. Open source and free to use!
