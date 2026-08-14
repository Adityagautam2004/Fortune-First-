import { TriangleAlert } from 'lucide-react';
import { ComingSoon } from '@/components/shared/coming-soon';

export default function RiskAnalyticsPage() {
  return (
    <ComingSoon
      icon={TriangleAlert}
      title="Risk Analytics"
      description="Portfolio risk profiling and alerts will show up here once risk tracking is modeled."
    />
  );
}
