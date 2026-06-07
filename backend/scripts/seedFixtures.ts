import fetch from 'node-fetch';
import { query } from '../src/db.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Fallback: Generate sample fixtures if online fetch fails
function generateSampleFixtures(): WorldCupMatch[] {
  const baseDate = new Date('2026-06-11T00:00:00Z');
  const teams = [
    'Brazil', 'Argentina', 'France', 'Germany', 'England', 'Spain',
    'Belgium', 'Netherlands', 'Portugal', 'Italy', 'Mexico', 'Canada',
    'USA', 'Japan', 'South Korea', 'Australia'
  ];

  const matches: WorldCupMatch[] = [];
  let matchId = 0;

  // Create 16 sample matches (Group Stage style)
  for (let i = 0; i < 16; i++) {
    const matchDate = new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000);
    const team1 = teams[i % teams.length];
    const team2 = teams[(i + 1) % teams.length];

    matches.push({
      date: matchDate.toISOString().split('T')[0],
      time: '15:00',
      datetime: matchDate.toISOString(),
      stage: 'group',
      group: String.fromCharCode(65 + (i % 8)), // A, B, C, D, etc.
      team1_name: team1,
      team2_name: team2,
      venue: 'Test Stadium'
    });
  }

  return matches;
}

interface WorldCupMatch {
  date: string;
  time: string;
  datetime?: string;
  stage: string;
  group?: string;
  team1?: {
    name: string;
  };
  team2?: {
    name: string;
  };
  team1_name?: string;
  team2_name?: string;
  venue?: string;
}

async function seedFixtures() {
  try {
    console.log('Fetching 2026 World Cup fixtures...');

    // Try multiple URLs for robustness
    const urls = [
      'https://raw.githubusercontent.com/openfootball/world-cup/master/2026/matches.json',
      'https://raw.githubusercontent.com/openfootball/world-cup/main/2026/matches.json',
    ];

    let data = null;
    let lastError = null;

    for (const url of urls) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          data = await response.json();
          break;
        }
      } catch (err) {
        lastError = err;
        continue;
      }
    }

    if (!data) {
      console.log('Could not fetch from online source. Using sample fixtures...');
      // Fallback: Create minimal test fixtures
      data = { matches: generateSampleFixtures() };
    }

    const matches = data.matches || [];

    console.log(`Found ${matches.length} matches`);

    let insertedCount = 0;

    for (const match of matches) {
      // Parse datetime
      const dateStr = match.datetime || `${match.date}T${match.time}`;
      const kickoffUtc = new Date(dateStr);

      if (isNaN(kickoffUtc.getTime())) {
        console.warn(`Skipping match with invalid date: ${dateStr}`);
        continue;
      }

      const teamHome = match.team1_name || match.team1?.name || 'Unknown';
      const teamAway = match.team2_name || match.team2?.name || 'Unknown';
      const stage = match.stage || 'group';
      const group = match.group || null;
      const venue = match.venue || null;
      const externalRef = `${match.date}_${teamHome}_${teamAway}`;

      // Only set scores if they're actually provided (not for sample fixtures)
      const scoreHome = match.score_home !== undefined ? match.score_home : null;
      const scoreAway = match.score_away !== undefined ? match.score_away : null;

      // Check if match already exists
      const existing = await query(
        'SELECT id FROM matches WHERE team_home = $1 AND team_away = $2 AND kickoff_utc = $3',
        [teamHome, teamAway, kickoffUtc],
      );

      if (existing.rows.length > 0) {
        console.log(`Match already exists: ${teamHome} vs ${teamAway}`);
        continue;
      }

      // Insert match
      await query(
        `INSERT INTO matches
        (external_ref, stage, "group", team_home, team_away, kickoff_utc, venue, status, score_home, score_away)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'open', $8, $9)`,
        [externalRef, stage, group, teamHome, teamAway, kickoffUtc, venue, scoreHome, scoreAway],
      );

      insertedCount++;
    }

    console.log(`Successfully inserted ${insertedCount} matches`);
  } catch (error) {
    console.error('Error seeding fixtures:', error);
    process.exit(1);
  }
}

seedFixtures();
