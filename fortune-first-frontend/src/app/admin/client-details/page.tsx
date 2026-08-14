import { User } from 'lucide-react';
import { ComingSoon } from '@/components/shared/coming-soon';

export default function ClientDetailsPage() {
  return (
    <ComingSoon
      icon={User}
      title="Client Details"
      description="A firm-wide client directory is on the way."
    />
  );
}
