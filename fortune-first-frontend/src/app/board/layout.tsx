import { BoardShell } from '@/features/board/components/board-shell';
import { AuthGuard } from '@/components/auth/auth-guard';
import { PORTAL_ROLES } from '@/lib/auth-routes';

// Everything under /board is an authenticated dashboard driven by live session
// state — there's nothing here that should ever be statically prerendered.
export const dynamic = 'force-dynamic';

export default function BoardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={PORTAL_ROLES['/board']}>
      <BoardShell>{children}</BoardShell>
    </AuthGuard>
  );
}
