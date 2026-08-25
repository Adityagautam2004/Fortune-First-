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
  X,
} from 'lucide-react';

import { logout } from '@/store/authSlice';
import type { AppDispatch } from '@/store/store';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';

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

interface BoardSidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

export function BoardSidebar({ mobileOpen, onClose }: BoardSidebarProps) {
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

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex h-screen w-64 flex-col border-r border-brand-border bg-card transition-transform duration-300 md:relative md:z-auto md:translate-x-0 md:transition-[width]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          collapsed ? 'md:w-20' : 'md:w-64'
        )}
      >
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="absolute -right-3 top-8 z-10 hidden h-6 w-6 items-center justify-center rounded-full border border-brand-border bg-card text-primary shadow-sm transition-transform hover:bg-muted md:flex"
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
            <span className="text-lg font-extrabold leading-tight tracking-tight text-foreground">
              Fortune First
            </span>
          )}
          <button
            onClick={onClose}
            className="ml-auto text-muted-foreground transition-colors hover:text-foreground md:hidden"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  active ? 'bg-muted text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
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
            <Avatar src={user?.profilePictureUrl} name={displayName} size={36} />
            {!collapsed && (
              <div className="min-w-0 leading-tight">
                <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
                <p className="text-xs text-muted-foreground">{(user?.role && ROLE_LABELS[user.role]) || 'Board Member'}</p>
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            className={cn(
              'flex w-full items-center gap-3 rounded-xl bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-500 transition-colors hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20',
              collapsed && 'justify-center'
            )}
          >
            <LogOut size={18} className="shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
