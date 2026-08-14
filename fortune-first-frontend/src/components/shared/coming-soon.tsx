import type { LucideIcon } from 'lucide-react';

interface ComingSoonProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function ComingSoon({ icon: Icon, title, description }: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-brand-border bg-white px-6 py-20 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-muted text-primary">
        <Icon size={26} />
      </div>
      <h1 className="text-xl font-bold text-gray-900">{title}</h1>
      <p className="mt-2 max-w-sm text-sm text-gray-500">{description}</p>
    </div>
  );
}
