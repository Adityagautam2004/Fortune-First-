import { Bitcoin } from 'lucide-react';
import { ComingSoon } from '@/components/shared/coming-soon';

export default function AdminInvestmentsPage() {
  return (
    <ComingSoon
      icon={Bitcoin}
      title="Investments"
      description="A firm-wide investments overview is on the way."
    />
  );
}
