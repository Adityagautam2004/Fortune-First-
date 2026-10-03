'use client';

import { useState } from 'react';
import { Eye, EyeOff, type LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

// Building blocks for the auth pages rendered inside AuthShell (forgot /
// reset / change password), styled to match LoginForm exactly.

export const AUTH_INPUT_CLASS =
  'w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-foreground placeholder-muted-foreground transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-orange-200 dark:focus:ring-primary/30';

export function AuthHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-5 text-center">
      <h1 className="text-2xl font-extrabold text-foreground">{title}</h1>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{subtitle}</p>
    </div>
  );
}

export function AuthAlert({ tone, children }: { tone: 'error' | 'info'; children: React.ReactNode }) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'mb-4 rounded-md border p-3 text-xs',
        tone === 'error'
          ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-400'
          : 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-400'
      )}
    >
      {children}
    </div>
  );
}

interface AuthFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  hint?: string;
}

export function AuthField({ id, label, hint, className, ...props }: AuthFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-medium text-foreground">
        {label}
      </label>
      <input id={id} className={cn(AUTH_INPUT_CLASS, className)} {...props} />
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** Password input with the same show/hide toggle as the login form. */
export function AuthPasswordField({ id, label, hint, ...props }: Omit<AuthFieldProps, 'type'>) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-medium text-foreground">
        {label}
      </label>
      <div className="relative">
        <input id={id} type={visible ? 'text' : 'password'} className={cn(AUTH_INPUT_CLASS, 'pr-10')} {...props} />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function AuthSubmitButton({ isLoading, children }: { isLoading: boolean; children: React.ReactNode }) {
  return (
    <Button
      type="submit"
      isLoading={isLoading}
      className="w-full justify-center rounded-xl border border-transparent bg-primary px-4 py-3 text-sm font-bold uppercase tracking-widest text-white transition-colors hover:bg-[#ea580c] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
    >
      {children}
    </Button>
  );
}

/** Centered confirmation state (e.g. "Check your inbox", "Password updated"). */
export function AuthStatus({
  icon: Icon,
  tone,
  title,
  children,
}: {
  icon: LucideIcon;
  tone: 'success' | 'error';
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="text-center" role="status" aria-live="polite">
      <div
        className={cn(
          'mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full',
          tone === 'success'
            ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400'
            : 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400'
        )}
      >
        <Icon size={26} aria-hidden="true" />
      </div>
      <h1 className="text-xl font-extrabold text-foreground">{title}</h1>
      <div className="mt-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </div>
  );
}

export const AUTH_LINK_CLASS = 'font-medium text-primary hover:text-[#ea580c]';
