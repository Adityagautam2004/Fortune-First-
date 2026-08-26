'use client';

import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import type { LucideIcon } from 'lucide-react';
import {
  User,
  Mail,
  Phone,
  Calendar,
  UserCircle2,
  ShieldCheck,
  CreditCard,
  Landmark,
  IndianRupee,
  FileText,
  UploadCloud,
  CheckCircle2,
  Pencil,
  Loader2,
} from 'lucide-react';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { setProfilePicture } from '@/store/authSlice';
import type { AppDispatch } from '@/store/store';

interface CustomerProfileData {
  name: string;
  email: string;
  phone?: string | null;
  created_at: string;
  profile_picture_url?: string | null;
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

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function InfoRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <span className="flex items-center gap-2.5 text-sm text-muted-foreground">
        <Icon size={16} className="shrink-0" />
        {label}
      </span>
      <span className="break-words text-right text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}

export default function CustomerProfile() {
  const dispatch = useDispatch<AppDispatch>();
  const [profile, setProfile] = useState<CustomerProfileData | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [savingKyc, setSavingKyc] = useState(false);
  const [kycMessage, setKycMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pictureInputRef = useRef<HTMLInputElement>(null);

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

  if (!profile) return <div className="p-6 text-sm text-muted-foreground">Loading profile...</div>;

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

  const handlePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPicture(true);
    try {
      const formData = new FormData();
      formData.append('picture', file);
      const res = await api.patch('/auth/me/profile-picture', formData);
      const url = res.data.data.profilePictureUrl as string;
      setProfile((prev) => (prev ? { ...prev, profile_picture_url: url } : prev));
      dispatch(setProfilePicture(url));
    } catch (error) {
      alert(getErrorMessage(error, 'Failed to update profile picture'));
    } finally {
      setUploadingPicture(false);
      if (pictureInputRef.current) pictureInputRef.current.value = '';
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
    <div className="max-w-4xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground">Profile & KYC</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View your profile and KYC details. KYC updates are handled by the admin.
          </p>
        </div>

        <div className="relative shrink-0">
          <Avatar
            src={profile.profile_picture_url}
            name={profile.name}
            size={64}
            className="border-2 border-primary/30 text-lg"
          />
          <input
            ref={pictureInputRef}
            type="file"
            accept="image/png,image/jpeg"
            onChange={handlePictureChange}
            disabled={uploadingPicture}
            className="hidden"
            id="profile-picture-input"
          />
          <label
            htmlFor="profile-picture-input"
            className="absolute -bottom-1 -right-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border-2 border-card bg-primary text-white shadow-sm transition-colors hover:bg-primary/90"
            aria-label="Change profile photo"
          >
            {uploadingPicture ? <Loader2 size={12} className="animate-spin" /> : <Pencil size={12} />}
          </label>
        </div>
      </div>

      <section className="rounded-2xl border border-primary/15 bg-card p-6">
        <div className="mb-2 flex items-center gap-2">
          <UserCircle2 size={22} className="text-primary" />
          <h2 className="text-lg font-bold text-primary">Personal Information</h2>
        </div>
        <div className="divide-y divide-brand-border">
          <InfoRow icon={User} label="Full Name" value={profile.name} />
          <InfoRow icon={Mail} label="Email Address" value={profile.email} />
          <InfoRow icon={Phone} label="Phone Number" value={profile.phone || 'Not provided'} />
          <InfoRow icon={Calendar} label="Date of Joining" value={formatDate(profile.created_at)} />
        </div>
      </section>

      <section className="rounded-2xl border border-primary/15 bg-card p-6">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck size={22} className="text-primary" />
            <h2 className="text-lg font-bold text-primary">KYC Information</h2>
          </div>
          <Badge variant="brand">{profile.verified ? 'Verified' : 'Pending Verification'}</Badge>
        </div>

        {profile.verified ? (
          <>
            <div className="divide-y divide-brand-border">
              <InfoRow icon={CreditCard} label="PAN Number" value={profile.pan_masked || 'Not Submitted'} />
              <InfoRow icon={Landmark} label="Bank Account" value={profile.account_masked || 'Not Submitted'} />
              <InfoRow icon={IndianRupee} label="UPI ID" value={profile.upi_id || 'Not Submitted'} />
              <InfoRow
                icon={Calendar}
                label="Date of Birth"
                value={profile.date_of_birth ? formatDate(profile.date_of_birth) : 'Not Submitted'}
              />
            </div>
            <p className="mt-5 text-sm text-muted-foreground">
              Your KYC has been verified and can no longer be edited here. Contact support if any of these details
              need to change.
            </p>
          </>
        ) : (
          <form onSubmit={handleKycSubmit} className="mt-3 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <input
                required
                placeholder="PAN Number"
                className="rounded-lg border border-brand-border bg-background p-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                value={form.panNumber}
                onChange={(e) => setForm({ ...form, panNumber: e.target.value.toUpperCase() })}
              />
              <input
                required
                placeholder="Bank Name"
                className="rounded-lg border border-brand-border bg-background p-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                value={form.bankName}
                onChange={(e) => setForm({ ...form, bankName: e.target.value })}
              />
              <input
                required
                placeholder="Account Number"
                className="rounded-lg border border-brand-border bg-background p-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                value={form.accountNumber}
                onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
              />
              <input
                required
                placeholder="IFSC Code"
                className="rounded-lg border border-brand-border bg-background p-2.5 text-sm uppercase text-foreground focus:border-primary focus:outline-none"
                value={form.ifscCode}
                onChange={(e) => setForm({ ...form, ifscCode: e.target.value.toUpperCase() })}
              />
              <input
                required
                placeholder="UPI ID (e.g. name@bank)"
                className="rounded-lg border border-brand-border bg-background p-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                value={form.upiId}
                onChange={(e) => setForm({ ...form, upiId: e.target.value })}
              />
              <input
                required
                type="date"
                placeholder="Date of Birth"
                max={new Date().toISOString().slice(0, 10)}
                className="rounded-lg border border-brand-border bg-background p-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                value={form.dateOfBirth}
                onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
              />
            </div>
            {kycMessage && <p className="text-sm text-foreground">{kycMessage}</p>}
            <button
              type="submit"
              disabled={savingKyc}
              className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {savingKyc ? 'Saving...' : 'Save KYC Details'}
            </button>
          </form>
        )}
      </section>

      <section className="rounded-2xl border border-primary/15 bg-card p-6">
        <h2 className="mb-1 text-lg font-bold text-primary">Identity Document</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Upload a PAN card, Aadhaar, or bank statement as proof (PDF, JPG, or PNG, max 5MB).
        </p>

        {profile.document_url ? (
          <div className="mb-4 flex items-center gap-2">
            <CheckCircle2 size={18} className="text-primary" />
            <a
              href={profile.document_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              <FileText size={16} /> View uploaded document
            </a>
          </div>
        ) : (
          <p className="mb-4 text-sm text-muted-foreground">No document uploaded yet.</p>
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
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
        >
          <UploadCloud size={16} />
          {uploading ? 'Uploading...' : profile.document_url ? 'Replace Document' : 'Upload Document'}
        </label>
        {uploadError && <p className="mt-2 text-sm text-red-600">{uploadError}</p>}
      </section>
    </div>
  );
}
