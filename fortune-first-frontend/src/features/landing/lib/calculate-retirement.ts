export interface RetirementResult {
  yearsToRetirement: number;
  yearsInRetirement: number;
  futureMonthlyExpense: number;
  corpusRequired: number;
  monthlySipRequired: number;
  totalContributions: number;
  growthFromReturns: number;
}

/**
 * Two-stage retirement projection:
 * 1. Inflate today's monthly expense forward to the retirement date, then size the
 *    corpus needed to fund that (inflation-adjusted) expense for the retirement years,
 *    using the real rate of return (nominal return net of inflation) as the discount rate.
 * 2. Back-solve the monthly SIP (standard SIP future-value formula, inverted) needed
 *    between now and retirement to accumulate that corpus.
 */
export function calculateRetirement(
  currentAge: number,
  retirementAge: number,
  lifeExpectancy: number,
  currentMonthlyExpense: number,
  inflationPct: number,
  returnPct: number
): RetirementResult {
  const yearsToRetirement = Math.max(retirementAge - currentAge, 0);
  const yearsInRetirement = Math.max(lifeExpectancy - retirementAge, 1);

  const inflation = inflationPct / 100;
  const returnRate = returnPct / 100;

  const futureMonthlyExpense = currentMonthlyExpense * Math.pow(1 + inflation, yearsToRetirement);
  const futureAnnualExpense = futureMonthlyExpense * 12;

  const realReturnRate = (1 + returnRate) / (1 + inflation) - 1;
  const corpusRequired =
    realReturnRate <= 0
      ? futureAnnualExpense * yearsInRetirement
      : futureAnnualExpense * ((1 - Math.pow(1 + realReturnRate, -yearsInRetirement)) / realReturnRate);

  const monthlyRate = returnRate / 12;
  const months = yearsToRetirement * 12;

  let monthlySipRequired: number;
  if (months <= 0) {
    monthlySipRequired = corpusRequired;
  } else if (monthlyRate === 0) {
    monthlySipRequired = corpusRequired / months;
  } else {
    const factor = ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
    monthlySipRequired = corpusRequired / factor;
  }

  const totalContributions = monthlySipRequired * months;
  const growthFromReturns = corpusRequired - totalContributions;

  return {
    yearsToRetirement,
    yearsInRetirement,
    futureMonthlyExpense: Math.round(futureMonthlyExpense),
    corpusRequired: Math.round(corpusRequired),
    monthlySipRequired: Math.round(monthlySipRequired),
    totalContributions: Math.round(totalContributions),
    growthFromReturns: Math.round(growthFromReturns),
  };
}
