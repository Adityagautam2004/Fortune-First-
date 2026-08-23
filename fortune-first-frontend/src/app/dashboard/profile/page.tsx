'use client';

import { useEffect, useRef, useState } from 'react';
import { FileText, UploadCloud, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';

interface CustomerProfileData {
  name: string;
  email: string;
  phone?: string | null;
  pan_masked?: string | null;
  bank_name?: string | null;
  ifsc_code?: string | null;
  upi_id?: string | null;
  date_of_birth?: string | null;
  document_url?: string | null;
  account_masked?: string | null;
  verified: boolean;
}

const EMPTY_FORM = { panNumber: '', bankName: '', accountNumber: '', ifscCode: '', upiId: '', dateOfBirth: '' };

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
      setForm((prev) => ({
        ...prev,
        bankName: data.bank_name || '',
        ifscCode: data.ifsc_code || '',
        upiId: data.upi_id || '',
        // date_of_birth comes back as a full ISO datetime string; <input type="date"> needs just the date part.
        dateOfBirth: data.date_of_birth ? data.date_of_birth.slice(0, 10) : '',
      }));
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
    } catch (error) {
      setKycMessage(getErrorMessage(error, 'Failed to submit KYC details'));
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
    } catch (error) {
      setUploadError(getErrorMessage(error, 'Failed to upload document'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Profile & KYC</h1>

      <div className="bg-card rounded-xl shadow-sm border border-brand-border p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">Personal Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div><p className="text-sm text-muted-foreground">Full Name</p><p className="font-medium">{profile.name}</p></div>
          <div><p className="text-sm text-muted-foreground">Email</p><p className="font-medium">{profile.email}</p></div>
          <div><p className="text-sm text-muted-foreground">Phone</p><p className="font-medium">{profile.phone || 'N/A'}</p></div>
        </div>
      </div>

      <div className="bg-card rounded-xl shadow-sm border border-brand-border p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">KYC Details</h2>
          <span className={`px-2 py-1 text-xs rounded-full ${profile.verified ? 'bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-400'}`}>
            {profile.verified ? 'Verified' : 'Pending Verification'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div><p className="text-sm text-muted-foreground">PAN Number</p><p className="font-medium">{profile.pan_masked || 'Not Submitted'}</p></div>
          <div><p className="text-sm text-muted-foreground">Bank Account</p><p className="font-medium">{profile.account_masked || 'Not Submitted'}</p></div>
          <div><p className="text-sm text-muted-foreground">UPI ID</p><p className="font-medium">{profile.upi_id || 'Not Submitted'}</p></div>
          <div><p className="text-sm text-muted-foreground">Date of Birth</p><p className="font-medium">{profile.date_of_birth ? profile.date_of_birth.slice(0, 10) : 'Not Submitted'}</p></div>
        </div>

        {profile.verified ? (
          <p className="text-sm text-muted-foreground">
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
              <input
                required
                placeholder="UPI ID (e.g. name@bank)"
                className="border border-brand-border rounded-md p-2 text-sm focus:outline-none focus:border-brand-orange"
                value={form.upiId}
                onChange={(e) => setForm({ ...form, upiId: e.target.value })}
              />
              <input
                required
                type="date"
                placeholder="Date of Birth"
                max={new Date().toISOString().slice(0, 10)}
                className="border border-brand-border rounded-md p-2 text-sm focus:outline-none focus:border-brand-orange"
                value={form.dateOfBirth}
                onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
              />
            </div>
            {kycMessage && <p className="text-sm text-foreground">{kycMessage}</p>}
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

      <div className="bg-card rounded-xl shadow-sm border border-brand-border p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">Identity Document</h2>
        <p className="text-sm text-muted-foreground mb-4">Upload a PAN card, Aadhaar, or bank statement as proof (PDF, JPG, or PNG, max 5MB).</p>

        {profile.document_url ? (
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 className="text-green-600" size={20} />
            <a href={profile.document_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-brand-orange hover:underline flex items-center gap-1">
              <FileText size={16} /> View uploaded document
            </a>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mb-4">No document uploaded yet.</p>
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
