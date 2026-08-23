import type { LucideIcon } from 'lucide-react';

interface ReportSummaryTileProps {
  icon: LucideIcon;
  label: string;
  value: string;
}

export function ReportSummaryTile({ icon: Icon, label, value }: ReportSummaryTileProps) {
  return (
    <div className="rounded-2xl border border-primary/15 bg-muted p-5">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary/30 text-primary">
        <Icon size={18} />
      </div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-extrabold text-foreground">{value}</p>
    </div>
  );
}
