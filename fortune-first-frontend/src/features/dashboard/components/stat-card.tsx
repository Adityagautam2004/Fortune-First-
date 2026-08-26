import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  delta?: string;
  footnote: string;
}

export function StatCard({ icon: Icon, label, value, delta, footnote }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-primary/15 bg-muted p-3.5">
      <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white">
        <Icon size={18} />
      </div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-xl font-extrabold text-foreground">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {delta && <span className={cn('mr-1 font-semibold', delta.startsWith('-') ? 'text-red-500' : 'text-emerald-600')}>{delta}</span>}
        {footnote}
      </p>
    </div>
  );
}
