# ArcadePulse V1 — Comprehensive Initial Project Audit

**Date:** November 1, 2026  
**Auditor:** Autonomous Principal Engineering Team  
**System:** ArcadePulse (MiniGames)  
**Status:** Audit Completed — Implementation Roadmap Activated  

---

## 1. Executive Summary

ArcadePulse was designed as a mobile-first browser mini-game platform featuring 10 original mini-games built with Next.js 14, HTML5 Canvas 2D, Web Audio API, and Prisma ORM. While the vertical slice successfully implemented working canvas loops for all 10 games, an in-depth code-level audit revealed severe architectural bottlenecks, security vulnerabilities, frame-rate dependencies, missing features, and broken viral game flows.

This document details the complete feature inventory, verified bugs, security risks, performance debt, and actionable remediation plan for **ArcadePulse V2**.

---

## 2. Existing Architecture Overview

- **Frontend Core**: Next.js 14 App Router, React 18, TypeScript 5.6, Tailwind CSS 3.4.
- **Rendering Layer**: HTML5 Canvas 2D contexts inside a single `GameShell.tsx` container with inline requestAnimationFrame loops.
- **Audio Engine**: Synthesized Web Audio API oscillators (`SoundEngine` class in `src/lib/audio.ts`).
- **State & Identity**: Anonymous client-generated UUID in `localStorage` (`arcade_pulse_player_id`), synchronized with `Player` in database.
- **Backend / API**: Next.js Route Handlers (`/api/scores`, `/api/challenge`, `/api/daily`).
- **Database**: SQLite via Prisma ORM 5.22 (`prisma/dev.db`).

---

## 3. Complete Feature Inventory & Current Status

| Component / Feature | Intended Functionality | Current State | Audit Verdict |
|---|---|---|---|
| **Homepage** (`/`) | Hero, Featured games, Directory, Daily Challenge banner | Rendered, but cluttered layouts, weak cards, lacks profile preview | Needs V2 Redesign |
| **All Games Directory** (`/games`) | Filterable directory of all 10 games | Functional filter chips, basic cards | Needs V2 Redesign & Search |
| **Game Player** (`/games/[id]`) | Game canvas, score header, pause, retry, share | Fixed 420x620 viewport, awkward mobile scaling, no pause mechanic | High Priority Refactor |
| **Leaderboards** (`/leaderboards`) | All-time & daily rankings for all 10 games | Hardcoded `.slice(0, 3)` selector (7 games completely invisible!) | **CRITICAL DEFECT** |
| **Daily Challenge** (`/daily`) | Global synchronized daily seed & ranking | Links to ordinary game without daily flag; scores not tagged as daily | **CRITICAL DEFECT** |
| **Friend Challenge** (`/challenge/[id]`) | Shareable link to beat creator's score | Expiration never checked; lower-is-better comparison flawed | **HIGH DEFECT** |
| **Player Profile** (`/profile`) | Nickname, personal bests, achievements, stats | **Completely missing page!** Only small name edit modal in Navbar | **MISSING FEATURE** |
| **Score API** (`POST /api/scores`) | Anti-cheat score submission & validation | Only validates 3 games; 7 games have zero boundary checks; no rate limit | **SECURITY VULNERABILITY** |
| **Audio Synthesizer** (`audio.ts`) | Oscillator SFX with pentatonic combo pitch-rise | Works, but no master volume control; potential audio context leaks | Medium Priority Polish |
| **Game Engine Core** | Lifecycle, tick, delta-time, resize, input | Frame-rate dependent physics; `setTimeout` memory leaks on destroy | **ARCHITECTURAL DEFECT** |

---

## 4. Verified Defects & Root Cause Analysis

### [DEFECT-01] Daily Challenge Score Submission Bypass
- **Severity**: Critical (P0)
- **Location**: `src/app/daily/page.tsx:83`, `src/components/GameShell.tsx:96-106`
- **Root Cause**: The Daily Challenge page links to `/games/${game.id}` with no context flags (`mode=daily`, `dailyDate=...`). Furthermore, `GameShell` never passes `isDaily: true` or `dailyDate` to `POST /api/scores`. Consequently, 100% of daily games are logged as regular scores, leaving the daily leaderboard permanently empty.

### [DEFECT-02] Leaderboard Hides 70% of Games
- **Severity**: High (P1)
- **Location**: `src/app/leaderboards/page.tsx:76`
- **Root Cause**: The selector was hardcoded to `GAMES_CATALOG.slice(0, 3).map(...)`. Games 4 through 10 (`color-panic`, `one-more-jump`, `dont-tap-red`, `memory-flash`, `perfect-timing`, `merge-rush`, `impossible-maze`) are impossible to select or inspect on the leaderboard.

### [DEFECT-03] Challenge Expiration Is Dead Code
- **Severity**: High (P1)
- **Location**: `src/app/api/challenge/route.ts:18-25, 46-60`
- **Root Cause**: `expiresAt` is declared in Prisma schema, but never populated in `POST /api/challenge`, and never validated in `GET /api/challenge`. Challenges never expire, and stale challenges persist indefinitely.

### [DEFECT-04] Frame-Rate Dependent Physics Across Multiple Games
- **Severity**: High (P1)
- **Location**: `perfect-stack.ts`, `gravity-flip.ts`, `one-more-jump.ts`, `dont-tap-red.ts`, `perfect-timing.ts`
- **Root Cause**: State updates increment positions by raw constants per frame (`this.x += this.speed`). On 120Hz/144Hz high-refresh displays (iPad Pro, iPhone Pro, gaming monitors), physics runs at 2x-2.4x intended speed, making the games unplayably difficult.

### [DEFECT-05] Memory Leaks & Stale Callbacks on Game Destruction
- **Severity**: High (P1)
- **Location**: All 10 game engines (`setTimeout(() => this.callbacks.onGameOver(...), 700)`)
- **Root Cause**: Timeout IDs are not retained. If the player clicks "Play Again" or navigates back during the 700ms window, the unmanaged timeout triggers `onGameOver` in the subsequent game or on an unmounted React component.

### [DEFECT-06] Impossible Maze Teleportation Exploit
- **Severity**: Medium (P2)
- **Location**: `src/lib/games/impossible-maze.ts:133-146`
- **Root Cause**: `handleInput` directly assigns `this.px = x; this.py = y;`. Touching or clicking directly on the goal portal teleports the orb past all maze barriers instantly.

### [DEFECT-07] Machine-Specific Hardcoded Test Paths
- **Severity**: Medium (P2)
- **Location**: `scripts/test-and-capture.js:6, 13`
- **Root Cause**: Contains hardcoded Windows paths (`C:\Program Files (x86)\Microsoft\Edge\...` and developer-specific brain folder). Fails on CI/CD and non-Windows developer machines.

---

## 5. Security & Score Integrity Vulnerabilities

1. **Client Arbitrary Score Tampering**:
   - Scores are submitted via simple JSON POST payload with no verification of gameplay duration, inputs, or session tokens.
2. **Missing Boundary Checks on 7 Games**:
   - `color-panic`, `one-more-jump`, `dont-tap-red`, `memory-flash`, `perfect-timing`, `merge-rush`, `impossible-maze` have zero upper bounds. A client can submit `99,999,999` and claim Rank #1 globally.
3. **No Rate Limiting / Abuse Protection**:
   - An automated script can spam millions of score records, flooding the database.
4. **No Server-Side Username Sanitization**:
   - Usernames can contain control characters, HTML/script injection attempts, or excessive lengths.
5. **Session Run Tokens**:
   - Need a two-step run lifecycle: Client requests `POST /api/runs/start` to obtain a signed run token containing `(gameId, seed, startTime)`. When game ends, client submits `POST /api/runs/finish` with `(token, score, inputChecksum, durationMs)`. Server validates minimum time elapsed, boundary sanity, and token signature.

---

## 6. Technical Debt & UI/UX Weaknesses

- **Lack of True Pause / Resume**: `GameShell` lacks a functional pause state during gameplay.
- **Rigid Viewport Sizing**: Hardcoded `h-[580px] sm:h-[620px]` causes vertical clipping on short mobile viewports (e.g. landscape or small phones).
- **Missing Player Profile & Achievement System**: The prompt requires personal best tracking, games played count, streaks, and achievements.
- **No Unit & Integration Testing Suite**: Only an ad-hoc Puppeteer script exists. Need Vitest with fast unit tests for PRNG, math, scoring, and API integration.
- **Database Scalability**: Prisma is coupled to local SQLite. A production-ready strategy for PostgreSQL with connection pooling, migrations, and environment decoupling is required.

---

## 7. ArcadePulse V2 Action Plan & Priority Matrix

| Phase | Tasks | Target Severity |
|---|---|---|
| **Stage B: Stabilize** | Fix daily game mode tagging, leaderboard selector, challenge expiration, maze teleport exploit, timeout cleanup | P0 / P1 |
| **Stage C: Architecture** | Modularize into `src/features/`, `src/game-engine/`, implement `RunSession` validation, Vitest test suite | P1 |
| **Stage D: Design System** | Centralized design tokens, accessible components, responsive typography, polished dark gaming surfaces | P1 |
| **Stage E: Frontend Redesign**| Overhaul Homepage, Games Directory, Game Player Shell, Leaderboards, Daily Challenge, Profile Page | P1 |
| **Stage F: Game Improvements** | Refactor all 10 games with delta-time (60 FPS fixed step), boundary checks, responsive canvas coordinate mapper | P0 / P1 |
| **Stage G: Competitive** | Fix lower-is-better scoring in challenges, daily deterministic Mulberry32 seed sync, rate limiting | P1 |
| **Stage H: Progression** | Build `/profile` page, achievement system, streak counter, games played tally | P2 |
| **Stage I: Performance** | Code-split games, touch responsiveness, WCAG 2.1 AA accessibility, PWA polish | P2 |
| **Stage J: Verification** | Full unit tests, integration tests, cross-platform E2E test suite, screenshots, docs | P0 |
