import { DashboardShell } from '@/features/dashboard/components/dashboard-shell';
import { AuthGuard } from '@/components/auth/auth-guard';
import { PORTAL_ROLES } from '@/lib/auth-routes';

// Everything under /dashboard is an authenticated customer portal driven by
// live session state — there's nothing here that should ever be statically prerendered.
export const dynamic = 'force-dynamic';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={PORTAL_ROLES['/dashboard']}>
      <DashboardShell>{children}</DashboardShell>
    </AuthGuard>
  );
}
