'use client';

import { Search } from 'lucide-react';
import { GROUP_CHANNEL, type TeamMember } from './useTeamChat';

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Management Head',
  investment_head: 'Investment Head',
  business_head: 'Business Head',
};

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

interface ChatSidebarProps {
  contacts: TeamMember[];
  onlineIds: Set<string>;
  activeId: string;
  onSelectGroup: () => void;
  onSelectContact: (member: TeamMember) => void;
  search: string;
  onSearchChange: (value: string) => void;
}

export function ChatSidebar({
  contacts,
  onlineIds,
  activeId,
  onSelectGroup,
  onSelectContact,
  search,
  onSearchChange,
}: ChatSidebarProps) {
  const filtered = contacts.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="w-full rounded-2xl border border-brand-border bg-card lg:max-w-xs">
      <div className="flex items-center justify-between px-5 py-4">
        <h3 className="text-lg font-bold text-foreground">Members</h3>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-semibold text-primary">
          {contacts.length}
        </span>
      </div>
      <div className="px-5 pb-3">
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search members..."
            className="w-full rounded-lg border border-brand-border bg-card py-2 pl-8 pr-3 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
          />
        </div>
      </div>
      <div className="max-h-[calc(100vh-16rem)] space-y-1 overflow-y-auto px-3 pb-3 lg:max-h-[460px]">
        <button
          type="button"
          onClick={onSelectGroup}
          className={`flex w-full items-center gap-3 rounded-xl border px-2.5 py-2.5 text-left transition-colors hover:bg-muted ${
            activeId === GROUP_CHANNEL.id ? 'border-primary/40 bg-primary/10' : 'border-transparent'
          }`}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-primary/30 bg-primary/10 text-xs font-bold text-primary">
            #
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">Team Channel</p>
            <p className="text-xs text-muted-foreground">Everyone</p>
          </div>
        </button>

        <div className="my-2 border-t border-brand-border" />

        {filtered.map((member) => {
          const online = onlineIds.has(member.id);
          return (
            <button
              type="button"
              key={member.id}
              onClick={() => onSelectContact(member)}
              className={`flex w-full items-center gap-3 rounded-xl border px-2.5 py-2.5 text-left transition-colors hover:bg-muted ${
                activeId.includes(member.id) ? 'border-primary/40 bg-primary/10' : 'border-transparent'
              }`}
            >
              <div className="relative shrink-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-primary/30 bg-primary/10 text-xs font-bold text-primary">
                  {initials(member.name)}
                </div>
                <span
                  className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${
                    online ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{member.name}</p>
                <p className="text-xs text-muted-foreground">{online ? 'Online' : ROLE_LABELS[member.role] || member.role}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
