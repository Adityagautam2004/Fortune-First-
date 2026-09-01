'use client';

import { PayoutHistoryPage } from '@/features/admin/payout-history-page';

// Payout processing itself now happens per-client on the "Process Payouts"
// tab (features/admin/payouts-page.tsx) — this page is just the history
// view for whoever lands on /board/payouts directly from the sidebar.
export default function PayoutFormClient() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-foreground">Monthly Payout</h1>
      <PayoutHistoryPage endpoint="/board/payouts" />
    </div>
  );
}
