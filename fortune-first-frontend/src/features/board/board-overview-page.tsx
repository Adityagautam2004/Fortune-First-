'use client';

import { useEffect, useMemo, useState } from 'react';
import { Landmark, IndianRupee, Wallet, ArrowLeftRight, Download } from 'lucide-react';

import api from '@/lib/api';
import { downloadCsv } from '@/lib/csv';
import { BoardStatTile } from './components/board-stat-tile';
import { ClientFilters, type ClientFiltersState } from './components/client-filters';
import { ClientSummaryTable } from './components/client-summary-table';
import type { BoardClient, BoardStats } from './types';

function formatLakh(value: number) {
  return `₹${(value / 1e5).toFixed(2)} L`;
}

// Built from local Y/M/D components (not toISOString(), which converts to UTC and can
// roll the date back a day for timezones behind UTC).
function toLocalIso(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function todayIso() {
  return toLocalIso(new Date());
}

function firstOfMonthIso() {
  const now = new Date();
  return toLocalIso(new Date(now.getFullYear(), now.getMonth(), 1));
}

export function BoardOverviewPage() {
  const [stats, setStats] = useState<BoardStats | null>(null);
  const [clients, setClients] = useState<BoardClient[]>([]);
  const [latestOperatingCapital, setLatestOperatingCapital] = useState(0);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(firstOfMonthIso());
  const [endDate, setEndDate] = useState(todayIso());
  const [filters, setFilters] = useState<ClientFiltersState>({
    search: '',
    relationshipManager: 'all',
    status: 'all',
  });

  useEffect(() => {
    let cancelled = false;
    api
      .get('/board/dashboard', { params: { startDate, endDate } })
      .then((res) => {
        if (!cancelled) setStats(res.data.data);
      })
      .catch((error) => console.error('Failed to load board stats', error));
    return () => {
      cancelled = true;
    };
  }, [startDate, endDate]);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/board/clients')
      .then((res) => {
        if (!cancelled) setClients(res.data.data || []);
      })
      .catch((error) => console.error('Failed to load clients', error))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Latest month's operating capital from the reports section — a
  // forward-looking snapshot, not tied to the date-range filter above.
  useEffect(() => {
    let cancelled = false;
    api
      .get('/board/reports', { params: { limit: 1 } })
      .then((res) => {
        if (!cancelled) setLatestOperatingCapital(res.data.data?.summary?.latestOperatingCapital ?? 0);
      })
      .catch((error) => console.error('Failed to load latest operating capital', error));
    return () => {
      cancelled = true;
    };
  }, []);

  const relationshipManagers = useMemo(() => {
    const names = clients.map((c) => c.relationship_manager).filter((n): n is string => !!n);
    return Array.from(new Set(names)).sort();
  }, [clients]);

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      if (filters.search) {
        const haystack = `${client.name} ${client.email} ${client.id}`.toLowerCase();
        if (!haystack.includes(filters.search.toLowerCase())) return false;
      }
      if (filters.relationshipManager !== 'all' && client.relationship_manager !== filters.relationshipManager) {
        return false;
      }
      if (filters.status === 'active' && !client.is_active) return false;
      if (filters.status === 'inactive' && client.is_active) return false;
      return true;
    });
  }, [clients, filters]);

  const activeMandates = Number(stats?.active_mandates ?? 0);
  const totalAum = Number(stats?.total_aum ?? 0);
  const avgTicketSize = activeMandates > 0 ? totalAum / activeMandates : 0;

  const handleExportReport = () => {
    if (!stats) return;
    downloadCsv('board_report.csv', [
      {
        'Period Start': stats.startDate,
        'Period End': stats.endDate,
        'Total Clients': Number(stats.total_clients),
        'AUM (INR)': totalAum,
        'Active Mandates': activeMandates,
        'Transactions': Number(stats.transactions),
        'New Clients': Number(stats.new_clients),
        'Avg Ticket Size (INR)': Math.round(avgTicketSize),
      },
    ]);
  };

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading board overview...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-brand-border bg-card p-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Board Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">Get a consolidated view of your business and clients.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:shrink-0">
          <div className="flex items-center gap-2 rounded-lg border border-brand-border px-3 py-2 text-sm text-foreground">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full min-w-0 border-none bg-transparent p-0 text-sm text-foreground focus:outline-none"
            />
            <span className="shrink-0 text-muted-foreground">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full min-w-0 border-none bg-transparent p-0 text-sm text-foreground focus:outline-none"
            />
          </div>
          <button
            onClick={handleExportReport}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
          >
            <Download size={16} />
            Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        <BoardStatTile icon={Landmark} label="Total Clients" value={Number(stats?.total_clients ?? 0).toLocaleString('en-IN')} />
        <BoardStatTile icon={IndianRupee} label="AUM" value={formatLakh(totalAum)} />
        <BoardStatTile icon={Wallet} label="Total Operating Capital" value={formatLakh(latestOperatingCapital)} />
        <BoardStatTile icon={ArrowLeftRight} label="Transactions" value={Number(stats?.transactions ?? 0).toLocaleString('en-IN')} />
      </div>

      <ClientFilters relationshipManagers={relationshipManagers} onApply={setFilters} />

      <ClientSummaryTable clients={filteredClients} />
    </div>
  );
}
