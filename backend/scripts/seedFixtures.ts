import { query } from '../src/db.ts';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

interface Fixture {
  home: string;
  away: string;
  date: string;
  time: string;
  venue: string;
  stage: string;
  group?: string;
}

// Official 2026 FIFA World Cup Schedule from wc.pdf
// All times converted from Europe/Warsaw (UTC+2 in June/July) to UTC
const FIXTURES_2026: Fixture[] = [
  // Group stage Round 1
  { home: 'Mexico', away: 'South Africa', date: '2026-06-11', time: '19:00', venue: 'Mexico City Stadium', stage: 'group' },
  { home: 'Korea Republic', away: 'Czechia', date: '2026-06-12', time: '02:00', venue: 'Guadalajara Stadium', stage: 'group' },
  { home: 'Canada', away: 'Bosnia & Herzegovina', date: '2026-06-12', time: '19:00', venue: 'Toronto Stadium', stage: 'group' },
  { home: 'USA', away: 'Paraguay', date: '2026-06-13', time: '01:00', venue: 'Los Angeles Stadium', stage: 'group' },
  { home: 'Qatar', away: 'Switzerland', date: '2026-06-13', time: '07:00', venue: 'San Francisco Bay Area Stadium', stage: 'group' },
  { home: 'Brazil', away: 'Morocco', date: '2026-06-13', time: '22:00', venue: 'New York New Jersey Stadium', stage: 'group' },
  { home: 'Haiti', away: 'Scotland', date: '2026-06-14', time: '01:00', venue: 'Boston Stadium', stage: 'group' },
  { home: 'Australia', away: 'Turkey', date: '2026-06-14', time: '04:00', venue: 'BC Place', stage: 'group' },
  { home: 'Germany', away: 'Curacao', date: '2026-06-14', time: '17:00', venue: 'Houston Stadium', stage: 'group' },
  { home: 'Netherlands', away: 'Japan', date: '2026-06-14', time: '20:00', venue: 'Dallas Stadium', stage: 'group' },
  { home: 'Côte d\'Ivoire', away: 'Ecuador', date: '2026-06-15', time: '23:00', venue: 'Philadelphia Stadium', stage: 'group' },
  { home: 'Sweden', away: 'Tunisia', date: '2026-06-15', time: '02:00', venue: 'Monterrey Stadium', stage: 'group' },
  { home: 'Spain', away: 'Cabo Verde', date: '2026-06-15', time: '16:00', venue: 'Atlanta Stadium', stage: 'group' },
  { home: 'Belgium', away: 'Egypt', date: '2026-06-15', time: '19:00', venue: 'Seattle Stadium', stage: 'group' },
  { home: 'Saudi Arabia', away: 'Uruguay', date: '2026-06-15', time: '22:00', venue: 'Miami Stadium', stage: 'group' },
  { home: 'IR Iran', away: 'New Zealand', date: '2026-06-16', time: '01:00', venue: 'Los Angeles Stadium', stage: 'group' },
  { home: 'France', away: 'Senegal', date: '2026-06-16', time: '07:00', venue: 'New York New Jersey Stadium', stage: 'group' },
  { home: 'Iraq', away: 'Norway', date: '2026-06-16', time: '22:00', venue: 'Boston Stadium', stage: 'group' },
  { home: 'Argentina', away: 'Algeria', date: '2026-06-17', time: '01:00', venue: 'Kansas City Stadium', stage: 'group' },
  { home: 'Austria', away: 'Jordan', date: '2026-06-17', time: '04:00', venue: 'San Francisco Bay Area Stadium', stage: 'group' },
  { home: 'Portugal', away: 'Congo DR', date: '2026-06-17', time: '17:00', venue: 'Houston Stadium', stage: 'group' },
  { home: 'England', away: 'Croatia', date: '2026-06-17', time: '20:00', venue: 'Dallas Stadium', stage: 'group' },
  { home: 'Ghana', away: 'Panama', date: '2026-06-17', time: '23:00', venue: 'Toronto Stadium', stage: 'group' },
  { home: 'Uzbekistan', away: 'Colombia', date: '2026-06-18', time: '02:00', venue: 'Mexico City Stadium', stage: 'group' },
  { home: 'Czechia', away: 'South Africa', date: '2026-06-18', time: '16:00', venue: 'Atlanta Stadium', stage: 'group' },
  { home: 'Switzerland', away: 'Bosnia & Herzegovina', date: '2026-06-18', time: '19:00', venue: 'Los Angeles Stadium', stage: 'group' },
  { home: 'Canada', away: 'Qatar', date: '2026-06-18', time: '22:00', venue: 'BC Place', stage: 'group' },
  { home: 'Mexico', away: 'Korea Republic', date: '2026-06-19', time: '01:00', venue: 'Guadalajara Stadium', stage: 'group' },
  { home: 'USA', away: 'Australia', date: '2026-06-19', time: '07:00', venue: 'Seattle Stadium', stage: 'group' },
  { home: 'Scotland', away: 'Morocco', date: '2026-06-19', time: '22:00', venue: 'Boston Stadium', stage: 'group' },
  { home: 'Brazil', away: 'Haiti', date: '2026-06-20', time: '00:30', venue: 'Philadelphia Stadium', stage: 'group' },
  { home: 'Türkiye', away: 'Paraguay', date: '2026-06-20', time: '04:00', venue: 'San Francisco Bay Area Stadium', stage: 'group' },
  { home: 'Netherlands', away: 'Sweden', date: '2026-06-20', time: '17:00', venue: 'Houston Stadium', stage: 'group' },
  { home: 'Germany', away: 'Côte d\'Ivoire', date: '2026-06-20', time: '20:00', venue: 'Toronto Stadium', stage: 'group' },
  { home: 'Ecuador', away: 'Curacao', date: '2026-06-21', time: '00:00', venue: 'Kansas City Stadium', stage: 'group' },
  { home: 'Tunisia', away: 'Japan', date: '2026-06-21', time: '04:00', venue: 'Monterrey Stadium', stage: 'group' },
  { home: 'Spain', away: 'Saudi Arabia', date: '2026-06-21', time: '16:00', venue: 'Atlanta Stadium', stage: 'group' },
  { home: 'Belgium', away: 'IR Iran', date: '2026-06-21', time: '19:00', venue: 'Los Angeles Stadium', stage: 'group' },
  { home: 'Uruguay', away: 'Cabo Verde', date: '2026-06-21', time: '22:00', venue: 'Miami Stadium', stage: 'group' },
  { home: 'New Zealand', away: 'Egypt', date: '2026-06-22', time: '01:00', venue: 'BC Place', stage: 'group' },
  { home: 'Argentina', away: 'Austria', date: '2026-06-22', time: '17:00', venue: 'Dallas Stadium', stage: 'group' },
  { home: 'France', away: 'Iraq', date: '2026-06-22', time: '21:00', venue: 'Philadelphia Stadium', stage: 'group' },
  { home: 'Norway', away: 'Senegal', date: '2026-06-23', time: '00:00', venue: 'New York New Jersey Stadium', stage: 'group' },
  { home: 'Jordan', away: 'Algeria', date: '2026-06-23', time: '03:00', venue: 'San Francisco Bay Area Stadium', stage: 'group' },
  { home: 'Portugal', away: 'Uzbekistan', date: '2026-06-23', time: '17:00', venue: 'Houston Stadium', stage: 'group' },
  { home: 'England', away: 'Ghana', date: '2026-06-23', time: '20:00', venue: 'Boston Stadium', stage: 'group' },
  { home: 'Panama', away: 'Croatia', date: '2026-06-23', time: '23:00', venue: 'Toronto Stadium', stage: 'group' },
  { home: 'Colombia', away: 'Congo DR', date: '2026-06-24', time: '02:00', venue: 'Guadalajara Stadium', stage: 'group' },
  { home: 'Switzerland', away: 'Canada', date: '2026-06-24', time: '19:00', venue: 'BC Place', stage: 'group' },
  { home: 'Bosnia & Herzegovina', away: 'Qatar', date: '2026-06-24', time: '19:00', venue: 'Seattle Stadium', stage: 'group' },
  { home: 'Scotland', away: 'Brazil', date: '2026-06-24', time: '22:00', venue: 'Miami Stadium', stage: 'group' },
  { home: 'Morocco', away: 'Haiti', date: '2026-06-24', time: '22:00', venue: 'Atlanta Stadium', stage: 'group' },
  { home: 'Czechia', away: 'Mexico', date: '2026-06-25', time: '01:00', venue: 'Mexico City Stadium', stage: 'group' },
  { home: 'South Africa', away: 'Korea Republic', date: '2026-06-25', time: '01:00', venue: 'Monterrey Stadium', stage: 'group' },
  { home: 'Curacao', away: 'Côte d\'Ivoire', date: '2026-06-25', time: '20:00', venue: 'Philadelphia Stadium', stage: 'group' },
  { home: 'Ecuador', away: 'Germany', date: '2026-06-25', time: '20:00', venue: 'New York New Jersey Stadium', stage: 'group' },
  { home: 'Japan', away: 'Sweden', date: '2026-06-25', time: '23:00', venue: 'Dallas Stadium', stage: 'group' },
  { home: 'Tunisia', away: 'Netherlands', date: '2026-06-25', time: '23:00', venue: 'Kansas City Stadium', stage: 'group' },
  { home: 'Türkiye', away: 'USA', date: '2026-06-26', time: '02:00', venue: 'Los Angeles Stadium', stage: 'group' },
  { home: 'Paraguay', away: 'Australia', date: '2026-06-26', time: '02:00', venue: 'San Francisco Bay Area Stadium', stage: 'group' },
  { home: 'Norway', away: 'France', date: '2026-06-26', time: '19:00', venue: 'Boston Stadium', stage: 'group' },
  { home: 'Senegal', away: 'Iraq', date: '2026-06-26', time: '19:00', venue: 'Toronto Stadium', stage: 'group' },
  { home: 'Cabo Verde', away: 'Saudi Arabia', date: '2026-06-27', time: '00:00', venue: 'Houston Stadium', stage: 'group' },
  { home: 'Uruguay', away: 'Spain', date: '2026-06-27', time: '00:00', venue: 'Guadalajara Stadium', stage: 'group' },
  { home: 'Egypt', away: 'IR Iran', date: '2026-06-27', time: '03:00', venue: 'Seattle Stadium', stage: 'group' },
  { home: 'New Zealand', away: 'Belgium', date: '2026-06-27', time: '03:00', venue: 'BC Place', stage: 'group' },
  { home: 'Panama', away: 'England', date: '2026-06-27', time: '21:00', venue: 'New York New Jersey Stadium', stage: 'group' },
  { home: 'Croatia', away: 'Ghana', date: '2026-06-27', time: '21:00', venue: 'Philadelphia Stadium', stage: 'group' },
  { home: 'Colombia', away: 'Portugal', date: '2026-06-28', time: '23:30', venue: 'Miami Stadium', stage: 'group' },
  { home: 'Congo DR', away: 'Uzbekistan', date: '2026-06-28', time: '23:30', venue: 'Atlanta Stadium', stage: 'group' },
  { home: 'Algeria', away: 'Austria', date: '2026-06-28', time: '02:00', venue: 'Kansas City Stadium', stage: 'group' },
  { home: 'Jordan', away: 'Argentina', date: '2026-06-28', time: '02:00', venue: 'Dallas Stadium', stage: 'group' },

  // Round of 32 (June 28 - July 3)
  { home: '2nd A', away: '2nd B', date: '2026-06-28', time: '19:00', venue: 'Los Angeles Stadium', stage: 'round-of-32' },
  { home: '1st C', away: '2nd F', date: '2026-06-29', time: '17:00', venue: 'Houston Stadium', stage: 'round-of-32' },
  { home: '1st E', away: '3rd Place', date: '2026-06-29', time: '20:30', venue: 'Boston Stadium', stage: 'round-of-32' },
  { home: '1st F', away: '2nd C', date: '2026-06-30', time: '01:00', venue: 'Monterrey Stadium', stage: 'round-of-32' },
  { home: '2nd E', away: '2nd I', date: '2026-06-30', time: '17:00', venue: 'Dallas Stadium', stage: 'round-of-32' },
  { home: '1st I', away: '3rd Place', date: '2026-06-30', time: '21:00', venue: 'New York New Jersey Stadium', stage: 'round-of-32' },
  { home: '1st A', away: '3rd Place', date: '2026-07-01', time: '01:00', venue: 'Mexico City Stadium', stage: 'round-of-32' },
  { home: '1st G', away: '3rd Place', date: '2026-07-01', time: '20:00', venue: 'Seattle Stadium', stage: 'round-of-32' },
  { home: '1st L', away: '3rd Place', date: '2026-07-01', time: '16:00', venue: 'Atlanta Stadium', stage: 'round-of-32' },
  { home: '1st D', away: '3rd Place', date: '2026-07-02', time: '00:00', venue: 'San Francisco Bay Area Stadium', stage: 'round-of-32' },
  { home: '1st H', away: '2nd J', date: '2026-07-02', time: '19:00', venue: 'Los Angeles Stadium', stage: 'round-of-32' },
  { home: '2nd K', away: '2nd L', date: '2026-07-02', time: '23:00', venue: 'Toronto Stadium', stage: 'round-of-32' },
  { home: '1st B', away: '3rd Place', date: '2026-07-03', time: '03:00', venue: 'BC Place', stage: 'round-of-32' },
  { home: '2nd D', away: '2nd G', date: '2026-07-03', time: '18:00', venue: 'Dallas Stadium', stage: 'round-of-32' },
  { home: '1st J', away: '2nd H', date: '2026-07-03', time: '22:00', venue: 'Miami Stadium', stage: 'round-of-32' },
  { home: '1st K', away: '3rd Place', date: '2026-07-04', time: '01:30', venue: 'Kansas City Stadium', stage: 'round-of-32' },

  // Round of 16 (July 4-7)
  { home: 'W74', away: 'W77', date: '2026-07-04', time: '19:00', venue: 'Houston Stadium', stage: 'round-of-16' },
  { home: 'W73', away: 'W75', date: '2026-07-04', time: '23:00', venue: 'Philadelphia Stadium', stage: 'round-of-16' },
  { home: 'W76', away: 'W78', date: '2026-07-05', time: '04:00', venue: 'New York New Jersey Stadium', stage: 'round-of-16' },
  { home: 'W79', away: 'W80', date: '2026-07-05', time: '20:00', venue: 'Mexico City Stadium', stage: 'round-of-16' },
  { home: 'W83', away: 'W84', date: '2026-07-06', time: '19:00', venue: 'Los Angeles Stadium', stage: 'round-of-16' },
  { home: 'W81', away: 'W82', date: '2026-07-06', time: '23:00', venue: 'Seattle Stadium', stage: 'round-of-16' },
  { home: 'W85', away: 'W87', date: '2026-07-07', time: '04:00', venue: 'BC Place', stage: 'round-of-16' },
  { home: 'W86', away: 'W88', date: '2026-07-07', time: '20:00', venue: 'Atlanta Stadium', stage: 'round-of-16' },

  // Quarter-finals (July 9-11)
  { home: 'W89', away: 'W90', date: '2026-07-09', time: '04:00', venue: 'Boston Stadium', stage: 'quarter-final' },
  { home: 'W93', away: 'W94', date: '2026-07-10', time: '21:00', venue: 'Los Angeles Stadium', stage: 'quarter-final' },
  { home: 'W91', away: 'W92', date: '2026-07-11', time: '01:00', venue: 'Miami Stadium', stage: 'quarter-final' },
  { home: 'W95', away: 'W96', date: '2026-07-11', time: '03:00', venue: 'Kansas City Stadium', stage: 'quarter-final' },

  // Semi-finals (July 14-15)
  { home: 'W97', away: 'W98', date: '2026-07-14', time: '01:00', venue: 'Dallas Stadium', stage: 'semi-final' },
  { home: 'W99', away: 'W100', date: '2026-07-15', time: '01:00', venue: 'Atlanta Stadium', stage: 'semi-final' },

  // Final (July 19)
  { home: 'W101', away: 'W102', date: '2026-07-19', time: '20:00', venue: 'New York New Jersey Stadium', stage: 'final' },
];

export async function seedFixtures() {
  try {
    console.log('🌍 Seeding 2026 World Cup fixtures (official schedule)...\n');

    let insertedCount = 0;

    for (const fixture of FIXTURES_2026) {
      // Parse datetime (using UTC)
      const kickoffUtc = new Date(`${fixture.date}T${fixture.time}:00Z`);

      if (isNaN(kickoffUtc.getTime())) {
        console.warn(`Skipping match with invalid date: ${fixture.date}T${fixture.time}`);
        continue;
      }

      const externalRef = `${fixture.home}_${fixture.away}_${fixture.date}`;

      // Check if match already exists
      const existing = await query(
        'SELECT id FROM matches WHERE external_ref = $1',
        [externalRef],
      );

      if (existing.rows.length > 0) {
        continue;
      }

      // Insert match
      await query(
        `INSERT INTO matches
        (external_ref, stage, "group", team_home, team_away, kickoff_utc, venue, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'open')`,
        [externalRef, fixture.stage, fixture.group || null, fixture.home, fixture.away, kickoffUtc, fixture.venue],
      );

      insertedCount++;
    }

    console.log(`✅ Successfully inserted ${insertedCount} matches\n`);
    console.log(`📅 2026 FIFA World Cup Schedule:`);
    console.log(`   • Group Stage: June 11 - June 27`);
    console.log(`   • Round of 32: June 28 - July 4`);
    console.log(`   • Round of 16: July 4-7`);
    console.log(`   • Quarter-finals: July 9-11`);
    console.log(`   • Semi-finals: July 14-15`);
    console.log(`   • Final: July 19`);
  } catch (error) {
    console.error('Error seeding fixtures:', error);
    throw error;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedFixtures().then(() => process.exit(0)).catch(() => process.exit(1));
}
