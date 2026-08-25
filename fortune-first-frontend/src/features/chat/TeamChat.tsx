'use client';

import { useState } from 'react';
import { ChatSidebar } from './ChatSidebar';
import { ChatWindow } from './ChatWindow';
import { GROUP_CHANNEL, useTeamChat, type TeamMember } from './useTeamChat';

interface TeamChatProps {
  basePath: 'admin' | 'board';
  currentUserId?: string;
}

export function TeamChat({ basePath, currentUserId }: TeamChatProps) {
  const [search, setSearch] = useState('');
  // On mobile, only one pane shows at a time (WhatsApp-style: contact list,
  // then tapping a contact opens the full-screen conversation with a back
  // arrow). At the lg breakpoint both panes show side by side regardless.
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const {
    contacts,
    onlineIds,
    conversation,
    messages,
    typingUser,
    selectContact,
    selectGroup,
    sendMessage,
    notifyTyping,
  } = useTeamChat(basePath, currentUserId);

  const subtitle =
    conversation.id === GROUP_CHANNEL.id
      ? 'Shared with your whole team'
      : onlineIds.has(conversation.memberId || '')
        ? 'Online'
        : 'Offline';

  const handleSelectGroup = () => {
    selectGroup();
    setMobileView('chat');
  };

  const handleSelectContact = (member: TeamMember) => {
    selectContact(member);
    setMobileView('chat');
  };

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className={mobileView === 'chat' ? 'hidden lg:block' : ''}>
        <ChatSidebar
          contacts={contacts}
          onlineIds={onlineIds}
          activeId={conversation.id}
          onSelectGroup={handleSelectGroup}
          onSelectContact={handleSelectContact}
          search={search}
          onSearchChange={setSearch}
        />
      </div>
      <div className={`flex-1 ${mobileView === 'list' ? 'hidden lg:block' : ''}`}>
        <ChatWindow
          title={conversation.label}
          subtitle={subtitle}
          messages={messages}
          currentUserId={currentUserId}
          typingUser={typingUser}
          onSend={sendMessage}
          onTyping={notifyTyping}
          onBack={() => setMobileView('list')}
        />
      </div>
    </div>
  );
}
