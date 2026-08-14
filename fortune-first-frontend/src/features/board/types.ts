export interface BoardClient {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  relationship_manager: string | null;
  total_invested: number | string;
  active_mandates: number | string;
}

export interface ClientProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  relationship_manager: string | null;
}

export interface ClientInvestment {
  id: string;
  amount: number | string;
  investment_date: string;
  week_of_month: number;
  tenure_months: number;
  status: 'active' | 'exited' | 'suspended';
  exit_date: string | null;
}

export interface ClientSummary {
  total_aum: number | string;
  active_mandates: number | string;
  total_investment_count: number | string;
  total_returns_ytd: number | string;
}

export interface ClientDetail {
  profile: ClientProfile;
  investments: ClientInvestment[];
  summary: ClientSummary;
}

export interface BoardStats {
  total_clients: number | string;
  total_aum: number | string;
  active_mandates: number | string;
  new_clients: number | string;
  transactions: number | string;
  startDate: string;
  endDate: string;
}
