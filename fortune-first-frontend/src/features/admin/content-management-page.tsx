'use client';

import { FileText } from 'lucide-react';

import { Tabs } from '@/components/ui/Tabs';
import { ComingSoon } from '@/components/shared/coming-soon';
import { TestimonialsManagement } from './testimonials-management';
import { PublicReturnsManagement } from './public-returns-management';

const TABS = [
  { key: 'reports', label: 'Reports' },
  { key: 'testimonials', label: 'Testimonials' },
  { key: 'returns', label: 'Past Returns' },
];

export function ContentManagementPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">Content Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">Landing page content.</p>
      </div>

      <Tabs items={TABS} defaultKey="reports">
        {(active) => {
          if (active === 'testimonials') return <TestimonialsManagement />;
          if (active === 'returns') return <PublicReturnsManagement />;
          return (
            <ComingSoon
              icon={FileText}
              title="Reports"
              description="Firm-wide reporting is on the way."
            />
          );
        }}
      </Tabs>
    </div>
  );
}
