"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Services", href: "#services" },
  { name: "Investments", href: "#investments" },
  { name: "Calculators", href: "#calculators" },
  { name: "Blog", href: "#blog" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <nav
      id="main-navbar"
      className="fixed top-0 left-0 right-0 z-50 bg-black/25 backdrop-blur-md border-b border-white/10"
    >
      <div className="container-max flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Logo - Left */}
        <div className="flex-1 flex justify-start">
          <Link href="/" className="flex items-center gap-3 group ml-2 md:ml-0">
            <Image
              src="/logo_img.png"
              alt="Fortune First Logo"
              width={40}
              height={40}
              className="rounded-full transition-transform duration-300 group-hover:scale-110"
            />
            <span className="text-xl font-bold tracking-tight text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Fortune First
            </span>
          </Link>
        </div>

        {/* Desktop Nav - Center */}
        <div className="hidden md:flex items-center justify-center gap-8 lg:gap-12 flex-none">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`text-sm lg:text-base font-medium transition-colors duration-200 ${
                link.name === "Home"
                  ? "text-[#f97316] font-semibold"
                  : "text-white/80 hover:text-white"
              }`}
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Right Actions - Right */}
        <div className="flex-1 flex justify-end items-center gap-2">
          {/* Login Button */}
          <Button variant="default" size="sm" className="hidden md:inline-flex rounded-md bg-[#f97316] hover:bg-[#ea580c] text-white px-6 font-semibold" asChild>
            <Link href="/login">Login</Link>
          </Button>

          {/* Mobile Menu Toggle */}
          <button
            id="mobile-menu-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} className="text-white" /> : <Menu size={22} className="text-white" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 bg-black/90 backdrop-blur-lg ${
          mobileOpen ? "max-h-80 border-t border-white/10" : "max-h-0"
        }`}
      >
        <div className="px-4 py-3 flex flex-col gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                link.name === "Home"
                  ? "text-[#f97316] bg-white/10 font-semibold"
                  : "text-white/80 hover:text-white hover:bg-white/5"
              }`}
            >
              {link.name}
            </Link>
          ))}
          <Button variant="default" size="sm" className="mt-2 rounded-md bg-[#f97316] text-white w-full font-semibold" asChild>
            <Link href="/login">Login</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}
