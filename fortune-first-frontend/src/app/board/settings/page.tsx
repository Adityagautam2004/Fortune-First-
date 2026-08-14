import { Settings } from 'lucide-react';
import { ComingSoon } from '@/components/shared/coming-soon';

export default function BoardSettingsPage() {
  return (
    <ComingSoon
      icon={Settings}
      title="Settings"
      description="Account and notification settings are on the way."
    />
  );
}
