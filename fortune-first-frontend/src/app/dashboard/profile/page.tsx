'use client';

import { useEffect, useRef, useState } from 'react';
import { FileText, UploadCloud, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';

interface CustomerProfileData {
  name: string;
  email: string;
  phone?: string | null;
  pan_masked?: string | null;
  bank_name?: string | null;
  ifsc_code?: string | null;
  document_url?: string | null;
  account_masked?: string | null;
  verified: boolean;
}

const EMPTY_FORM = { panNumber: '', bankName: '', accountNumber: '', ifscCode: '' };

export default function CustomerProfile() {
  const [profile, setProfile] = useState<CustomerProfileData | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [savingKyc, setSavingKyc] = useState(false);
  const [kycMessage, setKycMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadProfile = () => {
    api.get('/customer/profile').then((res) => {
      const data = res.data.data as CustomerProfileData;
      setProfile(data);
      setForm((prev) => ({ ...prev, bankName: data.bank_name || '', ifscCode: data.ifsc_code || '' }));
    });
  };

  useEffect(() => {
    loadProfile();
  }, []);

  if (!profile) return <div>Loading profile...</div>;

  const handleKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingKyc(true);
    setKycMessage(null);
    try {
      await api.post('/customer/kyc', form);
      setKycMessage('KYC details submitted for verification.');
      loadProfile();
    } catch (error: any) {
      setKycMessage(error.response?.data?.message || 'Failed to submit KYC details');
    } finally {
      setSavingKyc(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append('document', file);
      await api.post('/customer/kyc/document', formData);
      loadProfile();
    } catch (error: any) {
      setUploadError(error.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Profile & KYC</h1>

      <div className="bg-white rounded-xl shadow-sm border border-brand-border p-6">
        <h2 className="text-xl font-semibold text-brand-navy mb-4">Personal Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div><p className="text-sm text-gray-500">Full Name</p><p className="font-medium">{profile.name}</p></div>
          <div><p className="text-sm text-gray-500">Email</p><p className="font-medium">{profile.email}</p></div>
          <div><p className="text-sm text-gray-500">Phone</p><p className="font-medium">{profile.phone || 'N/A'}</p></div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-brand-border p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-brand-navy">KYC Details</h2>
          <span className={`px-2 py-1 text-xs rounded-full ${profile.verified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {profile.verified ? 'Verified' : 'Pending Verification'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div><p className="text-sm text-gray-500">PAN Number</p><p className="font-medium">{profile.pan_masked || 'Not Submitted'}</p></div>
          <div><p className="text-sm text-gray-500">Bank Account</p><p className="font-medium">{profile.account_masked || 'Not Submitted'}</p></div>
        </div>

        {profile.verified ? (
          <p className="text-sm text-gray-500">
            Your KYC has been verified and can no longer be edited here. Contact support if any of these details need to change.
          </p>
        ) : (
          <form onSubmit={handleKycSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                required
                placeholder="PAN Number"
                className="border border-brand-border rounded-md p-2 text-sm focus:outline-none focus:border-brand-orange"
                value={form.panNumber}
                onChange={(e) => setForm({ ...form, panNumber: e.target.value.toUpperCase() })}
              />
              <input
                required
                placeholder="Bank Name"
                className="border border-brand-border rounded-md p-2 text-sm focus:outline-none focus:border-brand-orange"
                value={form.bankName}
                onChange={(e) => setForm({ ...form, bankName: e.target.value })}
              />
              <input
                required
                placeholder="Account Number"
                className="border border-brand-border rounded-md p-2 text-sm focus:outline-none focus:border-brand-orange"
                value={form.accountNumber}
                onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
              />
              <input
                required
                placeholder="IFSC Code"
                className="border border-brand-border rounded-md p-2 text-sm uppercase focus:outline-none focus:border-brand-orange"
                value={form.ifscCode}
                onChange={(e) => setForm({ ...form, ifscCode: e.target.value.toUpperCase() })}
              />
            </div>
            {kycMessage && <p className="text-sm text-brand-navy">{kycMessage}</p>}
            <button
              type="submit"
              disabled={savingKyc}
              className="bg-brand-navy text-white px-6 py-2 rounded-md font-medium hover:bg-opacity-90 disabled:opacity-60"
            >
              {savingKyc ? 'Saving...' : 'Save KYC Details'}
            </button>
          </form>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-brand-border p-6">
        <h2 className="text-xl font-semibold text-brand-navy mb-4">Identity Document</h2>
        <p className="text-sm text-gray-500 mb-4">Upload a PAN card, Aadhaar, or bank statement as proof (PDF, JPG, or PNG, max 5MB).</p>

        {profile.document_url ? (
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 className="text-green-600" size={20} />
            <a href={profile.document_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-brand-orange hover:underline flex items-center gap-1">
              <FileText size={16} /> View uploaded document
            </a>
          </div>
        ) : (
          <p className="text-sm text-gray-500 mb-4">No document uploaded yet.</p>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
          id="kyc-document-input"
        />
        <label
          htmlFor="kyc-document-input"
          className="inline-flex items-center gap-2 cursor-pointer bg-brand-navy text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-opacity-90"
        >
          <UploadCloud size={16} />
          {uploading ? 'Uploading...' : profile.document_url ? 'Replace Document' : 'Upload Document'}
        </label>
        {uploadError && <p className="text-sm text-red-600 mt-2">{uploadError}</p>}
      </div>
    </div>
  );
}
