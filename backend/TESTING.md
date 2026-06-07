# Testing Guide

## Overview

The backend has unit tests for critical business logic. Integration tests are provided as checklists for manual verification.

## Running Tests

### Unit Tests (Fast, No Database Required)

```bash
cd backend
npm test
```

This runs all unit tests for:
- **Scoring engine:** Point calculation for predictions (0, 2, or 3 points)
- **Lock enforcement:** Match locking at kickoff time

### Test Coverage

```bash
npm run test:coverage
```

View coverage report in `coverage/` directory.

### Watch Mode (Auto-rerun on file changes)

```bash
npm run test:watch
```

## Test Suites

### 1. Scoring Engine Tests (`scoring.test.ts`)

Tests the `scoreMatch()` function which is critical for calculating points.

**Test cases:**
- ✅ Exact score match → 3 points
- ✅ Correct outcome, wrong score → 2 points
- ✅ Incorrect outcome → 0 points
- ✅ Draw prediction + draw result → 3 points
- ✅ No result yet → 0 points
- ✅ Away win predictions
- ✅ Idempotency (same input always produces same output)

**Why it matters:**
The scoring logic is core business logic. Any bug here affects payouts to all players.

### 2. Lock Enforcement Tests (`lockEnforcement.test.ts`)

Tests the `isMatchLocked()` function which prevents predictions after kickoff.

**Test cases:**
- ✅ Future matches are unlocked
- ✅ Past matches are locked
- ✅ Exact kickoff time is locked
- ✅1 second before kickoff → unlocked
- ✅ 1 second after kickoff → locked
- ✅ Correct time formatting (e.g., "2h 15m")
- ✅ DST boundary handling
- ✅ UTC midnight handling

**Why it matters:**
Lock enforcement prevents unfair late predictions. Server-side checks prevent client-side manipulation.

### 3. Integration Checklist (`integration.test.ts`)

Manual verification checklist for the full workflow. These are skipped in automated tests but listed as reminders.

**Manual checks:**
1. Database schema created
2. Migrations run successfully
3. Fixtures seeded
4. Backend starts without errors
5. Frontend starts without errors
6. API endpoints respond
7. Registration workflow works end-to-end
8. Prediction entry and lock work correctly
9. Result import calculates scores
10. Leaderboard rankings are accurate

## Running Before Deployment

Before deploying to production:

```bash
# Run all unit tests
npm test

# Type check TypeScript
npm run type-check

# Build for production
npm run build

# Verify database migrations
npm run migrate

# Seed test data (if needed)
npm run seed
```

## Common Issues

| Issue | Solution |
|-------|----------|
| "Cannot find module" errors | Run `npm install` |
| Tests timeout | Increase Jest timeout: `jest.setTimeout(10000)` |
| TypeScript errors | Run `npm run type-check` to see errors |
| Database connection errors | Tests don't require DB (integration tests are skipped) |

## Test Structure

```
backend/src/__tests__/
├── scoring.test.ts           # Unit: Point calculation
├── lockEnforcement.test.ts    # Unit: Match locking
└── integration.test.ts        # Manual checklist (skipped in CI)
```

## Continuous Integration

GitHub Actions runs unit tests on every commit:

```yaml
# .github/workflows/test.yml (if added)
runs:
  - npm test
  - npm run type-check
```

## Coverage Requirements

Current thresholds (can be adjusted in `jest.config.js`):
- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

To check current coverage:

```bash
npm run test:coverage
```

## Adding New Tests

When adding features:

1. **Write tests first** (TDD approach) or **after the feature**
2. **Test the happy path** (normal cases)
3. **Test edge cases** (boundaries, null values, etc.)
4. **Test error cases** (invalid input, etc.)

Example:

```typescript
describe('MyFeature', () => {
  it('should do X when given Y', () => {
    expect(myFunction(input)).toBe(expectedOutput);
  });

  it('should handle edge case Z', () => {
    expect(myFunction(edgeCase)).toBe(expectedOutput);
  });
});
```

## Performance Testing

The scoring engine should be fast even with many predictions:

```typescript
it('should score 1000 predictions in < 100ms', () => {
  const start = performance.now();
  for (let i = 0; i < 1000; i++) {
    scoreMatch(prediction, match);
  }
  const elapsed = performance.now() - start;
  expect(elapsed).toBeLessThan(100);
});
```

---

Ready to test? Run `npm test` and verify all tests pass! ✅
