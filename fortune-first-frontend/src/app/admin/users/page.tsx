'use client';

import { useEffect, useRef, useState } from 'react';
import { FileText, UploadCloud } from 'lucide-react';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  profile_picture_url?: string | null;
  client_code?: string | null;
}

interface KycData {
  bank_name: string | null;
  ifsc_code: string | null;
  upi_id: string | null;
  date_of_birth: string | null;
  document_url: string | null;
  verified: boolean;
  pan_masked: string | null;
  account_masked: string | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'customer', phone: '', assignedTo: '' });
  const [pictureFile, setPictureFile] = useState<File | null>(null);
  const pictureInputRef = useRef<HTMLInputElement>(null);
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
      // A picture is optional at creation for every role — a client uploads
      // their own later; a staff account can be given one now, or self-upload
      // later through the same self-service endpoint.
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => formData.append(key, value));
      if (pictureFile) formData.append('picture', pictureFile);

      await api.post('/admin/users', formData);
      alert('User created successfully');
      setShowModal(false);
      setForm({ name: '', email: '', password: '', role: 'customer', phone: '', assignedTo: '' });
      setPictureFile(null);
      if (pictureInputRef.current) pictureInputRef.current.value = '';
      fetchUsers();
    } catch (error) {
      alert(getErrorMessage(error, 'Failed to create user'));
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center gap-3 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">User Management</h1>
        <button onClick={() => setShowModal(true)} className="shrink-0 bg-brand-orange text-white px-3 py-2 text-sm sm:px-4 sm:text-base rounded-md">
          + Create User
        </button>
      </div>

      {/* Table — desktop/tablet */}
      <div className="hidden md:block bg-card rounded-xl shadow-sm border border-brand-border overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-brand-surface text-foreground">
              <th className="p-4 text-sm font-medium">Name</th>
              <th className="p-4 text-sm font-medium">Client ID</th>
              <th className="p-4 text-sm font-medium">Email</th>
              <th className="p-4 text-sm font-medium">Role</th>
              <th className="p-4 text-sm font-medium">Status</th>
              <th className="p-4 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-muted">
                <td className="p-4 text-sm font-medium">
                  <div className="flex items-center gap-2.5">
                    <Avatar src={u.profile_picture_url} name={u.name} size={28} />
                    {u.name}
                  </div>
                </td>
                <td className="p-4 text-sm font-mono text-muted-foreground">{u.client_code || '—'}</td>
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

      {/* Cards — mobile */}
      <div className="space-y-3 md:hidden">
        {users.map((u) => (
          <div key={u.id} className="rounded-xl border border-brand-border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-foreground">{u.name}</p>
                <p className="truncate text-sm text-muted-foreground">{u.email}</p>
                {u.client_code && <p className="mt-0.5 font-mono text-xs text-muted-foreground">{u.client_code}</p>}
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${
                  u.is_active
                    ? 'bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-400'
                    : 'bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-400'
                }`}
              >
                {u.is_active ? 'Active' : 'Suspended'}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-brand-border pt-3">
              <span className="text-xs font-medium capitalize text-muted-foreground">{u.role.replace('_', ' ')}</span>
              {u.role === 'customer' && (
                <button onClick={() => openKyc(u)} className="text-sm font-medium text-brand-orange hover:underline">
                  View KYC
                </button>
              )}
            </div>
          </div>
        ))}
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
                  <div><p className="text-muted-foreground">UPI ID</p><p className="font-medium">{kycData.upi_id || 'Not Submitted'}</p></div>
                  <div><p className="text-muted-foreground">Date of Birth</p><p className="font-medium">{kycData.date_of_birth ? kycData.date_of_birth.slice(0, 10) : 'Not Submitted'}</p></div>
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

              <div>
                <input
                  ref={pictureInputRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={(e) => setPictureFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="new-user-picture-input"
                />
                <label
                  htmlFor="new-user-picture-input"
                  className="flex w-full cursor-pointer items-center gap-2 rounded border border-brand-border p-2 text-sm text-muted-foreground hover:bg-muted"
                >
                  <UploadCloud size={16} />
                  {pictureFile ? pictureFile.name : 'Profile picture (optional)'}
                </label>
              </div>

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