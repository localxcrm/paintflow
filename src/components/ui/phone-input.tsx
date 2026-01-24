'use client';

import InputMask from 'react-input-mask';
import { Input } from '@/components/ui/input';
import { forwardRef } from 'react';

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
 * Masked phone input for US format (XXX) XXX-XXXX
 * Uses react-input-mask (same pattern as SSN in employee-form.tsx)
 */
export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, onBlur, placeholder = '(555) 123-4567', disabled, id, className }, ref) => {
    return (
      <InputMask
        mask="(999) 999-9999"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        disabled={disabled}
      >
        {/* @ts-ignore - InputMask types are incorrect for children render prop */}
        {(inputProps: any) => (
          <Input
            {...inputProps}
            ref={ref}
            id={id}
            type="tel"
            placeholder={placeholder}
            className={className}
          />
        )}
      </InputMask>
    );
  }
);

PhoneInput.displayName = 'PhoneInput';
