import { ArrowLeftRight } from 'lucide-react';
import { ComingSoon } from '@/components/shared/coming-soon';

export default function AdminTransactionsPage() {
  return (
    <ComingSoon
      icon={ArrowLeftRight}
      title="Transactions"
      description="A firm-wide transaction ledger is on the way."
    />
  );
}
