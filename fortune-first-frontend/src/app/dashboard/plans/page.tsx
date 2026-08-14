import { NotebookText } from 'lucide-react';
import { ComingSoon } from '@/components/shared/coming-soon';

export default function MyPlansPage() {
  return (
    <ComingSoon
      icon={NotebookText}
      title="My Plans"
      description="Your active and upcoming investment plans will show up here."
    />
  );
}
