export interface SipResult {
  investedAmount: number;
  estimatedReturns: number;
  totalValue: number;
}

/**
 * Standard SIP future-value formula: FV = P × [((1+i)^n - 1) / i] × (1+i)
 * P = monthly investment, i = monthly rate, n = number of months.
 */
export function calculateSip(monthlyInvestment: number, annualRatePct: number, years: number): SipResult {
  const months = Math.round(years * 12);
  const monthlyRate = annualRatePct / 100 / 12;

  const investedAmount = monthlyInvestment * months;

  let totalValue: number;
  if (monthlyRate === 0) {
    totalValue = investedAmount;
  } else {
    totalValue =
      monthlyInvestment * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
  }

  const estimatedReturns = totalValue - investedAmount;

  return {
    investedAmount: Math.round(investedAmount),
    estimatedReturns: Math.round(estimatedReturns),
    totalValue: Math.round(totalValue),
  };
}
