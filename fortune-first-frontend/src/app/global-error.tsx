'use client';

// global-error replaces the entire root layout when an error escapes it, so
// it must render its own <html>/<body> — it can't rely on layout.tsx.
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '1rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Something went wrong</h1>
          <p style={{ color: '#666' }}>Please try again.</p>
          <button
            onClick={() => reset()}
            style={{ padding: '0.5rem 1.5rem', borderRadius: '0.375rem', backgroundColor: '#f97316', color: 'white', fontWeight: 600 }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
