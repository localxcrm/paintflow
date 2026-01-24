'use client';

import { Input } from '@/components/ui/input';
import { forwardRef, useCallback } from 'react';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}

/**
 * Format phone number to US format (XXX) XXX-XXXX
 * Handles partial input and maintains cursor position
 */
function formatPhoneValue(input: string): string {
  // Remove all non-digits
  const digits = input.replace(/\D/g, '');

  // Limit to 10 digits
  const limited = digits.slice(0, 10);

  // Format based on length
  if (limited.length === 0) return '';
  if (limited.length <= 3) return `(${limited}`;
  if (limited.length <= 6) return `(${limited.slice(0, 3)}) ${limited.slice(3)}`;
  return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`;
}

/**
 * Masked phone input for US format (XXX) XXX-XXXX
 * Custom implementation compatible with React 19 (no findDOMNode)
 */
export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, onBlur, placeholder = '(555) 123-4567', disabled, id, className }, ref) => {
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatPhoneValue(e.target.value);
      onChange(formatted);
    }, [onChange]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow: backspace, delete, tab, escape, enter, arrows
      const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
      if (allowedKeys.includes(e.key)) return;

      // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
      if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) return;

      // Block non-numeric input
      if (!/^\d$/.test(e.key)) {
        e.preventDefault();
      }
    }, []);

    return (
      <Input
        ref={ref}
        id={id}
        type="tel"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
      />
    );
  }
);

PhoneInput.displayName = 'PhoneInput';
