'use client';

import { useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { UploadCloud } from 'lucide-react';

import api from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/ui/Avatar';
import { setProfilePicture } from '@/store/authSlice';
import type { AppDispatch } from '@/store/store';

const ROLE_LABELS: Record<string, string> = {
  investment_head: 'Investment Head',
  business_head: 'Business Head',
};

export function BoardSettingsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useAuth();
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const pictureInputRef = useRef<HTMLInputElement>(null);

  const displayName = user?.name || 'Business Head';

  const handlePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPicture(true);
    try {
      const formData = new FormData();
      formData.append('picture', file);
      const res = await api.patch('/auth/me/profile-picture', formData);
      dispatch(setProfilePicture(res.data.data.profilePictureUrl as string));
    } catch (error) {
      alert(getErrorMessage(error, 'Failed to update profile picture'));
    } finally {
      setUploadingPicture(false);
      if (pictureInputRef.current) pictureInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your account profile.</p>
      </div>

      <div className="rounded-2xl border border-brand-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Profile Picture</h2>
        <div className="flex items-center gap-4">
          <Avatar src={user?.profilePictureUrl} name={displayName} size={64} className="border-2 border-primary/30 text-lg" />
          <div>
            <input
              ref={pictureInputRef}
              type="file"
              accept="image/png,image/jpeg"
              onChange={handlePictureChange}
              disabled={uploadingPicture}
              className="hidden"
              id="board-profile-picture-input"
            />
            <label
              htmlFor="board-profile-picture-input"
              className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-brand-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
            >
              <UploadCloud size={14} />
              {uploadingPicture ? 'Uploading...' : 'Change photo'}
            </label>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-brand-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Account Details</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Full Name</p>
            <p className="font-medium text-foreground">{displayName}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium text-foreground">{user?.email || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Role</p>
            <p className="font-medium text-foreground">{(user?.role && ROLE_LABELS[user.role]) || '—'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
