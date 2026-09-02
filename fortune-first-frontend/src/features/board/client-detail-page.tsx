'use client';

import { useCallback, useEffect, useState } from 'react';
import { IndianRupee, FileText, PieChart, Percent } from 'lucide-react';

import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { ClientInfoCard } from './components/client-info-card';
import { ClientStatTile } from './components/client-stat-tile';
import { InvestmentHistoryTable } from './components/investment-history-table';
import { WithdrawalHistoryTable } from './components/withdrawal-history-table';
import { QuickActionsCard } from './components/quick-actions-card';
import { AddInvestmentModal } from './components/add-investment-modal';
import { AddWithdrawalModal } from './components/add-withdrawal-modal';
import type { ClientDetail } from './types';

function formatLakh(value: number) {
  return `₹${(value / 1e5).toFixed(2)} L`;
}

interface ClientDetailPageProps {
  clientId: string;
}

export function ClientDetailPage({ clientId }: ClientDetailPageProps) {
  const { user } = useAuth();
  // Quick Actions (Add Investment/Withdrawal) is investment_head-only — this
  // page is shared with /admin/client-details, and admins should only view
  // client data there, not act on it.
  const canManageClient = user?.role === 'investment_head';

  const [detail, setDetail] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [withdrawalModalOpen, setWithdrawalModalOpen] = useState(false);

  const fetchDetail = useCallback(() => {
    return api
      .get(`/board/clients/${clientId}`)
      .then((res) => setDetail(res.data.data))
      .catch((error) => console.error('Failed to load client detail', error));
  }, [clientId]);

  useEffect(() => {
    fetchDetail().finally(() => setLoading(false));
  }, [fetchDetail]);

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading client details...</div>;
  }

  if (!detail) {
    return <div className="p-6 text-sm text-muted-foreground">Client not found.</div>;
  }

  const totalAum = Number(detail.summary.total_aum);
  const totalReturnsYtd = Number(detail.summary.total_returns_ytd);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">Client Detail</h1>
        <p className="mt-1 text-sm text-muted-foreground">View complete client portfolio</p>
      </div>

      <ClientInfoCard profile={detail.profile} />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <ClientStatTile icon={IndianRupee} label="Total AUM" value={formatLakh(totalAum)} />
        <ClientStatTile icon={FileText} label="Active Mandate" value={String(detail.summary.active_mandates)} />
        <ClientStatTile icon={PieChart} label="Total Investment" value={String(detail.summary.total_investment_count)} />
        <ClientStatTile icon={Percent} label="Total Returns (YTD)" value={formatLakh(totalReturnsYtd)} />
      </div>

      <div className={canManageClient ? 'grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]' : 'space-y-6'}>
        <div className="space-y-6">
          <InvestmentHistoryTable investments={detail.investments} />
          <WithdrawalHistoryTable withdrawals={detail.withdrawals} />
        </div>
        {canManageClient && (
          <QuickActionsCard
            onAddInvestment={() => setModalOpen(true)}
            onAddWithdrawal={() => setWithdrawalModalOpen(true)}
          />
        )}
      </div>

      {canManageClient && (
        <>
          <AddInvestmentModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            customerId={clientId}
            onSuccess={fetchDetail}
          />
          <AddWithdrawalModal
            isOpen={withdrawalModalOpen}
            onClose={() => setWithdrawalModalOpen(false)}
            customerId={clientId}
            onSuccess={fetchDetail}
          />
        </>
      )}
    </div>
  );
}
