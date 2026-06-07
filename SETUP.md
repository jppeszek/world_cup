# Quick Start Guide

Get the World Cup prediction app running in 5 minutes.

## Prerequisites

- Node.js 18+ ([download](https://nodejs.org/))
- PostgreSQL 12+ ([download](https://www.postgresql.org/download/))
- Git

## Step 1: Clone & Install

```bash
git clone <your-repo-url>
cd world-cup

# Backend
cd backend && npm install && cd ..

# Frontend
cd frontend && npm install && cd ..
```

## Step 2: Set Up Database

```bash
# Create PostgreSQL database (use your preferred client or psql)
createdb world_cup

# Run migrations
cd backend
npm run migrate
npm run seed  # Download 104 World Cup fixtures
cd ..
```

## Step 3: Configure Environment

### Backend (.env)

```bash
cd backend && cp ../.env.example .env && cd ..
```

Edit `backend/.env`:
```
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/world_cup
SESSION_SECRET=your-secret-key
IMPORT_SECRET=your-import-secret
FRONTEND_URL=http://localhost:5173
API_FOOTBALL_KEY=get-from-rapidapi.com  # (optional for local dev)
```

### Frontend (.env.local)

```bash
cd frontend && cp .env.local.example .env.local && cd ..
```

File should contain:
```
VITE_API_URL=http://localhost:5000
```

## Step 4: Start the App

### Terminal 1 - Backend

```bash
cd backend
npm run dev
# Server running on http://localhost:5000
```

### Terminal 2 - Frontend

```bash
cd frontend
npm run dev
# App running on http://localhost:5173
```

## Step 5: Create Your First User

1. **Open app:** http://localhost:5173
2. **Create invite via database:**
   ```bash
   psql world_cup
   INSERT INTO invites (email, token, status) 
   VALUES ('you@example.com', 'test-token-123', 'sent');
   ```
3. **Register:** http://localhost:5173/register?token=test-token-123
4. **Login:** Use your credentials
5. **Make a prediction:** Enter scores on the Matches page

## Step 6: Make Admin (Optional)

To access the admin dashboard:

```bash
psql world_cup
UPDATE users SET is_admin = true WHERE email = 'you@example.com';
```

Then navigate to http://localhost:5173/admin

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Connection refused" to database | Start PostgreSQL, check DATABASE_URL in .env |
| 404 on API endpoints | Make sure backend is running on port 5000 |
| Blank matches list | Run `npm run seed` in backend directory |
| Predictions not saving | Check that match kickoff is in the future |

## Next Steps

- See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for production deployment to Render
- Check [README.md](README.md) for architecture and API docs
- See [world-cup-challenge-spec.md](world-cup-challenge-spec.md) for full requirements

## Commands Reference

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production

# Database
npm run migrate      # Run migrations
npm run seed         # Seed 2026 fixtures

# Testing
npm run test         # Run unit tests
npm run type-check   # TypeScript type check
```

---

Ready to predict? ⚽ Let's go!
