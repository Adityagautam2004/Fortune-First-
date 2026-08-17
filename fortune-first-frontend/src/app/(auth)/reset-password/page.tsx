import ResetPasswordClient from './ResetPasswordClient';

// Driven entirely by a one-time URL token — never statically prerender this.
export const dynamic = 'force-dynamic';

export default function ResetPasswordPage() {
  return <ResetPasswordClient />;
}
