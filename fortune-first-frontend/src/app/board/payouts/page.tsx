import PayoutFormClient from './PayoutFormClient';

// This page is entirely driven by URL query params and live auth state (an
// Investment Head processing a specific client's payout) — there's nothing
// to statically prerender, and doing so is what was breaking `next build`.
export const dynamic = 'force-dynamic';

export default function ProcessPayoutsPage() {
  return <PayoutFormClient />;
}
