import { AdminShell } from '@/features/admin/components/admin-shell';

// Everything under /admin is an authenticated super_admin console driven by
// live session state — there's nothing here that should ever be statically prerendered.
export const dynamic = 'force-dynamic';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
