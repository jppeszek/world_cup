import { Router, Request, Response } from 'express';
import { query } from '../db.js';
import { getMatchStatus } from '../utils/lockEnforcement.js';

const router = Router();

// GET /api/matches - Get matches
router.get('/', async (req: Request, res: Response) => {
  const { status, daysOffset } = req.query;
  const serverTime = new Date();

  try {
    let whereClause = '';
    const params: any[] = [];

    // Filter by status if provided
    if (status) {
      whereClause += ` AND status = $${params.length + 1}`;
      params.push(status);
    }

    // Filter by date range if days offset provided
    if (daysOffset !== undefined) {
      const offset = parseInt(daysOffset as string) || 0;
      const startDate = new Date();
      startDate.setUTCHours(0, 0, 0, 0);
      startDate.setUTCDate(startDate.getUTCDate() + offset);

      const endDate = new Date(startDate);
      endDate.setUTCDate(endDate.getUTCDate() + 1);

      whereClause += ` AND kickoff_utc >= $${params.length + 1} AND kickoff_utc < $${params.length + 2}`;
      params.push(startDate, endDate);
    }

    const result = await query(
      `SELECT * FROM matches
       WHERE 1=1 ${whereClause}
       ORDER BY kickoff_utc ASC`,
      params,
    );

    // Compute status and time info for each match
    const matches = result.rows.map((match) => ({
      ...match,
      status: getMatchStatus(match, serverTime),
    }));

    // Group by date
    const grouped: { [key: string]: any[] } = {};
    for (const match of matches) {
      const date = match.kickoff_utc.split('T')[0];
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(match);
    }

    res.json({ matches: grouped });
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({ error: 'Failed to get matches' });
  }
});

// GET /api/matches/:id - Get match details
router.get('/:id', async (req: Request, res: Response) => {
  const matchId = parseInt(req.params.id);

  try {
    const result = await query('SELECT * FROM matches WHERE id = $1', [matchId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const match = result.rows[0];
    const serverTime = new Date();

    res.json({
      match: {
        ...match,
        status: getMatchStatus(match, serverTime),
      },
    });
  } catch (error) {
    console.error('Get match error:', error);
    res.status(500).json({ error: 'Failed to get match' });
  }
});

export default router;
