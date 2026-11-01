# ArcadePulse V2 — Complete Changelog

## [2.0.0] — Comprehensive Overhaul & Production Release

### 1. Game Engines & Physics
- **Universal Delta-Time Normalization**: Standardized all 10 mini-games to a 60 FPS delta-time base ($dt = \Delta t / 16.6667$), resolving double-speed issues on 90Hz, 120Hz, and 144Hz displays.
- **Resource Disposal (`TimerManager`)**: Replaced all unmanaged `setTimeout` and `setInterval` calls across all 10 game engines with centralized `TimerManager`, guaranteeing 100% cleanup upon unmount and zero memory leaks.
- **Impossible Maze Anti-Teleportation Guard**: Added path tracing, sub-step raycasting, and 35px start-zone proximity verification, closing the drag-teleport exploit.
- **10 Fully Playable Mini-Games**: Restored, normalized, and unlocked all 10 mini-games (Perfect Stack, Reaction Test, Gravity Flip, Color Panic, One More Jump, Don't Tap Red, Memory Flash, Perfect Timing, Merge Rush, Impossible Maze).

### 2. Backend & Security
- **Anti-Cheat Validation (`anti-cheat.ts`)**: Enforced strict mathematical and physical upper/lower bounds on scores across all 10 games, including sub-75ms reaction filter and duration-to-score ratio checks.
- **Run Session Tokens (`/api/runs/start`)**: Implemented cryptographic run sessions to prevent replay attacks and direct API spoofing.
- **Sliding-Window Rate Limiting**: Guarded `/api/scores` and `/api/challenge` against automated abuse.
- **Challenge Expiration Enforcement**: Enforced 7-day expiration on friend challenges, returning HTTP 410 Gone for expired duels.
- **Database Decoupling**: Updated Prisma datasource to use `env("DATABASE_URL")` with composite indexes for sub-millisecond leaderboard queries.

### 3. Frontend & UI/UX
- **Full 10-Game Leaderboard**: Removed legacy `slice(0, 3)` limit, enabling leaderboards for all 10 games with category filters (Reflex, Precision, Speed, Puzzle) and All-Time vs Daily tabs.
- **Live Daily Challenge Synchronizer**: Connected `/daily` with deterministic daily rotation, active seed display, live ticking countdown, and direct gameplay routing with `mode=daily`.
- **Brand-New Player Profile (`/profile`)**: Added dedicated profile page featuring editable gamer tag, overall completion rate, personal bests for all 10 games, and 8 unlockable trophies.
- **Mobile Bottom Navigation**: Integrated sticky, touch-optimized bottom bar for instant access to Home, Games, Daily, Leaderboards, and Profile on mobile devices.
- **Audio & Haptic Feedback**: Integrated native Web Audio API synthesized sound effects and haptic vibration feedback with instant mute toggles.

### 4. Testing & Reliability
- **Automated Vitest Suite**: 28 passing unit tests covering anti-cheat, PRNG, timer management, game registry, and progression.
- **Cross-Platform Headless E2E**: Automated Puppeteer tests capturing mobile gameplay, menus, and verified high scores across all screens.
