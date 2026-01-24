import { z } from 'zod';

// US phone format: (XXX) XXX-XXXX
const US_PHONE_REGEX = /^\(\d{3}\) \d{3}-\d{4}$/;

/**
 * Zod schema for optional US phone number
 * Accepts: empty string, or properly formatted (XXX) XXX-XXXX
 */
export const usPhoneSchema = z.union([
  z.string().regex(US_PHONE_REGEX, 'Telefone deve estar no formato (XXX) XXX-XXXX'),
  z.literal(''),
]).optional();

/**
 * Zod schema for required US phone number
 */
export const usPhoneRequiredSchema = z.string().regex(
  US_PHONE_REGEX,
  'Telefone deve estar no formato (XXX) XXX-XXXX'
);
