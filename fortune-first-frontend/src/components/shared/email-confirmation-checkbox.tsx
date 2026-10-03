'use client';

import { useId } from 'react';
import { Mail } from 'lucide-react';

interface EmailConfirmationCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** One line under the label saying exactly which email(s) the customer will get. */
  description: string;
  disabled?: boolean;
}

// Opt-in "Send email confirmation" used by the investment, withdrawal and
// payout forms — the customer is only emailed when this is ticked.
export function EmailConfirmationCheckbox({ checked, onChange, description, disabled }: EmailConfirmationCheckboxProps) {
  const id = useId();
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-3 rounded-lg border border-brand-border p-3 transition-colors hover:bg-muted has-[:checked]:border-primary/40 has-[:checked]:bg-primary/5"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-primary"
      />
      <span className="min-w-0">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <Mail size={14} className="text-primary" aria-hidden="true" />
          Send email confirmation
        </span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
      </span>
    </label>
  );
}
