# ArcadePulse V2 — Database Architecture & Data Integrity

## 1. Schema Decoupling & Multi-Environment Strategy

In V1, the Prisma configuration was hardcoded to SQLite with a local file URL:
```prisma
// V1 Anti-pattern
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}
```
In V2, the database datasource is decoupled to read from the environment:
```prisma
datasource db {
  provider = "sqlite" // Or "postgresql" for cloud deployments (Neon, Supabase, Railway)
  url      = env("DATABASE_URL")
}
```

---

## 2. Relational Schema Definition

The Prisma schema defines four relational models designed for high-concurrency arcade leaderboards and anti-cheat validation:

```prisma
model Player {
  id           String        @id @default(cuid())
  anonymousId  String        @unique
  username     String        @default("ArcadePlayer")
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  scores       Score[]
  challenges   Challenge[]
  runSessions  RunSession[]

  @@index([anonymousId])
}

model Score {
  id         String    @id @default(cuid())
  playerId   String
  player     Player    @relation(fields: [playerId], references: [id], onDelete: Cascade)
  gameId     String
  score      Int
  durationMs Int?
  isDaily    Boolean   @default(false)
  dailyDate  String?
  createdAt  DateTime  @default(now())

  @@index([gameId, score])
  @@index([gameId, isDaily, dailyDate])
  @@index([playerId])
}

model Challenge {
  id          String    @id @default(cuid())
  creatorId   String
  creator     Player    @relation(fields: [creatorId], references: [id], onDelete: Cascade)
  gameId      String
  targetScore Int
  seed        Int
  expiresAt   DateTime?
  createdAt   DateTime  @default(now())

  @@index([creatorId])
  @@index([gameId])
}

model RunSession {
  id          String    @id @default(cuid())
  playerId    String
  player      Player    @relation(fields: [playerId], references: [id], onDelete: Cascade)
  gameId      String
  token       String    @unique
  seed        Int
  isDaily     Boolean   @default(false)
  dailyDate   String?
  startTime   DateTime  @default(now())
  completed   Boolean   @default(false)
  submittedAt DateTime?

  @@index([token])
  @@index([playerId])
}
```

---

## 3. High-Concurrency Leaderboard Indexing

Leaderboard lookups execute queries filtered by `gameId` and sorted by `score`:
- **Composite Index**: `@@index([gameId, score])` satisfies top 10/20 leaderboards with zero sequential table scans.
- **Daily Challenge Index**: `@@index([gameId, isDaily, dailyDate])` isolates daily rankings instantly for any given UTC date string (`YYYY-MM-DD`).
- **Cascade Deletion**: When an anonymous player profile is pruned, associated scores, run sessions, and challenges are cleared cleanly.

---

## 4. Run Token Sessions (`RunSession`)

To eliminate spoofed POST requests directly targeting `/api/scores`, the game client initiates a run before gameplay begins:
1. Client calls `POST /api/runs/start` with `{ anonymousId, gameId, isDaily, dailyDate, seed }`.
2. Backend creates a pending `RunSession` with a cryptographically secure token and records `startTime`.
3. When the round concludes, the client submits the score along with the `runToken`.
4. The server validates that:
   - The token exists and belongs to the specified player and game.
   - The token has not already been completed (`completed === false`).
   - The elapsed duration matches the game's physical possibility constraints.
5. The session is marked `completed: true`, preventing replay attacks.
