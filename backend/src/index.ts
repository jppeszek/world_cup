import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import session from 'express-session';
import pgSession from 'connect-pg-simple';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import path from 'path';
import pool, { getClient } from './db.js';
import authRoutes from './routes/auth.js';
import matchRoutes from './routes/matches.js';
import predictionRoutes from './routes/predictions.js';
import leaderboardRoutes from './routes/leaderboard.js';
import adminRoutes from './routes/admin.js';
import { seedFixtures } from '../scripts/seedFixtures.js';
import { existsSync } from 'fs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const PostgresqlStore = pgSession(session);

// Middleware
app.use(helmet());
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5555',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins.length > 0 ? allowedOrigins : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Session config
app.use(
  session({
    store: new PostgresqlStore({
      pool: pool,
    }),
    secret: process.env.SESSION_SECRET || 'dev-secret-change-in-prod',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  }),
);

// Extend Express Session
declare global {
  namespace Express {
    interface SessionData {
      userId?: number;
    }
  }
}

// Routes
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/admin', adminRoutes);

// Serve static frontend files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendPath = resolve(__dirname, '../../frontend/dist');

if (existsSync(frontendPath)) {
  app.use(express.static(frontendPath));

  // SPA fallback: serve index.html for non-API routes
  app.get('*', (req: Request, res: Response) => {
    res.sendFile(resolve(frontendPath, 'index.html'));
  });
} else {
  // 404 handler (when frontend not built)
  app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Not found' });
  });
}

// Error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// Run migrations on startup
async function runMigrations() {
  const client = await getClient();
  try {
    console.log('Running database migrations...');
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const migrationPath = resolve(__dirname, '../migrations/001_init_schema.sql');
    const sql = readFileSync(migrationPath, 'utf-8');
    await client.query(sql);
    console.log('✅ Migrations completed');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Start server
async function startup() {
  await runMigrations();
  await seedFixtures();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  });
}

startup().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
