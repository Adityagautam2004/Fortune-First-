import type { LucideIcon } from 'lucide-react';

interface BoardStatTileProps {
  icon: LucideIcon;
  label: string;
  value: string;
}

export function BoardStatTile({ icon: Icon, label, value }: BoardStatTileProps) {
  return (
    <div className="rounded-xl border border-primary/15 bg-muted p-3 sm:rounded-2xl sm:p-5">
      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white sm:mb-3 sm:h-10 sm:w-10">
        <Icon size={16} className="sm:hidden" />
        <Icon size={18} className="hidden sm:block" />
      </div>
      <p className="text-xs font-medium text-foreground sm:text-sm">{label}</p>
      <p className="mt-1 text-base font-extrabold text-foreground sm:text-xl">{value}</p>
    </div>
  );
}
