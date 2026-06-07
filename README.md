# World Cup 2026 Prediction App

A lightweight web application where participants predict FIFA World Cup 2026 match results, earn points, and compete on a leaderboard.

**Timeline:** Tournament runs June 11 – July 19, 2026  
**Status:** MVP Phase 1 in development

## Setup

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 12+
- Git

### Backend Setup

```bash
cd backend
npm install

# Create .env file (copy from .env.example)
cp ../.env.example .env

# Update .env with your database URL and API keys
# DATABASE_URL=postgresql://user:password@localhost:5432/world_cup

# Run migrations
npm run migrate

# Seed fixtures (optional)
npm run seed

# Start dev server
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:5000" > .env.local

# Start dev server
npm run dev
```

## Project Structure

```
backend/
  src/
    index.ts              # Express app entry point
    db.ts                 # Database connection pool
    types/index.ts        # TypeScript interfaces
    middleware/auth.ts    # Authentication middleware
    routes/
      auth.ts             # Registration, login, password reset
      matches.ts          # Match listing
      predictions.ts      # Prediction CRUD
      leaderboard.ts      # Leaderboard and stats
      admin.ts            # Admin functions
    services/
      scoringEngine.ts     # Scoring logic (outcome + exact score)
    utils/
      hash.ts             # Password hashing
      lockEnforcement.ts   # Server-side match locking
  migrations/
    001_init_schema.sql   # Database schema
  scripts/
    migrate.js            # Run migrations
    seedFixtures.ts       # Seed 2026 fixtures

frontend/
  src/
    pages/
      LoginPage.tsx       # Login form
      RegisterPage.tsx    # Registration (invite-gated)
      MatchesPage.tsx     # Matches and inline predictions
      LeaderboardPage.tsx # Leaderboard view
      StatsPage.tsx       # Personal stats and history
      AdminPage.tsx       # Admin invite and import
    context/AuthContext.tsx
    api/client.ts
```

## Database Schema

- **users**: Registered participants
- **invites**: Registration invitations (admin-gated)
- **matches**: 104 World Cup fixtures with results
- **predictions**: User predictions (one per user per match)
- **leaderboard_cache**: Materialized view of scores (derived)
- **session**: Express session storage

## API Endpoints

### Auth
- `POST /api/auth/register` - Register with invite token
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Matches
- `GET /api/matches` - List matches (grouped by day)
- `GET /api/matches/:id` - Get match details

### Predictions
- `POST /api/predictions` - Create prediction
- `PUT /api/predictions/:id` - Update prediction
- `GET /api/predictions/match/:match_id` - Get all predictions for a match (admin)

### Leaderboard
- `GET /api/leaderboard` - Get ranked leaderboard
- `GET /api/leaderboard/me/stats` - Get current user's stats
- `GET /api/leaderboard/me/predictions` - Get current user's prediction history

### Admin
- `POST /api/admin/invites` - Create invite
- `GET /api/admin/invites` - List invites
- `POST /api/admin/import-results` - Import results from API-Football
- `GET /api/admin/matches/:match_id/predictions` - View all predictions for a match

## Scoring

- **Correct outcome** (correct winner or draw): **2 points**
- **Correct exact score** (both teams' goals match): **3 points total** (2 + 1 bonus)
- **Incorrect**: **0 points**

For knockout matches that go to extra time:
- Score is based on the final score after 90 or 120 minutes
- If final score is a draw, user predicts the penalties winner separately

## Authentication

- Users register only via admin invite links (invite-gated)
- Login with email + password
- Sessions stored in PostgreSQL (HTTP-only cookies)
- Passwords hashed with bcrypt

## Match Locking

- Matches **lock at kickoff time** (server-side enforcement)
- Users cannot enter or edit predictions after kickoff
- Server time is authoritative, not client time

## Result Import

- External cron job (GitHub Actions) calls `/api/admin/import-results` every 5 minutes
- Fetches results from API-Football
- Updates match scores and triggers automatic scoring
- Idempotent: re-importing same result doesn't double-count points

## Development

```bash
# Watch TypeScript compilation
npm run build

# Run tests
npm run test
npm run test:watch
```

## Deployment

Designed for **Render free tier**:
- Web service + free PostgreSQL + static frontend
- Cold-start acceptable (~3-5 seconds)
- Cron keep-alive prevents hibernation during tournament

See `render.yaml` for deployment configuration.

## Open Questions Resolved

1. ✅ Scoring: Additive (exact score = 3 pts)
2. ✅ Knockout results: Use 90-min or 120-min score; predict winner for draws
3. ✅ Tie-break: Most exact-score hits, then earliest registration
4. ✅ Reminders: Only non-predictors (Phase 2)
5. ✅ Admin on leaderboard: Yes, included
6. ✅ Match scope: All 104 matches

## Timeline

**Phase 1 (MVP)** — Due June 10:
- Registration/login via invite ✅
- Fixtures seeded ✅
- Prediction entry with kickoff lock ✅
- Result import ✅
- Scoring ✅
- Leaderboard and stats ✅

**Phase 2** — Email notifications (post-launch if time)

**Phase 3** — Admin polish

**Phase 4** — Nice-to-have features
