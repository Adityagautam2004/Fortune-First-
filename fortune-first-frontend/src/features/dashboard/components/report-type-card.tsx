import type { LucideIcon } from 'lucide-react';
import { CheckCircle2 } from 'lucide-react';

import { cn } from '@/lib/utils';

interface ReportTypeCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}

export function ReportTypeCard({ icon: Icon, title, description, selected, onClick }: ReportTypeCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'flex w-full items-center gap-5 rounded-2xl border p-6 text-left transition-colors',
        selected ? 'border-primary bg-primary/10 ring-2 ring-primary/30' : 'border-primary/15 bg-muted hover:bg-primary/10'
      )}
    >
      <div
        className={cn(
          'flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2',
          selected ? 'border-primary bg-primary text-white' : 'border-primary/30 text-primary'
        )}
      >
        <Icon size={24} />
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-bold text-foreground">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <CheckCircle2 size={22} className={cn('shrink-0 transition-opacity', selected ? 'text-primary opacity-100' : 'opacity-0')} aria-hidden="true" />
    </button>
  );
}
