import { PieChart } from 'lucide-react';
import { ComingSoon } from '@/components/shared/coming-soon';

export default function AdminPortfolioPage() {
  return (
    <ComingSoon
      icon={PieChart}
      title="Portfolio Dashboard"
      description="A consolidated, firm-wide portfolio view will show up here once this section is built out."
    />
  );
}
