# ArcadePulse V2 — Production Deployment Guide

## 1. Prerequisites & Environment Configuration

ArcadePulse V2 is production-ready for deployment on Vercel, Railway, Render, Fly.io, AWS, or any Node.js 18+ container environment.

### Environment Variables Checklist

Create a `.env` file in the project root:

```env
# Database connection string
# For local SQLite:
DATABASE_URL="file:./dev.db"

# For production PostgreSQL (Supabase, Neon, AWS RDS, Railway):
# DATABASE_URL="postgresql://user:password@host:5432/arcadepulse?pgbouncer=true&connection_limit=10"

# Application Base URL (used for absolute challenge share links)
NEXT_PUBLIC_APP_URL="https://arcadepulse.vercel.app"

# Cryptographic secret for signing run tokens and anti-cheat validation
RUN_SESSION_SECRET="generate-a-strong-32-byte-hex-string"
```

---

## 2. Deploying to Vercel (Recommended)

1. **Import Repository**: Link your GitHub repository (`https://github.com/Prasad1761/MiniGames`).
2. **Framework Preset**: Select **Next.js**.
3. **Environment Variables**: Add `DATABASE_URL` (pointing to a managed Postgres instance like Neon or Supabase) and `NEXT_PUBLIC_APP_URL`.
4. **Build Command**: `npx prisma generate && next build`
5. **Output Directory**: `.next` (default)

---

## 3. Deploying to Railway / Docker

### Dockerfile
```dockerfile
FROM node:20-alpine AS base
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --legacy-peer-deps

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

---

## 4. Database Migrations

When pointing to a new PostgreSQL or SQLite database:
```bash
# Push schema changes directly (for prototypes / fast iteration)
npx prisma db push

# Or create a formal migration for production
npx prisma migrate dev --name init_v2
```

---

## 5. PWA & Mobile Installation

ArcadePulse includes a Web App Manifest (`manifest.json`) and service worker configuration:
- Supports **Add to Home Screen** on iOS Safari and Android Chrome.
- Fullscreen display mode (`"display": "standalone"`) disables browser URL chrome for an authentic native arcade app feel.
- Prevent pull-to-refresh and pinch-to-zoom gestures across game canvas containers using touch action CSS rules: `touch-action: none`.
