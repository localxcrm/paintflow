/**
 * Format a phone number to US format (XXX) XXX-XXXX
 * Handles various input formats: raw digits, partial formatting, etc.
 */
export function formatPhoneUS(phone: string | null | undefined): string {
  if (!phone) return '';

  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');

  // If we have exactly 10 digits, format to US format
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  // Return original if can't format (partial input, etc)
  return phone;
}

/**
 * Strip formatting from phone number (returns digits only)
 */
export function unformatPhone(phone: string): string {
  return phone.replace(/\D/g, '');
}
