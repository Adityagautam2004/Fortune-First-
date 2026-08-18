'use client';

import { FileText } from 'lucide-react';

import { Tabs } from '@/components/ui/Tabs';
import { ComingSoon } from '@/components/shared/coming-soon';
import { CommunicationPage } from './communication-page';

const TABS = [
  { key: 'reports', label: 'Reports' },
  { key: 'communication', label: 'Communication' },
];

export function ContentManagementPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Content Management</h1>
        <p className="mt-1 text-sm text-gray-500">Reports and team communication.</p>
      </div>

      <Tabs items={TABS} defaultKey="reports">
        {(active) =>
          active === 'communication' ? (
            <CommunicationPage />
          ) : (
            <ComingSoon
              icon={FileText}
              title="Reports"
              description="Firm-wide reporting is on the way."
            />
          )
        }
      </Tabs>
    </div>
  );
}
