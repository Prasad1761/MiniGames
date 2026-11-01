# ⚡ ArcadePulse V2 — Viral Mini-Games Platform

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=flat&logo=tailwindcss)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2d3748?style=flat&logo=prisma)](https://www.prisma.io/)
[![Vitest](https://img.shields.io/badge/Vitest-5.0-6e9f18?style=flat&logo=vitest)](https://vitest.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A high-performance, mobile-first browser gaming platform featuring **10 original mini-games**. Built for zero-signup instant play, 60 FPS delta-time normalized physics, zero-asset Web Audio synthesis, cryptographic run token verification, and real-time friend challenges.

---

## 🎮 The 10 Original Mini-Games

| # | Game | Category | Core Mechanic | Scoring Metric |
|---|------|----------|---------------|----------------|
| 1 | **[Perfect Stack](src/lib/games/perfect-stack.ts)** | Precision | Slicing moving slabs with rising pentatonic combo cascades | Blocks stacked |
| 2 | **[Reaction Test](src/lib/games/reaction-test.ts)** | Reflex | Millisecond reflex stopwatch upon color trigger | Milliseconds (lower is better) |
| 3 | **[Gravity Flip](src/lib/games/gravity-flip.ts)** | Speed | Tap to flip runner gravity between floor and ceiling | Distance in meters |
| 4 | **[Color Panic](src/lib/games/color-panic.ts)** | Reflex | Match target colors against deceptive tiles before timer expires | Correct color matches |
| 5 | **[One More Jump](src/lib/games/one-more-jump.ts)** | Precision | Charge and release arc leaps across shifting platforms | Platforms cleared |
| 6 | **[Don't Tap Red](src/lib/games/dont-tap-red.ts)** | Speed | Descending tile grid; tap safe keys while avoiding red traps | Points |
| 7 | **[Memory Flash](src/lib/games/memory-flash.ts)** | Puzzle | Memorize and repeat expanding audio-visual tile sequences | Sequences completed |
| 8 | **[Perfect Timing](src/lib/games/perfect-timing.ts)** | Precision | Stop high-speed oscillating needle within the narrow bullseye | Precision score |
| 9 | **[Merge Rush](src/lib/games/merge-rush.ts)** | Puzzle | 2048-style grid swipe/drag numerical merging blitz | Highest tile value |
| 10| **[Impossible Maze](src/lib/games/impossible-maze.ts)** | Precision | Continuous touch pathing with anti-teleportation raycasting | Mazes completed |

---

## 🚀 What's New in V2

- **Universal Delta-Time Normalization**: Standardized all physics to $dt = \Delta t / 16.6667$, ensuring deterministic 60 FPS gameplay on 60Hz, 90Hz, 120Hz, and 144Hz displays.
- **Resource Disposal (`TimerManager`)**: Centralized lifecycle management prevents stray timeouts, unmount leaks, and CPU throttling.
- **Full 10-Game Global Leaderboards**: Categorized by Reflex, Precision, Speed, and Puzzle with All-Time and Daily filters.
- **Synchronized Daily Challenge**: Deterministic seed rotation, live ticking countdown, and direct gameplay routing.
- **Player Profile & Achievements (`/profile`)**: Customizable gamer tag, 8 unlockable trophies, all-time personal bests, and recent score history.
- **Anti-Cheat & Rate Limiting**: Physical score bounds, minimum duration checks, sub-75ms reflex guard, and sliding-window rate limiting.
- **Multi-Environment Database**: Decoupled Prisma datasource using `DATABASE_URL` (SQLite for local dev, PostgreSQL for cloud).
- **Automated Test Suite**: 28 passing Vitest unit tests and headless browser E2E test-and-capture script.

---

## 🏗️ Architecture Documentation

Detailed documentation is available in [`docs/`](docs/):
- **[System Architecture Overview](docs/architecture/system-overview.md)**
- **[Game Engine Architecture](docs/architecture/game-engine.md)**
- **[Database Architecture & Data Integrity](docs/architecture/database.md)**
- **[Test & Quality Assurance Report](docs/testing/test-report.md)**
- **[Production Deployment Guide](docs/deployment/deployment-guide.md)**
- **[Initial Audit Report](docs/audit/initial-project-audit.md)**
- **[V2 Changelog](docs/changelog-v2.md)**

---

## 🛠️ Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/Prasad1761/MiniGames.git
cd MiniGames
npm install --legacy-peer-deps
```

### 2. Configure Database & Environment
```bash
cp .env.example .env
npx prisma db push
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to play immediately.

---

## 🧪 Testing

### Run Unit Tests (Vitest)
```bash
npm test
```

### Run End-to-End Tests & Capture Screenshots
```bash
npm run test:e2e
```

### Build for Production
```bash
npm run build
```

---

## 📄 License

MIT License. Open source and free to use!
