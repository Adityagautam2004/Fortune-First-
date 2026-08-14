import { Bitcoin } from 'lucide-react';
import { ComingSoon } from '@/components/shared/coming-soon';

export default function InvestmentPage() {
  return (
    <ComingSoon
      icon={Bitcoin}
      title="Investment"
      description="A dedicated view of your investment options is on the way."
    />
  );
}
