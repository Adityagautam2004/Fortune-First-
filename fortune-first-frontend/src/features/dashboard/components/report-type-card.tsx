import type { LucideIcon } from 'lucide-react';
import { ChevronRight } from 'lucide-react';

interface ReportTypeCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
}

export function ReportTypeCard({ icon: Icon, title, description, onClick }: ReportTypeCardProps) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-5 rounded-2xl border border-primary/15 bg-muted p-6 text-left transition-colors hover:bg-primary/10"
    >
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-primary/30 text-primary">
        <Icon size={24} />
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      </div>
      <ChevronRight size={22} className="shrink-0 text-primary" />
    </button>
  );
}
