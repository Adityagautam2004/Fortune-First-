'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '@/store/authSlice';
import { useRouter } from 'next/navigation';
import type { AppDispatch, RootState } from '@/store/store';

export default function BoardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);

  const handleLogout = () => {
    dispatch(logout());
    router.push('/login');
  };

  // Dynamically render nav items based on specific board role
  const navItems = [
    { name: 'Overview', path: '/board' },
    { name: 'My Clients', path: '/board/clients' },
    ...(user?.role === 'investment_head' ? [{ name: 'Process Payouts', path: '/board/payouts' }] : []),
    { name: 'Chat', path: '/board/chat' },
    { name: 'Portfolio', path: '/board/portfolio' },
  ];

  return (
    <div className="flex min-h-screen bg-brand-surface">
      <aside className="w-64 bg-brand-navy text-white flex flex-col">
        <div className="p-6 text-xl font-bold border-b border-gray-700">Fortune First Board</div>
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
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}