export interface ReportMember {
  name: string;
  personalAum: number;
  profitLossAmount: number;
  rdCost: number;
  investmentReceived: number;
  withdrawalAmount: number;
  clientMoney: number;
  payoutPercentage: number;
  payoutAmount: number;
}

export interface InvestmentPatternItem {
  name: string;
  amount: number;
}

export type PayoutStatus = 'paid' | 'pending';

export interface PartnerPayout {
  name: string;
  percentage: number;
  amount: number;
  status: PayoutStatus;
}

export interface ReportLineItem {
  description: string;
  amount: number;
}

// List view — the backend deliberately omits the heavier JSONB blobs here.
export interface MonthlyReportSummary {
  id: string;
  month: number;
  year: number;
  total_aum_next_month: number | string;
  nav_updated: number | string;
  overall_profit_percentage: number | string;
  overall_profit_amount: number | string;
  client_payout_amount: number | string;
  operating_capital_total: number | string;
  pdf_url: string | null;
  generated_pdf_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface MonthlyReport extends MonthlyReportSummary {
  nav_previous: number | string;
  client_payout_percentage: number | string;
  client_total_money: number | string;
  client_payout_status: PayoutStatus;
  company_result_amount: number | string;
  profit_saving_percentage: number | string;
  profit_saving_amount: number | string;
  profit_saving_left_amount: number | string;
  employees_payout_amount: number | string;
  members: ReportMember[];
  investment_pattern: InvestmentPatternItem[];
  partner_payouts: PartnerPayout[];
  withdrawals: ReportLineItem[];
  investments: ReportLineItem[];
  notes: string | null;
}

export interface ReportPrefill {
  previousMonth: number | null;
  previousYear: number | null;
  navPrevious: number;
  investmentPattern: InvestmentPatternItem[];
  members: ReportMember[];
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
