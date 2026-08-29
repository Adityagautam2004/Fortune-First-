export interface StockSearchResult {
  symbol: string;
  name: string;
  exchange: string;
}

export interface StockPosition {
  id: string;
  symbol: string;
  company_name: string;
  quantity: number;
  average_price: number;
  added_by: string;
  added_by_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  invested_amount: number;
  current_price: number | null;
  current_value: number | null;
  unrealized_pnl: number | null;
}

export interface PortfolioSummary {
  total_invested: number;
  current_value: number;
  unrealized_pnl: number;
  position_count: number;
}

export interface BusinessHeadOption {
  id: string;
  name: string;
}

export type StockTransactionType = 'buy' | 'sell';

export interface StockTransaction {
  id: string;
  position_id: string;
  symbol: string;
  company_name: string;
  transaction_type: StockTransactionType;
  quantity: number | string;
  price: number | string;
  profit_loss: number | string | null;
  business_head_id: string;
  business_head_name: string;
  transaction_date: string;
  created_at: string;
}

export interface FundsTransactionSummary {
  buy_count: number;
  sell_count: number;
  total_buy_value: number;
  total_sell_value: number;
  total_profit: number;
  total_loss: number;
  net_realized_pnl: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
