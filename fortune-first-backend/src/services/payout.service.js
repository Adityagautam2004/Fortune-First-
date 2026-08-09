/**
 * Pure function to calculate payout based on Fortune First rules.
 * No database calls, no side effects. Highly testable.
 */
const calculatePayout = (amount, returnPct, investmentWeek, exitWeek = null, isFirstMonth = false) => {
  let applicableReturnPct = returnPct;

  // Investment Proration Rules (First Month Only)
  if (isFirstMonth) {
    if (investmentWeek === 1) applicableReturnPct = returnPct;
    else if (investmentWeek === 2) applicableReturnPct = 1.0; 
    else if (investmentWeek === 3) applicableReturnPct = 0.0; // Payout starts next month at 2%
    else if (investmentWeek === 4) applicableReturnPct = 0.0; // Payout starts next month normally
  }

  // Exit Proration Rules (Final Month)
  if (exitWeek) {
    if (exitWeek === 1) applicableReturnPct = 0.0;
    else if (exitWeek === 2) applicableReturnPct = 0.5;
    else if (exitWeek === 3) applicableReturnPct = 1.0;
    else if (exitWeek === 4) applicableReturnPct = returnPct;
  }

  // Calculate actual monetary payout
  const decimalReturn = applicableReturnPct / 100;
  const rawPayout = amount * decimalReturn;

  // Return to 2 decimal places (financial precision)
  return parseFloat(rawPayout.toFixed(2));
};

module.exports = { calculatePayout };