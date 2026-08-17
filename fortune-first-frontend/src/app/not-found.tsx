import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-brand-surface p-4 text-center">
      <h1 className="text-4xl font-bold text-brand-navy">404</h1>
      <p className="text-gray-600">This page could not be found.</p>
      <Link href="/" className="font-medium text-brand-orange hover:underline">
        Back to home
      </Link>
    </div>
  );
}
