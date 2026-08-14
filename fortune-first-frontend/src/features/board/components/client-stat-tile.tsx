import type { LucideIcon } from 'lucide-react';

interface ClientStatTileProps {
  icon: LucideIcon;
  label: string;
  value: string;
}

export function ClientStatTile({ icon: Icon, label, value }: ClientStatTileProps) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-brand-border bg-white p-5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-primary">
        <Icon size={18} />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="mt-0.5 text-xl font-extrabold text-gray-900">{value}</p>
      </div>
    </div>
  );
}
