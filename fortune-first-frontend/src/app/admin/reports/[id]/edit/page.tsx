'use client';

import { use } from 'react';
import { ReportFormPage } from '@/features/reports/report-form-page';

export default function AdminEditReportRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ReportFormPage reportId={id} />;
}
