import { FileText } from 'lucide-react';
import { ComingSoon } from '@/components/shared/coming-soon';

export default function AdminReportsPage() {
  return (
    <ComingSoon
      icon={FileText}
      title="Reports"
      description="Firm-wide reporting is on the way."
    />
  );
}
