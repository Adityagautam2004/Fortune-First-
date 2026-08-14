import { MessageSquareWarning } from 'lucide-react';
import { ComingSoon } from '@/components/shared/coming-soon';

export default function BoardReportsPage() {
  return (
    <ComingSoon
      icon={MessageSquareWarning}
      title="Reports"
      description="Firm-wide reporting is on the way."
    />
  );
}
