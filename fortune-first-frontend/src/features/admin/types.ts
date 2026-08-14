export interface PendingPayout {
  investment_id: string;
  amount: number | string;
  week_of_month: number;
  investment_date: string;
  customer_id: string;
  client_name: string;
}
