'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { logout } from '@/store/authSlice';
import { useRouter } from 'next/navigation';
import type { AppDispatch } from '@/store/store';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const handleLogout = () => {
    dispatch(logout());
    router.push('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin' },
    { name: 'User Management', path: '/admin/users' },
    { name: 'Join Requests', path: '/admin/join-requests' },
    { name: 'Audit Logs', path: '/admin/audit-logs' },
  ];

  return (
    <div className="flex min-h-screen bg-brand-surface">
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6 text-xl font-bold border-b border-gray-800 text-brand-orange">Admin Control</div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <Link key={item.name} href={item.path}>
              <span className={`block p-3 rounded-md transition ${pathname === item.path ? 'bg-brand-navy text-white' : 'hover:bg-gray-800'}`}>
                {item.name}
              </span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <button onClick={handleLogout} className="w-full p-3 text-left hover:bg-gray-800 rounded-md">Logout</button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}