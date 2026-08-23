'use client';

import { useAuth } from '@/hooks/useAuth';
import { TeamChat } from '@/features/chat/TeamChat';

export function CommunicationPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">Communication Channel</h1>
        <p className="mt-1 text-sm text-muted-foreground">Communicate with your team.</p>
      </div>

      <TeamChat basePath="admin" currentUserId={user?.id} />
    </div>
  );
}
