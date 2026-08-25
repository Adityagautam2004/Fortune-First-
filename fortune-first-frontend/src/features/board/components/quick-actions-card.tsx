import { Plus, MinusCircle, Upload, CalendarPlus, ChevronRight } from 'lucide-react';

interface QuickActionsCardProps {
  onAddInvestment: () => void;
  onAddWithdrawal: () => void;
}

export function QuickActionsCard({ onAddInvestment, onAddWithdrawal }: QuickActionsCardProps) {
  return (
    <div className="rounded-2xl border border-brand-border bg-card p-6">
      <h3 className="text-lg font-bold text-foreground">Quick Actions</h3>
      <p className="mt-1 text-sm text-muted-foreground">Manage client activities</p>

      <div className="mt-5 space-y-3">
        <button
          onClick={onAddInvestment}
          className="flex w-full items-center gap-3 rounded-xl border border-primary/20 bg-muted p-3 text-left transition-colors hover:bg-primary/10"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Plus size={17} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-foreground">Add Investment</p>
            <p className="text-xs text-muted-foreground">Create a new investment</p>
          </div>
          <ChevronRight size={18} className="text-primary" />
        </button>

        <button
          onClick={onAddWithdrawal}
          className="flex w-full items-center gap-3 rounded-xl border border-primary/20 bg-muted p-3 text-left transition-colors hover:bg-primary/10"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
            <MinusCircle size={17} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-foreground">Request Withdrawal</p>
            <p className="text-xs text-muted-foreground">Submit a withdrawal for review</p>
          </div>
          <ChevronRight size={18} className="text-primary" />
        </button>

        <button
          disabled
          title="Coming soon"
          className="flex w-full items-center gap-3 rounded-xl border border-brand-border p-3 text-left opacity-50"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Upload size={17} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-foreground">Upload Document</p>
            <p className="text-xs text-muted-foreground">Attach client files</p>
          </div>
          <ChevronRight size={18} className="text-muted-foreground" />
        </button>

        <button
          disabled
          title="Coming soon"
          className="flex w-full items-center gap-3 rounded-xl border border-brand-border p-3 text-left opacity-50"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <CalendarPlus size={17} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-foreground">Schedule Meeting</p>
            <p className="text-xs text-muted-foreground">Book a discussion</p>
          </div>
          <ChevronRight size={18} className="text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
