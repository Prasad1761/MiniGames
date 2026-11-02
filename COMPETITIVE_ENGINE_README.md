# Competitive Engine Integration Guide

## Overview

The Competitive Engine provides comprehensive competitive gaming features including:

- **Achievements System**: 8 unlockable trophies with milestone, skill, daily, and social categories
- **Global Leaderboards**: Real-time high score rankings across all 10 mini-games
- **Social Features**: Friend challenges, viral sharing, and social leaderboards
- **Personal Progress**: Streak tracking, weekly challenges, and personal best management
- **Social Sharing**: Built-in sharing capabilities for social media and viral marketing

## Core Components

### 1. CompetitiveEngine Class

**File**: `src/lib/competitive/CompetitiveEngine.ts`

The main competitive engine class that coordinates all competitive gameplay systems:

- **Singleton Pattern**: Ensures single instance across the application
- **Achievement Tracking**: Monitors and unlocks achievements based on gameplay
- **Global Rankings**: Maintains and updates global leaderboards
- **Social Integration**: Manages friend connections and challenges
- **Weekly Tracking**: Supports weekly challenge systems with automatic resets

### 2. Achievements System

The achievements system includes 8 unique achievements:

#### Milestone Achievements
- **Coin Inserted**: First game played (🏆)
- **Arcade Regular**: 5 total rounds played (🕹️)
- **Arcade Veteran**: 20 total rounds played (👑)

#### Skill Achievements
- **Skyscraper Builder**: Reach 20+ blocks in Perfect Stack (🏗️)
- **Cyber Reflexes**: Achieve under 220ms in Reaction Test (⚡)
- **Orbit Breaker**: Travel over 150m in Gravity Flip (🚀)

#### Special Achievements
- **Daily Challenger**: Submit a verified score in Daily Challenge (📅)
- **Rivalry Spark**: Create and copy a friend challenge link (⚔️)

### 3. Social Features

#### Friend System
- Add/remove friends by anonymous ID
- View friend activity and scores
- Challenge friends to beat personal bests

#### Challenge System
- Create friend challenges with target scores
- Generate shareable challenge URLs
- Track challenge completion

#### Social Sharing
- Share scores to Twitter and Facebook
- Copy challenge URLs to clipboard
- Download high-res achievement cards

## Integration Points

### API Endpoints Updated

The following API endpoints have been enhanced to work with the competitive engine:

1. **`POST /api/scores`** - Now integrates with achievement checking and social challenges
2. **`POST /api/challenge`** - Enhanced with competitive engine integration
3. **`GET /api/scores`** - Includes friend challenge flags
4. **`GET /api/profile`** - Returns enhanced competitive statistics

### UI Components Enhanced

#### Profile Dashboard (`src/components/ProfileDashboard.tsx`)
- Displays achievement progress
- Shows personal bests and recent activity
- Includes viral sharing buttons

#### Score Card Modal (`src/components/ScoreCardModal.tsx`)
- Friend challenge creation interface
- Social sharing options
- Viral achievement card download

#### Leaderboards (`src/app/leaderboards/page.tsx`)
- Game-specific leaderboards with categories
- Friend challenge indicators
- Daily vs All-Time filtering

### Game Integration

Each game now includes competitive engine integration:

- **Perfect Stack**: Tracks blocks stacked, personal bests
- **Reaction Test**: Millisecond reflex tracking
- **Gravity Flip**: Distance traveled metrics
- **Color Panic**: Correct color matches counting
- **One More Jump**: Platforms cleared
- **Don't Tap Red**: Safe tiles tapped
- **Memory Flash**: Sequences completed
- **Perfect Timing**: Precision accuracy scores
- **Merge Rush**: Highest tile value achieved
- **Impossible Maze**: Mazes completed

## Key Features

### 1. Delta-Time Normalization

All games use delta-time normalized physics:
```typescript
const dt = Math.min(deltaMs / (1000 / 60), 2.5);
```

Ensures consistent 60 FPS gameplay across all devices.

### 2. Anti-Cheat System

- Physical score bounds validation
- Minimum duration checks
- Sub-75ms reflex guard
- Sliding-window rate limiting

### 3. Social Proof & Virality

Built-in mechanisms to encourage social sharing:

- Automatic challenge generation
- High-res achievement card downloads
- Social media integration
- Friend-based competition

### 4. Persistence

Robust local storage and database integration:

- LocalStorage for player profiles
- SQLite/PostgreSQL for global leaderboards
- IndexedDB for achievement progress
- Session tokens for anti-cheat

## Performance Considerations

### Memory Management

- TimerManager for lifecycle control
- Prevents stray timeouts and memory leaks
- Efficient rendering with requestAnimationFrame

### Rate Limiting

- 30 submissions per minute per client (scores)
- 15 challenge creations per minute
- 45 run session starts per minute
- Sliding window implementation

### Data Optimization

- Efficient database queries
- Indexed for high-score lookups
- Compressed API responses
- Lazy loading of achievement data

## Development Guide

### Adding New Achievements

1. Define achievement in `src/lib/progression/achievements.ts`
2. Add to CompetitiveEngine achievement checking logic
3. Update UI components to display new achievement
4. Add analytics tracking

### Adding New Games

1. Implement game logic following existing patterns
2. Register game in `src/lib/games/registry.ts`
3. Add game-specific achievements
4. Update leaderboards and competitive integration

### Social Features Enhancement

1. Implement OAuth for social login (future enhancement)
2. Add social graph algorithms for friend recommendations
3. Implement leaderboards per social group
4. Add cross-platform social sharing

## Testing

### Unit Tests

- Vitest suite with 28+ passing tests
- Mock competitive engine interactions
- Test achievement unlock logic
- Verify social challenge mechanics

### Integration Tests

- End-to-end competitive gameplay
- Social sharing functionality
- Database persistence
- Rate limiting enforcement

## Future Enhancements

### Planned Features

1. **Leaderboard API**: RESTful API for external integrations
2. **Achievement Badges**: Badge system with rarity levels
3. **Seasonal Competitions**: Time-based competitive events
4. **Social Analytics**: Deep insights into player behavior
5. **Cross-Platform Sync**: Social login and progress sync
6. **Mobile Optimization**: Enhanced touch controls and performance
7. **Cloud Leaderboards**: Global leaderboards with cloud sync

### Technical Roadmap

- [ ] Implement GraphQL for competitive data
- [ ] Add WebSocket for real-time leaderboard updates
- [ ] Implement competitive matchmaking
- [ ] Add AI-powered practice opponents
- [ ] Implement achievement-based rewards
- [ ] Add competitive tournaments
- [ ] Implement competitive analytics dashboard

## Conclusion

The Competitive Engine provides a comprehensive foundation for competitive gaming in ArcadePulse V2. It combines high-performance game integration with rich social features, creating an engaging experience that encourages player retention and social sharing.

Key differentiators:
- **Zero-signup instant play**
- **60 FPS delta-time normalization**
- **Zero-asset Web Audio synthesis**
- **Cryptographic run token verification**
- **Real-time friend challenges**
- **Built-in viral marketing**

The engine is designed for scalability, performance, and social engagement, setting the standard for modern competitive gaming platforms.