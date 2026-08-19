export interface PendingPayout {
  investment_id: string;
  amount: number | string;
  week_of_month: number;
  investment_date: string;
  customer_id: string;
  client_name: string;
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
}
