import { Match, Prediction } from '../types/index.js';

export interface ScoreResult {
  points: number;
  outcome: boolean;
  exactScore: boolean;
  reasoning: string;
}

export function scoreMatch(prediction: Prediction, match: Match, penaltyWinner?: 'home' | 'away' | null): ScoreResult {
  if (match.score_home === null || match.score_away === null) {
    return {
      points: 0,
      outcome: false,
      exactScore: false,
      reasoning: 'Match result not yet available',
    };
  }

  // Check exact score
  const exactScore =
    prediction.pred_home === match.score_home && prediction.pred_away === match.score_away;

  // Determine predicted outcome
  let predOutcome: 'home' | 'away' | 'draw';
  if (prediction.pred_home > prediction.pred_away) {
    predOutcome = 'home';
  } else if (prediction.pred_away > prediction.pred_home) {
    predOutcome = 'away';
  } else {
    predOutcome = 'draw';
  }

  // Determine actual outcome
  let actualOutcome: 'home' | 'away' | 'draw';
  if (match.score_home > match.score_away) {
    actualOutcome = 'home';
  } else if (match.score_away > match.score_home) {
    actualOutcome = 'away';
  } else {
    actualOutcome = 'draw';
  }

  // Determine if outcome is correct
  let outcomeCorrect = false;

  if (exactScore) {
    // Exact score always means outcome is correct
    outcomeCorrect = true;
  } else if (predOutcome === actualOutcome) {
    // Predicted outcome matches actual outcome
    outcomeCorrect = true;
  } else if (actualOutcome !== 'draw' && prediction.pred_winner === actualOutcome) {
    // For knockout matches: user predicted the correct winner even if score wrong
    outcomeCorrect = true;
  }

  // Calculate points
  let points = 0;
  if (exactScore) {
    points = 3; // 2 for outcome + 1 bonus
  } else if (outcomeCorrect) {
    points = 1;
  }

  // Award bonus point for correct penalty prediction in playoff draws
  let penaltyBonus = 0;
  if (actualOutcome === 'draw' && penaltyWinner && prediction.pred_winner === penaltyWinner) {
    penaltyBonus = 1;
  }

  points += penaltyBonus;

  return {
    points,
    outcome: outcomeCorrect,
    exactScore,
    reasoning: exactScore
      ? 'Exact score match'
      : outcomeCorrect
        ? 'Correct outcome'
        : 'Incorrect prediction',
  };
}

export async function scoreAllPredictionsForMatch(
  matchId: number,
  db: any,
  penaltyWinner?: 'home' | 'away' | null,
): Promise<Map<number, number>> {
  const { query } = db;

  // Get match details
  const matchResult = await query('SELECT * FROM matches WHERE id = $1', [matchId]);
  if (matchResult.rows.length === 0) {
    throw new Error(`Match ${matchId} not found`);
  }

  const match = matchResult.rows[0];

  // Get all predictions for this match
  const predictionsResult = await query('SELECT * FROM predictions WHERE match_id = $1', [
    matchId,
  ]);

  const pointsMap = new Map<number, number>();

  for (const prediction of predictionsResult.rows) {
    const result = scoreMatch(prediction, match, penaltyWinner);
    pointsMap.set(prediction.id, result.points);

    // Update prediction with points
    await query('UPDATE predictions SET points = $1, updated_at = NOW() WHERE id = $2', [
      result.points,
      prediction.id,
    ]);
  }

  return pointsMap;
}
