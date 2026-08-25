'use client';

import { Tabs } from '@/components/ui/Tabs';
import { InvestmentsPage } from './investments-page';
import { WithdrawalsPage } from './withdrawals-page';
import { TransactionsPage } from './transactions-page';
import { PayoutsPage } from './payouts-page';
import { PayoutHistoryPage } from './payout-history-page';

const TABS = [
  { key: 'investments', label: 'Investments' },
  { key: 'withdrawals', label: 'Withdrawals' },
  { key: 'transactions', label: 'Transactions' },
  { key: 'payouts', label: 'Process Payouts' },
  { key: 'history', label: 'Payout History' },
];

export function FinancialOperationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">Financial Operations</h1>
        <p className="mt-1 text-sm text-muted-foreground">Investments, withdrawals, transactions, and payouts in one place.</p>
      </div>

      <Tabs items={TABS} defaultKey="investments">
        {(active) => {
          switch (active) {
            case 'withdrawals':
              return <WithdrawalsPage />;
            case 'transactions':
              return <TransactionsPage />;
            case 'payouts':
              return <PayoutsPage />;
            case 'history':
              return <PayoutHistoryPage />;
            default:
              return <InvestmentsPage />;
          }
        }}
      </Tabs>
    </div>
  );
}
