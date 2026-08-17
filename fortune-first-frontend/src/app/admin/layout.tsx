import { AdminSidebar } from '@/features/admin/components/admin-sidebar';
import { AdminTopbar } from '@/features/admin/components/admin-topbar';

// Everything under /admin is an authenticated super_admin console driven by
// live session state — there's nothing here that should ever be statically prerendered.
export const dynamic = 'force-dynamic';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-brand-surface">
      <AdminSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminTopbar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
