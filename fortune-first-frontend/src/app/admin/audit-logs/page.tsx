'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface AuditLog {
  id: string;
  created_at: string;
  actor_name: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const limit = 15;

  const fetchLogs = async (pageNum: number) => {
    setIsLoading(true);
    try {
      const res = await api.get(`/admin/audit-logs?page=${pageNum}&limit=${limit}`);
      setLogs(res.data.data.logs);
      setTotalPages(res.data.data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch audit logs', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchLogs(page); }, [page]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-brand-navy">Audit Logs</h1>
        <span className="text-sm text-gray-500">
          Page {page} of {totalPages}
        </span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-brand-border overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-brand-surface text-brand-navy">
              <th className="p-4 text-sm font-medium">Date</th>
              <th className="p-4 text-sm font-medium">Actor (Who)</th>
              <th className="p-4 text-sm font-medium">Action (What)</th>
              <th className="p-4 text-sm font-medium">Target (Where)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-400">Loading...</td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-400">No audit logs found.</td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="p-4 text-sm text-gray-600">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="p-4 text-sm font-medium text-gray-900">{log.actor_name || 'System'}</td>
                  <td className="p-4 text-sm">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {log.entity_type}
                    <span className="text-gray-400"> #{log.entity_id}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-4">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
          className="px-4 py-2 text-sm font-medium rounded-md border border-brand-border bg-white text-brand-navy hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          ← Previous
        </button>
        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
            .map((p, idx, arr) => (
              <span key={p}>
                {idx > 0 && arr[idx - 1] !== p - 1 && (
                  <span className="px-1 text-gray-400">…</span>
                )}
                <button
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 text-sm rounded-md transition-colors ${
                    p === page
                      ? 'bg-brand-navy text-white font-bold'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {p}
                </button>
              </span>
            ))}
        </div>
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
          className="px-4 py-2 text-sm font-medium rounded-md border border-brand-border bg-white text-brand-navy hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
