'use client';

import { useEffect, useState } from 'react';

function sanitize(input: string, allowDecimals: boolean, allowNegative: boolean): string {
  const negative = allowNegative && input.trim().startsWith('-');
  let raw = input.replace(allowDecimals ? /[^0-9.]/g : /[^0-9]/g, '');
  if (allowDecimals) {
    const firstDot = raw.indexOf('.');
    if (firstDot !== -1) raw = raw.slice(0, firstDot + 1) + raw.slice(firstDot + 1).replace(/\./g, '');
  }
  return negative && raw !== '' ? `-${raw}` : raw;
}

function formatIndian(raw: string): string {
  if (!raw || raw === '.' || raw === '-' || raw === '-.') return raw;
  const negative = raw.startsWith('-');
  const unsigned = negative ? raw.slice(1) : raw;
  const [intPart, decPart] = unsigned.split('.');
  const formattedInt = intPart ? Number(intPart).toLocaleString('en-IN') : '';
  const formatted = decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt;
  return negative ? `-${formatted}` : formatted;
}

interface CurrencyInputProps {
  value: number | '';
  onChange: (value: number | '') => void;
  className?: string;
  placeholder?: string;
  required?: boolean;
  id?: string;
  allowDecimals?: boolean;
  allowNegative?: boolean;
}

// Plain-number-in, comma-grouped-display-out amount field (e.g. 1234567 -> 12,34,567).
// The value passed to onChange is always a raw number (or '' while the field is empty)
// — only the on-screen text carries the Indian-style thousands separators.
export function CurrencyInput({ value, onChange, className, placeholder, required, id, allowDecimals = true, allowNegative = false }: CurrencyInputProps) {
  const [display, setDisplay] = useState(value === '' ? '' : formatIndian(String(value)));

  useEffect(() => {
    const currentRaw = sanitize(display, allowDecimals, allowNegative);
    const currentNumeric = currentRaw === '' || currentRaw === '.' || currentRaw === '-' || currentRaw === '-.' ? '' : parseFloat(currentRaw);
    if (currentNumeric !== value) {
      setDisplay(value === '' ? '' : formatIndian(String(value)));
    }
    // Only re-sync when the externally-controlled value changes, not on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = sanitize(e.target.value, allowDecimals, allowNegative);
    setDisplay(formatIndian(raw));
    if (raw === '' || raw === '.' || raw === '-' || raw === '-.') {
      onChange('');
    } else {
      const num = parseFloat(raw);
      onChange(Number.isNaN(num) ? '' : num);
    }
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      id={id}
      required={required}
      placeholder={placeholder}
      value={display}
      onChange={handleChange}
      className={className}
    />
  );
}
