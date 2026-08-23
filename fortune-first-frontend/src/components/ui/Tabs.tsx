'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface TabItem {
  key: string;
  label: string;
}

interface TabsProps {
  items: TabItem[];
  defaultKey?: string;
  children: (activeKey: string) => React.ReactNode;
}

export function Tabs({ items, defaultKey, children }: TabsProps) {
  const [active, setActive] = useState(defaultKey ?? items[0]?.key);

  return (
    <div>
      <div className="flex gap-1 border-b border-brand-border">
        {items.map((item) => (
          <button
            key={item.key}
            onClick={() => setActive(item.key)}
            className={cn(
              '-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
              active === item.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="pt-6">{children(active)}</div>
    </div>
  );
}
