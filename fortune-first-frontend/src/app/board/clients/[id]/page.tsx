'use client';

import { use } from 'react';
import { ClientDetailPage } from '@/features/board/client-detail-page';

export default function ClientDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ClientDetailPage clientId={id} />;
}
