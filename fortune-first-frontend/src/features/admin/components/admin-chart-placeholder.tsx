import type { LucideIcon } from 'lucide-react';

interface AdminChartPlaceholderProps {
  icon: LucideIcon;
  title: string;
  legend: string;
  message: string;
}

export function AdminChartPlaceholder({ icon: Icon, title, legend, message }: AdminChartPlaceholderProps) {
  return (
    <div className="min-w-0 rounded-2xl border border-brand-border bg-card p-3">
      <div className="mb-0.5 flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        <span className="rounded-lg border border-brand-border px-2.5 py-1 text-xs text-muted-foreground">This Year</span>
      </div>
      <p className="mb-1.5 text-xs text-muted-foreground">{legend}</p>
      <div className="flex h-[80px] flex-col items-center justify-center gap-1 rounded-xl bg-brand-surface px-2 text-center">
        <Icon size={16} className="shrink-0 text-muted-foreground" />
        <p className="line-clamp-2 max-w-[260px] text-xs leading-snug text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
