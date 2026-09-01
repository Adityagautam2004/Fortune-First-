// One row per CLIENT — their several active investments are summed into
// one aggregate figure, anchored on the earliest one's week_of_month.
export interface PendingPayout {
  customer_id: string;
  client_name: string;
  amount: number | string;
  week_of_month: number;
  earliest_investment_date: string;
}

export interface AdminDashboardStats {
  totalClients: number;
  totalAum: number;
  monthlyPayouts: number;
}

export interface AdminSupportTicket {
  id: string;
  subject: string;
  category: string;
  message: string;
  status: string;
  created_at: string;
  customer_name: string;
  email: string;
}

export interface AdminInvestmentRow {
  id: string;
  amount: number | string;
  status: string;
  investment_date: string;
  customer_name: string;
  customer_email: string;
  payment_screenshot_url?: string | null;
}

export interface AdminWithdrawalRow {
  id: string;
  amount: number | string;
  status: string;
  withdrawal_date: string;
  customer_name: string;
  customer_email: string;
  payment_screenshot_url?: string | null;
}

export interface AdminTransactionRow {
  type: 'investment' | 'withdrawal' | 'payout';
  id: string;
  customer_id: string;
  customer_name: string;
  amount: number | string;
  status: string;
  date: string;
  screenshot_url?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface AdminPayoutRow {
  id: string;
  customer_id: string;
  month: number;
  year: number;
  invested_amount: number | string;
  return_pct: number | string;
  payout_amount: number | string;
  payout_status: string;
  payout_date: string | null;
  customer_name: string;
  customer_email: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
