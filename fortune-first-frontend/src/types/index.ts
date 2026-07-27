// ── User Roles ──────────────────────────────────────────────
export type UserRole = 'customer' | 'investment_head' | 'business_head' | 'super_admin';

// ── Investment Status ───────────────────────────────────────
export type InvestmentStatus = 'active' | 'exited' | 'suspended';

// ── Payout Status ───────────────────────────────────────────
export type PayoutStatus = 'pending' | 'paid' | 'skipped';

// ── User ────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string | null;
  is_active: boolean;
  must_change_password: boolean;
  assigned_to?: string | null;
  shareholding_pct?: number;
  created_at: string;
  updated_at: string;
}

// ── Investment ──────────────────────────────────────────────
export interface Investment {
  id: string;
  customer_id: string;
  customer_name?: string;
  recorded_by?: string | null;
  amount: number;
  investment_date: string;
  week_of_month: number;
  tenure_months: number;
  status: InvestmentStatus;
  exit_date?: string | null;
  notes?: string | null;
  created_at: string;
}

// ── Monthly Return / Payout ─────────────────────────────────
export interface MonthlyReturn {
  id: string;
  investment_id: string;
  month: number;
  year: number;
  return_pct: number;
  payout_amount: number;
  payout_status: PayoutStatus;
  payout_date?: string | null;
  processed_by?: string | null;
}

// ── Auth ────────────────────────────────────────────────────
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  assigned_to?: string | null;
  shareholding_pct?: number | null;
}

// ── Investment Payloads ─────────────────────────────────────
export interface CreateInvestmentPayload {
  customer_id: string;
  amount: number;
  investment_date: string;
  week_of_month: number;
  tenure_months?: number;
  notes?: string;
}

export interface UpdateInvestmentStatusPayload {
  status: InvestmentStatus;
  exit_date?: string | null;
}

// ── Payout Payloads ─────────────────────────────────────────
export interface RecordPayoutPayload {
  investment_id: string;
  month: number;
  year: number;
  return_pct: number;
  payout_amount: number;
}

export interface UpdatePayoutStatusPayload {
  payout_status: PayoutStatus;
  payout_date?: string | null;
}

// ── API Response Wrappers ───────────────────────────────────
export interface ApiResponse<T = unknown> {
  status: string;
  message?: string;
  data: T;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}
