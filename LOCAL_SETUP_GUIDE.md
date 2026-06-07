# Local Setup Guide - Step by Step

This guide walks you through setting up the World Cup prediction app on your local machine.

## Prerequisites

You'll need:
- **Node.js 18+** — https://nodejs.org/ (includes npm)
- **PostgreSQL 12+** — https://www.postgresql.org/download/
- **Git** — https://git-scm.com/
- **Terminal/Command Prompt**

### Check Installations

```bash
node --version    # Should be v18+
npm --version     # Should be v8+
psql --version    # Should be 12+
```

If any are missing, install them from the links above.

---

## Step 1: Clone & Install Dependencies

```bash
# Clone the repository
git clone <your-repo-url>
cd world-cup

# Run quick setup script
chmod +x QUICK_START.sh
./QUICK_START.sh

# Or manually:
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

**Expected output:**
```
✅ Node.js v18.x.x
✅ npm v9.x.x
📦 Installing backend dependencies... (takes ~30 seconds)
📦 Installing frontend dependencies... (takes ~20 seconds)
✅ Created backend/.env
✅ Created frontend/.env.local
```

---

## Step 2: Set Up PostgreSQL Database

### Option A: Local PostgreSQL

```bash
# Create database
createdb world_cup

# Create .env file with connection
cat > backend/.env << 'EOF'
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/world_cup
SESSION_SECRET=dev-secret-key-change-later
IMPORT_SECRET=dev-import-secret
FRONTEND_URL=http://localhost:5173
API_FOOTBALL_KEY=optional-for-local
EOF
```

**Note:** Replace `password` with your PostgreSQL password if you set one during installation.

### Option B: Test Without Database (Run Unit Tests Only)

Skip database setup and go straight to **Step 4: Run Unit Tests**. The scoring and lock tests don't need a database.

---

## Step 3: Initialize Database

```bash
cd backend

# Run migrations (create tables)
npm run migrate

# Seed fixtures (download 104 World Cup matches)
npm run seed

cd ..
```

**Expected output:**
```
Running migrations...
Migrations completed successfully
Fetching 2026 World Cup fixtures...
Found 104 matches
Successfully inserted 104 matches
```

---

## Step 4: Start the Application

### Terminal 1 - Start Backend

```bash
cd backend
npm run dev
```

**Expected output:**
```
Server running on port 5000
NODE_ENV: development
```

### Terminal 2 - Start Frontend

```bash
cd frontend
npm run dev
```

**Expected output:**
```
  VITE v5.0.8  ready in 123 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

### Terminal 3 - Keep for Tests/Commands

```bash
# Verify backend is running
curl http://localhost:5000/api/health
# Should return: {"status":"ok","timestamp":"2026-06-07T..."}

# Verify frontend is accessible
curl http://localhost:5173
# Should return HTML
```

---

## Step 5: Test the Application

### Option A: Run Unit Tests (No Database Required)

```bash
cd backend
npm test
```

**Expected output:**
```
PASS  src/__tests__/scoring.test.ts
  Scoring Engine
    Correct Outcome - Correct Exact Score
      ✓ should award 3 points for exact score match (5 ms)
    ...
    ✓ should be idempotent: same input produces same output

PASS  src/__tests__/lockEnforcement.test.ts
  Lock Enforcement
    isMatchLocked
      ✓ should return false for future matches
    ...

Test Suites: 2 passed, 2 total
Tests:       19 passed, 19 total
Snapshots:   0 total
Time:        2.345 s
```

### Option B: Test Full Workflow (Requires Database)

1. **Create test user invite:**
   ```bash
   psql world_cup << 'EOF'
   INSERT INTO invites (email, token, status) 
   VALUES ('test@example.com', 'test-token-123', 'sent');
   EOF
   ```

2. **Open browser:** http://localhost:5173

3. **Test registration:**
   - Go to: `http://localhost:5173/register?token=test-token-123`
   - Email: `test@example.com`
   - Nickname: `TestPlayer`
   - Password: `Password123`
   - Click "Register"

4. **Should redirect to matches page** (may be empty if no matches seeded)

5. **Make admin user (for admin features):**
   ```bash
   psql world_cup << 'EOF'
   UPDATE users SET is_admin = true WHERE email = 'test@example.com';
   EOF
   ```

6. **Test admin features:**
   - Navigate to `/admin` (should work now)
   - Try creating an invite
   - View invites list

---

## Step 6: Run Additional Checks

### Type Checking

```bash
cd backend
npm run type-check
```

Should show no errors.

### Test Coverage

```bash
cd backend
npm run test:coverage
```

Opens coverage report in `coverage/` directory.

### Build for Production

```bash
cd backend
npm run build
# Should create dist/ directory with compiled code
```

---

## Troubleshooting

### "Connection refused" to database

**Problem:** `Error: connect ECONNREFUSED 127.0.0.1:5432`

**Solutions:**
1. Verify PostgreSQL is running
2. Check DATABASE_URL in backend/.env
3. Create the database: `createdb world_cup`
4. Try connecting: `psql world_cup`

### "Module not found" errors

**Problem:** `Cannot find module 'express'`

**Solutions:**
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

### Port already in use

**Problem:** `Error: listen EADDRINUSE :::5000`

**Solution:** Change port in backend/.env:
```env
PORT=5001
```

Then update frontend .env.local:
```env
VITE_API_URL=http://localhost:5001
```

### No matches appear

**Problem:** Matches page is empty

**Solutions:**
1. Check if migrations ran: `psql world_cup -c "SELECT count(*) FROM matches;"`
2. Run seed script: `npm run seed`
3. Check backend logs for errors

### Tests fail with database errors

**Problem:** Tests fail with "Cannot connect to database"

**Solution:** That's fine! Unit tests don't need a database. Integration tests (which need DB) are skipped.

---

## Quick Reference Commands

```bash
# Setup
npm install                  # Install dependencies
npm run migrate             # Create database schema
npm run seed                # Download 104 fixtures

# Development
npm run dev                 # Start dev server
npm run build               # Build for production
npm run start               # Run production build

# Testing
npm test                    # Run unit tests
npm run test:watch          # Auto-rerun on file changes
npm run test:coverage       # Generate coverage report
npm run type-check          # TypeScript type checking

# Database
psql world_cup              # Connect to database
npm run seed                # Seed fixtures again
```

---

## Verify Everything Works

Run this checklist:

- [ ] `npm test` passes (19 tests)
- [ ] `npm run type-check` shows no errors
- [ ] Backend starts: `cd backend && npm run dev` (no errors)
- [ ] Frontend starts: `cd frontend && npm run dev` (no errors)
- [ ] Can access: http://localhost:5173 (login page appears)
- [ ] API responds: `curl http://localhost:5000/api/health` (returns JSON)
- [ ] Database connection works (if using local PostgreSQL)

✅ **If all pass, you're ready to deploy!**

---

## Next Steps

1. **Read DEPLOYMENT_GUIDE.md** to deploy to Render
2. **Read PROJECT_SUMMARY.md** for architecture overview
3. **Check README.md** for API documentation

---

## Common Questions

**Q: Can I use SQLite instead of PostgreSQL?**  
A: Not for this setup. The schema uses PostgreSQL-specific features. Use a PostgreSQL free tier service if you don't have it locally.

**Q: Do I need to set up an API-Football key to run locally?**  
A: No. Leave `API_FOOTBALL_KEY` blank for development. Result import will fail but that's expected locally.

**Q: Can I run tests without PostgreSQL?**  
A: Yes! Unit tests (19 tests) don't require a database. Run `npm test` anytime.

**Q: How do I reset the database?**  
A: 
```bash
dropdb world_cup
createdb world_cup
npm run migrate
npm run seed
```

---

**Ready?** Run `npm test` first to verify everything! 🚀
