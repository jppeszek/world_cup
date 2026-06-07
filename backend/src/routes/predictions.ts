import { Router, Request, Response } from 'express';
import { query } from '../db.js';
import { isMatchLocked } from '../utils/lockEnforcement.js';
import { requireAuth } from '../middleware/auth.js';
import { CreatePredictionRequest, UpdatePredictionRequest } from '../types/index.js';

const router = Router();

// POST /api/predictions - Create prediction
router.post('/', requireAuth, async (req: Request, res: Response) => {
  const { match_id, pred_home, pred_away, pred_winner } = req.body as CreatePredictionRequest;
  const userId = req.user?.id;

  if (!match_id || pred_home === undefined || pred_away === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!Number.isInteger(pred_home) || !Number.isInteger(pred_away)) {
    return res.status(400).json({ error: 'Predictions must be integers' });
  }

  if (pred_home < 0 || pred_away < 0 || pred_home > 20 || pred_away > 20) {
    return res.status(400).json({ error: 'Invalid prediction values' });
  }

  try {
    // Get match
    const matchResult = await query('SELECT * FROM matches WHERE id = $1', [match_id]);
    if (matchResult.rows.length === 0) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const match = matchResult.rows[0];

    // Check if match is locked
    if (isMatchLocked(match)) {
      return res.status(400).json({ error: 'Match is locked' });
    }

    // Check if prediction already exists
    const existingResult = await query(
      'SELECT id FROM predictions WHERE user_id = $1 AND match_id = $2',
      [userId, match_id],
    );

    if (existingResult.rows.length > 0) {
      return res.status(400).json({ error: 'Prediction already exists for this match' });
    }

    // Create prediction
    const result = await query(
      `INSERT INTO predictions (user_id, match_id, pred_home, pred_away, pred_winner)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, match_id, pred_home, pred_away, pred_winner || null],
    );

    res.status(201).json({ prediction: result.rows[0] });
  } catch (error) {
    console.error('Create prediction error:', error);
    res.status(500).json({ error: 'Failed to create prediction' });
  }
});

// PUT /api/predictions/:id - Update prediction
router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  const { pred_home, pred_away, pred_winner } = req.body as UpdatePredictionRequest;
  const predictionId = parseInt(req.params.id);
  const userId = req.user?.id;

  if (pred_home === undefined || pred_away === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!Number.isInteger(pred_home) || !Number.isInteger(pred_away)) {
    return res.status(400).json({ error: 'Predictions must be integers' });
  }

  if (pred_home < 0 || pred_away < 0 || pred_home > 20 || pred_away > 20) {
    return res.status(400).json({ error: 'Invalid prediction values' });
  }

  try {
    // Get prediction
    const predResult = await query('SELECT * FROM predictions WHERE id = $1', [predictionId]);
    if (predResult.rows.length === 0) {
      return res.status(404).json({ error: 'Prediction not found' });
    }

    const prediction = predResult.rows[0];

    // Verify ownership
    if (prediction.user_id !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Get match
    const matchResult = await query('SELECT * FROM matches WHERE id = $1', [
      prediction.match_id,
    ]);
    if (matchResult.rows.length === 0) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const match = matchResult.rows[0];

    // Check if match is locked
    if (isMatchLocked(match)) {
      return res.status(400).json({ error: 'Match is locked' });
    }

    // Update prediction
    const result = await query(
      `UPDATE predictions
       SET pred_home = $1, pred_away = $2, pred_winner = $3, updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [pred_home, pred_away, pred_winner || null, predictionId],
    );

    res.json({ prediction: result.rows[0] });
  } catch (error) {
    console.error('Update prediction error:', error);
    res.status(500).json({ error: 'Failed to update prediction' });
  }
});

// GET /api/predictions/match/:match_id - Get all predictions for a match (admin only)
router.get('/match/:match_id', async (req: Request, res: Response) => {
  const matchId = parseInt(req.params.match_id);

  try {
    // Get all predictions for match with user details
    const result = await query(
      `SELECT p.*, u.nickname
       FROM predictions p
       JOIN users u ON p.user_id = u.id
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

// GET /api/me/predictions - Get current user's predictions
router.get('/me/predictions', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user?.id;

  try {
    const result = await query(
      `SELECT p.*, m.team_home, m.team_away, m.kickoff_utc, m.score_home, m.score_away, m.status
       FROM predictions p
       JOIN matches m ON p.match_id = m.id
       WHERE p.user_id = $1
       ORDER BY m.kickoff_utc DESC`,
      [userId],
    );

    res.json({ predictions: result.rows });
  } catch (error) {
    console.error('Get user predictions error:', error);
    res.status(500).json({ error: 'Failed to get predictions' });
  }
});

export default router;
