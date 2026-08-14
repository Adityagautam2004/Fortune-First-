import { BoardSidebar } from '@/features/board/components/board-sidebar';

export default function BoardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-brand-surface">
      <BoardSidebar />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
