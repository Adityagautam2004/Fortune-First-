'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface CustomerProfileData {
  name: string;
  email: string;
  phone?: string | null;
  pan_masked?: string | null;
  bank_name?: string | null;
  verified: boolean;
}

export default function CustomerProfile() {
  const [profile, setProfile] = useState<CustomerProfileData | null>(null);

  useEffect(() => {
    api.get('/customer/profile').then(res => setProfile(res.data.data));
  }, []);

  if (!profile) return <div>Loading profile...</div>;

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Profile & KYC</h1>
      
      <div className="bg-white rounded-xl shadow-sm border border-brand-border p-6 mb-6">
        <h2 className="text-xl font-semibold text-brand-navy mb-4">Personal Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div><p className="text-sm text-gray-500">Full Name</p><p className="font-medium">{profile.name}</p></div>
          <div><p className="text-sm text-gray-500">Email</p><p className="font-medium">{profile.email}</p></div>
          <div><p className="text-sm text-gray-500">Phone</p><p className="font-medium">{profile.phone || 'N/A'}</p></div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-brand-border p-6">
        <h2 className="text-xl font-semibold text-brand-navy mb-4">KYC Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div><p className="text-sm text-gray-500">PAN Number</p><p className="font-medium">{profile.pan_masked || 'Not Submitted'}</p></div>
          <div><p className="text-sm text-gray-500">Bank Name</p><p className="font-medium">{profile.bank_name || 'Not Submitted'}</p></div>
          <div><p className="text-sm text-gray-500">KYC Status</p>
            <span className={`px-2 py-1 text-xs rounded-full ${profile.verified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {profile.verified ? 'Verified' : 'Pending Verification'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}