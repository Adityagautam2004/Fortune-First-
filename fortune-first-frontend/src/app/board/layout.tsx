import { BoardShell } from '@/features/board/components/board-shell';

// Everything under /board is an authenticated dashboard driven by live session
// state — there's nothing here that should ever be statically prerendered.
export const dynamic = 'force-dynamic';

export default function BoardLayout({ children }: { children: React.ReactNode }) {
  return <BoardShell>{children}</BoardShell>;
}
