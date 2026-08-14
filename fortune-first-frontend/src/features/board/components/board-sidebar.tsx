'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import {
  LayoutGrid,
  User,
  ArrowLeftRight,
  TriangleAlert,
  MessageSquareWarning,
  FileText,
  MessageCircle,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
} from 'lucide-react';

import { logout } from '@/store/authSlice';
import type { AppDispatch } from '@/store/store';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Board Overview', href: '/board', icon: LayoutGrid },
  { name: 'Client Overview', href: '/board/clients', icon: User },
  { name: 'Transactions', href: '/board/transactions', icon: ArrowLeftRight },
  { name: 'Risk Analytics', href: '/board/risk-analytics', icon: TriangleAlert },
  { name: 'Reports', href: '/board/reports', icon: MessageSquareWarning },
  { name: 'Document Hub', href: '/board/documents', icon: FileText },
  { name: 'Secure Messages', href: '/board/chat', icon: MessageCircle },
  { name: 'Team Management', href: '/board/team', icon: Users },
  { name: 'Settings', href: '/board/settings', icon: Settings },
];

const ROLE_LABELS: Record<string, string> = {
  investment_head: 'Investment Head',
  business_head: 'Board Member',
};

export function BoardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await dispatch(logout());
    router.push('/login');
  };

  const displayName = user?.name || 'Board Member';
  const initial = displayName.trim().charAt(0).toUpperCase() || 'B';

  return (
    <aside
      className={cn(
        'relative flex h-screen flex-col border-r border-brand-border bg-white transition-all duration-300',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="absolute -right-3 top-8 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-brand-border bg-white text-primary shadow-sm transition-transform hover:bg-muted"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <ChevronLeft size={14} className={cn('transition-transform', collapsed && 'rotate-180')} />
      </button>

      <div className="flex items-center gap-3 px-6 py-6">
        <Image
          src="/logo_circle.png"
          alt="Fortune First Logo"
          width={40}
          height={40}
          className="h-10 w-10 shrink-0 rounded-full object-contain"
        />
        {!collapsed && (
          <span className="text-lg font-extrabold leading-tight tracking-tight text-gray-900">
            Fortune First
          </span>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                active ? 'bg-muted text-primary' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900',
                collapsed && 'justify-center'
              )}
              title={collapsed ? item.name : undefined}
            >
              <Icon size={19} strokeWidth={2} className="shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-2 p-3">
        <div
          className={cn(
            'flex items-center gap-3 rounded-full border border-brand-border py-1.5 pl-1.5 pr-3',
            collapsed && 'justify-center px-1.5'
          )}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
            {initial}
          </div>
          {!collapsed && (
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-semibold text-gray-900">{displayName}</p>
              <p className="text-xs text-gray-500">{(user?.role && ROLE_LABELS[user.role]) || 'Board Member'}</p>
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          className={cn(
            'flex w-full items-center gap-3 rounded-xl bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-500 transition-colors hover:bg-red-100',
            collapsed && 'justify-center'
          )}
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
