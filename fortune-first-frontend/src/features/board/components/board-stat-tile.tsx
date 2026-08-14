import type { LucideIcon } from 'lucide-react';

interface BoardStatTileProps {
  icon: LucideIcon;
  label: string;
  value: string;
}

export function BoardStatTile({ icon: Icon, label, value }: BoardStatTileProps) {
  return (
    <div className="rounded-2xl border border-primary/15 bg-muted p-5">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white">
        <Icon size={18} />
      </div>
      <p className="text-sm font-medium text-gray-600">{label}</p>
      <p className="mt-1 text-xl font-extrabold text-gray-900">{value}</p>
    </div>
  );
}
