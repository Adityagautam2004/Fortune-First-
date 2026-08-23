import { Mail, Phone, Pencil, MoreHorizontal } from 'lucide-react';

import type { ClientProfile } from '../types';

function formatSince(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

interface ClientInfoCardProps {
  profile: ClientProfile;
}

export function ClientInfoCard({ profile }: ClientInfoCardProps) {
  const initials = profile.name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto_auto_auto]">
      <div className="flex items-center gap-4 rounded-2xl border border-brand-border bg-card p-6">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-primary/40 bg-primary/10 text-lg font-bold text-primary">
          {initials}
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-xl font-extrabold text-foreground">{profile.name}</h2>
          <p className="text-sm text-muted-foreground">{profile.id.slice(0, 8).toUpperCase()}</p>
          <div className="mt-1.5 flex flex-col gap-0.5 text-xs text-muted-foreground sm:flex-row sm:gap-4">
            <span className="inline-flex items-center gap-1.5">
              <Mail size={12} /> {profile.email}
            </span>
            {profile.phone && (
              <span className="inline-flex items-center gap-1.5">
                <Phone size={12} /> {profile.phone}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex min-w-[160px] flex-col justify-center gap-2 rounded-2xl border border-brand-border bg-card p-4">
        <p className="text-xs font-semibold text-muted-foreground">Client Status</p>
        <span
          className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold ${
            profile.is_active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' : 'bg-muted text-muted-foreground'
          }`}
        >
          {profile.is_active ? 'Active' : 'Inactive'}
        </span>
        <p className="text-[11px] text-muted-foreground">Since {formatSince(profile.created_at)}</p>
      </div>

      <div className="flex min-w-[160px] flex-col justify-center gap-2 rounded-2xl border border-brand-border bg-card p-4">
        <p className="text-xs font-semibold text-muted-foreground">Risk Profile</p>
        <span className="inline-flex w-fit items-center rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
          Not available
        </span>
        <p className="text-[11px] text-muted-foreground">No risk data modeled yet</p>
      </div>

      <div className="flex items-start gap-2 lg:items-center">
        <button
          disabled
          title="Editing client profiles is coming soon"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-brand-border text-muted-foreground"
        >
          <Pencil size={16} />
        </button>
        <button
          disabled
          title="More actions coming soon"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-brand-border text-muted-foreground"
        >
          <MoreHorizontal size={16} />
        </button>
      </div>
    </div>
  );
}
