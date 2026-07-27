import React from 'react';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'gold';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  danger: 'bg-red-500/15 text-red-400 border-red-500/30',
  info: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  neutral: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
  gold: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
};

export default function Badge({ children, variant = 'neutral', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

// ── Convenience helpers for common badge types ──────────────

export function RoleBadge({ role }: { role: string }) {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    super_admin: { label: 'Super Admin', variant: 'gold' },
    business_head: { label: 'Business Head', variant: 'info' },
    investment_head: { label: 'Investment Head', variant: 'success' },
    customer: { label: 'Customer', variant: 'neutral' },
  };
  const config = map[role] || { label: role, variant: 'neutral' as BadgeVariant };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    active: { label: 'Active', variant: 'success' },
    exited: { label: 'Exited', variant: 'neutral' },
    suspended: { label: 'Suspended', variant: 'danger' },
    pending: { label: 'Pending', variant: 'warning' },
    paid: { label: 'Paid', variant: 'success' },
    skipped: { label: 'Skipped', variant: 'neutral' },
  };
  const config = map[status] || { label: status, variant: 'neutral' as BadgeVariant };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
