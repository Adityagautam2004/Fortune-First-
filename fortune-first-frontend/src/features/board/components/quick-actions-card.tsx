import { Plus, Upload, CalendarPlus, ChevronRight } from 'lucide-react';

interface QuickActionsCardProps {
  onAddInvestment: () => void;
}

export function QuickActionsCard({ onAddInvestment }: QuickActionsCardProps) {
  return (
    <div className="rounded-2xl border border-brand-border bg-white p-6">
      <h3 className="text-lg font-bold text-gray-900">Quick Actions</h3>
      <p className="mt-1 text-sm text-gray-500">Manage client activities</p>

      <div className="mt-5 space-y-3">
        <button
          onClick={onAddInvestment}
          className="flex w-full items-center gap-3 rounded-xl border border-primary/20 bg-muted p-3 text-left transition-colors hover:bg-primary/10"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Plus size={17} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-900">Add Investment</p>
            <p className="text-xs text-gray-500">Create a new investment</p>
          </div>
          <ChevronRight size={18} className="text-primary" />
        </button>

        <button
          disabled
          title="Coming soon"
          className="flex w-full items-center gap-3 rounded-xl border border-brand-border p-3 text-left opacity-50"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-400">
            <Upload size={17} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-900">Upload Document</p>
            <p className="text-xs text-gray-500">Attach client files</p>
          </div>
          <ChevronRight size={18} className="text-gray-300" />
        </button>

        <button
          disabled
          title="Coming soon"
          className="flex w-full items-center gap-3 rounded-xl border border-brand-border p-3 text-left opacity-50"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-400">
            <CalendarPlus size={17} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-900">Schedule Meeting</p>
            <p className="text-xs text-gray-500">Book a discussion</p>
          </div>
          <ChevronRight size={18} className="text-gray-300" />
        </button>
      </div>
    </div>
  );
}
