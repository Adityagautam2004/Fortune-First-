// Deliberately simple: month/year, three headline numbers, and the
// uploaded PDF as the actual artifact.
export interface MonthlyReport {
  id: string;
  month: number;
  year: number;
  operating_capital_total: number | string;
  total_payout: number | string;
  total_profit: number | string;
  pdf_url: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Aggregated across every report matching the current filters, not just the
// current page.
export interface ReportsSummary {
  count: number;
  latestOperatingCapital: number;
  totalPayout: number;
  totalProfit: number;
}
