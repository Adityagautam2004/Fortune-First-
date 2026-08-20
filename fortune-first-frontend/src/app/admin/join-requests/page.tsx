'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface JoinRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  amount: string;
  message: string | null;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export default function JoinRequestsPage() {
  const [requests, setRequests] = useState<JoinRequest[]>([]);

  const fetchRequests = async () => {
    const res = await api.get('/admin/join-requests');
    setRequests(res.data.data);
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/admin/join-requests/${id}`, { status });
      fetchRequests();
    } catch {
      alert('Failed to update status');
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-brand-navy mb-6">Join Requests</h1>
      <div className="space-y-4">
        {requests.map((req) => (
          <div key={req.id} className="bg-white p-6 rounded-xl shadow-sm border border-brand-border flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg">{req.name}</h3>
              <p className="text-sm text-gray-500">{req.email} | {req.phone}</p>
              <p className="text-sm mt-2"><strong>Intended Amount:</strong> {req.amount}</p>
              {req.message && <p className="text-sm italic mt-1">&quot;{req.message}&quot;</p>}
            </div>
            <div className="flex flex-col items-end space-y-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                req.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                req.status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {req.status}
              </span>
              {req.status === 'Pending' && (
                <div className="space-x-2 mt-2">
                  <button onClick={() => handleUpdateStatus(req.id, 'Approved')} className="text-xs bg-brand-navy text-white px-3 py-1 rounded hover:bg-opacity-90">Approve</button>
                  <button onClick={() => handleUpdateStatus(req.id, 'Rejected')} className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200">Reject</button>
                </div>
              )}
            </div>
          </div>
        ))}
        {requests.length === 0 && <p className="text-gray-500">No join requests available.</p>}
      </div>
    </div>
  );
}