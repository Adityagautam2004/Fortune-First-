import Link from 'next/link';
import JoinForm from '@/components/public/JoinForm';
import Calculators from '@/components/public/Calculators';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-brand-bg font-sans text-brand-navy">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-brand-navy text-white p-4 shadow-md flex justify-between items-center">
        <div className="text-2xl font-bold">Fortune First</div>
        <div className="space-x-6 hidden md:block">
          <Link href="#services" className="hover:text-brand-orange">Services</Link>
          <Link href="#calculators" className="hover:text-brand-orange">Calculators</Link>
          <Link href="/login" className="bg-brand-orange px-4 py-2 rounded-md hover:bg-opacity-90 font-medium">
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-brand-surface py-20 px-8 text-center">
        <h1 className="text-5xl font-bold mb-4">Grow Your Wealth Smartly</h1>
        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
          Expert fund management and transparent tracking for your financial future.
        </p>
        <Link href="#join">
          <button className="bg-brand-orange text-white px-8 py-3 rounded-md text-lg font-bold hover:bg-opacity-90">
            Get Started
          </button>
        </Link>
      </section>

      {/* Calculators Section */}
      <section id="calculators" className="py-16 px-8 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-8">Financial Calculators</h2>
        <Calculators />
      </section>

      {/* Request to Join Section */}
      <section id="join" className="bg-brand-surface py-16 px-8">
        <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-md border border-brand-border">
          <h2 className="text-2xl font-bold text-center mb-6">Request to Join</h2>
          <JoinForm />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-brand-navy text-white text-center p-8 mt-12">
        <p>Contact: info@fortunefirst.com</p>
        <p className="text-sm text-gray-400 mt-2">© 2026 Fortune First Pvt. All rights reserved.</p>
      </footer>
    </div>
  );
}