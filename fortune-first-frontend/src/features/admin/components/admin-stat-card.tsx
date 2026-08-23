import type { LucideIcon } from 'lucide-react';

interface AdminStatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  footnote?: string;
}

export function AdminStatCard({ icon: Icon, label, value, footnote }: AdminStatCardProps) {
  return (
    <div className="rounded-2xl border border-primary/15 bg-muted p-3">
      <div className="mb-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
        <Icon size={15} />
      </div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-lg font-extrabold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{footnote ?? '—'}</p>
    </div>
  );
}
