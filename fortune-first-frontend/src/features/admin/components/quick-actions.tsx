import Link from 'next/link';
import { UserPlus, Landmark, FileText, Headphones, BellOff, Download } from 'lucide-react';

interface QuickActionsProps {
  onExportData: () => void;
}

export function QuickActions({ onExportData }: QuickActionsProps) {
  return (
    <div className="rounded-2xl border border-brand-border bg-card p-3">
      <h3 className="mb-2 text-sm font-bold text-foreground">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <Link
          href="/admin/users"
          className="flex flex-col items-center gap-2 rounded-xl border border-brand-border py-2 text-center transition-colors hover:bg-muted"
        >
          <UserPlus size={18} className="text-foreground" />
          <span className="text-xs font-medium text-foreground">Add Investor</span>
        </Link>

        <Link
          href="/admin/investments"
          className="flex flex-col items-center gap-2 rounded-xl border border-brand-border py-2 text-center transition-colors hover:bg-muted"
        >
          <Landmark size={18} className="text-foreground" />
          <span className="text-xs font-medium text-foreground">Add Investment</span>
        </Link>

        <Link
          href="/admin/reports"
          className="flex flex-col items-center gap-2 rounded-xl border border-brand-border py-2 text-center transition-colors hover:bg-muted"
        >
          <FileText size={18} className="text-foreground" />
          <span className="text-xs font-medium text-foreground">Generate Report</span>
        </Link>

        <Link
          href="/admin/support"
          className="flex flex-col items-center gap-2 rounded-xl border border-brand-border py-2 text-center transition-colors hover:bg-muted"
        >
          <Headphones size={18} className="text-foreground" />
          <span className="text-xs font-medium text-foreground">Support Tickets</span>
        </Link>

        <div
          title="Investor alerting isn't built yet"
          className="flex cursor-not-allowed flex-col items-center gap-2 rounded-xl border border-brand-border py-2 text-center opacity-40"
        >
          <BellOff size={18} className="text-foreground" />
          <span className="text-xs font-medium text-foreground">Send Alert</span>
        </div>

        <button
          type="button"
          onClick={onExportData}
          className="flex flex-col items-center gap-2 rounded-xl border border-brand-border py-2 text-center transition-colors hover:bg-muted"
        >
          <Download size={18} className="text-foreground" />
          <span className="text-xs font-medium text-foreground">Export Data</span>
        </button>
      </div>
    </div>
  );
}
