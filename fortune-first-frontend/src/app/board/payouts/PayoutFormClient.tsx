'use client';

import { useAuth } from '@/hooks/useAuth';
import { Tabs } from '@/components/ui/Tabs';
import { PayoutsPage } from '@/features/admin/payouts-page';
import { PayoutHistoryPage } from '@/features/admin/payout-history-page';

const TABS = [
  { key: 'payouts', label: 'Process Payouts' },
  { key: 'history', label: 'Payout History' },
];

// Investment heads get the same "Process Payouts" + "Payout History" views
// as the admin's Financial Operations page — both scoped server-side to
// /board/payouts, which already restricts processing to investment_head/
// super_admin. Business heads (whose domain is the stock portfolio, not
// client payouts) only get the read-only history, matching the backend's
// own 403 on POST /board/payouts for that role.
export default function PayoutFormClient() {
  const { user } = useAuth();
  const canProcess = user?.role === 'investment_head' || user?.role === 'super_admin';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-foreground">Monthly Payout</h1>

      {canProcess ? (
        <Tabs items={TABS} defaultKey="payouts">
          {(active) => (active === 'history' ? <PayoutHistoryPage endpoint="/board/payouts" /> : <PayoutsPage />)}
        </Tabs>
      ) : (
        <PayoutHistoryPage endpoint="/board/payouts" />
      )}
    </div>
  );
}
