import { DashboardShell } from '@/features/dashboard/components/dashboard-shell';

// Everything under /dashboard is an authenticated customer portal driven by
// live session state — there's nothing here that should ever be statically prerendered.
export const dynamic = 'force-dynamic';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
