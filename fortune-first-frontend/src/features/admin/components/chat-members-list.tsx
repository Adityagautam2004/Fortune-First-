'use client';

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';

import api from '@/lib/api';

interface TeamMember {
  id: string;
  name: string;
  role: string;
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Management Head',
  investment_head: 'Investment Head',
  business_head: 'Business Head',
};

export function ChatMembersList() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api
      .get('/admin/users')
      .then((res) => {
        const staff = (res.data.data as { id: string; name: string; role: string }[]).filter(
          (u) => u.role !== 'customer'
        );
        setMembers(staff);
      })
      .catch((error) => console.error('Failed to load team members', error));
  }, []);

  const filtered = members.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="w-full max-w-xs rounded-2xl border border-brand-border bg-white">
      <div className="flex items-center justify-between px-5 py-4">
        <h3 className="text-lg font-bold text-gray-900">Members</h3>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-semibold text-primary">
          {members.length}
        </span>
      </div>
      <div className="px-5 pb-3">
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search members..."
            className="w-full rounded-lg border border-brand-border bg-white py-2 pl-8 pr-3 text-sm text-gray-700 placeholder-gray-400 focus:border-primary focus:outline-none"
          />
        </div>
      </div>
      <div className="max-h-[460px] space-y-1 overflow-y-auto px-3 pb-3">
        {filtered.map((member) => (
          <div
            key={member.id}
            className="flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors hover:bg-muted"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-primary/30 bg-primary/10 text-xs font-bold text-primary">
              {member.name
                .split(' ')
                .map((p) => p[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900">{member.name}</p>
              <p className="text-xs text-gray-500">{ROLE_LABELS[member.role] || member.role}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
