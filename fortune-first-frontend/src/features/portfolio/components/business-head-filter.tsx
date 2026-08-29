'use client';

import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';

import api from '@/lib/api';
import type { BusinessHeadOption } from '../types';

interface BusinessHeadFilterProps {
  value: string;
  onChange: (businessHeadId: string) => void;
  className?: string;
}

// Shared by the portfolio dashboard and the Funds Transactions log — every
// viewer role (admin/investment_head/business_head) gets this same filter.
export function BusinessHeadFilter({ value, onChange, className = '' }: BusinessHeadFilterProps) {
  const [heads, setHeads] = useState<BusinessHeadOption[]>([]);

  useEffect(() => {
    api
      .get('/board/portfolio/business-heads')
      .then((res) => setHeads(res.data.data || []))
      .catch(() => setHeads([]));
  }, []);

  return (
    <div className={`relative ${className}`}>
      <Users size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-lg border border-brand-border bg-card py-1.5 pl-8 pr-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        <option value="">All Business Heads</option>
        {heads.map((head) => (
          <option key={head.id} value={head.id}>
            {head.name}
          </option>
        ))}
      </select>
    </div>
  );
}
