'use client';

import { useEffect } from 'react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Frontend Crash Caught:', error);
  }, [error]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-brand-surface">
      <h2 className="text-2xl font-bold text-foreground mb-4">Something went wrong!</h2>
      <p className="text-foreground mb-6">We encountered an unexpected error.</p>
      <button
        onClick={() => reset()}
        className="bg-brand-orange text-white px-6 py-2 rounded-md font-medium"
      >
        Try again
      </button>
    </div>
  );
}