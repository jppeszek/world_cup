import fetch from 'node-fetch';
import { query } from '../src/db.js';
import dotenv from 'dotenv';

dotenv.config();

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
    const response = await fetch(
      'https://raw.githubusercontent.com/openfootball/world-cup/master/2026/matches.json',
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch fixtures: ${response.statusText}`);
    }

    const data = (await response.json()) as { matches: WorldCupMatch[] };
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
        (external_ref, stage, "group", team_home, team_away, kickoff_utc, venue, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'open')`,
        [externalRef, stage, group, teamHome, teamAway, kickoffUtc, venue],
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
