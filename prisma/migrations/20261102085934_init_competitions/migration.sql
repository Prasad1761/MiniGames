-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "anonymousId" TEXT NOT NULL,
    "username" TEXT NOT NULL DEFAULT 'ArcadePlayer',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RunSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gameId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "seed" INTEGER NOT NULL DEFAULT 42,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "RunSession_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Score" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gameId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "durationMs" INTEGER,
    "meta" TEXT,
    "playerId" TEXT NOT NULL,
    "runSessionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDaily" BOOLEAN NOT NULL DEFAULT false,
    "dailyDate" TEXT,
    CONSTRAINT "Score_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Score_runSessionId_fkey" FOREIGN KEY ("runSessionId") REFERENCES "RunSession" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Challenge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gameId" TEXT NOT NULL,
    "targetScore" INTEGER NOT NULL,
    "creatorId" TEXT NOT NULL,
    "seed" INTEGER NOT NULL DEFAULT 42,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    CONSTRAINT "Challenge_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playerId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Achievement_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tournament" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "startAt" DATETIME NOT NULL,
    "endAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Player_anonymousId_key" ON "Player"("anonymousId");

-- CreateIndex
CREATE INDEX "Player_anonymousId_idx" ON "Player"("anonymousId");

-- CreateIndex
CREATE INDEX "RunSession_playerId_gameId_idx" ON "RunSession"("playerId", "gameId");

-- CreateIndex
CREATE INDEX "Score_gameId_score_idx" ON "Score"("gameId", "score" DESC);

-- CreateIndex
CREATE INDEX "Score_gameId_dailyDate_score_idx" ON "Score"("gameId", "dailyDate", "score" DESC);

-- CreateIndex
CREATE INDEX "Score_playerId_gameId_idx" ON "Score"("playerId", "gameId");

-- CreateIndex
CREATE INDEX "Challenge_creatorId_idx" ON "Challenge"("creatorId");

-- CreateIndex
CREATE INDEX "Challenge_expiresAt_idx" ON "Challenge"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Achievement_playerId_achievementId_key" ON "Achievement"("playerId", "achievementId");

-- CreateIndex
CREATE INDEX "Tournament_gameId_startAt_idx" ON "Tournament"("gameId", "startAt");
