'use client';

import { Bitcoin, ArrowLeftRight, History } from 'lucide-react';

import { Tabs } from '@/components/ui/Tabs';
import { ComingSoon } from '@/components/shared/coming-soon';
import { PayoutsPage } from './payouts-page';

const TABS = [
  { key: 'investments', label: 'Investments' },
  { key: 'transactions', label: 'Transactions' },
  { key: 'payouts', label: 'Process Payouts' },
  { key: 'history', label: 'Payout History' },
];

export function FinancialOperationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">Financial Operations</h1>
        <p className="mt-1 text-sm text-muted-foreground">Investments, transactions, and payouts in one place.</p>
      </div>

      <Tabs items={TABS} defaultKey="investments">
        {(active) => {
          switch (active) {
            case 'transactions':
              return (
                <ComingSoon
                  icon={ArrowLeftRight}
                  title="Transactions"
                  description="A firm-wide transaction ledger is on the way."
                />
              );
            case 'payouts':
              return <PayoutsPage />;
            case 'history':
              return (
                <ComingSoon
                  icon={History}
                  title="Payout History"
                  description="A record of all processed payouts is on the way."
                />
              );
            default:
              return (
                <ComingSoon
                  icon={Bitcoin}
                  title="Investments"
                  description="A firm-wide investments overview is on the way."
                />
              );
          }
        }}
      </Tabs>
    </div>
  );
}
