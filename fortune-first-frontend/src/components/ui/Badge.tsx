import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold',
  {
    variants: {
      variant: {
        success: 'bg-emerald-100 text-emerald-700',
        warning: 'bg-amber-100 text-amber-700',
        danger: 'bg-red-100 text-red-700',
        info: 'bg-blue-100 text-blue-700',
        neutral: 'bg-gray-100 text-gray-700',
        brand: 'bg-primary/10 text-primary',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

// ── Convenience helpers for common badge types ──────────────

export function RoleBadge({ role }: { role: string }) {
  const map: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    super_admin: { label: 'Super Admin', variant: 'brand' },
    business_head: { label: 'Business Head', variant: 'info' },
    investment_head: { label: 'Investment Head', variant: 'success' },
    customer: { label: 'Customer', variant: 'neutral' },
  };
  const config = map[role] || { label: role, variant: 'neutral' as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    active: { label: 'Active', variant: 'success' },
    exited: { label: 'Exited', variant: 'neutral' },
    suspended: { label: 'Suspended', variant: 'danger' },
    pending: { label: 'Pending', variant: 'warning' },
    paid: { label: 'Paid', variant: 'success' },
    skipped: { label: 'Skipped', variant: 'neutral' },
  };
  const config = map[status] || { label: status, variant: 'neutral' as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export { Badge, badgeVariants };
export default Badge;
