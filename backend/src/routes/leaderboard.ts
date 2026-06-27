import { Router, Request, Response } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Helper to rebuild leaderboard cache
async function rebuildLeaderboard() {
  // Get all users and their scores
  const result = await query(
    `SELECT
      u.id as user_id,
      u.nickname,
      COALESCE(SUM(p.points), 0) as total_score,
      COUNT(CASE WHEN p.points > 0 THEN 1 END) as matches_scored,
      COUNT(CASE WHEN p.pred_home = m.score_home AND p.pred_away = m.score_away THEN 1 END) as exact_score_hits,
      COUNT(CASE WHEN p.id IS NOT NULL THEN 1 END) as matches_predicted
    FROM users u
    LEFT JOIN predictions p ON u.id = p.user_id
    LEFT JOIN matches m ON p.match_id = m.id AND m.score_home IS NOT NULL AND m.score_away IS NOT NULL
    WHERE u.is_admin = false OR true
    GROUP BY u.id, u.nickname
    ORDER BY total_score DESC, exact_score_hits DESC, u.created_at ASC`,
  );

  return result.rows;
}

// GET /api/leaderboard - Get leaderboard
router.get('/', async (req: Request, res: Response) => {
  try {
    const entries = await rebuildLeaderboard();

    // Add rank
    const ranked = entries.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

    res.json({ leaderboard: ranked });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

// GET /api/me/stats - Get current user's stats
router.get('/me/stats', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user?.id;

  try {
    // Get user's score and stats
    const statsResult = await query(
      `SELECT
        COALESCE(SUM(p.points), 0) as total_score,
        COUNT(CASE WHEN p.points > 0 THEN 1 END) as matches_scored,
        COUNT(CASE WHEN p.pred_home = m.score_home AND p.pred_away = m.score_away THEN 1 END) as exact_score_hits,
        COUNT(CASE WHEN p.id IS NOT NULL THEN 1 END) as matches_predicted
      FROM predictions p
      LEFT JOIN matches m ON p.match_id = m.id AND m.score_home IS NOT NULL AND m.score_away IS NOT NULL
      WHERE p.user_id = $1`,
      [userId],
    );

    const stats = statsResult.rows[0];

    // Get leaderboard to find rank
    const leaderboard = await rebuildLeaderboard();
    const rank = leaderboard.findIndex((entry) => entry.user_id === userId) + 1;

    res.json({
      stats: {
        ...stats,
        rank: rank || null,
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// GET /api/me/predictions - Get user's predictions with results
router.get('/me/predictions', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user?.id;

  try {
    const result = await query(
      `SELECT
        p.*,
        m.team_home,
        m.team_away,
        m.kickoff_utc,
        m.score_home,
        m.score_away,
        m.status
      FROM predictions p
      JOIN matches m ON p.match_id = m.id
      WHERE p.user_id = $1
      ORDER BY m.kickoff_utc DESC`,
      [userId],
    );

    res.json({ predictions: result.rows });
  } catch (error) {
    console.error('Get predictions error:', error);
    res.status(500).json({ error: 'Failed to get predictions' });
  }
});

export default router;
