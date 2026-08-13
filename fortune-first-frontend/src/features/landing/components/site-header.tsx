'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';

import { Button } from '@/components/ui/Button';

const NAV_LINKS = [
  { name: 'Home', href: '/' },
  { name: 'Services', href: '#services' },
  { name: 'Investments', href: '#investments' },
  { name: 'Calculators', href: '#calculators' },
  { name: 'Blog', href: '#blog' },
];

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? 'border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur-md'
          : 'border-b border-white/10 bg-transparent'
      }`}
    >
      <div className="container-max flex h-16 items-center justify-between px-4 lg:px-6">
        <div className="flex flex-1 justify-start">
          <Link href="/" className="group ml-2 flex items-center gap-3 md:ml-0">
            <Image
              src="/logo_img.png"
              alt="Fortune First Logo"
              width={44}
              height={44}
              className="object-contain transition-transform duration-300 group-hover:scale-110"
            />
            <span
              className={`text-xl font-bold tracking-tight transition-colors duration-300 ${
                scrolled ? 'text-gray-900' : 'text-white'
              }`}
            >
              Fortune First
            </span>
          </Link>
        </div>

        <nav className="hidden flex-none items-center justify-center gap-8 md:flex lg:gap-12">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`text-sm font-medium transition-colors duration-200 lg:text-base ${
                link.name === 'Home'
                  ? 'font-semibold text-primary'
                  : scrolled
                  ? 'text-gray-700 hover:text-gray-900'
                  : 'text-white/90 hover:text-white'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        <div className="flex flex-1 items-center justify-end gap-2">
          <Button asChild variant="primary" size="sm" className="hidden md:inline-flex rounded-md shadow-sm">
            <Link href="/login">Login</Link>
          </Button>

          <button
            onClick={() => setMobileOpen((open) => !open)}
            className="rounded-lg p-2 transition-colors hover:bg-white/10 md:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <X size={22} className={scrolled ? 'text-gray-900' : 'text-white'} />
            ) : (
              <Menu size={22} className={scrolled ? 'text-gray-900' : 'text-white'} />
            )}
          </button>
        </div>
      </div>

      <div
        className={`overflow-hidden transition-all duration-300 md:hidden ${
          scrolled ? 'bg-white' : 'bg-black/70 backdrop-blur-md'
        } ${mobileOpen ? 'max-h-80 border-t border-white/10' : 'max-h-0'}`}
      >
        <div className="flex flex-col gap-1 px-4 py-3">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                link.name === 'Home'
                  ? 'font-semibold text-primary'
                  : scrolled
                  ? 'text-gray-700 hover:bg-gray-50'
                  : 'text-white/90 hover:bg-white/10'
              }`}
            >
              {link.name}
            </Link>
          ))}
          <Button asChild variant="primary" className="mt-2 rounded-md">
            <Link href="/login" onClick={() => setMobileOpen(false)}>
              Login
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
