import { FileText } from 'lucide-react';
import { ComingSoon } from '@/components/shared/coming-soon';

export default function DocumentHubPage() {
  return (
    <ComingSoon
      icon={FileText}
      title="Document Hub"
      description="Shared client documents and statements will live here soon."
    />
  );
}
