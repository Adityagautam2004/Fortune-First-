export interface EmiResult {
  emi: number;
  principal: number;
  totalInterest: number;
  totalPayment: number;
}

/**
 * Standard EMI formula: EMI = P × r × (1+r)^n / [(1+r)^n - 1]
 * P = principal, r = monthly interest rate, n = number of months.
 */
export function calculateEmi(principal: number, annualRatePct: number, tenureYears: number): EmiResult {
  const months = Math.round(tenureYears * 12);
  const monthlyRate = annualRatePct / 100 / 12;

  let emi: number;
  if (monthlyRate === 0) {
    emi = principal / months;
  } else {
    const factor = Math.pow(1 + monthlyRate, months);
    emi = (principal * monthlyRate * factor) / (factor - 1);
  }

  const totalPayment = emi * months;
  const totalInterest = totalPayment - principal;

  return {
    emi: Math.round(emi),
    principal: Math.round(principal),
    totalInterest: Math.round(totalInterest),
    totalPayment: Math.round(totalPayment),
  };
}
