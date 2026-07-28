"use client";

import Image from "next/image";
import Link from "next/link";
import { Phone, Mail, ChevronRight } from "lucide-react";

const quickLinks = [
  { name: "Contact", href: "#" },
  { name: "FAQ", href: "#" },
  { name: "Blog", href: "#blog" },
  { name: "Terms & Conditions", href: "#" },
];

export default function Footer() {
  return (
    <footer
      className="py-8 md:py-10 px-4 md:px-6"
      style={{
        backgroundColor: "var(--footer-bg)",
        color: "var(--footer-foreground)",
      }}
    >
      <div className="container-max">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Brand Column */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <Image
                src="/logo_img.png"
                alt="Fortune First Logo"
                width={32}
                height={32}
                className="rounded-full"
              />
              <span
                className="text-base font-bold text-white"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Fortune First
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <a
                href="tel:+912234567890"
                className="flex items-center gap-2 text-xs hover:text-[var(--primary)] transition-colors duration-200"
              >
                <Phone size={14} />
                +91 22345 67890
              </a>
              <a
                href="mailto:info@fortunefirst.com"
                className="flex items-center gap-2 text-xs hover:text-[var(--primary)] transition-colors duration-200"
              >
                <Mail size={14} />
                info@fortunefirst.com
              </a>
            </div>
          </div>

          {/* Quick Links Column */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-3">
              Quick Links
            </h3>
            <ul className="flex flex-col gap-2">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="flex items-center gap-1 text-xs hover:text-[var(--primary)] transition-colors duration-200 group"
                  >
                    <ChevronRight
                      size={12}
                      className="text-[var(--primary)] transition-transform duration-200 group-hover:translate-x-1"
                    />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-white/10 pt-4 text-center">
          <p className="text-[10px] md:text-xs text-[var(--footer-foreground)]/60">
            © 2026 Fortune First. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
