'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { logout } from '@/store/authSlice';
import { useRouter } from 'next/navigation';
import type { AppDispatch } from '@/store/store';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const handleLogout = () => {
    dispatch(logout());
    router.push('/login');
  };

  const navItems = [
    { name: 'Overview', path: '/dashboard' },
    { name: 'Investment History', path: '/dashboard/history' },
    { name: 'Reports', path: '/dashboard/reports' },
    { name: 'Profile', path: '/dashboard/profile' },
    { name: 'Support', path: '/dashboard/support' },
  ];

  return (
    <div className="flex min-h-screen bg-brand-surface">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-brand-navy text-white flex flex-col">
        <div className="p-6 text-xl font-bold border-b border-gray-700">Fortune First</div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <Link key={item.name} href={item.path}>
              <span className={`block p-3 rounded-md transition ${
                pathname === item.path ? 'bg-brand-orange text-white' : 'hover:bg-gray-800'
              }`}>
                {item.name}
              </span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-700">
          <button onClick={handleLogout} className="w-full p-3 text-left hover:bg-gray-800 rounded-md">
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
}