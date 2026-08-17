import { DashboardSidebar } from '@/features/dashboard/components/dashboard-sidebar';
import { DashboardTopbar } from '@/features/dashboard/components/dashboard-topbar';

// Everything under /dashboard is an authenticated customer portal driven by
// live session state — there's nothing here that should ever be statically prerendered.
export const dynamic = 'force-dynamic';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-brand-surface">
      <DashboardSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardTopbar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
