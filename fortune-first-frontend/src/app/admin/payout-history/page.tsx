import { History } from 'lucide-react';
import { ComingSoon } from '@/components/shared/coming-soon';

export default function PayoutHistoryPage() {
  return (
    <ComingSoon
      icon={History}
      title="Payout History"
      description="A record of all processed payouts is on the way."
    />
  );
}
