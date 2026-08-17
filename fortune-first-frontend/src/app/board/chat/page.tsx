'use client';

import { useAuth } from '@/hooks/useAuth';
import { TeamChat } from '@/features/chat/TeamChat';

export default function BoardChatPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Internal Chat</h1>
        <p className="mt-1 text-sm text-gray-500">Message the team channel or start a direct message.</p>
      </div>

      <TeamChat basePath="board" currentUserId={user?.id} />
    </div>
  );
}
