'use client';

import { useState } from 'react';
import { ChatSidebar } from './ChatSidebar';
import { ChatWindow } from './ChatWindow';
import { GROUP_CHANNEL, useTeamChat } from './useTeamChat';

interface TeamChatProps {
  basePath: 'admin' | 'board';
  currentUserId?: string;
}

export function TeamChat({ basePath, currentUserId }: TeamChatProps) {
  const [search, setSearch] = useState('');
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

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <ChatSidebar
        contacts={contacts}
        onlineIds={onlineIds}
        activeId={conversation.id}
        onSelectGroup={selectGroup}
        onSelectContact={selectContact}
        search={search}
        onSearchChange={setSearch}
      />
      <ChatWindow
        title={conversation.label}
        subtitle={subtitle}
        messages={messages}
        currentUserId={currentUserId}
        typingUser={typingUser}
        onSend={sendMessage}
        onTyping={notifyTyping}
      />
    </div>
  );
}
