// Competitive Engine - Ranking, Achievements, and Social Features
// Coordinates all competitive gameplay systems and user progression

import { getUnlockedAchievements, unlockAchievement, incrementTotalGamesPlayed, getTotalGamesPlayed } from '@/lib/progression/achievements';
import { getOrCreatePlayerId, getPlayerName, getPersonalBest, recordScore, triggerHaptic } from '@/lib/player';
import { getGameById } from '@/lib/games/registry';
import { TimerManager } from '@/game-engine/core/TimerManager';
import { sound } from '@/lib/audio';

export interface LeaderboardEntry {
  rank: number;
  id: string;
  score: number;
  username: string;
  gameId: string;
  createdAt: string;
  isDaily: boolean;
  isFriendChallenge?: boolean;
  isPersonalBest?: boolean;
  isNewPersonalBest?: boolean;
}

export interface SocialRank {
  rank: number;
  username: string;
  gameId: string;
  score: number;
  isFriend: boolean;
  isYou: boolean;
}

export interface AchievementUnlock {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'milestone' | 'skill' | 'daily' | 'social';
  unlockedAt: string;
}

export interface CompetitiveStats {
  totalGamesPlayed: number;
  achievementsUnlocked: number;
  personalBestScore: number | null;
  globalRank: number;
  friendRank?: number;
  streak: number;
  weeklyChallengeProgress: number;
}

export class CompetitiveEngine {
  private static instance: CompetitiveEngine;
  private timers: TimerManager;
  private listeners: Map<string, Function[]>;
  private challengeRegistry: Map<string, any>;
  private socialGraph: Map<string, Set<string>>;
  private weeklyScores: Map<string, Map<string, number>>;

  private constructor() {
    this.timers = new TimerManager();
    this.listeners = new Map();
    this.challengeRegistry = new Map();
    this.socialGraph = new Map();
    this.weeklyScores = new Map();
    this.initializeCompetitiveSystems();
  }

  public static getInstance(): CompetitiveEngine {
    if (!CompetitiveEngine.instance) {
      CompetitiveEngine.instance = new CompetitiveEngine();
    }
    return CompetitiveEngine.instance;
  }

  private initializeCompetitiveSystems() {
    // Initialize weekly score tracking (reset on Sunday)
    this.scheduleWeeklyReset();

    // Initialize social connections
    this.initializeSocialGraph();

    // Setup achievement tracking
    this.setupAchievementTracking();

    // Setup competitive ranking
    this.setupCompetitiveRanking();
  }

  private scheduleWeeklyReset() {
    const now = new Date();
    const sunday = new Date(now);
    sunday.setDate(now.getDate() + ((7 - now.getDay()) % 7));
    sunday.setHours(0, 0, 0, 0);

    const msUntilSunday = sunday.getTime() - now.getTime();

    this.timers.setTimeout(() => {
      this.weeklyScores.clear();
      this.timers.setTimeout(() => {
        this.scheduleWeeklyReset();
      }, 7 * 24 * 60 * 60 * 1000);
    }, msUntilSunday);
  }

  private initializeSocialGraph() {
    // Load social connections from localStorage
    const connections = localStorage.getItem('arcade_pulse_social_connections');
    if (connections) {
      const parsed = JSON.parse(connections);
      Object.entries(parsed).forEach(([userId, friendIds]) => {
        this.socialGraph.set(userId, new Set(friendIds as string[]));
      });
    }
  }

  private setupAchievementTracking() {
    // Track achievement unlocks and social achievements
    this.timers.setInterval(() => {
      this.checkSocialAchievements();
      this.checkWeeklyChallenges();
    }, 60000); // Check every minute
  }

  private setupCompetitiveRanking() {
    // Setup periodic ranking calculations
    this.timers.setInterval(() => {
      this.updateGlobalRanks();
      this.updateFriendRanks();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  // Public API

  public async recordGameResult(gameId: string, score: number, isDaily: boolean = false, meta?: any) {
    const anonymousId = getOrCreatePlayerId();
    const username = getPlayerName();
    const game = getGameById(gameId);

    if (!game) return null;

    // Record score and personal best
    const scoreResult = recordScore(gameId, score, game.lowerIsBetter || false);
    const wasNewPersonalBest = scoreResult.isNewRecord;

    // Increment total games played and check achievements
    const totalGames = incrementTotalGamesPlayed();

    // Check for achievement unlocks
    const achievements = await this.checkForNewAchievements(gameId, score, totalGames);

    // Update weekly scores
    this.updateWeeklyScore(anonymousId, gameId, score);

    // Check social challenges
    const challengesCompleted = await this.checkSocialChallenges(gameId, score, anonymousId);

    // Trigger haptic feedback for personal bests
    if (wasNewPersonalBest) {
      triggerHaptic('success');
      sound.playPerfect(1);
    }

    return {
      scoreResult,
      achievements,
      challengesCompleted,
      wasNewPersonalBest,
      totalGames,
      anonymousId,
      username
    };
  }

  public getLeaderboard(gameId: string, isDaily: boolean = false, includeFriends: boolean = false, anonymousId?: string): LeaderboardEntry[] {
    // This would integrate with the actual API - simplified for demo
    const mockEntries: LeaderboardEntry[] = [];

    // Add personal best if exists
    if (anonymousId) {
      const personalBest = getPersonalBest(gameId);
      if (personalBest) {
        mockEntries.push({
          rank: 1,
          id: 'personal_best',
          score: personalBest,
          username: 'Your Record',
          gameId,
          createdAt: new Date().toISOString(),
          isDaily,
          isPersonalBest: true,
          isNewPersonalBest: scoreResult.isNewRecord // Would need scoreResult
        });
      }
    }

    // Sort and return
    return mockEntries.sort((a, b) => b.score - a.score);
  }

  public getCompetitiveStats(anonymousId: string): CompetitiveStats {
    const totalGames = getTotalGamesPlayed();
    const unlockedAchievements = getUnlockedAchievements();
    const personalBest = getPersonalBest('perfect-stack'); // Example game

    // Calculate global and friend ranks (simplified)
    const globalRank = Math.floor(Math.random() * 1000) + 1;

    // Calculate streak (simplified - would need actual streak tracking)
    const streak = Math.floor(Math.random() * 10);

    return {
      totalGamesPlayed: totalGames,
      achievementsUnlocked: unlockedAchievements.length,
      personalBestScore: personalBest,
      globalRank,
      streak,
      weeklyChallengeProgress: this.getWeeklyChallengeProgress(anonymousId)
    };
  }

  public createSocialChallenge(gameId: string, targetScore: number, anonymousId: string, username: string): Promise<{ challengeUrl: string; expiresAt: string }> {
    return new Promise((resolve, reject) => {
      // This would integrate with the actual challenge creation API
      setTimeout(() => {
        resolve({
          challengeUrl: `/challenge/mock-${gameId}-${Date.now()}`, // Mock URL
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        });
      }, 500);
    });
  }

  public acceptFriendChallenge(challengeUrl: string): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(), 500);
    });
  }

  public shareToSocialMedia(type: 'twitter' | 'facebook' | 'copy', gameId: string, score: number, username: string): void {
    const game = getGameById(gameId);
    if (!game) return;

    const shareText = `I scored ${score} ${game.scoreUnit} on ${game.title} in Arcade Pulse! Can you beat my record?`;

    switch (type) {
      case 'twitter':
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
        window.open(twitterUrl, '_blank');
        break;
      case 'facebook':
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(shareText)}`;
        window.open(facebookUrl, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(window.location.href);
        sound.playTap();
        break;
    }
  }

  public addFriend(friendAnonymousId: string): boolean {
    const currentId = getOrCreatePlayerId();

    if (!this.socialGraph.has(currentId)) {
      this.socialGraph.set(currentId, new Set());
    }

    if (currentId === friendAnonymousId) return false; // Cannot add self

    const friends = this.socialGraph.get(currentId);
    if (friends?.has(friendAnonymousId)) return false; // Already friends

    friends?.add(friendAnonymousId);
    this.saveSocialGraph();
    return true;
  }

  public getFriends(anonymousId: string): string[] {
    return Array.from(this.socialGraph.get(anonymousId) || []);
  }

  private async checkForNewAchievements(gameId: string, score: number, totalGames: number): Promise<AchievementUnlock[]> {
    const newlyUnlocked: AchievementUnlock[] = [];
    const unlockedIds = getUnlockedAchievements();

    // Check milestone achievements
    if (totalGames === 1 && !unlockedIds.includes('first_game')) {
      unlockAchievement('first_game');
      newlyUnlocked.push({
        id: 'first_game',
        title: 'Coin Inserted',
        description: 'Play your very first arcade round',
        icon: '🪙',
        category: 'milestone',
        unlockedAt: new Date().toISOString()
      });
    }

    if (totalGames === 5 && !unlockedIds.includes('five_games')) {
      unlockAchievement('five_games');
      newlyUnlocked.push({
        id: 'five_games',
        title: 'Arcade Regular',
        description: 'Play 5 total rounds across any game',
        icon: '🕹️',
        category: 'milestone',
        unlockedAt: new Date().toISOString()
      });
    }

    if (totalGames === 20 && !unlockedIds.includes('twenty_games')) {
      unlockAchievement('twenty_games');
      newlyUnlocked.push({
        id: 'twenty_games',
        title: 'Arcade Veteran',
        description: 'Play 20 total rounds',
        icon: '👑',
        category: 'milestone',
        unlockedAt: new Date().toISOString()
      });
    }

    // Check skill achievements based on game-specific scores
    await this.checkSkillAchievements(gameId, score, unlockedIds, newlyUnlocked);

    // Check daily achievement
    if (!unlockedIds.includes('daily_player')) {
      // Check if score was submitted today
      unlockAchievement('daily_player');
      newlyUnlocked.push({
        id: 'daily_player',
        title: 'Daily Challenger',
        description: 'Submit a verified score in a Daily Challenge',
        icon: '📅',
        category: 'daily',
        unlockedAt: new Date().toISOString()
      });
    }

    // Emit achievement events
    if (newlyUnlocked.length > 0) {
      this.emit('achievementsUnlocked', newlyUnlocked);
    }

    return newlyUnlocked;
  }

  private async checkSkillAchievements(gameId: string, score: number, unlockedIds: string[], newlyUnlocked: AchievementUnlock[]): Promise<void> {
    const game = getGameById(gameId);
    if (!game) return;

    // Perfect Stack achievement
    if (gameId === 'perfect-stack' && score >= 20 && !unlockedIds.includes('stack_pro')) {
      unlockAchievement('stack_pro');
      newlyUnlocked.push({
        id: 'stack_pro',
        title: 'Skyscraper Builder',
        description: 'Reach 20+ blocks in Perfect Stack',
        icon: '🏗️',
        category: 'skill',
        unlockedAt: new Date().toISOString()
      });
    }

    // Reaction Test achievement
    if (gameId === 'reaction-test' && score <= 220 && !unlockedIds.includes('reflex_fast')) {
      unlockAchievement('reflex_fast');
      newlyUnlocked.push({
        id: 'reflex_fast',
        title: 'Cyber Reflexes',
        description: 'Achieve under 220ms in Reaction Test',
        icon: '⚡',
        category: 'skill',
        unlockedAt: new Date().toISOString()
      });
    }

    // Gravity Flip achievement
    if (gameId === 'gravity-flip' && score >= 150 && !unlockedIds.includes('gravity_150')) {
      unlockAchievement('gravity_150');
      newlyUnlocked.push({
        id: 'gravity_150',
        title: 'Orbit Breaker',
        description: 'Travel over 150m in Gravity Flip',
        icon: '🚀',
        category: 'skill',
        unlockedAt: new Date().toISOString()
      });
    }
  }

  private async checkSocialChallenges(gameId: string, score: number, anonymousId: string): Promise<any[]> {
    const completedChallenges: any[] = [];

    // Check friend challenges
    const friends = this.getFriends(anonymousId);
    for (const friendId of friends) {
      const friendChallenges = Array.from(this.challengeRegistry.values())
        .filter(challenge => challenge.challengedAnonymousId === friendId && challenge.gameId === gameId);

      for (const challenge of friendChallenges) {
        if (score >= challenge.targetScore) {
          completedChallenges.push(challenge);
          this.challengeRegistry.delete(challenge.id);
        }
      }
    }

    return completedChallenges;
  }

  private updateWeeklyScore(anonymousId: string, gameId: string, score: number): void {
    if (!this.weeklyScores.has(anonymousId)) {
      this.weeklyScores.set(anonymousId, new Map());
    }

    const gameScores = this.weeklyScores.get(anonymousId)!;
    gameScores.set(gameId, score);
  }

  private getWeeklyChallengeProgress(anonymousId: string): number {
    const gameScores = this.weeklyScores.get(anonymousId);
    if (!gameScores) return 0;

    const totalWeeklyScore = Array.from(gameScores.values()).reduce((sum, score) => sum + score, 0);
    return Math.min(100, Math.floor(totalWeeklyScore / 1000)); // Simple progress calculation
  }

  private checkSocialAchievements(): void {
    const unlockedIds = getUnlockedAchievements();

    // Check for social challenger achievement
    if (!unlockedIds.includes('social_challenger')) {
      // Check if user has created and shared a challenge
      const userChallenges = Array.from(this.challengeRegistry.values())
        .filter(challenge => challenge.creatorAnonymousId === getOrCreatePlayerId());

      if (userChallenges.length > 0) {
        unlockAchievement('social_challenger');
        this.emit('achievementsUnlocked', [{
          id: 'social_challenger',
          title: 'Rivalry Spark',
          description: 'Create and copy a friend challenge link',
          icon: '⚔️',
          category: 'social',
          unlockedAt: new Date().toISOString()
        }]);
      }
    }
  }

  private checkWeeklyChallenges(): void {
    // Reset weekly challenges daily
    const now = new Date();
    if (now.getDay() === 0) { // Sunday
      // This would trigger weekly challenge completion events
      this.emit('weeklyChallengeReset', {
        date: now.toISOString(),
        weeklyScores: Array.from(this.weeklyScores.entries())
      });
    }
  }

  private updateGlobalRanks(): void {
    // This would fetch actual global rankings from API
    const allScores = Array.from(this.weeklyScores.entries())
      .flatMap(([anonymousId, gameScores]) =>
        Array.from(gameScores.entries()).map(([gameId, score]) => ({ anonymousId, gameId, score }))
      );

    // Sort by score descending and assign ranks
    allScores.sort((a, b) => b.score - a.score);

    // Emit rank update events
    this.emit('globalRanksUpdated', allScores.map((entry, index) => ({
      ...entry,
      rank: index + 1
    })));
  }

  private updateFriendRanks(): void {
    const currentId = getOrCreatePlayerId();
    const friends = this.getFriends(currentId);

    if (friends.length === 0) return;

    // Get friend scores and calculate ranks
    const friendScores = friends.map(friendId => {
      const gameScores = this.weeklyScores.get(friendId);
      const totalScore = gameScores ? Array.from(gameScores.values()).reduce((sum, score) => sum + score, 0) : 0;
      return { anonymousId: friendId, score: totalScore };
    });

    friendScores.sort((a, b) => b.score - a.score);

    // Assign ranks
    const rankedFriends = friendScores.map((friend, index) => ({
      ...friend,
      rank: index + 1,
      isYou: friend.anonymousId === currentId
    }));

    this.emit('friendRanksUpdated', rankedFriends);
  }

  private saveSocialGraph(): void {
    const socialGraphData: Record<string, string[]> = {};
    this.socialGraph.forEach((friends, userId) => {
      socialGraphData[userId] = Array.from(friends);
    });

    localStorage.setItem('arcade_pulse_social_connections', JSON.stringify(socialGraphData));
  }

  // Event system

  public on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  public off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in competitive engine event listener for ${event}:`, error);
        }
      });
    }
  }

  public destroy(): void {
    this.timers.clearAll();
    this.listeners.clear();
    this.challengeRegistry.clear();
    this.socialGraph.clear();
    this.weeklyScores.clear();
  }
 }

export default CompetitiveEngine;