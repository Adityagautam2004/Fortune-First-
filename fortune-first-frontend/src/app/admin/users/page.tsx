'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'customer', phone: '' });

  const fetchUsers = async () => {
    const res = await api.get('/admin/users');
    setUsers(res.data.data);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/users', form);
      alert('User created successfully');
      setShowModal(false);
      fetchUsers();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create user');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-brand-navy">User Management</h1>
        <button onClick={() => setShowModal(true)} className="bg-brand-orange text-white px-4 py-2 rounded-md">
          + Create User
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-brand-border overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-brand-surface text-brand-navy">
              <th className="p-4 text-sm font-medium">Name</th>
              <th className="p-4 text-sm font-medium">Email</th>
              <th className="p-4 text-sm font-medium">Role</th>
              <th className="p-4 text-sm font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((u: any) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="p-4 text-sm font-medium">{u.name}</td>
                <td className="p-4 text-sm">{u.email}</td>
                <td className="p-4 text-sm capitalize">{u.role.replace('_', ' ')}</td>
                <td className="p-4 text-sm">
                  <span className={`px-2 py-1 text-xs rounded-full ${u.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {u.is_active ? 'Active' : 'Suspended'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Basic Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-96">
            <h2 className="text-xl font-bold mb-4">Create New Account</h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <input required placeholder="Full Name" className="w-full border p-2 rounded" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              <input required type="email" placeholder="Email" className="w-full border p-2 rounded" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              <input required type="password" placeholder="Temporary Password" className="w-full border p-2 rounded" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
              <select className="w-full border p-2 rounded" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                <option value="customer">Customer</option>
                <option value="investment_head">Investment Head</option>
                <option value="business_head">Business Head</option>
                <option value="super_admin">Super Admin</option>
              </select>
              <div className="flex justify-end space-x-2 mt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-brand-navy text-white rounded">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}