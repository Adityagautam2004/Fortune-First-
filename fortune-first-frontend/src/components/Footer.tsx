"use client";

import Image from "next/image";
import Link from "next/link";
import { Phone, Mail, ChevronRight } from "lucide-react";

const quickLinks = [
  { name: "Contact", href: "#" },
  { name: "FAQ", href: "#" },
  { name: "Blog", href: "#" },
  { name: "Terms & Conditions", href: "#" },
];

export default function Footer() {
  return (
    <footer className="bg-[#111827] text-gray-300 py-12 border-t border-gray-800">
      <div className="container-max">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10 max-w-5xl mx-auto px-4 md:px-0">
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Image
                src="/logo_img.png"
                alt="Fortune First Logo"
                width={36}
                height={36}
                className="object-contain"
              />
              <span className="text-lg font-bold text-white tracking-wide" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Fortune First
              </span>
            </div>
            <p className="text-xs text-gray-400 mb-6 max-w-sm leading-relaxed">
              Helping investors grow wealth securely and smartly with expert guidance.
            </p>
            <div className="flex flex-col gap-2.5 text-xs text-gray-300">
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-[#f97316]" />
                <span>+91 1234567890</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-[#f97316]" />
                <span>info@fortunefirst.com</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Quick Links
            </h4>
            <ul className="flex flex-col gap-2.5">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-[#f97316] transition-colors"
                  >
                    <ChevronRight size={12} className="text-[#f97316]" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-800 text-center text-xs text-gray-500">
          <p>© {new Date().getFullYear()} Fortune First. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
