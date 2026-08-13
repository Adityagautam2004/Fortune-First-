"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Services", href: "#services" },
  { name: "Investments", href: "#investments" },
  { name: "Calculators", href: "#calculators" },
  { name: "Blog", href: "#blog" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      id="main-navbar"
      className={`w-full fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm"
          : "bg-transparent border-b border-white/10"
      }`}
    >
      <div className="container-max flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Logo - Left */}
        <div className="flex-1 flex justify-start">
          <Link href="/" className="flex items-center gap-3 group ml-2 md:ml-0">
            <Image
              src="/logo_img.png"
              alt="Fortune First Logo"
              width={44}
              height={44}
              className="object-contain transition-transform duration-300 group-hover:scale-110"
            />
            <span
              className={`text-xl font-bold tracking-tight transition-colors duration-300 ${
                scrolled ? "text-gray-900" : "text-white"
              }`}
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
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
                  : scrolled
                  ? "text-gray-700 hover:text-gray-900"
                  : "text-white/90 hover:text-white"
              }`}
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Right Actions - Right */}
        <div className="flex-1 flex justify-end items-center gap-2">
          {/* Login Button */}
          <Link
            href="/login"
            className="hidden md:inline-flex items-center justify-center rounded-md bg-[#f97316] hover:bg-[#ea580c] text-white px-6 py-2 text-sm font-semibold transition-colors shadow-sm"
          >
            Login
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            id="mobile-menu-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <X size={22} className={scrolled ? "text-gray-900" : "text-white"} />
            ) : (
              <Menu size={22} className={scrolled ? "text-gray-900" : "text-white"} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${
          scrolled ? "bg-white" : "bg-black/70 backdrop-blur-md"
        } ${mobileOpen ? "max-h-80 border-t border-white/10" : "max-h-0"}`}
      >
        <div className="px-4 py-3 flex flex-col gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                link.name === "Home"
                  ? "text-[#f97316] font-semibold"
                  : scrolled
                  ? "text-gray-700 hover:bg-gray-50"
                  : "text-white/90 hover:bg-white/10"
              }`}
            >
              {link.name}
            </Link>
          ))}
          <Link
            href="/login"
            onClick={() => setMobileOpen(false)}
            className="mt-2 text-center rounded-md bg-[#f97316] text-white py-2.5 font-semibold"
          >
            Login
          </Link>
        </div>
      </div>
    </nav>
  );
}
