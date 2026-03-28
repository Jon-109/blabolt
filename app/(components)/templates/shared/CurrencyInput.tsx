'use client';

import { useEffect, useState, type Ref } from 'react';
import { Input } from '@/app/(components)/ui/input';
import { cn } from '@/lib/utils';

type CurrencyInputProps = {
  value?: number | null;
  onValueChange: (value: number | undefined) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  name?: string;
  compact?: boolean;
  allowDecimal?: boolean;
  maxDecimals?: number;
  min?: number;
  withDollarPrefix?: boolean;
  inputRef?: Ref<HTMLInputElement>;
  readOnly?: boolean;
  disabled?: boolean;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
};

function sanitizeNumericInput(value: string, allowDecimal: boolean, maxDecimals: number): string {
  const cleaned = value.replace(/[^0-9.]/g, '');
  if (!allowDecimal) return cleaned.replace(/\./g, '');

  const firstDot = cleaned.indexOf('.');
  if (firstDot === -1) return cleaned;

  const integerPart = cleaned.slice(0, firstDot);
  const decimalRaw = cleaned.slice(firstDot + 1).replace(/\./g, '');
  const decimalPart = decimalRaw.slice(0, Math.max(0, maxDecimals));
  return `${integerPart}.${decimalPart}`;
}

function formatWithCommas(raw: string, allowDecimal: boolean): string {
  if (!raw) return '';

  if (!allowDecimal) {
    return raw.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  const hasDot = raw.includes('.');
  const [intPart = '', decPart = ''] = raw.split('.');
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  if (!hasDot) return formattedInt;
  return `${formattedInt}.${decPart}`;
}

function parseFormattedValue(value: string): number | undefined {
  const normalized = value.replace(/,/g, '');
  if (!normalized || normalized === '.') return undefined;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export default function CurrencyInput({
  value,
  onValueChange,
  placeholder = 'Enter 0 if none',
  className,
  id,
  name,
  compact = false,
  allowDecimal = true,
  maxDecimals = 2,
  min = 0,
  withDollarPrefix = false,
  inputRef,
  readOnly = false,
  disabled = false,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedBy,
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    if (value === null || value === undefined || !Number.isFinite(value)) {
      setDisplayValue('');
      return;
    }

    const numericString = allowDecimal
      ? String(value)
      : String(Math.floor(Math.max(min, value)));
    setDisplayValue(formatWithCommas(numericString, allowDecimal));
  }, [allowDecimal, min, value]);

  const input = (
    <Input
      id={id}
      name={name}
      type="text"
      inputMode={allowDecimal ? 'decimal' : 'numeric'}
      value={displayValue}
      placeholder={placeholder}
      aria-invalid={ariaInvalid}
      aria-describedby={ariaDescribedBy}
      readOnly={readOnly}
      disabled={disabled}
      className={cn(
        compact && !withDollarPrefix && 'w-[11rem] max-w-full',
        withDollarPrefix && 'pl-7',
        readOnly && 'cursor-default bg-slate-50 text-slate-900',
        className,
      )}
      ref={inputRef}
      onFocus={(event) => {
        const normalized = displayValue.replace(/,/g, '');
        if (normalized === '0' || normalized === '0.0' || normalized === '0.00') {
          event.currentTarget.select();
        }
      }}
      onChange={(event) => {
        if (readOnly || disabled) return;
        const sanitized = sanitizeNumericInput(event.target.value, allowDecimal, maxDecimals);
        const formatted = formatWithCommas(sanitized, allowDecimal);
        setDisplayValue(formatted);

        const parsed = parseFormattedValue(formatted);
        if (parsed === undefined) {
          onValueChange(undefined);
          return;
        }

        onValueChange(Math.max(min, allowDecimal ? parsed : Math.floor(parsed)));
      }}
    />
  );

  if (!withDollarPrefix) {
    return input;
  }

  return (
    <div className={cn('relative w-full', compact && 'w-[11rem] max-w-full')}>
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">$</span>
      {input}
    </div>
  );
}
