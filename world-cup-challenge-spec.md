# World Cup Challenge — Software Specification

**Version:** 0.1 (draft for review)
**Date:** June 4, 2026
**Status:** Draft — see Open Questions before build starts

-----

## 1. Overview

### 1.1 Purpose

A lightweight web application where a closed group of participants predict the results of FIFA World Cup 2026 matches, earn points for accurate predictions, and compete on a leaderboard.

### 1.2 Context & timing

The 2026 World Cup runs **June 11 – July 19, 2026** (48 teams, 104 matches, hosted across the USA, Mexico, and Canada). The build window before kickoff is roughly one week, which directly shapes the MVP scope in Section 12.

### 1.3 Scale

- Maximum **100 participants** (closed, invite-only group).
- Low traffic; designed to run comfortably on free hosting tiers.

### 1.4 Key constraints

- **Free hosting** is a hard requirement.
- **Email only** for notifications. WhatsApp is explicitly **out of scope** (no free programmatic API; requires a paid Business Solution Provider and pre-approved templates with lead time that does not fit the schedule).

-----

## 2. Users & Roles

### 2.1 Participant

A registered user who submits predictions and competes on the leaderboard.

### 2.2 Administrator

A privileged user who can view all participants’ predictions and rankings and invite new users by email. The admin is also a participant (can make predictions) unless configured otherwise.

-----

## 3. Functional Requirements

### 3.1 Registration & authentication

- A user registers with: **nickname**, **email address**, and a **password**.
- Email must be unique. Nickname must be unique (shown on the leaderboard).
- Passwords stored as a salted hash (bcrypt). Never stored or logged in plaintext.
- Login by email + password. Session via secure HTTP-only cookie (or JWT).
- Password reset by emailed link (token, single-use, time-limited).
- Registration is **invite-gated**: a user can only register via an admin invite link/token tied to their email (see 3.7).

### 3.2 Match listing

- Display matches grouped by day, with team names, kickoff time (in the user’s local time zone), venue, and stage/group.
- Clearly indicate each match’s state: **Open** (accepting predictions), **Locked** (kickoff passed), **Finished** (result available).
- Show today’s and upcoming matches by default; allow browsing past matches and results.

### 3.3 Entering & editing predictions

- For each **Open** match a participant enters a predicted score (e.g. `2 – 1`).
- A prediction is editable an **unlimited** number of times until the match locks.
- A match **locks at kickoff time**. After lock, no create/edit is permitted.
- The user can submit predictions for all of a given day’s matches in one screen.
- Server-side enforcement of the lock — never trust the client clock.

### 3.4 Scoring

Points are awarded automatically once a match’s final result is imported.

|Outcome                                                    |Points|
|-----------------------------------------------------------|------|
|Correct **outcome** (predicted the right winner, or a draw)|2     |
|Correct **exact score** (also matched both teams’ goals)   |+1    |
|**Maximum per match** (exact score implies correct outcome)|**3** |
|Incorrect outcome                                          |0     |


> **Assumption flagged for confirmation:** This interprets the brief (“2 points for correct winner/draw, 1 point for correct result”) as *additive* — an exact-score prediction earns the 2 outcome points plus 1 bonus = 3 total. Most prediction pools reward the exact score most highly, so this matches that convention. Confirm before build. If instead exact score should award only 1 point (non-additive), the table changes. See Open Questions.

- Scoring is idempotent: re-running it on the same result must not change totals.
- If a result is later corrected, scores recompute for that match.

### 3.5 Leaderboard

- Ranked table of all participants by total points (descending).
- Tie-break rule: TBD (suggested: most exact-score hits, then earliest registration). See Open Questions.
- Updates after each match’s result is imported.

### 3.6 Personal view

Each participant can see their own:

- Current total score and rank.
- Full prediction history (prediction vs. actual result, points earned per match).

### 3.7 Administrator functions

- View **all** participants’ predictions for any match (including locked/finished).
- View the full ranking and per-user breakdown.
- **Invite new users by email**: enter an email → system sends an invite with a single-use registration link. Track invite status (sent / accepted).
- Optional: deactivate a user.

### 3.8 Notifications (email only)

- **Prediction reminder:** ~10 minutes before each match kickoff, email participants who have not yet entered a prediction for that match. (Reminding only the people who haven’t predicted reduces noise; reminding everyone is the simpler alternative — see Open Questions.)
- Email for: registration confirmation, password reset, and admin invites.
- Use a free-tier transactional email provider (e.g. Resend or Brevo). Include an unsubscribe/notification-preference option for reminder emails.

-----

## 4. Data Source (match fixtures & results)

- **Fixtures (schedule):** `openfootball/worldcup.json` — public-domain JSON, no API key required, already contains the 2026 schedule. Used to seed matches.
- **Results & standings:** API-Football free tier (`league=1&season=2026`) — provides the full 104-match schedule, results, standings, and bracket. The free tier caps daily requests, so poll results on an interval (e.g. every few minutes during/after matches) rather than streaming truly live.
- Import is a backend job; the app never depends on the data source being reachable in real time during a user request.

-----

## 5. Technology & Architecture

### 5.1 Stack

- **Frontend:** React (single-page app). Mobile-friendly responsive layout.
- **Backend:** A single small web service (Node.js or Python).
- **Database:** PostgreSQL.
- **Hosting:** Render free tier — web service + free Postgres + static frontend, no credit card. Note: free services sleep after inactivity and cold-start in a few seconds; acceptable at this scale.
- **Email:** Resend or Brevo free tier.
- **Scheduler:** external cron (GitHub Actions schedule or cron-job.org) that pings backend endpoints every ~5 minutes. This both (a) triggers reminder/result-import jobs and (b) keeps the Render service awake.

### 5.2 Why not other hosts

Fly.io no longer offers a free tier for new users; Railway’s free credit only covers a few hours of runtime. Render’s permanent free tier fits the “free + always available” goal best.

### 5.3 Background jobs

- **Result importer:** polls the data source, updates match results, triggers scoring.
- **Reminder dispatcher:** finds matches kicking off in ~10 minutes and emails participants without a prediction.
- **Lock enforcement:** matches lock by comparing server time to kickoff; no separate job strictly required, but state can be refreshed by the cron.

-----

## 6. Data Model (initial sketch)

**users**

- id, nickname (unique), email (unique), password_hash, is_admin (bool), notify_reminders (bool), created_at

**invites**

- id, email, token (unique), invited_by (user id), status (sent/accepted), created_at, accepted_at

**matches**

- id, external_ref, stage, group, team_home, team_away, kickoff_utc, venue, status (open/locked/finished), score_home (nullable), score_away (nullable), result_imported_at

**predictions**

- id, user_id, match_id, pred_home, pred_away, points (nullable until scored), created_at, updated_at
- Unique constraint on (user_id, match_id).

**Derived (not stored):** leaderboard totals computed by summing `predictions.points` per user, or maintained in a materialized/cached total for speed.

-----

## 7. Non-Functional Requirements

### 7.1 Time zones

- Store all match times in **UTC**. Convert to each user’s local time for display. Critical because matches span three host countries and participants may be anywhere.

### 7.2 Security

- HTTPS only. Passwords hashed (bcrypt). HTTP-only secure session cookies.
- Server-side authorization on every endpoint (participants cannot see others’ open predictions; only admins see all).
- Single-use, expiring tokens for invites and password resets.
- Basic rate limiting on login and registration.

### 7.3 Integrity

- Prediction lock enforced server-side against server time.
- Scoring idempotent and recomputable.

### 7.4 Availability

- Acceptable to have brief cold-start delays on the free tier. Cron keep-alive mitigates this around match times.

-----

## 8. User Interface (high level)

- **Login / Register** (register only via invite link).
- **Today / Upcoming:** list of matches with inline prediction entry; clear lock countdown and status badges.
- **My Stats:** total score, rank, prediction history.
- **Leaderboard:** ranked participant table.
- **Results:** past matches with final scores and standings/group tables.
- **Admin:** all predictions per match, full ranking, invite-by-email form.

-----

## 9. Out of Scope (v1)

- **WhatsApp notifications** — dropped (no free API; paid BSP + template approval lead time). Could be revisited post-tournament.
- **Telegram bot** — viable free alternative if a chat channel is later wanted.
- Live in-match minute-by-minute updates (only final results drive scoring).
- Knockout-stage-specific scoring nuances (extra time / penalties) beyond final result — confirm if needed.

-----

## 10. Open Questions (resolve before build)

1. **Scoring:** Confirm the additive interpretation (exact score = 3 points total). If not, specify the exact point values.
1. **Knockout matches:** For matches decided in extra time / penalties, is the “result” the 90-minute score, the after-extra-time score, or the final outcome including penalties?
1. **Leaderboard tie-break:** What rule? (Suggested: most exact-score hits, then earliest registration.)
1. **Reminder recipients:** Email only participants who haven’t predicted, or everyone?
1. **Admin as player:** Should the admin also appear on the leaderboard?
1. **Match selection scope:** All 104 matches predictable, or only from a chosen stage onward?

-----

## 11. Acceptance Criteria (MVP)

- A user can register only via an admin invite, then log in.
- A user can enter and freely edit a score prediction for any open match, and is blocked at kickoff.
- Final results import automatically and points are awarded per the scoring rules.
- The leaderboard and each user’s personal stats reflect scored results.
- Reminder emails are sent ~10 minutes before kickoff to the configured recipients.
- The admin can view all predictions and rankings and invite users by email.

-----

## 12. Suggested Build Plan (given ~1 week to kickoff)

**Phase 1 — Core (must-have before June 11):**
Registration/login via invite → fixtures seeded → prediction entry with kickoff lock → result import → scoring → leaderboard → personal stats.

**Phase 2 — Notifications:**
Email reminders (10 min before kickoff), confirmation/reset emails.

**Phase 3 — Admin polish:**
Full admin prediction view, invite tracking, user management.

**Phase 4 — Nice-to-have:**
Group/standings tables view, notification preferences, tie-break refinements.