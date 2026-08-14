import { ChatMembersList } from './components/chat-members-list';
import { ChatPanel } from './components/chat-panel';

export function CommunicationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Communication Channel</h1>
        <p className="mt-1 text-sm text-gray-500">Communicate with your team.</p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <ChatMembersList />
        <ChatPanel />
      </div>
    </div>
  );
}
