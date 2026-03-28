'use client';

import { Input } from '@/app/(components)/ui/input';
import { forwardRef } from 'react';

interface CurrencyInputProps {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, placeholder = '$0', className = '', disabled = false }, ref) => {
    const formatCurrency = (num: number | undefined): string => {
      if (num === undefined || num === null || isNaN(num)) return '';
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(num);
    };

    const parseCurrency = (str: string): number | undefined => {
      const cleaned = str.replace(/[^0-9.-]/g, '');
      if (cleaned === '' || cleaned === '-') return undefined;
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? undefined : parsed;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const parsed = parseCurrency(e.target.value);
      onChange(parsed);
    };

    const displayValue = value !== undefined ? formatCurrency(value) : '';

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={`${className} font-semibold text-slate-900 border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/20`}
        disabled={disabled}
      />
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';

export default CurrencyInput;
