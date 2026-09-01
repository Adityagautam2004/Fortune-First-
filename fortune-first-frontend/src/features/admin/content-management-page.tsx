'use client';

import { Tabs } from '@/components/ui/Tabs';
import { TestimonialsManagement } from './testimonials-management';
import { PublicReturnsManagement } from './public-returns-management';

const TABS = [
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

      <Tabs items={TABS} defaultKey="testimonials">
        {(active) => (active === 'returns' ? <PublicReturnsManagement /> : <TestimonialsManagement />)}
      </Tabs>
    </div>
  );
}
