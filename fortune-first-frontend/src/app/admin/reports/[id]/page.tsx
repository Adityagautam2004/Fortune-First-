'use client';

import { use } from 'react';
import { ReportDetailPage } from '@/features/reports/report-detail-page';

export default function AdminReportDetailRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ReportDetailPage reportId={id} />;
}
