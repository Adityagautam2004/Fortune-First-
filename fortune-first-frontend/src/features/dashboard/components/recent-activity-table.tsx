import Link from 'next/link';

import { StatusBadge } from '@/components/ui/Badge';
import type { MonthlyReturn } from '@/types';

const MONTH_LABELS = [
  '', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function formatDate(record: MonthlyReturn) {
  if (record.payout_date) {
    return new Date(record.payout_date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
  return `${MONTH_LABELS[record.month]} ${record.year}`;
}

function formatRupees(value: number) {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

interface RecentActivityTableProps {
  history: MonthlyReturn[];
}

export function RecentActivityTable({ history }: RecentActivityTableProps) {
  const rows = history.slice(0, 5);

  return (
    <div className="rounded-2xl border border-brand-border bg-white">
      <div className="flex items-center justify-between p-6 pb-4">
        <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
        <Link
          href="/dashboard/history"
          className="inline-flex items-center justify-center rounded-lg border border-primary/30 bg-muted px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
        >
          View All
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-muted text-gray-600">
              <th className="px-6 py-3 font-medium">Date</th>
              <th className="px-6 py-3 font-medium">Activity</th>
              <th className="px-6 py-3 font-medium">Amount</th>
              <th className="px-6 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                  No activity yet.
                </td>
              </tr>
            ) : (
              rows.map((record, idx) => (
                <tr key={idx}>
                  <td className="px-6 py-4 text-gray-700">{formatDate(record)}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">Monthly Payout</td>
                  <td className="px-6 py-4 text-gray-700">{formatRupees(Number(record.payout_amount))}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={record.payout_status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
