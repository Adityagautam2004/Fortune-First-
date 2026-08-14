// Ported verbatim from fortune-first-backend/src/services/payout.service.js so the
// preview shown before submitting matches exactly what the server will actually persist.
export function calculatePayout(
  amount: number,
  returnPct: number,
  investmentWeek: number,
  exitWeek: number | null = null,
  isFirstMonth = false
): number {
  let applicableReturnPct = returnPct;

  if (isFirstMonth) {
    if (investmentWeek === 1) applicableReturnPct = returnPct;
    else if (investmentWeek === 2) applicableReturnPct = 1.0;
    else if (investmentWeek === 3) applicableReturnPct = 0.0;
    else if (investmentWeek === 4) applicableReturnPct = 0.0;
  }

  if (exitWeek) {
    if (exitWeek === 1) applicableReturnPct = 0.0;
    else if (exitWeek === 2) applicableReturnPct = 0.5;
    else if (exitWeek === 3) applicableReturnPct = 1.0;
    else if (exitWeek === 4) applicableReturnPct = returnPct;
  }

  const decimalReturn = applicableReturnPct / 100;
  const rawPayout = amount * decimalReturn;

  return parseFloat(rawPayout.toFixed(2));
}
