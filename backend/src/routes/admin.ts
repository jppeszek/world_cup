import { Router, Request, Response } from 'express';
import { query } from '../db.js';
import { requireAdmin, requireInternalToken } from '../middleware/auth.js';
import { generateRandomToken } from '../utils/hash.js';
import { scoreAllPredictionsForMatch } from '../services/scoringEngine.js';
import fetch from 'node-fetch';

const router = Router();

// POST /api/admin/invites - Create and send invite
router.post('/invites', requireAdmin, async (req: Request, res: Response) => {
  const { email } = req.body;
  const adminId = req.user?.id;

  if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  try {
    // Check if user already exists
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'User already registered with this email' });
    }

    // Generate token
    const token = generateRandomToken();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days

    // Create invite
    const result = await query(
      `INSERT INTO invites (email, token, invited_by, status, expires_at)
       VALUES ($1, $2, $3, 'sent', $4)
       RETURNING *`,
      [email, token, adminId, expiresAt],
    );

    const invite = result.rows[0];

    // TODO: Send email in Phase 2
    const inviteUrl = `${process.env.FRONTEND_URL}/register?token=${token}`;
    console.log(`Invite created for ${email}: ${inviteUrl}`);

    res.status(201).json({
      invite: {
        id: invite.id,
        email: invite.email,
        token: invite.token,
        status: invite.status,
      },
    });
  } catch (error) {
    console.error('Create invite error:', error);
    res.status(500).json({ error: 'Failed to create invite' });
  }
});

// GET /api/admin/invites - List invites
router.get('/invites', requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT id, email, status, created_at, accepted_at
       FROM invites
       ORDER BY created_at DESC`,
    );

    res.json({ invites: result.rows });
  } catch (error) {
    console.error('Get invites error:', error);
    res.status(500).json({ error: 'Failed to get invites' });
  }
});

// POST /api/admin/import-results - Import results from API-Football
router.post('/import-results', requireInternalToken, async (req: Request, res: Response) => {
  try {
    console.log('Starting result import...');

    const apiKey = process.env.API_FOOTBALL_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    // Fetch fixtures from API-Football
    // Using a simple approach: fetch all 2026 matches and update those with results
    const response = await fetch(
      `https://api-football-v1.p.rapidapi.com/v3/fixtures?league=1&season=2026`,
      {
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': 'api-football-v1.p.rapidapi.com',
        },
      },
    );

    if (!response.ok) {
      console.warn(`API-Football returned ${response.status}`);
      return res.status(500).json({ error: 'Failed to fetch results from API' });
    }

    const data = (await response.json()) as any;
    const fixtures = data.response || [];

    console.log(`Processing ${fixtures.length} fixtures...`);

    let updatedCount = 0;

    for (const fixture of fixtures) {
      const status = fixture.fixture?.status;
      const teamHome = fixture.teams?.home?.name;
      const teamAway = fixture.teams?.away?.name;
      const scoreHome = fixture.goals?.home;
      const scoreAway = fixture.goals?.away;

      // Only process finished matches
      if (status !== 'FT' && status !== 'AET' && status !== 'PEN') {
        continue;
      }

      if (!teamHome || !teamAway || scoreHome === null || scoreAway === null) {
        continue;
      }

      // Find matching match in our DB
      const matchResult = await query(
        `SELECT * FROM matches
         WHERE team_home = $1 AND team_away = $2`,
        [teamHome, teamAway],
      );

      if (matchResult.rows.length === 0) {
        console.warn(`No match found for ${teamHome} vs ${teamAway}`);
        continue;
      }

      const match = matchResult.rows[0];

      // Skip if already has result
      if (match.score_home !== null && match.score_away !== null) {
        continue;
      }

      // Update match with result
      await query(
        `UPDATE matches
         SET score_home = $1, score_away = $2, status = 'finished', result_imported_at = NOW(), updated_at = NOW()
         WHERE id = $3`,
        [scoreHome, scoreAway, match.id],
      );

      // Score all predictions for this match
      await scoreAllPredictionsForMatch(match.id, { query });

      updatedCount++;
      console.log(`Updated ${teamHome} vs ${teamAway}: ${scoreHome}-${scoreAway}`);
    }

    console.log(`Result import completed: ${updatedCount} matches updated`);
    res.json({ message: `Imported results for ${updatedCount} matches` });
  } catch (error) {
    console.error('Result import error:', error);
    res.status(500).json({ error: 'Failed to import results' });
  }
});

// GET /api/admin/matches/:match_id/predictions - Get all predictions for a match
router.get('/matches/:match_id/predictions', requireAdmin, async (req: Request, res: Response) => {
  const matchId = parseInt(req.params.match_id);

  try {
    const result = await query(
      `SELECT p.*, u.nickname, m.score_home, m.score_away
       FROM predictions p
       JOIN users u ON p.user_id = u.id
       JOIN matches m ON p.match_id = m.id
       WHERE p.match_id = $1
       ORDER BY u.nickname`,
      [matchId],
    );

    res.json({ predictions: result.rows });
  } catch (error) {
    console.error('Get predictions error:', error);
    res.status(500).json({ error: 'Failed to get predictions' });
  }
});

// GET /api/admin/leaderboard - Get full leaderboard (admin only)
router.get('/leaderboard', requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT
        u.id,
        u.nickname,
        u.email,
        u.is_admin,
        COALESCE(SUM(p.points), 0) as total_score,
        COUNT(CASE WHEN p.id IS NOT NULL THEN 1 END) as predictions_made,
        COUNT(CASE WHEN p.points IS NOT NULL THEN 1 END) as predictions_scored
      FROM users u
      LEFT JOIN predictions p ON u.id = p.user_id
      GROUP BY u.id, u.nickname, u.email, u.is_admin
      ORDER BY total_score DESC`,
    );

    // Add rank
    const ranked = result.rows.map((row, index) => ({
      ...row,
      rank: index + 1,
    }));

    res.json({ leaderboard: ranked });
  } catch (error) {
    console.error('Get admin leaderboard error:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

export default router;
