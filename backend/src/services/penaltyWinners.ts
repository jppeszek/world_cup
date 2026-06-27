import fs from 'fs';
import path from 'path';

const PENALTY_WINNERS_FILE = path.join(process.cwd(), 'data', 'penalty_winners.json');

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.dirname(PENALTY_WINNERS_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Load all penalty winners
function loadPenaltyWinners(): Record<number, 'home' | 'away'> {
  try {
    ensureDataDir();
    if (!fs.existsSync(PENALTY_WINNERS_FILE)) {
      return {};
    }
    const data = fs.readFileSync(PENALTY_WINNERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading penalty winners:', error);
    return {};
  }
}

// Get penalty winner for a specific match
export function getPenaltyWinner(matchId: number): 'home' | 'away' | null {
  const winners = loadPenaltyWinners();
  return winners[matchId] || null;
}

// Save penalty winner for a match
export function savePenaltyWinner(matchId: number, winner: 'home' | 'away'): void {
  try {
    ensureDataDir();
    const winners = loadPenaltyWinners();
    winners[matchId] = winner;
    fs.writeFileSync(PENALTY_WINNERS_FILE, JSON.stringify(winners, null, 2));
  } catch (error) {
    console.error('Error saving penalty winner:', error);
    throw error;
  }
}

// Clear penalty winner for a match
export function clearPenaltyWinner(matchId: number): void {
  try {
    ensureDataDir();
    const winners = loadPenaltyWinners();
    delete winners[matchId];
    fs.writeFileSync(PENALTY_WINNERS_FILE, JSON.stringify(winners, null, 2));
  } catch (error) {
    console.error('Error clearing penalty winner:', error);
    throw error;
  }
}
