'use client';

import { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
}

interface KycData {
  bank_name: string | null;
  ifsc_code: string | null;
  document_url: string | null;
  verified: boolean;
  pan_masked: string | null;
  account_masked: string | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'customer', phone: '', assignedTo: '' });
  const [kycUser, setKycUser] = useState<AdminUser | null>(null);
  const [kycData, setKycData] = useState<KycData | null>(null);
  const [kycLoading, setKycLoading] = useState(false);

  const fetchUsers = async () => {
    const res = await api.get('/admin/users');
    setUsers(res.data.data);
  };

  useEffect(() => { fetchUsers(); }, []);

  const heads = users.filter((u) => u.role === 'investment_head');

  const openKyc = async (user: AdminUser) => {
    setKycUser(user);
    setKycLoading(true);
    try {
      const res = await api.get(`/admin/users/${user.id}/kyc`);
      setKycData(res.data.data);
    } catch (error) {
      alert(getErrorMessage(error, 'Failed to load KYC details'));
      setKycUser(null);
    } finally {
      setKycLoading(false);
    }
  };

  const toggleVerified = async () => {
    if (!kycUser || !kycData) return;
    try {
      const res = await api.patch(`/admin/users/${kycUser.id}/kyc/verify`, { verified: !kycData.verified });
      setKycData({ ...kycData, verified: res.data.data.verified });
    } catch (error) {
      alert(getErrorMessage(error, 'Failed to update KYC status'));
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/users', form);
      alert('User created successfully');
      setShowModal(false);
      setForm({ name: '', email: '', password: '', role: 'customer', phone: '', assignedTo: '' });
      fetchUsers();
    } catch (error) {
      alert(getErrorMessage(error, 'Failed to create user'));
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">User Management</h1>
        <button onClick={() => setShowModal(true)} className="bg-brand-orange text-white px-4 py-2 rounded-md">
          + Create User
        </button>
      </div>

      <div className="bg-card rounded-xl shadow-sm border border-brand-border overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-brand-surface text-foreground">
              <th className="p-4 text-sm font-medium">Name</th>
              <th className="p-4 text-sm font-medium">Email</th>
              <th className="p-4 text-sm font-medium">Role</th>
              <th className="p-4 text-sm font-medium">Status</th>
              <th className="p-4 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-muted">
                <td className="p-4 text-sm font-medium">{u.name}</td>
                <td className="p-4 text-sm">{u.email}</td>
                <td className="p-4 text-sm capitalize">{u.role.replace('_', ' ')}</td>
                <td className="p-4 text-sm">
                  <span className={`px-2 py-1 text-xs rounded-full ${u.is_active ? 'bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-400'}`}>
                    {u.is_active ? 'Active' : 'Suspended'}
                  </span>
                </td>
                <td className="p-4 text-sm">
                  {u.role === 'customer' && (
                    <button onClick={() => openKyc(u)} className="text-brand-orange font-medium hover:underline">
                      View KYC
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* KYC Review Modal */}
      {kycUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card p-6 rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">KYC — {kycUser.name}</h2>
              <span className={`px-2 py-1 text-xs rounded-full ${kycData?.verified ? 'bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-400'}`}>
                {kycData?.verified ? 'Verified' : 'Pending'}
              </span>
            </div>

            {kycLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : !kycData ? (
              <p className="text-sm text-muted-foreground">This customer has not submitted KYC details yet.</p>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-muted-foreground">PAN</p><p className="font-medium">{kycData.pan_masked || 'Not Submitted'}</p></div>
                  <div><p className="text-muted-foreground">Account No.</p><p className="font-medium">{kycData.account_masked || 'Not Submitted'}</p></div>
                  <div><p className="text-muted-foreground">Bank</p><p className="font-medium">{kycData.bank_name || 'Not Submitted'}</p></div>
                  <div><p className="text-muted-foreground">IFSC</p><p className="font-medium">{kycData.ifsc_code || 'Not Submitted'}</p></div>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Document</p>
                  {kycData.document_url ? (
                    <a href={kycData.document_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-brand-orange hover:underline">
                      <FileText size={16} /> View uploaded document
                    </a>
                  ) : (
                    <p className="text-muted-foreground">Not uploaded</p>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2 mt-6">
              <button onClick={() => { setKycUser(null); setKycData(null); }} className="px-4 py-2 bg-muted rounded">Close</button>
              {kycData && (
                <button onClick={toggleVerified} className="px-4 py-2 bg-brand-navy text-white rounded">
                  {kycData.verified ? 'Mark Unverified' : 'Mark Verified'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Basic Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card p-6 rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Create New Account</h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <input required placeholder="Full Name" className="w-full border p-2 rounded" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              <input required type="email" placeholder="Email" className="w-full border p-2 rounded" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              <input required type="password" minLength={8} placeholder="Temporary Password (min 8 characters)" className="w-full border p-2 rounded" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
              <input type="tel" placeholder="Phone (optional)" className="w-full border p-2 rounded" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              <select className="w-full border p-2 rounded" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                <option value="customer">Customer</option>
                <option value="investment_head">Investment Head</option>
                <option value="business_head">Business Head</option>
                <option value="super_admin">Super Admin</option>
              </select>
              {form.role === 'customer' && (
                <select 
                  required 
                  className="w-full border p-2 rounded" 
                  value={form.assignedTo} 
                  onChange={e => setForm({...form, assignedTo: e.target.value})}
                >
                  <option value="">Assign to Investment Head...</option>
                  {heads.map((head) => (
                    <option key={head.id} value={head.id}>{head.name}</option>
                  ))}
                </select>
              )}
              <div className="flex justify-end space-x-2 mt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-muted rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-brand-navy text-white rounded">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}