'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import {
  LayoutGrid,
  Users,
  IdCard,
  UserPlus,
  Landmark,
  ClipboardList,
  History,
  Headphones,
  MessageCircle,
  PieChart,
  Receipt,
  Contact,
  Download,
  LogOut,
  ChevronLeft,
  X,
} from 'lucide-react';

import { logout } from '@/store/authSlice';
import type { AppDispatch } from '@/store/store';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Dashboard Overview', href: '/admin', icon: LayoutGrid },
  { name: 'User Management', href: '/admin/users', icon: Users },
  { name: 'Join Requests', href: '/admin/join-requests', icon: UserPlus },
  { name: 'Financial Operations', href: '/admin/financial-operations', icon: Landmark },
  { name: 'Portfolio Dashboard', href: '/admin/portfolio', icon: PieChart },
  { name: 'Funds Transactions', href: '/admin/funds-transactions', icon: Receipt },
  { name: 'Content Management', href: '/admin/content-management', icon: ClipboardList },
  { name: 'Audit Logs', href: '/admin/audit-logs', icon: History },
  { name: 'Support Ticket Management', href: '/admin/support', icon: Headphones },
  { name: 'Communication', href: '/admin/communication', icon: MessageCircle },
];

interface AdminSidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

export function AdminSidebar({ mobileOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await dispatch(logout());
    router.push('/login');
  };

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

        <div className="flex items-center gap-3 border-b border-brand-border px-5 py-3">
          <Image
            src="/logo_circle.png"
            alt="Fortune First Logo"
            width={36}
            height={36}
            className="h-9 w-9 shrink-0 rounded-full object-contain"
          />
          {!collapsed && (
            <span className="text-base font-extrabold leading-tight tracking-tight text-foreground">
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

        <div className="space-y-3 p-3">
          <Link
            href="/admin/content-management"
            onClick={onClose}
            className={cn(
              'flex items-center gap-3 rounded-xl border border-brand-border px-3 py-2.5 text-left transition-colors hover:bg-muted',
              collapsed && 'justify-center'
            )}
            title={collapsed ? 'Download Reports' : undefined}
          >
            <Download size={18} className="shrink-0 text-primary" />
            {!collapsed && (
              <span className="leading-tight">
                <span className="block text-sm font-semibold text-foreground">Download Reports</span>
                <span className="block text-xs text-muted-foreground">Monthly, Quarterly, Yearly</span>
              </span>
            )}
          </Link>

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
