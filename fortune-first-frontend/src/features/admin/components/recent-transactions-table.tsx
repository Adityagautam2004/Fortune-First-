import Link from 'next/link';

import { StatusBadge } from '@/components/ui/Badge';
import type { AdminInvestmentRow } from '../types';

function formatRupees(value: number) {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

interface RecentTransactionsTableProps {
  rows: AdminInvestmentRow[];
}

export function RecentTransactionsTable({ rows }: RecentTransactionsTableProps) {
  const recent = rows.slice(0, 5);

  return (
    <div className="flex h-full min-w-0 flex-col rounded-2xl border border-brand-border bg-white p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900">Recent Transactions</h3>
        <Link
          href="/admin/financial-operations"
          className="rounded-lg border border-primary/30 bg-muted px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
        >
          View All Transactions
        </Link>
      </div>

      <div className="max-h-[170px] overflow-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-gray-500">
              <th className="whitespace-nowrap px-2 py-1.5 font-medium">Date</th>
              <th className="whitespace-nowrap px-2 py-1.5 font-medium">Investor</th>
              <th className="whitespace-nowrap px-2 py-1.5 font-medium">Amount</th>
              <th className="whitespace-nowrap px-2 py-1.5 font-medium">Fund/Plan</th>
              <th className="whitespace-nowrap px-2 py-1.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {recent.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-2 py-6 text-center text-gray-400">
                  No transactions yet.
                </td>
              </tr>
            ) : (
              recent.map((row) => (
                <tr key={row.id}>
                  <td className="whitespace-nowrap px-2 py-1.5 text-gray-600">{formatDate(row.investment_date)}</td>
                  <td className="whitespace-nowrap px-2 py-1.5 font-medium text-gray-900">{row.customer_name}</td>
                  <td className="whitespace-nowrap px-2 py-1.5 text-gray-700">{formatRupees(Number(row.amount))}</td>
                  <td className="whitespace-nowrap px-2 py-1.5 text-gray-400">—</td>
                  <td className="whitespace-nowrap px-2 py-1.5">
                    <StatusBadge status={row.status} />
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
