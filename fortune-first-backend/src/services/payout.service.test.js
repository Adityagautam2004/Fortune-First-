const { calculatePayout } = require('./payout.service');

// Matches the "Critical Test Cases for Payout Logic" in the SDLC doc, plus the
// full 4x4 investment-week/exit-week matrix from the SRS payout rules (3.4.5).

describe('calculatePayout — investment week proration (first month)', () => {
  test('Week 1 investment → full payout that month', () => {
    expect(calculatePayout(10000, 2, 1, null, true)).toBe(200);
  });

  test('Week 2 investment → fixed 1% that month, regardless of returnPct', () => {
    expect(calculatePayout(10000, 2, 2, null, true)).toBe(100);
  });

  test('Week 3 investment → 0% that month (payout starts next month)', () => {
    expect(calculatePayout(10000, 2, 3, null, true)).toBe(0);
  });

  test('Week 4 investment → 0% that month (payout starts next month)', () => {
    expect(calculatePayout(10000, 2, 4, null, true)).toBe(0);
  });
});

describe('calculatePayout — exit week proration (final month)', () => {
  test('Week 1 exit → 0% profit that month', () => {
    expect(calculatePayout(10000, 2, 1, 1, false)).toBe(0);
  });

  test('Week 2 exit → 0.5% profit that month', () => {
    expect(calculatePayout(10000, 2, 1, 2, false)).toBe(50);
  });

  test('Week 3 exit → 1.0% profit that month', () => {
    expect(calculatePayout(10000, 2, 1, 3, false)).toBe(100);
  });

  test('Week 4 exit → full profit that month', () => {
    expect(calculatePayout(10000, 2, 1, 4, false)).toBe(200);
  });
});

describe('calculatePayout — normal (non-first, non-exit) month', () => {
  test('applies returnPct directly against the invested amount', () => {
    expect(calculatePayout(50000, 2, 1, null, false)).toBe(1000);
  });

  test('SDLC Test 4: amount=10000, return%=1.5 → payout = 150.00 exactly (NUMERIC precision)', () => {
    expect(calculatePayout(10000, 1.5, 1, null, false)).toBe(150);
  });

  test('zero return percentage yields zero payout', () => {
    expect(calculatePayout(20000, 0, 1, null, false)).toBe(0);
  });
});

describe('calculatePayout — financial precision', () => {
  test('rounds to exactly 2 decimal places, never leaking floating-point error', () => {
    const result = calculatePayout(33333, 1.1, 1, null, false);
    expect(result).toBe(366.66);
    expect(Number.isInteger(result * 100)).toBe(true);
  });
});
