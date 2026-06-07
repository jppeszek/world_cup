# Deployment Guide - World Cup 2026 Prediction App

This guide covers local development setup and production deployment to Render.

## Prerequisites

- **Node.js 18+** and npm
- **PostgreSQL 12+** (local development)
- **Git** and GitHub account
- **API Keys:**
  - API-Football (free tier): https://rapidapi.com/api-sports/api/api-football
  - (Optional) Resend email service: https://resend.com/

---

## Part 1: Local Development

### 1.1 Clone and Initial Setup

```bash
# Clone the repo
git clone <your-repo-url>
cd world-cup

# Create .env file for backend
cd backend
cp ../.env.example .env
cd ..

# Create .env.local file for frontend
cd frontend
cp .env.local.example .env.local
cd ..
```

### 1.2 Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Update .env with local database
# DATABASE_URL=postgresql://postgres:password@localhost:5432/world_cup
# SESSION_SECRET=dev-secret-key
# IMPORT_SECRET=dev-import-secret
# API_FOOTBALL_KEY=your-rapidapi-key

# Run migrations to create schema
npm run migrate

# Seed fixtures (downloads 2026 schedule from openfootball)
npm run seed

# Start dev server
npm run dev
```

The backend will be available at `http://localhost:5000`

### 1.3 Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Update .env.local (if needed)
# VITE_API_URL=http://localhost:5000

# Start dev server
npm run dev
```

The frontend will be available at `http://localhost:5173`

### 1.4 Test the Application

1. **Open browser:** `http://localhost:5173`
2. **Check backend:** `http://localhost:5000/api/health` (should return `{"status":"ok"}`)
3. **Create test invite:**
   - SSH into database or use psql:
   ```sql
   INSERT INTO invites (email, token, status) 
   VALUES ('test@example.com', 'test-token-123', 'sent');
   ```
4. **Register:**
   - Go to `http://localhost:5173/register?token=test-token-123`
   - Fill in form: email, nickname, password
5. **Login:** Use credentials from registration
6. **View matches:** Should load from seeded database
7. **Make predictions:** Enter scores and save
8. **Test admin functions:**
   - Login as admin (mark user with `is_admin=true` in database)
   - Navigate to `/admin` page
   - Create invites, trigger result import

---

## Part 2: Production Deployment to Render

### 2.1 Prerequisites on Render

1. **Create Render account:** https://dashboard.render.com/
2. **Connect GitHub repo:**
   - Go to Render Dashboard
   - Click "New"
   - Select "Web Service"
   - Choose your GitHub repo
3. **Create PostgreSQL database:**
   - Go to Render Dashboard
   - Click "New" → "PostgreSQL"
   - Name: `world-cup-db`
   - Plan: Free tier
   - Save the internal connection string

### 2.2 Set Environment Variables

In Render Dashboard → Your Service → Environment:

```
NODE_ENV=production
PORT=10000
DATABASE_URL=<copy from PostgreSQL service details>
SESSION_SECRET=<generate random 32+ char string>
IMPORT_SECRET=<generate random 32+ char string>
FRONTEND_URL=https://<your-frontend-url>.onrender.com
API_FOOTBALL_KEY=<your-rapidapi-key>
RESEND_API_KEY=<optional, for Phase 2 emails>
```

### 2.3 Run Migrations on Render

After deploying, migrations are handled automatically via npm scripts.

If needed to manually run:

```bash
# Get psql connection from Render dashboard
psql <DATABASE_URL> -f backend/migrations/001_init_schema.sql

# Or seed fixtures endpoint
curl -X POST https://<your-backend>.onrender.com/api/admin/import-results \
  -H "x-import-secret: <your-import-secret>"
```

### 2.4 Create Admin User

```bash
# SSH or use Render's Database CLI
psql <DATABASE_URL> << 'EOF'
INSERT INTO users (nickname, email, password_hash, is_admin, notify_reminders)
VALUES (
  'admin',
  'your-email@example.com',
  '$2a$10$...', -- bcrypt hash of your password (use `bcryptjs` to generate)
  true,
  true
);
EOF
```

Or use the register endpoint with an invite, then manually update:

```sql
UPDATE users SET is_admin = true WHERE email = 'your-email@example.com';
```

### 2.5 Set Up GitHub Actions Secrets

1. Go to GitHub Repo → Settings → Secrets and variables → Actions
2. Create secrets:
   - `BACKEND_URL` = `https://<your-backend>.onrender.com`
   - `IMPORT_SECRET` = same as your Render env var

The `.github/workflows/import-results.yml` will automatically:
- Run every 5 minutes during the tournament (June 11 - July 19)
- Trigger result import endpoint
- Keep Render service warm

### 2.6 Test Production Deployment

1. **Login:** `https://<your-frontend>.onrender.com/login`
2. **Register:** Create invite in admin, then register
3. **Make predictions:** Try entering scores
4. **Check leaderboard:** Should be empty initially
5. **Test admin import:** Click "Import Results" button (will fail if no API-Football data, but endpoint should respond)

---

## Part 3: Database Backup and Maintenance

### 3.1 Backup Production Database

```bash
# From local machine
pg_dump <PRODUCTION_DATABASE_URL> > backup.sql

# Restore locally
psql postgresql://user:password@localhost/world_cup < backup.sql
```

### 3.2 Monitor Logs

```bash
# Render backend logs
render logs <service-id>

# Or in dashboard: Your Service → Logs
```

### 3.3 Manual Result Import

If cron job fails, manually trigger:

```bash
curl -X POST https://<your-backend>.onrender.com/api/admin/import-results \
  -H "x-import-secret: <your-import-secret>" \
  -H "Content-Type: application/json"
```

---

## Part 4: Post-Launch Checklist

Before opening to participants:

- [ ] Backend and frontend deployed and accessible
- [ ] Database migrated and seeded with 104 fixtures
- [ ] Admin user created with verified email
- [ ] Test user registration via invite link
- [ ] Test prediction entry and lock enforcement
- [ ] Test leaderboard display
- [ ] GitHub Actions secrets configured (BACKEND_URL, IMPORT_SECRET)
- [ ] Result import endpoint tested (manual trigger)
- [ ] HTTPS enforced on all endpoints
- [ ] Admin can create invites and send them
- [ ] (Optional) Email service configured for Phase 2

---

## Part 5: Troubleshooting

### Issue: "Connection refused" to database

**Solution:** 
- Verify DATABASE_URL is correct (check Render PostgreSQL service)
- Ensure migrations have run: `npm run migrate`
- Test locally first before deploying

### Issue: 404 on API endpoints

**Solution:**
- Check backend is running: `https://<backend>/api/health`
- Verify CORS is configured correctly (check FRONTEND_URL env var)
- Clear browser cache and restart frontend

### Issue: Predictions not saving

**Solution:**
- Check that match kickoff time is in the future (stored as UTC)
- Verify user is authenticated (check session cookie)
- Check browser console for API errors
- Review backend logs

### Issue: Leaderboard empty even after predictions

**Solution:**
- Manually import results: Use admin dashboard or manual curl
- Check that matches have final scores in database
- Verify scoring engine is working (check logs for errors)

### Issue: Cold-start delays on Render

**Solution:**
- This is normal on free tier (3-5 seconds)
- GitHub Actions cron pings health endpoint every 5 minutes to keep warm
- Delays only happen if no traffic for 15+ minutes

---

## Part 6: Scaling Beyond MVP

If app grows beyond 100 users or matches accumulate:

1. **Database:** Upgrade from free to paid tier on Render
2. **Backend:** Upgrade from free to paid tier
3. **Frontend:** Use paid CDN or upgrade deployment plan
4. **Caching:** Add Redis for leaderboard and match data
5. **Email:** Configure Resend/Brevo for Phase 2 notifications
6. **Monitoring:** Add Sentry for error tracking

---

## Useful Commands

```bash
# Build locally and test
cd backend && npm run build && npm start

# Type check
npm run type-check

# Run linting
npm run lint

# Database operations
npm run migrate          # Run migrations
npm run seed             # Seed fixtures

# Inspect Render logs
render logs <service-id>

# Check GitHub Actions status
# GitHub Repo → Actions → Import World Cup Results
```

---

## Support

- Check logs: Render Dashboard → Logs
- Review API errors in browser DevTools
- Check database state: `SELECT * FROM matches LIMIT 5;`
- Monitor cron job: GitHub Repo → Actions → Import World Cup Results

Good luck! 🚀⚽
