import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, Mail, Phone } from 'lucide-react';

const QUICK_LINKS = [
  { name: 'Contact', href: '#' },
  { name: 'FAQ', href: '#' },
  { name: 'Blog', href: '#' },
  { name: 'Terms & Conditions', href: '#' },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-gray-800 bg-secondary py-12 text-gray-300">
      <div className="container-max">
        <div className="mx-auto mb-10 grid max-w-5xl grid-cols-1 gap-10 px-4 md:grid-cols-2 md:px-0">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <Image src="/logo_img.png" alt="Fortune First Logo" width={36} height={36} className="object-contain" />
              <span className="text-lg font-bold tracking-wide text-white">Fortune First</span>
            </div>
            <p className="mb-6 max-w-sm text-xs leading-relaxed text-gray-400">
              Helping investors grow wealth securely and smartly with expert guidance.
            </p>
            <div className="flex flex-col gap-2.5 text-xs text-gray-300">
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-primary" />
                <span>+91 1234567890</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-primary" />
                <span>info@fortunefirst.com</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">Quick Links</h4>
            <ul className="flex flex-col gap-2.5">
              {QUICK_LINKS.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="inline-flex items-center gap-1 text-xs text-gray-400 transition-colors hover:text-primary"
                  >
                    <ChevronRight size={12} className="text-primary" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 text-center text-xs text-gray-500">
          <p>&copy; {new Date().getFullYear()} Fortune First. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
