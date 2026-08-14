'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import {
  LayoutGrid,
  Bitcoin,
  NotebookText,
  ArrowLeftRight,
  MessageSquareWarning,
  Target,
  Info,
  Settings,
  LogOut,
  ChevronLeft,
} from 'lucide-react';

import { logout } from '@/store/authSlice';
import type { AppDispatch } from '@/store/store';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutGrid },
  { name: 'Investment', href: '/dashboard/investment', icon: Bitcoin },
  { name: 'My plans', href: '/dashboard/plans', icon: NotebookText },
  { name: 'Transactions', href: '/dashboard/history', icon: ArrowLeftRight },
  { name: 'Reports', href: '/dashboard/reports', icon: MessageSquareWarning },
  { name: 'Goals', href: '/dashboard/goals', icon: Target },
  { name: 'Support', href: '/dashboard/support', icon: Info },
  { name: 'Settings', href: '/dashboard/profile', icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await dispatch(logout());
    router.push('/login');
  };

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

      <div className="p-3">
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
